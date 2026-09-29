import { Bot, BrainCircuit, LineChart, ShieldCheck, SlidersHorizontal, WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

import { FeatureState, WorkCard, WorkGrid } from "./feature-state";

export function AiTradingWorkspace() {
  return (
    <FeatureState
      eyebrow="AI Trading"
      title="AI-assisted trading workspace with explicit risk controls."
      description="Use AI to organize strategy ideas, risk preferences, market context, and automation candidates. Provider quotes, account state, and execution controls remain authoritative."
      status="in-progress"
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <WorkCard title="AI strategy assistant" description="Structure an idea before it becomes a live strategy or automation run.">
          <div className="grid gap-3 md:grid-cols-2">
            <Capability icon={BrainCircuit} title="Market context" text="Summarize selected-market conditions, recent movement, and available contract families." />
            <Capability icon={SlidersHorizontal} title="Risk profile" text="Translate account limits, stake sizing, loss limits, and session objectives into reviewable settings." />
            <Capability icon={LineChart} title="Strategy draft" text="Prepare Rise/Fall or automation-ready configuration drafts without bypassing provider validation." />
            <Capability icon={ShieldCheck} title="Safety review" text="Flag missing limits, stale quotes, unsupported contracts, and risky account-state assumptions." />
          </div>
        </WorkCard>

        <WorkCard title="Execution boundary" description="AI does not replace provider confirmation or account-level controls.">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="rounded-md border border-border bg-background p-3">
              Quotes, proposals, balances, open positions, and settlement remain provider-authoritative.
            </p>
            <p className="rounded-md border border-border bg-background p-3">
              AI-generated plans must still pass contract discovery, account checks, quote freshness, and explicit user confirmation.
            </p>
            <Button disabled className="w-full">
              <WandSparkles className="h-4 w-4" />
              Generate Strategy Plan
            </Button>
          </div>
        </WorkCard>
      </div>

      <WorkCard title="Planned AI workflow" description="Designed to plug into the existing provider architecture without moving Deriv logic into UI components.">
        <WorkGrid className="lg:grid-cols-4">
          <WorkflowStep title="1. Choose market" text="Use active symbols, chart data, and contract availability." />
          <WorkflowStep title="2. Select intent" text="Scalping, conservative entries, trend following, or copy/automation review." />
          <WorkflowStep title="3. Review controls" text="Stake, max loss, max open positions, duration, contract family, and account type." />
          <WorkflowStep title="4. Confirm action" text="Execution remains explicit and provider-confirmed." />
        </WorkGrid>
      </WorkCard>
    </FeatureState>
  );
}

function Capability({ icon: Icon, title, text }: { icon: typeof Bot; title: string; text: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}

function WorkflowStep({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}
