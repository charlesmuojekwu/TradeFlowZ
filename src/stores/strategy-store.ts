"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { SavedStrategy } from "@/types";

type StrategyState = {
  strategies: SavedStrategy[];
  upsertStrategy: (strategy: SavedStrategy) => void;
  deleteStrategy: (strategyId: string) => void;
  duplicateStrategy: (strategyId: string) => void;
};

export const useStrategyStore = create<StrategyState>()(
  persist(
    (set, get) => ({
      strategies: [],
      upsertStrategy: (strategy) =>
        set((state) => ({
          strategies: [
            strategy,
            ...state.strategies.filter((item) => item.id !== strategy.id),
          ],
        })),
      deleteStrategy: (strategyId) =>
        set((state) => ({
          strategies: state.strategies.filter((strategy) => strategy.id !== strategyId),
        })),
      duplicateStrategy: (strategyId) => {
        const source = get().strategies.find((strategy) => strategy.id === strategyId);
        if (!source) {
          return;
        }

        const now = Math.floor(Date.now() / 1000);
        set((state) => ({
          strategies: [
            {
              ...source,
              id: crypto.randomUUID(),
              name: `${source.name} copy`,
              compatibility: "integration-required",
              createdAt: now,
              updatedAt: now,
            },
            ...state.strategies,
          ],
        }));
      },
    }),
    {
      name: "tradeflowz-strategies",
      version: 1,
    },
  ),
);
