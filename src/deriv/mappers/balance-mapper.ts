import type { BalanceUpdate } from "@/providers/interfaces";

type DerivBalancePayload = {
  balance?: unknown;
  currency?: unknown;
  loginid?: unknown;
  account_id?: unknown;
  id?: unknown;
};

export function normalizeDerivBalance(message: unknown, fallbackAccountId: string): BalanceUpdate | undefined {
  if (!message || typeof message !== "object" || !("balance" in message)) {
    return undefined;
  }

  const balance = message.balance;

  if (!balance || typeof balance !== "object") {
    return undefined;
  }

  const payload = balance as DerivBalancePayload;
  const value = stringFrom(payload.balance);
  const currency = stringFrom(payload.currency);

  if (!value || !currency) {
    return undefined;
  }

  return {
    id: stringFrom(payload.loginid ?? payload.account_id ?? payload.id) ?? fallbackAccountId,
    balance: value,
    currency,
  };
}

function stringFrom(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : undefined;
}
