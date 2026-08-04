// Client-safe registry of the PiTrade AI agents. The chat route validates the
// selected agent id against this list and picks the matching system prompt.

export const AGENT_IDS = ["desk", "compliance", "docs", "pi"] as const;
export type AgentId = (typeof AGENT_IDS)[number];

export interface AgentSpec {
  id: AgentId;
  name: string;
  tagline: string;
  blurb: string;
  suggestions: string[];
}

export const AGENTS: AgentSpec[] = [
  {
    id: "desk",
    name: "Trade Desk Agent",
    tagline: "Builds and runs your contracts",
    blurb:
      "Creates draft contracts, updates terms, signs on your behalf and moves shipment milestones forward.",
    suggestions: [
      "Create a contract to import 20 tonnes of Arabica coffee from BR to AE, CIF, 12,000 USD, 4000 π — I'm the buyer.",
      "Show me my contracts and what needs my attention.",
      "Advance the next milestone on my latest contract.",
    ],
  },
  {
    id: "compliance",
    name: "Compliance Agent",
    tagline: "Screening, HS codes, duty",
    blurb:
      "Classifies goods, screens denied parties and controlled goods, and estimates duty, VAT and landed cost.",
    suggestions: [
      "What HS code should I use for stainless steel pipes?",
      "Run a compliance screening on my newest contract.",
      "Estimate duty and VAT for 50,000 USD of HS 0901 into AE.",
    ],
  },
  {
    id: "docs",
    name: "Documentation Agent",
    tagline: "Invoices, B/L, certificates",
    blurb:
      "Issues UN/CEFACT-style trade documents against a contract and explains what each document proves.",
    suggestions: [
      "Issue a commercial invoice for my latest signed contract.",
      "Which documents do I need for a CIF sea shipment into the EU?",
      "Generate a certificate of origin for contract PT-…",
    ],
  },
  {
    id: "pi",
    name: "Pi Settlement Agent",
    tagline: "Wallet, escrow, payments",
    blurb:
      "Explains and tracks Pi Wallet funding, escrow release against milestones, and records settlement on a contract.",
    suggestions: [
      "How do I fund escrow from my Pi Wallet?",
      "What's the escrow release schedule on my latest contract?",
      "Record the Pi payment I just made against contract PT-…",
    ],
  },
];

export function agentById(id: string): AgentSpec {
  return AGENTS.find((a) => a.id === id) ?? AGENTS[0]!;
}
