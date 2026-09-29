import type { AppError } from "@/lib/errors";
import type { AccountSession, TradingAccount, Unsubscribe } from "@/types";

export type BalanceUpdate = Pick<TradingAccount, "id" | "balance" | "currency">;
export type BalanceHandler = (balance: BalanceUpdate) => void;
export type AccountErrorHandler = (error: AppError) => void;

export interface AccountProvider {
  getSession(): Promise<AccountSession>;
  getAccounts(): Promise<TradingAccount[]>;
  subscribeToBalance(
    accountId: string,
    onBalance: BalanceHandler,
    onError?: AccountErrorHandler,
  ): Promise<Unsubscribe>;
}
