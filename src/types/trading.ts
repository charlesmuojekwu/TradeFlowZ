import type { CurrencyCode, DecimalString, UnixTimestamp } from "@/types/common";

export type TradeDirection = "rise" | "fall";

export type DurationUnit = "ticks" | "seconds" | "minutes" | "hours" | "days";

export type DurationConstraint = {
  unit: DurationUnit;
  min?: number;
  max?: number;
};

export type SupportedContractType = {
  direction: TradeDirection;
  providerType: string;
  displayName: "Rise" | "Fall";
};

export type ContractAvailability = {
  symbol: string;
  contractTypes: SupportedContractType[];
  directions: TradeDirection[];
  durationConstraints: DurationConstraint[];
  durationUnits: DurationUnit[];
  minDuration?: number;
  maxDuration?: number;
  minStake?: DecimalString;
  maxStake?: DecimalString;
  isSellable: boolean;
  isAvailable: boolean;
};

export type ProposalRequest = {
  accountId?: string;
  symbol: string;
  direction: TradeDirection;
  stake: DecimalString;
  currency: CurrencyCode;
  duration: number;
  durationUnit: DurationUnit;
};

export type TradeProposal = {
  id: string;
  askPrice: DecimalString;
  payout: DecimalString;
  potentialProfit: DecimalString;
  spot: DecimalString;
  receivedAt: UnixTimestamp;
};

export type BuyRequest = {
  accountId: string;
  accountType: "demo" | "real";
  proposalId: string;
  proposal: TradeProposal;
  proposalRequest: ProposalRequest;
};

export type BuyResult = {
  contractId: string;
  purchasedAt: UnixTimestamp;
};

export type PositionStatus = "open" | "won" | "lost" | "sold" | "unknown";

export type Position = {
  contractId: string;
  source?: "manual" | "automation" | "copy";
  symbol: string;
  displaySymbol: string;
  direction: TradeDirection;
  stake: DecimalString;
  buyPrice: DecimalString;
  payout: DecimalString;
  entrySpot: DecimalString;
  currentSpot: DecimalString;
  profit: DecimalString;
  currency: CurrencyCode;
  purchaseTime: UnixTimestamp;
  expiryTime: UnixTimestamp;
  status: PositionStatus;
  isSellable: boolean;
  sellPrice?: DecimalString;
};

export type SellRequest = {
  accountId: string;
  contractId: string;
  buyPrice: DecimalString;
  sellPrice?: DecimalString;
};

export type SellResult = {
  contractId: string;
  soldFor: DecimalString;
  profit: DecimalString;
  soldAt: UnixTimestamp;
};

export type TradeHistoryFilter = {
  accountId: string;
  symbol?: string;
  direction?: TradeDirection;
  status?: PositionStatus;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
  cursor?: string;
};

export type TradeHistoryPage = {
  positions: Position[];
  total?: number;
  nextOffset?: number;
  nextCursor?: string;
};
