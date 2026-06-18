import { useEffect, useState } from "react";
import { authenticate, createPayment, hasPaymentsScope } from "@/lib/pi";
import { clearSession, loadSession, saveSession } from "@/lib/pi-session";
import type { PiUser } from "@/lib/pi";

export function ConfirmSetupPayment() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error" | "cancelled">("idle");
  const [detail, setDetail] = useState<string>("");
  const [session, setSession] = useState<PiUser | null>(null);
  const [resigning, setResigning] = useState(false);

  useEffect(() => {
    setSession(loadSession());
    const onChange = () => setSession(loadSession());
    window.addEventListener("pi:session", onChange);
    return () => window.removeEventListener("pi:session", onChange);
  }, []);

  const missingPayments = !!session && !hasPaymentsScope(session);

  const reSign = async () => {
    setResigning(true);
    setStatus("idle");
    setDetail("");
    try {
      clearSession();
      const fresh = await authenticate(["username", "payments"]);
      saveSession(fresh);
      setSession(fresh);
    } catch (e) {
      setStatus("error");
      setDetail(`Re-sign failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setResigning(false);
    }
  };

  const pay = async () => {
    const s = loadSession();
    if (!s) {
      setStatus("error");
      setDetail("Sign in with Pi first.");
      return;
    }
    if (!hasPaymentsScope(s)) {
      setStatus("error");
      setDetail('Missing "payments" scope. Re-sign to grant it.');
      return;
    }
    setStatus("running");
    setDetail("");
    try {
      const result = await createPayment({
        amount: 1,
        memo: "PiTrade — ecosystem setup confirmation",
        metadata: { kind: "setup_confirmation", username: s.username },
      });
      if (result.status === "completed") {
        setStatus("done");
        setDetail(`txid ${result.txid.slice(0, 12)}…`);
      } else if (result.status === "cancelled") {
        setStatus("cancelled");
      } else {
        setStatus("error");
        setDetail(result.message ?? "Payment failed");
      }
    } catch (e) {
      setStatus("error");
      setDetail(String(e));
    }
  };

  return (
    <div className="rounded-2xl border border-gold/30 bg-surface/70 p-5 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-gold">Ecosystem check</div>
          <div className="mt-1 font-display text-lg font-semibold">Confirm setup with a 1 π payment</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Runs a real user-to-app payment through the Pi SDK, with server-side approval and completion.
          </div>
        </div>
        <button
          onClick={pay}
          disabled={status === "running" || missingPayments || resigning}
          className="inline-flex items-center gap-2 rounded-full bg-gold-grad px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold transition hover:brightness-105 disabled:opacity-60"
        >
          <span className="font-display text-base leading-none">π</span>
          {status === "running" ? "Processing…" : "Pay 1 π to confirm"}
        </button>
      </div>

      {missingPayments && (
        <div className="mt-4 rounded-xl border border-gold/40 bg-gold/5 p-3 text-sm">
          <div className="font-medium text-gold">Payments permission required</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Your current Pi session is signed in as <span className="text-foreground">{session?.username}</span> but
            does not include the <code className="text-gold">payments</code> scope. Re-sign to grant it before paying.
          </div>
          <button
            onClick={reSign}
            disabled={resigning}
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-gold/60 px-4 py-2 text-xs font-semibold text-gold transition hover:bg-gold/10 disabled:opacity-60"
          >
            {resigning ? "Opening Pi…" : "Re-sign with Payments scope"}
          </button>
        </div>
      )}

      {status !== "idle" && (
        <div className="mt-3 text-xs">
          {status === "done" && <span className="text-gold">✓ Payment completed · {detail}</span>}
          {status === "cancelled" && <span className="text-muted-foreground">Payment cancelled.</span>}
          {status === "error" && <span className="text-red-400">Error: {detail}</span>}
          {status === "running" && <span className="text-muted-foreground">Approve in your Pi Wallet…</span>}
        </div>
      )}
    </div>
  );
}
