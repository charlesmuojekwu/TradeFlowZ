import { LockKeyhole, Settings, ShieldCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";

import { FeatureState, WorkCard, WorkGrid } from "./feature-state";

export function CopyHub() {
  return (
    <FeatureState
      eyebrow="Copy Hub"
      title="Copy trading architecture without insecure browser token storage."
      description="This workspace defines the product surface for trader discovery, following, copy settings, and activity. Production execution requires a secure backend and encrypted token vault."
      status="backend-required"
    >
      <WorkGrid className="lg:grid-cols-4">
        <WorkCard title="Discover Traders" description="Provider or backend-sourced trader profiles will appear here." />
        <WorkCard title="Following" description="Follow relationships will be loaded through CopyTradingProvider." />
        <WorkCard title="My Copy Settings" description="Independent follower-side risk controls remain mandatory." />
        <WorkCard title="Copy Activity" description="Execution activity will come from a backend copy service." />
      </WorkGrid>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <WorkCard title="Risk controls">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Copy amount",
              "Maximum stake",
              "Daily loss limit",
              "Session loss limit",
              "Maximum simultaneous positions",
              "Contract restrictions",
            ].map((item) => (
              <div key={item} className="rounded-md border border-border bg-background p-3 text-sm">{item}</div>
            ))}
          </div>
        </WorkCard>

        <WorkCard title="Backend requirement">
          <div className="space-y-3 text-sm text-muted-foreground">
            <SecurityLine icon={LockKeyhole} text="Do not store Personal Access Tokens in localStorage, sessionStorage, Zustand, IndexedDB, or client source." />
            <SecurityLine icon={ShieldCheck} text="Future execution path: Next.js to secure backend to copy service to encrypted token vault to Deriv Bulk Purchase API." />
            <SecurityLine icon={Settings} text="Follower risk limits must be applied independently from trader stake sizing." />
          </div>
          <Button disabled className="mt-4 w-full">
            <Users className="h-4 w-4" />
            Follow Trader
          </Button>
        </WorkCard>
      </div>
    </FeatureState>
  );
}

function SecurityLine({ icon: Icon, text }: { icon: typeof LockKeyhole; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <p>{text}</p>
    </div>
  );
}
