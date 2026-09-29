import type { ContractAvailability, DurationConstraint, DurationUnit, TradeDirection } from "@/types";

type DerivContractItem = {
  [key: string]: unknown;
  contract_type?: unknown;
  min_contract_duration?: unknown;
  max_contract_duration?: unknown;
  expiry_type?: unknown;
  sentiment?: unknown;
  min_price?: unknown;
  max_price?: unknown;
  min_stake?: unknown;
  max_stake?: unknown;
  can_sell?: unknown;
  is_sellable?: unknown;
  sell_available?: unknown;
};

const providerDirectionMap: Record<string, TradeDirection | undefined> = {
  CALL: "rise",
  PUT: "fall",
};

const providerUnitMap: Record<string, DurationUnit | undefined> = {
  t: "ticks",
  s: "seconds",
  m: "minutes",
  h: "hours",
  d: "days",
};

export function mapContractsFor(symbol: string, available: unknown[]): ContractAvailability {
  const items = available.filter(isRecord) as DerivContractItem[];
  const riseFallItems = items.filter((item) => mapContractDirection(item));
  const contractTypes = uniqueBy(
    riseFallItems.map((item) => {
      const direction = mapContractDirection(item);
      const providerType = asString(item.contract_type) ?? "";

      if (!direction || !providerType) {
        return undefined;
      }

      return {
        direction,
        providerType,
        displayName: direction === "rise" ? ("Rise" as const) : ("Fall" as const),
      };
    }),
    (item) => `${item?.direction}:${item?.providerType}`,
  ).filter((item): item is NonNullable<typeof item> => Boolean(item));

  const durationConstraints = mergeDurationConstraints(
    riseFallItems.flatMap((item) => [
      parseDurationConstraint(item.min_contract_duration, "min"),
      parseDurationConstraint(item.max_contract_duration, "max"),
    ]),
  );
  const durationUnits = durationConstraints.map((constraint) => constraint.unit);
  const minStake = firstStringLike(riseFallItems, ["min_stake", "min_price"]);
  const maxStake = firstStringLike(riseFallItems, ["max_stake", "max_price"]);

  return {
    symbol,
    contractTypes,
    directions: contractTypes.map((contract) => contract.direction),
    durationConstraints,
    durationUnits,
    minDuration: durationConstraints[0]?.min,
    maxDuration: durationConstraints[0]?.max,
    minStake,
    maxStake,
    isSellable: riseFallItems.some(isContractSellable),
    isAvailable: contractTypes.length > 0,
  };
}

export function mapDirectionToDerivContractType(direction: TradeDirection) {
  return direction === "rise" ? "CALL" : "PUT";
}

function mapContractDirection(item: DerivContractItem): TradeDirection | undefined {
  const contractType = asString(item.contract_type);
  if (contractType && providerDirectionMap[contractType]) {
    return providerDirectionMap[contractType];
  }

  const sentiment = asString(item.sentiment)?.toLowerCase();
  if (sentiment === "up") {
    return "rise";
  }

  if (sentiment === "down") {
    return "fall";
  }

  return undefined;
}

function parseDurationConstraint(value: unknown, side: "min" | "max") {
  const rawValue = asString(value);
  if (!rawValue) {
    return undefined;
  }

  const match = rawValue.match(/^(\d+)([a-z])$/i);
  if (!match) {
    return undefined;
  }

  const unit = providerUnitMap[match[2].toLowerCase()];
  const duration = Number(match[1]);
  if (!unit || !Number.isFinite(duration)) {
    return undefined;
  }

  return {
    unit,
    min: side === "min" ? duration : undefined,
    max: side === "max" ? duration : undefined,
  };
}

function mergeDurationConstraints(constraints: Array<DurationConstraint | undefined>) {
  const byUnit = new Map<DurationUnit, DurationConstraint>();

  constraints.forEach((constraint) => {
    if (!constraint) {
      return;
    }

    const existing = byUnit.get(constraint.unit) ?? { unit: constraint.unit };
    byUnit.set(constraint.unit, {
      unit: constraint.unit,
      min: minDefined(existing.min, constraint.min),
      max: maxDefined(existing.max, constraint.max),
    });
  });

  return Array.from(byUnit.values()).sort((left, right) => unitOrder(left.unit) - unitOrder(right.unit));
}

function isContractSellable(item: DerivContractItem) {
  return [item.can_sell, item.is_sellable, item.sell_available].some((value) => value === true || value === 1);
}

function firstStringLike(items: DerivContractItem[], keys: string[]) {
  for (const item of items) {
    for (const key of keys) {
      const value = item[key];
      if (typeof value === "number" || typeof value === "string") {
        return String(value);
      }
    }
  }

  return undefined;
}

function minDefined(left?: number, right?: number) {
  if (left === undefined) {
    return right;
  }

  if (right === undefined) {
    return left;
  }

  return Math.min(left, right);
}

function maxDefined(left?: number, right?: number) {
  if (left === undefined) {
    return right;
  }

  if (right === undefined) {
    return left;
  }

  return Math.max(left, right);
}

function unitOrder(unit: DurationUnit) {
  return ["ticks", "seconds", "minutes", "hours", "days"].indexOf(unit);
}

function uniqueBy<T>(items: T[], getKey: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}
