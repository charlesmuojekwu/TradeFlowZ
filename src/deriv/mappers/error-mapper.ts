import { AppError } from "@/lib/errors";

import type { DerivErrorPayload } from "@/deriv/types/websocket";
import type { AppErrorCode } from "@/lib/errors";

export function mapDerivError(error?: DerivErrorPayload, fallbackMessage = "Deriv request failed.") {
  const originalCode = error?.code;
  const classification = classifyDerivError(originalCode, error?.message ?? fallbackMessage);

  return new AppError({
    code: classification.code,
    title: classification.title,
    message: classification.message,
    retryable: classification.retryable,
    originalCode,
  });
}

function classifyDerivError(originalCode: string | undefined, providerMessage: string) {
  const normalized = `${originalCode ?? ""} ${providerMessage}`.toLowerCase();

  if (includesAny(normalized, ["invalidtoken", "unauthorized", "invalid or missing authentication", "session"])) {
    return appError("SESSION_EXPIRED", "Session expired", "Your Deriv session has expired. Sign in again to continue.", false);
  }

  if (includesAny(normalized, ["insufficient", "balance", "fund"])) {
    return appError("INSUFFICIENT_BALANCE", "Insufficient balance", "Your account balance is not enough for this trade.", false);
  }

  if (includesAny(normalized, ["marketisclosed", "market closed", "market unavailable"])) {
    return appError("MARKET_UNAVAILABLE", "Market unavailable", "This market is currently unavailable.", true);
  }

  if (includesAny(normalized, ["sell", "sold", "not valid to sell"])) {
    return appError("TRADE_REJECTED", "Sell unavailable", "This contract can no longer be sold.", false);
  }

  if (includesAny(normalized, ["proposal", "quote", "price", "spot", "rate limit"])) {
    return appError("PRICE_UNAVAILABLE", "Quote expired", "A fresh quote is required before buying. Wait for pricing to refresh and try again.", true);
  }

  if (includesAny(normalized, ["contract", "barrier", "duration", "stake", "validation"])) {
    return appError("CONTRACT_UNAVAILABLE", "Contract unavailable", "This contract configuration is no longer available.", true);
  }

  if (includesAny(normalized, ["timeout", "connection", "disconnect", "network", "service unavailable", "gateway"])) {
    return appError("CONNECTION_LOST", "Connection interrupted", "The provider connection was interrupted. Retrying is safe for market data, but trades are not retried automatically.", true);
  }

  return appError("UNKNOWN", "Provider error", userFriendlyFallback(providerMessage), true);
}

function appError(code: AppErrorCode, title: string, message: string, retryable: boolean) {
  return { code, title, message, retryable };
}

function includesAny(value: string, patterns: string[]) {
  return patterns.some((pattern) => value.includes(pattern));
}

function userFriendlyFallback(message: string) {
  if (!message || message === "Deriv request failed.") {
    return "The provider could not complete the request. Please try again.";
  }

  return message.length > 180 ? "The provider could not complete the request. Please try again." : message;
}
