import { ShellPage } from "@/features/platform/components/shell-page";
import { StrategyLab } from "@/features/platform/components/strategy-lab";
import { requireAuthenticatedPage } from "@/lib/auth";

export default async function StrategyLabPage() {
  await requireAuthenticatedPage("/strategies/lab");

  return (
    <ShellPage returnTo="/strategies/lab">
      <StrategyLab />
    </ShellPage>
  );
}
