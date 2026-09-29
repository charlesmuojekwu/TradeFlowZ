import type { Position, TradeDirection } from "@/types";

type DerivPortfolioContract = {
  contract_id?: unknown;
  contract_type?: unknown;
  underlying_symbol?: unknown;
  symbol?: unknown;
  display_name?: unknown;
  longcode?: unknown;
  currency?: unknown;
  buy_price?: unknown;
  payout?: unknown;
  entry_spot?: unknown;
  entry_tick?: unknown;
  current_spot?: unknown;
  profit?: unknown;
  purchase_time?: unknown;
  date_start?: unknown;
  expiry_time?: unknown;
  date_expiry?: unknown;
  status?: unknown;
  is_valid_to_sell?: unknown;
  sell_price?: unknown;
};

export function mapDerivPortfolio(message: unknown): Position[] {
  if (!message || typeof message !== "object" || !("portfolio" in message)) {
    throw new Error("Deriv did not return a portfolio response.");
  }

  const portfolio = message.portfolio;

  if (!portfolio || typeof portfolio !== "object" || !("contracts" in portfolio)) {
    throw new Error("Deriv returned an invalid portfolio response.");
  }

  const contracts = portfolio.contracts;

  if (!Array.isArray(contracts)) {
    throw new Error("Deriv portfolio contracts were not returned as an array.");
  }

  return contracts
    .filter((contract): contract is DerivPortfolioContract => Boolean(contract && typeof contract === "object"))
    .map(mapDerivPortfolioContract)
    .filter((position): position is Position => Boolean(position));
}

function mapDerivPortfolioContract(contract: DerivPortfolioContract): Position | undefined {
  const contractId = stringFrom(contract.contract_id);

  if (!contractId) {
    return undefined;
  }

  const symbol = stringFrom(contract.underlying_symbol ?? contract.symbol) ?? contractId;
  const buyPrice = stringFrom(contract.buy_price) ?? "0";
  const now = Math.floor(Date.now() / 1000);
  const status = normalizeStatus(contract.status);

  return {
    contractId,
    symbol,
    displaySymbol: stringFrom(contract.display_name ?? contract.longcode) ?? symbol,
    direction: normalizeDirection(contract.contract_type) ?? "rise",
    stake: buyPrice,
    buyPrice,
    payout: stringFrom(contract.payout) ?? "0",
    entrySpot: stringFrom(contract.entry_spot ?? contract.entry_tick) ?? "0",
    currentSpot: stringFrom(contract.current_spot ?? contract.entry_spot ?? contract.entry_tick) ?? "0",
    profit: stringFrom(contract.profit) ?? "0",
    currency: stringFrom(contract.currency) ?? "USD",
    purchaseTime: numberFrom(contract.purchase_time ?? contract.date_start) ?? now,
    expiryTime: numberFrom(contract.expiry_time ?? contract.date_expiry) ?? now,
    status,
    isSellable: status === "open" && booleanFrom(contract.is_valid_to_sell) && hasSellPrice(contract.sell_price),
    sellPrice: stringFrom(contract.sell_price),
  };
}

function normalizeDirection(value: unknown): TradeDirection | undefined {
  const normalized = stringFrom(value)?.toUpperCase();

  if (normalized === "CALL") {
    return "rise";
  }

  if (normalized === "PUT") {
    return "fall";
  }

  return undefined;
}

function normalizeStatus(value: unknown): Position["status"] {
  const status = stringFrom(value)?.toLowerCase();

  if (status === "won" || status === "lost" || status === "sold" || status === "unknown") {
    return status;
  }

  return "open";
}

function hasSellPrice(value: unknown) {
  if (value === undefined || value === null) {
    return false;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0;
}

function booleanFrom(value: unknown) {
  return value === true || value === 1 || value === "1";
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
