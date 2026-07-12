import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ContractCard } from "@/components/ContractCard";
import { listContracts, seedIfEmpty, type Contract } from "@/lib/contracts-store";
import { ConfirmSetupPayment } from "@/components/ConfirmSetupPayment";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PiTrade — Global Import/Export Smart Contracts on Pi" },
      { name: "description", content: "Create, sign and settle international trade contracts in Pi. Direct Pi Wallet connection and user-to-app payments." },
      { property: "og:title", content: "PiTrade — Global Import/Export Smart Contracts on Pi" },
      { property: "og:description", content: "Create, sign and settle international trade contracts in Pi. Direct Pi Wallet connection and user-to-app payments." },
      { property: "og:url", content: "https://ie-global-trade.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://ie-global-trade.lovable.app/" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify([
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "PiTrade",
          url: "https://ie-global-trade.lovable.app/",
          description: "Global import-export smart contracts platform settled in Pi.",
        },
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "PiTrade",
          url: "https://ie-global-trade.lovable.app/",
          description: "Produce and execute global import-export smart contracts for goods, materials and equipment, settled in Pi.",
        },
      ]),
    }],
  }),
  component: Home,
});

function Home() {
  const [contracts, setContracts] = useState<Contract[]>([]);

  useEffect(() => {
    seedIfEmpty();
    const refresh = () => setContracts(listContracts());
    refresh();
    window.addEventListener("contracts:changed", refresh);
    return () => window.removeEventListener("contracts:changed", refresh);
  }, []);

  const totalVolume = contracts.reduce((s, c) => s + c.amountPi, 0);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-hero">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="absolute -top-32 left-1/2 size-[600px] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 md:pt-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-xs text-gold-soft">
            <span className="size-1.5 rounded-full bg-gold" />
            Built on the Pi Network ecosystem · Mainnet ready
          </div>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Global import & export,<br/>
            settled in <span className="text-gold">π</span> Pi.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            Produce and execute smart contracts for goods, materials and equipment
            anywhere in the world. Direct Pi Wallet connection, user-to-app
            payments, transparent escrow.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/contracts/new"
              className="inline-flex items-center gap-2 rounded-full bg-gold-grad px-6 py-3 text-sm font-semibold text-primary-foreground shadow-gold transition hover:brightness-105"
            >
              Draft a contract
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12m0 0l-5-5m5 5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </Link>
            <Link
              to="/contracts"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3 text-sm font-medium text-foreground transition hover:border-gold/50"
            >
              Browse marketplace
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { k: "Active contracts", v: contracts.length.toString() },
              { k: "Pi in flight", v: "π " + totalVolume.toLocaleString() },
              { k: "Corridors", v: new Set(contracts.map(c=>c.originCountry+"-"+c.destinationCountry)).size.toString() },
              { k: "Settlement", v: "On-chain" },
            ].map((s) => (
              <div key={s.k} className="rounded-2xl border border-border/60 bg-surface/70 p-4 backdrop-blur">
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{s.k}</div>
                <div className="mt-1 font-display text-2xl font-semibold text-foreground">{s.v}</div>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <ConfirmSetupPayment />
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-5 py-16">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-gold">Coverage</div>
            <h2 className="mt-2 font-display text-3xl font-semibold">Every category of cross-border trade.</h2>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {[
            "Agricultural goods","Industrial equipment","Raw materials",
            "Medical supplies","Electronics","Textiles & apparel",
            "Energy & solar","Construction materials","Automotive parts",
            "Chemicals","Food & beverage","Logistics services",
          ].map((c) => (
            <Link
              key={c}
              to="/contracts"
              search={{ category: c }}
              className="group flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-surface px-4 py-5 text-sm text-foreground transition hover:border-gold/60 hover:bg-surface-2 hover:-translate-y-0.5"
              aria-label={`Browse ${c} contracts and services`}
            >
              <span>{c}</span>
              <span aria-hidden className="text-gold opacity-0 transition group-hover:opacity-100">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* LIVE CONTRACTS */}
      <section className="mx-auto max-w-7xl px-5 pb-20">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-gold">Live marketplace</div>
            <h2 className="mt-2 font-display text-3xl font-semibold">Recently published contracts.</h2>
          </div>
          <Link to="/contracts" className="text-sm text-muted-foreground underline-offset-4 hover:text-gold hover:underline">View all →</Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contracts.slice(0, 6).map((c) => (
            <ContractCard key={c.id} contract={c} />
          ))}
        </div>
      </section>

      {/* HOW IT WORKS strip */}
      <section className="border-t border-border/60 bg-surface/40">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 md:grid-cols-4">
          {[
            { n: "01", t: "Connect Pi Wallet", d: "One-tap authentication via the Pi Browser SDK." },
            { n: "02", t: "Draft the contract", d: "Goods, quantity, Incoterm, origin & destination." },
            { n: "03", t: "Buyer pays in Pi", d: "User-to-app payment locks funds for the trade." },
            { n: "04", t: "Release on delivery", d: "Status moves to In transit → Completed." },
          ].map((s) => (
            <div key={s.n}>
              <div className="font-display text-3xl font-semibold text-gold">{s.n}</div>
              <div className="mt-2 text-base font-semibold text-foreground">{s.t}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        PiTrade · A Pi ecosystem app · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
