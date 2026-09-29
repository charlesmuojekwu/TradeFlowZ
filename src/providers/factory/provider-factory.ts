import { env } from "@/config/env";
import { DerivAccountProvider, DerivAutomationProvider, DerivMarketProvider, DerivTradingProvider } from "@/deriv/services";
import { AppError } from "@/lib/errors";
import type { AccountProvider, AutomationProvider, MarketProvider, TradingProvider } from "@/providers/interfaces";
import { MockAccountProvider, MockAutomationProvider, MockMarketProvider, MockTradingProvider } from "@/providers/mock";

export type TradingProviderKind = "mock" | "deriv" | "api";

export type ProviderBundle = {
  marketProvider: MarketProvider;
  tradingProvider: TradingProvider;
  accountProvider: AccountProvider;
  automationProvider: AutomationProvider;
};

export function createProviderBundle(kind: TradingProviderKind = env.NEXT_PUBLIC_TRADING_PROVIDER): ProviderBundle {
  if (kind === "mock") {
    return {
      marketProvider: new MockMarketProvider(),
      tradingProvider: new MockTradingProvider(),
      accountProvider: new MockAccountProvider(),
      automationProvider: new MockAutomationProvider(),
    };
  }

  if (kind === "deriv") {
    return {
      marketProvider: new DerivMarketProvider(),
      tradingProvider: new DerivTradingProvider(),
      accountProvider: new DerivAccountProvider(),
      automationProvider: new DerivAutomationProvider(),
    };
  }

  throw new AppError({
    code: "CONFIG_INVALID",
    title: "Trading provider unavailable",
    message: `The "${kind}" provider is reserved for a later phase.`,
    retryable: false,
  });
}
