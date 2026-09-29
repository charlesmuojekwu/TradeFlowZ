import { AppError } from "@/lib/errors";
import { addMoney, normalizeDecimal, subtractMoney } from "@/lib/money";
import type { AutomationProvider } from "@/providers/interfaces";
import type { AutomationRun, AutomationStartRequest, AutomationStrategy, Unsubscribe } from "@/types";

const mockStrategies: AutomationStrategy[] = [
  {
    id: "trend_sequence",
    name: "Trend Sequence",
    description: "Starts provider-managed Rise/Fall contracts using simple stake and stop controls.",
    supportedContracts: ["CALL", "PUT"],
    parameters: [
      {
        key: "max_trades",
        label: "Maximum trades",
        type: "number",
        required: true,
        min: 1,
        max: 25,
        defaultValue: 5,
      },
      {
        key: "pause_after_loss",
        label: "Pause after loss",
        type: "boolean",
        required: true,
        defaultValue: true,
      },
    ],
  },
  {
    id: "digit_guard",
    name: "Digit Guard",
    description: "Demo-only digit strategy used for development and UI testing.",
    supportedContracts: ["DIGITEVEN", "DIGITODD"],
    parameters: [
      {
        key: "target_digit",
        label: "Target digit",
        type: "select",
        required: true,
        options: Array.from({ length: 10 }, (_, index) => ({ value: String(index), label: String(index) })),
        defaultValue: "5",
      },
    ],
  },
];

export class MockAutomationProvider implements AutomationProvider {
  private readonly runs = new Map<string, AutomationRun>();
  private readonly timers = new Map<string, ReturnType<typeof setInterval>>();
  private readonly subscribers = new Map<string, Set<(run: AutomationRun) => void>>();

  async listStrategies(): Promise<AutomationStrategy[]> {
    return mockStrategies;
  }

  async startStrategy(request: AutomationStartRequest): Promise<AutomationRun> {
    const run: AutomationRun = {
      id: `mock-auto-${Date.now()}`,
      strategyId: request.strategyId,
      accountId: request.accountId,
      symbol: request.contract.symbol,
      status: "running",
      startedAt: Math.floor(Date.now() / 1000),
      contractCount: 0,
      openContractCount: 0,
      wins: 0,
      losses: 0,
      totalStake: "0",
      totalPayout: "0",
      realizedProfit: "0",
      currency: request.contract.currency,
      providerMessage: "Mock automation run",
    };

    this.runs.set(run.id, run);
    this.startTicker(run.id, request.contract.stake);
    return run;
  }

  async getRun(_accountId: string, runId: string): Promise<AutomationRun> {
    return this.requireRun(runId);
  }

  async listRuns(accountId: string): Promise<AutomationRun[]> {
    return Array.from(this.runs.values()).filter((run) => run.accountId === accountId);
  }

  async pauseRun(_accountId: string, runId: string): Promise<AutomationRun> {
    return this.updateRun(runId, { status: "paused" });
  }

  async resumeRun(_accountId: string, runId: string): Promise<AutomationRun> {
    const run = this.updateRun(runId, { status: "running" });
    if (!this.timers.has(runId)) {
      this.startTicker(runId, "1");
    }
    return run;
  }

  async stopRun(_accountId: string, runId: string): Promise<AutomationRun> {
    this.stopTicker(runId);
    return this.updateRun(runId, {
      status: "stopped",
      stopReason: "user_stopped",
      stopTime: Math.floor(Date.now() / 1000),
    });
  }

  async subscribeToRun(
    _accountId: string,
    runId: string,
    onRun: (run: AutomationRun) => void,
  ): Promise<Unsubscribe> {
    const subscribers = this.subscribers.get(runId) ?? new Set<(run: AutomationRun) => void>();
    subscribers.add(onRun);
    this.subscribers.set(runId, subscribers);
    onRun(this.requireRun(runId));

    return async () => {
      subscribers.delete(onRun);
    };
  }

  private startTicker(runId: string, stake: string) {
    this.stopTicker(runId);
    const timer = setInterval(() => {
      const run = this.runs.get(runId);
      if (!run || run.status !== "running") {
        return;
      }

      const didWin = Math.random() > 0.42;
      const payout = didWin ? normalizeDecimal(Number(stake) * 1.85) : "0";
      const nextTotalStake = addMoney(run.totalStake ?? "0", stake);
      const nextTotalPayout = addMoney(run.totalPayout ?? "0", payout);
      const nextRun: AutomationRun = {
        ...run,
        contractCount: (run.contractCount ?? 0) + 1,
        openContractCount: 0,
        wins: (run.wins ?? 0) + (didWin ? 1 : 0),
        losses: (run.losses ?? 0) + (didWin ? 0 : 1),
        totalStake: nextTotalStake,
        totalPayout: nextTotalPayout,
        realizedProfit: subtractMoney(nextTotalPayout, nextTotalStake),
      };
      this.runs.set(runId, nextRun);
      this.emit(nextRun);
    }, 4_000);
    this.timers.set(runId, timer);
  }

  private stopTicker(runId: string) {
    const timer = this.timers.get(runId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(runId);
    }
  }

  private updateRun(runId: string, patch: Partial<AutomationRun>) {
    const run = { ...this.requireRun(runId), ...patch };
    this.runs.set(runId, run);
    this.emit(run);
    return run;
  }

  private requireRun(runId: string) {
    const run = this.runs.get(runId);
    if (!run) {
      throw new AppError({
        code: "UNKNOWN",
        title: "Automation run unavailable",
        message: "The requested mock automation run does not exist.",
        retryable: false,
      });
    }
    return run;
  }

  private emit(run: AutomationRun) {
    this.subscribers.get(run.id)?.forEach((subscriber) => subscriber(run));
  }
}
