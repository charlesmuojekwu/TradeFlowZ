import { AiTradingWorkspace } from "@/features/platform/components/ai-trading-workspace";
import { ShellPage } from "@/features/platform/components/shell-page";
import { requireAuthenticatedPage } from "@/lib/auth";

export default async function AiTradingPage() {
  await requireAuthenticatedPage("/ai");

  return (
    <ShellPage returnTo="/ai">
      <AiTradingWorkspace />
    </ShellPage>
  );
}
