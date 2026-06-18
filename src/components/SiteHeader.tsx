import { Link, useRouterState } from "@tanstack/react-router";
import { PiConnectButton } from "./PiConnectButton";

export function SiteHeader() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const link = (to: string, label: string) => (
    <Link
      to={to}
      className={`rounded-full px-3 py-1.5 text-sm transition ${
        path === to
          ? "bg-surface-2 text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-gold-grad font-display text-lg font-bold text-primary-foreground shadow-gold">π</span>
          <div className="leading-tight">
            <div className="font-display text-sm font-semibold tracking-tight">PiTrade</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Global Smart Contracts</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {link("/", "Home")}
          {link("/contracts", "Contracts")}
          {link("/contracts/new", "New")}
          {link("/how-it-works", "How it works")}
        </nav>
        <PiConnectButton compact />
      </div>
    </header>
  );
}
