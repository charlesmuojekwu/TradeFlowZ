import { ContractWorkspace } from "@/features/platform/components/contract-workspace";
import { ShellPage } from "@/features/platform/components/shell-page";
import { requireAuthenticatedPage } from "@/lib/auth";

export default async function RiseFallPage() {
  await requireAuthenticatedPage("/contracts/rise-fall");

  return (
    <ShellPage returnTo="/contracts/rise-fall">
      <ContractWorkspace family="rise-fall" />
    </ShellPage>
  );
}
