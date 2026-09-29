import type { Market, PricePoint, Tick } from "@/types";

type DerivActiveSymbol = {
  [key: string]: unknown;
  symbol?: unknown;
  underlying_symbol?: unknown;
  display_name?: unknown;
  underlying_symbol_name?: unknown;
  market_display_name?: unknown;
  market?: unknown;
  subgroup?: unknown;
  submarket?: unknown;
  submarket_display_name?: unknown;
  pip?: unknown;
  pip_size?: unknown;
};

type DerivTick = {
  symbol?: unknown;
  quote?: unknown;
  epoch?: unknown;
  pip_size?: unknown;
};

type DerivHistory = {
  prices?: unknown;
  times?: unknown;
};

export function mapActiveSymbol(symbol: DerivActiveSymbol): Market | undefined {
  const providerSymbol = asString(symbol.underlying_symbol) ?? asString(symbol.symbol);

  if (!providerSymbol) {
    return undefined;
  }

  const displayName = asString(symbol.underlying_symbol_name) ?? asString(symbol.display_name) ?? providerSymbol;
  const market = asString(symbol.market) ?? "unknown";
  const submarket = asString(symbol.submarket) ?? asString(symbol.subgroup) ?? "unknown";

  return {
    symbol: providerSymbol,
    displayName,
    category: mapMarketCategory(market, asString(symbol.market_display_name)),
    market,
    submarket,
    pipSize: normalizePipSize(symbol.pip_size) ?? normalizePipSize(symbol.pip) ?? 2,
  };
}

export function mapTick(tick: DerivTick, fallback?: Market): Tick {
  const symbol = asString(tick.symbol) ?? fallback?.symbol ?? "UNKNOWN";
  const pipSize = normalizePipSize(tick.pip_size) ?? fallback?.pipSize ?? 2;

  return {
    symbol,
    displayName: fallback?.displayName ?? symbol,
    price: String(tick.quote ?? "0"),
    pipSize,
    epoch: asNumber(tick.epoch) ?? Math.floor(Date.now() / 1000),
  };
}

export function mapHistory(history: DerivHistory): PricePoint[] {
  if (!Array.isArray(history.prices) || !Array.isArray(history.times)) {
    return [];
  }

  const times = history.times;

  return history.prices.map((price, index) => ({
    time: Number(times[index] ?? 0),
    value: String(price),
  }));
}

function asString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : typeof value === "string" ? Number(value) : undefined;
}

function normalizePipSize(value: unknown) {
  const pip = asNumber(value);
  if (pip === undefined || Number.isNaN(pip) || pip <= 0) {
    return undefined;
  }

  if (Number.isInteger(pip) && pip > 0) {
    return pip;
  }

  return Math.max(0, Math.round(Math.abs(Math.log10(pip))));
}

function titleize(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function mapMarketCategory(market: string, providerDisplayName?: string) {
  const normalized = market.toLowerCase();

  if (providerDisplayName) {
    return providerDisplayName;
  }

  if (
    normalized.includes("synthetic") ||
    normalized.includes("random") ||
    normalized.includes("basket") ||
    normalized.includes("volidx") ||
    normalized.includes("indices")
  ) {
    return "Synthetic Indices";
  }

  if (normalized.includes("forex")) {
    return "Forex";
  }

  if (normalized.includes("crypto")) {
    return "Cryptocurrency";
  }

  if (normalized.includes("commodit") || normalized.includes("metal") || normalized.includes("energy")) {
    return "Commodities";
  }

  return titleize(market);
}
