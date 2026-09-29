"use client";

import { XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { usePositionStore } from "@/stores";
import type { Position } from "@/types";

type PositionsPanelProps = {
  onClosePosition: (contractId: string) => Promise<void> | void;
};

export function PositionsPanel({ onClosePosition }: PositionsPanelProps) {
  const openPositions = usePositionStore((state) => state.openPositions);
  const settledPositions = usePositionStore((state) => state.settledPositions);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [confirmingContractId, setConfirmingContractId] = useState<string>();
  const [sellingContractIds, setSellingContractIds] = useState<string[]>([]);
  const rows = [...openPositions, ...settledPositions.slice(0, 5)];

  async function sellPosition(contractId: string) {
    if (sellingContractIds.includes(contractId)) {
      return;
    }

    setSellingContractIds((ids) => [...ids, contractId]);

    try {
      await onClosePosition(contractId);
      setConfirmingContractId(undefined);
    } finally {
      setSellingContractIds((ids) => ids.filter((id) => id !== contractId));
    }
  }

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <Panel className="min-h-52 rounded-none border-x-0 border-b-0">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Positions</h2>
          <p className="text-xs text-muted-foreground">
            {openPositions.length} open, {settledPositions.length} recent
          </p>
        </div>
        <div className="flex gap-2">
          <Badge tone="info">Open Positions</Badge>
          <Badge>Closed/Recent</Badge>
        </div>
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Market</th>
              <th className="px-4 py-3 font-medium">Direction</th>
              <th className="px-4 py-3 font-medium">Stake</th>
              <th className="px-4 py-3 font-medium">Buy price</th>
              <th className="px-4 py-3 font-medium">Entry spot</th>
              <th className="px-4 py-3 font-medium">Current</th>
              <th className="px-4 py-3 font-medium">Payout</th>
              <th className="px-4 py-3 font-medium">Live P/L</th>
              <th className="px-4 py-3 font-medium">Purchase</th>
              <th className="px-4 py-3 font-medium">Expiry</th>
              <th className="px-4 py-3 font-medium">Countdown</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-4 py-8 text-center text-muted-foreground">
                  No positions yet. Buy a demo Rise/Fall contract to see live P/L.
                </td>
              </tr>
            ) : (
              rows.map((position) => (
                <PositionRow
                  key={position.contractId}
                  position={position}
                  now={now}
                  isConfirming={confirmingContractId === position.contractId}
                  isSelling={sellingContractIds.includes(position.contractId)}
                  onCancelSell={() => setConfirmingContractId(undefined)}
                  onConfirmSell={() => void sellPosition(position.contractId)}
                  onRequestSell={() => setConfirmingContractId(position.contractId)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-4 lg:hidden">
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No positions yet.</p>
        ) : (
          rows.map((position) => (
            <div key={position.contractId} className="rounded-md border border-border bg-background p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{position.displaySymbol}</p>
                  <p className="text-xs text-muted-foreground">
                    {position.direction.toUpperCase()} · {position.contractId.slice(-8)}
                  </p>
                </div>
                <StatusBadge status={position.status} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                <MobileMetric label="Stake" value={formatMoney(position.stake, position.currency)} />
                <MobileMetric label="Buy price" value={formatMoney(position.buyPrice, position.currency)} />
                <MobileMetric label="Entry spot" value={position.entrySpot} />
                <MobileMetric label="Current" value={position.currentSpot} />
                <MobileMetric label="Payout" value={formatMoney(position.payout, position.currency)} />
                <MobileMetric label="P/L" value={formatMoney(position.profit, position.currency)} positive={Number(position.profit) >= 0} />
                <MobileMetric label="Purchase" value={formatTime(position.purchaseTime)} />
                <MobileMetric label="Expiry" value={formatTime(position.expiryTime)} />
                <MobileMetric label="Countdown" value={formatCountdown(position.expiryTime, now)} />
                <MobileMetric
                  label="Sell quote"
                  value={position.sellPrice ? formatMoney(position.sellPrice, position.currency) : "Unavailable"}
                />
              </div>
              <SellControls
                position={position}
                isConfirming={confirmingContractId === position.contractId}
                isSelling={sellingContractIds.includes(position.contractId)}
                onCancelSell={() => setConfirmingContractId(undefined)}
                onConfirmSell={() => void sellPosition(position.contractId)}
                onRequestSell={() => setConfirmingContractId(position.contractId)}
                mobile
              />
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

function PositionRow({
  position,
  now,
  isConfirming,
  isSelling,
  onCancelSell,
  onConfirmSell,
  onRequestSell,
}: {
  position: Position;
  now: number;
  isConfirming: boolean;
  isSelling: boolean;
  onCancelSell: () => void;
  onConfirmSell: () => void;
  onRequestSell: () => void;
}) {
  const profitNumber = Number(position.profit);

  return (
    <tr className="border-b border-border/70 last:border-0">
      <td className="px-4 py-3">
        <p className="font-medium">{position.displaySymbol}</p>
        <p className="text-xs text-muted-foreground">{position.contractId.slice(-8)}</p>
      </td>
      <td className="px-4 py-3">{position.direction.toUpperCase()}</td>
      <td className="px-4 py-3 font-mono">{formatMoney(position.stake, position.currency)}</td>
      <td className="px-4 py-3 font-mono">{formatMoney(position.buyPrice, position.currency)}</td>
      <td className="px-4 py-3 font-mono">{position.entrySpot}</td>
      <td className="px-4 py-3 font-mono">{position.currentSpot}</td>
      <td className="px-4 py-3 font-mono">{formatMoney(position.payout, position.currency)}</td>
      <td className={cn("px-4 py-3 font-mono", profitNumber >= 0 ? "text-emerald-400" : "text-rose-400")}>
        {formatMoney(position.profit, position.currency)}
      </td>
      <td className="px-4 py-3 text-muted-foreground">{formatTime(position.purchaseTime)}</td>
      <td className="px-4 py-3 text-muted-foreground">{formatTime(position.expiryTime)}</td>
      <td className="px-4 py-3 font-mono text-muted-foreground">{formatCountdown(position.expiryTime, now)}</td>
      <td className="px-4 py-3">
        <StatusBadge status={position.status} />
        <p className="mt-1 text-xs text-muted-foreground">
          {position.sellPrice ? `Sell quote ${formatMoney(position.sellPrice, position.currency)}` : "Sell unavailable"}
        </p>
      </td>
      <td className="px-4 py-3 text-right">
        <SellControls
          position={position}
          isConfirming={isConfirming}
          isSelling={isSelling}
          onCancelSell={onCancelSell}
          onConfirmSell={onConfirmSell}
          onRequestSell={onRequestSell}
        />
      </td>
    </tr>
  );
}

function SellControls({
  position,
  isConfirming,
  isSelling,
  mobile = false,
  onCancelSell,
  onConfirmSell,
  onRequestSell,
}: {
  position: Position;
  isConfirming: boolean;
  isSelling: boolean;
  mobile?: boolean;
  onCancelSell: () => void;
  onConfirmSell: () => void;
  onRequestSell: () => void;
}) {
  const canSell = position.status === "open" && position.isSellable && Boolean(position.sellPrice);

  if (!canSell) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  if (isConfirming) {
    return (
      <div className={cn("flex gap-2", mobile ? "mt-3" : "justify-end")} aria-live="polite">
        <Button
          variant="danger"
          size="sm"
          onClick={onConfirmSell}
          disabled={isSelling}
          className={mobile ? "flex-1" : undefined}
          aria-label={`Confirm selling ${position.displaySymbol} for ${formatMoney(position.sellPrice ?? "0", position.currency)}`}
        >
          <XCircle className="h-4 w-4" />
          {isSelling ? "Selling..." : `Sell ${formatMoney(position.sellPrice ?? "0", position.currency)}`}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancelSell} disabled={isSelling}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onRequestSell}
      disabled={isSelling}
      className={mobile ? "mt-3 w-full" : undefined}
      aria-label={`Review early close for ${position.displaySymbol}`}
    >
      <XCircle className="h-4 w-4" />
      {isSelling ? "Selling..." : `Close ${formatMoney(position.sellPrice ?? "0", position.currency)}`}
    </Button>
  );
}

function StatusBadge({ status }: { status: Position["status"] }) {
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

function formatCountdown(expiryTime: number, now: number) {
  const remaining = Math.max(0, expiryTime - now);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(timestamp * 1000));
}
