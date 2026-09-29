import type { ConnectionStatus } from "@/types";

export type AuthenticatedTradingConnectionSnapshot = {
  accountId: string;
  status: ConnectionStatus;
  error?: string;
};

export type AuthenticatedTradingMessage = Record<string, unknown>;
