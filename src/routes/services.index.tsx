import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { PiComplianceFooter } from "@/components/PiComplianceFooter";
import {
  REACH_LABELS,
  SERVICE_GROUPS,
  SERVICES,
  serviceReach,
  type ServiceReach,
} from "@/lib/trade/services";

export const Route = createFileRoute("/services/")({
  head: () => ({
    meta: [
      { title: "Trade services · Global, national & regional on Pi" },
      { name: "description", content: "Every traditional import-export service — sea, air, road and rail freight, customs, single windows, trade agreements, documents, insurance, warehousing, licensing and QFS-compatible π settlement — on PiTrade smart contracts." },
      { property: "og:title", content: "PiTrade services — global, national and regional trade" },
      { property: "og:description", content: "Freight, customs, single windows, preferential origin, public procurement, corridors, documents, insurance and QFS-compatible settlement in π." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ie-global-trade.lovable.app/services" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "PiTrade services — global, national and regional trade" },
      { name: "twitter:description", content: "The whole import/export desk plus QFS-compatible settlement, all in π." },
    ],
    links: [{ rel: "canonical", href: "https://ie-global-trade.lovable.app/services" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "PiTrade import & export services",
        itemListElement: SERVICES.map((s, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: s.name,
          url: `https://ie-global-trade.lovable.app/services/${s.slug}`,
        })),
      }),
    }],
  }),
  component: ServicesIndex,
});

const REACHES: ServiceReach[] = ["global", "national", "regional"];

function ServicesIndex() {
  const [reach, setReach] = useState<ServiceReach | "all">("all");
  const visible = SERVICES.filter((s) => reach === "all" || serviceReach(s).includes(reach));

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="text-[11px] uppercase tracking-[0.22em] text-gold">Services</div>
        <h1 className="mt-1 font-display text-4xl font-semibold md:text-5xl">
          The whole trade desk, rebuilt on Pi.
        </h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Everything a traditional import/export operation relies on — ocean, air, road and
          rail carriage, export and import clearance, national single windows, regional trade
          agreements and corridors, public procurement, the full document set, cargo cover,
          inspection, warehousing and export controls — expressed as contract data, milestones
          and π settlement that is compatible with quantum-financial-system style, asset-backed
          value transfer.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Reach:</span>
          {(["all", ...REACHES] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReach(r)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                reach === r
                  ? "border-gold/60 bg-surface-2 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "all" ? "All services" : REACH_LABELS[r]}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {SERVICE_GROUPS.map((g) => (
            <a
              key={g.key}
              href={`#${g.key}`}
              className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
            >
              {g.label}
            </a>
          ))}
        </div>

        {SERVICE_GROUPS.map((g) => {
          const items = visible.filter((s) => s.group === g.key);
          if (items.length === 0) return null;
          return (
            <section key={g.key} id={g.key} className="mt-14 scroll-mt-24">
              <h2 className="font-display text-2xl font-semibold">{g.label}</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{g.blurb}</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((s) => (
                  <Link
                    key={s.slug}
                    to="/services/$slug"
                    params={{ slug: s.slug }}
                    className="group rounded-2xl border border-border bg-card p-5 shadow-card transition hover:border-gold/50"
                  >
                    <div className="font-display text-base font-semibold group-hover:text-gold">
                      {s.name}
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">{s.tagline}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {serviceReach(s).map((r) => (
                        <span
                          key={r}
                          className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
                        >
                          {REACH_LABELS[r]}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-gold">
                      View service →
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <PiComplianceFooter />
    </div>
  );
}
