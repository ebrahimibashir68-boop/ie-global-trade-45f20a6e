// Catalogue of the services a traditional import/export operation needs,
// mapped onto PiTrade's Pi-settled, contract-driven rails.
// Grouped by the classic freight-forwarding / customs / trade-finance desks.

export type ServiceGroup =
  | "transport"
  | "customs"
  | "documentation"
  | "finance"
  | "assurance"
  | "logistics"
  | "compliance"
  | "government"
  | "settlement";

/** Territorial reach of a service: worldwide, country-level, or bloc/corridor. */
export type ServiceReach = "global" | "national" | "regional";

export interface TradeService {
  slug: string;
  name: string;
  group: ServiceGroup;
  mode?: "sea" | "air" | "road" | "rail" | "multimodal" | "post";
  tagline: string;
  /** What the traditional desk does. */
  traditional: string;
  /** How PiTrade delivers it on the Pi rails. */
  onPiTrade: string;
  /** Scope of work / line items. */
  covers: string[];
  /** Documents produced or required (UN/CEFACT names). */
  documents: string[];
  /** Typical charge basis, quoted in π on the platform. */
  charging: string;
  /** Governing rules and conventions. */
  standards: string[];
  /** Territorial reach; defaults to global when unset. */
  reach?: ServiceReach[];
}

export const REACH_LABELS: Record<ServiceReach, string> = {
  global: "Global",
  national: "National",
  regional: "Regional",
};

export function serviceReach(s: TradeService): ServiceReach[] {
  return s.reach ?? ["global", "national", "regional"];
}

export const SERVICE_GROUPS: { key: ServiceGroup; label: string; blurb: string }[] = [
  { key: "transport", label: "Freight & carriage", blurb: "Sea, air, road, rail, multimodal and post — booking, carriage and proof of shipment." },
  { key: "customs", label: "Customs & border", blurb: "Export and import clearance, classification, valuation, duty, VAT and special procedures." },
  { key: "documentation", label: "Trade documents", blurb: "The UN/CEFACT document set every shipment and bank needs, issued and hashed." },
  { key: "finance", label: "Trade finance & payment", blurb: "Escrow, documentary credit logic, milestone release and settlement — in π." },
  { key: "assurance", label: "Insurance & inspection", blurb: "Cargo cover, surveys, pre-shipment inspection and quality certification." },
  { key: "logistics", label: "Warehousing & handling", blurb: "Consolidation, packing, labelling, terminal handling, storage and last-mile." },
  { key: "compliance", label: "Compliance & licensing", blurb: "Sanctions screening, dual-use control, permits, origin and product conformity." },
  { key: "government", label: "Government, national & regional", blurb: "Single windows, preferential trade agreements, public procurement, corridors and aid consignments." },
  { key: "settlement", label: "Digital settlement & QFS", blurb: "Pi-settled treasury, quantum-financial-system compatible messaging, reconciliation and audit." },
];

export const SERVICES: TradeService[] = [
  // ── Transport ────────────────────────────────────────────────────────────
  {
    slug: "ocean-freight",
    name: "Ocean freight (FCL & LCL)",
    group: "transport",
    mode: "sea",
    tagline: "Containerised, break-bulk and bulk carriage port to port.",
    traditional:
      "A forwarder or NVOCC books space with the carrier, arranges the container, supervises stuffing, lodges the shipping instruction and issues a Bill of Lading as the document of title.",
    onPiTrade:
      "The booking, vessel, container and B/L number live on the contract record. When the on-board date is filed, the shipment-departed milestone unlocks its π release automatically.",
    covers: [
      "FCL 20'/40'/40'HC/45' and LCL consolidation",
      "Reefer, out-of-gauge, flat-rack and tank containers",
      "Break-bulk, project cargo and dry/liquid bulk chartering",
      "Terminal handling, stuffing supervision and seal recording",
      "Vessel schedule, ETD/ETA and transhipment tracking",
    ],
    documents: ["Booking confirmation", "Shipping instruction", "Bill of Lading (negotiable or seaway)", "Container packing list", "Mate's receipt"],
    charging: "Per container or per freight tonne (W/M), plus THC, BAF/CAF and documentation fee — quoted in π.",
    standards: ["Hague-Visby Rules", "Rotterdam Rules (where adopted)", "SOLAS VGM", "IMDG Code for dangerous goods"],
  },
  {
    slug: "air-freight",
    name: "Air freight",
    group: "transport",
    mode: "air",
    tagline: "Time-critical and high-value carriage under an Air Waybill.",
    traditional:
      "An IATA agent books capacity, builds the ULD, screens the cargo for security, and issues the Master/House Air Waybill, which is a receipt rather than a title document.",
    onPiTrade:
      "Flight number, AWB and chargeable weight are contract fields; the AWB hash is written to the document trail the moment it is issued.",
    covers: [
      "General cargo, express and charter capacity",
      "Perishables, pharma cold chain and live animals",
      "Dangerous goods acceptance and declaration",
      "Chargeable weight (volumetric 1:6000) calculation",
      "Security screening and known-consignor handling",
    ],
    documents: ["Master Air Waybill", "House Air Waybill", "Shipper's Letter of Instruction", "Dangerous Goods Declaration", "Cargo manifest"],
    charging: "Per chargeable kilo with break rates, plus fuel and security surcharges, AWB fee and handling — quoted in π.",
    standards: ["Montreal Convention 1999", "IATA TACT & Dangerous Goods Regulations", "ICAO Annex 17 security"],
  },
  {
    slug: "road-freight",
    name: "Road freight & trucking",
    group: "transport",
    mode: "road",
    tagline: "FTL and LTL haulage, cross-border trucking and drayage.",
    traditional:
      "A haulier moves the consignment under a CMR consignment note, with TIR or transit guarantees for border crossings and tachograph-controlled driving hours.",
    onPiTrade:
      "The CMR number, plate, driver reference and border-crossing timestamps attach to the shipment leg, so delivery can be evidenced before the escrow release.",
    covers: [
      "Full-load and groupage across borders",
      "Container drayage to and from the terminal",
      "Temperature-controlled, ADR and oversize transport",
      "TIR carnet and customs transit movements",
      "Collection, delivery windows and POD capture",
    ],
    documents: ["CMR consignment note", "TIR carnet", "Delivery note / POD", "Weighbridge ticket", "ADR transport document"],
    charging: "Per kilometre or per load, plus waiting time, tolls and border fees — quoted in π.",
    standards: ["CMR Convention 1956", "TIR Convention 1975", "ADR agreement", "AETR driving hours"],
  },
  {
    slug: "rail-freight",
    name: "Rail freight",
    group: "transport",
    mode: "rail",
    tagline: "Block trains and wagonload across continental corridors.",
    traditional:
      "Carriage runs under a CIM or SMGS consignment note, with gauge changes, wagon allocation and terminal transfers managed by the rail forwarder.",
    onPiTrade:
      "Train, wagon and consignment-note references are recorded per leg; corridor milestones can be split so π releases follow physical progress.",
    covers: [
      "Block train and single-wagon services",
      "Trans-Eurasian and regional corridor routing",
      "Gauge-change and border transhipment",
      "Rail-road and rail-sea intermodal legs",
      "Wagon supply, demurrage and siding handling",
    ],
    documents: ["CIM consignment note", "SMGS consignment note", "CIM/SMGS common note", "Wagon list"],
    charging: "Per wagon or per TEU on the corridor tariff, plus terminal transfer — quoted in π.",
    standards: ["COTIF/CIM", "SMGS agreement", "RID dangerous goods by rail"],
  },
  {
    slug: "multimodal",
    name: "Multimodal & door-to-door",
    group: "transport",
    mode: "multimodal",
    tagline: "One contract of carriage across two or more modes.",
    traditional:
      "An MTO issues a single multimodal transport document, takes responsibility end to end, and coordinates each carrier and terminal in the chain.",
    onPiTrade:
      "Each leg is a milestone in the same smart contract, so a single π escrow covers the whole journey while releasing progressively.",
    covers: [
      "Sea-air, rail-road and barge feeder combinations",
      "Through-routing with a single responsible operator",
      "Leg-by-leg milestone mapping to escrow releases",
      "Interchange and transhipment documentation",
      "Cargo tracking across mode changes",
    ],
    documents: ["FIATA FBL multimodal B/L", "Combined transport document", "Interchange receipt"],
    charging: "Through-rate per shipment with leg breakdown — quoted in π.",
    standards: ["UN Multimodal Convention 1980", "UNCTAD/ICC Rules 1992", "FIATA model rules"],
  },
  {
    slug: "courier-post",
    name: "Courier, express & postal",
    group: "transport",
    mode: "post",
    tagline: "Samples, spares and low-value consignments.",
    traditional:
      "Integrators and postal operators move small parcels under simplified declarations, with de-minimis thresholds and postal customs labels.",
    onPiTrade:
      "Sample and spare-part shipments attach to the main contract as sub-consignments, so pre-production samples stay inside the same audit trail.",
    covers: [
      "Sample and prototype shipments",
      "Spare parts and after-sales replacements",
      "Simplified and de-minimis declarations",
      "Duty-paid (DDP) express delivery options",
      "Tracking numbers linked to the parent contract",
    ],
    documents: ["Express waybill", "CN22 / CN23 customs declaration", "Proforma invoice for samples"],
    charging: "Per parcel by weight zone, plus duty-advance fee — quoted in π.",
    standards: ["Universal Postal Convention", "WCO Immediate Release Guidelines"],
  },

  // ── Customs ──────────────────────────────────────────────────────────────
  {
    slug: "export-clearance",
    name: "Export customs clearance",
    group: "customs",
    tagline: "Lodging the export declaration and releasing the goods to leave.",
    traditional:
      "The customs broker files the export declaration, presents the goods where required, obtains the movement reference and secures proof of exit for VAT zero-rating.",
    onPiTrade:
      "The declaration reference and exit confirmation are stored as contract documents; the export-cleared milestone gates the departure release.",
    covers: [
      "Export declaration lodgement and amendment",
      "Exporter of record and EORI handling",
      "Proof of exit for VAT zero-rating",
      "Export licence attachment where controlled",
      "Consolidation of multi-invoice exports",
    ],
    documents: ["Export declaration", "Movement reference number", "Commercial invoice", "Packing list", "Export licence"],
    charging: "Per declaration plus per additional tariff line — quoted in π.",
    standards: ["WCO Revised Kyoto Convention", "WTO Trade Facilitation Agreement", "National export control law"],
  },
  {
    slug: "import-clearance",
    name: "Import customs clearance",
    group: "customs",
    tagline: "Entry, duty and VAT calculation, and release into free circulation.",
    traditional:
      "The broker classifies the goods, declares the customs value, calculates duty and import VAT, arranges payment or deferment and secures release from the terminal.",
    onPiTrade:
      "Landed-cost is estimated before signature from the HS code and destination, then the actual entry and duty receipt are filed against the contract.",
    covers: [
      "Classification, valuation and origin declaration",
      "Duty, VAT/GST and excise calculation",
      "Deferment, guarantee and postponed accounting",
      "Physical and documentary inspection handling",
      "Release, delivery order and terminal collection",
    ],
    documents: ["Import declaration / single administrative document", "Duty and VAT receipt", "Certificate of Origin", "Delivery order"],
    charging: "Per entry plus disbursement fee on duties advanced — quoted in π.",
    standards: ["WTO Valuation Agreement (transaction value)", "WCO Harmonized System", "Revised Kyoto Convention"],
  },
  {
    slug: "hs-classification",
    name: "HS classification & tariff advice",
    group: "customs",
    tagline: "Getting the code right before the goods move.",
    traditional:
      "A classification specialist applies the General Interpretative Rules, checks explanatory notes and binding rulings, and confirms duty rates and preference eligibility.",
    onPiTrade:
      "The classifier suggests HS codes from the goods description, flags controlled chapters and returns the duty and VAT rate used in the landed-cost estimate.",
    covers: [
      "6-digit HS and national tariff-line coding",
      "General Interpretative Rules application",
      "Binding tariff information requests",
      "Preferential origin and free-trade-agreement checks",
      "Anti-dumping and safeguard duty exposure",
    ],
    documents: ["Classification opinion", "Binding tariff information", "Preference declaration"],
    charging: "Per product classified, or an annual tariff-file retainer — quoted in π.",
    standards: ["WCO Harmonized System 2022", "GIR 1-6", "Rules of origin under applicable FTAs"],
  },
  {
    slug: "customs-procedures",
    name: "Special customs procedures",
    group: "customs",
    tagline: "Transit, bonded warehousing, temporary admission and processing relief.",
    traditional:
      "Duty is suspended while goods move under transit, sit in a bonded warehouse, enter temporarily under an ATA carnet, or are processed for re-export.",
    onPiTrade:
      "The chosen procedure and its guarantee reference sit on the contract, and the escrow schedule adapts so π is not released while duty liability is still open.",
    covers: [
      "Customs transit and guarantee management",
      "Bonded and free-zone warehousing",
      "Temporary admission under ATA carnet",
      "Inward and outward processing relief",
      "Re-export and duty drawback claims",
    ],
    documents: ["Transit declaration", "ATA carnet", "Warehouse bond entry", "Drawback claim"],
    charging: "Per procedure opened plus guarantee usage — quoted in π.",
    standards: ["Istanbul Convention (ATA)", "Common transit convention", "Revised Kyoto Convention specific annexes"],
  },

  // ── Documentation ────────────────────────────────────────────────────────
  {
    slug: "commercial-documents",
    name: "Commercial invoice & packing list",
    group: "documentation",
    tagline: "The two documents every border and every bank asks for first.",
    traditional:
      "The exporter issues an invoice stating parties, Incoterm, currency, HS code and value, plus a packing list detailing marks, cartons, weights and volumes.",
    onPiTrade:
      "Both are generated from the contract data itself, so the numbers on the paperwork can never diverge from the numbers in the escrow.",
    covers: [
      "Proforma invoice for the buyer's approval and LC opening",
      "Final commercial invoice with Incoterm and currency",
      "Packing list with marks, numbers and weights",
      "Consular or legalised invoice where required",
      "Automatic hashing so any later edit is detectable",
    ],
    documents: ["Proforma invoice", "Commercial invoice", "Packing list", "Weight and measurement list"],
    charging: "Included with every contract — no separate π charge.",
    standards: ["UN Layout Key for Trade Documents", "UN/CEFACT Cross Industry Invoice"],
  },
  {
    slug: "certificates-of-origin",
    name: "Origin & preference certificates",
    group: "documentation",
    tagline: "Proving where the goods were made, and claiming the lower duty.",
    traditional:
      "A chamber of commerce or authorised exporter certifies origin, and preferential certificates unlock reduced duty under a trade agreement.",
    onPiTrade:
      "Origin evidence is filed as a typed document on the contract and referenced by the customs-cleared milestone before its π release.",
    covers: [
      "Non-preferential certificates of origin",
      "Preferential certificates and origin declarations",
      "Rules-of-origin and value-added calculations",
      "Supplier declarations and long-term declarations",
      "Legalisation and chamber endorsement",
    ],
    documents: ["Certificate of Origin", "EUR.1 / preference certificate", "Supplier's declaration", "Statement on origin"],
    charging: "Per certificate issued or endorsed — quoted in π.",
    standards: ["WCO origin rules", "Applicable FTA origin protocols", "ICC certificate of origin guidelines"],
  },
  {
    slug: "transport-documents",
    name: "Transport & title documents",
    group: "documentation",
    tagline: "Bills of Lading, waybills and consignment notes — issued and traceable.",
    traditional:
      "The carrier issues the transport document; a negotiable Bill of Lading transfers title and is surrendered against release of the cargo.",
    onPiTrade:
      "Document number, issuer and issue date are recorded with a hash, giving a tamper-evident chain without waiting for couriered originals.",
    covers: [
      "Negotiable and straight Bills of Lading",
      "Sea waybills and telex release",
      "Air waybills and rail/road consignment notes",
      "Endorsement chains and consignee changes",
      "Letter of indemnity for missing originals",
    ],
    documents: ["Bill of Lading", "Sea waybill", "Air waybill", "CIM/CMR note", "Letter of indemnity"],
    charging: "Per document set issued — quoted in π.",
    standards: ["Hague-Visby Rules", "UCP 600 art. 19-25", "eUCP for electronic presentation"],
  },
  {
    slug: "regulatory-certificates",
    name: "Health, safety & product certificates",
    group: "documentation",
    tagline: "Phytosanitary, veterinary, fumigation and conformity paperwork.",
    traditional:
      "Official bodies inspect and certify that plants, animals, food and regulated products meet the importing country's requirements.",
    onPiTrade:
      "Each certificate is a typed contract document with issuer and number, and can be made a prerequisite for a milestone to complete.",
    covers: [
      "Phytosanitary and veterinary health certificates",
      "Fumigation and ISPM 15 wood packaging treatment",
      "Halal, kosher and organic certification",
      "Product conformity and type-approval marks",
      "Radiation, dioxin and residue test reports",
    ],
    documents: ["Phytosanitary certificate", "Veterinary health certificate", "Fumigation certificate", "Certificate of conformity", "Laboratory analysis report"],
    charging: "Per certificate plus inspection body fee — quoted in π.",
    standards: ["IPPC / ISPM 15", "WTO SPS and TBT agreements", "Codex Alimentarius"],
  },

  // ── Finance ──────────────────────────────────────────────────────────────
  {
    slug: "pi-escrow",
    name: "Pi escrow & documentary release",
    group: "finance",
    tagline: "The letter of credit, rebuilt as a smart contract in π.",
    traditional:
      "A bank issues a documentary credit; the seller is paid when compliant documents are presented, and the bank checks them against the credit terms.",
    onPiTrade:
      "The buyer funds the contract in π, and each verified milestone with its required documents releases a fixed percentage to the seller — no issuing bank, no presentation delay.",
    covers: [
      "Buyer funding through a Pi user-to-app payment",
      "Milestone release schedule weighted to the Incoterm",
      "Required-document conditions on each milestone",
      "Partial releases and retention until delivery",
      "App-to-user payout of released π to the seller",
    ],
    documents: ["Escrow funding record", "Milestone release log", "Pi payment and transaction identifiers"],
    charging: "A percentage of contract value on release — quoted in π.",
    standards: ["UCP 600 release logic", "ISBP 821 document examination principles", "Incoterms 2020 risk mapping"],
  },
  {
    slug: "payment-terms",
    name: "Payment terms & settlement",
    group: "finance",
    tagline: "Advance, open account, collection — all settled on Pi rails.",
    traditional:
      "Parties choose cash in advance, documentary collection, letters of credit or open account, each with a different risk balance and banking chain.",
    onPiTrade:
      "The same commercial structures are expressed as π funding and release rules, settled peer-to-peer with server-approved payments and an immutable ledger.",
    covers: [
      "Advance payment and deposit structures",
      "Documents-against-payment and against-acceptance equivalents",
      "Open-account trading with staged releases",
      "Deposit, balance and retention splits",
      "Full ledger of every π movement per contract",
    ],
    documents: ["Payment schedule", "Settlement receipt", "Ledger statement"],
    charging: "Network transaction cost only for transfers; release fee applies on escrow.",
    standards: ["URC 522 collection principles", "UCP 600", "Pi Platform payment flow (approve / complete)"],
  },
  {
    slug: "landed-cost",
    name: "Landed cost & quotation",
    group: "finance",
    tagline: "The all-in cost of getting goods to the buyer's door.",
    traditional:
      "The forwarder builds a quotation combining goods value, freight, insurance, duty, VAT, handling and delivery, on the applicable Incoterm basis.",
    onPiTrade:
      "The estimator computes duty and VAT from the HS code and destination on a transaction-value basis and shows the total before either party signs.",
    covers: [
      "Duty and VAT/GST estimation by HS code and destination",
      "Freight, insurance and handling build-up",
      "Incoterm-aware allocation of each cost to buyer or seller",
      "Currency reference alongside the π contract value",
      "Break-even and margin view for the seller",
    ],
    documents: ["Quotation", "Landed-cost breakdown", "Proforma invoice"],
    charging: "Included with every contract — no separate π charge.",
    standards: ["WTO Valuation Agreement", "Incoterms 2020 cost allocation", "WCO valuation commentaries"],
  },

  // ── Assurance ────────────────────────────────────────────────────────────
  {
    slug: "cargo-insurance",
    name: "Marine & cargo insurance",
    group: "assurance",
    tagline: "Cover for loss or damage in transit, at the right level.",
    traditional:
      "Cargo is insured under Institute Cargo Clauses A, B or C, typically to 110% of CIF value, with war and strikes cover added where the route requires it.",
    onPiTrade:
      "Insurer, policy number, insured value and clause set are contract fields, and CIF/CIP contracts are flagged in screening if cover is missing.",
    covers: [
      "All-risks (ICC A), named-perils (ICC B) and restricted (ICC C) cover",
      "War, strikes, riots and civil commotion extensions",
      "Insured value at 110% of CIF as market practice",
      "Open cover and per-shipment declarations",
      "Claims notification, survey and recovery support",
    ],
    documents: ["Insurance certificate", "Insurance policy", "Survey report", "Claim notice"],
    charging: "Premium as a rate on insured value — quoted in π.",
    standards: ["Institute Cargo Clauses (A/B/C) 2009", "Marine Insurance Act principles", "Incoterms 2020 CIF/CIP minimum cover"],
  },
  {
    slug: "inspection-testing",
    name: "Inspection, survey & testing",
    group: "assurance",
    tagline: "Independent proof that what shipped is what was ordered.",
    traditional:
      "A survey company performs pre-shipment inspection, draft survey, sampling and laboratory testing, and issues a certificate the buyer or bank relies on.",
    onPiTrade:
      "The inspection certificate can be made mandatory for a milestone, so π is not released until an independent party confirms the goods.",
    covers: [
      "Pre-shipment and during-production inspection",
      "Quantity, weight and draft survey",
      "Sampling and laboratory analysis",
      "Container loading supervision and sealing",
      "Factory audit and social compliance checks",
    ],
    documents: ["Inspection certificate", "Certificate of quality and quantity", "Loading supervision report", "Laboratory analysis report"],
    charging: "Per inspection day or per consignment — quoted in π.",
    standards: ["ISO/IEC 17020 inspection bodies", "ISO/IEC 17025 testing laboratories", "GAFTA/FOSFA rules for soft commodities"],
  },
  {
    slug: "dispute-arbitration",
    name: "Dispute resolution & arbitration",
    group: "assurance",
    tagline: "What happens when a shipment goes wrong.",
    traditional:
      "The contract names a governing law and forum; parties negotiate, then mediate or arbitrate under institutional rules, with awards enforceable across borders.",
    onPiTrade:
      "A contract can be marked disputed, which freezes further releases while the full signed record, documents and event log serve as evidence.",
    covers: [
      "Governing law and jurisdiction clauses",
      "Escrow freeze on a disputed contract",
      "Complete tamper-evident evidence bundle",
      "Mediation and arbitration referral",
      "Partial release or refund on settlement",
    ],
    documents: ["Notice of dispute", "Evidence bundle", "Settlement agreement", "Arbitral award"],
    charging: "Case fee on referral — quoted in π.",
    standards: ["ICC Arbitration Rules", "UNCITRAL Model Law", "New York Convention 1958"],
  },

  // ── Logistics ────────────────────────────────────────────────────────────
  {
    slug: "warehousing",
    name: "Warehousing & bonded storage",
    group: "logistics",
    tagline: "Holding stock before, between and after the main carriage.",
    traditional:
      "Goods are received, stored, inventoried and released from general or bonded warehouses, with duty suspended while under bond.",
    onPiTrade:
      "Storage legs appear as dated events on the contract, and bonded status is linked to the customs procedure so releases respect open duty liability.",
    covers: [
      "General, bonded and free-zone storage",
      "Receipt, put-away and stock counting",
      "Temperature-controlled and hazardous storage",
      "Pick, pack and order fulfilment",
      "Warehouse receipts and release orders",
    ],
    documents: ["Warehouse receipt", "Goods received note", "Stock report", "Release order"],
    charging: "Per pallet or per square metre per week, plus in/out handling — quoted in π.",
    standards: ["FIATA warehouse receipt", "Customs warehousing rules", "GDP for pharmaceutical storage"],
  },
  {
    slug: "packing-marking",
    name: "Export packing, marking & labelling",
    group: "logistics",
    tagline: "Getting the cargo to survive the journey and clear the border.",
    traditional:
      "Goods are packed for the mode and route, wood packaging is heat-treated, and cartons carry shipping marks, handling symbols and regulatory labels.",
    onPiTrade:
      "Package count, marks, gross and net weights and volume are structured contract fields that flow straight into the packing list and customs data.",
    covers: [
      "Seaworthy and airworthy export packing",
      "Crating, palletising and shrink-wrapping",
      "ISPM 15 heat-treated wood packaging",
      "Shipping marks, handling and hazard labels",
      "Country-of-origin and language-specific labelling",
    ],
    documents: ["Packing specification", "ISPM 15 treatment mark", "Label artwork approval"],
    charging: "Per package or per cubic metre packed — quoted in π.",
    standards: ["ISPM 15", "ISO 780 handling symbols", "GHS labelling for chemicals"],
  },
  {
    slug: "terminal-lastmile",
    name: "Terminal handling & last-mile delivery",
    group: "logistics",
    tagline: "Port, airport and depot handling through to the final door.",
    traditional:
      "Terminals lift, store and gate cargo; the final leg delivers to the consignee's premises against a proof of delivery, sometimes with installation.",
    onPiTrade:
      "The proof of delivery closes the delivered milestone, which triggers the final π release and completes the contract.",
    covers: [
      "Terminal handling, lift-on/lift-off and gate moves",
      "Demurrage and detention monitoring",
      "Devanning, cross-docking and deconsolidation",
      "Final-mile delivery with booked windows",
      "Proof of delivery capture and acceptance",
    ],
    documents: ["Terminal handling receipt", "Equipment interchange receipt", "Proof of delivery", "Acceptance certificate"],
    charging: "Per move or per delivery, plus waiting and tail-lift — quoted in π.",
    standards: ["Terminal tariff schedules", "ISO 6346 container identification"],
  },

  // ── Compliance ───────────────────────────────────────────────────────────
  {
    slug: "sanctions-screening",
    name: "Sanctions & denied-party screening",
    group: "compliance",
    tagline: "Checking who you are trading with, before you trade.",
    traditional:
      "Compliance teams screen counterparties, vessels and banks against sanctions and denied-party lists, and record the result for audit.",
    onPiTrade:
      "Every contract can be screened in-app; the outcome — clear, review or blocked — is stored as an immutable screening record on the contract.",
    covers: [
      "Buyer and seller name screening with fuzzy matching",
      "Country and route restriction checks",
      "Clear / review / blocked outcome with reasons",
      "Immutable, append-only screening history",
      "Re-screening when parties change",
    ],
    documents: ["Screening report", "Audit trail entry"],
    charging: "Included with every contract — no separate π charge.",
    standards: ["FATF recommendations", "Applicable national sanctions regimes", "Wolfsberg screening guidance"],
  },
  {
    slug: "export-controls",
    name: "Export controls, dual-use & licensing",
    group: "compliance",
    tagline: "Some goods need permission before they can cross a border.",
    traditional:
      "Controlled and dual-use items are classified against control lists, and an export licence or end-use statement must be obtained before shipment.",
    onPiTrade:
      "Controlled HS chapters raise a flag during screening, and the licence is attached as a contract document required by the departure milestone.",
    covers: [
      "Dual-use and military-list classification",
      "Export, import and transit licence applications",
      "End-user and end-use statements",
      "Embargo and catch-all control checks",
      "Licence expiry and quantity tracking",
    ],
    documents: ["Export licence", "Import permit", "End-user certificate", "Control classification note"],
    charging: "Per licence application handled — quoted in π.",
    standards: ["Wassenaar Arrangement", "Chemical Weapons Convention schedules", "Nuclear Suppliers Group lists"],
  },
  {
    slug: "restricted-goods",
    name: "Restricted & special-regime goods",
    group: "compliance",
    tagline: "Dangerous goods, wildlife, waste, culture and precious materials.",
    traditional:
      "Special regimes govern hazardous cargo, protected species, hazardous waste, cultural property and precious metals, each with its own permit and packaging rules.",
    onPiTrade:
      "The classifier flags these chapters and requires the matching permit document before the contract can move past screening.",
    covers: [
      "Dangerous goods classification, packing and declaration",
      "CITES permits for protected species and products",
      "Basel Convention notification for waste shipments",
      "Cultural property export permits",
      "Precious metals, gemstones and Kimberley Process",
    ],
    documents: ["Dangerous Goods Declaration", "CITES permit", "Basel notification", "Kimberley Process certificate"],
    charging: "Per permit handled — quoted in π.",
    standards: ["UN Model Regulations / IMDG / IATA DGR", "CITES", "Basel Convention", "Kimberley Process"],
  },
  {
    slug: "trader-registration",
    name: "Trader registration & AEO status",
    group: "compliance",
    tagline: "Being recognised as a legitimate trader on both sides of the border.",
    traditional:
      "Exporters and importers register with customs, obtain trader identification and can apply for trusted-trader status for faster clearance.",
    onPiTrade:
      "Organisation records carry legal name, entity type, registration, tax and trader identification numbers, and are bound to the signing party on every contract.",
    covers: [
      "Legal entity and trader identification records",
      "Tax and VAT registration details",
      "Trusted-trader / AEO application support",
      "Power of attorney to the customs broker",
      "Know-your-customer verification of counterparties",
    ],
    documents: ["Trader registration certificate", "AEO authorisation", "Power of attorney", "Tax registration certificate"],
    charging: "Included with organisation setup — no separate π charge.",
    standards: ["WCO SAFE Framework (AEO)", "Revised Kyoto Convention", "FATF KYC guidance"],
  },
  // ── Government, national & regional ──────────────────────────────────────
  {
    slug: "national-single-window",
    name: "National single window filing",
    group: "government",
    tagline: "One national submission to every border agency at once.",
    traditional:
      "Traders file separate declarations to customs, health, agriculture, standards and port authorities, each with its own forms, offices and opening hours.",
    onPiTrade:
      "Contract data is assembled once and rendered into each national agency's dataset, with every submission hashed to the contract trail so the trader, the broker and the agency read the same record.",
    covers: [
      "Single declaration dataset reused by all border agencies",
      "National customs, health, agriculture and standards filings",
      "Licence, permit and certificate lodgement",
      "Agency response, query and release tracking",
      "Country profile of required filings by commodity",
    ],
    documents: ["Single window declaration", "Agency permits", "Release notification", "Filing receipt"],
    charging: "Per declaration lodged — quoted in π.",
    standards: ["UN/CEFACT Recommendation 33-37", "WTO Trade Facilitation Agreement", "WCO Data Model"],
    reach: ["national"],
  },
  {
    slug: "trade-agreements",
    name: "Regional trade agreements & preference",
    group: "government",
    tagline: "Claiming the duty preference a trade bloc entitles you to.",
    traditional:
      "Traders check rules of origin under each free-trade agreement, prove sufficient processing and file an origin declaration to obtain reduced or zero duty.",
    onPiTrade:
      "The contract records origin inputs and the agreement claimed; the landed-cost engine applies the preferential rate and stores the origin evidence with the declaration.",
    covers: [
      "Free-trade, customs-union and preferential scheme eligibility",
      "Rules of origin and value-added tests",
      "Approved / registered exporter declarations",
      "Retrospective preference claims and verification requests",
      "Duty saving comparison, preferential vs. most-favoured-nation",
    ],
    documents: ["Origin declaration", "EUR.1 / Form A style certificate", "Supplier declaration", "Preference calculation sheet"],
    charging: "Per agreement claim assessed — quoted in π.",
    standards: ["WTO rules of origin", "Revised Kyoto Convention Annex K", "Individual FTA protocols"],
    reach: ["regional"],
  },
  {
    slug: "public-procurement",
    name: "Government & public procurement trade",
    group: "government",
    tagline: "State, municipal and agency buying, executed as a signed contract.",
    traditional:
      "Public bodies run tenders, award supply contracts, require performance bonds and pay against inspected delivery under public accounting rules.",
    onPiTrade:
      "A government or institution entity signs the same contract as any trader, with milestone-gated π release, published document hashes and an immutable award-to-delivery audit trail.",
    covers: [
      "Tender award reference and framework agreement linkage",
      "Institution, ministry and state-owned entity signatories",
      "Performance and advance-payment guarantee tracking",
      "Inspection-before-payment milestone gating",
      "Public audit export of the full contract trail",
    ],
    documents: ["Award letter", "Supply contract", "Performance guarantee", "Inspection and acceptance certificate"],
    charging: "Per contract executed — quoted in π.",
    standards: ["UNCITRAL Model Law on Public Procurement", "WTO Government Procurement Agreement"],
    reach: ["national", "global"],
  },
  {
    slug: "transit-corridors",
    name: "Regional transit & corridor movement",
    group: "government",
    tagline: "Moving sealed goods across several countries under one guarantee.",
    traditional:
      "Goods cross transit countries under carnet or transit systems with a customs guarantee, sealed loads and office-of-departure to office-of-destination discharge.",
    onPiTrade:
      "Each corridor leg is a milestone with its own seal, office and timestamp, so discharge of the transit is visible to every party without chasing paper.",
    covers: [
      "Transit declarations and guarantee references",
      "Seal numbers, corridor legs and border crossing times",
      "TIR / eTIR and ATA carnet handling",
      "Landlocked-country corridor and port-of-transit routing",
      "Discharge confirmation and guarantee release",
    ],
    documents: ["Transit declaration", "TIR carnet / eTIR record", "ATA carnet", "Guarantee certificate", "Discharge confirmation"],
    charging: "Per transit movement — quoted in π.",
    standards: ["TIR Convention 1975 / eTIR", "Istanbul Convention (ATA)", "Common transit procedures"],
    reach: ["regional"],
  },
  {
    slug: "national-standards",
    name: "National standards & conformity assessment",
    group: "government",
    tagline: "Meeting the destination country's product rules before the goods sail.",
    traditional:
      "Importing countries require product certification, conformity marks, labelling in the local language and pre-export verification of conformity by an appointed body.",
    onPiTrade:
      "The destination's conformity requirements are attached to the contract as required documents, so the goods cannot pass the customs milestone without them.",
    covers: [
      "Destination product standards and marking rules",
      "Pre-export verification of conformity programmes",
      "Local-language labelling and metrology requirements",
      "Type approval, registration and homologation",
      "Halal, kosher, organic and other scheme certification",
    ],
    documents: ["Certificate of conformity", "Test report", "Type approval", "Label artwork approval"],
    charging: "Per product family assessed — quoted in π.",
    standards: ["WTO TBT Agreement", "ISO/IEC 17065 & 17025", "National technical regulations"],
    reach: ["national"],
  },
  {
    slug: "aid-consignments",
    name: "Humanitarian, aid & emergency consignments",
    group: "government",
    tagline: "Relief and donated goods moved with duty relief and full traceability.",
    traditional:
      "Relief cargo needs donation certificates, duty and tax exemption approvals, consignee authorisation and priority clearance during emergencies.",
    onPiTrade:
      "Donor, implementing agency and receiving authority all sign the same record; exemption approvals and distribution milestones are hashed for donor reporting.",
    covers: [
      "Donation and gift certification",
      "Duty and tax exemption applications",
      "Priority and simplified emergency clearance",
      "Consignee authorisation for agencies and ministries",
      "Distribution milestones and donor audit export",
    ],
    documents: ["Donation certificate", "Exemption approval", "Consignment note", "Distribution report"],
    charging: "Zero platform fee for verified relief consignments; network fees only.",
    standards: ["Istanbul Convention Annex B.9", "WCO relief consignment guidelines", "Sphere logistics standards"],
    reach: ["global", "national"],
  },
  // ── Digital settlement & QFS ─────────────────────────────────────────────
  {
    slug: "qfs-settlement",
    name: "QFS-compatible settlement rail",
    group: "settlement",
    tagline: "Asset-backed, ledger-native settlement instead of correspondent banking.",
    traditional:
      "Cross-border payment hops through correspondent banks over SWIFT messaging, taking days, losing value to spreads and leaving both parties blind to the money in flight.",
    onPiTrade:
      "Value moves as π on the Pi blockchain — one hop, final in seconds, with the payment identifier and transaction hash written onto the contract so settlement and trade documents reconcile themselves.",
    covers: [
      "Direct wallet-to-wallet settlement with no correspondent chain",
      "ISO 20022-style structured remittance data carried on each payment",
      "Payment-versus-document release at every milestone",
      "Immutable transaction hash bound to invoice and contract reference",
      "Real-time position and float visibility for both parties",
    ],
    documents: ["Payment instruction", "Settlement confirmation", "Transaction hash record", "Reconciliation statement"],
    charging: "Network fee only; no correspondent or spread charges.",
    standards: ["ISO 20022 message semantics", "Pi Network consensus & Horizon API", "BIS PvP settlement principles"],
    reach: ["global"],
  },
  {
    slug: "treasury-reconciliation",
    name: "Treasury, reconciliation & audit trail",
    group: "settlement",
    tagline: "Every π in and out, matched to a contract and provable to an auditor.",
    traditional:
      "Finance teams reconcile bank statements to invoices by hand, chase unapplied credits and rebuild an audit trail from archived paper.",
    onPiTrade:
      "The ledger records every top-up, escrow funding, milestone release, payout and fee with the contract it belongs to, so the statement is the audit trail.",
    covers: [
      "Immutable π ledger per organisation and per contract",
      "Escrow float, released and pending balances",
      "Automatic matching of payments to invoices and milestones",
      "Exportable statements for accounting and tax filing",
      "Dual-signature control over outbound payouts",
    ],
    documents: ["Ledger statement", "Escrow position report", "Remittance advice", "Audit export"],
    charging: "Included in platform use — no separate π charge.",
    standards: ["IFRS 15 revenue recognition", "ISAE 3402 control reporting", "ISO 20022 reconciliation data"],
    reach: ["global"],
  },
];

export function getService(slug: string): TradeService | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

export function servicesByGroup(group: ServiceGroup): TradeService[] {
  return SERVICES.filter((s) => s.group === group);
}

export function servicesByReach(reach: ServiceReach): TradeService[] {
  return SERVICES.filter((s) => serviceReach(s).includes(reach));
}
