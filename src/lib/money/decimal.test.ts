import { describe, expect, it } from "vitest";

import { addMoney, normalizeDecimal, subtractMoney } from "@/lib/money";

describe("money utilities", () => {
  it("uses decimal arithmetic for money operations", () => {
    expect(addMoney("0.1", "0.2")).toBe("0.3");
    expect(subtractMoney("18.63", "10")).toBe("8.63");
    expect(normalizeDecimal(10)).toBe("10");
  });
});
