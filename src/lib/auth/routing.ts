import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { decryptSession, isSessionExpired, normalizeReturnPath, sessionCookie } from "@/lib/auth/session";
import type { DerivSession } from "@/lib/auth/session";

export async function getCurrentSession(): Promise<DerivSession | undefined> {
  const cookieStore = await cookies();
  const encryptedSession = cookieStore.get(sessionCookie)?.value;

  if (!encryptedSession) {
    return undefined;
  }

  try {
    const session = decryptSession(encryptedSession);
    return isSessionExpired(session) ? undefined : session;
  } catch {
    return undefined;
  }
}

export async function requireAuthenticatedPage(returnTo: string) {
  const session = await getCurrentSession();

  if (!session) {
    redirect(`/?returnTo=${encodeURIComponent(normalizeReturnPath(returnTo))}`);
  }

  return session;
}
