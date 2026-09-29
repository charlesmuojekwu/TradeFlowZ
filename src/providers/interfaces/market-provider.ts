import type { AppError } from "@/lib/errors";
import type { HistoricalPriceRequest, Market, PricePoint, Tick } from "@/types";
import type { Unsubscribe } from "@/types/common";

export type TickHandler = (tick: Tick) => void;
export type ProviderErrorHandler = (error: AppError) => void;

export interface MarketProvider {
  getMarkets(): Promise<Market[]>;
  getHistoricalPrices(request: HistoricalPriceRequest): Promise<PricePoint[]>;
  subscribeToTicks(symbol: string, onTick: TickHandler, onError?: ProviderErrorHandler): Promise<Unsubscribe>;
}
