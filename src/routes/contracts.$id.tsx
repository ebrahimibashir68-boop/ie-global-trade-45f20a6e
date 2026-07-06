import { createFileRoute, Link, notFound, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { deleteContract, getContract, signContract, updateContract, type Contract, type Party } from "@/lib/contracts-store";
import { createPayment } from "@/lib/pi";
import { loadSession } from "@/lib/pi-session";


export const Route = createFileRoute("/contracts/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Contract ${params.id} · PiTrade smart contract` },
      { name: "description", content: `Trade contract ${params.id} on PiTrade — terms, route, parties and Pi Wallet settlement.` },
      { property: "og:title", content: `PiTrade Contract ${params.id}` },
      { property: "og:description", content: "Import-export smart contract settled in Pi — route, goods, parties and on-chain payment." },
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
    if (!s) {
      alert("Connect your Pi Wallet first.");
      return;
    }
    setPaying(true);
    const res = await createPayment({
      amount: contract.amountPi,
      memo: contract.memo,
      metadata: { contractId: contract.id, title: contract.title },
    });
    setPaying(false);
    if (res.status === "completed") {
      updateContract(contract.id, { status: "funded", paymentTxid: res.txid, paymentId: res.paymentId });
      setTx({ paymentId: res.paymentId, txid: res.txid });
    } else if (res.status === "cancelled") {
      alert("Payment cancelled.");
    } else {
      alert("Payment error: " + (res.message ?? "unknown"));
    }
  };

  const advance = () => {
    const next: Record<Contract["status"], Contract["status"]> = {
      draft: "awaiting_payment",
      awaiting_payment: "funded",
      funded: "in_transit",
      in_transit: "completed",
      completed: "completed",
      cancelled: "cancelled",
    };
    updateContract(contract.id, { status: next[contract.status] });
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
            onClick={() => { deleteContract(contract.id); nav({ to: "/contracts" }); }}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Delete
          </button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* TERMS */}
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

            {(contract.hsCode || contract.deliveryWindow) && (
              <div className="grid gap-4 md:grid-cols-2">
                {contract.hsCode && <Panel title="HS Code"><div className="font-mono text-sm">{contract.hsCode}</div></Panel>}
                {contract.deliveryWindow && <Panel title="Delivery window"><div className="text-sm">{contract.deliveryWindow}</div></Panel>}
              </div>
            )}

            {contract.customsDocs && contract.customsDocs.length > 0 && (
              <Panel title="Required customs documents">
                <ul className="flex flex-wrap gap-2">
                  {contract.customsDocs.map((d) => (
                    <li key={d} className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs text-gold">{d}</li>
                  ))}
                </ul>
              </Panel>
            )}

            {contract.complianceNotes && (
              <Panel title="Compliance & regulatory notes">
                <p className="whitespace-pre-wrap text-sm text-foreground">{contract.complianceNotes}</p>
              </Panel>
            )}

            <SignaturePanel contract={contract} />

            <Panel title="Lifecycle">
              <Timeline status={contract.status} />
              {contract.status !== "completed" && contract.status !== "cancelled" && contract.status !== "awaiting_payment" && (
                <button onClick={advance} className="mt-4 rounded-full border border-gold/40 bg-surface px-4 py-2 text-xs font-medium text-gold hover:bg-gold/10">
                  Advance status →
                </button>
              )}
            </Panel>

          </div>

          {/* PAYMENT SIDEBAR */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-surface to-surface-2 p-5 shadow-card">
              <div className="text-[11px] uppercase tracking-[0.18em] text-gold">Settlement</div>
              <div className="mt-2 font-display text-4xl font-semibold text-gold">π {contract.amountPi.toLocaleString()}</div>
              <div className="mt-1 text-xs text-muted-foreground">Paid directly from Pi Wallet to PiTrade escrow.</div>

              {contract.status === "awaiting_payment" && (
                <button
                  onClick={pay}
                  disabled={paying}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold-grad px-5 py-3 text-sm font-semibold text-primary-foreground shadow-gold disabled:opacity-60"
                >
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

const STEPS: Array<{ k: Contract["status"]; label: string }> = [
  { k: "awaiting_payment", label: "Awaiting payment" },
  { k: "funded", label: "Funded" },
  { k: "in_transit", label: "In transit" },
  { k: "completed", label: "Completed" },
];

function Timeline({ status }: { status: Contract["status"] }) {
  const activeIdx = STEPS.findIndex((s) => s.k === status);
  return (
    <ol className="flex items-center justify-between gap-2">
      {STEPS.map((s, i) => {
        const done = i <= activeIdx;
        return (
          <li key={s.k} className="flex flex-1 flex-col items-center text-center">
            <div className={`grid size-7 place-items-center rounded-full text-[11px] font-semibold ${done ? "bg-gold text-primary-foreground shadow-gold" : "border border-border bg-surface text-muted-foreground"}`}>
              {i + 1}
            </div>
            <div className={`mt-2 text-[10px] uppercase tracking-wider ${done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</div>
            {i < STEPS.length - 1 && <div className={`absolute hidden ${done ? "bg-gold" : "bg-border"}`} />}
          </li>
        );
      })}
    </ol>
  );
}

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
    } finally {
      setBusy(null);
    }
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

