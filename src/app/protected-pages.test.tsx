import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(() => undefined),
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((destination: string) => {
    throw new Error(`NEXT_REDIRECT:${destination}`);
  }),
}));

describe("protected trading routes", () => {
  it("redirects unauthenticated /trade requests to the public landing page", async () => {
    const { default: TradePage } = await import("@/app/trade/page");

    await expect(TradePage()).rejects.toThrow("NEXT_REDIRECT:/?returnTo=%2Ftrade");
  });

  it("redirects unauthenticated /positions requests to the public landing page", async () => {
    const { default: PositionsPage } = await import("@/app/positions/page");

    await expect(PositionsPage()).rejects.toThrow("NEXT_REDIRECT:/?returnTo=%2Fpositions");
  });

  it("redirects unauthenticated /history requests to the public landing page", async () => {
    const { default: HistoryPage } = await import("@/app/history/page");

    await expect(HistoryPage()).rejects.toThrow("NEXT_REDIRECT:/?returnTo=%2Fhistory");
  });
});
