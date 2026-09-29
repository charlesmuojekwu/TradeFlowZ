"use client";

import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import { useId } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Select } from "@/components/ui/select";
import type { AppError } from "@/lib/errors";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type {
  ConnectionStatus,
  ContractAvailability,
  DurationUnit,
  TradeDirection,
  TradeProposal,
  TradingAccount,
} from "@/types";

type TradeTicketProps = {
  account?: TradingAccount;
  authenticatedConnectionStatus: ConnectionStatus;
  contractAvailability?: ContractAvailability;
  contractAvailabilityError?: AppError;
  direction: TradeDirection;
  duration: number;
  durationUnit: DurationUnit;
  executionState: string;
  isContractAvailabilityLoading?: boolean;
  proposal?: TradeProposal;
  proposalState: string;
  stake: string;
  onBuy: () => void;
  onDirectionChange: (direction: TradeDirection) => void;
  onDurationChange: (duration: number) => void;
  onDurationUnitChange: (durationUnit: DurationUnit) => void;
  onStakeChange: (stake: string) => void;
};

export function TradeTicket({
  account,
  authenticatedConnectionStatus,
  contractAvailability,
  contractAvailabilityError,
  direction,
  duration,
  durationUnit,
  executionState,
  isContractAvailabilityLoading = false,
  proposal,
  proposalState,
  stake,
  onBuy,
  onDirectionChange,
  onDurationChange,
  onDurationUnitChange,
  onStakeChange,
}: TradeTicketProps) {
  const formId = useId();
  const stakeId = `${formId}-stake`;
  const stakeErrorId = `${formId}-stake-error`;
  const durationId = `${formId}-duration`;
  const durationUnitId = `${formId}-duration-unit`;
  const durationErrorId = `${formId}-duration-error`;
  const stakeNumber = Number(stake);
  const minStake = Number(contractAvailability?.minStake ?? 1);
  const maxStake = contractAvailability?.maxStake ? Number(contractAvailability.maxStake) : undefined;
  const hasValidStake =
    Number.isFinite(stakeNumber) &&
    stakeNumber >= minStake &&
    (maxStake === undefined || stakeNumber <= maxStake);
  const selectedDurationConstraint = contractAvailability?.durationConstraints.find(
    (constraint) => constraint.unit === durationUnit,
  );
  const hasValidDuration =
    duration > 0 &&
    (selectedDurationConstraint?.min === undefined || duration >= selectedDurationConstraint.min) &&
    (selectedDurationConstraint?.max === undefined || duration <= selectedDurationConstraint.max);
  const canUseRise = contractAvailability?.directions.includes("rise") ?? true;
  const canUseFall = contractAvailability?.directions.includes("fall") ?? true;
  const durationUnits = contractAvailability?.durationUnits.length
    ? contractAvailability.durationUnits
    : (["ticks", "minutes", "hours"] as DurationUnit[]);
  const isLoadingProposal = proposalState === "loading";
  const isStaleProposal = proposalState === "stale";
  const isBuying = executionState === "buying";
  const isSuccess = executionState === "success";
  const isDemoAccount = account?.type === "demo";
  const hasTradingConnection = authenticatedConnectionStatus === "connected";
  const isConfigurationAvailable = contractAvailability?.isAvailable ?? true;
  const canTrade = Boolean(
    account &&
      isDemoAccount &&
      hasTradingConnection &&
      proposal &&
      hasValidStake &&
      hasValidDuration &&
      isConfigurationAvailable &&
      !isContractAvailabilityLoading &&
      !isBuying &&
      proposalState === "ready",
  );

  return (
    <Panel className="flex min-h-0 flex-col rounded-none border-r-0 border-t-0 lg:w-88 xl:w-96">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Trade Ticket</h2>
            <p className="text-xs text-muted-foreground">Rise/Fall contract</p>
          </div>
          <Badge tone={account?.type === "real" ? "danger" : "info"}>{account?.type.toUpperCase() ?? "DEMO"}</Badge>
        </div>
      </div>

      <div className="space-y-5 overflow-y-auto p-4 pb-24 lg:pb-4">
        {isContractAvailabilityLoading ? (
          <div className="rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
            Loading contract configuration...
          </div>
        ) : null}

        {contractAvailabilityError ? (
          <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {contractAvailabilityError.message}
          </div>
        ) : null}

        {!isContractAvailabilityLoading && contractAvailability && !contractAvailability.isAvailable ? (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            Rise/Fall contracts are not available for this market.
          </div>
        ) : null}

        <fieldset>
          <legend className="mb-2 text-xs font-medium uppercase text-muted-foreground">Direction</legend>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={direction === "fall" ? "danger" : "outline"}
              onClick={() => onDirectionChange("fall")}
              disabled={!canUseFall || isContractAvailabilityLoading}
              aria-pressed={direction === "fall"}
              className="h-11"
            >
              <ArrowDown className="h-4 w-4" />
              Fall
            </Button>
            <Button
              type="button"
              variant={direction === "rise" ? "success" : "outline"}
              onClick={() => onDirectionChange("rise")}
              disabled={!canUseRise || isContractAvailabilityLoading}
              aria-pressed={direction === "rise"}
              className="h-11"
            >
              <ArrowUp className="h-4 w-4" />
              Rise
            </Button>
          </div>
        </fieldset>

        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase text-muted-foreground" id={`${stakeId}-label`}>Stake</span>
          <div className="grid grid-cols-[1fr_92px] gap-2">
            <Input
              id={stakeId}
              inputMode="decimal"
              autoComplete="off"
              value={stake}
              onChange={(event) => onStakeChange(event.target.value)}
              aria-invalid={!hasValidStake}
              aria-labelledby={`${stakeId}-label`}
              aria-describedby={!hasValidStake ? stakeErrorId : undefined}
            />
            <Input value={account?.currency ?? "USD"} readOnly aria-label="Currency" />
          </div>
          {!hasValidStake ? (
            <span id={stakeErrorId} className="mt-1 block text-xs text-rose-300">
              Stake must be between {contractAvailability?.minStake ?? "1"} and {contractAvailability?.maxStake ?? "available balance"}.
            </span>
          ) : null}
        </label>

        <div>
          <span className="mb-2 block text-xs font-medium uppercase text-muted-foreground" id={`${durationId}-label`}>Duration</span>
          <div className="grid grid-cols-[1fr_128px] gap-2">
            <Input
              id={durationId}
              type="number"
              inputMode="numeric"
              min={1}
              value={duration}
              onChange={(event) => onDurationChange(Number(event.target.value))}
              aria-invalid={!hasValidDuration}
              aria-labelledby={`${durationId}-label`}
              aria-describedby={!hasValidDuration ? durationErrorId : undefined}
            />
            <Select
              id={durationUnitId}
              value={durationUnit}
              onChange={(event) => onDurationUnitChange(event.target.value as DurationUnit)}
              aria-label="Duration unit"
            >
              {durationUnits.map((unit) => (
                <option key={unit} value={unit}>
                  {durationUnitLabel(unit)}
                </option>
              ))}
            </Select>
          </div>
          {!hasValidDuration && selectedDurationConstraint ? (
            <span id={durationErrorId} className="mt-1 block text-xs text-rose-300">
              {durationUnitLabel(durationUnit)} duration must be between {selectedDurationConstraint.min ?? 1} and{" "}
              {selectedDurationConstraint.max ?? "provider max"}.
            </span>
          ) : null}
        </div>

        <div className="rounded-md border border-border bg-background p-4" aria-live="polite">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Quote state</span>
            <Badge tone={proposalState === "ready" ? "success" : proposalState === "error" ? "danger" : "warning"}>
              {isLoadingProposal ? "Pricing" : isStaleProposal ? "Stale" : proposalState}
            </Badge>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Metric
              label="Ask price"
              value={proposal && account ? formatMoney(proposal.askPrice, account.currency) : "--"}
              loading={isLoadingProposal}
            />
            <Metric
              label="Potential payout"
              value={proposal && account ? formatMoney(proposal.payout, account.currency) : "--"}
              loading={isLoadingProposal}
            />
            <Metric
              label="Potential profit"
              value={proposal && account ? formatMoney(proposal.potentialProfit, account.currency) : "--"}
              positive
              loading={isLoadingProposal}
            />
            <Metric
              label="Current spot"
              value={proposal?.spot ?? "--"}
              loading={isLoadingProposal}
            />
          </div>
          {isStaleProposal ? (
            <p className="mt-3 text-xs text-amber-200">Quote expired. Change an input to refresh pricing.</p>
          ) : null}
          {proposalState === "error" ? (
            <p className="mt-3 text-xs text-rose-300">Quote unavailable for this configuration.</p>
          ) : null}
          {isSuccess ? (
            <p className="mt-3 text-xs text-emerald-300">Trade bought. Position added to open positions.</p>
          ) : null}
        </div>

        {!isDemoAccount && account ? (
          <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            Real-money trading is disabled for this phase. Select a DEMO account.
          </div>
        ) : null}

        {isDemoAccount && !hasTradingConnection ? (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            Waiting for authenticated trading connection.
          </div>
        ) : null}

        <div className="sticky bottom-0 -mx-4 border-t border-border bg-card/95 p-4 backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0">
          <Button
            type="button"
            size="lg"
            variant={direction === "rise" ? "success" : "danger"}
            disabled={!canTrade}
            onClick={onBuy}
            className="w-full"
            aria-describedby={proposalState === "ready" && proposal ? `${formId}-quote-summary` : undefined}
          >
            {isBuying ? <Loader2 className="h-4 w-4 animate-spin" /> : direction === "rise" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            {isBuying ? "Buying..." : `Buy ${direction === "rise" ? "Rise" : "Fall"}`}
          </Button>
          {proposalState === "ready" && proposal && account ? (
            <p id={`${formId}-quote-summary`} className="sr-only">
              Ask price {formatMoney(proposal.askPrice, account.currency)}, payout {formatMoney(proposal.payout, account.currency)}.
            </p>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

function durationUnitLabel(unit: DurationUnit) {
  const labels: Record<DurationUnit, string> = {
    ticks: "Ticks",
    seconds: "Seconds",
    minutes: "Minutes",
    hours: "Hours",
    days: "Days",
  };

  return labels[unit];
}

function Metric({
  label,
  value,
  positive = false,
  loading = false,
}: {
  label: string;
  value: string;
  positive?: boolean;
  loading?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-mono text-sm font-semibold", positive && "text-emerald-400")}>
        {loading ? "..." : value}
      </p>
    </div>
  );
}
