import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";

import type { TradingAccount } from "@/types";

export const oauthStateCookie = "deriv_oauth_state";
export const oauthVerifierCookie = "deriv_pkce_verifier";
export const oauthReturnToCookie = "deriv_oauth_return_to";
export const sessionCookie = "deriv_session";

const algorithm = "aes-256-gcm";

export type DerivSession = {
  accessToken: string;
  tokenType: "Bearer";
  expiresAt: number;
};

export type DerivSessionPayload = {
  isAuthenticated: boolean;
  expiresAt?: number;
  accounts: TradingAccount[];
};

export function getSessionSecret() {
  const secret = process.env.DERIV_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("DERIV_SESSION_SECRET must be set to at least 32 characters.");
  }

  return secret;
}

export function encryptSession(session: DerivSession, secret = getSessionSecret()) {
  const iv = randomBytes(12);
  const key = deriveKey(secret);
  const cipher = createCipheriv(algorithm, key, iv);
  const plaintext = Buffer.from(JSON.stringify(session), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, ciphertext]).toString("base64url");
}

export function decryptSession(value: string, secret = getSessionSecret()): DerivSession {
  const payload = Buffer.from(value, "base64url");
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const ciphertext = payload.subarray(28);
  const decipher = createDecipheriv(algorithm, deriveKey(secret), iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  const session = JSON.parse(plaintext) as DerivSession;

  if (!session.accessToken || session.tokenType !== "Bearer" || !session.expiresAt) {
    throw new Error("Invalid Deriv session payload.");
  }

  return session;
}

export function isSessionExpired(session: DerivSession) {
  return session.expiresAt <= Date.now();
}

export function isSafeReturnPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return false;
  }

  try {
    const parsed = new URL(value, "https://trade.local");
    return parsed.origin === "https://trade.local" && safeReturnPaths.has(parsed.pathname);
  } catch {
    return false;
  }
}

export function normalizeReturnPath(value: string | null | undefined, fallback = "/trade"): string {
  return isSafeReturnPath(value) && value ? value : fallback;
}

export function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function deriveKey(secret: string) {
  return createHash("sha256").update(secret).digest();
}

const safeReturnPaths = new Set([
  "/dashboard",
  "/trade",
  "/automation",
  "/copy",
  "/strategies",
  "/strategies/lab",
  "/contracts",
  "/contracts/rise-fall",
  "/contracts/digits",
  "/contracts/accumulators",
  "/contracts/multipliers",
  "/positions",
  "/history",
  "/analytics",
]);
