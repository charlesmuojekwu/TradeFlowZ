import type { AppError } from "@/lib/errors";
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

export type PositionHandler = (position: Position) => void;
export type TradingErrorHandler = (error: AppError) => void;

export interface TradingProvider {
  getContractAvailability(symbol: string): Promise<ContractAvailability>;
  getProposal(request: ProposalRequest): Promise<TradeProposal>;
  buy(request: BuyRequest): Promise<BuyResult>;
  subscribeToPosition(
    accountId: string,
    contractId: string,
    onPosition: PositionHandler,
    onError?: TradingErrorHandler,
    seedPosition?: Position,
  ): Promise<Unsubscribe>;
  getOpenPositions(accountId: string): Promise<Position[]>;
  getTradeHistory(filter: TradeHistoryFilter): Promise<TradeHistoryPage>;
  sell(request: SellRequest): Promise<SellResult>;
}
