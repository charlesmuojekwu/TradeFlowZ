import type { Position, TradeDirection } from "@/types";

type DerivOpenContractPayload = {
  contract_id?: unknown;
  contract_type?: unknown;
  underlying?: unknown;
  display_name?: unknown;
  longcode?: unknown;
  currency?: unknown;
  buy_price?: unknown;
  bid_price?: unknown;
  current_spot?: unknown;
  entry_spot?: unknown;
  entry_tick?: unknown;
  payout?: unknown;
  profit?: unknown;
  purchase_time?: unknown;
  date_start?: unknown;
  expiry_time?: unknown;
  date_expiry?: unknown;
  status?: unknown;
  is_sold?: unknown;
  is_expired?: unknown;
  is_valid_to_sell?: unknown;
  sell_price?: unknown;
};

export function mapDerivOpenContractUpdate(message: unknown, seed: Position): Position {
  const contract = getOpenContractPayload(message);
  const contractId = stringFrom(contract.contract_id) ?? seed.contractId;

  if (contractId !== seed.contractId) {
    throw new Error("Deriv returned an update for a different contract.");
  }

  const status = normalizeStatus(contract);

  return {
    ...seed,
    contractId,
    symbol: stringFrom(contract.underlying) ?? seed.symbol,
    displaySymbol: stringFrom(contract.display_name ?? contract.longcode) ?? seed.displaySymbol,
    direction: normalizeDirection(contract.contract_type) ?? seed.direction,
    stake: stringFrom(contract.buy_price) ?? seed.stake,
    buyPrice: stringFrom(contract.buy_price) ?? seed.buyPrice,
    payout: stringFrom(contract.payout) ?? seed.payout,
    entrySpot: stringFrom(contract.entry_spot ?? contract.entry_tick) ?? seed.entrySpot,
    currentSpot: stringFrom(contract.current_spot) ?? seed.currentSpot,
    profit: stringFrom(contract.profit) ?? seed.profit,
    currency: stringFrom(contract.currency) ?? seed.currency,
    purchaseTime: numberFrom(contract.purchase_time ?? contract.date_start) ?? seed.purchaseTime,
    expiryTime: numberFrom(contract.expiry_time ?? contract.date_expiry) ?? seed.expiryTime,
    status,
    isSellable: status === "open" && booleanFrom(contract.is_valid_to_sell) && hasSellPrice(contract.sell_price),
    sellPrice: stringFrom(contract.sell_price ?? contract.bid_price) ?? seed.sellPrice,
  };
}

function getOpenContractPayload(message: unknown) {
  if (!message || typeof message !== "object" || !("proposal_open_contract" in message)) {
    throw new Error("Deriv did not return an open contract update.");
  }

  const payload = message.proposal_open_contract;

  if (!payload || typeof payload !== "object") {
    throw new Error("Deriv returned an invalid open contract update.");
  }

  return payload as DerivOpenContractPayload;
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

function normalizeStatus(contract: DerivOpenContractPayload): Position["status"] {
  const status = stringFrom(contract.status)?.toLowerCase();

  if (status === "won" || status === "lost" || status === "sold") {
    return status;
  }

  if (status === "unknown" || status === "error") {
    return "unknown";
  }

  if (booleanFrom(contract.is_sold)) {
    return status === "won" || status === "lost" ? status : "sold";
  }

  if (booleanFrom(contract.is_expired)) {
    return status === "lost" ? "lost" : "unknown";
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
