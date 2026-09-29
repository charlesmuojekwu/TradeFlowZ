import { env } from "@/config/env";
import { mapActiveSymbol, mapHistory, mapTick } from "@/deriv/mappers/market-mapper";
import { DerivPublicWebSocketClient } from "@/deriv/websocket";
import { AppError, toAppError } from "@/lib/errors";
import type { MarketProvider, ProviderErrorHandler, TickHandler } from "@/providers/interfaces";
import type { HistoricalPriceRequest, Market, PricePoint, Unsubscribe } from "@/types";

export class DerivMarketProvider implements MarketProvider {
  private readonly client: DerivPublicWebSocketClient;
  private marketCache = new Map<string, Market>();

  constructor(client = new DerivPublicWebSocketClient({ url: env.NEXT_PUBLIC_DERIV_PUBLIC_WS_URL })) {
    this.client = client;
  }

  async getMarkets(): Promise<Market[]> {
    const response = await this.client.request({ active_symbols: "brief" });
    const rawSymbols = response.active_symbols;

    if (!Array.isArray(rawSymbols)) {
      throw new AppError({
        code: "MARKET_UNAVAILABLE",
        title: "Unable to load markets",
        message: "Deriv did not return an active market list.",
        retryable: true,
      });
    }

    const markets = rawSymbols
      .map((symbol) => mapActiveSymbol(symbol as Record<string, unknown>))
      .filter((market): market is Market => Boolean(market))
      .sort((left, right) => {
        const categorySort = left.category.localeCompare(right.category);
        return categorySort === 0 ? left.displayName.localeCompare(right.displayName) : categorySort;
      });

    this.marketCache = new Map(markets.map((market) => [market.symbol, market]));
    return markets;
  }

  async getHistoricalPrices(request: HistoricalPriceRequest): Promise<PricePoint[]> {
    const response = await this.client.request({
      ticks_history: request.symbol,
      count: request.count,
      end: "latest",
      style: "ticks",
      adjust_start_time: 1,
      subscribe: 0,
      ...(request.granularity ? { granularity: request.granularity } : {}),
    });

    return mapHistory((response.history ?? {}) as Record<string, unknown>);
  }

  async subscribeToTicks(
    symbol: string,
    onTick: TickHandler,
    onError?: ProviderErrorHandler,
  ): Promise<Unsubscribe> {
    const market = this.marketCache.get(symbol);

    const unsubscribe = await this.client.subscribe(
      `ticks:${symbol}`,
      { ticks: symbol },
      (message) => {
        if (message.tick && typeof message.tick === "object") {
          onTick(mapTick(message.tick as Record<string, unknown>, market));
        }
      },
      (error) => onError?.(error),
    );

    return () => {
      void unsubscribe().catch((caught) => onError?.(toAppError(caught)));
    };
  }
}
