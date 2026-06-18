import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works · PiTrade" },
      { name: "description", content: "How global import-export smart contracts execute on the Pi Network with direct user-to-app payments." },
    ],
  }),
  component: HowItWorks,
});

const STEPS = [
  { n: "01", t: "Connect Pi Wallet", d: "Open the app in the Pi Browser. The Pi SDK authenticates the user with the `username` and `payments` scopes." },
  { n: "02", t: "Draft the contract", d: "Buyer or broker fills in goods, quantity, Incoterm 2020 (EXW/FOB/CIF/DAP/DDP), origin & destination, and the seller's Pi username." },
  { n: "03", t: "Buyer signs & pays in π", d: "PiTrade calls `Pi.createPayment` for a User-to-App payment. The Pi Wallet sheet opens with amount, memo and metadata{contractId}." },
  { n: "04", t: "Server approval", d: "Our backend receives onReadyForServerApproval(paymentId) and calls /payments/{id}/approve on the Pi Platform API to authorise the move." },
  { n: "05", t: "Server completion", d: "On onReadyForServerCompletion(paymentId, txid) we call /payments/{id}/complete with the txid, marking the contract Funded." },
  { n: "06", t: "Lifecycle to delivery", d: "Status moves Funded → In transit → Completed as the consignment ships and lands. All transitions are recorded on-chain via the txid." },
];

function HowItWorks() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-5 py-12">
        <div className="text-[11px] uppercase tracking-[0.22em] text-gold">Protocol</div>
        <h1 className="mt-1 font-display text-4xl font-semibold md:text-5xl">How PiTrade executes a global trade.</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Every contract is a deterministic 6-step flow on top of the Pi Network's
          payments primitives. Direct user-to-app payments, transparent metadata,
          on-chain settlement.
        </p>

        <ol className="mt-12 space-y-4">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-5 rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="font-display text-3xl font-semibold text-gold">{s.n}</div>
              <div>
                <div className="font-semibold text-foreground">{s.t}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.d}</div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-12 rounded-2xl border border-gold/30 bg-surface p-6">
          <h2 className="font-display text-xl">Production setup</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This MVP runs the Pi SDK client-side and stores contracts locally. To go
            live: (1) register the app at <span className="text-gold">develop.pi</span>, (2) host an HTTPS endpoint
            that calls the Pi Platform API for /approve and /complete using your
            server-side API key, (3) wire the txid back into the contract record.
          </p>
        </div>
      </div>
    </div>
  );
}
