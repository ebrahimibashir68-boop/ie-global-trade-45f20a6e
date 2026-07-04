import { defineTool } from "@lovable.dev/mcp-js";

const INCOTERMS = [
  { code: "EXW", name: "Ex Works", summary: "Buyer collects from seller's premises; buyer bears all costs and risk from origin." },
  { code: "FOB", name: "Free On Board", summary: "Seller delivers goods on board the vessel at named port; risk transfers once loaded." },
  { code: "CIF", name: "Cost, Insurance & Freight", summary: "Seller pays freight and minimum insurance to destination port; risk transfers at origin port." },
  { code: "DAP", name: "Delivered At Place", summary: "Seller delivers to named destination, ready for unloading; seller bears risk to arrival." },
  { code: "DDP", name: "Delivered Duty Paid", summary: "Seller delivers to buyer cleared for import; seller bears all costs, duties, and risk." },
];

export default defineTool({
  name: "list_incoterms",
  title: "List supported Incoterms",
  description:
    "List the Incoterms PiTrade supports in contracts, with a short summary of buyer/seller responsibilities.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: JSON.stringify(INCOTERMS, null, 2) }],
    structuredContent: { incoterms: INCOTERMS },
  }),
});
