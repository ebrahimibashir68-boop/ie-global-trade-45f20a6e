// Domain types for the PiTrade trade-desk. These mirror the database schema
// (Lovable Cloud) and are shared between server functions and the UI.

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type EntityType = "individual" | "company" | "institution" | "government";

export type Incoterm =
  | "EXW" | "FCA" | "FAS" | "FOB" | "CFR" | "CIF"
  | "CPT" | "CIP" | "DAP" | "DPU" | "DDP";

export type ContractStatus =
  | "draft" | "pending_counterparty" | "signed" | "funded"
  | "in_transit" | "customs" | "delivered" | "completed"
  | "cancelled" | "disputed";

export type TransportMode = "sea" | "air" | "road" | "rail" | "multimodal" | "post";

export type TradeDocType =
  | "commercial_invoice" | "packing_list" | "certificate_of_origin"
  | "bill_of_lading" | "air_waybill" | "insurance_certificate"
  | "inspection_certificate" | "phytosanitary" | "export_licence"
  | "customs_declaration" | "other";

export type ScreeningOutcome = "clear" | "review" | "blocked";

export interface Organization {
  id: string;
  owner_id: string;
  legal_name: string;
  entity_type: EntityType;
  country_code: string;
  registration_no: string | null;
  tax_id: string | null;
  eori_no: string | null;
  address: string | null;
  contact_email: string | null;
  pi_username: string | null;
  created_at: string;
}

export interface TradeContract {
  id: string;
  reference: string;
  created_by: string;
  buyer_user_id: string | null;
  seller_user_id: string | null;
  buyer_org_id: string | null;
  seller_org_id: string | null;
  buyer_legal_name: string | null;
  seller_legal_name: string | null;
  counterparty_email: string | null;
  title: string;
  goods_description: string;
  hs_code: string | null;
  category: string | null;
  quantity: number;
  unit: string;
  net_weight_kg: number | null;
  gross_weight_kg: number | null;
  volume_m3: number | null;
  package_count: number | null;
  origin_country: string;
  destination_country: string;
  incoterm: Incoterm;
  named_place: string | null;
  port_of_loading: string | null;
  port_of_discharge: string | null;
  currency: string;
  contract_value: number;
  amount_pi: number;
  payment_terms: string | null;
  transport_mode: TransportMode;
  carrier: string | null;
  vessel_or_flight: string | null;
  container_no: string | null;
  transport_doc_no: string | null;
  etd: string | null;
  eta: string | null;
  insurer: string | null;
  policy_no: string | null;
  insured_value: number | null;
  insurance_clauses: string | null;
  duty_estimate: number | null;
  vat_estimate: number | null;
  compliance_notes: string | null;
  status: ContractStatus;
  pi_payment_id: string | null;
  pi_txid: string | null;
  funded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  contract_id: string;
  seq: number;
  key: string;
  label: string;
  release_pct: number;
  required_docs: string[];
  completed_at: string | null;
  completed_by: string | null;
  note: string | null;
}

export interface ContractSignature {
  id: string;
  contract_id: string;
  role: string;
  signer_name: string;
  hash: string;
  signed_at: string;
}

export interface ContractDocument {
  id: string;
  contract_id: string;
  doc_type: TradeDocType;
  doc_number: string | null;
  issuer: string | null;
  issued_at: string;
  payload: Record<string, JsonValue>;
  hash: string | null;
}

export interface ContractEvent {
  id: string;
  contract_id: string;
  event_type: string;
  detail: Record<string, JsonValue>;
  created_at: string;
}

export interface Screening {
  id: string;
  contract_id: string;
  outcome: ScreeningOutcome;
  matches: Array<{ kind: string; label: string; detail: string }>;
  checks: Array<{ name: string; passed: boolean; note: string }>;
  created_at: string;
}

export interface ContractBundle {
  contract: TradeContract;
  milestones: Milestone[];
  signatures: ContractSignature[];
  documents: ContractDocument[];
  events: ContractEvent[];
  screenings: Screening[];
}
