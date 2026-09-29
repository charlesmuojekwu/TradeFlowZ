import type { DecimalString, UnixTimestamp } from "@/types/common";
import type { DurationUnit, TradeDirection } from "@/types/trading";

export type StrategyCompatibility = "manual-only" | "automation-ready" | "integration-required";

export type StrategyTrigger = {
  kind: "price-movement" | "market-session" | "manual-confirmation" | "custom";
  label: string;
  value?: string;
};

export type StrategyAction = {
  contractFamily: "rise-fall" | "digits" | "accumulators" | "multipliers";
  symbol: string;
  direction?: TradeDirection;
  duration?: number;
  durationUnit?: DurationUnit;
  stake: DecimalString;
};

export type StrategyRisk = {
  maximumStake?: DecimalString;
  maximumConsecutiveLosses?: number;
  sessionTakeProfit?: DecimalString;
  sessionStopLoss?: DecimalString;
  maximumTrades?: number;
};

export type SavedStrategy = {
  id: string;
  name: string;
  trigger: StrategyTrigger;
  action: StrategyAction;
  risk: StrategyRisk;
  compatibility: StrategyCompatibility;
  createdAt: UnixTimestamp;
  updatedAt: UnixTimestamp;
};
