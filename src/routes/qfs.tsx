import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { PiComplianceFooter } from "@/components/PiComplianceFooter";

export const Route = createFileRoute("/qfs")({
  head: () => ({
    meta: [
      { title: "QFS-compatible settlement · PiTrade" },
      { name: "description", content: "How PiTrade settles global, national and regional trade on the Pi blockchain with quantum-financial-system compatible principles: asset-backed value, one-hop finality, structured ISO 20022 style remittance data and an immutable audit trail." },
      { property: "og:title", content: "QFS-compatible trade settlement on Pi" },
      { property: "og:description", content: "Asset-backed, one-hop, fully traceable settlement for import and export contracts — no correspondent banking chain." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://ie-global-trade.lovable.app/qfs" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "QFS-compatible trade settlement on Pi" },
      { name: "twitter:description", content: "One-hop π settlement bound to every trade document and milestone." },
    ],
    links: [{ rel: "canonical", href: "https://ie-global-trade.lovable.app/qfs" }],
  }),
  component: QfsPage,
});

const PRINCIPLES: { title: string; body: string }[] = [
  {
    title: "Asset-backed, ledger-native value",
    body: "Settlement moves π on the Pi blockchain rather than book entries between banks. The unit that leaves the buyer is the unit that arrives with the seller — no nostro chain, no intermediary balance sheet in between.",
  },
  {
    title: "One hop, final in seconds",
    body: "A cross-border payment is a single transaction confirmed by network consensus. There is no cut-off time, no weekend, and no three-day float where neither party knows where the money is.",
  },
  {
    title: "Structured data travels with the money",
    body: "Each payment carries the contract reference, invoice number and milestone in ISO 20022 style structured fields, so the receiving side reconciles automatically instead of guessing which credit belongs to which shipment.",
  },
  {
    title: "Payment against documents",
    body: "Value is released only when the milestone's required documents exist and are hashed to the contract — the digital equivalent of a documentary credit, without the bank fee or the discrepancy cycle.",
  },
  {
    title: "Immutable, auditable trail",
    body: "Every signature, document, screening, milestone and transaction is time-stamped and hashed. An auditor, a ministry or a donor can verify the whole life of a contract without trusting either party's filing cabinet.",
  },
  {
    title: "Open to every kind of party",
    body: "Individuals, companies, institutions, agencies and governments use the same rail and the same contract. Access needs a Pi wallet and an internet connection — not a correspondent banking relationship.",
  },
];

const LAYERS: { label: string; body: string }[] = [
  { label: "Identity", body: "Pi Network sign-in plus organisation records carrying legal name, entity type, registration, tax and trader identification." },
  { label: "Contract", body: "Incoterms 2020 terms, goods, HS classification, routing, quantities, insurance and the milestone schedule that gates release." },
  { label: "Compliance", body: "Sanctions and denied-party screening, export-control and restricted-goods checks, national conformity and preferential-origin rules." },
  { label: "Documents", body: "UN/CEFACT document set issued and SHA-256 hashed: invoice, packing list, origin, transport documents, certificates and declarations." },
  { label: "Settlement", body: "π escrow funding, milestone release, payouts and fees, each written to an immutable ledger with the payment identifier and transaction hash." },
];

function QfsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-5 py-12">
        <div className="text-[11px] uppercase tracking-[0.22em] text-gold">Settlement</div>
        <h1 className="mt-1 font-display text-4xl font-semibold md:text-5xl">
          QFS-compatible settlement, running on Pi.
        </h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          A quantum financial system is described as asset-backed, instantly final, fully
          traceable and reachable by anyone rather than by banks alone. PiTrade builds trade on
          exactly those properties today: contracts, documents and compliance on one record, and
          value settled in π on the Pi blockchain. Global, national and regional services all run
          on the same rail.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="font-display text-base font-semibold">{p.title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-14 font-display text-2xl font-semibold">The five layers of a trade</h2>
        <div className="mt-5 space-y-3">
          {LAYERS.map((l, i) => (
            <div key={l.label} className="flex gap-4 rounded-2xl border border-border bg-surface-2 p-5">
              <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-gold-grad font-display text-sm font-bold text-primary-foreground">
                {i + 1}
              </div>
              <div>
                <div className="font-display text-base font-semibold">{l.label}</div>
                <p className="mt-1 text-sm text-muted-foreground">{l.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-gold/40 bg-card p-6 shadow-card">
          <div className="font-display text-lg font-semibold">Traditional rail vs. PiTrade</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Correspondent banking</div>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                <li>Two to five days, cut-offs and holidays</li>
                <li>Several intermediaries, each taking a fee and a spread</li>
                <li>Documents chased by courier and email</li>
                <li>Reconciliation by hand, weeks after the fact</li>
                <li>Access depends on a banking relationship</li>
              </ul>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-gold">PiTrade on Pi</div>
              <ul className="mt-2 space-y-1.5 text-sm">
                <li>Seconds to finality, any hour of any day</li>
                <li>One hop, network fee only</li>
                <li>Documents issued and hashed on the contract</li>
                <li>Reconciled the moment the payment confirms</li>
                <li>Access needs a Pi wallet, nothing more</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/contracts/new"
            className="rounded-full bg-gold-grad px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold"
          >
            Start a contract
          </Link>
          <Link
            to="/services"
            className="rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            Browse all services
          </Link>
        </div>
      </div>
      <PiComplianceFooter />
    </div>
  );
}
