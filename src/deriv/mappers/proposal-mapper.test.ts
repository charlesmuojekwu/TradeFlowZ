import { describe, expect, it } from "vitest";

import { mapDerivProposal, mapProposalRequestToDeriv } from "@/deriv/mappers/proposal-mapper";

describe("Deriv proposal mapper", () => {
  it("maps Rise/Fall proposal input to Deriv request fields", () => {
    expect(
      mapProposalRequestToDeriv({
        symbol: "1HZ100V",
        direction: "rise",
        stake: "10",
        currency: "USD",
        duration: 5,
        durationUnit: "minutes",
      }),
    ).toEqual({
      proposal: 1,
      amount: "10",
      basis: "stake",
      contract_type: "CALL",
      currency: "USD",
      duration: 5,
      duration_unit: "m",
      underlying_symbol: "1HZ100V",
    });
  });

  it("normalizes Deriv proposal responses into app proposal model", () => {
    expect(
      mapDerivProposal({
        id: "proposal-1",
        ask_price: 10,
        payout: "18.63",
        spot: 1234.56,
        spot_time: 100,
      }),
    ).toEqual({
      id: "proposal-1",
      askPrice: "10",
      payout: "18.63",
      potentialProfit: "8.63",
      spot: "1234.56",
      receivedAt: 100,
    });
  });
});
