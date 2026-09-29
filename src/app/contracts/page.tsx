import { ContractWorkspace } from "@/features/platform/components/contract-workspace";
import { ShellPage } from "@/features/platform/components/shell-page";
import { requireAuthenticatedPage } from "@/lib/auth";

export default async function ContractsPage() {
  await requireAuthenticatedPage("/contracts");

  return (
    <ShellPage returnTo="/contracts">
      <ContractWorkspace family="overview" />
    </ShellPage>
  );
}
