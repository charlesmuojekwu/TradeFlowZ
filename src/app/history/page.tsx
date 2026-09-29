import { TradingTerminal } from "@/features/trading/components/trading-terminal";
import { requireAuthenticatedPage } from "@/lib/auth";

export default async function HistoryPage() {
  await requireAuthenticatedPage("/history");

  return <TradingTerminal activeSection="history" />;
}
