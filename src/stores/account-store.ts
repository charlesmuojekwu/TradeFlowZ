import { create } from "zustand";

import type { ConnectionStatus, TradingAccount } from "@/types";

export type BalanceStatus = "idle" | "loading" | "live" | "stale" | "error";

type AccountState = {
  accounts: TradingAccount[];
  selectedAccountId?: string;
  balance?: TradingAccount["balance"];
  balanceCurrency?: TradingAccount["currency"];
  balanceStatus: BalanceStatus;
  authenticatedConnectionStatus: ConnectionStatus;
  authenticatedConnectionError?: string;
  setAccounts: (accounts: TradingAccount[]) => void;
  selectAccount: (accountId: string) => void;
  setBalance: (balance: TradingAccount["balance"], currency?: TradingAccount["currency"]) => void;
  setBalanceStatus: (status: BalanceStatus) => void;
  setAuthenticatedConnectionStatus: (status: ConnectionStatus, error?: string) => void;
  reset: () => void;
};

export const useAccountStore = create<AccountState>((set) => ({
  accounts: [],
  balanceStatus: "idle",
  authenticatedConnectionStatus: "idle",
  setAccounts: (accounts) =>
    set((state) => {
      const selectedAccount = accounts.find((account) => account.id === state.selectedAccountId) ?? accounts[0];

      return {
        accounts,
        selectedAccountId: selectedAccount?.id,
        balance: state.balance ?? selectedAccount?.balance,
        balanceCurrency: state.balanceCurrency ?? selectedAccount?.currency,
      };
    }),
  selectAccount: (selectedAccountId) =>
    set((state) => {
      const account = state.accounts.find((item) => item.id === selectedAccountId);

      return {
        selectedAccountId,
        balance: account?.balance,
        balanceCurrency: account?.currency,
        balanceStatus: account ? "stale" : "idle",
      };
    }),
  setBalance: (balance, balanceCurrency) =>
    set((state) => ({
      balance,
      balanceCurrency: balanceCurrency ?? state.balanceCurrency,
      balanceStatus: "live",
    })),
  setBalanceStatus: (balanceStatus) => set({ balanceStatus }),
  setAuthenticatedConnectionStatus: (authenticatedConnectionStatus, authenticatedConnectionError) =>
    set({ authenticatedConnectionStatus, authenticatedConnectionError }),
  reset: () =>
    set({
      accounts: [],
      selectedAccountId: undefined,
      balance: undefined,
      balanceCurrency: undefined,
      balanceStatus: "idle",
      authenticatedConnectionStatus: "idle",
      authenticatedConnectionError: undefined,
    }),
}));
