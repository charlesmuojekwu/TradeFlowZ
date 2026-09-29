"use client";

import { useMemo } from "react";

import { formatMoney } from "@/lib/money";
import { usePositionStore } from "@/stores";

import { FeatureState, WorkCard, WorkGrid } from "./feature-state";

export function AnalyticsWorkspace() {
  const settledPositions = usePositionStore((state) => state.settledPositions);
  const openPositions = usePositionStore((state) => state.openPositions);
  const currency = settledPositions[0]?.currency ?? openPositions[0]?.currency ?? "USD";

  const stats = useMemo(() => {
    const wins = settledPositions.filter((position) => position.status === "won").length;
    const losses = settledPositions.filter((position) => position.status === "lost").length;
    const totalStake = settledPositions.reduce((total, position) => total + Number(position.stake || 0), 0);
    const realized = settledPositions.reduce((total, position) => total + Number(position.profit || 0), 0);
    const markets = new Set(settledPositions.map((position) => position.symbol));
    const contracts = new Set(settledPositions.map((position) => position.direction));

    return {
      realized,
      trades: settledPositions.length,
      wins,
      losses,
      averageStake: settledPositions.length > 0 ? totalStake / settledPositions.length : 0,
      markets: markets.size,
      contracts: contracts.size,
    };
  }, [settledPositions]);

  return (
    <FeatureState
      eyebrow="Analytics"
      title="Factual trade analytics."
      description="This workspace uses available position and history data only. It does not project returns or provide investment advice."
      status="available"
    >
      <WorkGrid>
        <Metric title="Realized P/L" value={formatMoney(String(stats.realized), currency)} />
        <Metric title="Trades" value={String(stats.trades)} />
        <Metric title="Wins / Losses" value={`${stats.wins} / ${stats.losses}`} />
        <Metric title="Average stake" value={formatMoney(String(stats.averageStake), currency)} />
        <Metric title="Markets traded" value={String(stats.markets)} />
        <Metric title="Contract distribution" value={stats.contracts > 0 ? `${stats.contracts} directions` : "No data"} />
      </WorkGrid>

      <WorkCard
        title="Data source"
        description="Analytics currently reflects cached positions in this browser session. Provider-sourced history can be used as the input once an analytics data hook is added."
      />
    </FeatureState>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <WorkCard title={title}>
      <p className="font-mono text-2xl font-semibold">{value}</p>
    </WorkCard>
  );
}
