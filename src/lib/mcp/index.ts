import { defineMcp } from "@lovable.dev/mcp-js";
import getPitradeOverview from "./tools/get-pitrade-overview";
import listIncoterms from "./tools/list-incoterms";
import draftContractClause from "./tools/draft-contract-clause";

export default defineMcp({
  name: "pitrade-mcp",
  title: "PiTrade MCP",
  version: "0.1.0",
  instructions:
    "Tools for PiTrade — a platform for global import/export smart contracts settled on the Pi Network. Use `get_pitrade_overview` to learn what the app does, `list_incoterms` to see supported shipping terms, and `draft_contract_clause` to generate a Markdown contract draft from deal parameters.",
  tools: [getPitradeOverview, listIncoterms, draftContractClause],
});
