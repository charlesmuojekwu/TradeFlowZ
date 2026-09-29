import type { CurrencyCode, DecimalString, UnixTimestamp } from "@/types/common";

export type AutomationRunStatus = "running" | "paused" | "stopped" | "completed" | "error";

export type AutomationStrategyParameter = {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "select";
  required: boolean;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  defaultValue?: string | number | boolean;
  description?: string;
};

export type AutomationStrategy = {
  id: string;
  name: string;
  description?: string;
  supportedMarkets?: string[];
  supportedContracts?: string[];
  parameters: AutomationStrategyParameter[];
};

export type AutomationContractTemplate = {
  symbol: string;
  contractType: string;
  stake: DecimalString;
  currency: CurrencyCode;
  duration?: number;
  durationUnit?: string;
  barrier?: string;
  barrier2?: string;
  growthRate?: number;
  multiplier?: number;
  selectedTick?: number;
  takeProfit?: DecimalString;
  stopLoss?: DecimalString;
};

export type AutomationStartRequest = {
  strategyId: string;
  accountId: string;
  contract: AutomationContractTemplate;
  parameters: Record<string, string | number | boolean>;
};

export type AutomationRun = {
  id: string;
  strategyId: string;
  accountId: string;
  symbol?: string;
  status: AutomationRunStatus;
  startedAt?: UnixTimestamp;
  contractCount?: number;
  openContractCount?: number;
  wins?: number;
  losses?: number;
  realizedProfit?: DecimalString;
  currentExposure?: DecimalString;
  totalStake?: DecimalString;
  totalPayout?: DecimalString;
  currency?: CurrencyCode;
  providerMessage?: string;
  stopReason?: string;
  stopTime?: UnixTimestamp;
};
