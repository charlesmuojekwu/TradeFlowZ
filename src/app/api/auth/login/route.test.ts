import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/auth/login/route";

describe("/api/auth/login", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("starts standard Deriv OAuth sign-in with fresh PKCE parameters", async () => {
    vi.stubEnv("DERIV_CLIENT_ID", "12345");
    vi.stubEnv("DERIV_AUTH_BASE_URL", "https://auth.deriv.com");

    const response = await GET(new NextRequest("http://localhost:3000/api/auth/login?returnTo=/positions"));
    const location = response.headers.get("location");

    expect(location).toBeTruthy();
    const authUrl = new URL(location ?? "");
    expect(authUrl.origin).toBe("https://auth.deriv.com");
    expect(authUrl.pathname).toBe("/oauth2/auth");
    expect(authUrl.searchParams.get("response_type")).toBe("code");
    expect(authUrl.searchParams.get("client_id")).toBe("12345");
    expect(authUrl.searchParams.get("code_challenge_method")).toBe("S256");
    expect(authUrl.searchParams.get("code_challenge")).toBeTruthy();
    expect(authUrl.searchParams.get("state")).toBeTruthy();
    expect(authUrl.searchParams.get("prompt")).toBeNull();
    expect(response.headers.get("set-cookie")).toContain("deriv_oauth_return_to=%2Fpositions");
  });

  it("starts Deriv registration OAuth with prompt=registration and blocks open redirects", async () => {
    vi.stubEnv("DERIV_CLIENT_ID", "12345");
    vi.stubEnv("DERIV_AUTH_BASE_URL", "https://auth.deriv.com");

    const response = await GET(
      new NextRequest("http://localhost:3000/api/auth/login?intent=register&returnTo=https://evil.test/x"),
    );
    const authUrl = new URL(response.headers.get("location") ?? "");

    expect(authUrl.searchParams.get("prompt")).toBe("registration");
    expect(response.headers.get("set-cookie")).toContain("deriv_oauth_return_to=%2Ftrade");
  });
});
