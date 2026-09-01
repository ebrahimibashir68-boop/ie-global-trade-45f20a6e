import { createFileRoute } from "@tanstack/react-router";
import { jsonError, piPaymentAction, verifyPiCaller } from "@/lib/pi-api.server";

// Server-Side Approval for Pi U2A payments.
// Docs: https://github.com/pi-apps/pi-platform-docs/blob/master/payments.md
export const Route = createFileRoute("/api/pi/payments/approve")({
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

        return piPaymentAction(paymentId, "approve");
      },
    },
  },
});
