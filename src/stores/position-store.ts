import { create } from "zustand";

import type { Position } from "@/types";

type PositionState = {
  openPositions: Position[];
  settledPositions: Position[];
  upsertPosition: (position: Position) => void;
  settlePosition: (position: Position) => void;
  setOpenPositions: (positions: Position[]) => void;
  reset: () => void;
};

export const usePositionStore = create<PositionState>((set) => ({
  openPositions: [],
  settledPositions: [],
  upsertPosition: (position) =>
    set((state) => ({
      openPositions: [
        ...state.openPositions.filter((item) => item.contractId !== position.contractId),
        position,
      ],
    })),
  settlePosition: (position) =>
    set((state) => ({
      openPositions: state.openPositions.filter((item) => item.contractId !== position.contractId),
      settledPositions: [
        position,
        ...state.settledPositions.filter((item) => item.contractId !== position.contractId),
      ],
    })),
  setOpenPositions: (openPositions) => set({ openPositions }),
  reset: () => set({ openPositions: [], settledPositions: [] }),
}));
