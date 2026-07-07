import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ContractCard } from "@/components/ContractCard";
import { listContracts, seedIfEmpty, type Contract, type ContractStatus } from "@/lib/contracts-store";

export const Route = createFileRoute("/contracts/")({
  validateSearch: (search: Record<string, unknown>) => ({
    category: typeof search.category === "string" ? search.category : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Contracts marketplace · PiTrade global trade in Pi" },
      { name: "description", content: "Browse global import-export smart contracts settled in Pi. Filter by status — awaiting payment, funded, in transit, completed." },
      { property: "og:title", content: "PiTrade Marketplace — Global Trade Contracts in Pi" },
      { property: "og:description", content: "Live import-export smart contracts settled directly from Pi Wallets." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ie-global-trade.lovable.app/contracts" },
    ],
    links: [{ rel: "canonical", href: "https://ie-global-trade.lovable.app/contracts" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "PiTrade Contracts Marketplace",
        description: "Global import-export smart contracts settled in Pi.",
        url: "https://ie-global-trade.lovable.app/contracts",
      }),
    }],
  }),
  component: ContractsList,
});

const FILTERS: Array<{ k: ContractStatus | "all"; label: string }> = [
  { k: "all", label: "All" },
  { k: "awaiting_payment", label: "Awaiting payment" },
  { k: "funded", label: "Funded" },
  { k: "in_transit", label: "In transit" },
  { k: "completed", label: "Completed" },
];

function ContractsList() {
  const { category } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filter, setFilter] = useState<ContractStatus | "all">("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    seedIfEmpty();
    const refresh = () => setContracts(listContracts());
    refresh();
    window.addEventListener("contracts:changed", refresh);
    return () => window.removeEventListener("contracts:changed", refresh);
  }, []);

  const filtered = contracts.filter((c) => {
    if (filter !== "all" && c.status !== filter) return false;
    if (category && c.category !== category) return false;
    if (q && !(`${c.title} ${c.goods} ${c.originCountry} ${c.destinationCountry}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-gold">Marketplace</div>
            <h1 className="mt-1 font-display text-3xl font-semibold md:text-4xl">
              {category ? category : "All smart contracts"}
            </h1>
            {category && (
              <button
                onClick={() => navigate({ search: {} })}
                className="mt-2 text-xs text-muted-foreground underline-offset-4 hover:text-gold hover:underline"
              >
                ← Clear category filter
              </button>
            )}
          </div>
          <Link to="/contracts/new" className="rounded-full bg-gold-grad px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold">
            + New contract
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <label htmlFor="contract-search" className="sr-only">Search contracts</label>
          <input
            id="contract-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search goods, countries…"
            aria-label="Search contracts"
            className="w-full max-w-sm rounded-full border border-border bg-surface px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-gold focus:outline-none"
          />
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.k}
                onClick={() => setFilter(f.k)}
                className={`rounded-full px-3 py-1.5 text-xs transition ${
                  filter === f.k ? "bg-gold text-primary-foreground" : "border border-border bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No contracts match your filters.
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => <ContractCard key={c.id} contract={c} />)}
          </div>
        )}
      </div>
    </div>
  );
}
