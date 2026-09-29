import { describe, expect, it } from "vitest";

import { mapDerivError } from "@/deriv/mappers/error-mapper";

describe("mapDerivError", () => {
  it("maps expired authorization to a non-retryable session error", () => {
    expect(mapDerivError({ code: "Unauthorized", message: "Invalid or missing authentication credentials" })).toMatchObject({
      code: "SESSION_EXPIRED",
      title: "Session expired",
      retryable: false,
      originalCode: "Unauthorized",
    });
  });

  it("maps insufficient balance to a user-friendly trading error", () => {
    expect(mapDerivError({ code: "InsufficientBalance", message: "Balance too low" })).toMatchObject({
      code: "INSUFFICIENT_BALANCE",
      message: "Your account balance is not enough for this trade.",
      retryable: false,
    });
  });

  it("maps unsellable contracts to sell unavailable", () => {
    expect(mapDerivError({ code: "ValidationError", message: "Contract is not valid to sell" })).toMatchObject({
      code: "TRADE_REJECTED",
      title: "Sell unavailable",
      retryable: false,
    });
  });

  it("maps provider outage and timeouts to connection interruptions", () => {
    expect(mapDerivError({ code: "GatewayTimeout", message: "Upstream service timeout" })).toMatchObject({
      code: "CONNECTION_LOST",
      retryable: true,
    });
  });

  it("treats proposal pricing errors as stale quotes before generic contract validation", () => {
    expect(mapDerivError({ code: "ContractBuyValidationError", message: "This contract proposal price is no longer valid" })).toMatchObject({
      code: "PRICE_UNAVAILABLE",
      title: "Quote expired",
      retryable: true,
    });
  });
});
