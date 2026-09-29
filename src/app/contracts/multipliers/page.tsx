import { ContractWorkspace } from "@/features/platform/components/contract-workspace";
import { ShellPage } from "@/features/platform/components/shell-page";
import { requireAuthenticatedPage } from "@/lib/auth";

export default async function MultipliersPage() {
  await requireAuthenticatedPage("/contracts/multipliers");

  return (
    <ShellPage returnTo="/contracts/multipliers">
      <ContractWorkspace family="multipliers" />
    </ShellPage>
  );
}
