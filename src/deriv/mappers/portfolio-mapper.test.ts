import { describe, expect, it } from "vitest";

import { mapDerivPortfolio } from "@/deriv/mappers/portfolio-mapper";

describe("mapDerivPortfolio", () => {
  it("normalizes Deriv portfolio contracts into open position seeds", () => {
    expect(
      mapDerivPortfolio({
        portfolio: {
          contracts: [
            {
              contract_id: 123456789,
              contract_type: "CALL",
              underlying_symbol: "1HZ100V",
              longcode: "Win payout if Volatility 100 rises",
              currency: "USD",
              buy_price: "10",
              payout: "19.53",
              entry_spot: "1016.59",
              current_spot: "1017.01",
              profit: "0.52",
              purchase_time: 1_793_456_000,
              expiry_time: 1_793_456_300,
              status: "open",
              is_valid_to_sell: 1,
              sell_price: "10.52",
            },
          ],
        },
      }),
    ).toEqual([
      {
        contractId: "123456789",
        symbol: "1HZ100V",
        displaySymbol: "Win payout if Volatility 100 rises",
        direction: "rise",
        stake: "10",
        buyPrice: "10",
        payout: "19.53",
        entrySpot: "1016.59",
        currentSpot: "1017.01",
        profit: "0.52",
        currency: "USD",
        purchaseTime: 1_793_456_000,
        expiryTime: 1_793_456_300,
        status: "open",
        isSellable: true,
        sellPrice: "10.52",
      },
    ]);
  });

  it("uses new underlying_symbol while tolerating legacy symbol during migration", () => {
    expect(
      mapDerivPortfolio({
        portfolio: {
          contracts: [
            {
              contract_id: "987654321",
              contract_type: "PUT",
              symbol: "R_100",
              buy_price: 5,
            },
          ],
        },
      }),
    ).toEqual([
      expect.objectContaining({
        contractId: "987654321",
        symbol: "R_100",
        displaySymbol: "R_100",
        direction: "fall",
        stake: "5",
        status: "open",
      }),
    ]);
  });
});
