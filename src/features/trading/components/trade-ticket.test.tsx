import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TradeTicket } from "@/features/trading/components/trade-ticket";
import type { ContractAvailability, TradingAccount } from "@/types";

const account: TradingAccount = {
  id: "DOT90004580",
  type: "demo",
  currency: "USD",
  status: "active",
  balance: "10000",
};

const contractAvailability: ContractAvailability = {
  symbol: "1HZ100V",
  contractTypes: [
    { direction: "rise", providerType: "CALL", displayName: "Rise" },
    { direction: "fall", providerType: "PUT", displayName: "Fall" },
  ],
  directions: ["rise", "fall"],
  durationConstraints: [{ unit: "minutes", min: 1, max: 60 }],
  durationUnits: ["minutes"],
  minStake: "1",
  maxStake: "1000",
  isSellable: true,
  isAvailable: true,
};

describe("TradeTicket accessibility", () => {
  it("exposes labeled mobile-friendly inputs and pressed direction controls", () => {
    render(
      <TradeTicket
        account={account}
        authenticatedConnectionStatus="connected"
        contractAvailability={contractAvailability}
        direction="rise"
        duration={5}
        durationUnit="minutes"
        executionState="idle"
        proposal={{
          id: "proposal-1",
          askPrice: "10",
          payout: "19.53",
          potentialProfit: "9.53",
          spot: "1016.59",
          receivedAt: 1_793_456_000,
        }}
        proposalState="ready"
        stake="10"
        onBuy={vi.fn()}
        onDirectionChange={vi.fn()}
        onDurationChange={vi.fn()}
        onDurationUnitChange={vi.fn()}
        onStakeChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Stake").getAttribute("inputmode")).toBe("decimal");
    expect(screen.getByLabelText("Duration").getAttribute("inputmode")).toBe("numeric");
    expect(screen.getByRole("button", { name: "Rise" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: /Buy Rise/i })).toBeTruthy();
  });
});
