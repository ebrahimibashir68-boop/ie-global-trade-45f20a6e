import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — PiTrade Trade Desk" },
      { name: "description", content: "Sign in to the PiTrade desk to draft, screen, execute and settle cross-border import/export contracts in Pi." },
      { property: "og:title", content: "Sign in — PiTrade Trade Desk" },
      { property: "og:description", content: "Access your trade desk: contracts, documentary escrow, compliance screening and Pi settlement." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/contracts", search: { category: undefined } });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Account created. You can start trading.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) navigate({ to: "/contracts", search: { category: undefined } });
      else toast.info("Check your inbox to confirm your email address.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/contracts", search: { category: undefined } });
  }

  return (
    <div className="min-h-screen bg-hero">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-5 py-16">
        <h1 className="font-display text-2xl font-semibold">
          {mode === "signin" ? "Sign in to your trade desk" : "Open a trade desk"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Contracts, documentary escrow and Pi settlement are private to the parties on each deal.
        </p>

        <button
          onClick={google}
          className="mt-6 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium transition hover:bg-surface-2"
        >
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or email <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              autoComplete="name"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-gold"
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-gold"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-gold"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-gold-grad px-4 py-3 text-sm font-semibold text-primary-foreground shadow-gold disabled:opacity-60"
          >
            {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {mode === "signin" ? "No desk yet? Create an account" : "Already have a desk? Sign in"}
        </button>

        <Link to="/" className="mt-8 text-xs text-muted-foreground hover:text-foreground">
          ← Back to PiTrade
        </Link>
      </main>
    </div>
  );
}
