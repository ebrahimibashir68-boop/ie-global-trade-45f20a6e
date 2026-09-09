import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { PiComplianceFooter } from "@/components/PiComplianceFooter";
import { getService, SERVICE_GROUPS, SERVICES } from "@/lib/trade/services";

export const Route = createFileRoute("/services/$slug")({
  loader: ({ params }) => {
    const service = getService(params.slug);
    if (!service) throw notFound();
    return service;
  },
  head: ({ loaderData }) => {
    const s = loaderData;
    const url = `https://ie-global-trade.lovable.app/services/${s?.slug ?? ""}`;
    return {
      meta: [
        { title: s ? `${s.name} · PiTrade trade services` : "Trade service · PiTrade" },
        { name: "description", content: s ? `${s.tagline} ${s.onPiTrade}`.slice(0, 155) : "Import and export services settled on the Pi Network." },
        { property: "og:title", content: s ? `${s.name} — PiTrade` : "PiTrade service" },
        { property: "og:description", content: s?.tagline ?? "Import and export services on Pi." },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: s ? `${s.name} — PiTrade` : "PiTrade service" },
        { name: "twitter:description", content: s?.tagline ?? "Import and export services on Pi." },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  errorComponent: () => <Fallback title="This service could not be loaded." />,
  notFoundComponent: () => <Fallback title="We don't offer that service page." />,
  component: ServiceDetail,
});

function Fallback({ title }: { title: string }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-5 py-24 text-center">
        <h1 className="font-display text-3xl font-semibold">{title}</h1>
        <Link to="/services" className="mt-4 inline-block text-sm text-gold hover:underline">
          Back to all services
        </Link>
      </div>
    </div>
  );
}

function Panel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="text-[11px] uppercase tracking-[0.18em] text-gold">{title}</div>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {items.map((i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-gold" />
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ServiceDetail() {
  const s = Route.useLoaderData();
  const group = SERVICE_GROUPS.find((g) => g.key === s.group);
  const related = SERVICES.filter((r) => r.group === s.group && r.slug !== s.slug).slice(0, 3);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-5 py-12">
        <Link to="/services" className="text-xs text-muted-foreground hover:text-foreground">
          ← All services
        </Link>
        <div className="mt-4 text-[11px] uppercase tracking-[0.22em] text-gold">
          {group?.label}
          {s.mode ? ` · ${s.mode}` : ""}
        </div>
        <h1 className="mt-1 font-display text-4xl font-semibold md:text-5xl">{s.name}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{s.tagline}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface-2 p-5">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              In the traditional system
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{s.traditional}</p>
          </div>
          <div className="rounded-2xl border border-gold/40 bg-card p-5 shadow-card">
            <div className="text-[11px] uppercase tracking-[0.18em] text-gold">On PiTrade</div>
            <p className="mt-2 text-sm">{s.onPiTrade}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Panel title="Scope of work" items={s.covers} />
          <div className="space-y-4">
            <Panel title="Documents" items={s.documents} />
            <Panel title="Rules & conventions" items={s.standards} />
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="text-[11px] uppercase tracking-[0.18em] text-gold">Charging basis</div>
              <p className="mt-2 text-sm text-muted-foreground">{s.charging}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/contracts/new"
            className="rounded-full bg-gold-grad px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold"
          >
            Start a contract with this service
          </Link>
          <Link
            to="/how-it-works"
            className="rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            How settlement works
          </Link>
        </div>

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-xl font-semibold">Related services</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to="/services/$slug"
                  params={{ slug: r.slug }}
                  className="rounded-2xl border border-border bg-card p-4 text-sm shadow-card transition hover:border-gold/50"
                >
                  <div className="font-medium">{r.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{r.tagline}</div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
      <PiComplianceFooter />
    </div>
  );
}
