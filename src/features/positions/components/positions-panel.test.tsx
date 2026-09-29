import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PositionsPanel } from "@/features/positions/components/positions-panel";
import { usePositionStore } from "@/stores";
import type { Position } from "@/types";

const sellablePosition: Position = {
  contractId: "123456789",
  symbol: "1HZ100V",
  displaySymbol: "Volatility 100 (1s) Index",
  direction: "rise",
  stake: "10",
  buyPrice: "10",
  payout: "19.53",
  entrySpot: "1016.59",
  currentSpot: "1018.00",
  profit: "1.25",
  currency: "USD",
  purchaseTime: 1_793_456_000,
  expiryTime: 1_793_456_300,
  status: "open",
  isSellable: true,
  sellPrice: "11.25",
};

describe("PositionsPanel accessibility", () => {
  beforeEach(() => {
    usePositionStore.getState().reset();
  });

  it("shows provider sell quote and requires confirmation before close", () => {
    const onClosePosition = vi.fn();
    usePositionStore.getState().upsertPosition(sellablePosition);

    render(<PositionsPanel onClosePosition={onClosePosition} />);

    expect(screen.getAllByText("$11.25").length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole("button", { name: /Review early close/i })[0]);
    expect(screen.getAllByRole("button", { name: /Confirm selling/i })[0]).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: /Confirm selling/i })[0]);
    expect(onClosePosition).toHaveBeenCalledWith("123456789");
  });
});
