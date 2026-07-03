import { useCallback, useEffect, useState } from "react";
import { Wallet, Copy, Check } from "lucide-react";
import { connectWallet, hasWalletScope, type PiUser } from "@/lib/pi";
import { loadSession, saveSession } from "@/lib/pi-session";

function short(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function PiWalletButton({ compact = false }: { compact?: boolean }) {
  const [user, setUser] = useState<PiUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUser(loadSession());
    const h = () => setUser(loadSession());
    window.addEventListener("pi:session", h);
    return () => window.removeEventListener("pi:session", h);
  }, []);

  const connect = useCallback(async () => {
    setLoading(true);
    try {
      const u = await connectWallet();
      saveSession(u);
    } catch (e) {
      console.error("[Pi] wallet connect failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const copy = async () => {
    if (!user?.walletAddress) return;
    try {
      await navigator.clipboard.writeText(user.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch (e) {
      console.error(e);
    }
  };

  // Not signed in yet — hide (PiConnectButton handles that path).
  if (!user) return null;

  if (hasWalletScope(user) && user.walletAddress) {
    return (
      <button
        onClick={copy}
        title={user.walletAddress}
        className={`group inline-flex items-center gap-2 rounded-full border border-gold/40 bg-surface px-3 py-1.5 transition hover:border-gold ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        <Wallet className="size-3.5 text-gold" />
        <span className="font-mono text-foreground">{short(user.walletAddress)}</span>
        {copied ? (
          <Check className="size-3.5 text-emerald-400" />
        ) : (
          <Copy className="size-3.5 text-muted-foreground group-hover:text-foreground" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-full border border-gold/40 bg-surface px-3 py-1.5 font-medium text-foreground transition hover:border-gold disabled:opacity-60 ${
        compact ? "text-xs" : "text-sm"
      }`}
    >
      <Wallet className="size-3.5 text-gold" />
      {loading ? "Connecting…" : "Connect Pi Wallet"}
    </button>
  );
}
