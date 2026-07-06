import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { createContract, type Incoterm, type PartyType } from "@/lib/contracts-store";
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
const PARTY_TYPES: { v: PartyType; label: string }[] = [
  { v: "individual", label: "Individual" },
  { v: "company", label: "Company" },
  { v: "institution", label: "Institution" },
  { v: "country", label: "Country / Gov agency" },
];
const CUSTOMS_DOC_OPTIONS = [
  "Commercial Invoice",
  "Packing List",
  "Certificate of Origin",
  "Bill of Lading / Airway Bill",
  "Insurance Certificate",
  "Import / Export License",
  "Phytosanitary / Health Certificate",
  "Inspection Certificate",
];

function NewContract() {
  const nav = useNavigate();
  const session = typeof window !== "undefined" ? loadSession() : null;

  const [form, setForm] = useState({
    title: "",
    category: CATEGORIES[0],
    goods: "",
    hsCode: "",
    quantity: 1,
    unit: "tonnes",
    originCountry: "",
    destinationCountry: "",
    incoterm: "CIF" as Incoterm,
    buyerUsername: session?.username ?? "",
    sellerUsername: "",
    amountPi: 100,
    memo: "",
    deliveryWindow: "30-45 days from funding",
    complianceNotes: "",
    // Buyer party
    buyerType: "company" as PartyType,
    buyerLegalName: "",
    buyerCountryCode: "",
    buyerRegNo: "",
    buyerAddress: "",
    // Seller party
    sellerType: "company" as PartyType,
    sellerLegalName: "",
    sellerCountryCode: "",
    sellerRegNo: "",
    sellerAddress: "",
  });
  const [customsDocs, setCustomsDocs] = useState<string[]>([
    "Commercial Invoice", "Packing List", "Certificate of Origin", "Bill of Lading / Airway Bill",
  ]);
  const toggleDoc = (d: string) =>
    setCustomsDocs((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));


  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const c = createContract({
      title: form.title,
      category: form.category,
      goods: form.goods,
      hsCode: form.hsCode || undefined,
      quantity: form.quantity,
      unit: form.unit,
      originCountry: form.originCountry,
      destinationCountry: form.destinationCountry,
      incoterm: form.incoterm,
      buyerUsername: form.buyerUsername,
      sellerUsername: form.sellerUsername,
      amountPi: form.amountPi,
      memo: form.memo || `PiTrade ${form.title}`,
      deliveryWindow: form.deliveryWindow || undefined,
      complianceNotes: form.complianceNotes || undefined,
      customsDocs,
      buyer: {
        type: form.buyerType,
        legalName: form.buyerLegalName,
        piUsername: form.buyerUsername,
        countryCode: form.buyerCountryCode || form.destinationCountry,
        registrationNo: form.buyerRegNo || undefined,
        address: form.buyerAddress || undefined,
      },
      seller: {
        type: form.sellerType,
        legalName: form.sellerLegalName,
        piUsername: form.sellerUsername,
        countryCode: form.sellerCountryCode || form.originCountry,
        registrationNo: form.sellerRegNo || undefined,
        address: form.sellerAddress || undefined,
      },
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

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="HS Code (Harmonized System)">
              <input value={form.hsCode} onChange={(e) => set("hsCode", e.target.value)} placeholder="e.g. 0901.11" className={input} />
            </Field>
            <Field label="Delivery window">
              <input value={form.deliveryWindow} onChange={(e) => set("deliveryWindow", e.target.value)} placeholder="e.g. 30-45 days from funding" className={input} />
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

          {/* PARTIES */}
          <fieldset className="rounded-xl border border-border/70 bg-surface p-4">
            <legend className="px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Buyer (Importer)</legend>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Party type">
                <select value={form.buyerType} onChange={(e) => set("buyerType", e.target.value as PartyType)} className={input}>
                  {PARTY_TYPES.map((p) => <option key={p.v} value={p.v}>{p.label}</option>)}
                </select>
              </Field>
              <Field label="Legal name">
                <input required value={form.buyerLegalName} onChange={(e) => set("buyerLegalName", e.target.value)} placeholder="Full legal name" className={input} />
              </Field>
              <Field label="Registration / ID number">
                <input value={form.buyerRegNo} onChange={(e) => set("buyerRegNo", e.target.value)} placeholder="Company reg / Tax ID / Passport" className={input} />
              </Field>
              <Field label="Country code">
                <input value={form.buyerCountryCode} onChange={(e) => set("buyerCountryCode", e.target.value)} placeholder="e.g. DE" className={input} />
              </Field>
            </div>
            <Field label="Address">
              <input value={form.buyerAddress} onChange={(e) => set("buyerAddress", e.target.value)} placeholder="Registered address" className={input} />
            </Field>
          </fieldset>

          <fieldset className="rounded-xl border border-border/70 bg-surface p-4">
            <legend className="px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Seller (Exporter)</legend>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Party type">
                <select value={form.sellerType} onChange={(e) => set("sellerType", e.target.value as PartyType)} className={input}>
                  {PARTY_TYPES.map((p) => <option key={p.v} value={p.v}>{p.label}</option>)}
                </select>
              </Field>
              <Field label="Legal name">
                <input required value={form.sellerLegalName} onChange={(e) => set("sellerLegalName", e.target.value)} placeholder="Full legal name" className={input} />
              </Field>
              <Field label="Registration / ID number">
                <input value={form.sellerRegNo} onChange={(e) => set("sellerRegNo", e.target.value)} placeholder="Company reg / Tax ID / Passport" className={input} />
              </Field>
              <Field label="Country code">
                <input value={form.sellerCountryCode} onChange={(e) => set("sellerCountryCode", e.target.value)} placeholder="e.g. ET" className={input} />
              </Field>
            </div>
            <Field label="Address">
              <input value={form.sellerAddress} onChange={(e) => set("sellerAddress", e.target.value)} placeholder="Registered address" className={input} />
            </Field>
          </fieldset>

          <Field label="Required customs documents">
            <div className="flex flex-wrap gap-2">
              {CUSTOMS_DOC_OPTIONS.map((d) => {
                const on = customsDocs.includes(d);
                return (
                  <button type="button" key={d} onClick={() => toggleDoc(d)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${on ? "border-gold bg-gold/15 text-gold" : "border-border bg-surface text-muted-foreground hover:border-gold/40"}`}>
                    {on ? "✓ " : ""}{d}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Compliance & regulatory notes">
            <textarea rows={3} value={form.complianceNotes} onChange={(e) => set("complianceNotes", e.target.value)} placeholder="Sanctions screening, export licenses, dual-use goods, restrictions…" className={input} />
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
