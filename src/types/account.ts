import type { CurrencyCode, DecimalString } from "@/types/common";

export type AccountType = "demo" | "real";

export type TradingAccountStatus = "active" | "disabled" | "pending" | "unknown";

export type TradingAccount = {
  id: string;
  type: AccountType;
  currency: CurrencyCode;
  status: TradingAccountStatus;
  balance: DecimalString;
};

export type AccountSession = {
  isAuthenticated: boolean;
  expiresAt?: number;
};
