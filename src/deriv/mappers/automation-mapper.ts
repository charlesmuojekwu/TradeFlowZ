import type {
  DerivAutomationContractTemplate,
  DerivAutomationRun,
  DerivAutomationStrategy,
  DerivAutomationStrategyParameterSchema,
} from "@/deriv/types/automation";
import { normalizeDecimal, subtractMoney } from "@/lib/money";
import type {
  AutomationContractTemplate,
  AutomationRun,
  AutomationRunStatus,
  AutomationStartRequest,
  AutomationStrategy,
  AutomationStrategyParameter,
} from "@/types";

export function mapDerivAutomationStrategy(strategy: DerivAutomationStrategy): AutomationStrategy {
  return {
    id: strategy.strategy_id,
    name: strategy.display_name,
    description: strategy.description,
    supportedContracts: strategy.supported_contract_types,
    parameters: Object.entries(strategy.parameters ?? {}).map(([key, schema]) =>
      mapStrategyParameter(key, schema),
    ),
  };
}

export function mapDerivAutomationRun(run: DerivAutomationRun): AutomationRun {
  const contracts = run.contracts ?? [];
  const wins = contracts.filter((contract) => contract.contract_status === "won").length;
  const losses = contracts.filter((contract) => contract.contract_status === "lost").length;
  const openContractCount = contracts.filter((contract) => contract.contract_status === "open").length;
  const totalStake = run.total_stake === undefined ? undefined : normalizeDecimal(run.total_stake);
  const totalPayout = run.total_payout === undefined ? undefined : normalizeDecimal(run.total_payout);

  return {
    id: run.run_id,
    strategyId: run.strategy_id,
    accountId: "",
    symbol: run.contract_template?.underlying_symbol,
    status: mapRunStatus(run.status, run.stop_reason),
    startedAt: run.start_time,
    contractCount: contracts.length,
    openContractCount,
    wins,
    losses,
    realizedProfit: totalStake && totalPayout ? subtractMoney(totalPayout, totalStake) : undefined,
    totalStake,
    totalPayout,
    currency: run.contract_template?.currency,
    providerMessage: run.stop_reason_code,
    stopReason: run.stop_reason,
    stopTime: run.stop_time,
  };
}

export function mapAutomationStartRequestToDeriv(request: AutomationStartRequest) {
  return {
    auto_start: 1,
    strategy_id: request.strategyId,
    contract_template: mapContractTemplateToDeriv(request.contract),
    strategy_parameters: request.parameters,
    subscribe: 1,
  };
}

function mapContractTemplateToDeriv(contract: AutomationContractTemplate): DerivAutomationContractTemplate {
  const template: DerivAutomationContractTemplate = {
    amount: Number(contract.stake),
    basis: "stake",
    contract_type: contract.contractType,
    currency: contract.currency,
    underlying_symbol: contract.symbol,
  };

  if (contract.duration !== undefined) template.duration = contract.duration;
  if (contract.durationUnit) template.duration_unit = mapDurationUnit(contract.durationUnit);
  if (contract.barrier) template.barrier = contract.barrier;
  if (contract.barrier2) template.barrier2 = contract.barrier2;
  if (contract.growthRate !== undefined) template.growth_rate = contract.growthRate;
  if (contract.multiplier !== undefined) template.multiplier = contract.multiplier;
  if (contract.selectedTick !== undefined) template.selected_tick = contract.selectedTick;
  if (contract.takeProfit || contract.stopLoss) {
    template.limit_order = {};
    if (contract.takeProfit) template.limit_order.take_profit = Number(contract.takeProfit);
    if (contract.stopLoss) template.limit_order.stop_loss = Number(contract.stopLoss);
  }

  return template;
}

function mapStrategyParameter(
  key: string,
  schema: DerivAutomationStrategyParameterSchema,
): AutomationStrategyParameter {
  const options = extractOptions(schema);
  const type = options.length > 0 ? "select" : mapParameterType(schema.type);

  return {
    key,
    label: schema.title ?? labelize(key),
    type,
    required: true,
    options: options.length > 0 ? options : undefined,
    min: schema.minimum,
    max: schema.maximum,
    defaultValue: normalizeDefault(schema.default),
    description: schema.description,
  };
}

function extractOptions(schema: DerivAutomationStrategyParameterSchema) {
  const rawOptions = schema.oneOf ?? schema.anyOf;
  if (rawOptions?.length) {
    return rawOptions
      .filter((option) => typeof option.const === "string" || typeof option.const === "number")
      .map((option) => ({ value: String(option.const), label: option.title ?? String(option.const) }));
  }

  if (schema.enum?.length) {
    return schema.enum
      .filter((option) => typeof option === "string" || typeof option === "number" || typeof option === "boolean")
      .map((option) => ({ value: String(option), label: String(option) }));
  }

  return [];
}

function mapParameterType(type: DerivAutomationStrategyParameterSchema["type"]): AutomationStrategyParameter["type"] {
  const value = Array.isArray(type) ? type.find((item) => item !== "null") : type;
  if (value === "number" || value === "integer") return "number";
  if (value === "boolean") return "boolean";
  return "string";
}

function normalizeDefault(value: unknown) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  return undefined;
}

function mapRunStatus(status: DerivAutomationRun["status"], stopReason?: string): AutomationRunStatus {
  if (status === "stopped" && stopReason === "error") return "error";
  return status;
}

function mapDurationUnit(value: string): "d" | "m" | "s" | "h" | "t" {
  const normalized = value.toLowerCase();
  if (normalized.startsWith("day") || normalized === "d") return "d";
  if (normalized.startsWith("hour") || normalized === "h") return "h";
  if (normalized.startsWith("sec") || normalized === "s") return "s";
  if (normalized.startsWith("tick") || normalized === "t") return "t";
  return "m";
}

function labelize(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
