import type { BuyResult, Market, Position, ProposalRequest, TradeProposal } from "@/types";

type CreatePositionFromBuyInput = {
  result: BuyResult;
  market: Market;
  proposal: TradeProposal;
  proposalRequest: ProposalRequest;
  isSellable: boolean;
};

export function createPositionFromBuy({
  result,
  market,
  proposal,
  proposalRequest,
  isSellable,
}: CreatePositionFromBuyInput): Position {
  return {
    contractId: result.contractId,
    symbol: market.symbol,
    displaySymbol: market.displayName,
    direction: proposalRequest.direction,
    stake: proposal.askPrice,
    buyPrice: proposal.askPrice,
    payout: proposal.payout,
    entrySpot: proposal.spot,
    currentSpot: proposal.spot,
    profit: "0",
    currency: proposalRequest.currency,
    purchaseTime: result.purchasedAt,
    expiryTime: calculateExpiryTime(result.purchasedAt, proposalRequest.duration, proposalRequest.durationUnit),
    status: "open",
    isSellable,
  };
}

function calculateExpiryTime(purchasedAt: number, duration: number, durationUnit: ProposalRequest["durationUnit"]) {
  const multipliers: Record<ProposalRequest["durationUnit"], number> = {
    ticks: 1,
    seconds: 1,
    minutes: 60,
    hours: 60 * 60,
    days: 24 * 60 * 60,
  };

  return purchasedAt + duration * multipliers[durationUnit];
}
