import { createFileRoute } from "@tanstack/react-router";

async function verifyCaller(request: Request): Promise<boolean> {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token) return false;
  try {
    const r = await fetch("https://api.minepi.com/v2/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return r.ok;
  } catch (e) {
    console.error("[Pi] caller verification error", e);
    return false;
  }
}

// Server-Side Completion for Pi U2A payments.
export const Route = createFileRoute("/api/pi/payments/complete")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.PI_API_KEY;
        if (!apiKey) {
          console.error("[Pi] Missing PI_API_KEY on server");
          return new Response(
            JSON.stringify({ error: "Server misconfigured" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
        if (!(await verifyCaller(request))) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401, headers: { "Content-Type": "application/json" } },
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
          console.error("[Pi] complete failed", piRes.status, detail);
          return new Response(
            JSON.stringify({ error: "Payment operation failed. Please try again." }),
            { status: 502, headers: { "Content-Type": "application/json" } },
          );
        }
        return Response.json({ ok: true });
      },
    },
  },
});
