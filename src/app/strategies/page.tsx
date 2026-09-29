import { ShellPage } from "@/features/platform/components/shell-page";
import { MyStrategies } from "@/features/platform/components/strategy-lab";
import { requireAuthenticatedPage } from "@/lib/auth";

export default async function StrategiesPage() {
  await requireAuthenticatedPage("/strategies");

  return (
    <ShellPage returnTo="/strategies">
      <MyStrategies />
    </ShellPage>
  );
}
