import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PublicLandingPage } from "@/features/landing/components/public-landing-page";

describe("PublicLandingPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders accessible public sections and OAuth entry CTAs", () => {
    render(<PublicLandingPage isAuthenticated={false} returnTo="/positions" />);

    expect(screen.getByRole("heading", { name: /TradeFlowZ brings your Deriv trading dashboard/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /A clean path from account/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /More than a trade ticket/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Purpose-built around implemented capability/i })).toBeTruthy();
    expect(screen.getAllByText(/Powered by Deriv/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("heading", { name: /AI trading/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /Trading automation/i })).toBeTruthy();
    expect(screen.getAllByRole("heading", { name: /Copy trading/i }).length).toBeGreaterThan(0);
    expect(screen.getByText(/Risk disclosure:/i)).toBeTruthy();

    const getStartedLinks = screen.getAllByRole("link", { name: /Get Started/i });
    expect(getStartedLinks[0].getAttribute("href")).toBe(
      "/api/auth/login?intent=register&prompt=registration&returnTo=%2Fpositions",
    );

    const signInLinks = screen.getAllByRole("link", { name: /Sign In/i });
    expect(signInLinks[0].getAttribute("href")).toBe("/api/auth/login?returnTo=%2Fpositions");
  });

  it("shows app-opening CTAs for authenticated visitors instead of forcing OAuth", () => {
    render(<PublicLandingPage isAuthenticated returnTo="/trade" />);

    expect(screen.getAllByRole("link", { name: /Open Trading App/i })[0].getAttribute("href")).toBe("/trade");
    expect(screen.queryByRole("link", { name: /^Get Started$/i })).toBeNull();
  });

  it("shows a safe callback failure message without exposing provider details", () => {
    render(<PublicLandingPage authStatus="session" isAuthenticated={false} returnTo="/trade" />);

    expect(screen.getByRole("status").textContent).toContain("DERIV_SESSION_SECRET");
  });
});
