import { describe, expect, it } from "vitest";

import { createPositionFromBuy } from "@/features/trading/utils/create-position-from-buy";

describe("createPositionFromBuy", () => {
  it("creates the initial open position for a bought Rise contract", () => {
    expect(
      createPositionFromBuy({
        result: {
          contractId: "123456789",
          purchasedAt: 1_793_456_000,
        },
        market: {
          symbol: "1HZ100V",
          displayName: "Volatility 100 (1s) Index",
          category: "Synthetic Indices",
          market: "synthetic_index",
          submarket: "random_index",
          pipSize: 2,
        },
        proposal: {
          id: "proposal-123",
          askPrice: "10",
          payout: "19.53",
          potentialProfit: "9.53",
          spot: "1016.59",
          receivedAt: 1_793_455_990,
        },
        proposalRequest: {
          accountId: "DOT90004580",
          symbol: "1HZ100V",
          direction: "rise",
          stake: "10",
          currency: "USD",
          duration: 5,
          durationUnit: "minutes",
        },
        isSellable: true,
      }),
    ).toEqual({
      contractId: "123456789",
      symbol: "1HZ100V",
      displaySymbol: "Volatility 100 (1s) Index",
      direction: "rise",
      stake: "10",
      buyPrice: "10",
      payout: "19.53",
      entrySpot: "1016.59",
      currentSpot: "1016.59",
      profit: "0",
      currency: "USD",
      purchaseTime: 1_793_456_000,
      expiryTime: 1_793_456_300,
      status: "open",
      isSellable: true,
    });
  });
});
