import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, ArrowRight, Download, ShieldCheck, Anchor, Plane, Truck } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { PiComplianceFooter } from "@/components/PiComplianceFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { createDossier, dossierAudit, listDossiers, saveDossier } from "@/lib/operations.functions";
import { listContracts } from "@/lib/trade.functions";
import { REACH_LABELS, SERVICES, SERVICE_GROUPS, getService, serviceReach, type ServiceReach } from "@/lib/trade/services";
import { STATUS_LABELS, type Dossier, type DossierStatus } from "@/lib/trade/operations";

export const Route = createFileRoute("/operations")({
  validateSearch: (s: Record<string, unknown>) => ({ service: typeof s.service === "string" && getService(s.service) ? s.service : undefined }),
  head: () => ({ meta: [
    { title: "Trade Operations — Pi-aligned service dossiers | PiTrade" },
    { name: "description", content: "Coordinate freight, customs, documents, insurance and regional trade in private service dossiers with Pi quotes and hashed off-chain audit records." },
    { property: "og:title", content: "PiTrade Trade Operations" },
    { property: "og:description", content: "Traditional trade workflows, document evidence and provider references alongside Pi Network settlement." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Operations,
});
const selectClass = "h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid min-w-0 gap-1.5 text-sm"><span className="text-muted-foreground">{label}</span>{children}</label>;
}

function Operations() {
  const { service: requestedService } = Route.useSearch();
  const { user } = useAuth();
  const qc = useQueryClient();
  const load = useServerFn(listDossiers);
  const loadContracts = useServerFn(listContracts);
  const create = useServerFn(createDossier);
  const [showNew, setShowNew] = useState(Boolean(requestedService));
  const [selected, setSelected] = useState<string | null>(null);
  const [group, setGroup] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ service_slug: requestedService ?? SERVICES[0]?.slug ?? "ocean-freight", title: "", reach: "global" as ServiceReach,
    contract_id: "", provider: "", external_reference: "", origin_country: "", destination_country: "", quoted_pi: "0", due_date: "" });
  const service = getService(form.service_slug);
  const effectiveReach = service && serviceReach(service).includes(form.reach) ? form.reach : service ? serviceReach(service)[0] : "global";
  const query = useQuery({ queryKey: ["operations", user?.id], queryFn: () => load(), enabled: Boolean(user) });
  const contracts = useQuery({ queryKey: ["operations-contracts", user?.id], queryFn: () => loadContracts(), enabled: Boolean(user) && showNew });
  const mutation = useMutation({ mutationFn: () => create({ data: { ...form, reach: effectiveReach ?? "global", quoted_pi: Number(form.quoted_pi), due_date: form.due_date || null, contract_id: form.contract_id || null } }),
    onSuccess: async row => { setError(""); setShowNew(false); setSelected(row.id); await qc.invalidateQueries({ queryKey: ["operations"] }); },
    onError: e => setError(e.message),
  });
  const rows = query.data ?? [];
  const visible = rows.filter(d => (group === "all" || getService(d.service_slug)?.group === group) && `${d.title} ${d.provider} ${d.external_reference}`.toLowerCase().includes(search.toLowerCase()));
  const current = rows.find(d => d.id === selected);
  const update = (key: keyof typeof form, value: string) => setForm(f => ({ ...f, [key]: value }));

  return <div className="min-h-screen"><SiteHeader /><main className="mx-auto max-w-6xl px-5 py-10">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><div className="flex items-center gap-2 text-sm text-gold"><Anchor className="size-4" /><Plane className="size-4" /><Truck className="size-4" /> Global · National · Regional</div>
        <h1 className="mt-3 text-3xl font-semibold">Trade operations</h1></div>
      <Button onClick={() => { setShowNew(true); setSelected(null); }}><Plus />New dossier</Button>
    </div>
    <div className="mt-6 grid grid-cols-3 gap-3 border-y border-border py-5 text-sm">
      <div><div className="text-2xl font-semibold">{rows.length}</div><div className="text-muted-foreground">Service dossiers</div></div>
      <div><div className="text-2xl font-semibold">{rows.filter(r => r.status === "submitted" || r.status === "in_progress").length}</div><div className="text-muted-foreground">Active workflows</div></div>
      <div><div className="text-2xl font-semibold">{rows.filter(r => r.status === "completed").length}</div><div className="text-muted-foreground">Completed</div></div>
    </div>
    <p className="mt-4 text-sm text-muted-foreground">Operational records and SHA-256 audit hashes are stored off-chain. A quote is not a payment; only verified Pi Network payments constitute on-chain settlement. Carrier bookings, official clearance and insurance require authorised providers.</p>
    {showNew && <form className="mt-8 border-y border-border py-6" onSubmit={e => { e.preventDefault(); mutation.mutate(); }}>
      <h2 className="mb-5 text-xl font-semibold">New service dossier</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Service"><select className={selectClass} value={form.service_slug} onChange={e => update("service_slug", e.target.value)}>{SERVICE_GROUPS.map(g => <optgroup key={g.key} label={g.label}>{SERVICES.filter(s => s.group === g.key).map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}</optgroup>)}</select></Field>
        <Field label="Dossier title"><Input required minLength={3} maxLength={160} value={form.title} onChange={e => update("title", e.target.value)} /></Field>
        <Field label="Reach"><select className={selectClass} value={effectiveReach} onChange={e => update("reach", e.target.value)}>{service && serviceReach(service).map(r => <option key={r} value={r}>{REACH_LABELS[r]}</option>)}</select></Field>
        <Field label="Linked cloud contract"><select className={selectClass} value={form.contract_id} onChange={e => update("contract_id", e.target.value)}><option value="">Standalone dossier</option>{contracts.data?.map(c => <option key={c.id} value={c.id}>{c.reference} — {c.title}</option>)}</select></Field>
        <Field label="Origin country"><Input maxLength={80} value={form.origin_country} onChange={e => update("origin_country", e.target.value)} /></Field>
        <Field label="Destination country"><Input maxLength={80} value={form.destination_country} onChange={e => update("destination_country", e.target.value)} /></Field>
        <Field label="Service provider / authorised broker"><Input maxLength={200} value={form.provider} onChange={e => update("provider", e.target.value)} /></Field>
        <Field label="Booking / declaration / policy reference"><Input maxLength={200} value={form.external_reference} onChange={e => update("external_reference", e.target.value)} /></Field>
        <Field label="Quoted amount (π) · not settled"><Input type="number" min="0" step="0.0000001" required value={form.quoted_pi} onChange={e => update("quoted_pi", e.target.value)} /></Field>
        <Field label="Due date"><Input type="date" value={form.due_date} onChange={e => update("due_date", e.target.value)} /></Field>
      </div>
      {contracts.error && <p className="mt-3 text-destructive">Contract selection is unavailable. Retry before linking a contract.</p>}
      {error && <p role="alert" className="mt-3 text-destructive">{error}</p>}
      <div className="mt-5 flex gap-3"><Button disabled={mutation.isPending || !user} type="submit"><Plus />{mutation.isPending ? "Creating…" : "Create dossier"}</Button><Button variant="outline" type="button" onClick={() => setShowNew(false)}>Cancel</Button></div>
    </form>}
    {current && <DossierEditor key={`${current.id}-${current.updated_at}`} dossier={current} onClose={() => setSelected(null)} />}
    <div className="mt-8 grid gap-3 sm:grid-cols-2"><Input aria-label="Search dossiers" placeholder="Search dossiers or references…" value={search} onChange={e => setSearch(e.target.value)} />
      <select aria-label="Filter service family" className={selectClass} value={group} onChange={e => setGroup(e.target.value)}><option value="all">All service families</option>{SERVICE_GROUPS.map(g => <option key={g.key} value={g.key}>{g.label}</option>)}</select></div>
    {query.isLoading ? <p className="py-8 text-muted-foreground">Loading dossiers…</p> : query.error ? <div className="py-8"><p role="alert" className="text-destructive">{query.error.message}</p><Button className="mt-3" variant="outline" onClick={() => query.refetch()}>Retry</Button></div> : visible.length === 0 ? <div className="py-12 text-center"><h2 className="text-lg font-semibold">{rows.length ? "No matching dossiers" : "No service dossiers yet"}</h2><Button asChild variant="link"><Link to="/services">Browse trade services <ArrowRight /></Link></Button></div> :
      <div className="mt-5 grid gap-3 md:grid-cols-2">{visible.map(d => <Button key={d.id} variant="outline" className="h-auto min-w-0 justify-between whitespace-normal p-4 text-left" onClick={() => { setSelected(d.id); setShowNew(false); }}>
        <span className="min-w-0"><span className="block font-semibold break-words">{d.title}</span><span className="mt-1 block text-xs text-muted-foreground">{getService(d.service_slug)?.name} · {REACH_LABELS[d.reach]}</span><span className="mt-2 block text-xs">{STATUS_LABELS[d.status]} · π {Number(d.quoted_pi).toLocaleString()}</span></span><ArrowRight className="shrink-0" /></Button>)}</div>}
  </main><PiComplianceFooter /></div>;
}

function DossierEditor({ dossier, onClose }: { dossier: Dossier; onClose: () => void }) {
  const [draft, setDraft] = useState(dossier);
  const qc = useQueryClient();
  const save = useServerFn(saveDossier);
  const audit = useServerFn(dossierAudit);
  const history = useQuery({ queryKey: ["dossier-audit", dossier.id, dossier.updated_at], queryFn: () => audit({ data: { id: dossier.id } }) });
  const closed = draft.status === "completed" || draft.status === "cancelled";
  const mutation = useMutation({ mutationFn: (status: DossierStatus) => save({ data: { id: draft.id, updated_at: draft.updated_at, provider: draft.provider, external_reference: draft.external_reference, quoted_pi: Number(draft.quoted_pi), due_date: draft.due_date, checklist: draft.checklist, evidence: draft.evidence, status } }),
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["operations"] }); },
  });
  const next: Partial<Record<DossierStatus, DossierStatus>> = { draft: "submitted", submitted: "in_progress", in_progress: "completed" };
  const nextStatus = next[draft.status];
  const download = () => {
    const blob = new Blob([JSON.stringify({ record_type: "off_chain_trade_dossier", dossier, audit: history.data ?? [] }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `trade-dossier-${dossier.id}.json`; a.click(); URL.revokeObjectURL(url);
  };
  return <section className="mt-8 border-y border-border py-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold break-words">{dossier.title}</h2><p className="mt-1 text-sm text-gold">{STATUS_LABELS[dossier.status]} · {getService(dossier.service_slug)?.name}</p></div><Button variant="outline" onClick={onClose}>Close</Button></div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <Field label="Service provider"><Input disabled={closed} value={draft.provider} onChange={e => setDraft(d => ({ ...d, provider: e.target.value }))} /></Field>
      <Field label="External reference"><Input disabled={closed} value={draft.external_reference} onChange={e => setDraft(d => ({ ...d, external_reference: e.target.value }))} /></Field>
      <Field label="Quoted amount (π) · not settled"><Input disabled={closed} type="number" min="0" step="0.0000001" value={draft.quoted_pi} onChange={e => setDraft(d => ({ ...d, quoted_pi: Number(e.target.value) }))} /></Field>
      <Field label="Due date"><Input disabled={closed} type="date" value={draft.due_date ?? ""} onChange={e => setDraft(d => ({ ...d, due_date: e.target.value || null }))} /></Field>
    </div>
    <div className="mt-6 grid gap-8 md:grid-cols-2"><div><h3 className="font-semibold">Operational milestones</h3><div className="mt-4 space-y-4">{draft.checklist.map((task,i) => <label key={task.label} className="flex items-start gap-3 text-sm"><Checkbox disabled={closed} checked={task.done} onCheckedChange={v => setDraft(d => ({ ...d, checklist: d.checklist.map((t,j) => j === i ? { ...t, done: v === true } : t) }))} /><span>{task.label}</span></label>)}</div></div>
      <div><h3 className="font-semibold">Document evidence references</h3><div className="mt-4 space-y-4">{draft.evidence.map((doc,i) => <Field key={doc.label} label={doc.label}><Textarea disabled={closed} rows={2} maxLength={1000} value={doc.reference} placeholder="Document number, secure location or issuer receipt" onChange={e => setDraft(d => ({ ...d, evidence: d.evidence.map((t,j) => j === i ? { ...t, reference: e.target.value } : t) }))} /></Field>)}</div></div></div>
    {mutation.error && <p role="alert" className="mt-4 text-destructive">{mutation.error.message}</p>}
    <div className="mt-6 flex flex-wrap gap-3">{!closed && <><Button disabled={mutation.isPending} onClick={() => mutation.mutate(draft.status)}><Save />Save record</Button>{nextStatus && <Button disabled={mutation.isPending} variant="outline" onClick={() => mutation.mutate(nextStatus)}><ArrowRight />{nextStatus === "submitted" ? "Submit dossier" : nextStatus === "in_progress" ? "Start work" : "Complete dossier"}</Button>}<Button variant="ghost" disabled={mutation.isPending} onClick={() => { if (window.confirm("Cancel this dossier permanently?")) mutation.mutate("cancelled"); }}>Cancel dossier</Button></>}
      <Button variant="outline" disabled={!history.data} onClick={download}><Download />Export saved record</Button><Button asChild variant="link"><Link to="/wallet">Pi settlement <ArrowRight /></Link></Button></div>
    <div className="mt-8"><h3 className="flex items-center gap-2 font-semibold"><ShieldCheck className="size-4 text-gold" />Hash-linked audit trail · off-chain</h3>
      {history.error ? <p className="mt-3 text-destructive">Audit history unavailable.</p> : history.isLoading ? <p className="mt-3 text-muted-foreground">Loading audit history…</p> : <ol className="mt-3 space-y-3">{history.data?.map(record => <li key={record.id} className="border-l-2 border-border pl-3 text-xs"><div className="text-muted-foreground">{new Date(record.created_at).toLocaleString()}</div><code className="mt-1 block break-all">{record.record_hash}</code><span className="mt-1 block break-all text-muted-foreground">Previous: {record.previous_hash ?? "Genesis record"}</span></li>)}</ol>}
    </div>
  </section>;
}