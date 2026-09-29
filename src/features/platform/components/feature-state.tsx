import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";

type FeatureStateProps = {
  title: string;
  eyebrow?: string;
  description: string;
  status?: "available" | "in-progress" | "backend-required";
  children?: ReactNode;
  primaryAction?: {
    label: string;
    href: string;
  };
};

export function FeatureState({
  title,
  eyebrow,
  description,
  status = "in-progress",
  children,
  primaryAction,
}: FeatureStateProps) {
  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <Panel className="rounded-md p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              {eyebrow ? (
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
              ) : null}
              <h1 className="mt-2 text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">{title}</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
            <Badge tone={statusTone(status)}>{statusLabel(status)}</Badge>
          </div>
          {primaryAction ? (
            <Button asChild className="mt-5" variant="secondary">
              <Link href={primaryAction.href}>
                {primaryAction.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
        </Panel>

        {children ?? (
          <Panel className="rounded-md p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <h2 className="font-semibold">Integration in progress</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  This area is wired into the platform navigation and domain model. Provider-backed execution will be
                  added in a later phase without bypassing the shared provider interfaces.
                </p>
              </div>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

export function WorkGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-4 lg:grid-cols-3", className)}>{children}</div>;
}

export function WorkCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <Panel className="rounded-md p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      {description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </Panel>
  );
}

function statusTone(status: NonNullable<FeatureStateProps["status"]>) {
  if (status === "available") {
    return "success";
  }

  if (status === "backend-required") {
    return "warning";
  }

  return "info";
}

function statusLabel(status: NonNullable<FeatureStateProps["status"]>) {
  if (status === "available") {
    return "Available";
  }

  if (status === "backend-required") {
    return "Backend required";
  }

  return "Integration in progress";
}
