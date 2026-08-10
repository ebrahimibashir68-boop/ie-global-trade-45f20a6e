import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { initPi } from "@/lib/pi";

/**
 * Pi-first access gate. Every service in PiTrade is reachable only with a
 * verified Pi Network identity — there is no email or social fallback.
 */
export function PiAuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"loading" | "in" | "out">("loading");
  const [piReady, setPiReady] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setState(data.session ? "in" : "out");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setState(session ? "in" : "out"),
    );
    initPi().then((r) => active && setPiReady(r));
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (state === "in") return <>{children}</>;

  if (state === "loading") {
    return (
      <div className="grid min-h-[60vh] place-items-center px-5">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="size-2 animate-pulse rounded-full bg-gold" />
          Checking your Pi session…
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-[60vh] place-items-center px-5 py-16">
      <div className="w-full max-w-md rounded-2xl border border-gold/30 bg-surface p-6 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-xl bg-gold-grad font-display text-2xl font-bold text-primary-foreground shadow-gold">
          π
        </div>
        <h2 className="mt-4 font-display text-lg font-semibold">Sign in with Pi to continue</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          PiTrade runs entirely on Pi rails. Your Pi Network account is your trade identity,
          balances are held in π, and every transfer, bill and top-up settles as a real Pi
          Network payment.
        </p>
        <Link
          to="/auth"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold-grad px-4 py-3 text-sm font-semibold text-primary-foreground shadow-gold transition hover:brightness-105"
        >
          <span className="font-display text-base leading-none">π</span>
          Continue with Pi Network
        </Link>
        {piReady === false && (
          <p className="mt-4 text-xs text-muted-foreground">
            The Pi SDK only loads inside the official{" "}
            <span className="text-gold">Pi Browser</span> — open PiTrade there to sign in.
          </p>
        )}
      </div>
    </div>
  );
}
