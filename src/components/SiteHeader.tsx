import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { PiConnectButton } from "./PiConnectButton";
import { PiWalletButton } from "./PiWalletButton";
import { SettingsButton } from "./SettingsButton";

const NAV: Array<[string, string]> = [
  ["/", "Home"],
  ["/wallet", "π Wallet"],
  ["/contracts", "Contracts"],
  ["/contracts/new", "New"],
  ["/services", "Services"],
  ["/guide", "Guide"],
  ["/how-it-works", "How it works"],
  ["/trust", "Trust"],
];

export function SiteHeader() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
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
          {NAV.map(([to, label]) => <span key={to}>{link(to, label)}</span>)}
        </nav>
        <div className="flex items-center gap-2">
          <PiWalletButton compact />
          <PiConnectButton compact />
          <SettingsButton compact />
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid size-9 place-items-center rounded-full border border-border bg-surface-2 text-foreground md:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-border/60 bg-background/95 px-4 pb-4 pt-2 md:hidden">
          <div className="grid grid-cols-2 gap-2">
            {NAV.map(([to, label]) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={`rounded-xl border border-border/60 px-3 py-2.5 text-sm ${
                  path === to ? "bg-surface-2 text-foreground" : "text-muted-foreground"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>

  );
}
