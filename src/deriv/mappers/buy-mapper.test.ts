import { describe, expect, it } from "vitest";

import { normalizeDerivBuy } from "@/deriv/mappers/buy-mapper";

describe("normalizeDerivBuy", () => {
  it("normalizes Deriv buy confirmations", () => {
    expect(
      normalizeDerivBuy({
        buy: {
          contract_id: 123456789,
          purchase_time: 1_793_456_000,
        },
      }),
    ).toEqual({
      contractId: "123456789",
      purchasedAt: 1_793_456_000,
    });
  });

  it("rejects malformed buy confirmations", () => {
    expect(() => normalizeDerivBuy({ buy: {} })).toThrow("contract id");
  });
});
