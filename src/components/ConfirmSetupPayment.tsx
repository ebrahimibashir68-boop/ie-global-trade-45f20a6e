import { useState } from "react";
import { createPayment } from "@/lib/pi";
import { loadSession } from "@/lib/pi-session";

export function ConfirmSetupPayment() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error" | "cancelled">("idle");
  const [detail, setDetail] = useState<string>("");

  const pay = async () => {
    const session = loadSession();
    if (!session) {
      setStatus("error");
      setDetail("Sign in with Pi first.");
      return;
    }
    setStatus("running");
    setDetail("");
    try {
      const result = await createPayment({
        amount: 1,
        memo: "PiTrade — ecosystem setup confirmation",
        metadata: { kind: "setup_confirmation", username: session.username },
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
          disabled={status === "running"}
          className="inline-flex items-center gap-2 rounded-full bg-gold-grad px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold transition hover:brightness-105 disabled:opacity-60"
        >
          <span className="font-display text-base leading-none">π</span>
          {status === "running" ? "Processing…" : "Pay 1 π to confirm"}
        </button>
      </div>
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
