import { AppError } from "@/lib/errors";
import type { AccountProvider, BalanceHandler } from "@/providers/interfaces";
import type { AccountSession, TradingAccount, Unsubscribe } from "@/types";

type SessionResponse = AccountSession & {
  accounts?: TradingAccount[];
};

export class DerivAccountProvider implements AccountProvider {
  async getSession(): Promise<AccountSession> {
    const session = await this.fetchSession();
    return {
      isAuthenticated: session.isAuthenticated,
      expiresAt: session.expiresAt,
      subject: session.subject,
    };
  }

  async getAccounts(): Promise<TradingAccount[]> {
    const session = await this.fetchSession();
    return session.accounts ?? [];
  }

  async subscribeToBalance(accountId: string, onBalance: BalanceHandler): Promise<Unsubscribe> {
    const session = await this.fetchSession();
    const account = session.accounts?.find((item) => item.id === accountId);

    if (account) {
      onBalance({
        id: account.id,
        balance: account.balance,
        currency: account.currency,
      });
    }

    return () => undefined;
  }

  private async fetchSession() {
    const response = await fetch("/api/auth/session", {
      cache: "no-store",
      credentials: "include",
    });

    if (response.status === 401) {
      return { isAuthenticated: false, accounts: [] };
    }

    if (!response.ok) {
      throw new AppError({
        code: "SESSION_EXPIRED",
        title: "Session unavailable",
        message: "Unable to load your Deriv session.",
        retryable: true,
      });
    }

    return (await response.json()) as SessionResponse;
  }
}
