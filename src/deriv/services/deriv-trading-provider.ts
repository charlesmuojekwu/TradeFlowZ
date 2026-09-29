import { env } from "@/config/env";
import { normalizeDerivBuy } from "@/deriv/mappers/buy-mapper";
import { mapContractsFor } from "@/deriv/mappers/contract-mapper";
import { mapDerivOpenContractUpdate } from "@/deriv/mappers/open-contract-mapper";
import { mapDerivPortfolio } from "@/deriv/mappers/portfolio-mapper";
import { mapDerivProfitTable } from "@/deriv/mappers/profit-table-mapper";
import { mapDerivProposal, mapProposalRequestToDeriv } from "@/deriv/mappers/proposal-mapper";
import { normalizeDerivSell } from "@/deriv/mappers/sell-mapper";
import { DerivPublicWebSocketClient } from "@/deriv/websocket";
import { getAuthenticatedTradingClient } from "@/deriv/websocket/authenticated-trading-client-registry";
import { AppError } from "@/lib/errors";
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

export class DerivTradingProvider implements TradingProvider {
  private readonly client: DerivPublicWebSocketClient;
  private readonly getAuthenticatedClient: typeof getAuthenticatedTradingClient;

  constructor(
    client = new DerivPublicWebSocketClient({ url: env.NEXT_PUBLIC_DERIV_PUBLIC_WS_URL }),
    getAuthenticatedClient = getAuthenticatedTradingClient,
  ) {
    this.client = client;
    this.getAuthenticatedClient = getAuthenticatedClient;
  }

  async getContractAvailability(symbol: string): Promise<ContractAvailability> {
    const response = await this.client.request({ contracts_for: symbol });
    const contractsFor = response.contracts_for;

    if (!isRecord(contractsFor) || !Array.isArray(contractsFor.available)) {
      throw new AppError({
        code: "CONTRACT_UNAVAILABLE",
        title: "Contract unavailable",
        message: "Deriv did not return contract availability for this market.",
        retryable: true,
      });
    }

    return mapContractsFor(symbol, contractsFor.available);
  }

  async getProposal(request: ProposalRequest): Promise<TradeProposal> {
    const response = await this.client.request(mapProposalRequestToDeriv(request));

    if (!isRecord(response.proposal)) {
      throw new AppError({
        code: "PRICE_UNAVAILABLE",
        title: "Price unavailable",
        message: "Deriv did not return a quote for this configuration.",
        retryable: true,
      });
    }

    try {
      return mapDerivProposal(response.proposal);
    } catch (caught) {
      throw new AppError({
        code: "PRICE_UNAVAILABLE",
        title: "Price unavailable",
        message: caught instanceof Error ? caught.message : "Deriv returned an invalid proposal.",
        retryable: true,
      });
    }
  }

  async buy(request: BuyRequest): Promise<BuyResult> {
    if (request.accountType !== "demo") {
      throw new AppError({
        code: "TRADE_REJECTED",
        title: "Demo trading only",
        message: "Real-money trading is disabled at this stage. Select a demo account to place trades.",
        retryable: false,
      });
    }

    try {
      const response = await this.getAuthenticatedClient(request.accountId).request({
        buy: request.proposalId,
        price: Number(request.proposal.askPrice),
      });

      return normalizeDerivBuy(response);
    } catch (caught) {
      if (caught instanceof AppError && caught.code === "CONNECTION_LOST") {
        throw new AppError({
          code: "TRADE_REJECTED",
          title: "Trade status unknown",
          message:
            "The buy request did not receive a clear confirmation. It was not retried because the provider may still have executed it.",
          retryable: false,
          originalCode: caught.originalCode,
        });
      }

      if (caught instanceof AppError) {
        throw caught;
      }

      if (caught instanceof Error) {
        throw new AppError({
          code: "TRADE_REJECTED",
          title: "Trade rejected",
          message: caught.message,
          retryable: false,
        });
      }

      throw caught;
    }
  }

  async subscribeToPosition(
    accountId: string,
    contractId: string,
    onPosition: (position: Position) => void,
    onError?: (error: AppError) => void,
    seedPosition?: Position,
  ): Promise<Unsubscribe> {
    const seed =
      seedPosition ??
      createUnknownSeedPosition({
        contractId,
      });

    return this.getAuthenticatedClient(accountId).subscribe(
      `proposal_open_contract:${contractId}`,
      {
        proposal_open_contract: 1,
        contract_id: numericContractId(contractId),
      },
      (message) => {
        try {
          onPosition(mapDerivOpenContractUpdate(message, seed));
        } catch (caught) {
          onError?.(
            new AppError({
              code: "UNKNOWN",
              title: "Position update unavailable",
              message: caught instanceof Error ? caught.message : "Unable to normalize the position update.",
              retryable: true,
            }),
          );
        }
      },
      onError,
    );
  }

  async getOpenPositions(accountId: string): Promise<Position[]> {
    const response = await this.getAuthenticatedClient(accountId).request({ portfolio: 1 });

    try {
      return mapDerivPortfolio(response).filter((position) => position.status === "open");
    } catch (caught) {
      throw new AppError({
        code: "UNKNOWN",
        title: "Open positions unavailable",
        message: caught instanceof Error ? caught.message : "Unable to normalize open positions.",
        retryable: true,
      });
    }
  }

  async getTradeHistory(filter: TradeHistoryFilter): Promise<TradeHistoryPage> {
    const limit = filter.limit ?? 20;
    const offset = filter.offset ?? 0;
    const payload: Record<string, string | number> = {
      profit_table: 1,
      description: 1,
      sort: "DESC",
      limit,
      offset,
    };

    if (filter.dateFrom) {
      payload.date_from = filter.dateFrom;
    }

    if (filter.dateTo) {
      payload.date_to = filter.dateTo;
    }

    const response = await this.getAuthenticatedClient(filter.accountId).request(payload);

    try {
      const page = mapDerivProfitTable(response);
      const positions = page.positions.filter((position) => {
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

      return {
        positions,
        total: page.total,
        nextOffset: page.total !== undefined && offset + limit >= page.total ? undefined : offset + limit,
      };
    } catch (caught) {
      throw new AppError({
        code: "UNKNOWN",
        title: "Trade history unavailable",
        message: caught instanceof Error ? caught.message : "Unable to normalize trade history.",
        retryable: true,
      });
    }
  }

  async sell(request: SellRequest): Promise<SellResult> {
    if (!request.sellPrice) {
      throw new AppError({
        code: "TRADE_REJECTED",
        title: "Sell unavailable",
        message: "This contract can no longer be sold.",
        retryable: false,
      });
    }

    try {
      const response = await this.getAuthenticatedClient(request.accountId).request({
        sell: numericContractId(request.contractId),
        price: Number(request.sellPrice),
      });

      return normalizeDerivSell(response, request, request.buyPrice);
    } catch (caught) {
      if (caught instanceof AppError) {
        throw caught;
      }

      if (caught instanceof Error) {
        throw new AppError({
          code: "TRADE_REJECTED",
          title: "Sell rejected",
          message: caught.message,
          retryable: false,
        });
      }

      throw caught;
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function numericContractId(contractId: string) {
  const numeric = Number(contractId);
  return Number.isFinite(numeric) ? numeric : contractId;
}

function createUnknownSeedPosition({
  contractId,
}: {
  contractId: string;
}): Position {
  const now = Math.floor(Date.now() / 1000);

  return {
    contractId,
    symbol: contractId,
    displaySymbol: "Open contract",
    direction: "rise",
    stake: "0",
    buyPrice: "0",
    payout: "0",
    entrySpot: "0",
    currentSpot: "0",
    profit: "0",
    currency: "USD",
    purchaseTime: now,
    expiryTime: now,
    status: "unknown",
    isSellable: false,
  };
}
