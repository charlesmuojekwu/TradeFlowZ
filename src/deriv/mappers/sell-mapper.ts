import { subtractMoney } from "@/lib/money";
import type { SellRequest, SellResult } from "@/types";

type DerivSellPayload = {
  contract_id?: unknown;
  sold_for?: unknown;
  sell_price?: unknown;
  profit?: unknown;
  transaction_time?: unknown;
  sold_at?: unknown;
};

export function normalizeDerivSell(message: unknown, request: SellRequest, buyPrice: string): SellResult {
  if (!message || typeof message !== "object" || !("sell" in message)) {
    throw new Error("Deriv did not return a sell confirmation.");
  }

  const sell = message.sell;

  if (!sell || typeof sell !== "object") {
    throw new Error("Deriv returned an invalid sell confirmation.");
  }

  const payload = sell as DerivSellPayload;
  const soldFor = stringFrom(payload.sold_for ?? payload.sell_price);

  if (!soldFor) {
    throw new Error("Deriv sell confirmation did not include a sold price.");
  }

  return {
    contractId: stringFrom(payload.contract_id) ?? request.contractId,
    soldFor,
    profit: stringFrom(payload.profit) ?? subtractMoney(soldFor, buyPrice),
    soldAt: numberFrom(payload.transaction_time ?? payload.sold_at) ?? Math.floor(Date.now() / 1000),
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
