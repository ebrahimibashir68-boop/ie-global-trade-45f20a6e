import { Link } from "@tanstack/react-router";

/**
 * App-wide Pi ecosystem compliance footer.
 * Shown on every page so users always see the settlement, identity and
 * data rules PiTrade operates under.
 */
export function PiComplianceFooter() {
  return (
    <footer className="mt-16 border-t border-border/60 bg-background/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-gold-grad font-display text-base font-bold text-primary-foreground shadow-gold">
              π
            </span>
            <span className="font-display text-sm font-semibold">PiTrade</span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Global import/export smart contracts operated entirely inside the Pi ecosystem.
            π is the sole settlement currency; fiat figures are indicative customs references
            only.
          </p>
        </div>

        <div className="text-xs text-muted-foreground">
          <div className="text-[10px] uppercase tracking-[0.18em] text-foreground">
            Pi ecosystem compliance
          </div>
          <ul className="mt-3 space-y-1.5">
            <li>• Pi Network is the only identity provider — no email or social logins.</li>
            <li>
              • Payments follow the official U2A flow: createPayment → server approve →
              server complete.
            </li>
            <li>• Ledger balances update only after a Pi payment is verified server-side.</li>
            <li>• Access tokens are validated against the Pi Platform API on every call.</li>
            <li>• Running in Pi Testnet/sandbox mode until mainnet listing is approved.</li>
          </ul>
        </div>

        <div className="text-xs text-muted-foreground">
          <div className="text-[10px] uppercase tracking-[0.18em] text-foreground">Desk</div>
          <ul className="mt-3 space-y-1.5">
            <li><Link to="/wallet" className="hover:text-foreground">π Wallet</Link></li>
            <li><Link to="/contracts" search={{ category: undefined }} className="hover:text-foreground">Contracts</Link></li>

            <li><Link to="/how-it-works" className="hover:text-foreground">How it works</Link></li>
            <li><Link to="/trust" className="hover:text-foreground">Trust &amp; security</Link></li>
          </ul>
          <p className="mt-4">
            Not affiliated with the Pi Core Team. Pi, the Pi logo and Pi Network are
            trademarks of the Pi Community Company.
          </p>
        </div>
      </div>
      <div className="border-t border-border/60 px-5 py-4 text-center text-[11px] text-muted-foreground">
        © {new Date().getFullYear()} PiTrade — settled in π on the Pi Network.
      </div>
    </footer>
  );
}
