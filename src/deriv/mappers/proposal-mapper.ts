import { subtractMoney } from "@/lib/money";
import type { DurationUnit, ProposalRequest, TradeProposal } from "@/types";

import { mapDirectionToDerivContractType } from "./contract-mapper";

type DerivProposalPayload = {
  [key: string]: unknown;
  id?: unknown;
  ask_price?: unknown;
  payout?: unknown;
  spot?: unknown;
  spot_time?: unknown;
  display_value?: unknown;
};

const providerDurationUnitMap: Record<DurationUnit, string> = {
  ticks: "t",
  seconds: "s",
  minutes: "m",
  hours: "h",
  days: "d",
};

export function mapProposalRequestToDeriv(request: ProposalRequest) {
  return {
    proposal: 1,
    amount: request.stake,
    basis: "stake",
    contract_type: mapDirectionToDerivContractType(request.direction),
    currency: request.currency,
    duration: request.duration,
    duration_unit: providerDurationUnitMap[request.durationUnit],
    underlying_symbol: request.symbol,
  };
}

export function mapDerivProposal(proposal: DerivProposalPayload): TradeProposal {
  const id = asString(proposal.id);
  const askPrice = stringifyMoney(proposal.ask_price ?? proposal.display_value);
  const payout = stringifyMoney(proposal.payout);
  const spot = stringifyMoney(proposal.spot) ?? "0";

  if (!id || !askPrice || !payout) {
    throw new Error("Deriv returned an incomplete proposal.");
  }

  return {
    id,
    askPrice,
    payout,
    potentialProfit: subtractMoney(payout, askPrice),
    spot,
    receivedAt: asNumber(proposal.spot_time) ?? Math.floor(Date.now() / 1000),
  };
}

function stringifyMoney(value: unknown) {
  if (typeof value === "number" || typeof value === "string") {
    return String(value);
  }

  return undefined;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : typeof value === "string" ? Number(value) : undefined;
}
