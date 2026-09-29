"use client";

import { useEffect } from "react";

import { normalizeDerivBalance } from "@/deriv/mappers/balance-mapper";
import {
  disconnectAuthenticatedTradingClient,
  getAuthenticatedTradingClient,
} from "@/deriv/websocket/authenticated-trading-client-registry";
import { env } from "@/config";
import { providerBundle } from "@/providers";
import { useAccountStore, useAuthStore } from "@/stores";
import type { TradingAccount } from "@/types";

type UseAuthenticatedTradingConnectionOptions = {
  isAuthenticated: boolean;
  selectedAccount?: TradingAccount;
};

export function useAuthenticatedTradingConnection({
  isAuthenticated,
  selectedAccount,
}: UseAuthenticatedTradingConnectionOptions) {
  const setAuthenticatedConnectionStatus = useAccountStore((state) => state.setAuthenticatedConnectionStatus);
  const setBalance = useAccountStore((state) => state.setBalance);
  const setBalanceStatus = useAccountStore((state) => state.setBalanceStatus);
  const resetAccounts = useAccountStore((state) => state.reset);
  const resetAuth = useAuthStore((state) => state.reset);

  useEffect(() => {
    if (!isAuthenticated || !selectedAccount) {
      setAuthenticatedConnectionStatus("idle");
      setBalanceStatus("idle");
      return;
    }

    const account = selectedAccount;

    if (env.NEXT_PUBLIC_TRADING_PROVIDER !== "deriv") {
      let unsubscribe: (() => void) | undefined;
      setAuthenticatedConnectionStatus("connected");
      setBalanceStatus("loading");

      async function subscribeToMockBalance() {
        unsubscribe = await providerBundle.accountProvider.subscribeToBalance(account.id, (update) => {
          setBalance(update.balance, update.currency);
        });
      }

      void subscribeToMockBalance().catch((caught) => {
        setBalanceStatus("error");
        setAuthenticatedConnectionStatus(
          "disconnected",
          caught instanceof Error ? caught.message : "Unable to subscribe to balance.",
        );
      });

      return () => {
        unsubscribe?.();
        setBalanceStatus("stale");
      };
    }

    const client = getAuthenticatedTradingClient(account.id);
    client.setStatusHandler((status, error) => {
      setAuthenticatedConnectionStatus(status, error);

      if (status === "connected") {
        setBalanceStatus("loading");
        return;
      }

      if (status === "reconnecting" || status === "disconnected") {
        setBalanceStatus("stale");
      }
    });

    let unsubscribe: (() => Promise<void>) | undefined;

    async function connectAndSubscribe() {
      await client.connect();
      unsubscribe = await client.subscribe(
        `balance:${account.id}`,
        { balance: 1 },
        (message) => {
          const update = normalizeDerivBalance(message, account.id);

          if (!update) {
            return;
          }

          setBalance(update.balance, update.currency);
        },
        (error) => {
          setBalanceStatus("error");
          setAuthenticatedConnectionStatus("connected", error.message);
        },
      );
    }

    setBalanceStatus("loading");
    void connectAndSubscribe().catch((caught) => {
      const message = caught instanceof Error ? caught.message : "Unable to subscribe to account balance.";
      if (isSessionFailure(message)) {
        resetAuth();
        resetAccounts();
        return;
      }

      setBalanceStatus("error");
      setAuthenticatedConnectionStatus(
        "disconnected",
        message,
      );
    });

    return () => {
      void unsubscribe?.();
      client.setStatusHandler(undefined);
      disconnectAuthenticatedTradingClient(account.id);
      setBalanceStatus("stale");
    };
  }, [
    isAuthenticated,
    resetAccounts,
    resetAuth,
    selectedAccount,
    setAuthenticatedConnectionStatus,
    setBalance,
    setBalanceStatus,
  ]);
}

function isSessionFailure(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("session expired") || normalized.includes("not authenticated") || normalized.includes("unauthorized");
}
