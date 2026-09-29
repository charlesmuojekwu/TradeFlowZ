"use client";

import { ArrowRight, Bot, BrainCircuit, Copy, FlaskConical, LineChart } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { formatMoney } from "@/lib/money";
import { providerBundle } from "@/providers";
import { useAccountStore, usePositionStore } from "@/stores";
import type { AccountSession, AutomationRun, TradingAccount } from "@/types";

type DashboardSession = AccountSession & {
  accounts?: TradingAccount[];
};

const quickActions = [
  { href: "/trade", label: "Trade manually", icon: LineChart },
  { href: "/ai", label: "AI trading", icon: BrainCircuit },
  { href: "/automation", label: "Start automation", icon: Bot },
  { href: "/contracts", label: "Explore contracts", icon: ArrowRight },
  { href: "/strategies/lab", label: "Open Strategy Lab", icon: FlaskConical },
] as const;

export function DashboardOverview() {
  const [session, setSession] = useState<DashboardSession>();
  const [automationRuns, setAutomationRuns] = useState<AutomationRun[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const cachedOpenPositions = usePositionStore((state) => state.openPositions);
  const cachedSettledPositions = usePositionStore((state) => state.settledPositions);
  const authenticatedConnectionStatus = useAccountStore((state) => state.authenticatedConnectionStatus);

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      setLoading(true);
      setError(undefined);

      try {
        const [sessionResult, accounts] = await Promise.all([
          providerBundle.accountProvider.getSession(),
          providerBundle.accountProvider.getAccounts(),
        ]);
        const selectedAccount = accounts[0];
        const runs = selectedAccount ? await providerBundle.automationProvider.listRuns(selectedAccount.id) : [];

        if (isCurrent) {
          setSession({ ...sessionResult, accounts });
          setAutomationRuns(runs);
        }
      } catch (caught) {
        if (isCurrent) {
          setError(caught instanceof Error ? caught.message : "Unable to load dashboard data.");
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      isCurrent = false;
    };
  }, []);

  const selectedAccount = session?.accounts?.[0];
  const activeAutomationRuns = useMemo(
    () => automationRuns.filter((run) => run.status === "running" || run.status === "paused"),
    [automationRuns],
  );
  const floatingProfit = useMemo(
    () => cachedOpenPositions.reduce((total, position) => total + Number(position.profit || 0), 0),
    [cachedOpenPositions],
  );
  const realizedProfit = useMemo(
    () => cachedSettledPositions.reduce((total, position) => total + Number(position.profit || 0), 0),
    [cachedSettledPositions],
  );
  const currency = selectedAccount?.currency ?? cachedOpenPositions[0]?.currency ?? "USD";

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto grid min-h-full w-full max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
        <div className="space-y-5">
          <Panel className="rounded-md p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Dashboard</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-normal sm:text-3xl">
                  Account and trading overview
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  A factual view of your Deriv account, current platform state, cached positions, and the next actions
                  available in this frontend stage.
                </p>
              </div>
              <Badge tone={selectedAccount?.type === "real" ? "danger" : "info"}>
                {selectedAccount ? selectedAccount.type.toUpperCase() : isLoading ? "LOADING" : "NO ACCOUNT"}
              </Badge>
            </div>
            {error ? <p className="mt-4 rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p> : null}
          </Panel>

          <Panel className="rounded-md p-5">
            <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
              <div>
                <p className="text-sm text-muted-foreground">Selected account</p>
                <h2 className="mt-2 font-mono text-3xl font-semibold">
                  {selectedAccount ? formatMoney(selectedAccount.balance, selectedAccount.currency) : "--"}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedAccount ? `${selectedAccount.id} - ${selectedAccount.status}` : "Account data is loaded from Deriv after authentication."}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <DashboardMetric label="Open positions" value={String(cachedOpenPositions.length)} />
                <DashboardMetric label="Floating P/L" value={formatMoney(String(floatingProfit), currency)} positive={floatingProfit >= 0} />
                <DashboardMetric label="Realized P/L" value={formatMoney(String(realizedProfit), currency)} positive={realizedProfit >= 0} />
              </div>
            </div>
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel className="rounded-md p-5">
              <h2 className="font-semibold">Recent trading activity</h2>
              {cachedSettledPositions.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {cachedSettledPositions.slice(0, 4).map((position) => (
                    <div key={position.contractId} className="flex items-center justify-between gap-3 rounded-md border border-border bg-background p-3 text-sm">
                      <div>
                        <p className="font-medium">{position.displaySymbol}</p>
                        <p className="text-xs text-muted-foreground">{position.status.toUpperCase()} - {position.source ?? "manual"}</p>
                      </div>
                      <p className={Number(position.profit) >= 0 ? "font-mono text-emerald-400" : "font-mono text-rose-400"}>
                        {formatMoney(position.profit, position.currency)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  No cached settled positions in this browser session. Use History for provider-sourced records.
                </p>
              )}
            </Panel>

            <Panel className="rounded-md p-5">
              <h2 className="font-semibold">Platform status</h2>
              <div className="mt-4 space-y-3 text-sm">
                <StatusRow label="Market data" value="Public Deriv provider" />
                <StatusRow label="Trading socket" value={authenticatedConnectionStatus} />
                <StatusRow label="Automation" value={`${activeAutomationRuns.length} active`} />
                <StatusRow label="AI trading" value="Assistant workspace" />
                <StatusRow label="Copy trading" value="Backend required" />
              </div>
            </Panel>
          </div>

          <Panel className="rounded-md p-5">
            <h2 className="font-semibold">Active automations</h2>
            {activeAutomationRuns.length > 0 ? (
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {activeAutomationRuns.slice(0, 4).map((run) => (
                  <div key={run.id} className="rounded-md border border-border bg-background p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{run.strategyId}</p>
                      <Badge tone={run.status === "running" ? "success" : "warning"}>{run.status}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {run.symbol ?? "Provider market"} - {run.contractCount ?? 0} contracts
                    </p>
                    <p className={Number(run.realizedProfit ?? 0) >= 0 ? "mt-3 font-mono text-emerald-400" : "mt-3 font-mono text-rose-400"}>
                      {run.realizedProfit ? formatMoney(run.realizedProfit, run.currency ?? currency) : "--"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                No active provider automation runs for the selected account.
              </p>
            )}
          </Panel>
        </div>

        <aside className="space-y-5">
          <Panel className="rounded-md p-5">
            <h2 className="font-semibold">Quick actions</h2>
            <div className="mt-4 grid gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button key={action.href} asChild variant="outline" className="justify-start">
                    <Link href={action.href}>
                      <Icon className="h-4 w-4" />
                      {action.label}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </Panel>

          <Panel className="rounded-md p-5">
            <div className="flex items-start gap-3">
              <BrainCircuit className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <h2 className="font-semibold">AI trading assistant</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  AI trading helps structure strategy ideas, market context, and risk settings. Execution still requires
                  provider validation, fresh quotes, and explicit confirmation.
                </p>
              </div>
            </div>
          </Panel>

          <Panel className="rounded-md p-5">
            <div className="flex items-start gap-3">
              <Copy className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <h2 className="font-semibold">Copy trading boundary</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Production copy execution requires a secure backend and encrypted token vault. No Personal Access
                  Tokens are stored in this browser app.
                </p>
              </div>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function DashboardMetric({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={positive === undefined ? "mt-2 font-mono text-lg font-semibold" : positive ? "mt-2 font-mono text-lg font-semibold text-emerald-400" : "mt-2 font-mono text-lg font-semibold text-rose-400"}>
        {value}
      </p>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium capitalize">{value}</span>
    </div>
  );
}
