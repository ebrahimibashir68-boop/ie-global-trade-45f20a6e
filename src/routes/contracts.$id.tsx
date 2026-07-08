import { createFileRoute, Link, notFound, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import {
  completeMilestone,
  deleteContract,
  getContract,
  releasedPct,
  signContract,
  updateContract,
  type Contract,
  type Intermediary,
  type Milestone,
  type Party,
} from "@/lib/contracts-store";
import { createPayment } from "@/lib/pi";
import { loadSession } from "@/lib/pi-session";
import { openTradeDoc, type TradeDocKind } from "@/lib/trade-docs";


export const Route = createFileRoute("/contracts/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Contract ${params.id} · PiTrade smart contract` },
      { name: "description", content: `Trade contract ${params.id} on PiTrade — terms, route, parties, shipping, customs docs and Pi Wallet settlement.` },
      { property: "og:title", content: `PiTrade Contract ${params.id}` },
      { property: "og:description", content: "Import-export smart contract settled in Pi — route, goods, parties, shipping and on-chain payment." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: `https://ie-global-trade.lovable.app/contracts/${params.id}` },
    ],
    links: [{ rel: "canonical", href: `https://ie-global-trade.lovable.app/contracts/${params.id}` }],
  }),
  component: ContractDetail,
  notFoundComponent: () => (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="font-display text-3xl">Contract not found</h1>
        <Link to="/contracts" className="mt-4 inline-block text-gold underline">Back to marketplace</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-5 py-20 text-center">
          <h1 className="font-display text-2xl">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
          <button onClick={() => { router.invalidate(); reset(); }} className="mt-4 rounded-full bg-gold px-5 py-2 text-sm text-primary-foreground">Try again</button>
        </div>
      </div>
    );
  },
});

function ContractDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const [contract, setContract] = useState<Contract | undefined>(undefined);
  const [paying, setPaying] = useState(false);
  const [tx, setTx] = useState<{ paymentId: string; txid: string } | null>(null);

  useEffect(() => {
    const refresh = () => setContract(getContract(id));
    refresh();
    window.addEventListener("contracts:changed", refresh);
    return () => window.removeEventListener("contracts:changed", refresh);
  }, [id]);

  if (contract === undefined) {
    return <div className="min-h-screen"><SiteHeader /><div className="p-10 text-center text-muted-foreground">Loading…</div></div>;
  }
  if (!contract) throw notFound();

  const pay = async () => {
    const s = loadSession();
    if (!s) { alert("Connect your Pi Wallet first."); return; }
    setPaying(true);
    const res = await createPayment({
      amount: contract.amountPi, memo: contract.memo,
      metadata: { contractId: contract.id, title: contract.title },
    });
    setPaying(false);
    if (res.status === "completed") {
      updateContract(contract.id, { status: "funded", paymentTxid: res.txid, paymentId: res.paymentId });
      setTx({ paymentId: res.paymentId, txid: res.txid });
    } else if (res.status === "cancelled") alert("Payment cancelled.");
    else alert("Payment error: " + (res.message ?? "unknown"));
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-5 py-10">
        <Link to="/contracts" className="text-xs text-muted-foreground hover:text-gold">← Marketplace</Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-gold">{contract.category}</div>
            <h1 className="mt-1 max-w-2xl font-display text-3xl font-semibold md:text-4xl">{contract.title}</h1>
            <div className="mt-2 font-mono text-xs text-muted-foreground">{contract.id}</div>
          </div>
          <button
            onClick={() => { if (confirm("Delete this contract?")) { deleteContract(contract.id); nav({ to: "/contracts" }); } }}
            className="text-xs text-muted-foreground hover:text-destructive"
          >Delete</button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Panel title="Trade route">
              <div className="flex items-center justify-between gap-4 text-foreground">
                <div className="text-xl font-semibold">{contract.originCountry}</div>
                <div className="flex flex-1 items-center gap-2 text-gold">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
                  <span className="rounded-md bg-surface-2 px-2 py-0.5 font-mono text-xs">{contract.incoterm}</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
                </div>
                <div className="text-xl font-semibold">{contract.destinationCountry}</div>
              </div>
            </Panel>

            <Panel title="Goods & quantity">
              <p className="text-sm text-foreground">{contract.goods}</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-surface-2 px-3 py-1.5 text-sm">
                <span className="font-display text-gold">{contract.quantity.toLocaleString()}</span>
                <span className="text-muted-foreground">{contract.unit}</span>
              </div>
            </Panel>

            <div className="grid gap-4 md:grid-cols-2">
              <PartyPanel role="Buyer (Importer)" party={contract.buyer} fallbackUser={contract.buyerUsername} countryFallback={contract.destinationCountry} />
              <PartyPanel role="Seller (Exporter)" party={contract.seller} fallbackUser={contract.sellerUsername} countryFallback={contract.originCountry} />
            </div>

            {(contract.hsCode || contract.deliveryWindow || contract.currency) && (
              <div className="grid gap-4 md:grid-cols-3">
                {contract.hsCode && <Panel title="HS Code"><div className="font-mono text-sm">{contract.hsCode}</div></Panel>}
                {contract.deliveryWindow && <Panel title="Delivery window"><div className="text-sm">{contract.deliveryWindow}</div></Panel>}
                {contract.currency && contract.fiatEquivalent ? (
                  <Panel title="Reference value"><div className="text-sm">{contract.currency} {contract.fiatEquivalent.toLocaleString()}</div></Panel>
                ) : null}
              </div>
            )}

            {contract.shipping && <ShippingPanel c={contract} />}
            {contract.insurance && <InsurancePanel c={contract} />}
            {contract.intermediaries && contract.intermediaries.length > 0 && <IntermediariesPanel items={contract.intermediaries} />}

            {contract.customsDocs && contract.customsDocs.length > 0 && (
              <Panel title="Required customs documents">
                <ul className="flex flex-wrap gap-2">
                  {contract.customsDocs.map((d) => (
                    <li key={d} className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs text-gold">{d}</li>
                  ))}
                </ul>
              </Panel>
            )}

            <DocsPanel c={contract} />

            {contract.complianceNotes && (
              <Panel title="Compliance & regulatory notes">
                <p className="whitespace-pre-wrap text-sm text-foreground">{contract.complianceNotes}</p>
              </Panel>
            )}

            <SignaturePanel contract={contract} />
            <MilestonesPanel c={contract} />
          </div>

          {/* PAYMENT SIDEBAR */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-surface to-surface-2 p-5 shadow-card">
              <div className="text-[11px] uppercase tracking-[0.18em] text-gold">Settlement</div>
              <div className="mt-2 font-display text-4xl font-semibold text-gold">π {contract.amountPi.toLocaleString()}</div>
              <div className="mt-1 text-xs text-muted-foreground">Paid from Pi Wallet into PiTrade escrow.</div>

              {contract.status !== "awaiting_payment" && (
                <EscrowMeter c={contract} />
              )}

              {contract.status === "awaiting_payment" && (
                <button onClick={pay} disabled={paying}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold-grad px-5 py-3 text-sm font-semibold text-primary-foreground shadow-gold disabled:opacity-60">
                  {paying ? "Opening Pi Wallet…" : "Pay with Pi Wallet"}
                </button>
              )}

              {contract.status !== "awaiting_payment" && contract.paymentTxid && (
                <div className="mt-5 space-y-2 rounded-xl bg-surface-2 p-3 text-xs">
                  <Row k="Status" v="Funded" />
                  <Row k="Tx id" v={<span className="font-mono">{contract.paymentTxid.slice(0,18)}…</span>} />
                  {contract.paymentId && <Row k="Payment id" v={<span className="font-mono">{contract.paymentId.slice(0,18)}…</span>} />}
                </div>
              )}

              {tx && (
                <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                  Payment captured. Contract funded.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 text-xs text-muted-foreground">
              <div className="font-semibold text-foreground">Memo on Pi sheet</div>
              <div className="mt-1">{contract.memo}</div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- panels --------------------------------- */

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-foreground">{v}</span>
    </div>
  );
}

function KV({ k, v }: { k: string; v?: React.ReactNode }) {
  if (v === undefined || v === null || v === "") return null;
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{k}</div>
      <div className="mt-0.5 text-sm text-foreground">{v}</div>
    </div>
  );
}

function ShippingPanel({ c }: { c: Contract }) {
  const s = c.shipping!;
  return (
    <Panel title={`Shipping · ${s.mode.toUpperCase()}`}>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <KV k="Carrier" v={s.carrier} />
        <KV k="Vessel / Flight" v={s.vesselOrFlight} />
        <KV k="Container no." v={s.containerNo ? <span className="font-mono">{s.containerNo}</span> : undefined} />
        <KV k="B/L or AWB" v={s.bolAwbNo ? <span className="font-mono">{s.bolAwbNo}</span> : undefined} />
        <KV k="Port of loading" v={s.portOfLoading} />
        <KV k="Port of discharge" v={s.portOfDischarge} />
        <KV k="ETD" v={s.etd} />
        <KV k="ETA" v={s.eta} />
        <KV k="Packages" v={s.packageCount?.toLocaleString()} />
        <KV k="Gross wt" v={s.grossWeightKg ? `${s.grossWeightKg.toLocaleString()} kg` : undefined} />
        <KV k="Net wt" v={s.netWeightKg ? `${s.netWeightKg.toLocaleString()} kg` : undefined} />
        <KV k="Volume" v={s.volumeM3 ? `${s.volumeM3} m³` : undefined} />
      </div>
      {s.trackingUrl && (
        <a href={s.trackingUrl} target="_blank" rel="noreferrer noopener"
           className="mt-4 inline-flex items-center gap-1 rounded-full border border-gold/40 bg-surface px-3 py-1.5 text-xs text-gold hover:bg-gold/10">
          Track shipment ↗
        </a>
      )}
    </Panel>
  );
}

function InsurancePanel({ c }: { c: Contract }) {
  const i = c.insurance!;
  return (
    <Panel title="Cargo insurance">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <KV k="Insurer" v={i.insurer} />
        <KV k="Policy no." v={i.policyNo ? <span className="font-mono">{i.policyNo}</span> : undefined} />
        <KV k="Coverage" v={i.coveragePi ? `π ${i.coveragePi.toLocaleString()}` : undefined} />
        <KV k="Clauses" v={i.clauses} />
      </div>
    </Panel>
  );
}

const IM_LABEL: Record<Intermediary["role"], string> = {
  forwarder: "Freight forwarder",
  broker: "Customs broker",
  inspector: "Inspection agent",
};

function IntermediariesPanel({ items }: { items: Intermediary[] }) {
  return (
    <Panel title="Intermediaries">
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((im, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-gold">{IM_LABEL[im.role]}</div>
            <div className="mt-1 text-sm font-semibold text-foreground">{im.name}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {im.countryCode && <span>{im.countryCode}</span>}
              {im.licenseNo && <span> · Lic. <span className="font-mono">{im.licenseNo}</span></span>}
            </div>
            {im.contact && <div className="mt-1 text-xs text-muted-foreground">{im.contact}</div>}
          </div>
        ))}
      </div>
    </Panel>
  );
}

const DOC_BUTTONS: { kind: TradeDocKind; label: string }[] = [
  { kind: "commercial_invoice", label: "Commercial Invoice" },
  { kind: "packing_list", label: "Packing List" },
  { kind: "certificate_of_origin", label: "Certificate of Origin" },
  { kind: "bill_of_lading", label: "Bill of Lading (proforma)" },
  { kind: "insurance_certificate", label: "Insurance Certificate" },
];

function DocsPanel({ c }: { c: Contract }) {
  return (
    <Panel title="Generate trade documents">
      <p className="text-xs text-muted-foreground">
        Print-ready documents populated from this contract. Open, review, then use your browser's <em>Save as PDF</em>.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {DOC_BUTTONS.map((d) => (
          <button key={d.kind} onClick={() => openTradeDoc(d.kind, c)}
            className="rounded-full border border-gold/40 bg-surface px-3 py-1.5 text-xs text-gold hover:bg-gold/10">
            📄 {d.label}
          </button>
        ))}
      </div>
    </Panel>
  );
}

function EscrowMeter({ c }: { c: Contract }) {
  const pct = releasedPct(c);
  const releasedPi = Math.round((c.amountPi * pct) / 100);
  return (
    <div className="mt-5 rounded-xl bg-surface-2 p-3">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <span>Escrow released</span>
        <span className="text-gold">{pct}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
        <div className="h-full bg-gold transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 text-xs text-foreground">π {releasedPi.toLocaleString()} released of π {c.amountPi.toLocaleString()}</div>
    </div>
  );
}

function MilestonesPanel({ c }: { c: Contract }) {
  const session = typeof window !== "undefined" ? loadSession() : null;
  const me = session?.username ?? "";
  const canAct = me === c.buyerUsername || me === c.sellerUsername;
  const [busy, setBusy] = useState<string | null>(null);

  const ms = c.milestones ?? [];

  const mark = async (m: Milestone) => {
    if (!canAct) { alert("Connect as buyer or seller to mark milestones."); return; }
    if (!confirm(`Mark "${m.label}" as complete? This releases ${m.releasePct}% of escrow to the seller.`)) return;
    try {
      setBusy(m.key);
      completeMilestone(c.id, m.key, me);
    } finally { setBusy(null); }
  };

  return (
    <Panel title="Escrow milestones (LC-style release)">
      <ol className="space-y-3">
        {ms.map((m, i) => {
          const done = !!m.completedAt;
          return (
            <li key={m.key} className={`flex items-start gap-3 rounded-xl border p-3 ${done ? "border-emerald-500/40 bg-emerald-500/5" : "border-border bg-surface"}`}>
              <div className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${done ? "bg-emerald-500 text-white" : "border border-border text-muted-foreground"}`}>
                {done ? "✓" : i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="text-sm font-semibold text-foreground">{m.label}</div>
                  <div className="text-[11px] font-mono text-gold">releases {m.releasePct}%</div>
                </div>
                {m.requiredDocs && m.requiredDocs.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {m.requiredDocs.map((d) => (
                      <span key={d} className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground">📄 {d}</span>
                    ))}
                  </div>
                )}
                {done ? (
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Completed {new Date(m.completedAt!).toLocaleString()}{m.completedBy ? ` · by ${m.completedBy}` : ""}
                  </div>
                ) : (
                  <button onClick={() => mark(m)} disabled={busy === m.key || !canAct}
                    className="mt-2 rounded-full bg-gold-grad px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-gold disabled:opacity-40">
                    {busy === m.key ? "…" : "Mark complete & release"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

/* -------------------------- signatures / parties -------------------------- */

const PARTY_LABEL: Record<Party["type"], string> = {
  individual: "Individual",
  company: "Company",
  institution: "Institution",
  country: "Country / Gov agency",
};

function PartyPanel({ role, party, fallbackUser, countryFallback }: { role: string; party?: Party; fallbackUser: string; countryFallback: string }) {
  return (
    <Panel title={role}>
      {party ? (
        <div className="space-y-1.5 text-sm">
          <div className="font-semibold text-foreground">{party.legalName || `@${fallbackUser}`}</div>
          <div className="text-xs text-muted-foreground">
            <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gold">{PARTY_LABEL[party.type]}</span>
            <span className="ml-2">{party.countryCode || countryFallback}</span>
          </div>
          <div className="text-xs text-muted-foreground">Pi: <span className="font-mono text-foreground">@{party.piUsername}</span></div>
          {party.registrationNo && <div className="text-xs text-muted-foreground">Reg / ID: <span className="font-mono text-foreground">{party.registrationNo}</span></div>}
          {party.address && <div className="text-xs text-muted-foreground">{party.address}</div>}
        </div>
      ) : (
        <div className="text-sm">@{fallbackUser}</div>
      )}
    </Panel>
  );
}

function SignaturePanel({ contract }: { contract: Contract }) {
  const sigs = contract.signatures ?? [];
  const buyerSig = sigs.find((s) => s.role === "buyer");
  const sellerSig = sigs.find((s) => s.role === "seller");
  const session = typeof window !== "undefined" ? loadSession() : null;
  const myUser = session?.username;

  const canSignAsBuyer = !buyerSig && myUser && myUser === contract.buyerUsername;
  const canSignAsSeller = !sellerSig && myUser && myUser === contract.sellerUsername;
  const [busy, setBusy] = useState<null | "buyer" | "seller">(null);

  const sign = async (role: "buyer" | "seller") => {
    const partyName = role === "buyer" ? contract.buyer?.legalName : contract.seller?.legalName;
    const name = partyName || myUser || "";
    const confirmed = confirm(
      `Sign this contract as ${role.toUpperCase()} on behalf of "${name}"?\n\nThis creates a cryptographic signature (SHA-256) of the contract terms bound to your Pi identity.`,
    );
    if (!confirmed) return;
    try {
      setBusy(role);
      await signContract(contract.id, role, name);
    } catch (e) {
      alert((e as Error).message);
    } finally { setBusy(null); }
  };

  return (
    <Panel title="Signatures & registration">
      <div className="grid gap-3 md:grid-cols-2">
        {(["buyer", "seller"] as const).map((role) => {
          const sig = role === "buyer" ? buyerSig : sellerSig;
          const canSign = role === "buyer" ? canSignAsBuyer : canSignAsSeller;
          const expectedUser = role === "buyer" ? contract.buyerUsername : contract.sellerUsername;
          return (
            <div key={role} className={`rounded-xl border p-3 ${sig ? "border-emerald-500/40 bg-emerald-500/5" : "border-border bg-surface"}`}>
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{role}</div>
                {sig ? (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">SIGNED</span>
                ) : (
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted-foreground">Pending</span>
                )}
              </div>
              {sig ? (
                <div className="mt-2 space-y-1 text-xs">
                  <div className="font-semibold text-foreground">{sig.signerName}</div>
                  <div className="text-muted-foreground">{new Date(sig.signedAt).toLocaleString()}</div>
                  <div className="truncate font-mono text-[10px] text-gold" title={sig.hash}>0x{sig.hash.slice(0, 24)}…</div>
                </div>
              ) : (
                <button
                  onClick={() => sign(role)}
                  disabled={!canSign || busy === role}
                  className="mt-3 w-full rounded-full bg-gold-grad px-4 py-2 text-xs font-semibold text-primary-foreground shadow-gold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy === role ? "Signing…" : canSign ? `Sign as ${role}` : `Connect as @${expectedUser} to sign`}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {contract.registeredAt && (
        <div className="mt-4 rounded-lg border border-gold/30 bg-gold/10 p-3 text-xs text-gold">
          ✓ Fully signed & registered on {new Date(contract.registeredAt).toLocaleString()} — this contract is now legally binding between both parties.
        </div>
      )}
    </Panel>
  );
}
