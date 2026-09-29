import { describe, expect, it } from "vitest";

import { mapDerivProfitTable } from "@/deriv/mappers/profit-table-mapper";

describe("mapDerivProfitTable", () => {
  it("normalizes Deriv profit_table transactions into historical positions", () => {
    expect(
      mapDerivProfitTable({
        profit_table: {
          count: 1,
          transactions: [
            {
              contract_id: 123456789,
              contract_type: "CALL",
              underlying_symbol: "1HZ100V",
              longcode: "Win payout if Volatility 100 rises",
              currency: "USD",
              buy_price: "10",
              payout: "19.53",
              profit: "9.53",
              entry_spot: "1016.59",
              exit_spot: "1018.11",
              purchase_time: 1_793_456_000,
              sell_time: 1_793_456_300,
              status: "won",
            },
          ],
        },
      }),
    ).toEqual({
      total: 1,
      positions: [
        {
          contractId: "123456789",
          symbol: "1HZ100V",
          displaySymbol: "Win payout if Volatility 100 rises",
          direction: "rise",
          stake: "10",
          buyPrice: "10",
          payout: "19.53",
          entrySpot: "1016.59",
          currentSpot: "1018.11",
          profit: "9.53",
          currency: "USD",
          purchaseTime: 1_793_456_000,
          expiryTime: 1_793_456_300,
          status: "won",
          isSellable: false,
        },
      ],
    });
  });

  it("infers result from provider profit only when status is absent", () => {
    expect(
      mapDerivProfitTable({
        profit_table: {
          count: 1,
          transactions: [
            {
              contract_id: "987654321",
              shortcode: "PUT_R_100",
              symbol: "R_100",
              buy_price: 10,
              profit: -10,
            },
          ],
        },
      }).positions[0],
    ).toMatchObject({
      contractId: "987654321",
      direction: "fall",
      status: "lost",
      profit: "-10",
    });
  });
});
