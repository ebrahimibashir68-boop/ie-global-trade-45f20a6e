import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { createContract, defaultMilestones, type Incoterm, type Intermediary, type PartyType } from "@/lib/contracts-store";
import { loadSession } from "@/lib/pi-session";

export const Route = createFileRoute("/contracts/new")({
  head: () => ({
    meta: [
      { title: "Draft a new smart contract · PiTrade" },
      { name: "description", content: "Create a global import-export smart contract priced in Pi — parties, shipping, customs docs, insurance, escrow milestones." },
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
const SHIPPING_MODES = ["sea", "air", "road", "rail", "multimodal"] as const;
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
    currency: "USD",
    fiatEquivalent: 0,
    buyerUsername: session?.username ?? "",
    sellerUsername: "",
    amountPi: 100,
    memo: "",
    deliveryWindow: "30-45 days from funding",
    complianceNotes: "",
    // Buyer
    buyerType: "company" as PartyType,
    buyerLegalName: "", buyerCountryCode: "", buyerRegNo: "", buyerAddress: "",
    // Seller
    sellerType: "company" as PartyType,
    sellerLegalName: "", sellerCountryCode: "", sellerRegNo: "", sellerAddress: "",
    // Shipping
    shipMode: "sea" as typeof SHIPPING_MODES[number],
    carrier: "", vesselOrFlight: "", containerNo: "", bolAwbNo: "",
    portOfLoading: "", portOfDischarge: "", etd: "", eta: "", trackingUrl: "",
    packageCount: 0, grossWeightKg: 0, netWeightKg: 0, volumeM3: 0,
    // Insurance
    insurer: "", policyNo: "", coveragePi: 0, insuranceClauses: "Institute Cargo Clauses (A) — All Risks",
  });

  const [customsDocs, setCustomsDocs] = useState<string[]>([
    "Commercial Invoice", "Packing List", "Certificate of Origin", "Bill of Lading / Airway Bill",
  ]);
  const [intermediaries, setIntermediaries] = useState<Intermediary[]>([]);

  const toggleDoc = (d: string) =>
    setCustomsDocs((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));

  const addIntermediary = (role: Intermediary["role"]) =>
    setIntermediaries((cur) => [...cur, { role, name: "", countryCode: "", contact: "", licenseNo: "" }]);
  const updateIntermediary = (i: number, patch: Partial<Intermediary>) =>
    setIntermediaries((cur) => cur.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const removeIntermediary = (i: number) =>
    setIntermediaries((cur) => cur.filter((_, idx) => idx !== i));

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
      currency: form.currency || undefined,
      fiatEquivalent: form.fiatEquivalent || undefined,
      buyerUsername: form.buyerUsername,
      sellerUsername: form.sellerUsername,
      amountPi: form.amountPi,
      memo: form.memo || `PiTrade ${form.title}`,
      deliveryWindow: form.deliveryWindow || undefined,
      complianceNotes: form.complianceNotes || undefined,
      customsDocs,
      buyer: {
        type: form.buyerType, legalName: form.buyerLegalName, piUsername: form.buyerUsername,
        countryCode: form.buyerCountryCode || form.destinationCountry,
        registrationNo: form.buyerRegNo || undefined, address: form.buyerAddress || undefined,
      },
      seller: {
        type: form.sellerType, legalName: form.sellerLegalName, piUsername: form.sellerUsername,
        countryCode: form.sellerCountryCode || form.originCountry,
        registrationNo: form.sellerRegNo || undefined, address: form.sellerAddress || undefined,
      },
      shipping: {
        mode: form.shipMode,
        carrier: form.carrier || undefined,
        vesselOrFlight: form.vesselOrFlight || undefined,
        containerNo: form.containerNo || undefined,
        bolAwbNo: form.bolAwbNo || undefined,
        portOfLoading: form.portOfLoading || undefined,
        portOfDischarge: form.portOfDischarge || undefined,
        etd: form.etd || undefined,
        eta: form.eta || undefined,
        trackingUrl: form.trackingUrl || undefined,
        packageCount: form.packageCount || undefined,
        grossWeightKg: form.grossWeightKg || undefined,
        netWeightKg: form.netWeightKg || undefined,
        volumeM3: form.volumeM3 || undefined,
      },
      insurance: (form.insurer || form.policyNo || form.coveragePi)
        ? {
            insurer: form.insurer || undefined,
            policyNo: form.policyNo || undefined,
            coveragePi: form.coveragePi || undefined,
            clauses: form.insuranceClauses || undefined,
          }
        : undefined,
      intermediaries: intermediaries.filter((x) => x.name.trim() !== ""),
      milestones: defaultMilestones(form.incoterm),
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
          Full cross-border trade file — parties, HS classification, shipping, insurance, customs docs and LC-style escrow milestones.
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

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Settlement amount (π)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-display text-lg text-gold">π</span>
                <input type="number" min={0} step="0.01" required value={form.amountPi} onChange={(e) => set("amountPi", Number(e.target.value))} className={`${input} pl-9`} />
              </div>
            </Field>
            <Field label="Reference currency">
              <input value={form.currency} onChange={(e) => set("currency", e.target.value)} placeholder="USD" className={input} />
            </Field>
            <Field label="Reference value">
              <input type="number" min={0} step="0.01" value={form.fiatEquivalent} onChange={(e) => set("fiatEquivalent", Number(e.target.value))} className={input} />
            </Field>
          </div>

          <Field label="Payment memo (optional)">
            <input value={form.memo} onChange={(e) => set("memo", e.target.value)} placeholder="Visible to buyer on the Pi payment sheet" className={input} />
          </Field>

          {/* BUYER */}
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

          {/* SELLER */}
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

          {/* SHIPPING */}
          <fieldset className="rounded-xl border border-border/70 bg-surface p-4">
            <legend className="px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Shipping & logistics</legend>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Mode">
                <select value={form.shipMode} onChange={(e) => set("shipMode", e.target.value as typeof SHIPPING_MODES[number])} className={input}>
                  {SHIPPING_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="Carrier">
                <input value={form.carrier} onChange={(e) => set("carrier", e.target.value)} placeholder="Maersk, DHL…" className={input} />
              </Field>
              <Field label="Vessel / Flight">
                <input value={form.vesselOrFlight} onChange={(e) => set("vesselOrFlight", e.target.value)} placeholder="MSC Gaia / LH507" className={input} />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Container no."><input value={form.containerNo} onChange={(e) => set("containerNo", e.target.value)} placeholder="MSKU1234567" className={input} /></Field>
              <Field label="B/L or AWB no."><input value={form.bolAwbNo} onChange={(e) => set("bolAwbNo", e.target.value)} placeholder="MAEU-123456789" className={input} /></Field>
              <Field label="Port of loading"><input value={form.portOfLoading} onChange={(e) => set("portOfLoading", e.target.value)} placeholder="Shanghai (CNSHA)" className={input} /></Field>
              <Field label="Port of discharge"><input value={form.portOfDischarge} onChange={(e) => set("portOfDischarge", e.target.value)} placeholder="Hamburg (DEHAM)" className={input} /></Field>
              <Field label="ETD"><input type="date" value={form.etd} onChange={(e) => set("etd", e.target.value)} className={input} /></Field>
              <Field label="ETA"><input type="date" value={form.eta} onChange={(e) => set("eta", e.target.value)} className={input} /></Field>
            </div>
            <Field label="Tracking URL"><input value={form.trackingUrl} onChange={(e) => set("trackingUrl", e.target.value)} placeholder="https://…" className={input} /></Field>
            <div className="grid gap-4 md:grid-cols-4">
              <Field label="Packages"><input type="number" min={0} value={form.packageCount} onChange={(e) => set("packageCount", Number(e.target.value))} className={input} /></Field>
              <Field label="Gross wt (kg)"><input type="number" min={0} value={form.grossWeightKg} onChange={(e) => set("grossWeightKg", Number(e.target.value))} className={input} /></Field>
              <Field label="Net wt (kg)"><input type="number" min={0} value={form.netWeightKg} onChange={(e) => set("netWeightKg", Number(e.target.value))} className={input} /></Field>
              <Field label="Volume (m³)"><input type="number" min={0} step="0.01" value={form.volumeM3} onChange={(e) => set("volumeM3", Number(e.target.value))} className={input} /></Field>
            </div>
          </fieldset>

          {/* INSURANCE */}
          <fieldset className="rounded-xl border border-border/70 bg-surface p-4">
            <legend className="px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Cargo insurance</legend>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Insurer"><input value={form.insurer} onChange={(e) => set("insurer", e.target.value)} placeholder="Lloyd's / AIG / …" className={input} /></Field>
              <Field label="Policy no."><input value={form.policyNo} onChange={(e) => set("policyNo", e.target.value)} className={input} /></Field>
              <Field label="Coverage (π)"><input type="number" min={0} value={form.coveragePi} onChange={(e) => set("coveragePi", Number(e.target.value))} placeholder={`Recommend ${(form.amountPi*1.1).toFixed(0)} (110% CIF)`} className={input} /></Field>
              <Field label="Clauses"><input value={form.insuranceClauses} onChange={(e) => set("insuranceClauses", e.target.value)} className={input} /></Field>
            </div>
          </fieldset>

          {/* INTERMEDIARIES */}
          <fieldset className="rounded-xl border border-border/70 bg-surface p-4">
            <legend className="px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Intermediaries</legend>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => addIntermediary("forwarder")} className="rounded-full border border-gold/40 bg-surface px-3 py-1.5 text-xs text-gold hover:bg-gold/10">+ Freight forwarder</button>
              <button type="button" onClick={() => addIntermediary("broker")} className="rounded-full border border-gold/40 bg-surface px-3 py-1.5 text-xs text-gold hover:bg-gold/10">+ Customs broker</button>
              <button type="button" onClick={() => addIntermediary("inspector")} className="rounded-full border border-gold/40 bg-surface px-3 py-1.5 text-xs text-gold hover:bg-gold/10">+ Inspection agent</button>
            </div>
            <div className="mt-3 space-y-3">
              {intermediaries.map((im, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{im.role}</div>
                    <button type="button" onClick={() => removeIntermediary(i)} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
                  </div>
                  <div className="mt-2 grid gap-3 md:grid-cols-2">
                    <input value={im.name} onChange={(e) => updateIntermediary(i, { name: e.target.value })} placeholder="Company name" className={input} />
                    <input value={im.countryCode ?? ""} onChange={(e) => updateIntermediary(i, { countryCode: e.target.value })} placeholder="Country code" className={input} />
                    <input value={im.licenseNo ?? ""} onChange={(e) => updateIntermediary(i, { licenseNo: e.target.value })} placeholder="License no." className={input} />
                    <input value={im.contact ?? ""} onChange={(e) => updateIntermediary(i, { contact: e.target.value })} placeholder="Contact email / phone" className={input} />
                  </div>
                </div>
              ))}
            </div>
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

          <div className="rounded-lg border border-gold/30 bg-gold/5 p-4 text-xs text-muted-foreground">
            <div className="font-semibold text-gold">Escrow milestones auto-generated</div>
            <p className="mt-1">A Letter-of-Credit-style release schedule is applied on creation, weighted to your Incoterm ({form.incoterm}).
            You can mark each milestone complete from the contract page — the escrow releases proportionally.</p>
          </div>

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
