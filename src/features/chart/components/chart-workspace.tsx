"use client";

import { Expand, LineChart, Minimize2, RefreshCcw, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useMarketChartData } from "@/features/chart/hooks/use-market-chart-data";
import { cn } from "@/lib/utils";
import type { ConnectionStatus, Market } from "@/types";

import { LightweightPriceChart } from "./lightweight-price-chart";

type ChartWorkspaceProps = {
  market?: Market;
  marketConnectionStatus: ConnectionStatus;
};

const timeframes = ["1m", "5m", "15m", "1h", "1d"] as const;

export function ChartWorkspace({ market, marketConnectionStatus }: ChartWorkspaceProps) {
  const [timeframe, setTimeframe] = useState<(typeof timeframes)[number]>("5m");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { connectionStatus, error, historicalData, isLoading, liveTick, priceChange } =
    useMarketChartData(market);

  const effectiveStatus = connectionStatus === "idle" ? marketConnectionStatus : connectionStatus;
  const isPositive = priceChange.direction !== "down";
  const price = liveTick?.price ?? historicalData.at(-1)?.value ?? "--";
  const lineColor = isPositive ? "#10b981" : "#fb7185";

  return (
    <Panel
      className={cn(
        "flex min-h-0 flex-1 flex-col rounded-none border-x-0 border-t-0 lg:border-x",
        isFullscreen && "fixed inset-0 z-50 border-0 bg-card",
      )}
    >
      <div className="flex flex-col gap-4 border-b border-border p-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-normal">{market?.displayName ?? "Loading market"}</h1>
            <Badge tone={statusTone(effectiveStatus)}>
              {effectiveStatus === "connected"
                ? "Open"
                : effectiveStatus === "connecting"
                  ? "Loading"
                  : effectiveStatus === "reconnecting"
                    ? "Reconnecting"
                    : "Disconnected"}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <span className="font-mono text-3xl font-semibold">{price}</span>
            <span className={cn("pb-1 text-sm font-medium", isPositive ? "text-emerald-400" : "text-rose-400")}>
              {isPositive ? "+" : ""}
              {priceChange.value} ({priceChange.percent}%)
            </span>
            <span className="pb-1 text-xs text-muted-foreground">Deriv market stream</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border border-border bg-background p-1">
            {timeframes.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTimeframe(item)}
                className={cn(
                  "h-8 rounded px-3 text-xs font-medium transition",
                  timeframe === item ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item}
              </button>
            ))}
          </div>
          <Button variant="outline" size="icon" aria-label="Refresh chart">
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" aria-label="Chart settings">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={isFullscreen ? "Exit fullscreen chart" : "Fullscreen chart"}
            onClick={() => setIsFullscreen((value) => !value)}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className={cn("relative min-h-[320px] flex-1 overflow-hidden p-4", isFullscreen && "min-h-0")}>
        <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-md border border-border bg-card/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur">
          <LineChart className="h-4 w-4" />
          TradingView Lightweight Charts
        </div>

        {isLoading ? (
          <div className="absolute inset-4 z-20 grid place-items-center rounded-md border border-border bg-background/70 text-sm text-muted-foreground backdrop-blur">
            Loading historical prices...
          </div>
        ) : null}

        {effectiveStatus === "reconnecting" || effectiveStatus === "disconnected" ? (
          <div className="absolute inset-x-4 top-14 z-20 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            {effectiveStatus === "reconnecting"
              ? "Market data is reconnecting. Last price may be stale."
              : "Market data is disconnected. Last price is stale."}
          </div>
        ) : null}

        {error ? (
          <div className="absolute inset-x-4 bottom-4 z-20 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error.message}
          </div>
        ) : null}

        <LightweightPriceChart data={historicalData} liveTick={liveTick} lineColor={lineColor} />
      </div>
    </Panel>
  );
}

function statusTone(status: ConnectionStatus) {
  if (status === "connected") {
    return "success";
  }

  if (status === "disconnected") {
    return "danger";
  }

  return "warning";
}
