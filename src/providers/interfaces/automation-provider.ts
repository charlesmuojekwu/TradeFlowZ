import type { AppError } from "@/lib/errors";
import type { AutomationRun, AutomationStartRequest, AutomationStrategy, Unsubscribe } from "@/types";

export type AutomationRunHandler = (run: AutomationRun) => void;
export type AutomationErrorHandler = (error: AppError) => void;

export interface AutomationProvider {
  listStrategies(): Promise<AutomationStrategy[]>;
  startStrategy(request: AutomationStartRequest): Promise<AutomationRun>;
  getRun(accountId: string, runId: string): Promise<AutomationRun>;
  listRuns(accountId: string): Promise<AutomationRun[]>;
  pauseRun(accountId: string, runId: string): Promise<AutomationRun>;
  resumeRun(accountId: string, runId: string): Promise<AutomationRun>;
  stopRun(accountId: string, runId: string): Promise<AutomationRun>;
  subscribeToRun(
    accountId: string,
    runId: string,
    onRun: AutomationRunHandler,
    onError?: AutomationErrorHandler,
  ): Promise<Unsubscribe>;
}
