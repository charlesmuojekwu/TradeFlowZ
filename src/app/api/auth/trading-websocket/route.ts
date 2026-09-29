import { NextRequest, NextResponse } from "next/server";

import { getServerEnv } from "@/config";
import { decryptSession, isSessionExpired, sessionCookie } from "@/lib/auth";

type OtpResponse = {
  data?: {
    url?: string;
    otp?: string;
  };
  errors?: Array<{ code?: string; message?: string }>;
};

export async function POST(request: NextRequest) {
  const encryptedSession = request.cookies.get(sessionCookie)?.value;

  if (!encryptedSession) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let accountId: string | undefined;

  try {
    const body = (await request.json()) as { accountId?: unknown };
    accountId = typeof body.accountId === "string" ? body.accountId : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!accountId) {
    return NextResponse.json({ error: "Account ID is required." }, { status: 400 });
  }

  try {
    const session = decryptSession(encryptedSession);

    if (isSessionExpired(session)) {
      const response = NextResponse.json({ error: "Session expired." }, { status: 401 });
      response.cookies.delete(sessionCookie);
      return response;
    }

    const env = getServerEnv();
    const otpResponse = await fetch(
      new URL(`/trading/v1/options/accounts/${encodeURIComponent(accountId)}/otp`, env.DERIV_API_BASE_URL),
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        cache: "no-store",
      },
    );
    const body = (await otpResponse.json()) as OtpResponse;

    if (!otpResponse.ok || !body.data?.url || !isSecureWebSocketUrl(body.data.url)) {
      const response = NextResponse.json(
        {
          error: body.errors?.[0]?.message ?? "Unable to authorize a secure trading WebSocket.",
        },
        { status: otpResponse.status },
      );

      if (otpResponse.status === 401) {
        response.cookies.delete(sessionCookie);
      }

      return response;
    }

    return NextResponse.json({
      url: body.data.url,
    });
  } catch {
    return NextResponse.json({ error: "Unable to authorize trading WebSocket." }, { status: 500 });
  }
}

function isSecureWebSocketUrl(value: string) {
  try {
    return new URL(value).protocol === "wss:";
  } catch {
    return false;
  }
}
