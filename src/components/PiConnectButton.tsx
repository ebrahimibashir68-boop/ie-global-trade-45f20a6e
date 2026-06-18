import { useEffect, useState } from "react";
import { authenticate, isPiAvailable } from "@/lib/pi";
import { clearSession, loadSession, saveSession } from "@/lib/pi-session";
import type { PiUser } from "@/lib/pi";

export function PiConnectButton({ compact = false }: { compact?: boolean }) {
  const [user, setUser] = useState<PiUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUser(loadSession());
    const handler = () => setUser(loadSession());
    window.addEventListener("pi:session", handler);
    return () => window.removeEventListener("pi:session", handler);
  }, []);

  const connect = async () => {
    setLoading(true);
    try {
      const u = await authenticate();
      saveSession(u);
    } catch (e) {
      console.error(e);
      alert("Pi wallet connection failed. Open this app in the Pi Browser to use real Pi auth.");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <button
      onClick={connect}
      disabled={loading}
      className="group inline-flex items-center gap-2 rounded-full bg-gold-grad px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
    >
      <span className="font-display text-base leading-none">π</span>
      {loading ? "Connecting…" : isPiAvailable() ? "Connect Pi Wallet" : "Connect (demo)"}
    </button>
  );
}
