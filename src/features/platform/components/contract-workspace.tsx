import { Hash, Layers, LineChart, TrendingUp } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { FeatureState, WorkCard, WorkGrid } from "./feature-state";

type ContractWorkspaceProps = {
  family: "overview" | "rise-fall" | "digits" | "accumulators" | "multipliers";
};

const contractCopy = {
  overview: {
    title: "Contract workspaces",
    description:
      "Prepare contract-specific workflows while keeping contracts_for as the source of truth for market support.",
    status: "in-progress" as const,
  },
  "rise-fall": {
    title: "Rise / Fall",
    description:
      "Rise/Fall execution is already handled by the existing manual trading ticket. RISE maps to CALL and FALL maps to PUT inside the Deriv adapter.",
    status: "available" as const,
  },
  digits: {
    title: "Digits",
    description:
      "A dedicated Digits workspace will use provider metadata for supported modes, barriers, prediction fields, and proposal availability.",
    status: "in-progress" as const,
  },
  accumulators: {
    title: "Accumulators",
    description:
      "Accumulator support will expose provider-supported stake, growth rate, barrier information, proposal, payout, and contract state only where available.",
    status: "in-progress" as const,
  },
  multipliers: {
    title: "Multipliers",
    description:
      "Multiplier support will expose provider-supported stake, multiplier, take profit, stop loss, proposal, and status fields.",
    status: "in-progress" as const,
  },
};

const families = [
  { family: "rise-fall", label: "Rise / Fall", icon: TrendingUp, href: "/contracts/rise-fall" },
  { family: "digits", label: "Digits", icon: Hash, href: "/contracts/digits" },
  { family: "accumulators", label: "Accumulators", icon: LineChart, href: "/contracts/accumulators" },
  { family: "multipliers", label: "Multipliers", icon: Layers, href: "/contracts/multipliers" },
] as const;

export function ContractWorkspace({ family }: ContractWorkspaceProps) {
  const copy = contractCopy[family];

  return (
    <FeatureState
      eyebrow="Contracts"
      title={copy.title}
      description={copy.description}
      status={copy.status}
      primaryAction={family === "rise-fall" ? { href: "/trade", label: "Open manual ticket" } : undefined}
    >
      <WorkGrid className="lg:grid-cols-4">
        {families.map((item) => {
          const Icon = item.icon;
          const isSelected = family === item.family;
          return (
            <WorkCard key={item.family} title={item.label}>
              <Icon className={isSelected ? "h-5 w-5 text-primary" : "h-5 w-5 text-muted-foreground"} />
              <p className="mt-3 text-sm text-muted-foreground">
                {item.family === "rise-fall" ? "Available through the manual trading ticket." : "Integration in progress."}
              </p>
              <Button asChild variant={isSelected ? "secondary" : "outline"} size="sm" className="mt-4">
                <Link href={item.href}>Open</Link>
              </Button>
            </WorkCard>
          );
        })}
      </WorkGrid>

      <WorkCard
        title="Provider rule"
        description="Every contract workspace must use contracts_for before enabling configuration or proposals. Unsupported configurations should show 'Not available for this market' and must not send invalid proposal requests."
      />
    </FeatureState>
  );
}
