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

// Server-Side Approval for Pi U2A payments.
// Docs: https://github.com/pi-apps/pi-platform-docs/blob/master/payments.md
export const Route = createFileRoute("/api/pi/payments/approve")({
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
          console.error("[Pi] approve failed", piRes.status, detail);
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
