import type { DerivJsonValue } from "@/deriv/types/websocket";

export type DerivAutomationStrategyParameterSchema = {
  type?: string | string[];
  title?: string;
  description?: string;
  enum?: DerivJsonValue[];
  oneOf?: Array<{ const?: DerivJsonValue; title?: string }>;
  anyOf?: Array<{ const?: DerivJsonValue; title?: string }>;
  minimum?: number;
  maximum?: number;
  default?: DerivJsonValue;
};

export type DerivAutomationStrategy = {
  strategy_id: string;
  display_name: string;
  description?: string;
  parameters: Record<string, DerivAutomationStrategyParameterSchema>;
  supported_contract_types: string[];
};

export type DerivAutomationContractTemplate = {
  amount?: number;
  barrier?: string;
  barrier2?: string;
  basis?: "stake" | "payout";
  contract_type: string;
  currency: string;
  duration?: number;
  duration_unit?: "d" | "m" | "s" | "h" | "t";
  growth_rate?: number;
  limit_order?: {
    stop_loss?: number;
    take_profit?: number;
  };
  multiplier?: number;
  selected_tick?: number;
  underlying_symbol: string;
};

export type DerivAutomationContract = {
  buy_price: number;
  contract_id: number;
  contract_status?: "open" | "won" | "lost";
  purchase_time: number;
  sell_price?: number;
  sell_time?: number;
};

export type DerivAutomationRun = {
  contract_template: DerivAutomationContractTemplate;
  contracts?: DerivAutomationContract[];
  run_id: string;
  start_time: number;
  status: "running" | "paused" | "stopped";
  stop_reason?: "error" | "user_stopped" | "condition_triggered";
  stop_reason_code?: string;
  stop_time?: number;
  strategy_id: string;
  strategy_parameters: Record<string, DerivJsonValue>;
  total_payout?: number;
  total_stake?: number;
};
