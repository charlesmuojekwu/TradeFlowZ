import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PublicLandingPage } from "@/features/landing/components/public-landing-page";

describe("PublicLandingPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders accessible public sections and OAuth entry CTAs", () => {
    render(<PublicLandingPage isAuthenticated={false} returnTo="/positions" />);

    expect(screen.getByRole("heading", { name: /From market movement to trade/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /A clean path from account/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Purpose-built around implemented capability/i })).toBeTruthy();
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
});
