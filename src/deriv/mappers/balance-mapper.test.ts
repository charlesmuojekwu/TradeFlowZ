import { describe, expect, it } from "vitest";

import { normalizeDerivBalance } from "@/deriv/mappers/balance-mapper";

describe("normalizeDerivBalance", () => {
  it("normalizes Deriv balance messages into account balance updates", () => {
    expect(
      normalizeDerivBalance(
        {
          balance: {
            loginid: "DOT90004580",
            balance: 10000.25,
            currency: "USD",
          },
        },
        "fallback",
      ),
    ).toEqual({
      id: "DOT90004580",
      balance: "10000.25",
      currency: "USD",
    });
  });

  it("falls back to the selected account id when the message omits loginid", () => {
    expect(
      normalizeDerivBalance(
        {
          balance: {
            balance: "42.10",
            currency: "USD",
          },
        },
        "DOT90000001",
      ),
    ).toEqual({
      id: "DOT90000001",
      balance: "42.10",
      currency: "USD",
    });
  });
});
