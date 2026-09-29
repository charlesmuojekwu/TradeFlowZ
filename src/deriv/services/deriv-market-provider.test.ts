import { describe, expect, it, vi } from "vitest";

import { DerivMarketProvider } from "@/deriv/services/deriv-market-provider";
import type { DerivPublicWebSocketClient } from "@/deriv/websocket";

describe("DerivMarketProvider", () => {
  it("loads active_symbols and returns normalized markets sorted by category/name", async () => {
    const request = vi.fn().mockResolvedValue({
      active_symbols: [
        {
          underlying_symbol: "frxEURUSD",
          underlying_symbol_name: "EUR/USD",
          market: "forex",
          submarket: "major_pairs",
          pip_size: 0.00001,
        },
        {
          underlying_symbol: "R_100",
          underlying_symbol_name: "Volatility 100 Index",
          market: "synthetic_index",
          submarket: "random_index",
          pip_size: 0.01,
        },
      ],
    });
    const provider = new DerivMarketProvider({ request } as unknown as DerivPublicWebSocketClient);

    await expect(provider.getMarkets()).resolves.toEqual([
      expect.objectContaining({ symbol: "frxEURUSD", displayName: "EUR/USD", category: "Forex" }),
      expect.objectContaining({ symbol: "R_100", displayName: "Volatility 100 Index", category: "Synthetic Indices" }),
    ]);
    expect(request).toHaveBeenCalledWith({ active_symbols: "brief" });
  });

  it("normalizes historical tick data", async () => {
    const request = vi.fn().mockResolvedValue({
      history: {
        prices: [1000.1, "1000.2"],
        times: [1_793_456_000, 1_793_456_001],
      },
    });
    const provider = new DerivMarketProvider({ request } as unknown as DerivPublicWebSocketClient);

    await expect(provider.getHistoricalPrices({ symbol: "R_100", count: 2 })).resolves.toEqual([
      { time: 1_793_456_000, value: "1000.1" },
      { time: 1_793_456_001, value: "1000.2" },
    ]);
    expect(request).toHaveBeenCalledWith({
      ticks_history: "R_100",
      count: 2,
      end: "latest",
      style: "ticks",
      adjust_start_time: 1,
    });
  });

  it("subscribes to normalized ticks and cleans up the provider subscription", async () => {
    const cleanup = vi.fn().mockResolvedValue(undefined);
    const subscribe = vi.fn().mockImplementation(async (_key, _payload, onMessage) => {
      onMessage({
        tick: {
          symbol: "R_100",
          quote: 1001.23,
          epoch: 1_793_456_100,
          pip_size: 0.01,
        },
      });

      return cleanup;
    });
    const provider = new DerivMarketProvider({
      request: vi.fn(),
      subscribe,
    } as unknown as DerivPublicWebSocketClient);
    const onTick = vi.fn();
    const onError = vi.fn();

    const unsubscribe = await provider.subscribeToTicks("R_100", onTick, onError);

    expect(subscribe).toHaveBeenCalledWith("ticks:R_100", { ticks: "R_100" }, expect.any(Function), expect.any(Function));
    expect(onTick).toHaveBeenCalledWith({
      symbol: "R_100",
      displayName: "R_100",
      price: "1001.23",
      pipSize: 2,
      epoch: 1_793_456_100,
    });

    unsubscribe();
    await Promise.resolve();

    expect(cleanup).toHaveBeenCalledOnce();
    expect(onError).not.toHaveBeenCalled();
  });
});
