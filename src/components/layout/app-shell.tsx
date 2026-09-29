import Link from "next/link";

type AppShellProps = {
  activeSection?: "trade" | "positions" | "history";
};

const navigation = [
  { href: "/trade", label: "Trade", id: "trade" },
  { href: "/positions", label: "Positions", id: "positions" },
  { href: "/history", label: "History", id: "history" },
] as const;

export function AppShell({ activeSection = "trade" }: AppShellProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/trade" className="text-lg font-semibold tracking-normal">
            Trade
          </Link>
          <nav className="flex items-center gap-2" aria-label="Primary navigation">
            {navigation.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={
                  item.id === activeSection
                    ? "rounded-md bg-secondary px-3 py-2 text-sm font-medium"
                    : "rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase text-muted-foreground">Trading workspace</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal">Open the Deriv-connected terminal.</h1>
          <p className="mt-4 text-muted-foreground">
            Use the primary trading routes to view real market discovery, live chart data, account balances,
            positions, and provider-sourced history.
          </p>
        </div>
      </section>
    </main>
  );
}
