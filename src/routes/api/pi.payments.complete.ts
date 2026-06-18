import { createFileRoute } from "@tanstack/react-router";

// Server-Side Completion for Pi U2A payments.
export const Route = createFileRoute("/api/pi/payments/complete")({
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
        let txid: string | undefined;
        try {
          const body = (await request.json()) as { paymentId?: string; txid?: string };
          paymentId = body.paymentId;
          txid = body.txid;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        if (!paymentId || !txid)
          return new Response("Missing paymentId or txid", { status: 400 });

        const piRes = await fetch(
          `https://api.minepi.com/v2/payments/${paymentId}/complete`,
          {
            method: "POST",
            headers: {
              Authorization: `Key ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ txid }),
          },
        );
        if (!piRes.ok) {
          const detail = await piRes.text().catch(() => "");
          return new Response(
            JSON.stringify({ error: "complete failed", status: piRes.status, detail }),
            { status: 502, headers: { "Content-Type": "application/json" } },
          );
        }
        return Response.json({ ok: true });
      },
    },
  },
});
