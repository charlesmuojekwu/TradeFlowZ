import { describe, expect, it } from "vitest";

import { mapActiveSymbol, mapHistory, mapTick } from "@/deriv/mappers/market-mapper";

describe("Deriv market mapper", () => {
  it("normalizes current active_symbols fields into the Market domain model", () => {
    const market = mapActiveSymbol({
      exchange_is_open: 1,
      is_trading_suspended: 0,
      market: "synthetic_index",
      pip_size: 0.01,
      submarket: "random_index",
      underlying_symbol: "R_100",
      underlying_symbol_name: "Volatility 100 Index",
      underlying_symbol_type: "forex",
    });

    expect(market).toEqual({
      symbol: "R_100",
      displayName: "Volatility 100 Index",
      category: "Synthetic Indices",
      market: "synthetic_index",
      submarket: "random_index",
      pipSize: 2,
    });
  });

  it("keeps supporting legacy active_symbols fields at the provider boundary", () => {
    const market = mapActiveSymbol({
      symbol: "frxEURUSD",
      display_name: "EUR/USD",
      market: "forex",
      market_display_name: "Forex",
      submarket: "major_pairs",
      pip: 0.00001,
    });

    expect(market).toMatchObject({
      symbol: "frxEURUSD",
      displayName: "EUR/USD",
      category: "Forex",
      pipSize: 5,
    });
  });

  it("normalizes ticks and historical points without leaking provider fields", () => {
    expect(mapTick({ symbol: "R_100", quote: 1234.56, epoch: 100, pip_size: 0.01 })).toMatchObject({
      symbol: "R_100",
      price: "1234.56",
      pipSize: 2,
      epoch: 100,
    });

    expect(mapHistory({ prices: [1.1, "1.2"], times: [10, 20] })).toEqual([
      { time: 10, value: "1.1" },
      { time: 20, value: "1.2" },
    ]);
  });
});
