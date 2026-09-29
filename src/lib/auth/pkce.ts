import { createHash, randomBytes } from "node:crypto";

const pkceAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

export function generatePkceVerifier(length = 64) {
  const bytes = randomBytes(length);

  return Array.from(bytes, (byte) => pkceAlphabet[byte % pkceAlphabet.length]).join("");
}

export function generateOAuthState() {
  return randomBytes(24).toString("base64url");
}

export function createPkceChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}
