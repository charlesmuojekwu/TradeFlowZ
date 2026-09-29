import { create } from "zustand";

type ThemePreference = "light" | "dark" | "system";

export type TradeResultNotification = {
  contractId: string;
  status: "won" | "lost" | "sold" | "unknown";
  displaySymbol: string;
  direction: "rise" | "fall";
  stake: string;
  payout: string;
  profit: string;
  currency: string;
};

type UiState = {
  isSidebarOpen: boolean;
  isMarketDrawerOpen: boolean;
  isPositionsDrawerOpen: boolean;
  tradeResult?: TradeResultNotification;
  theme: ThemePreference;
  clearTradeResult: () => void;
  setSidebarOpen: (isSidebarOpen: boolean) => void;
  setMarketDrawerOpen: (isMarketDrawerOpen: boolean) => void;
  setPositionsDrawerOpen: (isPositionsDrawerOpen: boolean) => void;
  setTheme: (theme: ThemePreference) => void;
  showTradeResult: (tradeResult: TradeResultNotification) => void;
};

export const useUiStore = create<UiState>((set) => ({
  isSidebarOpen: true,
  isMarketDrawerOpen: false,
  isPositionsDrawerOpen: false,
  theme: "dark",
  clearTradeResult: () => set({ tradeResult: undefined }),
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  setMarketDrawerOpen: (isMarketDrawerOpen) => set({ isMarketDrawerOpen }),
  setPositionsDrawerOpen: (isPositionsDrawerOpen) => set({ isPositionsDrawerOpen }),
  setTheme: (theme) => set({ theme }),
  showTradeResult: (tradeResult) => set({ tradeResult }),
}));
