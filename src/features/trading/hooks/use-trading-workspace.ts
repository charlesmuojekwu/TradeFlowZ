"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useContractConfiguration } from "@/features/trading/hooks/use-contract-configuration";
import { createPositionFromBuy } from "@/features/trading/utils/create-position-from-buy";
import { AppError, toAppError } from "@/lib/errors";
import { providerBundle } from "@/providers";
import { useAccountStore, useAuthStore, useMarketStore, usePositionStore, useTradeStore, useUiStore } from "@/stores";
import type { Market, Position, ProposalRequest, TradingAccount, Unsubscribe } from "@/types";

const defaultFavoriteLimit = 3;
const proposalStaleAfterMs = 30_000;

export function useTradingWorkspace() {
  const [error, setError] = useState<AppError>();
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [recentSymbols, setRecentSymbols] = useState<string[]>([]);
  const [favoriteSymbols, setFavoriteSymbols] = useState<string[]>([]);
  const positionSubscriptionsRef = useRef(new Map<string, Unsubscribe>());
  const notifiedSettlementsRef = useRef(new Set<string>());
  const sellingContractsRef = useRef(new Set<string>());
  const { isAuthenticated, setAuthenticated } = useAuthStore();

  const {
    accounts,
    selectedAccountId,
    balance,
    balanceCurrency,
    balanceStatus,
    authenticatedConnectionStatus,
    authenticatedConnectionError,
    setAccounts,
    selectAccount,
  } = useAccountStore();
  const {
    markets,
    selectedSymbol,
    currentTick,
    connectionStatus,
    setMarkets,
    selectMarket,
    setConnectionStatus,
  } = useMarketStore();
  const {
    stake,
    duration,
    durationUnit,
    direction,
    currentProposal,
    proposalState,
    executionState,
    setStake,
    setDuration,
    setDurationUnit,
    setDirection,
    configureTrade,
    setProposal,
    setProposalState,
    setExecutionState,
  } = useTradeStore();
  const upsertPosition = usePositionStore((state) => state.upsertPosition);
  const settlePosition = usePositionStore((state) => state.settlePosition);
  const setOpenPositions = usePositionStore((state) => state.setOpenPositions);
  const showTradeResult = useUiStore((state) => state.showTradeResult);

  const selectedMarket = useMemo(
    () => markets.find((market) => market.symbol === selectedSymbol) ?? markets[0],
    [markets, selectedSymbol],
  );
  const {
    availability: contractAvailability,
    error: contractAvailabilityError,
    isLoading: isContractAvailabilityLoading,
  } = useContractConfiguration(selectedMarket);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) ?? accounts[0],
    [accounts, selectedAccountId],
  );

  const handleSettledPosition = useCallback(
    (position: Position) => {
      const status = position.status === "open" ? "unknown" : position.status;

      settlePosition(position);
      positionSubscriptionsRef.current.get(position.contractId)?.();
      positionSubscriptionsRef.current.delete(position.contractId);

      if (!notifiedSettlementsRef.current.has(position.contractId)) {
        notifiedSettlementsRef.current.add(position.contractId);
        showTradeResult({
          contractId: position.contractId,
          status,
          displaySymbol: position.displaySymbol,
          direction: position.direction,
          stake: position.stake,
          payout: position.payout,
          profit: position.profit,
          currency: position.currency,
        });
      }
    },
    [settlePosition, showTradeResult],
  );

  const subscribeToPositionUpdates = useCallback(
    async (accountId: string, position: Position) => {
      if (position.status !== "open") {
        handleSettledPosition(position);
        return;
      }

      positionSubscriptionsRef.current.get(position.contractId)?.();

      const unsubscribe = await providerBundle.tradingProvider.subscribeToPosition(
        accountId,
        position.contractId,
        (update) => {
          if (update.status === "open") {
            upsertPosition(update);
            return;
          }

          handleSettledPosition(update);
        },
        (caught) => {
          const appError = toAppError(caught);
          setError(appError);
          handleSettledPosition({
            ...position,
            status: "unknown",
            isSellable: false,
          });
        },
        position,
      );

      positionSubscriptionsRef.current.set(position.contractId, unsubscribe);
    },
    [handleSettledPosition, upsertPosition],
  );

  const clearPositionSubscriptions = useCallback(() => {
    positionSubscriptionsRef.current.forEach((unsubscribe) => unsubscribe());
    positionSubscriptionsRef.current.clear();
  }, []);

  useEffect(() => {
    if (!contractAvailability || !contractAvailability.isAvailable) {
      return;
    }

    const nextDirection = contractAvailability.directions.includes(direction)
      ? direction
      : contractAvailability.directions[0];
    const nextDurationUnit = contractAvailability.durationUnits.includes(durationUnit)
      ? durationUnit
      : contractAvailability.durationUnits[0];
    const constraint = contractAvailability.durationConstraints.find((item) => item.unit === nextDurationUnit);
    const nextDuration = clampDuration(duration, constraint?.min, constraint?.max);
    const nextStake = clampStake(stake, contractAvailability.minStake, contractAvailability.maxStake);

    if (
      nextDirection !== direction ||
      nextDurationUnit !== durationUnit ||
      nextDuration !== duration ||
      nextStake !== stake
    ) {
      configureTrade({
        direction: nextDirection,
        durationUnit: nextDurationUnit,
        duration: nextDuration,
        stake: nextStake,
      });
    }
  }, [configureTrade, contractAvailability, direction, duration, durationUnit, stake]);

  const proposalRequest = useMemo<ProposalRequest | undefined>(() => {
    if (!selectedMarket || !selectedAccount || !contractAvailability?.isAvailable) {
      return undefined;
    }

    if (
      !contractAvailability.directions.includes(direction) ||
      !contractAvailability.durationUnits.includes(durationUnit)
    ) {
      return undefined;
    }

    const constraint = contractAvailability.durationConstraints.find((item) => item.unit === durationUnit);
    const minStake = contractAvailability.minStake ? Number(contractAvailability.minStake) : undefined;
    const maxStake = contractAvailability.maxStake ? Number(contractAvailability.maxStake) : undefined;
    const numericStake = Number(stake);
    const isValidStake =
      Number.isFinite(numericStake) &&
      (minStake === undefined || numericStake >= minStake) &&
      (maxStake === undefined || numericStake <= maxStake);
    const isValidDuration =
      Number.isFinite(duration) &&
      duration > 0 &&
      (constraint?.min === undefined || duration >= constraint.min) &&
      (constraint?.max === undefined || duration <= constraint.max);

    if (!isValidStake || !isValidDuration) {
      return undefined;
    }

    return {
      accountId: selectedAccount.id,
      symbol: selectedMarket.symbol,
      direction,
      stake,
      currency: selectedAccount.currency,
      duration,
      durationUnit,
    };
  }, [contractAvailability, direction, duration, durationUnit, selectedAccount, selectedMarket, stake]);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      setIsBootstrapping(true);

      try {
        const [marketList, session, accountList] = await Promise.all([
          providerBundle.marketProvider.getMarkets(),
          providerBundle.accountProvider.getSession(),
          providerBundle.accountProvider.getAccounts(),
        ]);

        if (!isMounted) {
          return;
        }

        setMarkets(marketList);
        setAuthenticated(session.isAuthenticated);
        setAccounts(accountList);
        setConnectionStatus("connected");

      } catch (caught) {
        if (isMounted) {
          setError(toAppError(caught));
          setConnectionStatus("disconnected");
        }
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [setAccounts, setAuthenticated, setConnectionStatus, setMarkets]);

  useEffect(() => {
    return clearPositionSubscriptions;
  }, [clearPositionSubscriptions]);

  useEffect(() => {
    if (!isAuthenticated || !selectedAccount || authenticatedConnectionStatus !== "connected") {
      return;
    }

    let isCurrent = true;

    async function restoreOpenPositions() {
      try {
        clearPositionSubscriptions();
        const positions = await providerBundle.tradingProvider.getOpenPositions(selectedAccount.id);

        if (!isCurrent) {
          return;
        }

        const activePositions = positions.filter((position) => position.status === "open");
        setOpenPositions(activePositions);
        activePositions.forEach((position) => {
          void subscribeToPositionUpdates(selectedAccount.id, position);
        });
      } catch (caught) {
        if (isCurrent) {
          setError(toAppError(caught));
        }
      }
    }

    void restoreOpenPositions();

    return () => {
      isCurrent = false;
      clearPositionSubscriptions();
    };
  }, [
    authenticatedConnectionStatus,
    clearPositionSubscriptions,
    isAuthenticated,
    selectedAccount,
    setOpenPositions,
    subscribeToPositionUpdates,
  ]);

  useEffect(() => {
    if (markets.length === 0) {
      return;
    }

    setFavoriteSymbols((symbols) => {
      const validSymbols = symbols.filter((symbol) => markets.some((market) => market.symbol === symbol));
      if (validSymbols.length > 0) {
        return validSymbols;
      }

      const discoveredFavorites = markets
        .filter((market) => /volatility 100/i.test(market.displayName) || market.category === "Synthetic Indices")
        .slice(0, defaultFavoriteLimit)
        .map((market) => market.symbol);

      return discoveredFavorites.length > 0
        ? discoveredFavorites
        : markets.slice(0, defaultFavoriteLimit).map((market) => market.symbol);
    });

    setRecentSymbols((symbols) => {
      const validSymbols = symbols.filter((symbol) => markets.some((market) => market.symbol === symbol));
      return validSymbols.length > 0 ? validSymbols : markets.slice(0, 4).map((market) => market.symbol);
    });
  }, [markets]);

  useEffect(() => {
    if (!proposalRequest || Number(proposalRequest.stake) <= 0) {
      setProposal(undefined, "idle");
      return;
    }

    let isCurrent = true;
    setProposalState("loading");

    const timeout = window.setTimeout(async () => {
      try {
        const proposal = await providerBundle.tradingProvider.getProposal(proposalRequest);
        if (isCurrent) {
          setProposal(proposal, "ready");
        }
      } catch (caught) {
        if (isCurrent) {
          setError(toAppError(caught));
          setProposalState("error");
        }
      }
    }, 350);

    return () => {
      isCurrent = false;
      window.clearTimeout(timeout);
    };
  }, [proposalRequest, setProposal, setProposalState]);

  useEffect(() => {
    if (!currentProposal || proposalState !== "ready") {
      return;
    }

    const timeout = window.setTimeout(() => {
      setProposalState("stale");
    }, proposalStaleAfterMs);

    return () => window.clearTimeout(timeout);
  }, [currentProposal, proposalState, setProposalState]);

  const chooseMarket = useCallback(
    (symbol: string) => {
      selectMarket(symbol);
      setRecentSymbols((symbols) => [symbol, ...symbols.filter((item) => item !== symbol)].slice(0, 4));
    },
    [selectMarket],
  );

  const toggleFavorite = useCallback((symbol: string) => {
    setFavoriteSymbols((symbols) =>
      symbols.includes(symbol) ? symbols.filter((item) => item !== symbol) : [symbol, ...symbols],
    );
  }, []);

  const buy = useCallback(async () => {
    if (executionState === "buying") {
      return;
    }

    if (!selectedAccount || !selectedMarket || !currentProposal || !proposalRequest || proposalState !== "ready") {
      setError(new AppError({
        code: "VALIDATION_ERROR",
        title: "Trade not ready",
        message: "A valid account, market, and live proposal are required before buying.",
        retryable: false,
      }));
      return;
    }

    if (selectedAccount.type !== "demo") {
      setError(new AppError({
        code: "TRADE_REJECTED",
        title: "Demo trading only",
        message: "Real-money trading is disabled at this stage. Select a demo account to place trades.",
        retryable: false,
      }));
      return;
    }

    if (authenticatedConnectionStatus !== "connected") {
      setError(new AppError({
        code: "CONNECTION_LOST",
        title: "Trading connection unavailable",
        message: "Wait for the authenticated trading connection to be connected before buying.",
        retryable: true,
      }));
      return;
    }

    setExecutionState("buying");

    try {
      const result = await providerBundle.tradingProvider.buy({
        accountId: selectedAccount.id,
        accountType: selectedAccount.type,
        proposalId: currentProposal.id,
        proposal: currentProposal,
        proposalRequest,
      });

      const initialPosition = createPositionFromBuy({
        result,
        market: selectedMarket,
        proposal: currentProposal,
        proposalRequest,
        isSellable: contractAvailability?.isSellable ?? false,
      });

      upsertPosition(initialPosition);
      await subscribeToPositionUpdates(selectedAccount.id, initialPosition);

      setExecutionState("success");
      window.setTimeout(() => setExecutionState("idle"), 900);
    } catch (caught) {
      setError(toAppError(caught));
      setExecutionState("error");
    }
  }, [
    authenticatedConnectionStatus,
    contractAvailability,
    currentProposal,
    executionState,
    proposalRequest,
    proposalState,
    selectedAccount,
    selectedMarket,
    setExecutionState,
    subscribeToPositionUpdates,
    upsertPosition,
  ]);

  const closePosition = useCallback(
    async (contractId: string) => {
      if (!selectedAccount) {
        return;
      }

      const position = usePositionStore.getState().openPositions.find((item) => item.contractId === contractId);
      if (!position) {
        return;
      }

      if (!position.isSellable || !position.sellPrice || sellingContractsRef.current.has(contractId)) {
        return;
      }

      sellingContractsRef.current.add(contractId);

      try {
        const result = await providerBundle.tradingProvider.sell({
          accountId: selectedAccount.id,
          contractId,
          buyPrice: position.buyPrice,
          sellPrice: position.sellPrice,
        });

        handleSettledPosition({
          ...position,
          status: "sold",
          payout: result.soldFor,
          profit: result.profit,
          expiryTime: result.soldAt,
          isSellable: false,
          sellPrice: result.soldFor,
        });
      } catch (caught) {
        setError(toAppError(caught));
      } finally {
        sellingContractsRef.current.delete(contractId);
      }
    },
    [handleSettledPosition, selectedAccount],
  );

  return {
    accounts,
    authenticatedConnectionError,
    authenticatedConnectionStatus,
    balance,
    balanceCurrency,
    balanceStatus,
    closePosition,
    connectionStatus,
    currentProposal,
    currentTick,
    duration,
    durationUnit,
    error,
    executionState,
    favoriteSymbols,
    isAuthenticated,
    isBootstrapping,
    contractAvailability,
    contractAvailabilityError,
    isContractAvailabilityLoading,
    markets,
    proposalState,
    recentSymbols,
    selectedAccount: selectedAccount as TradingAccount | undefined,
    selectedMarket: selectedMarket as Market | undefined,
    stake,
    direction,
    buy,
    chooseMarket,
    selectAccount,
    setDirection,
    setDuration,
    setDurationUnit,
    setStake,
    toggleFavorite,
  };
}

function clampDuration(duration: number, min?: number, max?: number) {
  let nextDuration = duration;

  if (min !== undefined && nextDuration < min) {
    nextDuration = min;
  }

  if (max !== undefined && nextDuration > max) {
    nextDuration = max;
  }

  return nextDuration;
}

function clampStake(stake: string, minStake?: string, maxStake?: string) {
  const numericStake = Number(stake);

  if (!Number.isFinite(numericStake)) {
    return minStake ?? stake;
  }

  const min = minStake ? Number(minStake) : undefined;
  const max = maxStake ? Number(maxStake) : undefined;
  const clamped = Math.min(max ?? numericStake, Math.max(min ?? numericStake, numericStake));

  return clamped === numericStake ? stake : String(clamped);
}
