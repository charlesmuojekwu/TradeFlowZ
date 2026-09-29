import { ShellPage } from "@/features/platform/components/shell-page";
import { TradingTerminal } from "@/features/trading/components/trading-terminal";
import { requireAuthenticatedPage } from "@/lib/auth";

export default async function HistoryPage() {
  await requireAuthenticatedPage("/history");

  return (
    <ShellPage returnTo="/history">
      <TradingTerminal activeSection="history" embedded />
    </ShellPage>
  );
}
