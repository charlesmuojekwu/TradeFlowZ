import type { Position, PositionStatus, TradeDirection, TradeHistoryPage } from "@/types";

type DerivProfitTableTransaction = {
  contract_id?: unknown;
  contract_type?: unknown;
  shortcode?: unknown;
  longcode?: unknown;
  display_name?: unknown;
  underlying_symbol?: unknown;
  symbol?: unknown;
  currency?: unknown;
  buy_price?: unknown;
  sell_price?: unknown;
  payout?: unknown;
  profit?: unknown;
  entry_spot?: unknown;
  exit_spot?: unknown;
  purchase_time?: unknown;
  sell_time?: unknown;
  expiry_time?: unknown;
  transaction_time?: unknown;
  status?: unknown;
};

export function mapDerivProfitTable(message: unknown): TradeHistoryPage {
  if (!message || typeof message !== "object" || !("profit_table" in message)) {
    throw new Error("Deriv did not return a profit table response.");
  }

  const profitTable = message.profit_table;

  if (!profitTable || typeof profitTable !== "object") {
    throw new Error("Deriv returned an invalid profit table response.");
  }

  const transactions = "transactions" in profitTable ? profitTable.transactions : undefined;

  if (!Array.isArray(transactions)) {
    throw new Error("Deriv profit table transactions were not returned as an array.");
  }

  return {
    positions: transactions
      .filter((transaction): transaction is DerivProfitTableTransaction =>
        Boolean(transaction && typeof transaction === "object"),
      )
      .map(mapDerivProfitTableTransaction)
      .filter((position): position is Position => Boolean(position)),
    total: numberFrom("count" in profitTable ? profitTable.count : undefined),
  };
}

function mapDerivProfitTableTransaction(transaction: DerivProfitTableTransaction): Position | undefined {
  const contractId = stringFrom(transaction.contract_id);

  if (!contractId) {
    return undefined;
  }

  const symbol = stringFrom(transaction.underlying_symbol ?? transaction.symbol) ?? contractId;
  const buyPrice = stringFrom(transaction.buy_price) ?? "0";
  const profit = stringFrom(transaction.profit) ?? "0";
  const payout = stringFrom(transaction.payout ?? transaction.sell_price) ?? "0";
  const purchaseTime = numberFrom(transaction.purchase_time ?? transaction.transaction_time) ?? 0;
  const closeTime = numberFrom(transaction.sell_time ?? transaction.expiry_time ?? transaction.transaction_time) ?? purchaseTime;

  return {
    contractId,
    symbol,
    displaySymbol: stringFrom(transaction.display_name ?? transaction.longcode ?? transaction.shortcode) ?? symbol,
    direction: normalizeDirection(transaction.contract_type ?? transaction.shortcode) ?? "rise",
    stake: buyPrice,
    buyPrice,
    payout,
    entrySpot: stringFrom(transaction.entry_spot) ?? "0",
    currentSpot: stringFrom(transaction.exit_spot ?? transaction.entry_spot) ?? "0",
    profit,
    currency: stringFrom(transaction.currency) ?? "USD",
    purchaseTime,
    expiryTime: closeTime,
    status: normalizeStatus(transaction.status, profit),
    isSellable: false,
  };
}

function normalizeDirection(value: unknown): TradeDirection | undefined {
  const normalized = stringFrom(value)?.toUpperCase();

  if (!normalized) {
    return undefined;
  }

  if (normalized.includes("CALL")) {
    return "rise";
  }

  if (normalized.includes("PUT")) {
    return "fall";
  }

  return undefined;
}

function normalizeStatus(value: unknown, profit: string): PositionStatus {
  const status = stringFrom(value)?.toLowerCase();

  if (status === "won" || status === "lost" || status === "sold" || status === "unknown") {
    return status;
  }

  const profitNumber = Number(profit);

  if (Number.isFinite(profitNumber)) {
    return profitNumber >= 0 ? "won" : "lost";
  }

  return "unknown";
}

function stringFrom(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : undefined;
}

function numberFrom(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  }

  return undefined;
}
