import { ShellPage } from "@/features/platform/components/shell-page";
import { TradingTerminal } from "@/features/trading/components/trading-terminal";
import { requireAuthenticatedPage } from "@/lib/auth";

export default async function PositionsPage() {
  await requireAuthenticatedPage("/positions");

  return (
    <ShellPage returnTo="/positions">
      <TradingTerminal activeSection="positions" embedded />
    </ShellPage>
  );
}
