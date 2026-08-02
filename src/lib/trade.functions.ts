// Authenticated trade-desk server functions. Every handler runs as the
// signed-in user, so row-level security scopes data to contract parties.
// Keep this module thin: imports, types and server-function declarations only.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { milestoneTemplate } from "./trade/standards";
import { screenTrade, estimateLandedCost } from "./trade/compliance";
import type { ContractBundle, TradeContract } from "./trade/types";

const CONTRACT_FIELDS = `id, reference, created_by, buyer_user_id, seller_user_id, buyer_org_id, seller_org_id,
  buyer_legal_name, seller_legal_name, counterparty_email, title, goods_description, hs_code, category,
  quantity, unit, net_weight_kg, gross_weight_kg, volume_m3, package_count, origin_country, destination_country,
  incoterm, named_place, port_of_loading, port_of_discharge, currency, contract_value, amount_pi, payment_terms,
  transport_mode, carrier, vessel_or_flight, container_no, transport_doc_no, etd, eta, insurer, policy_no,
  insured_value, insurance_clauses, duty_estimate, vat_estimate, compliance_notes, status, pi_payment_id,
  pi_txid, funded_at, created_at, updated_at`;

export const listContracts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("trade_contracts")
      .select(CONTRACT_FIELDS)
      .order("created_at", { ascending: false })
      .returns<TradeContract[]>();
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getContractBundle = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: contract, error } = await sb
      .from("trade_contracts")
      .select(CONTRACT_FIELDS)
      .eq("id", data.id)
      .maybeSingle<TradeContract>();
    if (error) throw new Error(error.message);
    if (!contract) return null;
    const [milestones, signatures, documents, events, screenings] = await Promise.all([
      sb.from("contract_milestones").select("*").eq("contract_id", data.id).order("seq"),
      sb.from("contract_signatures").select("*").eq("contract_id", data.id),
      sb.from("contract_documents").select("*").eq("contract_id", data.id).order("issued_at", { ascending: false }),
      sb.from("contract_events").select("*").eq("contract_id", data.id).order("created_at", { ascending: false }).limit(60),
      sb.from("compliance_screenings").select("*").eq("contract_id", data.id).order("created_at", { ascending: false }).limit(5),
    ]);
    return {
      contract,
      milestones: (milestones.data ?? []) as unknown as ContractBundle["milestones"],
      signatures: (signatures.data ?? []) as unknown as ContractBundle["signatures"],
      documents: (documents.data ?? []) as unknown as ContractBundle["documents"],
      events: (events.data ?? []) as unknown as ContractBundle["events"],
      screenings: (screenings.data ?? []) as unknown as ContractBundle["screenings"],
    };
  });

export const createContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      title: z.string().min(3).max(160),
      goods_description: z.string().min(3).max(2000),
      hs_code: z.string().max(20).optional().nullable(),
      category: z.string().max(80).optional().nullable(),
      quantity: z.number().positive(),
      unit: z.string().max(40),
      net_weight_kg: z.number().nonnegative().nullable().optional(),
      gross_weight_kg: z.number().nonnegative().nullable().optional(),
      volume_m3: z.number().nonnegative().nullable().optional(),
      package_count: z.number().int().nonnegative().nullable().optional(),
      origin_country: z.string().length(2),
      destination_country: z.string().length(2),
      incoterm: z.enum(["EXW","FCA","FAS","FOB","CFR","CIF","CPT","CIP","DAP","DPU","DDP"]),
      named_place: z.string().max(160).nullable().optional(),
      port_of_loading: z.string().max(160).nullable().optional(),
      port_of_discharge: z.string().max(160).nullable().optional(),
      currency: z.string().length(3),
      contract_value: z.number().nonnegative(),
      amount_pi: z.number().nonnegative(),
      payment_terms: z.string().max(400).nullable().optional(),
      transport_mode: z.enum(["sea","air","road","rail","multimodal","post"]),
      carrier: z.string().max(160).nullable().optional(),
      vessel_or_flight: z.string().max(160).nullable().optional(),
      container_no: z.string().max(80).nullable().optional(),
      transport_doc_no: z.string().max(80).nullable().optional(),
      etd: z.string().max(10).nullable().optional(),
      eta: z.string().max(10).nullable().optional(),
      insurer: z.string().max(160).nullable().optional(),
      policy_no: z.string().max(80).nullable().optional(),
      insured_value: z.number().nonnegative().nullable().optional(),
      insurance_clauses: z.string().max(240).nullable().optional(),
      compliance_notes: z.string().max(2000).nullable().optional(),
      buyer_legal_name: z.string().max(200).nullable().optional(),
      seller_legal_name: z.string().max(200).nullable().optional(),
      counterparty_email: z.string().email().max(200).nullable().optional(),
      side: z.enum(["buyer", "seller"]),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { side, ...fields } = data;
    const sb = context.supabase;
    const row = {
      ...fields,
      etd: fields.etd || null,
      eta: fields.eta || null,
      created_by: context.userId,
      buyer_user_id: side === "buyer" ? context.userId : null,
      seller_user_id: side === "seller" ? context.userId : null,
      status: "draft" as const,
    };
    const { data: created, error } = await sb
      .from("trade_contracts")
      .insert(row)
      .select(CONTRACT_FIELDS)
      .single<TradeContract>();
    if (error) throw new Error(error.message);

    const milestones = milestoneTemplate(data.incoterm).map((m, i) => ({
      contract_id: created.id,
      seq: i,
      key: m.key,
      label: m.label,
      release_pct: m.release_pct,
      required_docs: m.required_docs,
    }));
    await sb.from("contract_milestones").insert(milestones);
    await sb.from("contract_events").insert({
      contract_id: created.id,
      actor_id: context.userId,
      event_type: "contract_created",
      detail: { reference: created.reference, incoterm: created.incoterm },
    });
    return created;
  });

export const updateContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid(),
      patch: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const allowed = new Set([
      "title","goods_description","hs_code","category","quantity","unit","net_weight_kg","gross_weight_kg",
      "volume_m3","package_count","named_place","port_of_loading","port_of_discharge","currency",
      "contract_value","amount_pi","payment_terms","transport_mode","carrier","vessel_or_flight",
      "container_no","transport_doc_no","etd","eta","insurer","policy_no","insured_value",
      "insurance_clauses","compliance_notes","status","buyer_legal_name","seller_legal_name",
      "counterparty_email",
    ]);
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data.patch)) if (allowed.has(k)) patch[k] = v;
    if (Object.keys(patch).length === 0) throw new Error("No updatable fields supplied");
    const { error } = await context.supabase.from("trade_contracts").update(patch as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    await context.supabase.from("contract_events").insert({
      contract_id: data.id,
      actor_id: context.userId,
      event_type: "contract_updated",
      detail: { fields: Object.keys(patch) },
    });
    return { ok: true };
  });

export const joinContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), side: z.enum(["buyer", "seller"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const column = data.side === "buyer" ? "buyer_user_id" : "seller_user_id";
    const { error } = await context.supabase
      .from("trade_contracts")
      .update({ [column]: context.userId } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await context.supabase.from("contract_events").insert({
      contract_id: data.id,
      actor_id: context.userId,
      event_type: "counterparty_joined",
      detail: { side: data.side },
    });
    return { ok: true };
  });

export const signContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid(),
      role: z.enum(["buyer", "seller"]),
      signerName: z.string().min(2).max(160),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: contract, error } = await sb
      .from("trade_contracts")
      .select(CONTRACT_FIELDS)
      .eq("id", data.id)
      .maybeSingle<TradeContract>();
    if (error) throw new Error(error.message);
    if (!contract) throw new Error("Contract not found");

    const snapshot = JSON.stringify({
      reference: contract.reference,
      title: contract.title,
      goods: contract.goods_description,
      hs: contract.hs_code,
      qty: contract.quantity,
      unit: contract.unit,
      route: `${contract.origin_country}->${contract.destination_country}`,
      incoterm: contract.incoterm,
      value: contract.contract_value,
      currency: contract.currency,
      pi: contract.amount_pi,
      created: contract.created_at,
      role: data.role,
      signer: data.signerName,
    });
    const { createHash } = await import("crypto");
    const hash = createHash("sha256").update(snapshot).digest("hex");

    const { error: sigError } = await sb.from("contract_signatures").insert({
      contract_id: data.id,
      role: data.role,
      signer_user_id: context.userId,
      signer_name: data.signerName,
      hash,
    });
    if (sigError) throw new Error(sigError.message.includes("duplicate") ? "This party has already signed" : sigError.message);

    const { data: sigs } = await sb.from("contract_signatures").select("role").eq("contract_id", data.id);
    const both = (sigs ?? []).some((s) => s.role === "buyer") && (sigs ?? []).some((s) => s.role === "seller");
    if (both) {
      await sb.from("trade_contracts").update({ status: "signed" }).eq("id", data.id);
      await sb
        .from("contract_milestones")
        .update({ completed_at: new Date().toISOString(), completed_by: context.userId, note: "Executed by both parties" })
        .eq("contract_id", data.id)
        .eq("key", "contract_signed")
        .is("completed_at", null);
    } else {
      await sb.from("trade_contracts").update({ status: "pending_counterparty" }).eq("id", data.id);
    }
    await sb.from("contract_events").insert({
      contract_id: data.id,
      actor_id: context.userId,
      event_type: "contract_signed",
      detail: { role: data.role, signer: data.signerName, hash },
    });
    return { hash, fullyExecuted: both };
  });

export const completeMilestone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      contractId: z.string().uuid(),
      milestoneId: z.string().uuid(),
      note: z.string().max(500).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: milestone, error } = await sb
      .from("contract_milestones")
      .update({ completed_at: new Date().toISOString(), completed_by: context.userId, note: data.note ?? null })
      .eq("id", data.milestoneId)
      .is("completed_at", null)
      .select("key, label, release_pct")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!milestone) throw new Error("Milestone already completed");

    const statusByKey: Record<string, string> = {
      shipment_departed: "in_transit",
      arrived_destination: "in_transit",
      customs_cleared: "customs",
      delivered: "delivered",
    };
    const nextStatus = statusByKey[milestone.key];
    if (nextStatus) await sb.from("trade_contracts").update({ status: nextStatus } as never).eq("id", data.contractId);
    if (milestone.key === "delivered") {
      const { data: remaining } = await sb
        .from("contract_milestones").select("id").eq("contract_id", data.contractId).is("completed_at", null);
      if ((remaining ?? []).length === 0) {
        await sb.from("trade_contracts").update({ status: "completed" }).eq("id", data.contractId);
      }
    }
    await sb.from("contract_events").insert({
      contract_id: data.contractId,
      actor_id: context.userId,
      event_type: "milestone_completed",
      detail: { key: milestone.key, label: milestone.label, release_pct: milestone.release_pct },
    });
    return { ok: true };
  });

export const runScreening = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: contract, error } = await sb
      .from("trade_contracts")
      .select(CONTRACT_FIELDS)
      .eq("id", data.id)
      .maybeSingle<TradeContract>();
    if (error) throw new Error(error.message);
    if (!contract) throw new Error("Contract not found");

    const [denied, controlled, rates] = await Promise.all([
      sb.from("denied_parties").select("id, name, country_code, list_source, reason"),
      sb.from("controlled_goods").select("id, hs_prefix, regime, description, severity"),
      sb.from("duty_rates").select("destination_country, hs_prefix, duty_pct, vat_pct, note")
        .eq("destination_country", contract.destination_country),
    ]);

    const result = screenTrade(
      {
        buyerName: contract.buyer_legal_name,
        sellerName: contract.seller_legal_name,
        originCountry: contract.origin_country,
        destinationCountry: contract.destination_country,
        hsCode: contract.hs_code,
        goods: contract.goods_description,
        incoterm: contract.incoterm,
        hasInsurance: Boolean(contract.insurer || contract.policy_no),
      },
      denied.data ?? [],
      (controlled.data ?? []) as never,
    );

    const landed = estimateLandedCost(
      contract.contract_value,
      contract.hs_code,
      contract.destination_country,
      rates.data ?? [],
    );

    await sb.from("compliance_screenings").insert({
      contract_id: data.id,
      outcome: result.outcome,
      matches: result.matches as unknown as never,
      checks: result.checks as unknown as never,
      screened_by: context.userId,
    });
    await sb.from("trade_contracts")
      .update({ duty_estimate: landed.duty, vat_estimate: landed.vat })
      .eq("id", data.id);
    await sb.from("contract_events").insert({
      contract_id: data.id,
      actor_id: context.userId,
      event_type: "screening_run",
      detail: { outcome: result.outcome, matches: result.matches.length },
    });
    return { ...result, landed };
  });

export const issueDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      contractId: z.string().uuid(),
      docType: z.enum([
        "commercial_invoice","packing_list","certificate_of_origin","bill_of_lading","air_waybill",
        "insurance_certificate","inspection_certificate","phytosanitary","export_licence",
        "customs_declaration","other",
      ]),
      docNumber: z.string().max(80).optional(),
      issuer: z.string().max(160).optional(),
      payload: z.record(z.string(), z.unknown()).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const payload = data.payload ?? {};
    const { createHash } = await import("crypto");
    const hash = createHash("sha256")
      .update(JSON.stringify({ c: data.contractId, t: data.docType, n: data.docNumber, p: payload }))
      .digest("hex");
    const { data: doc, error } = await context.supabase
      .from("contract_documents")
      .insert({
        contract_id: data.contractId,
        doc_type: data.docType,
        doc_number: data.docNumber ?? null,
        issuer: data.issuer ?? null,
        payload: payload as never,
        hash,
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await context.supabase.from("contract_events").insert({
      contract_id: data.contractId,
      actor_id: context.userId,
      event_type: "document_issued",
      detail: { doc_type: data.docType, hash },
    });
    return doc;
  });

export const recordPiPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid(),
      paymentId: z.string().max(120),
      txid: z.string().max(160),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("trade_contracts")
      .update({
        pi_payment_id: data.paymentId,
        pi_txid: data.txid,
        status: "funded",
        funded_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await context.supabase.from("contract_events").insert({
      contract_id: data.id,
      actor_id: context.userId,
      event_type: "escrow_funded",
      detail: { payment_id: data.paymentId, txid: data.txid },
    });
    return { ok: true };
  });

export const deleteContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("trade_contracts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listOrganizations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("organizations").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveOrganization = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      legal_name: z.string().min(2).max(200),
      entity_type: z.enum(["individual", "company", "institution", "government"]),
      country_code: z.string().length(2),
      registration_no: z.string().max(80).nullable().optional(),
      tax_id: z.string().max(80).nullable().optional(),
      eori_no: z.string().max(80).nullable().optional(),
      address: z.string().max(400).nullable().optional(),
      contact_email: z.string().max(200).nullable().optional(),
      pi_username: z.string().max(80).nullable().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const row = { ...data, owner_id: context.userId };
    const { data: saved, error } = await context.supabase
      .from("organizations").upsert(row).select("*").single();
    if (error) throw new Error(error.message);
    return saved;
  });
