import { describe, expect, it } from "vitest";

import { decryptSession, encryptSession, isSafeReturnPath, isSessionExpired, normalizeReturnPath, safeCompare } from "@/lib/auth";

const secret = "0123456789abcdef0123456789abcdef";

describe("session utilities", () => {
  it("encrypts and decrypts OAuth session payloads", () => {
    const session = {
      accessToken: "ory_at_secret",
      tokenType: "Bearer" as const,
      expiresAt: Date.now() + 60_000,
    };

    const encrypted = encryptSession(session, secret);

    expect(encrypted).not.toContain(session.accessToken);
    expect(decryptSession(encrypted, secret)).toEqual(session);
  });

  it("detects expiry and compares state safely", () => {
    expect(isSessionExpired({ accessToken: "token", tokenType: "Bearer", expiresAt: Date.now() - 1 })).toBe(true);
    expect(safeCompare("state", "state")).toBe(true);
    expect(safeCompare("state", "other")).toBe(false);
  });

  it("allows only internal trading return paths", () => {
    expect(isSafeReturnPath("/trade")).toBe(true);
    expect(isSafeReturnPath("/positions?filter=open")).toBe(true);
    expect(isSafeReturnPath("/history")).toBe(true);
    expect(isSafeReturnPath("https://evil.test/trade")).toBe(false);
    expect(isSafeReturnPath("//evil.test/trade")).toBe(false);
    expect(isSafeReturnPath("/admin")).toBe(false);
    expect(normalizeReturnPath("https://evil.test/trade")).toBe("/trade");
  });
});
