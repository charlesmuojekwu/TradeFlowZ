import {
  Activity,
  ArrowRight,
  Blocks,
  CircleDot,
  History,
  LockKeyhole,
  Radar,
  Route,
  ShieldCheck,
  Split,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

type PublicLandingPageProps = {
  authStatus?: string;
  isAuthenticated: boolean;
  reason?: string;
  returnTo?: string;
};

const signInHref = (returnTo = "/trade") => `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
const registerHref = (returnTo = "/trade") =>
  `/api/auth/login?intent=register&prompt=registration&returnTo=${encodeURIComponent(returnTo)}`;

const journey = [
  ["01", "Connect", "Create or connect a Deriv account through the hosted OAuth flow."],
  ["02", "Explore", "Choose a supported market and follow live price movement."],
  ["03", "Trade", "Configure Rise/Fall, review the quote, then execute in demo mode."],
  ["04", "Track", "Monitor the open contract, live P/L, sell state, and settlement."],
] as const;

const capabilities = [
  ["Discover", "Browse supported markets and live pricing."],
  ["Trade", "Configure supported demo contracts."],
  ["Monitor", "Follow open positions and live P/L."],
  ["Review", "Inspect settled contracts and history."],
] as const;

export function PublicLandingPage({ authStatus, isAuthenticated, reason, returnTo = "/dashboard" }: PublicLandingPageProps) {
  const primaryHref = isAuthenticated ? "/trade" : registerHref(returnTo);
  const secondaryHref = isAuthenticated ? "/trade" : signInHref(returnTo);
  const authMessage = getAuthMessage(authStatus, reason);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080B12] text-[#F7F8FA]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(rgba(129,140,248,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(129,140,248,0.05)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <header className="sticky top-0 z-40 border-b border-[#273044] bg-[#080B12]/88 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-5 py-3 lg:px-8">
          <Link href="/" className="group flex items-center gap-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[#818CF8]">
            <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-md border border-[#6366F1]/50 bg-[#151B29]">
              <span className="absolute inset-x-2 top-2 h-px bg-[#818CF8]" />
              <span className="font-mono text-sm font-bold text-[#F7F8FA]">TR</span>
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold tracking-[0.18em] text-white">TRADE</span>
              <span className="hidden text-xs text-[#929BAD] sm:block">Market execution workspace</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-[#AAB2C2] md:flex" aria-label="Public navigation">
            <a className="rounded-sm outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-[#818CF8]" href="#product">
              Product
            </a>
            <a className="rounded-sm outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-[#818CF8]" href="#markets">
              Markets
            </a>
            <a className="rounded-sm outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-[#818CF8]" href="#workflow">
              How It Works
            </a>
            <a className="rounded-sm outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-[#818CF8]" href="#features">
              Features
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <a
              href={secondaryHref}
              className="rounded-md border border-[#2D354A] px-4 py-2 text-sm font-medium text-[#E7EAF0] outline-none transition hover:border-[#818CF8]/70 hover:bg-[#151B29] focus-visible:ring-2 focus-visible:ring-[#818CF8]"
            >
              {isAuthenticated ? "Open App" : "Sign In"}
            </a>
            {!isAuthenticated ? (
              <a
                href={primaryHref}
                className="rounded-md bg-[#6366F1] px-4 py-2 text-sm font-semibold text-white outline-none transition hover:-translate-y-0.5 hover:bg-[#4F46E5] focus-visible:ring-2 focus-visible:ring-[#818CF8] motion-reduce:hover:translate-y-0"
              >
                Get Started
              </a>
            ) : null}
          </div>

          <details className="group relative md:hidden">
            <summary className="cursor-pointer list-none rounded-md border border-[#2D354A] px-3 py-2 text-sm font-medium text-[#F7F8FA] outline-none focus-visible:ring-2 focus-visible:ring-[#818CF8]">
              Menu
            </summary>
            <div className="absolute right-0 mt-3 w-60 rounded-md border border-[#273044] bg-[#101521] p-2 shadow-2xl">
              {[
                ["Product", "#product"],
                ["Markets", "#markets"],
                ["How It Works", "#workflow"],
                ["Features", "#features"],
              ].map(([label, href]) => (
                <a key={label} className="block rounded px-3 py-2 text-sm text-[#AAB2C2] hover:bg-[#151B29] hover:text-white" href={href}>
                  {label}
                </a>
              ))}
              <a className="mt-2 block rounded border border-[#2D354A] px-3 py-2 text-sm text-white" href={secondaryHref}>
                {isAuthenticated ? "Open App" : "Sign In"}
              </a>
              {!isAuthenticated ? (
                <a className="mt-2 block rounded bg-[#6366F1] px-3 py-2 text-sm font-semibold text-white" href={primaryHref}>
                  Get Started
                </a>
              ) : null}
            </div>
          </details>
        </div>
      </header>

      <section id="product" className="relative mx-auto max-w-7xl px-5 pb-14 pt-16 text-center sm:pt-20 lg:px-8 lg:pb-20">
        <div className="mx-auto max-w-5xl">
          {authMessage ? (
            <div className="mx-auto mb-6 max-w-3xl rounded-md border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-left text-sm leading-6 text-[#FCA5A5]" role="status">
              {authMessage}
            </div>
          ) : null}
          <p className="mx-auto inline-flex items-center gap-2 rounded border border-[#273044] bg-[#101521] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.24em] text-[#AAB2C2]">
            <CircleDot className="h-3.5 w-3.5 text-[#818CF8]" aria-hidden="true" />
            One Deriv-connected workspace
          </p>
          <h1 className="mx-auto mt-7 max-w-4xl text-5xl font-semibold tracking-normal text-white sm:text-6xl lg:text-7xl">
            From market movement to trade, in one focused workspace.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[#AAB2C2]">
            Watch real-time markets, inspect charts, price Rise/Fall contracts, execute demo trades, and track live
            positions without jumping between tools.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={primaryHref}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#6366F1] px-5 py-3 text-sm font-semibold text-white outline-none transition hover:-translate-y-0.5 hover:bg-[#4F46E5] focus-visible:ring-2 focus-visible:ring-[#818CF8] motion-reduce:hover:translate-y-0"
            >
              {isAuthenticated ? "Open Trading App" : "Get Started"}
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={secondaryHref}
              className="inline-flex items-center justify-center rounded-md border border-[#2D354A] bg-[#101521] px-5 py-3 text-sm font-semibold text-white outline-none transition hover:border-[#818CF8]/70 focus-visible:ring-2 focus-visible:ring-[#818CF8]"
            >
              {isAuthenticated ? "Go to Dashboard" : "Sign In"}
            </a>
          </div>
          <p className="mt-5 text-sm text-[#929BAD]">
            Securely connected through Deriv. We do not collect your Deriv password.
          </p>
        </div>

        <div className="mt-12 motion-safe:animate-[preview-in_700ms_ease-out]">
          <TerminalPreview />
        </div>
      </section>

      <section id="workflow" className="border-y border-[#273044] bg-[#0B0F18]">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#818CF8]">How it works</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold text-white sm:text-5xl">A clean path from account to settlement.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#929BAD]">
              Registration and sign-in happen with Deriv OAuth. The trading app opens only after a valid session exists.
            </p>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-stretch">
            {journey.map(([step, title, description], index) => (
              <JourneyStep key={step} step={step} title={title} description={description} showArrow={index < journey.length - 1} />
            ))}
          </div>
        </div>
      </section>

      <section id="markets" className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#818CF8]">Product loop</p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-5xl">The terminal is built around four actions.</h2>
            <p className="mt-5 text-[#AAB2C2]">
              Each screen in the protected app supports the same rhythm: find the market, configure the trade,
              monitor the contract, and review the outcome.
            </p>
          </div>

          <div className="relative rounded-lg border border-[#273044] bg-[#101521] p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {capabilities.map(([title, description], index) => (
                <div
                  key={title}
                  className="relative rounded-md border border-[#273044] bg-[#151B29] p-5 transition hover:-translate-y-0.5 hover:border-[#6366F1]/60 motion-reduce:hover:translate-y-0"
                >
                  <p className="font-mono text-xs text-[#818CF8]">0{index + 1}</p>
                  <h3 className="mt-4 text-xl font-semibold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#929BAD]">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-[#273044] bg-[#0B0F18]">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#818CF8]">Features</p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-5xl">Purpose-built around implemented capability.</h2>
          </div>

          <div className="mt-10 grid auto-rows-[minmax(170px,auto)] gap-4 lg:grid-cols-4">
            <FeaturePanel
              className="lg:col-span-2 lg:row-span-2"
              icon={Radar}
              title="Real-time market workspace"
              description="Discover supported Deriv markets, select Volatility 100, load history, and keep live ticks isolated from broad app state."
              stat="Live ticks"
            />
            <FeaturePanel
              icon={LockKeyhole}
              title="Deriv connection"
              description="OAuth with PKCE, secure session cookies, account selection, and separate public/authenticated WebSockets."
              stat="PKCE"
            />
            <FeaturePanel
              icon={Activity}
              title="Live position monitoring"
              description="Open contracts update P/L, current spot, sell availability, status, and countdowns."
              stat="+P/L"
            />
            <FeaturePanel
              className="lg:col-span-2"
              icon={History}
              title="Trade history"
              description="Review provider-sourced closed contracts with market, direction, stake, payout, status, and timing filters."
              stat="History"
            />
            <FeaturePanel
              icon={Split}
              title="Rise / Fall ticket"
              description="Provider-discovered contract rules keep unsupported configurations out of the ticket."
              stat="Rise/Fall"
            />
            <FeaturePanel
              icon={Blocks}
              title="Responsive trading"
              description="Desktop terminal, tablet collapsing panels, and mobile-first trading tabs use the same provider layer."
              stat="All screens"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-[#273044] bg-[#101521] p-6">
            <ShieldCheck className="h-6 w-6 text-[#818CF8]" aria-hidden="true" />
            <h2 className="mt-5 text-2xl font-semibold text-white">Secure account entry</h2>
            <p className="mt-3 text-sm leading-6 text-[#AAB2C2]">
              Sign-in and registration are completed through Deriv. This application receives an OAuth session and
              uses HttpOnly cookies rather than asking for your Deriv password.
            </p>
          </div>
          <div className="rounded-lg border border-[#273044] bg-[#101521] p-6">
            <WalletCards className="h-6 w-6 text-[#818CF8]" aria-hidden="true" />
            <h2 className="mt-5 text-2xl font-semibold text-white">Demo-first execution</h2>
            <p className="mt-3 text-sm leading-6 text-[#AAB2C2]">
              Accounts are clearly labeled DEMO or REAL. Demo execution is enabled; real-money buy execution remains
              blocked in this frontend stage.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-18 pt-8 text-center lg:pb-24">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#818CF8]">Open the workspace</p>
        <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold text-white sm:text-5xl">
          Ready to open your trading workspace?
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-[#AAB2C2]">
          Connect or create a Deriv account, then continue into the protected terminal.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a className="rounded-md bg-[#6366F1] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4F46E5]" href={primaryHref}>
            {isAuthenticated ? "Open Trading App" : "Get Started"}
          </a>
          <a className="rounded-md border border-[#2D354A] bg-[#101521] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#818CF8]/70" href={secondaryHref}>
            {isAuthenticated ? "Go to Dashboard" : "Sign In"}
          </a>
        </div>
        <p className="mt-5 text-sm text-[#929BAD]">
          Authentication is completed securely through Deriv. We do not collect your Deriv password.
        </p>
      </section>

      <footer className="border-t border-[#273044] bg-[#060912]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] lg:px-8">
          <div>
            <p className="font-mono text-lg font-semibold tracking-[0.2em] text-white">TRADE</p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-[#929BAD]">
              A Deriv-connected workspace for market discovery, demo execution, live positions, and history.
            </p>
          </div>
          <FooterColumn title="Platform" links={[["Product", "#product"], ["How It Works", "#workflow"], ["Trading App", "/trade"]]} />
          <FooterColumn title="Resources" links={[["Documentation", undefined], ["Help / Contact", undefined]]} />
          <FooterColumn title="Legal" links={[["Terms", undefined], ["Privacy", undefined], ["Risk Disclosure", "#risk"]]} />
        </div>
        <div id="risk" className="mx-auto max-w-7xl border-t border-[#273044] px-5 py-6 text-sm leading-6 text-[#AAB2C2] lg:px-8">
          <strong className="text-white">Risk disclosure:</strong> Trading options and other financial products involves
          substantial risk. Prices can move quickly, contracts can expire without value, and you may lose money. Use demo
          accounts to understand the workflow before considering real-money trading.
        </div>
      </footer>
    </main>
  );
}

function JourneyStep({
  step,
  title,
  description,
  showArrow,
}: {
  step: string;
  title: string;
  description: string;
  showArrow: boolean;
}) {
  return (
    <>
      <article className="rounded-lg border border-[#273044] bg-[#101521] p-5">
        <p className="font-mono text-xs text-[#818CF8]">{step}</p>
        <h3 className="mt-5 text-xl font-semibold text-white">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-[#929BAD]">{description}</p>
      </article>
      {showArrow ? (
        <div className="hidden items-center justify-center text-[#4C5570] lg:flex" aria-hidden="true">
          <ArrowRight className="h-5 w-5" />
        </div>
      ) : null}
    </>
  );
}

function FeaturePanel({
  icon: Icon,
  title,
  description,
  stat,
  className = "",
}: {
  icon: typeof Activity;
  title: string;
  description: string;
  stat: string;
  className?: string;
}) {
  return (
    <article className={`rounded-lg border border-[#273044] bg-[#101521] p-5 transition hover:border-[#6366F1]/70 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <Icon className="h-6 w-6 text-[#818CF8]" aria-hidden="true" />
        <span className="rounded border border-[#273044] px-2 py-1 font-mono text-xs text-[#AAB2C2]">{stat}</span>
      </div>
      <h3 className="mt-6 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[#929BAD]">{description}</p>
    </article>
  );
}

function TerminalPreview() {
  return (
    <div
      className="mx-auto w-full max-w-6xl rounded-xl border border-[#273044] bg-[#101521] p-3 shadow-[0_24px_90px_rgba(79,70,229,0.18)]"
      aria-label="Trading terminal preview"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#273044] px-3 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#6366F1]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
          <span className="ml-3 font-mono text-xs text-[#929BAD]">app.trade/workspace</span>
        </div>
        <div className="hidden gap-2 text-xs text-[#929BAD] sm:flex">
          <span className="rounded border border-[#273044] px-2 py-1">DEMO</span>
          <span className="rounded border border-[#273044] px-2 py-1">Connected</span>
        </div>
      </div>

      <div className="grid min-h-[520px] gap-3 pt-3 lg:grid-cols-[250px_minmax(0,1fr)_280px]">
        <aside className="rounded-lg border border-[#273044] bg-[#0B0F18] p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#929BAD]">Markets</p>
            <Route className="h-4 w-4 text-[#818CF8]" aria-hidden="true" />
          </div>
          {[
            ["Volatility 100 Index", "1284.63", "Live"],
            ["EUR/USD", "1.08421", "Ready"],
            ["BTC/USD", "64210.4", "Ready"],
            ["Gold", "2360.18", "Ready"],
          ].map(([market, price, state], index) => (
            <div
              key={market}
              className={index === 0 ? "mt-3 rounded-md border border-[#6366F1]/60 bg-[#151B29] p-3" : "mt-2 rounded-md border border-[#273044] bg-[#101521] p-3"}
            >
              <p className="truncate text-sm font-medium text-white">{market}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-[#AAB2C2]">{price}</span>
                <span className={state === "Live" ? "text-xs text-[#34D399]" : "text-xs text-[#929BAD]"}>{state}</span>
              </div>
            </div>
          ))}
        </aside>

        <section className="rounded-lg border border-[#273044] bg-[#0B0F18] p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#929BAD]">Volatility 100 Index</p>
              <p className="mt-2 font-mono text-4xl font-semibold text-white">1284.63</p>
              <p className="mt-1 text-sm text-[#34D399]">+5.42 (+0.42%)</p>
            </div>
            <div className="grid grid-cols-4 gap-1 rounded-md border border-[#273044] bg-[#101521] p-1">
              {["1m", "5m", "15m", "1h"].map((item, index) => (
                <span key={item} className={index === 1 ? "rounded bg-[#6366F1] px-2 py-1 text-center text-xs text-white" : "px-2 py-1 text-center text-xs text-[#929BAD]"}>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mt-8 h-64 overflow-hidden rounded-lg border border-[#273044] bg-[#101521]">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(129,140,248,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(129,140,248,0.07)_1px,transparent_1px)] bg-[size:36px_36px]" />
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 280" role="img" aria-label="Stylized live price chart">
              <defs>
                <linearGradient id="previewLine" x1="0" x2="1" y1="0" y2="0">
                  <stop stopColor="#818CF8" />
                  <stop offset="1" stopColor="#34D399" />
                </linearGradient>
              </defs>
              <path
                d="M0 190 C80 170 88 118 150 132 C232 150 230 82 310 104 C390 126 405 58 478 78 C560 100 570 164 650 126 C710 98 742 86 800 72"
                fill="none"
                stroke="url(#previewLine)"
                strokeLinecap="round"
                strokeWidth="4"
              />
              <path
                d="M0 190 C80 170 88 118 150 132 C232 150 230 82 310 104 C390 126 405 58 478 78 C560 100 570 164 650 126 C710 98 742 86 800 72 L800 280 L0 280 Z"
                fill="rgba(99,102,241,0.10)"
              />
            </svg>
            <div className="absolute bottom-4 left-4 rounded border border-[#273044] bg-[#080B12]/80 px-3 py-2 text-left backdrop-blur">
              <p className="font-mono text-xs text-[#929BAD]">Live spot</p>
              <p className="font-mono text-sm text-white">1284.63</p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-[#273044] bg-[#101521] p-3">
            <div className="grid gap-3 text-sm sm:grid-cols-5">
              {["Market", "Direction", "Stake", "Live P/L", "Status"].map((label) => (
                <p key={label} className="text-xs uppercase tracking-[0.12em] text-[#929BAD]">{label}</p>
              ))}
              {["Vol 100", "Rise", "$10.00", "+$1.26", "Open"].map((value, index) => (
                <p key={value} className={index === 3 ? "font-mono text-[#34D399]" : "font-mono text-white"}>{value}</p>
              ))}
            </div>
          </div>
        </section>

        <aside className="rounded-lg border border-[#273044] bg-[#0B0F18] p-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#929BAD]">Trade Ticket</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <span className="rounded-md bg-[#EF4444]/15 px-3 py-3 text-center text-sm font-semibold text-[#FCA5A5]">Fall</span>
            <span className="rounded-md bg-[#22C55E]/15 px-3 py-3 text-center text-sm font-semibold text-[#86EFAC]">Rise</span>
          </div>
          <div className="mt-5 space-y-3 rounded-lg border border-[#273044] bg-[#101521] p-4 text-sm">
            <Metric label="Stake" value="$10.00" />
            <Metric label="Duration" value="5 minutes" />
            <Metric label="Ask price" value="$10.00" />
            <Metric label="Payout" value="$18.63" />
            <Metric label="Profit" value="+$8.63" positive />
          </div>
          <span className="mt-5 block rounded-md bg-[#22C55E] px-4 py-3 text-center text-sm font-semibold text-black">Buy Rise</span>
          <p className="mt-4 text-xs leading-5 text-[#929BAD]">
            Quote values come from the provider. Settlement remains provider-authoritative.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Metric({ label, value, positive = false }: { label: string; value: string; positive?: boolean }) {
  return (
    <p className="flex items-center justify-between gap-4">
      <span className="text-[#929BAD]">{label}</span>
      <span className={positive ? "font-mono text-[#34D399]" : "font-mono text-white"}>{value}</span>
    </p>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<[string, string | undefined]> }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map(([label, href]) => (
          <li key={label}>
            {href ? (
              <a className="text-[#929BAD] transition hover:text-white" href={href}>
                {label}
              </a>
            ) : (
              <span className="text-[#5F687A]" aria-disabled="true">
                {label}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function getAuthMessage(status?: string, reason?: string) {
  if (!status) {
    return undefined;
  }

  const messages: Record<string, string> = {
    config: "Authentication is not configured. Check the Deriv client ID and redirect URI on the server.",
    error: "Deriv returned an authentication error. Please try signing in again.",
    session: "Authentication completed, but the app could not create a secure session. Check DERIV_SESSION_SECRET in the deployment environment.",
    state: "Authentication expired or could not be verified. Please start sign-in again from this page.",
    token: reason
      ? `Authentication could not be completed with Deriv (${reason}). Check the OAuth redirect URI and server configuration.`
      : "Authentication could not be completed with Deriv. Check the OAuth redirect URI and server configuration.",
  };

  return messages[status] ?? "Authentication could not be completed. Please try again.";
}
