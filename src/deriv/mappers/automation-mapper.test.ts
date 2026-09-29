import { describe, expect, it } from "vitest";

import {
  mapAutomationStartRequestToDeriv,
  mapDerivAutomationRun,
  mapDerivAutomationStrategy,
} from "@/deriv/mappers/automation-mapper";

describe("Deriv automation mapper", () => {
  it("normalizes provider strategies and parameter schemas", () => {
    expect(
      mapDerivAutomationStrategy({
        strategy_id: "trend_sequence",
        display_name: "Trend Sequence",
        description: "Provider strategy",
        supported_contract_types: ["CALL", "PUT"],
        parameters: {
          max_trades: {
            type: "integer",
            title: "Maximum trades",
            minimum: 1,
            maximum: 10,
            default: 3,
          },
          mode: {
            type: "string",
            enum: ["conservative", "balanced"],
          },
        },
      }),
    ).toEqual({
      id: "trend_sequence",
      name: "Trend Sequence",
      description: "Provider strategy",
      supportedContracts: ["CALL", "PUT"],
      parameters: [
        {
          key: "max_trades",
          label: "Maximum trades",
          type: "number",
          required: true,
          min: 1,
          max: 10,
          defaultValue: 3,
          description: undefined,
          options: undefined,
        },
        {
          key: "mode",
          label: "Mode",
          type: "select",
          required: true,
          min: undefined,
          max: undefined,
          defaultValue: undefined,
          description: undefined,
          options: [
            { value: "conservative", label: "conservative" },
            { value: "balanced", label: "balanced" },
          ],
        },
      ],
    });
  });

  it("maps app start requests to Deriv auto_start contract_template payloads", () => {
    expect(
      mapAutomationStartRequestToDeriv({
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
        parameters: { max_trades: 3 },
      }),
    ).toEqual({
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
      strategy_parameters: { max_trades: 3 },
      subscribe: 1,
    });
  });

  it("normalizes run totals and provider status", () => {
    expect(
      mapDerivAutomationRun({
        run_id: "run-1",
        strategy_id: "trend_sequence",
        status: "stopped",
        stop_reason: "condition_triggered",
        stop_time: 1_793_456_400,
        start_time: 1_793_456_000,
        strategy_parameters: { max_trades: 2 },
        contract_template: {
          contract_type: "CALL",
          currency: "USD",
          underlying_symbol: "1HZ100V",
        },
        total_stake: 20,
        total_payout: 29.5,
        contracts: [
          { contract_id: 1, buy_price: 10, purchase_time: 1, contract_status: "won" },
          { contract_id: 2, buy_price: 10, purchase_time: 2, contract_status: "lost" },
        ],
      }),
    ).toEqual({
      id: "run-1",
      strategyId: "trend_sequence",
      accountId: "",
      symbol: "1HZ100V",
      status: "stopped",
      startedAt: 1_793_456_000,
      contractCount: 2,
      openContractCount: 0,
      wins: 1,
      losses: 1,
      realizedProfit: "9.5",
      totalStake: "20",
      totalPayout: "29.5",
      currency: "USD",
      providerMessage: undefined,
      stopReason: "condition_triggered",
      stopTime: 1_793_456_400,
    });
  });
});
