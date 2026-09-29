import { describe, expect, it, vi } from "vitest";

import { DerivTradingProvider } from "@/deriv/services/deriv-trading-provider";
import { AppError } from "@/lib/errors";
import type { BuyRequest, Position } from "@/types";

const buyRequest: BuyRequest = {
  accountId: "DOT90004580",
  accountType: "demo",
  proposalId: "proposal-123",
  proposal: {
    id: "proposal-123",
    askPrice: "10",
    payout: "19.53",
    potentialProfit: "9.53",
    spot: "1016.59",
    receivedAt: 1_793_456_000,
  },
  proposalRequest: {
    accountId: "DOT90004580",
    symbol: "1HZ100V",
    direction: "rise",
    stake: "10",
    currency: "USD",
    duration: 5,
    durationUnit: "minutes",
  },
};

describe("DerivTradingProvider.buy", () => {
  it("sends a demo buy request using the proposal id and ask price", async () => {
    const request = vi.fn().mockResolvedValue({
      buy: {
        contract_id: 987654321,
        purchase_time: 1_793_456_100,
      },
    });
    const provider = new DerivTradingProvider(undefined, () => ({ request }) as never);

    await expect(provider.buy(buyRequest)).resolves.toEqual({
      contractId: "987654321",
      purchasedAt: 1_793_456_100,
    });
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith({
      buy: "proposal-123",
      price: 10,
    });
  });

  it("rejects real-account execution during the demo-only phase", async () => {
    const request = vi.fn();
    const provider = new DerivTradingProvider(undefined, () => ({ request }) as never);

    await expect(provider.buy({ ...buyRequest, accountType: "real" })).rejects.toMatchObject({
      code: "TRADE_REJECTED",
      retryable: false,
    });
    expect(request).not.toHaveBeenCalled();
  });

  it("does not retry ambiguous buy timeouts", async () => {
    const request = vi.fn().mockRejectedValue(
      new AppError({
        code: "CONNECTION_LOST",
        title: "Request timed out",
        message: "Deriv did not respond before the authenticated request timeout.",
        retryable: true,
      }),
    );
    const provider = new DerivTradingProvider(undefined, () => ({ request }) as never);

    await expect(provider.buy(buyRequest)).rejects.toMatchObject({
      code: "TRADE_REJECTED",
      title: "Trade status unknown",
      retryable: false,
    });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("preserves mapped provider errors such as insufficient balance", async () => {
    const request = vi.fn().mockRejectedValue(
      new AppError({
        code: "INSUFFICIENT_BALANCE",
        title: "Insufficient balance",
        message: "Your account balance is not enough for this trade.",
        retryable: false,
      }),
    );
    const provider = new DerivTradingProvider(undefined, () => ({ request }) as never);

    await expect(provider.buy(buyRequest)).rejects.toMatchObject({
      code: "INSUFFICIENT_BALANCE",
      retryable: false,
    });
    expect(request).toHaveBeenCalledTimes(1);
  });
});

describe("DerivTradingProvider.sell", () => {
  it("sends sell request using the current provider sell quote", async () => {
    const request = vi.fn().mockResolvedValue({
      sell: {
        contract_id: 987654321,
        sold_for: "11.25",
        profit: "1.25",
        transaction_time: 1_793_456_120,
      },
    });
    const provider = new DerivTradingProvider(undefined, () => ({ request }) as never);

    await expect(
      provider.sell({
        accountId: "DOT90004580",
        contractId: "987654321",
        buyPrice: "10",
        sellPrice: "11.25",
      }),
    ).resolves.toEqual({
      contractId: "987654321",
      soldFor: "11.25",
      profit: "1.25",
      soldAt: 1_793_456_120,
    });
    expect(request).toHaveBeenCalledWith({
      sell: 987654321,
      price: 11.25,
    });
  });

  it("rejects sell when the contract has no current sell quote", async () => {
    const request = vi.fn();
    const provider = new DerivTradingProvider(undefined, () => ({ request }) as never);

    await expect(
      provider.sell({
        accountId: "DOT90004580",
        contractId: "987654321",
        buyPrice: "10",
      }),
    ).rejects.toMatchObject({
      code: "TRADE_REJECTED",
      title: "Sell unavailable",
      retryable: false,
    });
    expect(request).not.toHaveBeenCalled();
  });

  it("preserves provider rejection when the contract becomes unsellable", async () => {
    const request = vi.fn().mockRejectedValue(
      new AppError({
        code: "TRADE_REJECTED",
        title: "Sell unavailable",
        message: "This contract can no longer be sold.",
        retryable: false,
      }),
    );
    const provider = new DerivTradingProvider(undefined, () => ({ request }) as never);

    await expect(
      provider.sell({
        accountId: "DOT90004580",
        contractId: "987654321",
        buyPrice: "10",
        sellPrice: "11.25",
      }),
    ).rejects.toMatchObject({
      code: "TRADE_REJECTED",
      retryable: false,
    });
    expect(request).toHaveBeenCalledTimes(1);
  });
});

describe("DerivTradingProvider.subscribeToPosition", () => {
  it("subscribes to proposal_open_contract and normalizes position updates", async () => {
    const seedPosition: Position = {
      contractId: "987654321",
      symbol: "1HZ100V",
      displaySymbol: "Volatility 100 (1s) Index",
      direction: "rise",
      stake: "10",
      buyPrice: "10",
      payout: "19.53",
      entrySpot: "1016.59",
      currentSpot: "1016.59",
      profit: "0",
      currency: "USD",
      purchaseTime: 1_793_456_100,
      expiryTime: 1_793_456_400,
      status: "open",
      isSellable: false,
    };
    const unsubscribe = vi.fn();
    const subscribe = vi.fn(async (_key, payload, onMessage) => {
      onMessage({
        proposal_open_contract: {
          contract_id: 987654321,
          contract_type: "CALL",
          buy_price: 10,
          payout: "19.53",
          current_spot: "1018.00",
          profit: "1.11",
          currency: "USD",
          status: "open",
          is_valid_to_sell: 1,
          sell_price: "11.11",
        },
        subscription: { id: "contract-sub" },
      });

      return unsubscribe;
    });
    const onPosition = vi.fn();
    const provider = new DerivTradingProvider(undefined, () => ({ subscribe }) as never);

    await expect(
      provider.subscribeToPosition("DOT90004580", "987654321", onPosition, undefined, seedPosition),
    ).resolves.toBe(unsubscribe);

    expect(subscribe).toHaveBeenCalledWith(
      "proposal_open_contract:987654321",
      {
        proposal_open_contract: 1,
        contract_id: 987654321,
      },
      expect.any(Function),
      undefined,
    );
    expect(onPosition).toHaveBeenCalledWith(
      expect.objectContaining({
        contractId: "987654321",
        displaySymbol: "Volatility 100 (1s) Index",
        currentSpot: "1018.00",
        profit: "1.11",
        isSellable: true,
      }),
    );
  });
});

describe("DerivTradingProvider.getOpenPositions", () => {
  it("retrieves and normalizes provider portfolio contracts for restoration", async () => {
    const request = vi.fn().mockResolvedValue({
      portfolio: {
        contracts: [
          {
            contract_id: 123456789,
            contract_type: "CALL",
            underlying_symbol: "1HZ100V",
            longcode: "Win payout if Volatility 100 rises",
            currency: "USD",
            buy_price: "10",
            payout: "19.53",
            entry_spot: "1016.59",
            current_spot: "1017.25",
            profit: "0.74",
            purchase_time: 1_793_456_000,
            expiry_time: 1_793_456_300,
            status: "open",
          },
        ],
      },
    });
    const provider = new DerivTradingProvider(undefined, () => ({ request }) as never);

    await expect(provider.getOpenPositions("DOT90004580")).resolves.toEqual([
      expect.objectContaining({
        contractId: "123456789",
        symbol: "1HZ100V",
        displaySymbol: "Win payout if Volatility 100 rises",
        currentSpot: "1017.25",
        profit: "0.74",
        status: "open",
      }),
    ]);
    expect(request).toHaveBeenCalledWith({ portfolio: 1 });
  });
});

describe("DerivTradingProvider.getTradeHistory", () => {
  it("requests Deriv profit_table with pagination and date filters", async () => {
    const request = vi.fn().mockResolvedValue({
      profit_table: {
        count: 1,
        transactions: [
          {
            contract_id: 123456789,
            contract_type: "CALL",
            underlying_symbol: "1HZ100V",
            longcode: "Win payout if Volatility 100 rises",
            currency: "USD",
            buy_price: "10",
            payout: "19.53",
            profit: "9.53",
            purchase_time: 1_793_456_000,
            sell_time: 1_793_456_300,
            status: "won",
          },
        ],
      },
    });
    const provider = new DerivTradingProvider(undefined, () => ({ request }) as never);

    await expect(
      provider.getTradeHistory({
        accountId: "DOT90004580",
        symbol: "1HZ100V",
        status: "won",
        dateFrom: "2026-09-01",
        dateTo: "2026-09-27",
        limit: 20,
        offset: 40,
      }),
    ).resolves.toEqual({
      positions: [
        expect.objectContaining({
          contractId: "123456789",
          symbol: "1HZ100V",
          status: "won",
          profit: "9.53",
        }),
      ],
      total: 1,
      nextOffset: undefined,
    });

    expect(request).toHaveBeenCalledWith({
      profit_table: 1,
      description: 1,
      sort: "DESC",
      limit: 20,
      offset: 40,
      date_from: "2026-09-01",
      date_to: "2026-09-27",
    });
  });
});
