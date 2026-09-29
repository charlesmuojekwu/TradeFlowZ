import { TradingTerminal } from "@/features/trading/components/trading-terminal";
import { requireAuthenticatedPage } from "@/lib/auth";

export default async function PositionsPage() {
  await requireAuthenticatedPage("/positions");

  return <TradingTerminal activeSection="positions" />;
}
