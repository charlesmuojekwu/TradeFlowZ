export type AppErrorCode =
  | "UNKNOWN"
  | "CONFIG_INVALID"
  | "MARKET_UNAVAILABLE"
  | "PRICE_UNAVAILABLE"
  | "TRADE_REJECTED"
  | "INSUFFICIENT_BALANCE"
  | "CONNECTION_LOST"
  | "SESSION_EXPIRED"
  | "CONTRACT_UNAVAILABLE"
  | "VALIDATION_ERROR";

export type AppErrorShape = {
  code: AppErrorCode;
  title: string;
  message: string;
  retryable: boolean;
  originalCode?: string;
};

export class AppError extends Error implements AppErrorShape {
  code: AppErrorCode;
  title: string;
  retryable: boolean;
  originalCode?: string;

  constructor(error: AppErrorShape) {
    super(error.message);
    this.name = "AppError";
    this.code = error.code;
    this.title = error.title;
    this.retryable = error.retryable;
    this.originalCode = error.originalCode;
  }
}

export function toAppError(error: unknown, fallback?: Partial<AppErrorShape>): AppError {
  if (error instanceof AppError) {
    return error;
  }

  const message = error instanceof Error ? error.message : "An unexpected error occurred.";

  return new AppError({
    code: fallback?.code ?? "UNKNOWN",
    title: fallback?.title ?? "Unexpected error",
    message: fallback?.message ?? message,
    retryable: fallback?.retryable ?? false,
    originalCode: fallback?.originalCode,
  });
}
