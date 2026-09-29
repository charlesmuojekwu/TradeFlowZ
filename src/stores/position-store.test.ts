import { beforeEach, describe, expect, it } from "vitest";

import { usePositionStore } from "@/stores/position-store";
import type { Position } from "@/types";

const openPosition: Position = {
  contractId: "123456789",
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
  purchaseTime: 1_793_456_000,
  expiryTime: 1_793_456_300,
  status: "open",
  isSellable: false,
};

describe("positionStore settlement", () => {
  beforeEach(() => {
    usePositionStore.getState().reset();
  });

  it("moves WON positions from open to settled with final provider P/L", () => {
    usePositionStore.getState().upsertPosition(openPosition);
    usePositionStore.getState().settlePosition({
      ...openPosition,
      status: "won",
      profit: "9.53",
    });

    expect(usePositionStore.getState().openPositions).toEqual([]);
    expect(usePositionStore.getState().settledPositions).toEqual([
      expect.objectContaining({
        contractId: "123456789",
        status: "won",
        profit: "9.53",
      }),
    ]);
  });

  it("moves LOST positions from open to settled with final provider P/L", () => {
    usePositionStore.getState().upsertPosition(openPosition);
    usePositionStore.getState().settlePosition({
      ...openPosition,
      status: "lost",
      profit: "-10",
    });

    expect(usePositionStore.getState().openPositions).toEqual([]);
    expect(usePositionStore.getState().settledPositions).toEqual([
      expect.objectContaining({
        contractId: "123456789",
        status: "lost",
        profit: "-10",
      }),
    ]);
  });
});
