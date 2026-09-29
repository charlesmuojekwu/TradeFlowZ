import { ContractWorkspace } from "@/features/platform/components/contract-workspace";
import { ShellPage } from "@/features/platform/components/shell-page";
import { requireAuthenticatedPage } from "@/lib/auth";

export default async function DigitsPage() {
  await requireAuthenticatedPage("/contracts/digits");

  return (
    <ShellPage returnTo="/contracts/digits">
      <ContractWorkspace family="digits" />
    </ShellPage>
  );
}
