import type { ReactNode } from "react";

import { PlatformShell } from "@/features/platform/components/platform-shell";

type ShellPageProps = {
  children: ReactNode;
  returnTo: string;
};

export function ShellPage({ children }: ShellPageProps) {
  return <PlatformShell>{children}</PlatformShell>;
}
