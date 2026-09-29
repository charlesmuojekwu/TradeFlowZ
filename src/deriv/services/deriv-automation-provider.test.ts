import { describe, expect, it, vi } from "vitest";

import { DerivAutomationProvider } from "@/deriv/services/deriv-automation-provider";
import { AppError } from "@/lib/errors";

describe("DerivAutomationProvider", () => {
  it("loads strategies through the public automation endpoint", async () => {
    const publicClient = {
      request: vi.fn().mockResolvedValue({
        auto_list_strategies: {
          strategies: [
            {
              strategy_id: "trend_sequence",
              display_name: "Trend Sequence",
              parameters: {},
              supported_contract_types: ["CALL", "PUT"],
            },
          ],
        },
      }),
    };
    const provider = new DerivAutomationProvider(publicClient as never, vi.fn());

    await expect(provider.listStrategies()).resolves.toEqual([
      expect.objectContaining({
        id: "trend_sequence",
        supportedContracts: ["CALL", "PUT"],
      }),
    ]);
    expect(publicClient.request).toHaveBeenCalledWith({ auto_list_strategies: 1 });
  });

  it("starts a run through the authenticated account socket and does not hide account scope", async () => {
    const request = vi.fn().mockResolvedValue({
      auto_start: {
        run_id: "run-1",
        strategy_id: "trend_sequence",
        status: "running",
        start_time: 1_793_456_000,
        strategy_parameters: { max_trades: 2 },
        contract_template: {
          contract_type: "CALL",
          currency: "USD",
          underlying_symbol: "1HZ100V",
        },
      },
    });
    const getAuthenticatedClient = vi.fn(() => ({ request }));
    const provider = new DerivAutomationProvider({ request: vi.fn() } as never, getAuthenticatedClient as never);

    await expect(
      provider.startStrategy({
        accountId: "DOT90004580",
        strategyId: "trend_sequence",
        contract: {
          symbol: "1HZ100V",
          contractType: "CALL",
          stake: "10",
          currency: "USD",
          duration: 5,
          durationUnit: "m",
        },
        parameters: { max_trades: 2 },
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: "run-1",
        accountId: "DOT90004580",
        status: "running",
      }),
    );

    expect(getAuthenticatedClient).toHaveBeenCalledWith("DOT90004580");
    expect(request).toHaveBeenCalledWith({
      auto_start: 1,
      strategy_id: "trend_sequence",
      contract_template: {
        amount: 10,
        basis: "stake",
        contract_type: "CALL",
        currency: "USD",
        duration: 5,
        duration_unit: "m",
        underlying_symbol: "1HZ100V",
      },
      strategy_parameters: { max_trades: 2 },
      subscribe: 1,
    });
  });

  it("does not retry ambiguous auto_start timeouts", async () => {
    const request = vi.fn().mockRejectedValue(
      new AppError({
        code: "CONNECTION_LOST",
        title: "Request timed out",
        message: "Deriv did not respond before the authenticated request timeout.",
        retryable: true,
      }),
    );
    const provider = new DerivAutomationProvider({ request: vi.fn() } as never, () => ({ request }) as never);

    await expect(
      provider.startStrategy({
        accountId: "DOT90004580",
        strategyId: "trend_sequence",
        contract: {
          symbol: "1HZ100V",
          contractType: "CALL",
          stake: "10",
          currency: "USD",
        },
        parameters: {},
      }),
    ).rejects.toMatchObject({
      code: "TRADE_REJECTED",
      title: "Automation status unknown",
      retryable: false,
    });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("restores and subscribes to account runs with cleanup delegated to the socket client", async () => {
    const unsubscribe = vi.fn();
    const request = vi.fn().mockResolvedValue({
      auto_list: {
        runs: [
          {
            run_id: "run-1",
            strategy_id: "trend_sequence",
            status: "paused",
            start_time: 1_793_456_000,
            strategy_parameters: {},
            total_stake: 10,
            total_payout: 0,
            contracts: [],
            contract_template: {
              contract_type: "CALL",
              currency: "USD",
              underlying_symbol: "1HZ100V",
            },
          },
        ],
      },
    });
    const subscribe = vi.fn(async (_key, _payload, onMessage) => {
      onMessage({
        auto_get: {
          run_id: "run-1",
          strategy_id: "trend_sequence",
          status: "running",
          start_time: 1_793_456_000,
          strategy_parameters: {},
          contract_template: {
            contract_type: "CALL",
            currency: "USD",
            underlying_symbol: "1HZ100V",
          },
        },
      });
      return unsubscribe;
    });
    const provider = new DerivAutomationProvider(
      { request: vi.fn() } as never,
      () => ({ request, subscribe }) as never,
    );
    const onRun = vi.fn();

    await expect(provider.listRuns("DOT90004580")).resolves.toEqual([
      expect.objectContaining({ id: "run-1", accountId: "DOT90004580", status: "paused" }),
    ]);
    await expect(provider.subscribeToRun("DOT90004580", "run-1", onRun)).resolves.toBe(unsubscribe);

    expect(subscribe).toHaveBeenCalledWith(
      "auto_get:run-1",
      { auto_get: 1, run_id: "run-1" },
      expect.any(Function),
      undefined,
    );
    expect(onRun).toHaveBeenCalledWith(expect.objectContaining({ id: "run-1", status: "running" }));
  });
});
