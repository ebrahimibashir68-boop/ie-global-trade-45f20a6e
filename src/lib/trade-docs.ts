// Generate printable trade documents (Commercial Invoice, Packing List,
// Certificate of Origin, Proforma Bill of Lading, Insurance Certificate).
// Opens a new browser window with print-ready HTML; users use browser
// "Save as PDF" or "Print" from there. No native PDF library needed —
// keeps the bundle small and works fully client-side.

import type { Contract } from "./contracts-store";

export type TradeDocKind =
  | "commercial_invoice"
  | "packing_list"
  | "certificate_of_origin"
  | "bill_of_lading"
  | "insurance_certificate";

const DOC_META: Record<TradeDocKind, { title: string; code: string }> = {
  commercial_invoice: { title: "Commercial Invoice", code: "CI" },
  packing_list: { title: "Packing List", code: "PL" },
  certificate_of_origin: { title: "Certificate of Origin", code: "CO" },
  bill_of_lading: { title: "Bill of Lading (Proforma)", code: "BL" },
  insurance_certificate: { title: "Insurance Certificate", code: "IC" },
};

function esc(v: unknown): string {
  if (v === undefined || v === null || v === "") return "—";
  return String(v).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[ch]!));
}

function partyBlock(label: string, p?: Contract["buyer"], fallbackUser?: string, fallbackCountry?: string) {
  return `
    <div class="party">
      <div class="party-label">${label}</div>
      <div class="party-name">${esc(p?.legalName || (fallbackUser ? "@" + fallbackUser : "—"))}</div>
      <div class="party-line">${esc(p?.address ?? "")}</div>
      <div class="party-line">${esc(p?.countryCode ?? fallbackCountry ?? "")}</div>
      <div class="party-line">${p?.registrationNo ? "Reg / ID: " + esc(p.registrationNo) : ""}</div>
      <div class="party-line">${p?.piUsername ? "Pi: @" + esc(p.piUsername) : ""}</div>
    </div>`;
}

function invoiceBody(c: Contract) {
  const unit = esc(c.unit);
  const unitPrice = c.quantity > 0 ? c.amountPi / c.quantity : c.amountPi;
  return `
    <table class="items">
      <thead><tr><th>Description of goods</th><th>HS Code</th><th class="num">Quantity</th><th class="num">Unit price (π)</th><th class="num">Total (π)</th></tr></thead>
      <tbody>
        <tr>
          <td>${esc(c.goods)}</td>
          <td>${esc(c.hsCode)}</td>
          <td class="num">${c.quantity.toLocaleString()} ${unit}</td>
          <td class="num">${unitPrice.toLocaleString(undefined,{maximumFractionDigits:4})}</td>
          <td class="num">${c.amountPi.toLocaleString()}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr><td colspan="4" class="num total-lbl">TOTAL</td><td class="num total">π ${c.amountPi.toLocaleString()}</td></tr>
      </tfoot>
    </table>
    <div class="grid2">
      <div><div class="k">Incoterm 2020</div><div class="v">${esc(c.incoterm)}</div></div>
      <div><div class="k">Delivery window</div><div class="v">${esc(c.deliveryWindow)}</div></div>
      <div><div class="k">Payment</div><div class="v">Pi Network — settled from Pi Wallet</div></div>
      <div><div class="k">Memo</div><div class="v">${esc(c.memo)}</div></div>
    </div>`;
}

function packingBody(c: Contract) {
  const s = c.shipping;
  return `
    <table class="items">
      <thead><tr><th>Marks & numbers</th><th>Description</th><th class="num">Qty</th><th class="num">Gross wt (kg)</th><th class="num">Net wt (kg)</th><th class="num">Volume (m³)</th></tr></thead>
      <tbody>
        <tr>
          <td>${esc(s?.containerNo ?? c.id.toUpperCase())}</td>
          <td>${esc(c.goods)}</td>
          <td class="num">${c.quantity.toLocaleString()} ${esc(c.unit)}</td>
          <td class="num">${esc(s?.grossWeightKg?.toLocaleString())}</td>
          <td class="num">${esc(s?.netWeightKg?.toLocaleString())}</td>
          <td class="num">${esc(s?.volumeM3?.toLocaleString())}</td>
        </tr>
      </tbody>
    </table>
    <div class="grid2">
      <div><div class="k">Packages</div><div class="v">${esc(s?.packageCount)}</div></div>
      <div><div class="k">Container / BL</div><div class="v">${esc(s?.containerNo)} / ${esc(s?.bolAwbNo)}</div></div>
    </div>`;
}

function coBody(c: Contract) {
  return `
    <p>This is to certify that the goods described below are of <strong>${esc(c.originCountry)}</strong> origin,
    manufactured, produced or wholly obtained in ${esc(c.originCountry)}, and are being exported to
    <strong>${esc(c.destinationCountry)}</strong>.</p>
    <table class="items">
      <thead><tr><th>Goods</th><th>HS Code</th><th class="num">Quantity</th></tr></thead>
      <tbody>
        <tr><td>${esc(c.goods)}</td><td>${esc(c.hsCode)}</td><td class="num">${c.quantity.toLocaleString()} ${esc(c.unit)}</td></tr>
      </tbody>
    </table>
    <div class="grid2">
      <div><div class="k">Country of origin</div><div class="v">${esc(c.originCountry)}</div></div>
      <div><div class="k">Country of destination</div><div class="v">${esc(c.destinationCountry)}</div></div>
      <div><div class="k">Exporter</div><div class="v">${esc(c.seller?.legalName ?? "@" + c.sellerUsername)}</div></div>
      <div><div class="k">Importer</div><div class="v">${esc(c.buyer?.legalName ?? "@" + c.buyerUsername)}</div></div>
    </div>
    <p class="note">Issued electronically on the PiTrade platform under contract reference <strong>${esc(c.id)}</strong>.
    Verification of authenticity is provided by the cryptographic signatures registered on-chain in the associated smart contract.</p>`;
}

function bolBody(c: Contract) {
  const s = c.shipping;
  return `
    <div class="grid2">
      <div><div class="k">Shipper</div><div class="v">${esc(c.seller?.legalName ?? "@" + c.sellerUsername)}</div></div>
      <div><div class="k">Consignee</div><div class="v">${esc(c.buyer?.legalName ?? "@" + c.buyerUsername)}</div></div>
      <div><div class="k">Carrier</div><div class="v">${esc(s?.carrier)}</div></div>
      <div><div class="k">Vessel / Flight</div><div class="v">${esc(s?.vesselOrFlight)}</div></div>
      <div><div class="k">Port of loading</div><div class="v">${esc(s?.portOfLoading)}</div></div>
      <div><div class="k">Port of discharge</div><div class="v">${esc(s?.portOfDischarge)}</div></div>
      <div><div class="k">ETD</div><div class="v">${esc(s?.etd)}</div></div>
      <div><div class="k">ETA</div><div class="v">${esc(s?.eta)}</div></div>
      <div><div class="k">Container no.</div><div class="v">${esc(s?.containerNo)}</div></div>
      <div><div class="k">B/L or AWB no.</div><div class="v">${esc(s?.bolAwbNo)}</div></div>
    </div>
    <table class="items">
      <thead><tr><th>Description</th><th class="num">Qty</th><th class="num">Gross wt</th><th class="num">Volume</th></tr></thead>
      <tbody><tr>
        <td>${esc(c.goods)}</td>
        <td class="num">${c.quantity.toLocaleString()} ${esc(c.unit)}</td>
        <td class="num">${esc(s?.grossWeightKg)} kg</td>
        <td class="num">${esc(s?.volumeM3)} m³</td>
      </tr></tbody>
    </table>
    <p class="note">Proforma transport document generated from PiTrade contract data.
    The definitive negotiable Bill of Lading / Airway Bill is issued by the carrier upon receipt of the goods.</p>`;
}

function insuranceBody(c: Contract) {
  const i = c.insurance;
  const coverage = i?.coveragePi ?? Math.round(c.amountPi * 1.1);
  return `
    <div class="grid2">
      <div><div class="k">Insurer</div><div class="v">${esc(i?.insurer)}</div></div>
      <div><div class="k">Policy no.</div><div class="v">${esc(i?.policyNo)}</div></div>
      <div><div class="k">Assured</div><div class="v">${esc(c.buyer?.legalName ?? "@" + c.buyerUsername)}</div></div>
      <div><div class="k">Voyage</div><div class="v">${esc(c.originCountry)} → ${esc(c.destinationCountry)}</div></div>
      <div><div class="k">Coverage</div><div class="v">π ${coverage.toLocaleString()} (110% of CIF value)</div></div>
      <div><div class="k">Clauses</div><div class="v">${esc(i?.clauses ?? "Institute Cargo Clauses (A) — All Risks")}</div></div>
    </div>
    <p class="note">Cover attaches from the time the goods leave the warehouse or place of storage named in the
    contract for the commencement of transit, continues during the ordinary course of transit, and terminates
    on delivery to the final warehouse at the destination named in the contract.</p>`;
}

function bodyFor(kind: TradeDocKind, c: Contract): string {
  switch (kind) {
    case "commercial_invoice": return invoiceBody(c);
    case "packing_list": return packingBody(c);
    case "certificate_of_origin": return coBody(c);
    case "bill_of_lading": return bolBody(c);
    case "insurance_certificate": return insuranceBody(c);
  }
}

export function buildDocHtml(kind: TradeDocKind, c: Contract): string {
  const meta = DOC_META[kind];
  const docNo = `${meta.code}-${c.id.replace(/^ct_/, "").toUpperCase()}`;
  const issued = new Date().toISOString().slice(0, 10);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<title>${meta.title} · ${c.id}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { font: 12px/1.5 -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111; background: #fff; margin: 0; padding: 32px; }
  header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #b8860b; padding-bottom: 12px; margin-bottom: 20px; }
  .brand { font-family: Georgia, serif; font-size: 22px; letter-spacing: 0.5px; color: #b8860b; }
  .brand small { display: block; font: 10px/1.3 sans-serif; letter-spacing: 2px; color: #666; text-transform: uppercase; margin-top: 2px; }
  .doc-title { text-align: right; }
  .doc-title h1 { margin: 0; font: 600 18px/1.2 Georgia, serif; text-transform: uppercase; letter-spacing: 1px; }
  .doc-title .meta { font-size: 11px; color: #555; margin-top: 4px; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px; }
  .party { border: 1px solid #ddd; padding: 12px; border-radius: 4px; background: #fafafa; }
  .party-label { font: 700 9px/1 sans-serif; letter-spacing: 1.5px; text-transform: uppercase; color: #888; margin-bottom: 6px; }
  .party-name { font-weight: 700; font-size: 13px; }
  .party-line { color: #444; font-size: 11px; margin-top: 2px; }
  table.items { width: 100%; border-collapse: collapse; margin: 12px 0 18px; }
  .items th, .items td { border: 1px solid #ccc; padding: 8px 10px; text-align: left; vertical-align: top; }
  .items th { background: #f3efe4; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: #6b4a00; }
  .items td.num, .items th.num { text-align: right; font-variant-numeric: tabular-nums; }
  .items tfoot td { font-weight: 700; background: #fff8e6; }
  .items .total { color: #b8860b; font-size: 14px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 16px; }
  .k { font: 700 9px/1 sans-serif; letter-spacing: 1.2px; text-transform: uppercase; color: #888; }
  .v { font-size: 12px; margin-top: 2px; }
  .note { font-size: 10.5px; color: #555; line-height: 1.55; margin-top: 12px; border-left: 3px solid #b8860b; padding-left: 10px; }
  .sig-row { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
  .sig-box { border-top: 1px solid #666; padding-top: 6px; font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
  footer { margin-top: 32px; border-top: 1px solid #ddd; padding-top: 10px; font-size: 10px; color: #888; display: flex; justify-content: space-between; }
  @media print { body { padding: 18mm; } .noprint { display: none; } }
  .noprint { position: fixed; top: 10px; right: 10px; background: #b8860b; color: #fff; border: 0; padding: 8px 14px; border-radius: 999px; font: 600 12px sans-serif; cursor: pointer; }
</style>
</head><body>
<button class="noprint" onclick="window.print()">Print / Save as PDF</button>
<header>
  <div class="brand">PiTrade<small>Global trade · settled in π</small></div>
  <div class="doc-title">
    <h1>${meta.title}</h1>
    <div class="meta">
      Doc № <strong>${docNo}</strong><br />
      Contract № <strong>${esc(c.id)}</strong><br />
      Issued ${issued}
    </div>
  </div>
</header>

<div class="parties">
  ${partyBlock("Exporter / Seller", c.seller, c.sellerUsername, c.originCountry)}
  ${partyBlock("Importer / Buyer", c.buyer, c.buyerUsername, c.destinationCountry)}
</div>

<div class="grid2">
  <div><div class="k">Country of origin</div><div class="v">${esc(c.originCountry)}</div></div>
  <div><div class="k">Country of destination</div><div class="v">${esc(c.destinationCountry)}</div></div>
</div>

${bodyFor(kind, c)}

<div class="sig-row">
  <div class="sig-box">Signature — Exporter</div>
  <div class="sig-box">Signature — Importer</div>
</div>

<footer>
  <div>Generated by PiTrade · pitrade.app</div>
  <div>Contract hash reference: ${esc(c.id)}</div>
</footer>
</body></html>`;
}

export function openTradeDoc(kind: TradeDocKind, c: Contract) {
  const html = buildDocHtml(kind, c);
  const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=1000");
  if (!w) {
    // popup blocked — fall back to blob URL
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.location.href = url;
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
