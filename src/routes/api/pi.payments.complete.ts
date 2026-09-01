import { createFileRoute } from "@tanstack/react-router";
import { jsonError, piPaymentAction, verifyPiCaller } from "@/lib/pi-api.server";

// Server-Side Completion for Pi U2A payments.
export const Route = createFileRoute("/api/pi/payments/complete")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await verifyPiCaller(request))) return jsonError("Unauthorized", 401);

        let paymentId: string | undefined;
        let txid: string | undefined;
        try {
          const body = (await request.json()) as { paymentId?: string; txid?: string };
          paymentId = body.paymentId;
          txid = body.txid;
        } catch {
          return jsonError("Invalid JSON", 400);
        }
        if (!paymentId || !txid) return jsonError("Missing paymentId or txid", 400);

        return piPaymentAction(paymentId, "complete", { txid });
      },
    },
  },
});
