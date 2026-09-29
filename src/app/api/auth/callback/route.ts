import { NextRequest, NextResponse } from "next/server";

import { getServerEnv } from "@/config";
import {
  encryptSession,
  getSessionSecret,
  normalizeReturnPath,
  oauthReturnToCookie,
  oauthStateCookie,
  oauthVerifierCookie,
  safeCompare,
  sessionCookie,
} from "@/lib/auth";

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
};

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const error = requestUrl.searchParams.get("error");

  if (error) {
    return redirectWithStatus(request, "error");
  }

  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const expectedState = request.cookies.get(oauthStateCookie)?.value;
  const verifier = request.cookies.get(oauthVerifierCookie)?.value;
  const returnTo = normalizeReturnPath(request.cookies.get(oauthReturnToCookie)?.value);

  if (!code || !state || !expectedState || !verifier || !safeCompare(state, expectedState)) {
    return redirectWithStatus(request, "state");
  }

  const env = getServerEnv();

  if (!env.DERIV_CLIENT_ID) {
    return redirectWithStatus(request, "config");
  }

  try {
    const redirectUri = env.DERIV_REDIRECT_URI ?? new URL("/auth/callback", request.url).toString();
    const tokenResponse = await exchangeCodeForToken({
      authBaseUrl: env.DERIV_AUTH_BASE_URL,
      clientId: env.DERIV_CLIENT_ID,
      code,
      codeVerifier: verifier,
      redirectUri,
    });

    if (!tokenResponse.access_token || tokenResponse.token_type !== "Bearer") {
      return redirectWithStatus(request, "token");
    }

    const expiresAt = Date.now() + Math.max(1, tokenResponse.expires_in ?? 3600) * 1000;
    const encrypted = encryptSession(
      {
        accessToken: tokenResponse.access_token,
        tokenType: "Bearer",
        expiresAt,
      },
      getSessionSecret(),
    );
    const response = redirectWithStatus(request, "success", returnTo);
    const secure = process.env.NODE_ENV === "production";

    response.cookies.delete(oauthStateCookie);
    response.cookies.delete(oauthVerifierCookie);
    response.cookies.delete(oauthReturnToCookie);
    response.cookies.set(sessionCookie, encrypted, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: Math.max(1, Math.floor((expiresAt - Date.now()) / 1000)),
    });

    return response;
  } catch {
    return redirectWithStatus(request, "token");
  }
}

async function exchangeCodeForToken({
  authBaseUrl,
  clientId,
  code,
  codeVerifier,
  redirectUri,
}: {
  authBaseUrl: string;
  clientId: string;
  code: string;
  codeVerifier: string;
  redirectUri: string;
}) {
  const response = await fetch(new URL("/oauth2/token", authBaseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Deriv token exchange failed.");
  }

  return (await response.json()) as TokenResponse;
}

function redirectWithStatus(request: NextRequest, status: string, returnTo = "/") {
  const redirectUrl = new URL(status === "success" ? normalizeReturnPath(returnTo) : "/", request.url);
  if (status !== "success") {
    redirectUrl.searchParams.set("auth", status);
  }
  return NextResponse.redirect(redirectUrl);
}
