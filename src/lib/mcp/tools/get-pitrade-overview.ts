import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const OVERVIEW = `PiTrade is a platform for global import/export smart contracts settled on the Pi Network.

Core flows:
- Contracts: users create bilateral trade agreements (goods, quantity, incoterms, price in π, delivery window, buyer/seller).
- Payments: buyers fund contracts from their Pi Wallet. Funds are released against shipment milestones.
- Roles: authenticated Pi users act as buyer or seller. A Pi Wallet connection is required to pay.

Key routes:
- /            — landing page
- /contracts   — list of contracts on this device
- /contracts/new — create a new contract
- /contracts/:id — contract detail, payment, and status
- /how-it-works — end-to-end walkthrough
- /trust       — security, escrow, and dispute model

Data is stored locally in the browser (no server database yet).`;

export default defineTool({
  name: "get_pitrade_overview",
  title: "Get PiTrade overview",
  description:
    "Return a plain-text overview of the PiTrade platform: what it does, main flows, and key routes.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({ content: [{ type: "text", text: OVERVIEW }] }),
});
