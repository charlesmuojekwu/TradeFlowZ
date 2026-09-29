"use client";

import { LogOut, Moon, Sun, UserRound } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatMoney } from "@/lib/money";
import type { BalanceStatus } from "@/stores/account-store";
import type { AccountSession, ConnectionStatus, TradingAccount } from "@/types";

import { ConnectionPill } from "./connection-pill";

type TradingHeaderProps = {
  accounts: TradingAccount[];
  selectedAccount?: TradingAccount;
  isAuthenticated: boolean;
  authenticatedConnectionStatus: ConnectionStatus;
  authenticatedConnectionError?: string;
  balance?: string;
  balanceCurrency?: string;
  balanceStatus: BalanceStatus;
  session?: AccountSession;
  connectionStatus: ConnectionStatus;
  activeSection: "trade" | "positions" | "history";
  onSelectAccount: (accountId: string) => void;
};

const navItems = [
  { id: "trade", label: "Trade", href: "/trade" },
  { id: "positions", label: "Positions", href: "/positions" },
  { id: "history", label: "History", href: "/history" },
] as const;

export function TradingHeader({
  accounts,
  selectedAccount,
  isAuthenticated,
  authenticatedConnectionStatus,
  authenticatedConnectionError,
  balance,
  balanceCurrency,
  balanceStatus,
  session,
  connectionStatus,
  activeSection,
  onSelectAccount,
}: TradingHeaderProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  const displayedCurrency = balanceCurrency ?? selectedAccount?.currency;
  const balanceLabel = getBalanceLabel(balanceStatus);

  return (
    <header className="z-30 border-b border-border bg-card/95 backdrop-blur">
      <div className="flex min-h-16 items-center gap-3 px-3 py-2 sm:gap-4 sm:px-4 lg:px-5">
        <Link href="/trade" className="flex min-w-0 shrink-0 items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="grid h-9 w-9 place-items-center rounded-md border border-primary/30 bg-primary/15 text-sm font-semibold text-primary">
            T
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-sm font-semibold">Trade</span>
            <span className="block text-xs text-muted-foreground">Options terminal</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Trading navigation">
          {navItems.map((item) => (
            <Button
              key={item.id}
              asChild
              variant={activeSection === item.id ? "secondary" : "ghost"}
              size="sm"
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-2">
          <div className="hidden sm:block">
            <ConnectionPill status={connectionStatus} />
          </div>
          {isAuthenticated ? (
            <div className="hidden sm:block">
              <ConnectionPill status={authenticatedConnectionStatus} />
            </div>
          ) : null}
          {isAuthenticated ? (
            <div className="hidden items-center gap-2 md:flex">
              <Select
                aria-label="Select account"
                value={selectedAccount?.id ?? ""}
                onChange={(event) => onSelectAccount(event.target.value)}
                className="w-44"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.type.toUpperCase()} {account.id.slice(-3)}
                  </option>
                ))}
              </Select>
              <Badge tone={selectedAccount?.type === "real" ? "danger" : "info"}>
                {selectedAccount?.type.toUpperCase() ?? "DEMO"}
              </Badge>
            </div>
          ) : (
            <Button asChild size="sm" variant="secondary">
              <a href="/api/auth/login">Continue with Deriv</a>
            </Button>
          )}
          <div className="hidden min-w-28 text-right sm:block">
            <p className="text-xs text-muted-foreground">{balanceLabel}</p>
            <p className="text-sm font-semibold">
              {selectedAccount && displayedCurrency
                ? formatMoney(balance ?? selectedAccount.balance, displayedCurrency)
                : "$0.00"}
            </p>
            {authenticatedConnectionError ? (
              <p className="max-w-32 truncate text-xs text-amber-300">{authenticatedConnectionError}</p>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
          {isAuthenticated ? (
            <details className="group relative">
              <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-md border border-border bg-background text-sm outline-none transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                <UserRound className="h-4 w-4" />
                <span className="sr-only">Account menu</span>
              </summary>
              <div className="absolute right-0 top-11 z-50 w-72 rounded-md border border-border bg-card p-3 text-sm shadow-xl">
                <div>
                  <p className="font-semibold">{selectedAccount?.displayName ?? "Deriv account"}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{selectedAccount?.id ?? session?.subject}</p>
                </div>
                {selectedAccount ? (
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Type</dt>
                      <dd className="mt-0.5 font-semibold uppercase">{selectedAccount.type}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Currency</dt>
                      <dd className="mt-0.5 font-semibold">{selectedAccount.currency}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Status</dt>
                      <dd className="mt-0.5 capitalize">{selectedAccount.status}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Session</dt>
                      <dd className="mt-0.5">{session?.expiresAt ? formatSessionExpiry(session.expiresAt) : "Active"}</dd>
                    </div>
                  </dl>
                ) : null}
                <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                  <a href="/api/auth/logout">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </a>
                </Button>
              </div>
            </details>
          ) : (
            <Button variant="outline" size="icon" aria-label="Profile menu">
              <UserRound className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      {isAuthenticated ? (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 border-t border-border px-3 py-2 md:hidden">
          <Select
            aria-label="Select account"
            value={selectedAccount?.id ?? ""}
            onChange={(event) => onSelectAccount(event.target.value)}
            className="min-w-0"
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.type.toUpperCase()} {account.id}
              </option>
            ))}
          </Select>
          <div className="text-right">
            <Badge tone={selectedAccount?.type === "real" ? "danger" : "info"}>
              {selectedAccount?.type.toUpperCase() ?? "DEMO"}
            </Badge>
            <p className="mt-1 font-mono text-xs">
              {selectedAccount && displayedCurrency
                ? formatMoney(balance ?? selectedAccount.balance, displayedCurrency)
                : "$0.00"}
            </p>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function formatSessionExpiry(expiresAt: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(expiresAt);
}

function getBalanceLabel(status: BalanceStatus) {
  if (status === "loading") {
    return "Updating balance";
  }

  if (status === "stale") {
    return "Stale balance";
  }

  if (status === "error") {
    return "Balance unavailable";
  }

  return "Live balance";
}
