import type { Contract } from "@/lib/contracts-store";
import { Link } from "@tanstack/react-router";

const STATUS_LABEL: Record<Contract["status"], string> = {
  draft: "Draft",
  awaiting_payment: "Awaiting Pi payment",
  funded: "Funded · in escrow",
  in_transit: "In transit",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_TONE: Record<Contract["status"], string> = {
  draft: "bg-muted text-muted-foreground",
  awaiting_payment: "bg-gold/15 text-gold border border-gold/40",
  funded: "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30",
  in_transit: "bg-sky-500/15 text-sky-300 border border-sky-400/30",
  completed: "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40",
  cancelled: "bg-destructive/20 text-destructive-foreground border border-destructive/40",
};

export function ContractCard({ contract }: { contract: Contract }) {
  return (
    <Link
      to="/contracts/$id"
      params={{ id: contract.id }}
      className="group relative block overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-card transition hover:border-gold/60 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{contract.category}</div>
          <h3 className="mt-1 text-lg font-semibold leading-tight text-foreground">{contract.title}</h3>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider ${STATUS_TONE[contract.status]}`}>
          {STATUS_LABEL[contract.status]}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{contract.originCountry}</span>
        <svg width="28" height="10" viewBox="0 0 28 10" className="text-gold"><path d="M0 5h24m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
        <span className="font-medium text-foreground">{contract.destinationCountry}</span>
        <span className="ml-auto rounded-md bg-surface-2 px-2 py-0.5 text-xs font-mono text-gold-soft">{contract.incoterm}</span>
      </div>

      <div className="mt-5 flex items-end justify-between border-t border-border/60 pt-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Settlement</div>
          <div className="font-display text-2xl font-semibold text-gold">
            π {contract.amountPi.toLocaleString()}
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div>{contract.quantity.toLocaleString()} {contract.unit}</div>
          <div className="mt-0.5">@{contract.buyerUsername}</div>
        </div>
      </div>
    </Link>
  );
}
