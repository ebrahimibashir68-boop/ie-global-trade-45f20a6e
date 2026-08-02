// Pure compliance logic: sanctions / denied-party screening, dual-use and
// controlled-goods checks, restricted-route checks and landed-cost estimation.
// Kept free of I/O so it can run on the server or in the browser.

import type { ScreeningOutcome } from "./types";

export interface DeniedParty {
  id: string;
  name: string;
  country_code: string | null;
  list_source: string;
  reason: string | null;
}

export interface ControlledGood {
  id: string;
  hs_prefix: string;
  regime: string;
  description: string;
  severity: ScreeningOutcome;
}

export interface DutyRate {
  destination_country: string;
  hs_prefix: string;
  duty_pct: number;
  vat_pct: number;
  note: string | null;
}

export interface ScreeningInput {
  buyerName?: string | null;
  sellerName?: string | null;
  originCountry: string;
  destinationCountry: string;
  hsCode?: string | null;
  goods: string;
  incoterm: string;
  hasInsurance: boolean;
}

export interface ScreeningMatch { kind: string; label: string; detail: string }
export interface ScreeningCheck { name: string; passed: boolean; note: string }

export interface ScreeningResult {
  outcome: ScreeningOutcome;
  matches: ScreeningMatch[];
  checks: ScreeningCheck[];
}

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

// Token-overlap similarity — a lightweight stand-in for fuzzy name matching
// used by commercial denied-party screening engines.
function nameSimilarity(a: string, b: string): number {
  const ta = new Set(normalise(a).split(" ").filter((t) => t.length > 2));
  const tb = new Set(normalise(b).split(" ").filter((t) => t.length > 2));
  if (ta.size === 0 || tb.size === 0) return 0;
  let hits = 0;
  ta.forEach((t) => { if (tb.has(t)) hits += 1; });
  return hits / Math.min(ta.size, tb.size);
}

export function screenTrade(
  input: ScreeningInput,
  deniedParties: DeniedParty[],
  controlled: ControlledGood[],
): ScreeningResult {
  const matches: ScreeningMatch[] = [];
  const checks: ScreeningCheck[] = [];
  let outcome: ScreeningOutcome = "clear";
  const escalate = (next: ScreeningOutcome) => {
    if (next === "blocked") outcome = "blocked";
    else if (next === "review" && outcome !== "blocked") outcome = "review";
  };

  // 1. Denied / restricted party screening on both counterparties.
  const parties = [
    { role: "Buyer", name: input.buyerName ?? "" },
    { role: "Seller", name: input.sellerName ?? "" },
  ].filter((p) => p.name.trim().length > 0);

  let partyHit = false;
  for (const party of parties) {
    for (const dp of deniedParties) {
      if (nameSimilarity(party.name, dp.name) >= 0.6) {
        partyHit = true;
        matches.push({
          kind: "denied_party",
          label: `${party.role} matches "${dp.name}"`,
          detail: `${dp.list_source} — ${dp.reason ?? "listed entity"}`,
        });
        escalate("blocked");
      }
    }
  }
  checks.push({
    name: "Denied / restricted party screening",
    passed: !partyHit,
    note: parties.length === 0
      ? "No legal names supplied — screening incomplete."
      : `${parties.length} counterparty name(s) screened against the platform list.`,
  });
  if (parties.length === 0) escalate("review");

  // 2. Dual-use and controlled-goods classification on the HS code.
  const hs = (input.hsCode ?? "").replace(/\D/g, "");
  let controlHit: ControlledGood | undefined;
  if (hs) {
    controlHit = controlled.find((c) => hs.startsWith(c.hs_prefix.replace(/\D/g, "")));
    if (controlHit) {
      matches.push({
        kind: "controlled_goods",
        label: `${controlHit.regime}: HS ${controlHit.hs_prefix}`,
        detail: controlHit.description,
      });
      escalate(controlHit.severity);
    }
  }
  checks.push({
    name: "Dual-use & controlled-goods classification",
    passed: !controlHit,
    note: hs
      ? controlHit ? "Licence or additional review required before shipment." : "HS code carries no platform control flag."
      : "No HS code supplied — classification could not be verified.",
  });
  if (!hs) escalate("review");

  // 3. Route sanity — origin and destination must differ for cross-border trade.
  const crossBorder = input.originCountry !== input.destinationCountry;
  checks.push({
    name: "Cross-border route validation",
    passed: crossBorder,
    note: crossBorder
      ? `${input.originCountry} → ${input.destinationCountry}`
      : "Origin and destination are identical — this is a domestic movement.",
  });
  if (!crossBorder) escalate("review");

  // 4. Insurance obligation under Incoterms 2020 (CIF/CIP require seller cover).
  const insuranceRequired = input.incoterm === "CIF" || input.incoterm === "CIP";
  const insuranceOk = !insuranceRequired || input.hasInsurance;
  checks.push({
    name: "Incoterms 2020 insurance obligation",
    passed: insuranceOk,
    note: insuranceRequired
      ? insuranceOk ? "Seller cargo cover recorded as required by the rule." : "CIF/CIP require the seller to insure the cargo to 110% of value."
      : "The selected rule places no insurance obligation on the seller.",
  });
  if (!insuranceOk) escalate("review");

  // 5. Goods description quality — customs require a plain, specific description.
  const descOk = input.goods.trim().length >= 15;
  checks.push({
    name: "Customs description adequacy",
    passed: descOk,
    note: descOk
      ? "Description is specific enough for a customs declaration."
      : "Description is too generic; customs authorities may reject the entry.",
  });
  if (!descOk) escalate("review");

  return { outcome, matches, checks };
}

export interface LandedCost {
  customsValue: number;
  dutyPct: number;
  vatPct: number;
  duty: number;
  vat: number;
  total: number;
  basis: string;
  note: string;
}

// Landed-cost estimate. Duty is charged on the customs value (CIF basis in
// most WTO valuation regimes); VAT/GST is charged on value + duty.
export function estimateLandedCost(
  contractValue: number,
  hsCode: string | null | undefined,
  destination: string,
  rates: DutyRate[],
): LandedCost {
  const hs = (hsCode ?? "").replace(/\D/g, "");
  const candidates = rates
    .filter((r) => r.destination_country === destination && hs.startsWith(r.hs_prefix.replace(/\D/g, "")))
    .sort((a, b) => b.hs_prefix.length - a.hs_prefix.length);
  const rate = candidates[0];
  const dutyPct = rate?.duty_pct ?? 0;
  const vatPct = rate?.vat_pct ?? 0;
  const duty = (contractValue * dutyPct) / 100;
  const vat = ((contractValue + duty) * vatPct) / 100;
  return {
    customsValue: contractValue,
    dutyPct,
    vatPct,
    duty,
    vat,
    total: duty + vat,
    basis: "WTO Valuation Agreement — transaction value, CIF basis",
    note: rate?.note ?? "No published rate on file for this destination and HS chapter; treated as duty free for the estimate.",
  };
}
