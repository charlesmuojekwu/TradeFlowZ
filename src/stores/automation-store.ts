import { create } from "zustand";

import type { AppError } from "@/lib/errors";
import type { AutomationRun, AutomationStrategy } from "@/types";

type AutomationState = {
  strategies: AutomationStrategy[];
  runs: AutomationRun[];
  selectedStrategyId?: string;
  selectedRunId?: string;
  isLoadingStrategies: boolean;
  isLoadingRuns: boolean;
  error?: AppError;
  setStrategies: (strategies: AutomationStrategy[]) => void;
  setRuns: (runs: AutomationRun[]) => void;
  upsertRun: (run: AutomationRun) => void;
  selectStrategy: (strategyId: string) => void;
  selectRun: (runId?: string) => void;
  setLoadingStrategies: (isLoadingStrategies: boolean) => void;
  setLoadingRuns: (isLoadingRuns: boolean) => void;
  setError: (error?: AppError) => void;
  reset: () => void;
};

export const useAutomationStore = create<AutomationState>((set) => ({
  strategies: [],
  runs: [],
  isLoadingStrategies: false,
  isLoadingRuns: false,
  setStrategies: (strategies) =>
    set((state) => ({
      strategies,
      selectedStrategyId: strategies.some((strategy) => strategy.id === state.selectedStrategyId)
        ? state.selectedStrategyId
        : strategies[0]?.id,
    })),
  setRuns: (runs) =>
    set((state) => ({
      runs,
      selectedRunId: runs.some((run) => run.id === state.selectedRunId)
        ? state.selectedRunId
        : runs.find((run) => run.status === "running" || run.status === "paused")?.id ?? runs[0]?.id,
    })),
  upsertRun: (run) =>
    set((state) => {
      const nextRuns = state.runs.some((item) => item.id === run.id)
        ? state.runs.map((item) => (item.id === run.id ? run : item))
        : [run, ...state.runs];

      return {
        runs: nextRuns,
        selectedRunId: state.selectedRunId ?? run.id,
      };
    }),
  selectStrategy: (selectedStrategyId) => set({ selectedStrategyId }),
  selectRun: (selectedRunId) => set({ selectedRunId }),
  setLoadingStrategies: (isLoadingStrategies) => set({ isLoadingStrategies }),
  setLoadingRuns: (isLoadingRuns) => set({ isLoadingRuns }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      strategies: [],
      runs: [],
      selectedStrategyId: undefined,
      selectedRunId: undefined,
      isLoadingStrategies: false,
      isLoadingRuns: false,
      error: undefined,
    }),
}));
