import { DashboardOverview } from "@/features/platform/components/dashboard-overview";
import { ShellPage } from "@/features/platform/components/shell-page";
import { requireAuthenticatedPage } from "@/lib/auth";

export default async function DashboardPage() {
  await requireAuthenticatedPage("/dashboard");

  return (
    <ShellPage returnTo="/dashboard">
      <DashboardOverview />
    </ShellPage>
  );
}
