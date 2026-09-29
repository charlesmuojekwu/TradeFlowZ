import { TradingTerminal } from "@/features/trading/components/trading-terminal";
import { requireAuthenticatedPage } from "@/lib/auth";

export default async function TradePage() {
  await requireAuthenticatedPage("/trade");

  return <TradingTerminal activeSection="trade" />;
}
