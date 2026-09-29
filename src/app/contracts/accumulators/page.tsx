import { ContractWorkspace } from "@/features/platform/components/contract-workspace";
import { ShellPage } from "@/features/platform/components/shell-page";
import { requireAuthenticatedPage } from "@/lib/auth";

export default async function AccumulatorsPage() {
  await requireAuthenticatedPage("/contracts/accumulators");

  return (
    <ShellPage returnTo="/contracts/accumulators">
      <ContractWorkspace family="accumulators" />
    </ShellPage>
  );
}
