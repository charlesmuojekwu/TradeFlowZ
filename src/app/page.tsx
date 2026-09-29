import { PublicLandingPage } from "@/features/landing/components/public-landing-page";
import { getCurrentSession, normalizeReturnPath } from "@/lib/auth";

type HomePageProps = {
  searchParams?: Promise<{ returnTo?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const session = await getCurrentSession();

  return <PublicLandingPage isAuthenticated={Boolean(session)} returnTo={normalizeReturnPath(params?.returnTo)} />;
}
