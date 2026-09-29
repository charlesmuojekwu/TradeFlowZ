import type { AccountProvider, BalanceHandler } from "@/providers/interfaces";
import type { TradingAccount, Unsubscribe } from "@/types";

import { mockAccounts } from "./mock-data";

export class MockAccountProvider implements AccountProvider {
  async getSession(): Promise<{ isAuthenticated: boolean }> {
    return { isAuthenticated: true };
  }

  async getAccounts(): Promise<TradingAccount[]> {
    return mockAccounts;
  }

  async subscribeToBalance(accountId: string, onBalance: BalanceHandler): Promise<Unsubscribe> {
    const account = mockAccounts.find((item) => item.id === accountId);

    if (account) {
      onBalance({
        id: account.id,
        balance: account.balance,
        currency: account.currency,
      });
    }

    return () => undefined;
  }
}
