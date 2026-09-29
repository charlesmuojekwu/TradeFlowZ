import { describe, expect, it } from "vitest";

import { mapContractsFor, mapDirectionToDerivContractType } from "@/deriv/mappers/contract-mapper";

describe("Deriv contract mapper", () => {
  it("normalizes Rise/Fall contracts and duration limits", () => {
    const availability = mapContractsFor("R_100", [
      {
        contract_type: "CALL",
        sentiment: "up",
        min_contract_duration: "5t",
        max_contract_duration: "10t",
        min_stake: "1",
        max_stake: "1000",
        can_sell: 1,
      },
      {
        contract_type: "PUT",
        sentiment: "down",
        min_contract_duration: "1m",
        max_contract_duration: "60m",
      },
      {
        contract_type: "DIGITMATCH",
        min_contract_duration: "1t",
        max_contract_duration: "5t",
      },
    ]);

    expect(availability).toMatchObject({
      symbol: "R_100",
      directions: ["rise", "fall"],
      durationUnits: ["ticks", "minutes"],
      isSellable: true,
      isAvailable: true,
      minStake: "1",
      maxStake: "1000",
    });
    expect(availability.contractTypes).toEqual([
      { direction: "rise", providerType: "CALL", displayName: "Rise" },
      { direction: "fall", providerType: "PUT", displayName: "Fall" },
    ]);
    expect(availability.durationConstraints).toEqual([
      { unit: "ticks", min: 5, max: 10 },
      { unit: "minutes", min: 1, max: 60 },
    ]);
  });

  it("maps UI direction to provider terminology only in the mapper layer", () => {
    expect(mapDirectionToDerivContractType("rise")).toBe("CALL");
    expect(mapDirectionToDerivContractType("fall")).toBe("PUT");
  });
});
