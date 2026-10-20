import { z } from "zod";
import { getService, serviceReach } from "./services";

export const dossierStatuses = ["draft", "submitted", "in_progress", "completed", "cancelled"] as const;
export type DossierStatus = typeof dossierStatuses[number];
export const STATUS_LABELS: Record<DossierStatus, string> = {
  draft: "Draft", submitted: "Submitted", in_progress: "In progress", completed: "Completed", cancelled: "Cancelled",
};
export const taskSchema = z.object({ label: z.string().min(1).max(500), done: z.boolean() });
export const evidenceSchema = z.object({ label: z.string().min(1).max(500), reference: z.string().max(1000) });
export const dossierInput = z.object({
  service_slug: z.string(), title: z.string().trim().min(3).max(160),
  reach: z.enum(["global", "national", "regional"]),
  contract_id: z.string().uuid().nullable(),
  provider: z.string().trim().max(200), external_reference: z.string().trim().max(200),
  origin_country: z.string().trim().max(80), destination_country: z.string().trim().max(80),
  quoted_pi: z.number().finite().nonnegative().max(1e12),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
}).superRefine((value, ctx) => {
  const service = getService(value.service_slug);
  if (!service || !serviceReach(service).includes(value.reach))
    ctx.addIssue({ code: "custom", message: "Choose a supported service and reach" });
});
export const dossierPatch = z.object({
  id: z.string().uuid(), updated_at: z.string(),
  provider: z.string().trim().max(200), external_reference: z.string().trim().max(200),
  quoted_pi: z.number().finite().nonnegative().max(1e12),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  status: z.enum(dossierStatuses), checklist: z.array(taskSchema).max(100), evidence: z.array(evidenceSchema).max(100),
});
export function canTransition(from: DossierStatus, to: DossierStatus) {
  if (from === "completed" || from === "cancelled") return false;
  return from === to || to === "cancelled" ||
    (from === "draft" && to === "submitted") ||
    (from === "submitted" && to === "in_progress") ||
    (from === "in_progress" && to === "completed");
}
export function readyToClose(tasks: z.infer<typeof taskSchema>[], docs: z.infer<typeof evidenceSchema>[]) {
  return tasks.length > 0 && tasks.every(t => t.done) && docs.every(d => d.reference.trim().length > 0);
}
export interface Dossier {
  id: string; owner_id: string; contract_id: string | null; service_slug: string; title: string;
  reach: "global" | "national" | "regional"; provider: string; external_reference: string;
  origin_country: string; destination_country: string; quoted_pi: number; due_date: string | null;
  status: DossierStatus; checklist: z.infer<typeof taskSchema>[]; evidence: z.infer<typeof evidenceSchema>[];
  created_at: string; updated_at: string;
}