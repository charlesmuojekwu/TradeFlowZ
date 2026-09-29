"use client";

import { ChevronLeft, ChevronRight, Search, Star } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Market, Tick } from "@/types";

type MarketPanelProps = {
  markets: Market[];
  selectedSymbol?: string;
  currentTick?: Tick;
  favoriteSymbols: string[];
  recentSymbols: string[];
  isCollapsed: boolean;
  isLoading?: boolean;
  errorMessage?: string;
  connectionStatus?: string;
  onCollapsedChange: (isCollapsed: boolean) => void;
  onSelectMarket: (symbol: string) => void;
  onToggleFavorite: (symbol: string) => void;
};

const categoryOrder = ["Synthetic Indices", "Forex", "Cryptocurrency", "Commodities"];

export function MarketPanel({
  markets,
  selectedSymbol,
  currentTick,
  favoriteSymbols,
  recentSymbols,
  isCollapsed,
  isLoading = false,
  errorMessage,
  connectionStatus,
  onCollapsedChange,
  onSelectMarket,
  onToggleFavorite,
}: MarketPanelProps) {
  const [query, setQuery] = useState("");

  const groupedMarkets = useMemo(() => {
    const filtered = markets.filter((market) =>
      `${market.displayName} ${market.category}`.toLowerCase().includes(query.toLowerCase()),
    );

    const categories = [
      ...categoryOrder.filter((category) => filtered.some((market) => market.category === category)),
      ...Array.from(new Set(filtered.map((market) => market.category)))
        .filter((category) => !categoryOrder.includes(category))
        .sort((left, right) => left.localeCompare(right)),
    ];

    return categories
      .map((category) => ({
        category,
        markets: filtered
          .filter((market) => market.category === category)
          .sort((left, right) => left.displayName.localeCompare(right.displayName)),
      }))
      .filter((group) => group.markets.length > 0);
  }, [markets, query]);

  const selectedPrice = currentTick?.price;

  if (isCollapsed) {
    return (
      <aside className="hidden border-r border-border bg-card lg:flex lg:w-14 lg:flex-col lg:items-center lg:py-3">
        <Button variant="ghost" size="icon" aria-label="Expand market panel" onClick={() => onCollapsedChange(false)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </aside>
    );
  }

  return (
    <aside className="flex min-h-0 flex-col border-r border-border bg-card lg:w-80" aria-label="Market explorer">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <h2 className="text-sm font-semibold">Markets</h2>
          <p className="text-xs text-muted-foreground">
            {isLoading ? "Loading active symbols" : connectionStatus === "reconnecting" ? "Reconnecting" : "Active symbols"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Collapse market panel"
          className="hidden lg:inline-flex"
          onClick={() => onCollapsedChange(true)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4 overflow-y-auto p-4">
        <label className="relative block">
          <span className="sr-only">Search markets</span>
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search markets"
            className="pl-9"
          />
        </label>

        {errorMessage ? (
          <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-md border border-border bg-secondary/40" />
            ))}
          </div>
        ) : null}

        <MarketStrip
          title="Favorites"
          markets={markets.filter((market) => favoriteSymbols.includes(market.symbol))}
          selectedSymbol={selectedSymbol}
          currentPrice={selectedPrice}
          onSelectMarket={onSelectMarket}
        />

        <MarketStrip
          title="Recently viewed"
          markets={markets.filter((market) => recentSymbols.includes(market.symbol))}
          selectedSymbol={selectedSymbol}
          currentPrice={selectedPrice}
          onSelectMarket={onSelectMarket}
        />

        {!isLoading && groupedMarkets.length === 0 ? (
          <div className="rounded-md border border-border bg-background px-3 py-6 text-center text-sm text-muted-foreground">
            No markets match your search.
          </div>
        ) : null}

        <div className="space-y-4">
          {groupedMarkets.map((group) => (
            <div key={group.category}>
              <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">{group.category}</p>
              <div className="space-y-1">
                {group.markets.map((market, index) => (
                  <div
                    key={market.symbol}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition",
                      market.symbol === selectedSymbol
                        ? "border-primary/50 bg-primary/10"
                        : "border-transparent hover:border-border hover:bg-secondary/60",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectMarket(market.symbol)}
                      className="min-w-0 flex-1 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-current={market.symbol === selectedSymbol ? "true" : undefined}
                    >
                      <span className="block truncate text-sm font-medium">{market.displayName}</span>
                      <span className="block text-xs text-muted-foreground">{market.submarket.replaceAll("_", " ")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectMarket(market.symbol)}
                      className="rounded-sm text-right outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`Select ${market.displayName}`}
                    >
                      <span className="block font-mono text-xs">
                        {formatMarketPrice(market, currentTick)}
                      </span>
                      <span className={index % 2 === 0 ? "text-xs text-emerald-400" : "text-xs text-rose-400"}>
                        {market.symbol === currentTick?.symbol ? "Live" : "Ready"}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`${favoriteSymbols.includes(market.symbol) ? "Remove" : "Add"} ${market.displayName} ${favoriteSymbols.includes(market.symbol) ? "from" : "to"} favorites`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleFavorite(market.symbol);
                      }}
                      className="rounded-sm text-muted-foreground outline-none hover:text-amber-300 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Star
                        className={cn(
                          "h-4 w-4",
                          favoriteSymbols.includes(market.symbol) && "fill-amber-300 text-amber-300",
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function MarketStrip({
  title,
  markets,
  selectedSymbol,
  currentPrice,
  onSelectMarket,
}: {
  title: string;
  markets: Market[];
  selectedSymbol?: string;
  currentPrice?: string;
  onSelectMarket: (symbol: string) => void;
}) {
  if (markets.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">{title}</p>
      <div className="flex gap-2 overflow-x-auto">
        {markets.map((market) => (
          <button
            key={market.symbol}
            type="button"
            onClick={() => onSelectMarket(market.symbol)}
            aria-current={market.symbol === selectedSymbol ? "true" : undefined}
            className={cn(
              "min-w-36 rounded-md border px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
              market.symbol === selectedSymbol ? "border-primary/50 bg-primary/10" : "border-border bg-background",
            )}
          >
            <span className="block truncate text-xs font-medium">{market.displayName}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {market.symbol === selectedSymbol ? currentPrice ?? "Awaiting tick" : "Select"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function formatMarketPrice(market: Market, currentTick: Tick | undefined) {
  if (market.symbol === currentTick?.symbol) {
    return currentTick.price;
  }

  return "--";
}
