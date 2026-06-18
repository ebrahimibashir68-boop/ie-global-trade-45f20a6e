// Lightweight client-side smart-contract store (localStorage).
// Each contract represents an import/export agreement settled in Pi.

export type Incoterm = "EXW" | "FOB" | "CIF" | "DAP" | "DDP";
export type ContractStatus = "draft" | "awaiting_payment" | "funded" | "in_transit" | "completed" | "cancelled";

export type Contract = {
  id: string;
  title: string;
  category: string;
  goods: string;
  quantity: number;
  unit: string;
  originCountry: string;
  destinationCountry: string;
  incoterm: Incoterm;
  buyerUsername: string;
  sellerUsername: string;
  amountPi: number;
  memo: string;
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
