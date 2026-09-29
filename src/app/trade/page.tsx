import { TradingTerminal } from "@/features/trading/components/trading-terminal";
import { ShellPage } from "@/features/platform/components/shell-page";
import { requireAuthenticatedPage } from "@/lib/auth";

export default async function TradePage() {
  await requireAuthenticatedPage("/trade");

  return (
    <ShellPage returnTo="/trade">
      <TradingTerminal activeSection="trade" embedded />
    </ShellPage>
  );
}
