import { env } from "@/config/env";
import {
  mapAutomationStartRequestToDeriv,
  mapDerivAutomationRun,
  mapDerivAutomationStrategy,
} from "@/deriv/mappers/automation-mapper";
import type { DerivAutomationRun, DerivAutomationStrategy } from "@/deriv/types/automation";
import { DerivPublicWebSocketClient } from "@/deriv/websocket";
import { getAuthenticatedTradingClient } from "@/deriv/websocket/authenticated-trading-client-registry";
import { AppError } from "@/lib/errors";
import type { AutomationProvider } from "@/providers/interfaces";
import type { AutomationRun, AutomationStartRequest, AutomationStrategy, Unsubscribe } from "@/types";

export class DerivAutomationProvider implements AutomationProvider {
  private readonly publicClient: DerivPublicWebSocketClient;
  private readonly getAuthenticatedClient: typeof getAuthenticatedTradingClient;

  constructor(
    publicClient = new DerivPublicWebSocketClient({ url: env.NEXT_PUBLIC_DERIV_PUBLIC_WS_URL }),
    getAuthenticatedClient = getAuthenticatedTradingClient,
  ) {
    this.publicClient = publicClient;
    this.getAuthenticatedClient = getAuthenticatedClient;
  }

  async listStrategies(): Promise<AutomationStrategy[]> {
    const response = await this.publicClient.request({ auto_list_strategies: 1 });
    const payload = response.auto_list_strategies;

    if (!isRecord(payload) || !Array.isArray(payload.strategies)) {
      throw new AppError({
        code: "UNKNOWN",
        title: "Automation strategies unavailable",
        message: "Deriv did not return an automation strategy catalogue.",
        retryable: true,
      });
    }

    return payload.strategies.map((strategy) => mapDerivAutomationStrategy(strategy as DerivAutomationStrategy));
  }

  async startStrategy(request: AutomationStartRequest): Promise<AutomationRun> {
    try {
      const response = await this.getAuthenticatedClient(request.accountId).request(mapAutomationStartRequestToDeriv(request));
      return this.normalizeRunResponse(response.auto_start, request.accountId, "Automation run could not be started.");
    } catch (caught) {
      if (caught instanceof AppError && caught.code === "CONNECTION_LOST") {
        throw new AppError({
          code: "TRADE_REJECTED",
          title: "Automation status unknown",
          message:
            "The automation start request did not receive a clear confirmation. It was not retried because the provider may still have started the run.",
          retryable: false,
          originalCode: caught.originalCode,
        });
      }

      throw caught;
    }
  }

  async getRun(accountId: string, runId: string): Promise<AutomationRun> {
    const response = await this.getAuthenticatedClient(accountId).request({ auto_get: 1, run_id: runId });
    return this.normalizeRunResponse(response.auto_get, accountId, "Automation run was not returned.");
  }

  async listRuns(accountId: string): Promise<AutomationRun[]> {
    const response = await this.getAuthenticatedClient(accountId).request({ auto_list: 1 });
    const payload = response.auto_list;

    if (!isRecord(payload) || !Array.isArray(payload.runs)) {
      throw new AppError({
        code: "UNKNOWN",
        title: "Automation runs unavailable",
        message: "Deriv did not return the account automation runs.",
        retryable: true,
      });
    }

    return payload.runs.map((run) => ({ ...mapDerivAutomationRun(run as DerivAutomationRun), accountId }));
  }

  async pauseRun(accountId: string, runId: string): Promise<AutomationRun> {
    const response = await this.getAuthenticatedClient(accountId).request({ auto_pause: 1, run_id: runId });
    return this.normalizeRunResponse(response.auto_pause, accountId, "Automation run could not be paused.");
  }

  async resumeRun(accountId: string, runId: string): Promise<AutomationRun> {
    const response = await this.getAuthenticatedClient(accountId).request({ auto_resume: 1, run_id: runId });
    return this.normalizeRunResponse(response.auto_resume, accountId, "Automation run could not be resumed.");
  }

  async stopRun(accountId: string, runId: string): Promise<AutomationRun> {
    const response = await this.getAuthenticatedClient(accountId).request({ auto_stop: 1, run_id: runId });
    return this.normalizeRunResponse(response.auto_stop, accountId, "Automation run could not be stopped.");
  }

  async subscribeToRun(
    accountId: string,
    runId: string,
    onRun: (run: AutomationRun) => void,
    onError?: (error: AppError) => void,
  ): Promise<Unsubscribe> {
    return this.getAuthenticatedClient(accountId).subscribe(
      `auto_get:${runId}`,
      { auto_get: 1, run_id: runId },
      (message) => {
        try {
          onRun(this.normalizeRunResponse(message.auto_get, accountId, "Automation run update was invalid."));
        } catch (caught) {
          onError?.(
            caught instanceof AppError
              ? caught
              : new AppError({
                  code: "UNKNOWN",
                  title: "Automation update unavailable",
                  message: "Unable to normalize the automation run update.",
                  retryable: true,
                }),
          );
        }
      },
      onError,
    );
  }

  private normalizeRunResponse(payload: unknown, accountId: string, message: string) {
    if (!isRecord(payload)) {
      throw new AppError({
        code: "UNKNOWN",
        title: "Automation run unavailable",
        message,
        retryable: true,
      });
    }

    return { ...mapDerivAutomationRun(payload as DerivAutomationRun), accountId };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
