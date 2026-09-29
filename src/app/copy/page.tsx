import { CopyHub } from "@/features/platform/components/copy-hub";
import { ShellPage } from "@/features/platform/components/shell-page";
import { requireAuthenticatedPage } from "@/lib/auth";

export default async function CopyPage() {
  await requireAuthenticatedPage("/copy");

  return (
    <ShellPage returnTo="/copy">
      <CopyHub />
    </ShellPage>
  );
}
