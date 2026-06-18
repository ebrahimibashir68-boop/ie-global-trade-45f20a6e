import { createFileRoute } from "@tanstack/react-router";

// Server-Side Approval for Pi U2A payments.
// Docs: https://github.com/pi-apps/pi-platform-docs/blob/master/payments.md
export const Route = createFileRoute("/api/pi/payments/approve")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.PI_API_KEY;
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "Missing PI_API_KEY on server" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
        let paymentId: string | undefined;
        try {
          const body = (await request.json()) as { paymentId?: string };
          paymentId = body.paymentId;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        if (!paymentId) return new Response("Missing paymentId", { status: 400 });

        const piRes = await fetch(
          `https://api.minepi.com/v2/payments/${paymentId}/approve`,
          { method: "POST", headers: { Authorization: `Key ${apiKey}` } },
        );
        if (!piRes.ok) {
          const detail = await piRes.text().catch(() => "");
          return new Response(
            JSON.stringify({ error: "approve failed", status: piRes.status, detail }),
            { status: 502, headers: { "Content-Type": "application/json" } },
          );
        }
        return Response.json({ ok: true });
      },
    },
  },
});
