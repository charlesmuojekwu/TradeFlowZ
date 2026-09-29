import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/auth/callback/route";

function callbackRequest(returnTo = "/trade") {
  return new NextRequest("http://localhost:3000/auth/callback?code=auth-code&state=state-123", {
    headers: {
      cookie: [
        "deriv_oauth_state=state-123",
        "deriv_pkce_verifier=verifier-123",
        `deriv_oauth_return_to=${encodeURIComponent(returnTo)}`,
      ].join("; "),
    },
  });
}

describe("/auth/callback OAuth handling", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("exchanges the authorization code server-side and redirects to the safe return path", async () => {
    vi.stubEnv("DERIV_CLIENT_ID", "12345");
    vi.stubEnv("DERIV_AUTH_BASE_URL", "https://auth.deriv.com");
    vi.stubEnv("DERIV_SESSION_SECRET", "0123456789abcdef0123456789abcdef");
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "secret-access-token",
        token_type: "Bearer",
        expires_in: 3600,
      }),
    } as Response);

    const response = await GET(callbackRequest("/positions"));

    expect(globalThis.fetch).toHaveBeenCalledWith(new URL("https://auth.deriv.com/oauth2/token"), expect.any(Object));
    expect(response.headers.get("location")).toBe("http://localhost:3000/positions");
    expect(response.headers.get("set-cookie")).not.toContain("secret-access-token");
  });

  it("falls back to /trade for unsafe return paths", async () => {
    vi.stubEnv("DERIV_CLIENT_ID", "12345");
    vi.stubEnv("DERIV_AUTH_BASE_URL", "https://auth.deriv.com");
    vi.stubEnv("DERIV_SESSION_SECRET", "0123456789abcdef0123456789abcdef");
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "secret-access-token",
        token_type: "Bearer",
        expires_in: 3600,
      }),
    } as Response);

    const response = await GET(callbackRequest("https://evil.test/trade"));

    expect(response.headers.get("location")).toBe("http://localhost:3000/trade");
  });

  it("rejects invalid OAuth state and redirects to the public page", async () => {
    const response = await GET(
      new NextRequest("http://localhost:3000/auth/callback?code=auth-code&state=wrong", {
        headers: {
          cookie: "deriv_oauth_state=state-123; deriv_pkce_verifier=verifier-123",
        },
      }),
    );

    expect(response.headers.get("location")).toBe("http://localhost:3000/?auth=state");
  });

  it("reports missing session configuration before attempting token exchange", async () => {
    vi.stubEnv("DERIV_CLIENT_ID", "12345");
    vi.stubEnv("DERIV_AUTH_BASE_URL", "https://auth.deriv.com");
    vi.stubEnv("DERIV_SESSION_SECRET", "too-short");
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const response = await GET(callbackRequest("/trade"));

    expect(response.headers.get("location")).toBe("http://localhost:3000/?auth=session");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
