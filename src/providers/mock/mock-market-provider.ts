import type { MarketProvider } from "@/providers/interfaces";
import type { HistoricalPriceRequest, Market, PricePoint, Tick, Unsubscribe } from "@/types";

import { mockMarkets } from "./mock-data";

export class MockMarketProvider implements MarketProvider {
  async getMarkets(): Promise<Market[]> {
    return mockMarkets;
  }

  async getHistoricalPrices(request: HistoricalPriceRequest): Promise<PricePoint[]> {
    const start = Math.floor(Date.now() / 1000) - request.count * 60;

    return Array.from({ length: request.count }, (_, index) => ({
      time: start + index * (request.granularity ?? 60),
      value: (1000 + Math.sin(index / 4) * 8 + index * 0.15).toFixed(2),
    }));
  }

  async subscribeToTicks(symbol: string, onTick: (tick: Tick) => void): Promise<Unsubscribe> {
    const market = mockMarkets.find((item) => item.symbol === symbol) ?? mockMarkets[0];
    let price = market.market === "forex" ? 1.08 : market.market === "cryptocurrency" ? 65000 : 1000;

    const interval = window.setInterval(() => {
      const amplitude = market.market === "forex" ? 0.0002 : market.market === "cryptocurrency" ? 22 : 0.7;
      price += (Math.random() - 0.48) * amplitude;
      onTick({
        symbol: market.symbol,
        displayName: market.displayName,
        price: price.toFixed(market.pipSize),
        pipSize: market.pipSize,
        epoch: Math.floor(Date.now() / 1000),
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }
}
