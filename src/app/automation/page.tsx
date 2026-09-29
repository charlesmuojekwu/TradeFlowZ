import { AutomationWorkspace } from "@/features/platform/components/automation-workspace";
import { ShellPage } from "@/features/platform/components/shell-page";
import { requireAuthenticatedPage } from "@/lib/auth";

export default async function AutomationPage() {
  await requireAuthenticatedPage("/automation");

  return (
    <ShellPage returnTo="/automation">
      <AutomationWorkspace />
    </ShellPage>
  );
}
