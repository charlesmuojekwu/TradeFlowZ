import type { Market, Position, TradingAccount } from "@/types";

export const mockMarkets: Market[] = [
  {
    symbol: "MOCK_R_100",
    displayName: "Volatility 100 Index",
    category: "Synthetic Indices",
    market: "synthetic_index",
    submarket: "random_index",
    pipSize: 2,
  },
  {
    symbol: "MOCK_R_75",
    displayName: "Volatility 75 Index",
    category: "Synthetic Indices",
    market: "synthetic_index",
    submarket: "random_index",
    pipSize: 2,
  },
  {
    symbol: "MOCK_R_50",
    displayName: "Volatility 50 Index",
    category: "Synthetic Indices",
    market: "synthetic_index",
    submarket: "random_index",
    pipSize: 2,
  },
  {
    symbol: "MOCK_FRX_EURUSD",
    displayName: "EUR/USD",
    category: "Forex",
    market: "forex",
    submarket: "major_pairs",
    pipSize: 5,
  },
  {
    symbol: "MOCK_FRX_GBPUSD",
    displayName: "GBP/USD",
    category: "Forex",
    market: "forex",
    submarket: "major_pairs",
    pipSize: 5,
  },
  {
    symbol: "MOCK_CRYPTO_BTCUSD",
    displayName: "BTC/USD",
    category: "Cryptocurrency",
    market: "cryptocurrency",
    submarket: "non_stable_coin",
    pipSize: 2,
  },
  {
    symbol: "MOCK_CMD_XAUUSD",
    displayName: "Gold/USD",
    category: "Commodities",
    market: "commodities",
    submarket: "metals",
    pipSize: 2,
  },
];

export const mockAccounts: TradingAccount[] = [
  {
    id: "DEMO-MOCK-001",
    type: "demo",
    currency: "USD",
    status: "active",
    balance: "10000",
    displayName: "Mock Demo",
  },
  {
    id: "REAL-MOCK-001",
    type: "real",
    currency: "USD",
    status: "active",
    balance: "0",
    displayName: "Mock Real",
  },
];

export const mockOpenPositions: Position[] = [];
