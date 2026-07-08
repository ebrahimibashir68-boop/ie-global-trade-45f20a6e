// Lightweight client-side smart-contract store (localStorage).
// Each contract represents an import/export agreement settled in Pi and
// carries everything a traditional cross-border trade file needs:
// parties, HS/customs, Incoterm, shipping/logistics, insurance,
// documentary requirements and LC-style escrow milestones.

export type Incoterm = "EXW" | "FOB" | "CIF" | "DAP" | "DDP";
export type ContractStatus =
  | "draft"
  | "awaiting_payment"
  | "funded"
  | "in_transit"
  | "completed"
  | "cancelled";

export type PartyType = "individual" | "company" | "institution" | "country";

export type Party = {
  type: PartyType;
  legalName: string;
  piUsername: string;
  countryCode: string;
  registrationNo?: string; // company reg / passport / gov id / tax id
  address?: string;
};

export type Intermediary = {
  role: "forwarder" | "broker" | "inspector";
  name: string;
  countryCode?: string;
  contact?: string; // email / phone / license #
  licenseNo?: string;
};

export type Shipping = {
  mode: "sea" | "air" | "road" | "rail" | "multimodal";
  carrier?: string;
  vesselOrFlight?: string;
  containerNo?: string;
  bolAwbNo?: string; // Bill of Lading / Airway Bill number
  portOfLoading?: string;
  portOfDischarge?: string;
  etd?: string; // ISO date
  eta?: string; // ISO date
  trackingUrl?: string;
  packageCount?: number;
  grossWeightKg?: number;
  netWeightKg?: number;
  volumeM3?: number;
};

export type Insurance = {
  insurer?: string;
  policyNo?: string;
  coveragePi?: number;
  clauses?: string; // e.g. "Institute Cargo Clauses (A)"
};

// LC-style escrow milestones. Funds are released to seller as each
// milestone is verified & marked complete.
export type MilestoneKey =
  | "contract_signed"
  | "goods_loaded"
  | "shipment_departed"
  | "arrived_destination"
  | "customs_cleared"
  | "delivered";

export type Milestone = {
  key: MilestoneKey;
  label: string;
  releasePct: number; // % of escrow released when this milestone completes
  requiredDocs?: string[]; // names from customsDocs the party must attach
  completedAt?: number;
  completedBy?: string;
  note?: string;
};

export type Signature = {
  role: "buyer" | "seller";
  signerName: string;
  signedAt: number;
  hash: string; // sha256 of canonical contract snapshot + role + signer name
};

export type Contract = {
  id: string;
  title: string;
  category: string;
  goods: string;
  hsCode?: string;
  quantity: number;
  unit: string;
  originCountry: string;
  destinationCountry: string;
  incoterm: Incoterm;
  currency?: string; // reference fiat currency, e.g. "USD" — informational only
  fiatEquivalent?: number; // reference value in `currency`
  buyerUsername: string;
  sellerUsername: string;
  buyer?: Party;
  seller?: Party;
  intermediaries?: Intermediary[];
  shipping?: Shipping;
  insurance?: Insurance;
  amountPi: number;
  memo: string;
  deliveryWindow?: string;
  customsDocs?: string[];
  complianceNotes?: string;
  milestones?: Milestone[];
  signatures?: Signature[];
  registeredAt?: number;
  status: ContractStatus;
  createdAt: number;
  paymentTxid?: string;
  paymentId?: string;
};


const KEY = "pi_trade_contracts_v1";

function read(): Contract[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as Contract[];
  } catch {
    return [];
  }
}

function write(list: Contract[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("contracts:changed"));
}

export function listContracts(): Contract[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function getContract(id: string): Contract | undefined {
  return read().find((c) => c.id === id);
}

// Standard LC-style milestone template keyed to the Incoterm — this mirrors
// the risk-transfer point in Incoterms 2020 and the typical documentary
// release schedule used by trade banks.
export function defaultMilestones(incoterm: Incoterm): Milestone[] {
  const base: Milestone[] = [
    { key: "contract_signed", label: "Contract signed by both parties", releasePct: 0 },
    { key: "goods_loaded", label: "Goods loaded / handed to carrier", releasePct: 20, requiredDocs: ["Packing List", "Commercial Invoice"] },
    { key: "shipment_departed", label: "Shipment departed origin", releasePct: 30, requiredDocs: ["Bill of Lading / Airway Bill"] },
    { key: "arrived_destination", label: "Arrived at destination port", releasePct: 20 },
    { key: "customs_cleared", label: "Customs cleared", releasePct: 20, requiredDocs: ["Certificate of Origin"] },
    { key: "delivered", label: "Delivered & accepted by buyer", releasePct: 10 },
  ];
  // EXW/FOB: risk transfers earlier → weight releases toward loading/departure.
  if (incoterm === "EXW" || incoterm === "FOB") {
    return base.map((m) =>
      m.key === "goods_loaded" ? { ...m, releasePct: 40 } :
      m.key === "shipment_departed" ? { ...m, releasePct: 30 } :
      m.key === "arrived_destination" ? { ...m, releasePct: 10 } :
      m.key === "customs_cleared" ? { ...m, releasePct: 10 } :
      m.key === "delivered" ? { ...m, releasePct: 10 } : m,
    );
  }
  // DDP: seller carries everything to buyer's door → weight releases toward delivery.
  if (incoterm === "DDP") {
    return base.map((m) =>
      m.key === "goods_loaded" ? { ...m, releasePct: 15 } :
      m.key === "shipment_departed" ? { ...m, releasePct: 15 } :
      m.key === "arrived_destination" ? { ...m, releasePct: 20 } :
      m.key === "customs_cleared" ? { ...m, releasePct: 20 } :
      m.key === "delivered" ? { ...m, releasePct: 30 } : m,
    );
  }
  return base;
}

export function createContract(
  data: Omit<Contract, "id" | "status" | "createdAt">,
): Contract {
  const contract: Contract = {
    ...data,
    id: "ct_" + Math.random().toString(36).slice(2, 10),
    status: "awaiting_payment",
    createdAt: Date.now(),
    milestones: data.milestones ?? defaultMilestones(data.incoterm),
  };
  write([contract, ...read()]);
  return contract;
}

export function updateContract(id: string, patch: Partial<Contract>) {
  const list = read().map((c) => (c.id === id ? { ...c, ...patch } : c));
  write(list);
}

export function deleteContract(id: string) {
  write(read().filter((c) => c.id !== id));
}

export function completeMilestone(id: string, key: MilestoneKey, by: string, note?: string) {
  const c = getContract(id);
  if (!c) throw new Error("Contract not found");
  const milestones = (c.milestones ?? defaultMilestones(c.incoterm)).map((m) =>
    m.key === key && !m.completedAt ? { ...m, completedAt: Date.now(), completedBy: by, note } : m,
  );
  // Sync top-level status when key milestones complete.
  let status: ContractStatus = c.status;
  const done = (k: MilestoneKey) => milestones.find((m) => m.key === k)?.completedAt;
  if (done("delivered")) status = "completed";
  else if (done("shipment_departed")) status = "in_transit";
  updateContract(id, { milestones, status });
}

export function releasedPct(c: Contract): number {
  const ms = c.milestones ?? [];
  return ms.reduce((sum, m) => sum + (m.completedAt ? m.releasePct : 0), 0);
}

// Canonical serialization for signing — excludes signatures/status/tx fields.
export function canonicalContractSnapshot(c: Contract): string {
  const {
    id, title, category, goods, hsCode, quantity, unit,
    originCountry, destinationCountry, incoterm,
    buyerUsername, sellerUsername, buyer, seller,
    intermediaries, shipping, insurance,
    amountPi, memo, deliveryWindow, customsDocs, complianceNotes,
    milestones, createdAt,
  } = c;
  return JSON.stringify({
    id, title, category, goods, hsCode, quantity, unit,
    originCountry, destinationCountry, incoterm,
    buyerUsername, sellerUsername, buyer, seller,
    intermediaries, shipping, insurance,
    amountPi, memo, deliveryWindow, customsDocs, complianceNotes,
    milestones: (milestones ?? []).map((m) => ({ key: m.key, label: m.label, releasePct: m.releasePct })),
    createdAt,
  });
}

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function signContract(id: string, role: "buyer" | "seller", signerName: string) {
  const c = getContract(id);
  if (!c) throw new Error("Contract not found");
  if ((c.signatures ?? []).some((s) => s.role === role)) {
    throw new Error(`${role} has already signed this contract`);
  }
  const hash = await sha256(canonicalContractSnapshot(c) + "::" + role + "::" + signerName);
  const sig: Signature = { role, signerName, signedAt: Date.now(), hash };
  const signatures = [...(c.signatures ?? []), sig];
  const bothSigned = signatures.some((s) => s.role === "buyer") && signatures.some((s) => s.role === "seller");
  // When both parties sign, auto-complete the "contract_signed" milestone.
  let milestones = c.milestones ?? defaultMilestones(c.incoterm);
  if (bothSigned) {
    milestones = milestones.map((m) =>
      m.key === "contract_signed" && !m.completedAt
        ? { ...m, completedAt: Date.now(), completedBy: "both parties" }
        : m,
    );
  }
  updateContract(id, {
    signatures,
    milestones,
    registeredAt: bothSigned ? Date.now() : c.registeredAt,
  });
  return sig;
}


export function seedIfEmpty() {
  if (read().length > 0) return;
  const samples: Contract[] = [
    {
      id: "ct_seed_1",
      title: "Arabica Green Coffee — 20ft FCL",
      category: "Agricultural goods",
      goods: "Arabica green coffee beans, washed, grade 1",
      hsCode: "0901.11",
      quantity: 18,
      unit: "tonnes",
      originCountry: "Ethiopia",
      destinationCountry: "Germany",
      incoterm: "CIF",
      buyerUsername: "hamburg_roasters",
      sellerUsername: "addis_exporters",
      amountPi: 12500,
      memo: "Trade #CFE-2026-0118 · Arabica FCL",
      shipping: {
        mode: "sea", carrier: "Maersk", portOfLoading: "Djibouti (DJIB)", portOfDischarge: "Hamburg (DEHAM)",
        containerNo: "MSKU7712300", bolAwbNo: "MAEU-238119920",
      },
      status: "funded",
      createdAt: Date.now() - 86400000,
      milestones: defaultMilestones("CIF"),
    },
    {
      id: "ct_seed_2",
      title: "Solar Inverters — 500 units",
      category: "Industrial equipment",
      goods: "3-phase grid-tie solar inverters, 10kW",
      hsCode: "8504.40",
      quantity: 500,
      unit: "units",
      originCountry: "China",
      destinationCountry: "Kenya",
      incoterm: "FOB",
      buyerUsername: "nairobi_energy",
      sellerUsername: "shenzhen_power",
      amountPi: 84000,
      memo: "Trade #INV-10K-500",
      shipping: { mode: "sea", carrier: "COSCO", portOfLoading: "Shenzhen (CNSZX)", portOfDischarge: "Mombasa (KEMBA)" },
      status: "in_transit",
      createdAt: Date.now() - 172800000,
      milestones: defaultMilestones("FOB"),
    },
    {
      id: "ct_seed_3",
      title: "Medical Gloves — Nitrile, 2M boxes",
      category: "Medical supplies",
      goods: "Nitrile examination gloves, powder-free",
      hsCode: "4015.19",
      quantity: 2_000_000,
      unit: "boxes",
      originCountry: "Malaysia",
      destinationCountry: "Brazil",
      incoterm: "DAP",
      buyerUsername: "sao_paulo_med",
      sellerUsername: "kl_glovecorp",
      amountPi: 36500,
      memo: "Trade #MED-NTR-2M",
      status: "awaiting_payment",
      createdAt: Date.now() - 3600000,
      milestones: defaultMilestones("DAP"),
    },
  ];
  write(samples);
}
