import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { getService } from "./trade/services";
import { canTransition, dossierInput, dossierPatch, readyToClose, type Dossier } from "./trade/operations";

export const listDossiers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth]).handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("trade_service_dossiers").select("*").order("created_at", { ascending: false });
    if (error) throw new Error("Trade operations could not be loaded.");
    return (data ?? []) as unknown as Dossier[];
  });

export const createDossier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth]).inputValidator((input: unknown) => dossierInput.parse(input))
  .handler(async ({ data, context }) => {
    const service = getService(data.service_slug);
    if (!service) throw new Error("Service not found");
    const { data: row, error } = await context.supabase.from("trade_service_dossiers").insert({
      ...data, owner_id: context.userId,
      checklist: service.covers.map(label => ({ label, done: false })),
      evidence: service.documents.map(label => ({ label, reference: "" })),
    }).select("*").single();
    if (error) throw new Error("Dossier could not be created. Check your contract access and try again.");
    return row as unknown as Dossier;
  });

export const saveDossier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth]).inputValidator((input: unknown) => dossierPatch.parse(input))
  .handler(async ({ data, context }) => {
    const { data: current, error: readError } = await context.supabase.from("trade_service_dossiers").select("*").eq("id", data.id).maybeSingle();
    if (readError || !current) throw new Error("Dossier not found or access denied");
    const old = current as unknown as Dossier;
    if (!canTransition(old.status, data.status)) throw new Error("This workflow transition is not allowed.");
    if (old.checklist.length !== data.checklist.length || old.checklist.some((t,i) => t.label !== data.checklist[i]?.label) ||
        old.evidence.length !== data.evidence.length || old.evidence.some((d,i) => d.label !== data.evidence[i]?.label))
      throw new Error("Required tasks and documents cannot be removed.");
    if (data.status === "completed" && !readyToClose(data.checklist, data.evidence))
      throw new Error("Complete every task and document reference before closing.");
    const { id, updated_at, ...patch } = data;
    const { data: row, error } = await context.supabase.from("trade_service_dossiers").update(patch).eq("id", id).eq("updated_at", updated_at).select("*").maybeSingle();
    if (error) throw new Error("The dossier could not be saved.");
    if (!row) throw new Error("This dossier changed in another session. Refresh before saving.");
    return row as unknown as Dossier;
  });

export const dossierAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: records, error } = await context.supabase.from("trade_service_audit").select("id, actor_id, record_hash, previous_hash, created_at").eq("dossier_id", data.id).order("created_at", { ascending: false });
    if (error) throw new Error("Audit history could not be loaded.");
    return records ?? [];
  });