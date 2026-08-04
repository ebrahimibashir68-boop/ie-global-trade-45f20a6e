// Server-only: the tool belt the PiTrade AI agents use to actually operate the
// app on the user's behalf. Every database call runs through a Supabase client
// carrying the caller's bearer token, so RLS scopes access to their contracts.

import { createClient } from "@supabase/supabase-js";
import { tool, type ToolSet } from "ai";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { estimateLandedCost, screenTrade } from "@/lib/trade/compliance";
import { INCOTERMS, milestoneTemplate } from "@/lib/trade/standards";
import type { AgentId } from "@/lib/ai/agents";

type Client = ReturnType<typeof createClient<Database>>;

function makeClient(token?: string): Client {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        if (token) h.set("Authorization", `Bearer ${token}`);
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export async function resolveUser(token?: string) {
  if (!token || token.split(".").length !== 3) return null;
  const sb = makeClient(token);
  const { data, error } = await sb.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  return { sb, userId: String(data.claims.sub) };
}

const CONTRACT_FIELDS = `id, reference, buyer_user_id, seller_user_id, buyer_legal_name, seller_legal_name,
  title, goods_description, hs_code, category, quantity, unit, origin_country, destination_country, incoterm,
  named_place, port_of_loading, port_of_discharge, currency, contract_value, amount_pi, payment_terms,
  transport_mode, carrier, etd, eta, insurer, policy_no, duty_estimate, vat_estimate, status,
  pi_payment_id, pi_txid, created_at`;

async function findContract(sb: Client, ref: string) {
  const isUuid = /^[0-9a-f-]{36}$/i.test(ref);
  const q = sb.from("trade_contracts").select(CONTRACT_FIELDS);
  const { data, error } = isUuid
    ? await q.eq("id", ref).maybeSingle()
    : await q.ilike("reference", ref.trim()).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`No contract found for "${ref}". Use list_contracts first.`);
  return data as Record<string, unknown> & { id: string };
}

const INCOTERM_ENUM = z.enum([
  "EXW", "FCA", "FAS", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP",
]);

// ---------------------------------------------------------------- public tools

function publicTools(): ToolSet {
  const sb = makeClient();
  return {
    search_hs_codes: tool({
      description: "Search the HS (Harmonized System) tariff nomenclature by keyword or code prefix to classify goods.",
      inputSchema: z.object({ query: z.string().describe("Goods keyword or HS code prefix") }),
      execute: async ({ query }) => {
        const term = query.trim();
        let q = sb.from("hs_codes").select("code, chapter, description, unit").limit(12);
        if (term) q = q.or(`description.ilike.%${term}%,code.ilike.${term}%`);
        const { data, error } = await q.order("code");
        if (error) throw new Error(error.message);
        return { results: data ?? [] };
      },
    }),
    estimate_landed_cost: tool({
      description: "Estimate import duty, VAT and total landed cost for a goods value, HS code and destination country (ISO-2).",
      inputSchema: z.object({
        hsCode: z.string(),
        destination: z.string().describe("ISO-2 destination country code"),
        value: z.number().describe("Goods value in the contract currency"),
      }),
      execute: async ({ hsCode, destination, value }) => {
        const { data, error } = await sb
          .from("duty_rates")
          .select("destination_country, hs_prefix, duty_pct, vat_pct, note")
          .eq("destination_country", destination.toUpperCase());
        if (error) throw new Error(error.message);
        return estimateLandedCost(value, hsCode, destination.toUpperCase(), data ?? []);
      },
    }),
    explain_incoterm: tool({
      description: "Explain an Incoterms 2020 rule: cost and risk transfer, who insures, who clears customs.",
      inputSchema: z.object({ code: INCOTERM_ENUM }),
      execute: async ({ code }) => INCOTERMS.find((i) => i.code === code) ?? { error: "Unknown Incoterm" },
    }),
    milestone_plan: tool({
      description: "Show the Incoterm-weighted escrow milestone plan (release percentages and required documents) for a rule.",
      inputSchema: z.object({ incoterm: INCOTERM_ENUM }),
      execute: async ({ incoterm }) => ({ milestones: milestoneTemplate(incoterm) }),
    }),
  };
}

// ------------------------------------------------------------ authed tool sets

function contractTools(sb: Client, userId: string): ToolSet {
  return {
    list_contracts: tool({
      description: "List the signed-in user's trade contracts with status, route, value and Pi amount.",
      inputSchema: z.object({
        status: z.string().nullable().describe("Optional status filter, or null for all"),
      }),
      execute: async ({ status }) => {
        let q = sb.from("trade_contracts").select(CONTRACT_FIELDS).order("created_at", { ascending: false }).limit(25);
        if (status) q = q.eq("status", status);
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        return { contracts: data ?? [] };
      },
    }),
    get_contract: tool({
      description: "Get one contract in full, including milestones, signatures, documents and recent events.",
      inputSchema: z.object({ ref: z.string().describe("Contract reference (PT-…) or id") }),
      execute: async ({ ref }) => {
        const contract = await findContract(sb, ref);
        const [milestones, signatures, documents] = await Promise.all([
          sb.from("contract_milestones").select("id, seq, key, label, release_pct, required_docs, completed_at").eq("contract_id", contract.id).order("seq"),
          sb.from("contract_signatures").select("role, signer_name, hash, created_at").eq("contract_id", contract.id),
          sb.from("contract_documents").select("id, doc_type, doc_number, issuer, hash, issued_at").eq("contract_id", contract.id),
        ]);
        return {
          contract,
          milestones: milestones.data ?? [],
          signatures: signatures.data ?? [],
          documents: documents.data ?? [],
        };
      },
    }),
    create_contract: tool({
      description:
        "Create a new draft trade contract for the user, with Incoterm-weighted escrow milestones. Ask the user for any missing essential detail before calling.",
      inputSchema: z.object({
        title: z.string(),
        goods_description: z.string(),
        hs_code: z.string().nullable(),
        category: z.string().nullable(),
        quantity: z.number(),
        unit: z.string(),
        origin_country: z.string().describe("ISO-2"),
        destination_country: z.string().describe("ISO-2"),
        incoterm: INCOTERM_ENUM,
        named_place: z.string().nullable(),
        port_of_loading: z.string().nullable(),
        port_of_discharge: z.string().nullable(),
        currency: z.string().describe("ISO-3 currency, e.g. USD"),
        contract_value: z.number(),
        amount_pi: z.number().describe("Settlement amount in π"),
        transport_mode: z.enum(["sea", "air", "road", "rail", "multimodal", "post"]),
        buyer_legal_name: z.string().nullable(),
        seller_legal_name: z.string().nullable(),
        counterparty_email: z.string().nullable(),
        side: z.enum(["buyer", "seller"]).describe("Which side the signed-in user is on"),
      }),
      execute: async (input) => {
        const { side, ...fields } = input;
        const row = {
          ...fields,
          origin_country: fields.origin_country.toUpperCase(),
          destination_country: fields.destination_country.toUpperCase(),
          currency: fields.currency.toUpperCase(),
          created_by: userId,
          buyer_user_id: side === "buyer" ? userId : null,
          seller_user_id: side === "seller" ? userId : null,
          status: "draft" as const,
        };
        const { data: created, error } = await sb
          .from("trade_contracts")
          .insert(row as never)
          .select(CONTRACT_FIELDS)
          .single();
        if (error) throw new Error(error.message);
        const c = created as unknown as { id: string; reference: string };
        await sb.from("contract_milestones").insert(
          milestoneTemplate(input.incoterm).map((m, i) => ({
            contract_id: c.id, seq: i, key: m.key, label: m.label,
            release_pct: m.release_pct, required_docs: m.required_docs,
          })) as never,
        );
        await sb.from("contract_events").insert({
          contract_id: c.id, actor_id: userId, event_type: "contract_created",
          detail: { reference: c.reference, via: "ai_agent" },
        } as never);
        return { created, url: `/contracts/${c.id}` };
      },
    }),
    update_contract: tool({
      description: "Update commercial, logistics or insurance fields on an existing contract.",
      inputSchema: z.object({
        ref: z.string(),
        patch: z.record(z.string(), z.union([z.string(), z.number(), z.null()])).describe(
          "Field/value pairs, e.g. { carrier: 'Maersk', eta: '2026-09-01' }",
        ),
      }),
      execute: async ({ ref, patch }) => {
        const allowed = new Set([
          "title","goods_description","hs_code","category","quantity","unit","named_place","port_of_loading",
          "port_of_discharge","currency","contract_value","amount_pi","payment_terms","transport_mode","carrier",
          "vessel_or_flight","container_no","transport_doc_no","etd","eta","insurer","policy_no","insured_value",
          "insurance_clauses","compliance_notes","buyer_legal_name","seller_legal_name","counterparty_email",
        ]);
        const clean: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(patch)) if (allowed.has(k)) clean[k] = v;
        if (!Object.keys(clean).length) throw new Error("No updatable fields supplied");
        const contract = await findContract(sb, ref);
        const { error } = await sb.from("trade_contracts").update(clean as never).eq("id", contract.id);
        if (error) throw new Error(error.message);
        await sb.from("contract_events").insert({
          contract_id: contract.id, actor_id: userId, event_type: "contract_updated",
          detail: { fields: Object.keys(clean), via: "ai_agent" },
        } as never);
        return { ok: true, updated: Object.keys(clean) };
      },
    }),
    sign_contract: tool({
      description:
        "Cryptographically sign a contract as the signed-in user (SHA-256 over the contract snapshot). Requires explicit user confirmation first.",
      inputSchema: z.object({
        ref: z.string(),
        role: z.enum(["buyer", "seller"]),
        signerName: z.string().describe("Full legal name of the signatory"),
      }),
      execute: async ({ ref, role, signerName }) => {
        const contract = await findContract(sb, ref);
        const { createHash } = await import("crypto");
        const hash = createHash("sha256")
          .update(JSON.stringify({ ...contract, role, signer: signerName }))
          .digest("hex");
        const { error } = await sb.from("contract_signatures").insert({
          contract_id: contract.id, role, signer_user_id: userId, signer_name: signerName, hash,
        } as never);
        if (error) throw new Error(error.message.includes("duplicate") ? "This party has already signed" : error.message);
        const { data: sigs } = await sb.from("contract_signatures").select("role").eq("contract_id", contract.id);
        const both = (sigs ?? []).some((s) => s.role === "buyer") && (sigs ?? []).some((s) => s.role === "seller");
        await sb.from("trade_contracts")
          .update({ status: both ? "signed" : "pending_counterparty" } as never)
          .eq("id", contract.id);
        await sb.from("contract_events").insert({
          contract_id: contract.id, actor_id: userId, event_type: "contract_signed",
          detail: { role, signer: signerName, hash, via: "ai_agent" },
        } as never);
        return { hash, fullyExecuted: both };
      },
    }),
    complete_milestone: tool({
      description: "Mark the next (or a named) escrow milestone on a contract as completed, releasing its share of escrow.",
      inputSchema: z.object({
        ref: z.string(),
        milestoneKey: z.string().nullable().describe("Milestone key, or null for the next open one"),
        note: z.string().nullable(),
      }),
      execute: async ({ ref, milestoneKey, note }) => {
        const contract = await findContract(sb, ref);
        let q = sb.from("contract_milestones").select("id, key, label, release_pct")
          .eq("contract_id", contract.id).is("completed_at", null).order("seq").limit(1);
        if (milestoneKey) q = q.eq("key", milestoneKey);
        const { data: open, error } = await q;
        if (error) throw new Error(error.message);
        const target = open?.[0];
        if (!target) throw new Error("No open milestone matches");
        await sb.from("contract_milestones")
          .update({ completed_at: new Date().toISOString(), completed_by: userId, note: note ?? null } as never)
          .eq("id", target.id);
        const statusByKey: Record<string, string> = {
          shipment_departed: "in_transit", arrived_destination: "in_transit",
          customs_cleared: "customs", delivered: "delivered",
        };
        const next = statusByKey[target.key];
        if (next) await sb.from("trade_contracts").update({ status: next } as never).eq("id", contract.id);
        await sb.from("contract_events").insert({
          contract_id: contract.id, actor_id: userId, event_type: "milestone_completed",
          detail: { key: target.key, label: target.label, via: "ai_agent" },
        } as never);
        return { completed: target };
      },
    }),
  };
}

function complianceTools(sb: Client, userId: string): ToolSet {
  return {
    run_screening: tool({
      description:
        "Run a full compliance screening on a contract: denied-party matching, controlled/dual-use goods, route and insurance checks, plus duty and VAT estimates.",
      inputSchema: z.object({ ref: z.string() }),
      execute: async ({ ref }) => {
        const c = await findContract(sb, ref) as never as Record<string, string | number | null> & { id: string };
        const [denied, controlled, rates] = await Promise.all([
          sb.from("denied_parties").select("id, name, country_code, list_source, reason"),
          sb.from("controlled_goods").select("id, hs_prefix, regime, description, severity"),
          sb.from("duty_rates").select("destination_country, hs_prefix, duty_pct, vat_pct, note")
            .eq("destination_country", String(c["destination_country"])),
        ]);
        const result = screenTrade(
          {
            buyerName: c["buyer_legal_name"] as string | null,
            sellerName: c["seller_legal_name"] as string | null,
            originCountry: String(c["origin_country"]),
            destinationCountry: String(c["destination_country"]),
            hsCode: c["hs_code"] as string | null,
            goods: String(c["goods_description"] ?? ""),
            incoterm: String(c["incoterm"]) as never,
            hasInsurance: Boolean(c["insurer"] || c["policy_no"]),
          },
          denied.data ?? [],
          (controlled.data ?? []) as never,
        );
        const landed = estimateLandedCost(
          Number(c["contract_value"] ?? 0), c["hs_code"] as string | null,
          String(c["destination_country"]), rates.data ?? [],
        );
        await sb.from("compliance_screenings").insert({
          contract_id: c.id, outcome: result.outcome,
          matches: result.matches as never, checks: result.checks as never, screened_by: userId,
        } as never);
        await sb.from("trade_contracts")
          .update({ duty_estimate: landed.duty, vat_estimate: landed.vat } as never)
          .eq("id", c.id);
        return { ...result, landed };
      },
    }),
  };
}

function documentTools(sb: Client, userId: string): ToolSet {
  return {
    issue_document: tool({
      description:
        "Issue a UN/CEFACT-style trade document against a contract (commercial invoice, packing list, certificate of origin, bill of lading, insurance certificate, etc.). The document is hashed and recorded on the contract.",
      inputSchema: z.object({
        ref: z.string(),
        docType: z.enum([
          "commercial_invoice","packing_list","certificate_of_origin","bill_of_lading","air_waybill",
          "insurance_certificate","inspection_certificate","phytosanitary","export_licence",
          "customs_declaration","other",
        ]),
        docNumber: z.string().nullable(),
        issuer: z.string().nullable(),
        notes: z.string().nullable().describe("Free-text content or remarks to embed in the document payload"),
      }),
      execute: async ({ ref, docType, docNumber, issuer, notes }) => {
        const c = await findContract(sb, ref);
        const payload = { generated_by: "ai_agent", notes, contract_reference: c["reference"] };
        const { createHash } = await import("crypto");
        const hash = createHash("sha256")
          .update(JSON.stringify({ c: c.id, t: docType, n: docNumber, p: payload }))
          .digest("hex");
        const { data: doc, error } = await sb.from("contract_documents").insert({
          contract_id: c.id, doc_type: docType, doc_number: docNumber, issuer,
          payload: payload as never, hash, created_by: userId,
        } as never).select("id, doc_type, doc_number, issuer, hash, issued_at").single();
        if (error) throw new Error(error.message);
        await sb.from("contract_events").insert({
          contract_id: c.id, actor_id: userId, event_type: "document_issued",
          detail: { doc_type: docType, hash, via: "ai_agent" },
        } as never);
        return { document: doc, url: `/contracts/${c.id}` };
      },
    }),
  };
}

function piTools(sb: Client, userId: string): ToolSet {
  return {
    record_pi_payment: tool({
      description:
        "Record a completed Pi Wallet payment against a contract and move it to funded. Only call after the user confirms the payment id and transaction id.",
      inputSchema: z.object({ ref: z.string(), paymentId: z.string(), txid: z.string() }),
      execute: async ({ ref, paymentId, txid }) => {
        const c = await findContract(sb, ref);
        const { error } = await sb.from("trade_contracts").update({
          pi_payment_id: paymentId, pi_txid: txid, status: "funded", funded_at: new Date().toISOString(),
        } as never).eq("id", c.id);
        if (error) throw new Error(error.message);
        await sb.from("contract_events").insert({
          contract_id: c.id, actor_id: userId, event_type: "escrow_funded",
          detail: { payment_id: paymentId, txid, via: "ai_agent" },
        } as never);
        return { ok: true, reference: c["reference"] };
      },
    }),
    escrow_status: tool({
      description: "Report escrow funding and release progress for a contract, milestone by milestone.",
      inputSchema: z.object({ ref: z.string() }),
      execute: async ({ ref }) => {
        const c = await findContract(sb, ref);
        const { data: ms } = await sb.from("contract_milestones")
          .select("seq, key, label, release_pct, completed_at").eq("contract_id", c.id).order("seq");
        const released = (ms ?? []).filter((m) => m.completed_at).reduce((s, m) => s + Number(m.release_pct), 0);
        return {
          reference: c["reference"], status: c["status"], amount_pi: c["amount_pi"],
          funded: Boolean(c["pi_payment_id"]), released_pct: released, milestones: ms ?? [],
        };
      },
    }),
  };
}

export function buildAgentTools(agent: AgentId, session: { sb: Client; userId: string } | null): ToolSet {
  const base = publicTools();
  if (!session) return base;
  const { sb, userId } = session;
  const contracts = contractTools(sb, userId);
  switch (agent) {
    case "compliance":
      return { ...base, ...contractTools(sb, userId), ...complianceTools(sb, userId) };
    case "docs":
      return { ...base, list_contracts: contracts["list_contracts"]!, get_contract: contracts["get_contract"]!, ...documentTools(sb, userId) };
    case "pi":
      return { ...base, list_contracts: contracts["list_contracts"]!, get_contract: contracts["get_contract"]!, ...piTools(sb, userId) };
    default:
      return { ...base, ...contracts, ...complianceTools(sb, userId), ...documentTools(sb, userId), ...piTools(sb, userId) };
  }
}
