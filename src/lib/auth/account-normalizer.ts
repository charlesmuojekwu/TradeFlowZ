import type { TradingAccount } from "@/types";

type DerivAccountRecord = Record<string, unknown>;

export function normalizeDerivAccount(record: DerivAccountRecord): TradingAccount | undefined {
  const id = stringFrom(record.id ?? record.account_id ?? record.loginid ?? record.uuid);

  if (!id) {
    return undefined;
  }

  return {
    id,
    type: normalizeAccountType(record.account_type ?? record.type ?? record.group),
    currency: stringFrom(record.currency) ?? "USD",
    status: normalizeStatus(record.status),
    balance: stringFrom(record.balance ?? record.current_balance) ?? "0",
    displayName: stringFrom(record.display_name ?? record.name ?? record.nickname),
  };
}

export function normalizeDerivAccounts(value: unknown): TradingAccount[] {
  const records = Array.isArray(value) ? value : [];

  return records
    .filter((record): record is DerivAccountRecord => Boolean(record && typeof record === "object"))
    .map(normalizeDerivAccount)
    .filter((account): account is TradingAccount => Boolean(account));
}

function normalizeAccountType(value: unknown) {
  const normalized = stringFrom(value)?.toLowerCase();
  return normalized?.includes("real") ? "real" : "demo";
}

function normalizeStatus(value: unknown) {
  const normalized = stringFrom(value)?.toLowerCase();

  if (normalized === "active" || normalized === "disabled" || normalized === "pending") {
    return normalized;
  }

  return "unknown";
}

function stringFrom(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : undefined;
}
