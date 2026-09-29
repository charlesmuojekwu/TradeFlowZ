import type { AppError } from "@/lib/errors";
import type { TradingAccount, Unsubscribe } from "@/types";

export type BalanceUpdate = Pick<TradingAccount, "id" | "balance" | "currency">;
export type BalanceHandler = (balance: BalanceUpdate) => void;
export type AccountErrorHandler = (error: AppError) => void;

export interface AccountProvider {
  getSession(): Promise<{ isAuthenticated: boolean }>;
  getAccounts(): Promise<TradingAccount[]>;
  subscribeToBalance(
    accountId: string,
    onBalance: BalanceHandler,
    onError?: AccountErrorHandler,
  ): Promise<Unsubscribe>;
}
