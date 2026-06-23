import { useCallback, useEffect, useRef, useState } from "react";
import { authenticate, initPi } from "@/lib/pi";
import { clearSession, loadSession, saveSession } from "@/lib/pi-session";
import type { PiUser } from "@/lib/pi";

export function PiConnectButton({ compact = false }: { compact?: boolean }) {
  const [user, setUser] = useState<PiUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [piReady, setPiReady] = useState(false);
  const autoTried = useRef(false);

  const connect = useCallback(async () => {
    setLoading(true);
    try {
      const u = await authenticate();
      saveSession(u);
    } catch (e) {
      console.error("[Pi] auth failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const existing = loadSession();
    setUser(existing);
    const handler = () => setUser(loadSession());
    window.addEventListener("pi:session", handler);

    // Await SDK init, then auto-trigger authentication once on load
    initPi().then((ready) => {
      setPiReady(ready);
      if (ready && !existing && !autoTried.current) {
        autoTried.current = true;
        void connect();
      }
    });

    return () => window.removeEventListener("pi:session", handler);
  }, [connect]);

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-2 rounded-full border border-gold/40 bg-surface px-3 py-1.5 ${compact ? "text-xs" : "text-sm"}`}>
          <span className="size-2 rounded-full bg-gold shadow-gold" />
          <span className="font-medium text-foreground">@{user.username}</span>
        </div>
        <button
          onClick={() => clearSession()}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Disconnect
        </button>
      </div>
    );
  }

  if (mounted && !piReady) {
    return (
      <div
        role="status"
        className={`flex items-center gap-2 rounded-full border border-gold/40 bg-surface/70 px-3 py-1.5 ${compact ? "text-[11px]" : "text-xs"} text-muted-foreground`}
        title="The Pi SDK only loads inside the official Pi Browser."
      >
        <span className="size-2 rounded-full bg-gold/60" />
        <span>
          <span className="font-medium text-foreground">Pi SDK not available.</span>{" "}
          Open this app inside <span className="text-gold">Pi Browser</span> to sign in.
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={loading || !piReady}
      className="group inline-flex items-center gap-2 rounded-full bg-gold-grad px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
    >
      <span className="font-display text-base leading-none">π</span>
      {loading ? "Signing in…" : !mounted ? "Sign in with Pi" : "Sign in with Pi"}
    </button>
  );
}
