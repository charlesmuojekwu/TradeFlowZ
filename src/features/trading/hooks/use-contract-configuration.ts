"use client";

import { useEffect, useState } from "react";

import { toAppError, type AppError } from "@/lib/errors";
import { providerBundle } from "@/providers";
import type { ContractAvailability, Market } from "@/types";

export function useContractConfiguration(market?: Market) {
  const [availability, setAvailability] = useState<ContractAvailability>();
  const [error, setError] = useState<AppError>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!market) {
      setAvailability(undefined);
      setError(undefined);
      setIsLoading(false);
      return;
    }

    const selectedMarket = market;
    let isCurrent = true;
    setIsLoading(true);
    setError(undefined);
    setAvailability(undefined);

    async function loadAvailability() {
      try {
        const nextAvailability = await providerBundle.tradingProvider.getContractAvailability(selectedMarket.symbol);

        if (!isCurrent) {
          return;
        }

        setAvailability(nextAvailability);
      } catch (caught) {
        if (!isCurrent) {
          return;
        }

        setError(toAppError(caught));
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    void loadAvailability();

    return () => {
      isCurrent = false;
    };
  }, [market]);

  return {
    availability,
    error,
    isLoading,
  };
}
