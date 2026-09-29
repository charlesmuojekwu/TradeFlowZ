"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { toAppError, type AppError } from "@/lib/errors";
import { providerBundle } from "@/providers";
import type { ConnectionStatus, Market, PricePoint, Tick } from "@/types";

const historyCount = 240;

type PriceChange = {
  value: string;
  percent: string;
  direction: "up" | "down" | "flat";
};

export function useMarketChartData(market?: Market) {
  const [historicalData, setHistoricalData] = useState<PricePoint[]>([]);
  const [liveTick, setLiveTick] = useState<Tick>();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError>();
  const latestPointsRef = useRef<PricePoint[]>([]);

  useEffect(() => {
    if (!market) {
      latestPointsRef.current = [];
      setHistoricalData([]);
      setLiveTick(undefined);
      setConnectionStatus("idle");
      return;
    }

    const selectedMarket = market;
    let isCurrent = true;
    let unsubscribe: (() => void) | undefined;

    async function loadAndSubscribe() {
      setIsLoading(true);
      setError(undefined);
      setLiveTick(undefined);
      setHistoricalData([]);
      latestPointsRef.current = [];
      setConnectionStatus("connecting");

      try {
        const history = await providerBundle.marketProvider.getHistoricalPrices({
          symbol: selectedMarket.symbol,
          count: historyCount,
        });

        if (!isCurrent) {
          return;
        }

        latestPointsRef.current = history;
          setHistoricalData(history);
        setIsLoading(false);

        const nextUnsubscribe = await providerBundle.marketProvider.subscribeToTicks(
          selectedMarket.symbol,
          (tick) => {
            if (!isCurrent) {
              return;
            }

            latestPointsRef.current = [
              ...latestPointsRef.current.slice(Math.max(0, latestPointsRef.current.length - historyCount)),
              { time: tick.epoch, value: tick.price },
            ];
            setLiveTick(tick);
            setConnectionStatus("connected");
          },
          (providerError) => {
            if (!isCurrent) {
              return;
            }

            setError(providerError);
            setConnectionStatus("reconnecting");
          },
        );

        if (!isCurrent) {
          nextUnsubscribe();
          return;
        }

        unsubscribe = nextUnsubscribe;
      } catch (caught) {
        if (!isCurrent) {
          return;
        }

        setError(toAppError(caught));
        setConnectionStatus("disconnected");
        setIsLoading(false);
      }
    }

    void loadAndSubscribe();

    return () => {
      isCurrent = false;
      unsubscribe?.();
    };
  }, [market]);

  const priceChange = useMemo<PriceChange>(() => {
    const points = latestPointsRef.current;

    if (points.length < 2) {
      return { value: "0.00", percent: "0.00", direction: "flat" };
    }

    const first = Number(points[Math.max(0, points.length - 40)]?.value ?? points[0]?.value ?? 0);
    const last = Number(liveTick?.price ?? points.at(-1)?.value ?? first);
    const value = last - first;
    const percent = first === 0 ? 0 : (value / first) * 100;

    return {
      value: value.toFixed(market?.pipSize ?? 2),
      percent: percent.toFixed(2),
      direction: value > 0 ? "up" : value < 0 ? "down" : "flat",
    };
  }, [liveTick, market?.pipSize]);

  return {
    connectionStatus,
    error,
    historicalData,
    isLoading,
    liveTick,
    priceChange,
  };
}
