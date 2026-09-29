"use client";

import { Copy, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useStrategyStore } from "@/stores";
import type { SavedStrategy, StrategyAction } from "@/types";

import { FeatureState, WorkCard } from "./feature-state";

const defaultAction: StrategyAction = {
  contractFamily: "rise-fall",
  symbol: "R_100",
  direction: "rise",
  duration: 5,
  durationUnit: "minutes",
  stake: "10",
};

export function StrategyLab() {
  const upsertStrategy = useStrategyStore((state) => state.upsertStrategy);
  const strategies = useStrategyStore((state) => state.strategies);
  const [name, setName] = useState("Untitled strategy");
  const [triggerLabel, setTriggerLabel] = useState("Manual confirmation");
  const [action, setAction] = useState(defaultAction);
  const [maxStake, setMaxStake] = useState("25");
  const [maxLosses, setMaxLosses] = useState(3);
  const [takeProfit, setTakeProfit] = useState("50");
  const [stopLoss, setStopLoss] = useState("25");
  const [maximumTrades, setMaximumTrades] = useState(10);

  const preview = useMemo<SavedStrategy>(() => {
    const now = Math.floor(Date.now() / 1000);
    return {
      id: crypto.randomUUID(),
      name,
      trigger: {
        kind: "manual-confirmation",
        label: triggerLabel,
      },
      action,
      risk: {
        maximumStake: maxStake,
        maximumConsecutiveLosses: maxLosses,
        sessionTakeProfit: takeProfit,
        sessionStopLoss: stopLoss,
        maximumTrades,
      },
      compatibility: "integration-required",
      createdAt: now,
      updatedAt: now,
    };
  }, [action, maxLosses, maxStake, maximumTrades, name, stopLoss, takeProfit, triggerLabel]);

  const save = () => {
    upsertStrategy(preview);
  };

  return (
    <FeatureState
      eyebrow="Strategy Lab"
      title="Build reusable strategy definitions."
      description="Create, validate, and save local strategy configurations. This does not execute arbitrary rules yet; execution requires provider-backed automation support in a later phase."
      status="available"
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <WorkCard title="WHEN" description="Define the trigger that would start evaluating the strategy.">
            <Input value={triggerLabel} onChange={(event) => setTriggerLabel(event.target.value)} aria-label="Trigger label" />
          </WorkCard>

          <WorkCard title="DO" description="Define the contract action. Contract availability remains provider-authoritative.">
            <div className="grid gap-3 md:grid-cols-2">
              <Select
                value={action.contractFamily}
                onChange={(event) => setAction({ ...action, contractFamily: event.target.value as StrategyAction["contractFamily"] })}
                aria-label="Contract family"
              >
                <option value="rise-fall">Rise / Fall</option>
                <option value="digits">Digits</option>
                <option value="accumulators">Accumulators</option>
                <option value="multipliers">Multipliers</option>
              </Select>
              <Input value={action.symbol} onChange={(event) => setAction({ ...action, symbol: event.target.value })} aria-label="Market symbol" />
              <Select
                value={action.direction ?? "rise"}
                onChange={(event) => setAction({ ...action, direction: event.target.value as StrategyAction["direction"] })}
                aria-label="Direction"
              >
                <option value="rise">Rise</option>
                <option value="fall">Fall</option>
              </Select>
              <Input value={action.stake} onChange={(event) => setAction({ ...action, stake: event.target.value })} aria-label="Stake" />
            </div>
          </WorkCard>

          <WorkCard title="WITH" description="Set duration details where the selected contract family supports them.">
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                type="number"
                value={action.duration ?? 1}
                onChange={(event) => setAction({ ...action, duration: Number(event.target.value) })}
                aria-label="Duration"
              />
              <Select
                value={action.durationUnit ?? "minutes"}
                onChange={(event) => setAction({ ...action, durationUnit: event.target.value as StrategyAction["durationUnit"] })}
                aria-label="Duration unit"
              >
                <option value="ticks">Ticks</option>
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
              </Select>
            </div>
          </WorkCard>

          <WorkCard title="RISK" description="Risk limits are part of the saved definition and must be enforced by future execution services.">
            <div className="grid gap-3 md:grid-cols-3">
              <Input value={maxStake} onChange={(event) => setMaxStake(event.target.value)} aria-label="Maximum stake" />
              <Input type="number" value={maxLosses} onChange={(event) => setMaxLosses(Number(event.target.value))} aria-label="Maximum losses" />
              <Input type="number" value={maximumTrades} onChange={(event) => setMaximumTrades(Number(event.target.value))} aria-label="Maximum trades" />
              <Input value={takeProfit} onChange={(event) => setTakeProfit(event.target.value)} aria-label="Session take profit" />
              <Input value={stopLoss} onChange={(event) => setStopLoss(event.target.value)} aria-label="Session stop loss" />
            </div>
          </WorkCard>
        </div>

        <aside className="space-y-4">
          <WorkCard title="Definition">
            <Input value={name} onChange={(event) => setName(event.target.value)} aria-label="Strategy name" />
            <div className="mt-4 rounded-md border border-border bg-background p-3 text-sm">
              <p className="font-medium">{preview.name}</p>
              <p className="mt-2 text-muted-foreground">
                {preview.action.contractFamily} on {preview.action.symbol}, stake {preview.action.stake}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Execution compatibility: integration required</p>
            </div>
            <Button className="mt-4 w-full" onClick={save}>
              <Save className="h-4 w-4" />
              Save locally
            </Button>
          </WorkCard>

          <WorkCard title="Saved locally">
            <p className="text-2xl font-semibold">{strategies.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">Reusable definitions in this browser.</p>
          </WorkCard>
        </aside>
      </div>
    </FeatureState>
  );
}

export function MyStrategies() {
  const strategies = useStrategyStore((state) => state.strategies);
  const duplicateStrategy = useStrategyStore((state) => state.duplicateStrategy);
  const deleteStrategy = useStrategyStore((state) => state.deleteStrategy);
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("all");

  const filtered = strategies.filter((strategy) => {
    const matchesQuery = strategy.name.toLowerCase().includes(query.toLowerCase());
    const matchesFamily = family === "all" || strategy.action.contractFamily === family;
    return matchesQuery && matchesFamily;
  });

  return (
    <FeatureState
      eyebrow="My Strategies"
      title="Manage saved strategy definitions."
      description="These are local reusable configurations. Running strategies requires a future provider-backed automation path."
      status="available"
      primaryAction={{ href: "/strategies/lab", label: "Open Strategy Lab" }}
    >
      <div className="space-y-4">
        <WorkCard title="Search and filter">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search strategies" aria-label="Search strategies" />
            <Select value={family} onChange={(event) => setFamily(event.target.value)} aria-label="Contract family filter">
              <option value="all">All contract families</option>
              <option value="rise-fall">Rise / Fall</option>
              <option value="digits">Digits</option>
              <option value="accumulators">Accumulators</option>
              <option value="multipliers">Multipliers</option>
            </Select>
          </div>
        </WorkCard>

        {filtered.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {filtered.map((strategy) => (
              <WorkCard key={strategy.id} title={strategy.name}>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Market: {strategy.action.symbol}</p>
                  <p>Contract: {strategy.action.contractFamily}</p>
                  <p>Risk: max stake {strategy.risk.maximumStake ?? "--"}, max trades {strategy.risk.maximumTrades ?? "--"}</p>
                  <p>Compatibility: {strategy.compatibility}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => duplicateStrategy(strategy.id)}>
                    <Copy className="h-4 w-4" />
                    Duplicate
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteStrategy(strategy.id)}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </WorkCard>
            ))}
          </div>
        ) : (
          <WorkCard title="No strategies found" description="Create a strategy in the lab to see it here." />
        )}
      </div>
    </FeatureState>
  );
}
