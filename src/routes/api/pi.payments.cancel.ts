import { createFileRoute } from "@tanstack/react-router";
import { jsonError, piPaymentAction, verifyPiCaller } from "@/lib/pi-api.server";

// Cancels a Pi U2A payment that was opened but never reached the blockchain.
// Called by the SDK's onIncompletePaymentFound handler so a pioneer is never
// blocked from starting a new payment.
export const Route = createFileRoute("/api/pi/payments/cancel")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await verifyPiCaller(request))) return jsonError("Unauthorized", 401);

        let paymentId: string | undefined;
        try {
          const body = (await request.json()) as { paymentId?: string };
          paymentId = body.paymentId;
        } catch {
          return jsonError("Invalid JSON", 400);
        }
        if (!paymentId) return jsonError("Missing paymentId", 400);

        return piPaymentAction(paymentId, "cancel");
      },
    },
  },
});
