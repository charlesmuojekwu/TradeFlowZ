import { beforeEach, describe, expect, it } from "vitest";

import { useAccountStore } from "@/stores/account-store";
import type { TradingAccount } from "@/types";

const demoAccount: TradingAccount = {
  id: "CR90000001",
  type: "demo",
  currency: "USD",
  status: "active",
  balance: "10000.00",
};

const realAccount: TradingAccount = {
  id: "CR10000001",
  type: "real",
  currency: "EUR",
  status: "active",
  balance: "250.50",
};

describe("accountStore", () => {
  beforeEach(() => {
    useAccountStore.getState().reset();
  });

  it("selects the first account and preserves explicit live balance updates", () => {
    useAccountStore.getState().setAccounts([demoAccount, realAccount]);

    expect(useAccountStore.getState()).toMatchObject({
      selectedAccountId: "CR90000001",
      balance: "10000.00",
      balanceCurrency: "USD",
    });

    useAccountStore.getState().setBalance("10012.34", "USD");
    expect(useAccountStore.getState()).toMatchObject({
      balance: "10012.34",
      balanceCurrency: "USD",
      balanceStatus: "live",
    });

    useAccountStore.getState().setAccounts([demoAccount, realAccount]);
    expect(useAccountStore.getState()).toMatchObject({
      selectedAccountId: "CR90000001",
      balance: "10012.34",
    });
  });

  it("marks balance stale when switching accounts and clears account state on reset", () => {
    useAccountStore.getState().setAccounts([demoAccount, realAccount]);
    useAccountStore.getState().selectAccount("CR10000001");

    expect(useAccountStore.getState()).toMatchObject({
      selectedAccountId: "CR10000001",
      balance: "250.50",
      balanceCurrency: "EUR",
      balanceStatus: "stale",
    });

    useAccountStore.getState().setAuthenticatedConnectionStatus("reconnecting", "Connection interrupted");
    useAccountStore.getState().reset();

    expect(useAccountStore.getState()).toMatchObject({
      accounts: [],
      selectedAccountId: undefined,
      balance: undefined,
      balanceCurrency: undefined,
      balanceStatus: "idle",
      authenticatedConnectionStatus: "idle",
      authenticatedConnectionError: undefined,
    });
  });
});
