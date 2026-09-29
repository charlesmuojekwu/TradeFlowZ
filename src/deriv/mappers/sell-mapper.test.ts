import { describe, expect, it } from "vitest";

import { normalizeDerivSell } from "@/deriv/mappers/sell-mapper";

describe("normalizeDerivSell", () => {
  it("normalizes Deriv sell confirmations with explicit provider profit", () => {
    expect(
      normalizeDerivSell(
        {
          sell: {
            contract_id: 123456789,
            sold_for: "11.25",
            profit: "1.25",
            transaction_time: 1_793_456_120,
          },
        },
        { accountId: "DOT90004580", contractId: "123456789", buyPrice: "10", sellPrice: "11.25" },
        "10",
      ),
    ).toEqual({
      contractId: "123456789",
      soldFor: "11.25",
      profit: "1.25",
      soldAt: 1_793_456_120,
    });
  });

  it("derives P/L from provider sold price when explicit profit is omitted", () => {
    expect(
      normalizeDerivSell(
        {
          sell: {
            contract_id: "123456789",
            sold_for: "8.50",
          },
        },
        { accountId: "DOT90004580", contractId: "123456789", buyPrice: "10", sellPrice: "8.50" },
        "10",
      ),
    ).toMatchObject({
      profit: "-1.5",
      soldFor: "8.50",
    });
  });
});
