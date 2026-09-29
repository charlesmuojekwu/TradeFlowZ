import { NextRequest, NextResponse } from "next/server";

import { getServerEnv } from "@/config";
import { createPkceChallenge, generateOAuthState, generatePkceVerifier } from "@/lib/auth";
import { normalizeReturnPath, oauthReturnToCookie, oauthStateCookie, oauthVerifierCookie } from "@/lib/auth/session";

const pkceCookieMaxAge = 10 * 60;

export async function GET(request: NextRequest) {
  const env = getServerEnv();

  if (!env.DERIV_CLIENT_ID) {
    return NextResponse.json({ error: "DERIV_CLIENT_ID is not configured." }, { status: 500 });
  }

  const verifier = generatePkceVerifier();
  const challenge = createPkceChallenge(verifier);
  const state = generateOAuthState();
  const requestUrl = new URL(request.url);
  const redirectUri = env.DERIV_REDIRECT_URI ?? new URL("/auth/callback", request.url).toString();
  const returnTo = normalizeReturnPath(requestUrl.searchParams.get("returnTo"));
  const shouldRegister =
    requestUrl.searchParams.get("prompt") === "registration" ||
    requestUrl.searchParams.get("intent") === "register";
  const authUrl = new URL("/oauth2/auth", env.DERIV_AUTH_BASE_URL);

  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", env.DERIV_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", env.DERIV_OAUTH_SCOPES);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  if (shouldRegister) {
    authUrl.searchParams.set("prompt", "registration");
  }

  const response = NextResponse.redirect(authUrl);
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set(oauthStateCookie, state, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: pkceCookieMaxAge,
  });
  response.cookies.set(oauthVerifierCookie, verifier, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: pkceCookieMaxAge,
  });
  response.cookies.set(oauthReturnToCookie, returnTo, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: pkceCookieMaxAge,
  });

  return response;
}
