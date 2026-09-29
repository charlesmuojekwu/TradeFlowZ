"use client";

import { Briefcase, LineChart, PanelLeft, ReceiptText } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";

import { useAuthenticatedTradingConnection } from "@/features/accounts/hooks/use-authenticated-trading-connection";
import { HistoryPanel } from "@/features/history/components/history-panel";
import { MarketPanel } from "@/features/markets/components/market-panel";
import { PositionsPanel } from "@/features/positions/components/positions-panel";
import { TradeResultNotification } from "@/features/positions/components/trade-result-notification";
import { useTradingWorkspace } from "@/features/trading/hooks/use-trading-workspace";
import { useUiStore } from "@/stores";

import { TradeTicket } from "./trade-ticket";
import { TradingHeader } from "./trading-header";

type TradingTerminalProps = {
  activeSection?: "trade" | "positions" | "history";
  embedded?: boolean;
};

type MobileView = "markets" | "chart" | "ticket" | "positions";

const ChartWorkspace = dynamic(
  () => import("@/features/chart/components/chart-workspace").then((module) => module.ChartWorkspace),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-[420px] flex-1 place-items-center border-x border-border bg-card text-sm text-muted-foreground">
        Loading chart...
      </div>
    ),
  },
);

const mobileViews = [
  { id: "markets", label: "Markets", icon: PanelLeft },
  { id: "chart", label: "Price", icon: LineChart },
  { id: "ticket", label: "Trade", icon: Briefcase },
  { id: "positions", label: "Positions", icon: ReceiptText },
] as const;

export function TradingTerminal({ activeSection = "trade", embedded = false }: TradingTerminalProps) {
  const workspace = useTradingWorkspace();
  const [mobileView, setMobileView] = useState<MobileView>(activeSection === "positions" ? "positions" : "chart");
  const { isSidebarOpen, setSidebarOpen } = useUiStore();
  useAuthenticatedTradingConnection({
    isAuthenticated: workspace.isAuthenticated,
    selectedAccount: workspace.selectedAccount,
  });

  const showMobileTradingTabs = activeSection !== "history";

  return (
    <main className={embedded ? "flex h-full min-h-0 flex-col overflow-hidden bg-background text-foreground" : "flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground lg:min-h-[720px]"}>
      <TradeResultNotification />
      <TradingHeader
        accounts={workspace.accounts}
        selectedAccount={workspace.selectedAccount}
        isAuthenticated={workspace.isAuthenticated}
        authenticatedConnectionStatus={workspace.authenticatedConnectionStatus}
        authenticatedConnectionError={workspace.authenticatedConnectionError}
        balance={workspace.balance}
        balanceCurrency={workspace.balanceCurrency}
        balanceStatus={workspace.balanceStatus}
        session={workspace.session}
        connectionStatus={workspace.connectionStatus}
        activeSection={activeSection}
        onSelectAccount={workspace.selectAccount}
      />

      <div
        className={
          activeSection === "history"
            ? "hidden min-h-0 flex-1 lg:grid lg:grid-cols-[auto_minmax(0,1fr)]"
            : "hidden min-h-0 flex-1 lg:grid lg:grid-cols-[auto_minmax(0,1fr)_360px] xl:grid-cols-[auto_minmax(0,1fr)_384px]"
        }
      >
        <MarketPanel
          markets={workspace.markets}
          selectedSymbol={workspace.selectedMarket?.symbol}
          currentTick={workspace.currentTick}
          favoriteSymbols={workspace.favoriteSymbols}
          recentSymbols={workspace.recentSymbols}
          isCollapsed={!isSidebarOpen}
          isLoading={workspace.isBootstrapping}
          errorMessage={workspace.error?.message}
          connectionStatus={workspace.connectionStatus}
          onCollapsedChange={(isCollapsed) => setSidebarOpen(!isCollapsed)}
          onSelectMarket={workspace.chooseMarket}
          onToggleFavorite={workspace.toggleFavorite}
        />

        {activeSection === "history" ? (
          <HistoryPanel
            account={workspace.selectedAccount}
            isAuthenticated={workspace.isAuthenticated}
            markets={workspace.markets}
          />
        ) : (
          <>
            <div className="flex min-w-0 flex-col">
              <ChartWorkspace
                market={workspace.selectedMarket}
                marketConnectionStatus={workspace.connectionStatus}
              />
              <PositionsPanel
                onClosePosition={workspace.closePosition}
              />
            </div>

            <TradeTicket
              account={workspace.selectedAccount}
              authenticatedConnectionStatus={workspace.authenticatedConnectionStatus}
              direction={workspace.direction}
              duration={workspace.duration}
              durationUnit={workspace.durationUnit}
              executionState={workspace.executionState}
              contractAvailability={workspace.contractAvailability}
              contractAvailabilityError={workspace.contractAvailabilityError}
              isContractAvailabilityLoading={workspace.isContractAvailabilityLoading}
              proposal={workspace.currentProposal}
              proposalState={workspace.proposalState}
              stake={workspace.stake}
              onBuy={workspace.buy}
              onDirectionChange={workspace.setDirection}
              onDurationChange={workspace.setDuration}
              onDurationUnitChange={workspace.setDurationUnit}
              onStakeChange={workspace.setStake}
            />
          </>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:hidden">
        {showMobileTradingTabs ? (
          <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-2">
            <div className="flex flex-1 rounded-md border border-border bg-background p-1" role="tablist" aria-label="Trading workspace views">
              {mobileViews.map((item) => {
                const Icon = item.icon;
                const isActive = mobileView === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`mobile-${item.id}-panel`}
                    onClick={() => setMobileView(item.id)}
                    className={
                      isActive
                        ? "flex min-w-0 flex-1 items-center justify-center gap-1 rounded bg-secondary px-2 py-2 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        : "flex min-w-0 flex-1 items-center justify-center gap-1 rounded px-2 py-2 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    }
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="hidden sm:inline">{item.label}</span>
                    <span className="sr-only sm:hidden">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {activeSection === "history" ? (
            <HistoryPanel
              account={workspace.selectedAccount}
              isAuthenticated={workspace.isAuthenticated}
              markets={workspace.markets}
            />
          ) : null}

          {activeSection !== "history" && mobileView === "markets" ? (
            <section id="mobile-markets-panel" role="tabpanel" aria-label="Markets">
            <MarketPanel
              markets={workspace.markets}
              selectedSymbol={workspace.selectedMarket?.symbol}
              currentTick={workspace.currentTick}
              favoriteSymbols={workspace.favoriteSymbols}
              recentSymbols={workspace.recentSymbols}
              isCollapsed={false}
              isLoading={workspace.isBootstrapping}
              errorMessage={workspace.error?.message}
              connectionStatus={workspace.connectionStatus}
              onCollapsedChange={() => undefined}
              onSelectMarket={(symbol) => {
                workspace.chooseMarket(symbol);
                setMobileView("chart");
              }}
              onToggleFavorite={workspace.toggleFavorite}
            />
            </section>
          ) : null}

          {activeSection !== "history" && mobileView === "chart" ? (
            <section id="mobile-chart-panel" role="tabpanel" aria-label="Price chart" className="min-h-full">
            <ChartWorkspace
              market={workspace.selectedMarket}
              marketConnectionStatus={workspace.connectionStatus}
            />
            </section>
          ) : null}

          {activeSection !== "history" && mobileView === "ticket" ? (
            <section id="mobile-ticket-panel" role="tabpanel" aria-label="Trade ticket">
            <TradeTicket
              account={workspace.selectedAccount}
              authenticatedConnectionStatus={workspace.authenticatedConnectionStatus}
              direction={workspace.direction}
              duration={workspace.duration}
              durationUnit={workspace.durationUnit}
              executionState={workspace.executionState}
              contractAvailability={workspace.contractAvailability}
              contractAvailabilityError={workspace.contractAvailabilityError}
              isContractAvailabilityLoading={workspace.isContractAvailabilityLoading}
              proposal={workspace.currentProposal}
              proposalState={workspace.proposalState}
              stake={workspace.stake}
              onBuy={workspace.buy}
              onDirectionChange={workspace.setDirection}
              onDurationChange={workspace.setDuration}
              onDurationUnitChange={workspace.setDurationUnit}
              onStakeChange={workspace.setStake}
            />
            </section>
          ) : null}

          {activeSection !== "history" && mobileView === "positions" ? (
            <section id="mobile-positions-panel" role="tabpanel" aria-label="Positions">
            <PositionsPanel
              onClosePosition={workspace.closePosition}
            />
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}
