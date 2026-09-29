import { NextRequest, NextResponse } from "next/server";

import { getServerEnv } from "@/config";
import { decryptSession, isSessionExpired, normalizeDerivAccounts, sessionCookie } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const encryptedSession = request.cookies.get(sessionCookie)?.value;

  if (!encryptedSession) {
    return NextResponse.json({ isAuthenticated: false, accounts: [] });
  }

  try {
    const session = decryptSession(encryptedSession);

    if (isSessionExpired(session)) {
      const response = NextResponse.json({ isAuthenticated: false, accounts: [] }, { status: 401 });
      response.cookies.delete(sessionCookie);
      return response;
    }

    const env = getServerEnv();
    const accountsResponse = await fetch(new URL("/trading/v1/options/accounts", env.DERIV_API_BASE_URL), {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!accountsResponse.ok) {
      return NextResponse.json(
        { isAuthenticated: true, expiresAt: session.expiresAt, accounts: [] },
        { status: accountsResponse.status },
      );
    }

    const body = (await accountsResponse.json()) as { data?: unknown };

    return NextResponse.json({
      isAuthenticated: true,
      expiresAt: session.expiresAt,
      accounts: normalizeDerivAccounts(body.data),
    });
  } catch {
    const response = NextResponse.json({ isAuthenticated: false, accounts: [] }, { status: 401 });
    response.cookies.delete(sessionCookie);
    return response;
  }
}
