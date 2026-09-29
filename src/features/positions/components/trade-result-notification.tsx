"use client";

import { CheckCircle2, HelpCircle, X, XCircle } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores";
import type { TradeResultNotification as TradeResultNotificationModel } from "@/stores/ui-store";

const visibleForMs = 7_000;

export function TradeResultNotification() {
  const tradeResult = useUiStore((state) => state.tradeResult);
  const clearTradeResult = useUiStore((state) => state.clearTradeResult);

  useEffect(() => {
    if (!tradeResult) {
      return;
    }

    const timeout = window.setTimeout(clearTradeResult, visibleForMs);
    return () => window.clearTimeout(timeout);
  }, [clearTradeResult, tradeResult]);

  if (!tradeResult) {
    return null;
  }

  const Icon = getIcon(tradeResult.status);
  const toneClass = getToneClass(tradeResult.status);

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-50 w-[min(360px,calc(100vw-2rem))]">
      <section
        className={cn(
          "pointer-events-auto rounded-md border bg-card p-4 text-card-foreground shadow-2xl shadow-black/30",
          toneClass,
        )}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{getTitle(tradeResult.status)}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{tradeResult.displaySymbol}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Dismiss" onClick={clearTradeResult}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <ResultMetric label="Direction" value={tradeResult.direction.toUpperCase()} />
              <ResultMetric label="Stake" value={formatMoney(tradeResult.stake, tradeResult.currency)} />
              <ResultMetric label="Payout" value={formatMoney(tradeResult.payout, tradeResult.currency)} />
              <ResultMetric
                label="Final P/L"
                value={formatMoney(tradeResult.profit, tradeResult.currency)}
                positive={Number(tradeResult.profit) >= 0}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ResultMetric({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 font-mono font-semibold", positive !== undefined && (positive ? "text-emerald-300" : "text-rose-300"))}>
        {value}
      </p>
    </div>
  );
}

function getTitle(status: TradeResultNotificationModel["status"]) {
  const titles: Record<TradeResultNotificationModel["status"], string> = {
    won: "Trade Won",
    lost: "Trade Lost",
    sold: "Trade Sold",
    unknown: "Trade Status Unknown",
  };

  return titles[status];
}

function getIcon(status: TradeResultNotificationModel["status"]) {
  if (status === "won") {
    return CheckCircle2;
  }

  if (status === "lost") {
    return XCircle;
  }

  return HelpCircle;
}

function getToneClass(status: TradeResultNotificationModel["status"]) {
  if (status === "won") {
    return "border-emerald-500/40";
  }

  if (status === "lost") {
    return "border-rose-500/40";
  }

  if (status === "sold") {
    return "border-amber-500/40";
  }

  return "border-border";
}
