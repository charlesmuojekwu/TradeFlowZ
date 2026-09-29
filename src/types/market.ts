import type { DecimalString, UnixTimestamp } from "@/types/common";

export type Market = {
  symbol: string;
  displayName: string;
  category: string;
  market: string;
  submarket: string;
  pipSize: number;
};

export type PricePoint = {
  time: UnixTimestamp;
  value: DecimalString;
};

export type Tick = {
  symbol: string;
  displayName: string;
  price: DecimalString;
  pipSize: number;
  epoch: UnixTimestamp;
};

export type HistoricalPriceRequest = {
  symbol: string;
  count: number;
  granularity?: number;
};
