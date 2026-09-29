import { create } from "zustand";

import type { DurationUnit, TradeDirection, TradeProposal } from "@/types";

type ProposalState = "idle" | "loading" | "ready" | "stale" | "error";
type ExecutionState = "idle" | "buying" | "success" | "ambiguous" | "error";

type TradeState = {
  stake: string;
  duration: number;
  durationUnit: DurationUnit;
  direction: TradeDirection;
  currentProposal?: TradeProposal;
  proposalState: ProposalState;
  executionState: ExecutionState;
  setStake: (stake: string) => void;
  setDuration: (duration: number) => void;
  setDurationUnit: (durationUnit: DurationUnit) => void;
  setDirection: (direction: TradeDirection) => void;
  configureTrade: (configuration: Partial<Pick<TradeState, "direction" | "duration" | "durationUnit" | "stake">>) => void;
  setProposal: (proposal?: TradeProposal, proposalState?: ProposalState) => void;
  setProposalState: (proposalState: ProposalState) => void;
  setExecutionState: (executionState: ExecutionState) => void;
  reset: () => void;
};

export const useTradeStore = create<TradeState>((set) => ({
  stake: "10",
  duration: 5,
  durationUnit: "minutes",
  direction: "rise",
  proposalState: "idle",
  executionState: "idle",
  setStake: (stake) => set({ stake }),
  setDuration: (duration) => set({ duration }),
  setDurationUnit: (durationUnit) => set({ durationUnit }),
  setDirection: (direction) => set({ direction }),
  configureTrade: (configuration) => set(configuration),
  setProposal: (currentProposal, proposalState = "ready") => set({ currentProposal, proposalState }),
  setProposalState: (proposalState) => set({ proposalState }),
  setExecutionState: (executionState) => set({ executionState }),
  reset: () =>
    set({
      stake: "10",
      duration: 5,
      durationUnit: "minutes",
      direction: "rise",
      currentProposal: undefined,
      proposalState: "idle",
      executionState: "idle",
    }),
}));
