import { describe, expect, it } from "vitest";

import { createPkceChallenge, generateOAuthState, generatePkceVerifier } from "@/lib/auth";

describe("PKCE utilities", () => {
  it("generates verifier/state values suitable for OAuth PKCE", () => {
    const verifier = generatePkceVerifier();
    const state = generateOAuthState();

    expect(verifier).toHaveLength(64);
    expect(verifier).toMatch(/^[A-Za-z0-9._~-]+$/);
    expect(state.length).toBeGreaterThan(20);
  });

  it("creates the documented S256 challenge", () => {
    expect(createPkceChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe(
      "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    );
  });
});
