import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

const SYSTEM_PROMPT = `You are PiTrade Copilot, the in-app AI assistant for PiTrade — a platform for global import/export smart contracts settled on the Pi Network.

You help users in three ways:
1. Trade assistant — explain how PiTrade works, guide them through creating and signing contracts, and answer questions about Pi Wallet payments, escrow, dispute flow, and shipment milestones.
2. Contract drafter — when a user describes a deal (goods, quantity, incoterms, price in π, delivery window, parties), draft clear contract clauses they can paste into a new contract. Keep drafts concise, structured with headings, and neutral in tone.
3. Market & tech insights — surface short, practical updates about the Pi ecosystem, cross-border trade trends, logistics tech, and how emerging tools could improve their PiTrade workflow. Be honest when something is speculative.

Rules:
- Be concise. Prefer short paragraphs, bullets, and numbered steps.
- Never invent Pi Wallet balances, transaction ids, or on-chain data — you don't have access to the user's wallet.
- If asked to perform an action (create a contract, sign, pay), explain the exact button/flow inside PiTrade instead of pretending to do it.
- Format with Markdown.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: unknown };
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse();
      },
    },
  },
});
