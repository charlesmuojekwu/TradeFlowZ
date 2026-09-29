import { beforeEach, describe, expect, it } from "vitest";

import { useTradeStore } from "@/stores/trade-store";
import type { TradeProposal } from "@/types";

const proposal: TradeProposal = {
  id: "proposal-1",
  askPrice: "10",
  payout: "18.63",
  potentialProfit: "8.63",
  spot: "1000.00",
  receivedAt: 1_793_456_000,
};

describe("tradeStore", () => {
  beforeEach(() => {
    useTradeStore.getState().reset();
  });

  it("keeps proposal lifecycle explicit so stale quotes cannot look executable", () => {
    useTradeStore.getState().setProposalState("loading");
    expect(useTradeStore.getState().proposalState).toBe("loading");

    useTradeStore.getState().setProposal(proposal);
    expect(useTradeStore.getState().currentProposal).toEqual(proposal);
    expect(useTradeStore.getState().proposalState).toBe("ready");

    useTradeStore.getState().setProposalState("stale");
    expect(useTradeStore.getState().currentProposal).toEqual(proposal);
    expect(useTradeStore.getState().proposalState).toBe("stale");

    useTradeStore.getState().setProposal(undefined, "error");
    expect(useTradeStore.getState().currentProposal).toBeUndefined();
    expect(useTradeStore.getState().proposalState).toBe("error");
  });

  it("tracks execution transitions without mutating trade configuration", () => {
    useTradeStore.getState().configureTrade({
      direction: "fall",
      duration: 10,
      durationUnit: "ticks",
      stake: "25",
    });

    useTradeStore.getState().setExecutionState("buying");
    expect(useTradeStore.getState()).toMatchObject({
      direction: "fall",
      duration: 10,
      durationUnit: "ticks",
      stake: "25",
      executionState: "buying",
    });

    useTradeStore.getState().setExecutionState("ambiguous");
    expect(useTradeStore.getState().executionState).toBe("ambiguous");

    useTradeStore.getState().setExecutionState("success");
    expect(useTradeStore.getState()).toMatchObject({
      direction: "fall",
      duration: 10,
      durationUnit: "ticks",
      stake: "25",
      executionState: "success",
    });
  });
});
