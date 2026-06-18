import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { createContract, type Incoterm } from "@/lib/contracts-store";
import { loadSession } from "@/lib/pi-session";

export const Route = createFileRoute("/contracts/new")({
  head: () => ({
    meta: [
      { title: "Draft a new smart contract · PiTrade" },
      { name: "description", content: "Create a global import-export smart contract priced in Pi." },
    ],
  }),
  component: NewContract,
});

const CATEGORIES = [
  "Agricultural goods","Industrial equipment","Raw materials",
  "Medical supplies","Electronics","Textiles & apparel",
  "Energy & solar","Construction materials","Automotive parts",
  "Chemicals","Food & beverage","Logistics services",
];
const INCOTERMS: Incoterm[] = ["EXW", "FOB", "CIF", "DAP", "DDP"];

function NewContract() {
  const nav = useNavigate();
  const session = typeof window !== "undefined" ? loadSession() : null;

  const [form, setForm] = useState({
    title: "",
    category: CATEGORIES[0],
    goods: "",
    quantity: 1,
    unit: "tonnes",
    originCountry: "",
    destinationCountry: "",
    incoterm: "CIF" as Incoterm,
    buyerUsername: session?.username ?? "",
    sellerUsername: "",
    amountPi: 100,
    memo: "",
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const c = createContract({
      ...form,
      memo: form.memo || `PiTrade ${form.title}`,
    });
    nav({ to: "/contracts/$id", params: { id: c.id } });
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-5 py-10">
        <div className="text-[11px] uppercase tracking-[0.22em] text-gold">New contract</div>
        <h1 className="mt-1 font-display text-3xl font-semibold md:text-4xl">Draft a global trade smart contract</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Fill in the trade terms. The contract is created in "awaiting payment" and settled when the buyer pays in Pi.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-6 rounded-2xl border border-border bg-card p-6 shadow-card">
          <Field label="Contract title">
            <input required value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Arabica Green Coffee — 20ft FCL" className={input} />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Category">
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className={input}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Incoterm 2020">
              <select value={form.incoterm} onChange={(e) => set("incoterm", e.target.value as Incoterm)} className={input}>
                {INCOTERMS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Goods description">
            <textarea required rows={3} value={form.goods} onChange={(e) => set("goods", e.target.value)} placeholder="Specs, grade, packaging…" className={input} />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Quantity">
              <input type="number" min={1} required value={form.quantity} onChange={(e) => set("quantity", Number(e.target.value))} className={input} />
            </Field>
            <Field label="Unit">
              <input required value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="tonnes / units / boxes" className={input} />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Origin country">
              <input required value={form.originCountry} onChange={(e) => set("originCountry", e.target.value)} placeholder="e.g. Vietnam" className={input} />
            </Field>
            <Field label="Destination country">
              <input required value={form.destinationCountry} onChange={(e) => set("destinationCountry", e.target.value)} placeholder="e.g. Germany" className={input} />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Buyer Pi username">
              <input required value={form.buyerUsername} onChange={(e) => set("buyerUsername", e.target.value)} placeholder="pioneer_buyer" className={input} />
            </Field>
            <Field label="Seller Pi username">
              <input required value={form.sellerUsername} onChange={(e) => set("sellerUsername", e.target.value)} placeholder="pioneer_seller" className={input} />
            </Field>
          </div>

          <Field label="Settlement amount (π)">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-display text-lg text-gold">π</span>
              <input type="number" min={0} step="0.01" required value={form.amountPi} onChange={(e) => set("amountPi", Number(e.target.value))} className={`${input} pl-9`} />
            </div>
          </Field>

          <Field label="Payment memo (optional)">
            <input value={form.memo} onChange={(e) => set("memo", e.target.value)} placeholder="Visible to buyer on the Pi payment sheet" className={input} />
          </Field>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
            <button type="button" onClick={() => nav({ to: "/contracts" })} className="rounded-full px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button type="submit" className="rounded-full bg-gold-grad px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold">
              Create contract
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const input = "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}
