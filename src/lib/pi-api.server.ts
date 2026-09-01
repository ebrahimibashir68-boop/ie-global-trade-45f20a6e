// Shared server-side helpers for the Pi Platform API.
// Used by the U2A approve/complete/cancel routes so caller verification and
// error handling behave identically everywhere.

import { PI_API_BASE } from "./pi-config";

/** Verify the caller owns a valid Pi access token (GET /v2/me). */
export async function verifyPiCaller(request: Request): Promise<boolean> {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token) return false;
  try {
    const r = await fetch(`${PI_API_BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return r.ok;
  } catch (e) {
    console.error("[Pi] caller verification error", e);
    return false;
  }
}

export function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Call a privileged Pi Platform payment endpoint with the server API key.
 * Returns a generic error to the client; details stay in server logs.
 */
export async function piPaymentAction(
  paymentId: string,
  action: "approve" | "complete" | "cancel",
  body?: Record<string, unknown>,
): Promise<Response> {
  const apiKey = process.env["PI_API_KEY"];
  if (!apiKey) {
    console.error("[Pi] Missing PI_API_KEY on server");
    return jsonError("Server misconfigured", 500);
  }
  const res = await fetch(`${PI_API_BASE}/payments/${paymentId}/${action}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    console.error(`[Pi] ${action} failed`, res.status, await res.text().catch(() => ""));
    return jsonError("Payment operation failed. Please try again.", 502);
  }
  return Response.json({ ok: true });
}
