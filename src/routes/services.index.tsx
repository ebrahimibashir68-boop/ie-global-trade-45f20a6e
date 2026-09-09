import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { PiComplianceFooter } from "@/components/PiComplianceFooter";
import { SERVICE_GROUPS, SERVICES } from "@/lib/trade/services";

export const Route = createFileRoute("/services/")({
  head: () => ({
    meta: [
      { title: "Trade services · Freight, customs, finance on Pi" },
      { name: "description", content: "Every traditional import-export service — sea, air, road and rail freight, customs clearance, documents, cargo insurance, inspection, warehousing and licensing — delivered on PiTrade's Pi-settled smart contracts." },
      { property: "og:title", content: "PiTrade services — the full import/export desk" },
      { property: "og:description", content: "Sea, air, road and rail freight, customs, trade documents, escrow in π, insurance, inspection, warehousing and export controls." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ie-global-trade.lovable.app/services" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "PiTrade services — the full import/export desk" },
      { name: "twitter:description", content: "Freight, customs, documents, finance, insurance, warehousing and compliance — settled in π." },
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

function ServicesIndex() {
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
          rail carriage, export and import clearance, the full document set, documentary
          credit logic, cargo cover, inspection, warehousing and export controls — expressed
          as contract data, milestones and π settlement.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
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
          const items = SERVICES.filter((s) => s.group === g.key);
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
