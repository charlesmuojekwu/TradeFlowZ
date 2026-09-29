"use client";

import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Select } from "@/components/ui/select";
import { toAppError, type AppError } from "@/lib/errors";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { providerBundle } from "@/providers";
import type { Market, Position, PositionStatus, TradingAccount } from "@/types";

type HistoryPanelProps = {
  account?: TradingAccount;
  isAuthenticated: boolean;
  markets: Market[];
};

type ResultFilter = "all" | "won" | "lost" | "sold" | "unknown";

const pageSize = 20;

export function HistoryPanel({ account, isAuthenticated, markets }: HistoryPanelProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError>();
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState<number>();
  const [marketFilter, setMarketFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const marketOptions = useMemo(() => markets.slice(0, 250), [markets]);
  const canGoPrevious = offset > 0;
  const canGoNext = total === undefined ? positions.length === pageSize : offset + pageSize < total;

  useEffect(() => {
    if (!account || !isAuthenticated) {
      setPositions([]);
      setTotal(undefined);
      return;
    }

    let isCurrent = true;
    const selectedAccount = account;

    async function loadHistory() {
      setIsLoading(true);
      setError(undefined);

      try {
        const page = await providerBundle.tradingProvider.getTradeHistory({
          accountId: selectedAccount.id,
          symbol: marketFilter === "all" ? undefined : marketFilter,
          status: resultFilter === "all" ? undefined : resultFilter,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          limit: pageSize,
          offset,
        });

        if (!isCurrent) {
          return;
        }

        setPositions(page.positions);
        setTotal(page.total);
      } catch (caught) {
        if (isCurrent) {
          setError(toAppError(caught));
          setPositions([]);
          setTotal(undefined);
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      isCurrent = false;
    };
  }, [account, dateFrom, dateTo, isAuthenticated, marketFilter, offset, refreshKey, resultFilter]);

  function resetAndSetMarket(value: string) {
    setOffset(0);
    setMarketFilter(value);
  }

  function resetAndSetResult(value: ResultFilter) {
    setOffset(0);
    setResultFilter(value);
  }

  function resetAndSetDateFrom(value: string) {
    setOffset(0);
    setDateFrom(value);
  }

  function resetAndSetDateTo(value: string) {
    setOffset(0);
    setDateTo(value);
  }

  return (
    <Panel className="flex min-h-0 flex-1 flex-col rounded-none border-x-0 border-b-0">
      <div className="border-b border-border px-4 py-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Trade History</h2>
            <p className="text-xs text-muted-foreground">
              {account ? `${account.type.toUpperCase()} ${account.id}` : "Authenticate to view provider history"}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[190px_130px_150px_150px_auto]">
            <Select
              aria-label="Filter market"
              value={marketFilter}
              onChange={(event) => resetAndSetMarket(event.target.value)}
            >
              <option value="all">All markets</option>
              {marketOptions.map((market) => (
                <option key={market.symbol} value={market.symbol}>
                  {market.displayName}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Filter result"
              value={resultFilter}
              onChange={(event) => resetAndSetResult(event.target.value as ResultFilter)}
            >
              <option value="all">All results</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="sold">Sold</option>
              <option value="unknown">Unknown</option>
            </Select>
            <Input
              type="date"
              value={dateFrom}
              onChange={(event) => resetAndSetDateFrom(event.target.value)}
              aria-label="From date"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(event) => resetAndSetDateTo(event.target.value)}
              aria-label="To date"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setRefreshKey((key) => key + 1)}
              disabled={!account || isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="border-b border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error.message}
        </div>
      ) : null}

      <div className="hidden min-h-0 flex-1 overflow-auto lg:block">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="sticky top-0 border-b border-border bg-card text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Market</th>
              <th className="px-4 py-3 font-medium">Direction</th>
              <th className="px-4 py-3 font-medium">Stake</th>
              <th className="px-4 py-3 font-medium">Buy price</th>
              <th className="px-4 py-3 font-medium">Payout</th>
              <th className="px-4 py-3 font-medium">Profit/Loss</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Purchase</th>
              <th className="px-4 py-3 font-medium">Close/Expiry</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <HistoryPlaceholder colSpan={9} label="Loading provider history..." />
            ) : positions.length === 0 ? (
              <HistoryPlaceholder colSpan={9} label={account ? "No history for these filters." : "Authenticate to view history."} />
            ) : (
              positions.map((position) => <HistoryRow key={position.contractId} position={position} />)
            )}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 overflow-auto p-4 lg:hidden">
        {isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading provider history...</p>
        ) : positions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {account ? "No history for these filters." : "Authenticate to view history."}
          </p>
        ) : (
          positions.map((position) => <HistoryCard key={position.contractId} position={position} />)
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <p className="text-xs text-muted-foreground">
          {total === undefined ? `Showing ${positions.length}` : `Showing ${offset + 1}-${offset + positions.length} of ${total}`}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canGoPrevious || isLoading}
            onClick={() => setOffset(Math.max(0, offset - pageSize))}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canGoNext || isLoading}
            onClick={() => setOffset(offset + pageSize)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Panel>
  );
}

function HistoryRow({ position }: { position: Position }) {
  return (
    <tr className="border-b border-border/70 last:border-0">
      <td className="px-4 py-3">
        <p className="font-medium">{position.displaySymbol}</p>
        <p className="text-xs text-muted-foreground">{position.contractId.slice(-8)}</p>
      </td>
      <td className="px-4 py-3">{position.direction.toUpperCase()}</td>
      <td className="px-4 py-3 font-mono">{formatMoney(position.stake, position.currency)}</td>
      <td className="px-4 py-3 font-mono">{formatMoney(position.buyPrice, position.currency)}</td>
      <td className="px-4 py-3 font-mono">{formatMoney(position.payout, position.currency)}</td>
      <td className={cn("px-4 py-3 font-mono", Number(position.profit) >= 0 ? "text-emerald-400" : "text-rose-400")}>
        {formatMoney(position.profit, position.currency)}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={position.status} />
      </td>
      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(position.purchaseTime)}</td>
      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(position.expiryTime)}</td>
    </tr>
  );
}

function HistoryCard({ position }: { position: Position }) {
  return (
    <article className="rounded-md border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{position.displaySymbol}</p>
          <p className="text-xs text-muted-foreground">
            {position.direction.toUpperCase()} · {position.contractId.slice(-8)}
          </p>
        </div>
        <StatusBadge status={position.status} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <MobileMetric label="Stake" value={formatMoney(position.stake, position.currency)} />
        <MobileMetric label="Buy price" value={formatMoney(position.buyPrice, position.currency)} />
        <MobileMetric label="Payout" value={formatMoney(position.payout, position.currency)} />
        <MobileMetric
          label="P/L"
          value={formatMoney(position.profit, position.currency)}
          positive={Number(position.profit) >= 0}
        />
        <MobileMetric label="Purchase" value={formatDateTime(position.purchaseTime)} />
        <MobileMetric label="Close/Expiry" value={formatDateTime(position.expiryTime)} />
      </div>
    </article>
  );
}

function HistoryPlaceholder({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-muted-foreground">
        {label}
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: PositionStatus }) {
  const tone = status === "won" ? "success" : status === "lost" ? "danger" : status === "sold" ? "warning" : "info";
  return <Badge tone={tone}>{status.toUpperCase()}</Badge>;
}

function MobileMetric({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-mono font-medium", positive !== undefined && (positive ? "text-emerald-400" : "text-rose-400"))}>
        {value}
      </p>
    </div>
  );
}

function formatDateTime(timestamp: number) {
  if (!timestamp) {
    return "-";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp * 1000));
}
