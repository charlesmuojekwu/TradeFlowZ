import Decimal from "decimal.js";

import type { DecimalString } from "@/types/common";

Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
});

export type MoneyInput = Decimal.Value;

export function toDecimal(value: MoneyInput): Decimal {
  return new Decimal(value);
}

export function normalizeDecimal(value: MoneyInput): DecimalString {
  return toDecimal(value).toFixed();
}

export function addMoney(left: MoneyInput, right: MoneyInput): DecimalString {
  return toDecimal(left).plus(right).toFixed();
}

export function subtractMoney(left: MoneyInput, right: MoneyInput): DecimalString {
  return toDecimal(left).minus(right).toFixed();
}

export function formatMoney(value: MoneyInput, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toDecimal(value).toNumber());
}
