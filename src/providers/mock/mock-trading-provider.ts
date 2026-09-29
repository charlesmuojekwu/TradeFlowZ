import { addMoney, subtractMoney } from "@/lib/money";
import type { TradingProvider } from "@/providers/interfaces";
import type {
  BuyRequest,
  BuyResult,
  ContractAvailability,
  Position,
  ProposalRequest,
  SellRequest,
  SellResult,
  TradeHistoryFilter,
  TradeHistoryPage,
  TradeProposal,
  Unsubscribe,
} from "@/types";

import { mockMarkets, mockOpenPositions } from "./mock-data";

const positions = new Map<string, Position>();

export class MockTradingProvider implements TradingProvider {
  async getContractAvailability(symbol: string): Promise<ContractAvailability> {
    return {
      symbol,
      contractTypes: [
        { direction: "rise", providerType: "MOCK_RISE", displayName: "Rise" },
        { direction: "fall", providerType: "MOCK_FALL", displayName: "Fall" },
      ],
      directions: ["rise", "fall"],
      durationConstraints: [
        { unit: "ticks", min: 1, max: 10 },
        { unit: "minutes", min: 1, max: 60 },
      ],
      durationUnits: ["ticks", "minutes"],
      minDuration: 1,
      maxDuration: 60,
      minStake: "1",
      maxStake: "1000",
      isSellable: true,
      isAvailable: true,
    };
  }

  async getProposal(request: ProposalRequest): Promise<TradeProposal> {
    const payout = addMoney(request.stake, "8.63");

    return {
      id: `mock-proposal-${Date.now()}`,
      askPrice: request.stake,
      payout,
      potentialProfit: subtractMoney(payout, request.stake),
      spot: "1000.00",
      receivedAt: Math.floor(Date.now() / 1000),
    };
  }

  async buy(request: BuyRequest): Promise<BuyResult> {
    const contractId = `mock-contract-${Date.now()}`;
    const market =
      mockMarkets.find((item) => item.symbol === request.proposalRequest.symbol) ?? mockMarkets[0];
    const now = Math.floor(Date.now() / 1000);

    positions.set(contractId, {
      contractId,
      symbol: market.symbol,
      displaySymbol: market.displayName,
      direction: request.proposalRequest.direction,
      stake: request.proposal.askPrice,
      buyPrice: request.proposal.askPrice,
      payout: request.proposal.payout,
      entrySpot: request.proposal.spot,
      currentSpot: request.proposal.spot,
      profit: "0",
      currency: request.proposalRequest.currency,
      purchaseTime: now,
      expiryTime: now + Math.max(20, request.proposalRequest.duration * 12),
      status: "open",
      isSellable: true,
    });

    return {
      contractId,
      purchasedAt: now,
    };
  }

  async subscribeToPosition(
    accountId: string,
    contractId: string,
    onPosition: (position: Position) => void,
    onError?: never,
    seedPosition?: Position,
  ): Promise<Unsubscribe> {
    const basePosition = positions.get(contractId) ?? seedPosition;
    void accountId;
    void onError;

    if (!basePosition) {
      return () => undefined;
    }

    let spot = Number(basePosition.entrySpot);
    let ticks = 0;

    const publish = () => {
      ticks += 1;
      spot += Math.random() * 2 - 0.85;
      const now = Math.floor(Date.now() / 1000);
      const isFinal = now >= basePosition.expiryTime || ticks >= 60;
      const hasWon =
        basePosition.direction === "rise"
          ? spot >= Number(basePosition.entrySpot)
          : spot < Number(basePosition.entrySpot);
      const finalProfit = hasWon
        ? subtractMoney(basePosition.payout, basePosition.buyPrice)
        : `-${basePosition.buyPrice}`;
      const floatingProfit = (spot - Number(basePosition.entrySpot)).toFixed(2);

      const position: Position = {
        ...basePosition,
        currentSpot: spot.toFixed(2),
        profit: isFinal ? finalProfit : floatingProfit,
        status: isFinal ? (hasWon ? "won" : "lost") : "open",
        isSellable: !isFinal,
      };

      positions.set(contractId, position);
      onPosition(position);

      if (isFinal) {
        window.clearInterval(interval);
      }
    };

    publish();
    const interval = window.setInterval(publish, 1000);

    return () => window.clearInterval(interval);
  }

  async getOpenPositions(): Promise<Position[]> {
    return [...mockOpenPositions, ...Array.from(positions.values()).filter((position) => position.status === "open")];
  }

  async getTradeHistory(filter: TradeHistoryFilter): Promise<TradeHistoryPage> {
    const now = Math.floor(Date.now() / 1000);
    const mockHistory: Position[] = [
      {
        contractId: "mock-history-won-1",
        symbol: "MOCK_R_100",
        displaySymbol: "Volatility 100 Index",
        direction: "rise",
        stake: "10",
        buyPrice: "10",
        payout: "18.63",
        entrySpot: "1000.25",
        currentSpot: "1003.41",
        profit: "8.63",
        currency: "USD",
        purchaseTime: now - 3600,
        expiryTime: now - 3300,
        status: "won",
        isSellable: false,
      },
      {
        contractId: "mock-history-lost-1",
        symbol: "MOCK_FRX_EURUSD",
        displaySymbol: "EUR/USD",
        direction: "fall",
        stake: "10",
        buyPrice: "10",
        payout: "0",
        entrySpot: "1.08421",
        currentSpot: "1.08498",
        profit: "-10",
        currency: "USD",
        purchaseTime: now - 7200,
        expiryTime: now - 6900,
        status: "lost",
        isSellable: false,
      },
      ...Array.from(positions.values()).filter((position) => position.status !== "open"),
    ];
    const filtered = mockHistory.filter((position) => {
      if (filter.symbol && position.symbol !== filter.symbol) {
        return false;
      }

      if (filter.direction && position.direction !== filter.direction) {
        return false;
      }

      if (filter.status && position.status !== filter.status) {
        return false;
      }

      return true;
    });
    const offset = filter.offset ?? 0;
    const limit = filter.limit ?? 20;

    return {
      positions: filtered.slice(offset, offset + limit),
      total: filtered.length,
      nextOffset: offset + limit >= filtered.length ? undefined : offset + limit,
    };
  }

  async sell(request: SellRequest): Promise<SellResult> {
    const position = positions.get(request.contractId);
    const soldFor = request.sellPrice ?? position?.sellPrice ?? "10";

    return {
      contractId: request.contractId,
      soldFor,
      profit: subtractMoney(soldFor, request.buyPrice),
      soldAt: Math.floor(Date.now() / 1000),
    };
  }
}
