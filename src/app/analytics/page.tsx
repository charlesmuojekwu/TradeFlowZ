import { AnalyticsWorkspace } from "@/features/platform/components/analytics-workspace";
import { ShellPage } from "@/features/platform/components/shell-page";
import { requireAuthenticatedPage } from "@/lib/auth";

export default async function AnalyticsPage() {
  await requireAuthenticatedPage("/analytics");

  return (
    <ShellPage returnTo="/analytics">
      <AnalyticsWorkspace />
    </ShellPage>
  );
}
