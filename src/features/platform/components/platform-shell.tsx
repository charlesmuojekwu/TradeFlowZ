"use client";

import {
  Activity,
  BarChart3,
  Bot,
  BrainCircuit,
  Copy,
  FlaskConical,
  Gauge,
  Hash,
  History,
  LayoutDashboard,
  Layers,
  Library,
  ListChecks,
  Menu,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  TrendingUp,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PlatformShellProps = {
  children: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const sidebarStorageKey = "tradeflowz-sidebar-collapsed";

const navSections: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Trading",
    items: [
      { href: "/trade", label: "Manual Trading", icon: Activity },
      { href: "/automation", label: "Automated Trading", icon: Bot },
      { href: "/ai", label: "AI Trading", icon: BrainCircuit },
      { href: "/copy", label: "Copy Hub", icon: Copy },
    ],
  },
  {
    label: "Strategies",
    items: [
      { href: "/strategies/lab", label: "Strategy Lab", icon: FlaskConical },
      { href: "/strategies", label: "My Strategies", icon: Library },
    ],
  },
  {
    label: "Contracts",
    items: [
      { href: "/contracts/rise-fall", label: "Rise / Fall", icon: TrendingUp },
      { href: "/contracts/digits", label: "Digits", icon: Hash },
      { href: "/contracts/accumulators", label: "Accumulators", icon: Gauge },
      { href: "/contracts/multipliers", label: "Multipliers", icon: Layers },
      { href: "/contracts", label: "More Contracts", icon: MoreHorizontal },
    ],
  },
  {
    label: "Portfolio",
    items: [
      { href: "/positions", label: "Open Positions", icon: ListChecks },
      { href: "/history", label: "History", icon: History },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
];

const mobileItems: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/trade", label: "Trade", icon: Activity },
  { href: "/automation", label: "Automation", icon: Bot },
  { href: "/ai", label: "AI", icon: BrainCircuit },
  { href: "/positions", label: "Positions", icon: ListChecks },
];

export function PlatformShell({ children }: PlatformShellProps) {
  const pathname = usePathname();
  const [isCollapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(sidebarStorageKey) === "true");
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      const next = !value;
      localStorage.setItem(sidebarStorageKey, String(next));
      return next;
    });
  };

  const navigation = useMemo(
    () => (
      <SidebarContent
        isCollapsed={isCollapsed}
        pathname={pathname}
        onNavigate={() => setMobileOpen(false)}
        onToggleCollapsed={toggleCollapsed}
      />
    ),
    [isCollapsed, pathname],
  );

  return (
    <div className="flex h-dvh min-h-0 bg-background text-foreground">
      <aside
        className={cn(
          "hidden shrink-0 border-r border-border bg-card/95 lg:block",
          isCollapsed ? "w-18" : "w-64",
        )}
      >
        {navigation}
      </aside>

      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative h-full w-72 border-r border-border bg-card shadow-2xl">
            {navigation}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card/95 px-3 lg:hidden">
          <Button variant="outline" size="icon" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>
          <Link href="/dashboard" className="flex items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="grid h-8 w-8 place-items-center rounded-md border border-primary/30 bg-primary/15 text-xs font-semibold text-primary">
              T
            </span>
            <span className="text-sm font-semibold">TradeFlowZ</span>
          </Link>
          <div className="h-9 w-9" aria-hidden="true" />
        </div>

        <div className="min-h-0 flex-1 overflow-hidden pb-16 lg:pb-0">{children}</div>
        <MobileBottomNav pathname={pathname} />
      </div>
    </div>
  );
}

function SidebarContent({
  isCollapsed,
  pathname,
  onNavigate,
  onToggleCollapsed,
}: {
  isCollapsed: boolean;
  pathname: string;
  onNavigate: () => void;
  onToggleCollapsed: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-border px-3">
        <Link href="/dashboard" className="flex min-w-0 flex-1 items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-primary/30 bg-primary/15 text-sm font-semibold text-primary">
            T
          </span>
          {!isCollapsed ? (
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-semibold">TradeFlowZ</span>
              <span className="block truncate text-xs text-muted-foreground">Options platform</span>
            </span>
          ) : null}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:inline-flex"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggleCollapsed}
        >
          {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Close navigation" onClick={onNavigate}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3" aria-label="Application navigation">
        {navSections.map((section) => (
          <div key={section.label} className="mb-4">
            {!isCollapsed ? (
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {section.label}
              </p>
            ) : null}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} isCollapsed={isCollapsed} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}

function NavLink({
  item,
  pathname,
  isCollapsed,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  isCollapsed: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

  return (
    <Link
      href={item.href}
      title={isCollapsed ? item.label : undefined}
      onClick={onNavigate}
      className={cn(
        "flex h-10 items-center gap-3 rounded-md px-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring",
        isActive
          ? "border border-primary/25 bg-primary/15 text-foreground"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        isCollapsed && "justify-center px-0",
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!isCollapsed ? <span className="truncate">{item.label}</span> : <span className="sr-only">{item.label}</span>}
    </Link>
  );
}

function MobileBottomNav({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-5 border-t border-border bg-card/95 backdrop-blur lg:hidden" aria-label="Mobile navigation">
      {mobileItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-[11px] outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive ? "text-primary" : "text-muted-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
