import { NextRequest, NextResponse } from "next/server";

import { oauthStateCookie, oauthVerifierCookie, sessionCookie } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(sessionCookie);
  response.cookies.delete(oauthStateCookie);
  response.cookies.delete(oauthVerifierCookie);
  return response;
}

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/trade", request.url));
  response.cookies.delete(sessionCookie);
  response.cookies.delete(oauthStateCookie);
  response.cookies.delete(oauthVerifierCookie);
  return response;
}
