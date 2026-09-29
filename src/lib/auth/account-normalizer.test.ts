import { describe, expect, it } from "vitest";

import { normalizeDerivAccounts } from "@/lib/auth";

describe("Deriv account normalizer", () => {
  it("normalizes Options account payloads into app accounts", () => {
    expect(
      normalizeDerivAccounts([
        {
          account_id: "demo-123",
          account_type: "demo",
          currency: "USD",
          status: "active",
          balance: 10000,
        },
        {
          id: "real-123",
          type: "real",
          currency: "USD",
          current_balance: "25.50",
        },
      ]),
    ).toEqual([
      {
        id: "demo-123",
        type: "demo",
        currency: "USD",
        status: "active",
        balance: "10000",
      },
      {
        id: "real-123",
        type: "real",
        currency: "USD",
        status: "unknown",
        balance: "25.50",
      },
    ]);
  });
});
