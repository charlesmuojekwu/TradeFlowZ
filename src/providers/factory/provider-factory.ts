import { env } from "@/config/env";
import { DerivAccountProvider, DerivMarketProvider, DerivTradingProvider } from "@/deriv/services";
import { AppError } from "@/lib/errors";
import type { AccountProvider, MarketProvider, TradingProvider } from "@/providers/interfaces";
import { MockAccountProvider, MockMarketProvider, MockTradingProvider } from "@/providers/mock";

export type TradingProviderKind = "mock" | "deriv" | "api";

export type ProviderBundle = {
  marketProvider: MarketProvider;
  tradingProvider: TradingProvider;
  accountProvider: AccountProvider;
};

export function createProviderBundle(kind: TradingProviderKind = env.NEXT_PUBLIC_TRADING_PROVIDER): ProviderBundle {
  if (kind === "mock") {
    return {
      marketProvider: new MockMarketProvider(),
      tradingProvider: new MockTradingProvider(),
      accountProvider: new MockAccountProvider(),
    };
  }

  if (kind === "deriv") {
    return {
      marketProvider: new DerivMarketProvider(),
      tradingProvider: new DerivTradingProvider(),
      accountProvider: new DerivAccountProvider(),
    };
  }

  throw new AppError({
    code: "CONFIG_INVALID",
    title: "Trading provider unavailable",
    message: `The "${kind}" provider is reserved for a later phase.`,
    retryable: false,
  });
}
