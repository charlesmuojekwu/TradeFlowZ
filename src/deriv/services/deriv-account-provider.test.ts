import { afterEach, describe, expect, it, vi } from "vitest";

import { DerivAccountProvider } from "@/deriv/services/deriv-account-provider";

describe("DerivAccountProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("treats 401 sessions as unauthenticated without throwing raw provider errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      status: 401,
      ok: false,
    } as Response);
    const provider = new DerivAccountProvider();

    await expect(provider.getSession()).resolves.toEqual({ isAuthenticated: false, expiresAt: undefined });
    await expect(provider.getAccounts()).resolves.toEqual([]);
  });

  it("loads normalized account data from the secure session route", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({
        isAuthenticated: true,
        expiresAt: 1_793_459_000,
        accounts: [
          {
            id: "CR90000001",
            type: "demo",
            currency: "USD",
            status: "active",
            balance: "10000.00",
          },
        ],
      }),
    } as Response);
    const provider = new DerivAccountProvider();

    await expect(provider.getSession()).resolves.toEqual({
      isAuthenticated: true,
      expiresAt: 1_793_459_000,
    });
    await expect(provider.getAccounts()).resolves.toEqual([
      {
        id: "CR90000001",
        type: "demo",
        currency: "USD",
        status: "active",
        balance: "10000.00",
      },
    ]);
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/auth/session", {
      cache: "no-store",
      credentials: "include",
    });
  });

  it("publishes the selected account balance and returns a cleanup function", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({
        isAuthenticated: true,
        accounts: [
          {
            id: "CR90000001",
            type: "demo",
            currency: "USD",
            status: "active",
            balance: "10000.00",
          },
        ],
      }),
    } as Response);
    const provider = new DerivAccountProvider();
    const onBalance = vi.fn();

    const unsubscribe = await provider.subscribeToBalance("CR90000001", onBalance);

    expect(onBalance).toHaveBeenCalledWith({
      id: "CR90000001",
      balance: "10000.00",
      currency: "USD",
    });
    expect(unsubscribe()).toBeUndefined();
  });
});
