"use client";

import { AlertTriangle, Bot, Loader2, Pause, Play, RefreshCw, Square } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAuthenticatedTradingConnection } from "@/features/accounts/hooks/use-authenticated-trading-connection";
import { toAppError } from "@/lib/errors";
import { formatMoney } from "@/lib/money";
import { providerBundle } from "@/providers";
import { useAccountStore, useAutomationStore, useMarketStore } from "@/stores";
import type {
  AutomationStrategyParameter,
  ContractAvailability,
  DurationUnit,
  Market,
  TradingAccount,
  Unsubscribe,
} from "@/types";

import { FeatureState, WorkCard, WorkGrid } from "./feature-state";

type ParameterValue = string | number | boolean;
type ActionState = "idle" | "starting" | "pausing" | "resuming" | "stopping";

const defaultContractTypes = ["CALL", "PUT"] as const;

export function AutomationWorkspace() {
  const accounts = useAccountStore((state) => state.accounts);
  const selectedAccountId = useAccountStore((state) => state.selectedAccountId);
  const selectedAccount = accounts.find((account) => account.id === selectedAccountId);
  const setSession = useAccountStore((state) => state.setSession);
  const setAccounts = useAccountStore((state) => state.setAccounts);
  const selectAccount = useAccountStore((state) => state.selectAccount);
  const authenticatedConnectionStatus = useAccountStore((state) => state.authenticatedConnectionStatus);
  const authenticatedConnectionError = useAccountStore((state) => state.authenticatedConnectionError);

  const markets = useMarketStore((state) => state.markets);
  const selectedSymbol = useMarketStore((state) => state.selectedSymbol);
  const setMarkets = useMarketStore((state) => state.setMarkets);
  const selectMarket = useMarketStore((state) => state.selectMarket);
  const setMarketConnectionStatus = useMarketStore((state) => state.setConnectionStatus);

  const {
    strategies,
    runs,
    selectedStrategyId,
    selectedRunId,
    isLoadingStrategies,
    isLoadingRuns,
    error,
    setStrategies,
    setRuns,
    upsertRun,
    selectStrategy,
    selectRun,
    setLoadingStrategies,
    setLoadingRuns,
    setError,
  } = useAutomationStore();

  const [contractType, setContractType] = useState<string>("CALL");
  const [stake, setStake] = useState("1");
  const [duration, setDuration] = useState("5");
  const [durationUnit, setDurationUnit] = useState("m");
  const [parameterValues, setParameterValues] = useState<Record<string, ParameterValue>>({});
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [localMessage, setLocalMessage] = useState<string>();
  const [contractAvailability, setContractAvailability] = useState<ContractAvailability>();

  const subscriptionRef = useRef<Unsubscribe | undefined>(undefined);

  const selectedStrategy = strategies.find((strategy) => strategy.id === selectedStrategyId);
  const selectedMarket = markets.find((market) => market.symbol === selectedSymbol);
  const selectedRun = runs.find((run) => run.id === selectedRunId);
  const activeRuns = runs.filter((run) => run.status === "running" || run.status === "paused");
  const supportedContracts = useMemo(
    () => supportedContractsFor(selectedStrategy?.supportedContracts, contractAvailability),
    [contractAvailability, selectedStrategy?.supportedContracts],
  );
  const durationUnits = useMemo(() => durationUnitsFor(contractAvailability), [contractAvailability]);

  useAuthenticatedTradingConnection({
    isAuthenticated: accounts.length > 0,
    selectedAccount,
  });

  useEffect(() => {
    let isCurrent = true;

    async function loadFoundation() {
      setError(undefined);

      try {
        const [session, nextAccounts, nextMarkets] = await Promise.all([
          providerBundle.accountProvider.getSession(),
          providerBundle.accountProvider.getAccounts(),
          providerBundle.marketProvider.getMarkets(),
        ]);

        if (!isCurrent) return;
        setSession(session);
        setAccounts(nextAccounts);
        setMarkets(nextMarkets);
        setMarketConnectionStatus("connected");
      } catch (caught) {
        if (!isCurrent) return;
        setError(toAppError(caught, {
          title: "Automation setup unavailable",
          message: "Unable to load account or market data for automation.",
          retryable: true,
        }));
        setMarketConnectionStatus("disconnected");
      }
    }

    void loadFoundation();

    return () => {
      isCurrent = false;
    };
  }, [setAccounts, setError, setMarketConnectionStatus, setMarkets, setSession]);

  useEffect(() => {
    let isCurrent = true;
    setLoadingStrategies(true);

    providerBundle.automationProvider
      .listStrategies()
      .then((nextStrategies) => {
        if (isCurrent) {
          setStrategies(nextStrategies);
        }
      })
      .catch((caught) => {
        if (isCurrent) {
          setError(toAppError(caught, { title: "Strategies unavailable", retryable: true }));
        }
      })
      .finally(() => {
        if (isCurrent) {
          setLoadingStrategies(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [setError, setLoadingStrategies, setStrategies]);

  useEffect(() => {
    if (!selectedStrategy) {
      setParameterValues({});
      return;
    }

    setParameterValues((current) => {
      const next: Record<string, ParameterValue> = {};
      selectedStrategy.parameters.forEach((parameter) => {
        next[parameter.key] = current[parameter.key] ?? defaultParameterValue(parameter);
      });
      return next;
    });

    if (!selectedStrategy.supportedContracts?.includes(contractType)) {
      setContractType(supportedContracts[0] ?? "CALL");
    }
  }, [contractType, selectedStrategy, supportedContracts]);

  useEffect(() => {
    if (!supportedContracts.includes(contractType)) {
      setContractType(supportedContracts[0] ?? "CALL");
    }
  }, [contractType, supportedContracts]);

  useEffect(() => {
    if (!durationUnits.includes(durationUnit)) {
      setDurationUnit(durationUnits[0] ?? "m");
    }
  }, [durationUnit, durationUnits]);

  useEffect(() => {
    if (!selectedMarket) {
      setContractAvailability(undefined);
      return;
    }

    let isCurrent = true;

    providerBundle.tradingProvider
      .getContractAvailability(selectedMarket.symbol)
      .then((availability) => {
        if (isCurrent) {
          setContractAvailability(availability);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setContractAvailability(undefined);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedMarket]);

  useEffect(() => {
    if (!selectedAccount) {
      setRuns([]);
      return;
    }

    let isCurrent = true;
    setLoadingRuns(true);

    providerBundle.automationProvider
      .listRuns(selectedAccount.id)
      .then((nextRuns) => {
        if (isCurrent) {
          setRuns(nextRuns);
        }
      })
      .catch((caught) => {
        if (isCurrent) {
          setError(toAppError(caught, { title: "Automation runs unavailable", retryable: true }));
        }
      })
      .finally(() => {
        if (isCurrent) {
          setLoadingRuns(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedAccount, setError, setLoadingRuns, setRuns]);

  useEffect(() => {
    void subscriptionRef.current?.();
    subscriptionRef.current = undefined;

    if (!selectedAccount || !selectedRun || (selectedRun.status !== "running" && selectedRun.status !== "paused")) {
      return;
    }

    let isCurrent = true;
    providerBundle.automationProvider
      .subscribeToRun(
        selectedAccount.id,
        selectedRun.id,
        (run) => {
          if (isCurrent) {
            upsertRun(run);
          }
        },
        (caught) => {
          if (isCurrent) {
            setError(caught);
          }
        },
      )
      .then((unsubscribe) => {
        if (isCurrent) {
          subscriptionRef.current = unsubscribe;
        } else {
          void unsubscribe();
        }
      })
      .catch((caught) => {
        if (isCurrent) {
          setError(toAppError(caught, { title: "Run stream unavailable", retryable: true }));
        }
      });

    return () => {
      isCurrent = false;
      void subscriptionRef.current?.();
      subscriptionRef.current = undefined;
    };
  }, [selectedAccount, selectedRun, setError, upsertRun]);

  const validationMessage = useMemo(
    () => validateStart({
      account: selectedAccount,
      market: selectedMarket,
      strategySelected: Boolean(selectedStrategy),
      stake,
      duration,
      contractType,
      supportedContracts,
      authenticatedConnectionStatus,
    }),
    [authenticatedConnectionStatus, contractType, duration, selectedAccount, selectedMarket, selectedStrategy, stake, supportedContracts],
  );

  async function startAutomation() {
    setLocalMessage(undefined);
    setError(undefined);

    const validation = validateStart({
      account: selectedAccount,
      market: selectedMarket,
      strategySelected: Boolean(selectedStrategy),
      stake,
      duration,
      contractType,
      supportedContracts,
      authenticatedConnectionStatus,
    });

    if (validation || !selectedAccount || !selectedMarket || !selectedStrategy) {
      setLocalMessage(validation ?? "Automation configuration is incomplete.");
      return;
    }

    setActionState("starting");
    try {
      const run = await providerBundle.automationProvider.startStrategy({
        accountId: selectedAccount.id,
        strategyId: selectedStrategy.id,
        contract: {
          symbol: selectedMarket.symbol,
          contractType,
          stake,
          currency: selectedAccount.currency,
          duration: Number(duration),
          durationUnit,
        },
        parameters: parameterValues,
      });
      upsertRun(run);
      selectRun(run.id);
      setLocalMessage("Automation run started on your demo account.");
    } catch (caught) {
      setError(toAppError(caught, { title: "Automation start failed", retryable: false }));
    } finally {
      setActionState("idle");
    }
  }

  async function updateRun(action: Exclude<ActionState, "idle" | "starting">) {
    if (!selectedAccount || !selectedRun) return;
    if (action === "stopping" && !window.confirm("Stop this automated run? Open contracts may continue until expiry.")) {
      return;
    }

    setActionState(action);
    setError(undefined);
    setLocalMessage(undefined);

    try {
      const nextRun =
        action === "pausing"
          ? await providerBundle.automationProvider.pauseRun(selectedAccount.id, selectedRun.id)
          : action === "resuming"
            ? await providerBundle.automationProvider.resumeRun(selectedAccount.id, selectedRun.id)
            : await providerBundle.automationProvider.stopRun(selectedAccount.id, selectedRun.id);

      upsertRun(nextRun);
      setLocalMessage(`Automation run ${nextRun.status}.`);
    } catch (caught) {
      setError(toAppError(caught, { title: "Run action failed", retryable: true }));
    } finally {
      setActionState("idle");
    }
  }

  return (
    <FeatureState
      eyebrow="Automated Trading"
      title="Run Deriv-supported automated strategies with explicit risk controls."
      description="Strategies, parameters, run state, and lifecycle controls are provider sourced. Automation is enabled only for demo accounts in this phase."
      status="available"
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <WorkCard
          title="Strategy discovery"
          description="Loaded from Deriv auto_list_strategies, with no synthetic performance claims."
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-64">
              <p className="text-sm text-muted-foreground">Account</p>
              <Select
                value={selectedAccount?.id ?? ""}
                onChange={(event) => selectAccount(event.target.value)}
                aria-label="Automation account"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.displayName ?? account.id} ({account.type.toUpperCase()})
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone={selectedAccount?.type === "demo" ? "success" : "danger"}>
                {selectedAccount ? selectedAccount.type.toUpperCase() : "NO ACCOUNT"}
              </Badge>
              <Badge tone={authenticatedConnectionStatus === "connected" ? "success" : "warning"}>
                {authenticatedConnectionStatus}
              </Badge>
            </div>
          </div>

          {selectedAccount?.type === "real" ? (
            <Notice tone="danger">
              Real account automation is disabled in this phase. Select a demo account to start automated runs.
            </Notice>
          ) : null}

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {isLoadingStrategies ? (
              <LoadingTile label="Loading provider strategies" />
            ) : strategies.length > 0 ? (
              strategies.map((strategy) => (
                <button
                  key={strategy.id}
                  type="button"
                  onClick={() => selectStrategy(strategy.id)}
                  className={`rounded-md border p-3 text-left transition ${
                    strategy.id === selectedStrategyId
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-primary/60"
                  }`}
                >
                  <p className="text-sm font-semibold">{strategy.name}</p>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">
                    {strategy.description ?? "Provider supplied strategy."}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {(strategy.supportedContracts ?? []).slice(0, 4).join(", ") || "Contracts provider-defined"}
                  </p>
                </button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No automation strategies were returned by the provider.</p>
            )}
          </div>
        </WorkCard>

        <WorkCard title="Run configuration" description="Contract template values are sent through the provider adapter.">
          <div className="space-y-3">
            <label className="block text-xs font-medium uppercase text-muted-foreground">
              Market
              <Select
                className="mt-1"
                value={selectedMarket?.symbol ?? ""}
                onChange={(event) => selectMarket(event.target.value)}
              >
                {markets.map((market) => (
                  <option key={market.symbol} value={market.symbol}>
                    {market.displayName}
                  </option>
                ))}
              </Select>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium uppercase text-muted-foreground">
                Contract
                <Select className="mt-1" value={contractType} onChange={(event) => setContractType(event.target.value)}>
                  {supportedContracts.map((contract) => (
                    <option key={contract} value={contract}>
                      {contract}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="block text-xs font-medium uppercase text-muted-foreground">
                Stake
                <Input className="mt-1" value={stake} inputMode="decimal" onChange={(event) => setStake(event.target.value)} />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium uppercase text-muted-foreground">
                Duration
                <Input className="mt-1" value={duration} inputMode="numeric" onChange={(event) => setDuration(event.target.value)} />
              </label>
              <label className="block text-xs font-medium uppercase text-muted-foreground">
                Unit
                <Select className="mt-1" value={durationUnit} onChange={(event) => setDurationUnit(event.target.value)}>
                  {durationUnits.map((unit) => (
                    <option key={unit} value={unit}>
                      {durationUnitLabel(unit)}
                    </option>
                  ))}
                </Select>
              </label>
            </div>

            {selectedStrategy?.parameters.length ? (
              <div className="space-y-3 rounded-md border border-border bg-background p-3">
                <p className="text-sm font-semibold">Strategy parameters</p>
                {selectedStrategy.parameters.map((parameter) => (
                  <ParameterField
                    key={parameter.key}
                    parameter={parameter}
                    value={parameterValues[parameter.key]}
                    onChange={(value) => setParameterValues((current) => ({ ...current, [parameter.key]: value }))}
                  />
                ))}
              </div>
            ) : null}

            {validationMessage ? <Notice tone="warning">{validationMessage}</Notice> : null}
            {localMessage ? <Notice tone="success">{localMessage}</Notice> : null}
            {error ? <Notice tone="danger">{error.message}</Notice> : null}

            <Button
              disabled={Boolean(validationMessage) || actionState !== "idle"}
              className="w-full"
              onClick={startAutomation}
            >
              {actionState === "starting" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
              {actionState === "starting" ? "Starting..." : "Start Demo Automation"}
            </Button>
          </div>
        </WorkCard>
      </div>

      <WorkCard title="Run monitor" description="Run status is sourced from auto_list and auto_get subscriptions.">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {activeRuns.map((run) => (
              <button
                key={run.id}
                type="button"
                onClick={() => selectRun(run.id)}
                className={`rounded-md border px-3 py-2 text-left text-xs ${
                  run.id === selectedRunId ? "border-primary bg-primary/10" : "border-border bg-background"
                }`}
              >
                <span className="block font-medium">{run.strategyId}</span>
                <span className="text-muted-foreground">{run.status}</span>
              </button>
            ))}
          </div>
          {isLoadingRuns ? <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
        </div>

        <WorkGrid>
          <RunMetric label="Status" value={selectedRun?.status ?? "No active run"} />
          <RunMetric label="Contracts" value={selectedRun ? String(selectedRun.contractCount ?? 0) : "--"} />
          <RunMetric label="Open contracts" value={selectedRun ? String(selectedRun.openContractCount ?? 0) : "--"} />
          <RunMetric
            label="Realized P/L"
            value={formatRunMoney(selectedRun?.realizedProfit, selectedRun?.currency)}
            positive={selectedRun?.realizedProfit === undefined ? undefined : Number(selectedRun.realizedProfit) >= 0}
          />
        </WorkGrid>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            disabled={!selectedRun || selectedRun.status !== "running" || actionState !== "idle"}
            variant="outline"
            onClick={() => updateRun("pausing")}
          >
            <Pause className="h-4 w-4" />
            Pause
          </Button>
          <Button
            disabled={!selectedRun || selectedRun.status !== "paused" || actionState !== "idle"}
            variant="outline"
            onClick={() => updateRun("resuming")}
          >
            <Play className="h-4 w-4" />
            Resume
          </Button>
          <Button
            disabled={!selectedRun || (selectedRun.status !== "running" && selectedRun.status !== "paused") || actionState !== "idle"}
            variant="danger"
            onClick={() => updateRun("stopping")}
          >
            <Square className="h-4 w-4" />
            Stop
          </Button>
        </div>

        {authenticatedConnectionError ? (
          <p className="mt-3 text-sm text-amber-300">{authenticatedConnectionError}</p>
        ) : null}
      </WorkCard>
    </FeatureState>
  );
}

function ParameterField({
  parameter,
  value,
  onChange,
}: {
  parameter: AutomationStrategyParameter;
  value: ParameterValue | undefined;
  onChange: (value: ParameterValue) => void;
}) {
  const label = (
    <span>
      {parameter.label}
      {parameter.description ? <span className="block normal-case text-muted-foreground">{parameter.description}</span> : null}
    </span>
  );

  if (parameter.type === "boolean") {
    return (
      <label className="flex items-center justify-between gap-3 text-xs font-medium uppercase text-muted-foreground">
        {label}
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 accent-primary"
        />
      </label>
    );
  }

  if (parameter.type === "select") {
    return (
      <label className="block text-xs font-medium uppercase text-muted-foreground">
        {label}
        <Select className="mt-1" value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}>
          {parameter.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </label>
    );
  }

  return (
    <label className="block text-xs font-medium uppercase text-muted-foreground">
      {label}
      <Input
        className="mt-1"
        value={String(value ?? "")}
        min={parameter.min}
        max={parameter.max}
        type={parameter.type === "number" ? "number" : "text"}
        onChange={(event) =>
          onChange(parameter.type === "number" ? Number(event.target.value) : event.target.value)
        }
      />
    </label>
  );
}

function Notice({ children, tone }: { children: string; tone: "success" | "warning" | "danger" }) {
  const classes = {
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    danger: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  };

  return (
    <div className={`rounded-md border p-3 text-sm ${classes[tone]}`}>
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4" />
        <p>{children}</p>
      </div>
    </div>
  );
}

function LoadingTile({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function RunMetric({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={positive === undefined ? "mt-2 font-medium" : positive ? "mt-2 font-medium text-emerald-400" : "mt-2 font-medium text-rose-400"}>
        {value}
      </p>
    </div>
  );
}

function validateStart({
  account,
  market,
  strategySelected,
  stake,
  duration,
  contractType,
  supportedContracts,
  authenticatedConnectionStatus,
}: {
  account?: TradingAccount;
  market?: Market;
  strategySelected: boolean;
  stake: string;
  duration: string;
  contractType: string;
  supportedContracts: readonly string[];
  authenticatedConnectionStatus: string;
}) {
  if (!account) return "Authenticate and select a Deriv account before starting automation.";
  if (account.type !== "demo") return "Automation start is enabled only for demo accounts in this phase.";
  if (authenticatedConnectionStatus !== "connected") return "Wait for the authenticated trading connection to be connected.";
  if (!market) return "Select a market.";
  if (!strategySelected) return "Select a provider strategy.";
  if (!supportedContracts.includes(contractType)) return "This contract type is unavailable for the selected market and strategy.";
  if (!Number.isFinite(Number(stake)) || Number(stake) <= 0) return "Enter a valid positive stake.";
  if (!Number.isFinite(Number(duration)) || Number(duration) <= 0) return "Enter a valid positive duration.";
  return undefined;
}

function defaultParameterValue(parameter: AutomationStrategyParameter): ParameterValue {
  if (parameter.defaultValue !== undefined) return parameter.defaultValue;
  if (parameter.type === "boolean") return false;
  if (parameter.type === "number") return parameter.min ?? 1;
  if (parameter.type === "select") return parameter.options?.[0]?.value ?? "";
  return "";
}

function formatRunMoney(value?: string, currency = "USD") {
  return value === undefined ? "--" : formatMoney(value, currency);
}

function supportedContractsFor(strategyContracts: string[] | undefined, availability: ContractAvailability | undefined) {
  const providerContracts = availability?.contractTypes.map((contract) => contract.providerType) ?? [];
  const strategySupported = strategyContracts?.length ? strategyContracts : [...defaultContractTypes];

  if (providerContracts.length === 0) {
    return strategySupported;
  }

  const intersection = strategySupported.filter((contract) => providerContracts.includes(contract));
  return intersection.length > 0 ? intersection : strategySupported;
}

function durationUnitsFor(availability?: ContractAvailability) {
  if (!availability?.durationUnits.length) {
    return ["m", "t", "s", "h", "d"];
  }

  return availability.durationUnits.map(durationUnitToDeriv);
}

function durationUnitToDeriv(unit: DurationUnit) {
  const map: Record<DurationUnit, string> = {
    ticks: "t",
    seconds: "s",
    minutes: "m",
    hours: "h",
    days: "d",
  };

  return map[unit];
}

function durationUnitLabel(unit: string) {
  const labels: Record<string, string> = {
    t: "Ticks",
    s: "Seconds",
    m: "Minutes",
    h: "Hours",
    d: "Days",
  };

  return labels[unit] ?? unit;
}
