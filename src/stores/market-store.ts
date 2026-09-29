import { create } from "zustand";

import type { ConnectionStatus, Market, Tick } from "@/types";

type MarketState = {
  markets: Market[];
  selectedSymbol?: string;
  currentTick?: Tick;
  connectionStatus: ConnectionStatus;
  setMarkets: (markets: Market[]) => void;
  selectMarket: (symbol: string) => void;
  setCurrentTick: (tick: Tick) => void;
  setConnectionStatus: (connectionStatus: ConnectionStatus) => void;
  reset: () => void;
};

export const useMarketStore = create<MarketState>((set) => ({
  markets: [],
  connectionStatus: "idle",
  setMarkets: (markets) =>
    set((state) => ({
      markets,
      selectedSymbol: markets.some((market) => market.symbol === state.selectedSymbol)
        ? state.selectedSymbol
        : markets[0]?.symbol,
    })),
  selectMarket: (selectedSymbol) => set({ selectedSymbol }),
  setCurrentTick: (currentTick) => set({ currentTick }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  reset: () =>
    set({
      markets: [],
      selectedSymbol: undefined,
      currentTick: undefined,
      connectionStatus: "idle",
    }),
}));
