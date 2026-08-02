// International trade standards reference used across the platform.
// Incoterms® 2020 (ICC pub. 723E), UCP 600 documentary-credit release logic,
// UN/CEFACT document set, and WCO HS classification conventions.

import type { Incoterm, TransportMode, TradeDocType } from "./types";

export interface IncotermSpec {
  code: Incoterm;
  name: string;
  modes: "any" | "sea";
  riskTransfer: string;
  sellerPays: string[];
  buyerPays: string[];
  insuranceDuty: "seller-min" | "seller-max" | "buyer" | "none";
  exportClearance: "seller" | "buyer";
  importClearance: "seller" | "buyer";
  summary: string;
}

// Incoterms 2020 — all eleven rules, grouped by delivery point.
export const INCOTERMS: IncotermSpec[] = [
  {
    code: "EXW", name: "Ex Works", modes: "any",
    riskTransfer: "At seller's premises, when goods are placed at buyer's disposal.",
    sellerPays: ["Packing", "Making goods available"],
    buyerPays: ["Loading", "Export clearance", "Main carriage", "Insurance", "Import duties", "Delivery"],
    insuranceDuty: "none", exportClearance: "buyer", importClearance: "buyer",
    summary: "Minimum obligation for the seller. Buyer bears everything from the factory gate.",
  },
  {
    code: "FCA", name: "Free Carrier", modes: "any",
    riskTransfer: "When goods are handed to the buyer's carrier at the named place.",
    sellerPays: ["Packing", "Export clearance", "Delivery to carrier"],
    buyerPays: ["Main carriage", "Insurance", "Import duties", "Onward delivery"],
    insuranceDuty: "none", exportClearance: "seller", importClearance: "buyer",
    summary: "The 2020 default for containerised cargo; supports on-board B/L notation.",
  },
  {
    code: "FAS", name: "Free Alongside Ship", modes: "sea",
    riskTransfer: "When goods are placed alongside the vessel at the named port of shipment.",
    sellerPays: ["Packing", "Export clearance", "Delivery alongside vessel"],
    buyerPays: ["Loading", "Ocean freight", "Insurance", "Import duties"],
    insuranceDuty: "none", exportClearance: "seller", importClearance: "buyer",
    summary: "Bulk and break-bulk cargo only. Risk passes on the quay.",
  },
  {
    code: "FOB", name: "Free On Board", modes: "sea",
    riskTransfer: "When goods are on board the vessel at the named port of shipment.",
    sellerPays: ["Packing", "Export clearance", "Loading on board"],
    buyerPays: ["Ocean freight", "Insurance", "Import duties", "Delivery"],
    insuranceDuty: "none", exportClearance: "seller", importClearance: "buyer",
    summary: "Classic sea-freight term. Do not use for containers — use FCA.",
  },
  {
    code: "CFR", name: "Cost and Freight", modes: "sea",
    riskTransfer: "On board at origin port — risk and cost split at different points.",
    sellerPays: ["Export clearance", "Ocean freight to destination port"],
    buyerPays: ["Insurance", "Discharge", "Import duties", "Delivery"],
    insuranceDuty: "buyer", exportClearance: "seller", importClearance: "buyer",
    summary: "Seller pays freight but carries no risk after loading.",
  },
  {
    code: "CIF", name: "Cost, Insurance and Freight", modes: "sea",
    riskTransfer: "On board at origin port; seller must insure to destination port.",
    sellerPays: ["Export clearance", "Ocean freight", "Minimum cargo insurance (ICC C, 110%)"],
    buyerPays: ["Discharge", "Import duties", "Delivery"],
    insuranceDuty: "seller-min", exportClearance: "seller", importClearance: "buyer",
    summary: "The most common documentary-credit term for bulk sea freight.",
  },
  {
    code: "CPT", name: "Carriage Paid To", modes: "any",
    riskTransfer: "When goods are handed to the first carrier.",
    sellerPays: ["Export clearance", "Carriage to named destination"],
    buyerPays: ["Insurance", "Import duties", "Unloading"],
    insuranceDuty: "buyer", exportClearance: "seller", importClearance: "buyer",
    summary: "Multimodal equivalent of CFR.",
  },
  {
    code: "CIP", name: "Carriage and Insurance Paid To", modes: "any",
    riskTransfer: "When goods are handed to the first carrier; seller insures to destination.",
    sellerPays: ["Export clearance", "Carriage", "All-risks insurance (ICC A, 110%)"],
    buyerPays: ["Import duties", "Unloading"],
    insuranceDuty: "seller-max", exportClearance: "seller", importClearance: "buyer",
    summary: "Incoterms 2020 raised CIP cover to Institute Cargo Clauses (A).",
  },
  {
    code: "DAP", name: "Delivered At Place", modes: "any",
    riskTransfer: "On arrival at the named place, ready for unloading.",
    sellerPays: ["Export clearance", "Full carriage to destination"],
    buyerPays: ["Unloading", "Import clearance", "Duties and taxes"],
    insuranceDuty: "none", exportClearance: "seller", importClearance: "buyer",
    summary: "Seller carries risk the whole way but does not clear import.",
  },
  {
    code: "DPU", name: "Delivered at Place Unloaded", modes: "any",
    riskTransfer: "Once goods are unloaded at the named place of destination.",
    sellerPays: ["Export clearance", "Carriage", "Unloading"],
    buyerPays: ["Import clearance", "Duties and taxes"],
    insuranceDuty: "none", exportClearance: "seller", importClearance: "buyer",
    summary: "The only rule that obliges the seller to unload.",
  },
  {
    code: "DDP", name: "Delivered Duty Paid", modes: "any",
    riskTransfer: "On arrival at the buyer's named place, cleared for import.",
    sellerPays: ["Export clearance", "Carriage", "Import clearance", "Duties and taxes"],
    buyerPays: ["Unloading"],
    insuranceDuty: "none", exportClearance: "seller", importClearance: "seller",
    summary: "Maximum obligation for the seller — landed-cost pricing.",
  },
];

export function incoterm(code: Incoterm): IncotermSpec {
  return INCOTERMS.find((i) => i.code === code) ?? INCOTERMS[5]!;
}

export const TRANSPORT_MODES: { value: TransportMode; label: string }[] = [
  { value: "sea", label: "Sea freight (FCL/LCL)" },
  { value: "air", label: "Air freight" },
  { value: "road", label: "Road haulage" },
  { value: "rail", label: "Rail freight" },
  { value: "multimodal", label: "Multimodal" },
  { value: "post", label: "Post / courier" },
];

export const CATEGORIES = [
  "Agricultural goods",
  "Industrial equipment",
  "Raw materials",
  "Medical supplies",
  "Electronics",
  "Textiles & apparel",
  "Energy & fuels",
  "Chemicals & fertilisers",
  "Vehicles & parts",
  "Construction materials",
  "Food & beverages",
  "Metals & minerals",
];

export const UNITS = [
  "units", "pcs", "kg", "tonnes", "litres", "m3", "cartons", "pallets",
  "containers (20ft)", "containers (40ft)", "barrels", "rolls",
];

// UN/CEFACT aligned document set with the party normally responsible.
export const DOC_CATALOGUE: {
  type: TradeDocType;
  label: string;
  issuedBy: string;
  standard: string;
}[] = [
  { type: "commercial_invoice", label: "Commercial Invoice", issuedBy: "Seller", standard: "UN/CEFACT CII D22B" },
  { type: "packing_list", label: "Packing List", issuedBy: "Seller", standard: "UN/CEFACT" },
  { type: "certificate_of_origin", label: "Certificate of Origin", issuedBy: "Chamber of Commerce", standard: "ICC / WCO Kyoto" },
  { type: "bill_of_lading", label: "Bill of Lading (eB/L)", issuedBy: "Carrier", standard: "MLETR / DCSA eBL" },
  { type: "air_waybill", label: "Air Waybill", issuedBy: "Airline", standard: "IATA e-AWB" },
  { type: "insurance_certificate", label: "Insurance Certificate", issuedBy: "Insurer", standard: "Institute Cargo Clauses" },
  { type: "inspection_certificate", label: "Inspection Certificate", issuedBy: "Third-party inspector", standard: "ISO/IEC 17020" },
  { type: "phytosanitary", label: "Phytosanitary Certificate", issuedBy: "Plant protection authority", standard: "IPPC ISPM 12" },
  { type: "export_licence", label: "Export Licence", issuedBy: "Export control authority", standard: "National control regime" },
  { type: "customs_declaration", label: "Customs Declaration", issuedBy: "Broker", standard: "WCO Data Model 3" },
];

export interface MilestoneTemplate {
  key: string;
  label: string;
  release_pct: number;
  required_docs: string[];
}

// UCP 600 style documentary release schedule. Weightings follow the risk and
// cost transfer point of the selected Incoterm.
export function milestoneTemplate(term: Incoterm): MilestoneTemplate[] {
  const early = ["EXW", "FCA", "FAS", "FOB", "CFR", "CIF", "CPT", "CIP"].includes(term);
  const doorToDoor = term === "DDP";
  const base: MilestoneTemplate[] = [
    { key: "contract_signed", label: "Contract executed by both parties", release_pct: 0, required_docs: [] },
    { key: "goods_ready", label: "Goods produced and ready for inspection", release_pct: 10, required_docs: ["Inspection Certificate"] },
    { key: "goods_loaded", label: "Goods handed to carrier / loaded", release_pct: 20, required_docs: ["Commercial Invoice", "Packing List"] },
    { key: "shipment_departed", label: "Shipment departed origin", release_pct: 25, required_docs: ["Bill of Lading (eB/L)", "Certificate of Origin"] },
    { key: "arrived_destination", label: "Arrived at destination", release_pct: 20, required_docs: [] },
    { key: "customs_cleared", label: "Import customs cleared", release_pct: 15, required_docs: ["Customs Declaration"] },
    { key: "delivered", label: "Delivered and accepted by buyer", release_pct: 10, required_docs: [] },
  ];
  const adjust = (key: string, pct: number) => (m: MilestoneTemplate) =>
    m.key === key ? { ...m, release_pct: pct } : m;

  let out = base;
  if (early && (term === "EXW" || term === "FCA" || term === "FAS" || term === "FOB")) {
    // Risk passes at origin — weight the release toward loading/departure.
    out = out.map(adjust("goods_loaded", 35)).map(adjust("shipment_departed", 30))
      .map(adjust("arrived_destination", 10)).map(adjust("customs_cleared", 10))
      .map(adjust("delivered", 5));
  } else if (doorToDoor) {
    out = out.map(adjust("goods_loaded", 10)).map(adjust("shipment_departed", 15))
      .map(adjust("arrived_destination", 20)).map(adjust("customs_cleared", 20))
      .map(adjust("delivered", 25));
  }
  return out;
}

export const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  pending_counterparty: "Awaiting counterparty",
  signed: "Executed — awaiting funding",
  funded: "Escrow funded",
  in_transit: "In transit",
  customs: "At customs",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  disputed: "Disputed",
};

export const STATUS_TONE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_counterparty: "bg-amber-500/15 text-amber-300",
  signed: "bg-sky-500/15 text-sky-300",
  funded: "bg-gold/15 text-gold",
  in_transit: "bg-blue-500/15 text-blue-300",
  customs: "bg-purple-500/15 text-purple-300",
  delivered: "bg-emerald-500/15 text-emerald-300",
  completed: "bg-emerald-500/20 text-emerald-300",
  cancelled: "bg-destructive/15 text-destructive",
  disputed: "bg-destructive/20 text-destructive",
};

export const COUNTRIES = [
  "AE","AR","AU","BD","BE","BR","CA","CH","CL","CN","CO","CZ","DE","DK","EG","ES","ET","FI","FR","GB",
  "GH","GR","HK","HU","ID","IE","IL","IN","IQ","IT","JP","KE","KR","KW","MA","MX","MY","NG","NL","NO",
  "NZ","OM","PE","PH","PK","PL","PT","QA","RO","SA","SE","SG","TH","TR","TW","TZ","UA","US","UZ","VN",
  "ZA",
];

export const COUNTRY_NAME: Record<string, string> = {
  AE: "United Arab Emirates", AR: "Argentina", AU: "Australia", BD: "Bangladesh", BE: "Belgium",
  BR: "Brazil", CA: "Canada", CH: "Switzerland", CL: "Chile", CN: "China", CO: "Colombia",
  CZ: "Czechia", DE: "Germany", DK: "Denmark", EG: "Egypt", ES: "Spain", ET: "Ethiopia",
  FI: "Finland", FR: "France", GB: "United Kingdom", GH: "Ghana", GR: "Greece", HK: "Hong Kong",
  HU: "Hungary", ID: "Indonesia", IE: "Ireland", IL: "Israel", IN: "India", IQ: "Iraq", IT: "Italy",
  JP: "Japan", KE: "Kenya", KR: "South Korea", KW: "Kuwait", MA: "Morocco", MX: "Mexico",
  MY: "Malaysia", NG: "Nigeria", NL: "Netherlands", NO: "Norway", NZ: "New Zealand", OM: "Oman",
  PE: "Peru", PH: "Philippines", PK: "Pakistan", PL: "Poland", PT: "Portugal", QA: "Qatar",
  RO: "Romania", SA: "Saudi Arabia", SE: "Sweden", SG: "Singapore", TH: "Thailand", TR: "Türkiye",
  TW: "Taiwan", TZ: "Tanzania", UA: "Ukraine", US: "United States", UZ: "Uzbekistan",
  VN: "Vietnam", ZA: "South Africa",
};

export function countryLabel(code?: string | null): string {
  if (!code) return "—";
  return COUNTRY_NAME[code] ? `${COUNTRY_NAME[code]} (${code})` : code;
}
