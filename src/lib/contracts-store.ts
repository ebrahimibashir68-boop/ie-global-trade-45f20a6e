// Lightweight client-side smart-contract store (localStorage).
// Each contract represents an import/export agreement settled in Pi.

export type Incoterm = "EXW" | "FOB" | "CIF" | "DAP" | "DDP";
export type ContractStatus = "draft" | "awaiting_payment" | "funded" | "in_transit" | "completed" | "cancelled";

export type PartyType = "individual" | "company" | "institution" | "country";

export type Party = {
  type: PartyType;
  legalName: string;
  piUsername: string;
  countryCode: string;
  registrationNo?: string; // company reg / passport / gov id
  address?: string;
};

export type Signature = {
  role: "buyer" | "seller";
  signerName: string;
  signedAt: number;
  hash: string; // sha256 of canonical contract snapshot + signer name
};

export type Contract = {
  id: string;
  title: string;
  category: string;
  goods: string;
  hsCode?: string; // Harmonized System code
  quantity: number;
  unit: string;
  originCountry: string;
  destinationCountry: string;
  incoterm: Incoterm;
  buyerUsername: string;
  sellerUsername: string;
  buyer?: Party;
  seller?: Party;
  amountPi: number;
  memo: string;
  deliveryWindow?: string;
  customsDocs?: string[]; // e.g. ["Commercial Invoice","Packing List","Certificate of Origin","Bill of Lading"]
  complianceNotes?: string;
  signatures?: Signature[];
  registeredAt?: number; // when both parties have signed
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

export function createContract(
  data: Omit<Contract, "id" | "status" | "createdAt">,
): Contract {
  const contract: Contract = {
    ...data,
    id: "ct_" + Math.random().toString(36).slice(2, 10),
    status: "awaiting_payment",
    createdAt: Date.now(),
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

// Canonical serialization for signing — excludes signatures/status/tx fields.
export function canonicalContractSnapshot(c: Contract): string {
  const {
    id, title, category, goods, hsCode, quantity, unit,
    originCountry, destinationCountry, incoterm,
    buyerUsername, sellerUsername, buyer, seller,
    amountPi, memo, deliveryWindow, customsDocs, complianceNotes, createdAt,
  } = c;
  return JSON.stringify({
    id, title, category, goods, hsCode, quantity, unit,
    originCountry, destinationCountry, incoterm,
    buyerUsername, sellerUsername, buyer, seller,
    amountPi, memo, deliveryWindow, customsDocs, complianceNotes, createdAt,
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
  updateContract(id, {
    signatures,
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
      quantity: 18,
      unit: "tonnes",
      originCountry: "Ethiopia",
      destinationCountry: "Germany",
      incoterm: "CIF",
      buyerUsername: "hamburg_roasters",
      sellerUsername: "addis_exporters",
      amountPi: 12500,
      memo: "Trade #CFE-2026-0118 · Arabica FCL",
      status: "funded",
      createdAt: Date.now() - 86400000,
    },
    {
      id: "ct_seed_2",
      title: "Solar Inverters — 500 units",
      category: "Industrial equipment",
      goods: "3-phase grid-tie solar inverters, 10kW",
      quantity: 500,
      unit: "units",
      originCountry: "China",
      destinationCountry: "Kenya",
      incoterm: "FOB",
      buyerUsername: "nairobi_energy",
      sellerUsername: "shenzhen_power",
      amountPi: 84000,
      memo: "Trade #INV-10K-500",
      status: "in_transit",
      createdAt: Date.now() - 172800000,
    },
    {
      id: "ct_seed_3",
      title: "Medical Gloves — Nitrile, 2M boxes",
      category: "Medical supplies",
      goods: "Nitrile examination gloves, powder-free",
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
    },
  ];
  write(samples);
}
