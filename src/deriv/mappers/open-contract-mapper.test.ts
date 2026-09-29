import { describe, expect, it } from "vitest";

import { mapDerivOpenContractUpdate } from "@/deriv/mappers/open-contract-mapper";
import type { Position } from "@/types";

const seedPosition: Position = {
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

describe("mapDerivOpenContractUpdate", () => {
  it("normalizes live open contract updates while preserving known display fields", () => {
    expect(
      mapDerivOpenContractUpdate(
        {
          proposal_open_contract: {
            contract_id: 123456789,
            contract_type: "CALL",
            currency: "USD",
            buy_price: 10,
            payout: "19.53",
            entry_spot: "1016.59",
            current_spot: 1018.11,
            profit: "1.23",
            purchase_time: "1793456000",
            expiry_time: "1793456300",
            status: "open",
            is_valid_to_sell: 1,
            sell_price: "11.23",
          },
        },
        seedPosition,
      ),
    ).toEqual({
      ...seedPosition,
      currentSpot: "1018.11",
      profit: "1.23",
      isSellable: true,
      sellPrice: "11.23",
    });
  });

  it("maps provider final statuses and disables selling", () => {
    expect(
      mapDerivOpenContractUpdate(
        {
          proposal_open_contract: {
            contract_id: "123456789",
            contract_type: "PUT",
            current_spot: "1009.44",
            profit: "-10",
            status: "lost",
            is_sold: 1,
            is_valid_to_sell: 0,
          },
        },
        seedPosition,
      ),
    ).toMatchObject({
      direction: "fall",
      currentSpot: "1009.44",
      profit: "-10",
      status: "lost",
      isSellable: false,
    });
  });

  it("trusts provider WON settlement and final P/L", () => {
    expect(
      mapDerivOpenContractUpdate(
        {
          proposal_open_contract: {
            contract_id: "123456789",
            current_spot: "1000.00",
            profit: "9.53",
            status: "won",
            is_sold: 1,
            is_valid_to_sell: 0,
          },
        },
        seedPosition,
      ),
    ).toMatchObject({
      currentSpot: "1000.00",
      profit: "9.53",
      status: "won",
      isSellable: false,
    });
  });

  it("trusts provider LOST settlement even when frontend price comparison might disagree", () => {
    expect(
      mapDerivOpenContractUpdate(
        {
          proposal_open_contract: {
            contract_id: "123456789",
            current_spot: "2000.00",
            profit: "-10",
            status: "lost",
            is_sold: 1,
            is_valid_to_sell: 0,
          },
        },
        seedPosition,
      ),
    ).toMatchObject({
      currentSpot: "2000.00",
      profit: "-10",
      status: "lost",
      isSellable: false,
    });
  });

  it("maps provider error status to UNKNOWN", () => {
    expect(
      mapDerivOpenContractUpdate(
        {
          proposal_open_contract: {
            contract_id: "123456789",
            profit: "0",
            status: "error",
            is_valid_to_sell: 0,
          },
        },
        seedPosition,
      ),
    ).toMatchObject({
      status: "unknown",
      profit: "0",
      isSellable: false,
    });
  });
});
