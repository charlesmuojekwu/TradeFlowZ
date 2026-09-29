import { describe, expect, it, vi } from "vitest";

import { MockTradingProvider } from "@/providers/mock";

describe("MockTradingProvider", () => {
  it("supports the main demo trading journey without external Deriv services", async () => {
    const provider = new MockTradingProvider();
    const proposalRequest = {
      accountId: "demo-account",
      symbol: "MOCK_R_100",
      direction: "rise" as const,
      stake: "10",
      currency: "USD",
      duration: 5,
      durationUnit: "minutes" as const,
    };

    const proposal = await provider.getProposal(proposalRequest);
    expect(proposal).toMatchObject({
      askPrice: "10",
      payout: "18.63",
      potentialProfit: "8.63",
      spot: "1000.00",
    });

    const buy = await provider.buy({
      accountId: "demo-account",
      accountType: "demo",
      proposalId: proposal.id,
      proposal,
      proposalRequest,
    });

    expect(buy.contractId).toMatch(/^mock-contract-/);

    const positions = await provider.getOpenPositions();
    expect(positions).toEqual([
      expect.objectContaining({ contractId: buy.contractId, status: "open", stake: "10" }),
    ]);

    const onPosition = vi.fn();
    const unsubscribe = await provider.subscribeToPosition("demo-account", buy.contractId, onPosition);

    expect(onPosition).toHaveBeenCalledWith(
      expect.objectContaining({
        contractId: buy.contractId,
        status: expect.stringMatching(/open|won|lost/),
      }),
    );

    unsubscribe();
  });

  it("normalizes sell responses from the mock journey", async () => {
    const provider = new MockTradingProvider();

    await expect(
      provider.sell({
        accountId: "demo-account",
        contractId: "missing-contract",
        buyPrice: "10",
        sellPrice: "12.50",
      }),
    ).resolves.toEqual({
      contractId: "missing-contract",
      soldFor: "12.50",
      profit: "2.5",
      soldAt: expect.any(Number),
    });
  });
});
