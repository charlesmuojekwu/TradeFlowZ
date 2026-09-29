import type { CurrencyCode, DecimalString, UnixTimestamp } from "@/types/common";

export type CopyRiskClassification = "low" | "medium" | "high" | "unknown";

export type CopyTraderProfile = {
  id: string;
  displayName: string;
  strategyCategory?: string;
  marketsTraded: string[];
  riskClassification: CopyRiskClassification;
  isDemoData?: boolean;
};

export type CopySettings = {
  traderId: string;
  copyAmount?: DecimalString;
  maximumStake?: DecimalString;
  dailyLossLimit?: DecimalString;
  sessionLossLimit?: DecimalString;
  maximumSimultaneousPositions?: number;
  allowedContractFamilies?: string[];
  currency?: CurrencyCode;
};

export type CopyActivity = {
  id: string;
  traderId: string;
  timestamp: UnixTimestamp;
  description: string;
  status: "pending" | "copied" | "skipped" | "error";
};
