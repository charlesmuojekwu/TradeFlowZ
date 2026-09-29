import type { BuyResult } from "@/types";

type DerivBuyPayload = {
  contract_id?: unknown;
  contractId?: unknown;
  purchase_time?: unknown;
  start_time?: unknown;
};

export function normalizeDerivBuy(message: unknown): BuyResult {
  if (!message || typeof message !== "object" || !("buy" in message)) {
    throw new Error("Deriv did not return a buy confirmation.");
  }

  const buy = message.buy;

  if (!buy || typeof buy !== "object") {
    throw new Error("Deriv returned an invalid buy confirmation.");
  }

  const payload = buy as DerivBuyPayload;
  const contractId = stringFrom(payload.contract_id ?? payload.contractId);

  if (!contractId) {
    throw new Error("Deriv buy confirmation did not include a contract id.");
  }

  return {
    contractId,
    purchasedAt: numberFrom(payload.purchase_time ?? payload.start_time) ?? Math.floor(Date.now() / 1000),
  };
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
