import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { authenticate, initPi, REQUIRED_PAYMENT_SCOPES } from "@/lib/pi";
import { loadSession, saveSession } from "@/lib/pi-session";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in with Pi — PiTrade Trade Desk" },
      {
        name: "description",
        content:
          "Sign in to the PiTrade desk with your Pi Network account to draft, screen, execute and settle cross-border import/export contracts in Pi.",
      },
      { property: "og:title", content: "Sign in with Pi — PiTrade Trade Desk" },
      {
        property: "og:description",
        content:
          "Pi is the only identity on PiTrade: one Pi account for contracts, documentary escrow and π settlement.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [piReady, setPiReady] = useState<boolean | null>(null);

  const goDesk = useCallback(
    () => navigate({ to: "/contracts", search: { category: undefined } }),
    [navigate],
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) goDesk();
    });
    initPi().then(setPiReady);
  }, [goDesk]);

  async function signInWithPi() {
    setBusy(true);
    try {
      const user = await authenticate(REQUIRED_PAYMENT_SCOPES);
      saveSession(user);
      if (!user.verified) {
        toast.info("Preview mode — open PiTrade in Pi Browser to sign in for real.");
        return;
      }
      toast.success(`Welcome, @${user.username}`);
      goDesk();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Pi sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  const existing = typeof window !== "undefined" ? loadSession() : null;

  return (
    <div className="min-h-screen bg-hero">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-5 py-16">
        <h1 className="font-display text-2xl font-semibold">Sign in with Pi</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          PiTrade runs entirely inside the Pi ecosystem. Your Pi Network account is your trade
          identity, and every contract is settled in π — there are no separate passwords or
          third-party logins.
        </p>

        <button
          onClick={signInWithPi}
          disabled={busy}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold-grad px-4 py-3 text-sm font-semibold text-primary-foreground shadow-gold transition hover:brightness-105 disabled:opacity-60"
        >
          <span className="font-display text-base leading-none">π</span>
          {busy ? "Signing in…" : "Continue with Pi Network"}
        </button>

        {piReady === false && (
          <p className="mt-4 rounded-xl border border-gold/40 bg-surface px-4 py-3 text-xs text-muted-foreground">
            The Pi SDK is only available inside the official{" "}
            <span className="text-gold">Pi Browser</span>. Open{" "}
            <span className="font-mono">ie-global-trade.lovable.app</span> there to sign in and
            settle in π.
          </p>
        )}

        {existing && !existing.accessToken.startsWith("mock") && (
          <p className="mt-4 text-xs text-muted-foreground">
            Signed in as <span className="text-foreground">@{existing.username}</span>
          </p>
        )}

        <ul className="mt-8 space-y-2 text-xs text-muted-foreground">
          <li>• Your Pi access token is verified server-side against the Pi Platform API.</li>
          <li>• The <span className="font-mono">payments</span> scope lets you fund escrow from your Pi Wallet.</li>
          <li>• Contract value, escrow and milestone releases are denominated in π.</li>
          <li>• Any unfinished Pi payment is resolved automatically when you sign in.</li>
          <li>• Connected to <span className="text-gold">{piNetworkLabel()}</span>.</li>
        </ul>


        <Link to="/" className="mt-8 text-xs text-muted-foreground hover:text-foreground">
          ← Back to PiTrade
        </Link>
      </main>
    </div>
  );
}
