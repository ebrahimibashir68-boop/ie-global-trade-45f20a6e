import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, Landmark, Plus, Receipt, Trash2, Wallet } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { PiAuthGate } from "@/components/PiAuthGate";
import { payWithPiWallet } from "@/lib/pi-pay";
import { PiWalletButton } from "@/components/PiWalletButton";
import {
  addBill,
  getWalletOverview,
  payBill,
  recordTopUp,
  removeBill,
  sendTransfer,
  withdrawToPiWallet,
} from "@/lib/wallet.functions";
import { getAppWalletStatus } from "@/lib/app-wallet.functions";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "π Wallet — Balances, Transfers & Bills | PiTrade" },
      {
        name: "description",
        content:
          "Hold your PiTrade balance in π, top up from your Pi Wallet, transfer to other pioneers and settle bills — every movement is a verified Pi Network payment.",
      },
      { property: "og:title", content: "π Wallet — Balances, Transfers & Bills | PiTrade" },
      {
        property: "og:description",
        content:
          "Top up, transfer and pay bills in π. Ledger updates only after the Pi Network payment is approved and completed server-side.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <div className="min-h-screen bg-hero">
      <SiteHeader />
      <PiAuthGate>
        <WalletPage />
      </PiAuthGate>
    </div>
  ),
});

const input =
  "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-gold";

function pi(n: number | string) {
  const v = Number(n);
  return `π ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 })}`;
}

/** Run the official Pi U2A flow through the connected Pi Wallet. */
async function payWithPi(amount: number, memo: string, metadata: Record<string, unknown>) {
  const proof = await payWithPiWallet(amount, memo, metadata);
  return { paymentId: proof.paymentId, txid: proof.txid };
}

function WalletPage() {
  const qc = useQueryClient();
  const overview = useServerFn(getWalletOverview);
  const topUpFn = useServerFn(recordTopUp);
  const transferFn = useServerFn(sendTransfer);
  const addBillFn = useServerFn(addBill);
  const payBillFn = useServerFn(payBill);
  const removeBillFn = useServerFn(removeBill);
  const withdrawFn = useServerFn(withdrawToPiWallet);

  const { data, isLoading } = useQuery({
    queryKey: ["pi-wallet"],
    queryFn: () => overview(),
  });

  const appWalletFn = useServerFn(getAppWalletStatus);
  const { data: appWallet } = useQuery({
    queryKey: ["app-wallet-status"],
    queryFn: () => appWalletFn(),
    staleTime: 60_000,
  });

  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: ["pi-wallet"] }), [qc]);

  const [topUpAmount, setTopUpAmount] = useState(10);
  const [transfer, setTransfer] = useState({ to: "", amount: 1, memo: "" });
  const [withdrawAmount, setWithdrawAmount] = useState(1);
  const [bill, setBill] = useState({ biller: "", reference: "", category: "", amountPi: 1, dueDate: "" });

  const balance = Number(data?.balancePi ?? 0);
  const unpaid = useMemo(
    () => (data?.bills ?? []).filter((b) => b.status === "unpaid"),
    [data],
  );
  const dueTotal = unpaid.reduce((s, b) => s + Number(b.amount_pi), 0);

  const topUp = useMutation({
    mutationFn: async () => {
      const proof = await payWithPi(topUpAmount, `PiTrade wallet top-up`, {
        type: "wallet_topup",
      });
      return topUpFn({ data: { ...proof, amountPi: topUpAmount } });
    },
    onSuccess: () => {
      toast.success("Top-up settled on the Pi Network");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const send = useMutation({
    mutationFn: async (funding: "balance" | "pi_payment") => {
      if (!transfer.to.trim()) throw new Error("Enter a recipient Pi username.");
      const base = {
        toUsername: transfer.to,
        amountPi: transfer.amount,
        memo: transfer.memo || undefined,
      };
      if (funding === "balance") return transferFn({ data: { ...base, funding } });
      const proof = await payWithPi(transfer.amount, `Transfer to @${transfer.to.replace(/^@/, "")}`, {
        type: "wallet_transfer",
        to: transfer.to,
      });
      return transferFn({ data: { ...base, funding, ...proof } });
    },
    onSuccess: () => {
      toast.success("Transfer settled in π");
      setTransfer({ to: "", amount: 1, memo: "" });
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createBill = useMutation({
    mutationFn: async () => {
      if (!bill.biller.trim()) throw new Error("Enter the biller name.");
      return addBillFn({
        data: {
          biller: bill.biller,
          reference: bill.reference || undefined,
          category: bill.category || undefined,
          amountPi: bill.amountPi,
          dueDate: bill.dueDate || undefined,
        },
      });
    },
    onSuccess: () => {
      toast.success("Bill added");
      setBill({ biller: "", reference: "", category: "", amountPi: 1, dueDate: "" });
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const settleBill = useMutation({
    mutationFn: async (v: { id: string; amount: number; biller: string; funding: "balance" | "pi_payment" }) => {
      if (v.funding === "balance") return payBillFn({ data: { id: v.id, funding: "balance" } });
      const proof = await payWithPi(v.amount, `Bill payment — ${v.biller}`, {
        type: "bill_payment",
        billId: v.id,
      });
      return payBillFn({ data: { id: v.id, funding: "pi_payment", ...proof } });
    },
    onSuccess: () => {
      toast.success("Bill settled in π");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const dropBill = useMutation({
    mutationFn: (id: string) => removeBillFn({ data: { id } }),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  const withdraw = useMutation({
    mutationFn: async () => withdrawFn({ data: { amountPi: withdrawAmount } }),
    onSuccess: (r) => {
      toast.success(`Sent to your Pi Wallet · tx ${String(r.txid).slice(0, 10)}…`);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const busy =
    topUp.isPending || send.isPending || settleBill.isPending || withdraw.isPending;

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <h1 className="font-display text-2xl font-semibold">π Wallet</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every balance, transfer, bill and top-up on PiTrade is denominated and settled in π.
        Funds move on the Pi Network first — the ledger only updates once the payment is
        approved and completed server-side.
      </p>

      {/* Balance */}
      <section className="mt-6 rounded-2xl border border-gold/30 bg-surface p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <Wallet className="size-3.5 text-gold" /> Available balance
            </div>
            <div className="mt-2 font-display text-4xl font-semibold text-gold">
              {isLoading ? "π —" : pi(balance)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {unpaid.length} unpaid bill{unpaid.length === 1 ? "" : "s"} · {pi(dueTotal)} due
            </div>
          </div>
          <div className="flex items-end gap-2">
            <label className="text-xs text-muted-foreground">
              Top up amount
              <input
                type="number"
                min={0.01}
                step="0.01"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(Number(e.target.value))}
                className={`${input} mt-1 w-32`}
              />
            </label>
            <button
              onClick={() => topUp.mutate()}
              disabled={busy || topUpAmount <= 0}
              className="inline-flex items-center gap-2 rounded-xl bg-gold-grad px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold transition hover:brightness-105 disabled:opacity-60"
            >
              <span className="font-display leading-none">π</span>
              {topUp.isPending ? "Settling…" : "Top up from Pi Wallet"}
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-border/70 pt-5">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Withdraw to Pi Wallet
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              App-to-user payout sent from the PiTrade app wallet to your connected Pi Wallet.
            </div>
            <div className="mt-2">
              <PiWalletButton compact />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <label className="text-xs text-muted-foreground">
              Amount
              <input
                type="number"
                min={0.01}
                step="0.01"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                className={`${input} mt-1 w-32`}
              />
            </label>
            <button
              onClick={() => withdraw.mutate()}
              disabled={busy || withdrawAmount <= 0 || balance < withdrawAmount}
              className="inline-flex items-center gap-2 rounded-xl border border-gold/50 px-4 py-2.5 text-sm font-semibold text-gold transition hover:bg-gold/10 disabled:opacity-50"
            >
              <ArrowUpRight className="size-4" />
              {withdraw.isPending ? "Sending…" : "Withdraw π"}
            </button>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Transfer */}
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold">
            <ArrowUpRight className="size-4 text-gold" /> Transfer π
          </h2>
          <div className="mt-4 space-y-3">
            <input
              placeholder="Recipient Pi username (e.g. pioneer_demo)"
              value={transfer.to}
              onChange={(e) => setTransfer({ ...transfer, to: e.target.value })}
              className={input}
            />
            <input
              type="number"
              min={0.01}
              step="0.01"
              value={transfer.amount}
              onChange={(e) => setTransfer({ ...transfer, amount: Number(e.target.value) })}
              className={input}
            />
            <input
              placeholder="Memo (optional)"
              value={transfer.memo}
              onChange={(e) => setTransfer({ ...transfer, memo: e.target.value })}
              className={input}
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => send.mutate("pi_payment")}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-gold-grad px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold transition hover:brightness-105 disabled:opacity-60"
              >
                <span className="font-display leading-none">π</span> Pay with Pi Wallet
              </button>
              <button
                onClick={() => send.mutate("balance")}
                disabled={busy || balance < transfer.amount}
                className="rounded-xl border border-gold/40 px-4 py-2.5 text-sm font-medium transition hover:border-gold disabled:opacity-50"
              >
                Use π balance
              </button>
            </div>
          </div>
        </section>

        {/* Bills */}
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold">
            <Receipt className="size-4 text-gold" /> Bills
          </h2>
          <div className="mt-4 space-y-3">
            {(data?.bills ?? []).length === 0 && (
              <p className="text-xs text-muted-foreground">No bills yet.</p>
            )}
            {(data?.bills ?? []).map((b) => (
              <div
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{b.biller}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {b.category ? `${b.category} · ` : ""}
                    {b.reference ? `${b.reference} · ` : ""}
                    {b.due_date ? `due ${b.due_date}` : "no due date"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm text-gold">{pi(b.amount_pi)}</span>
                  {b.status === "paid" ? (
                    <span className="rounded-full border border-emerald-500/40 px-2 py-1 text-[11px] text-emerald-400">
                      Paid
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() =>
                          settleBill.mutate({
                            id: b.id,
                            amount: Number(b.amount_pi),
                            biller: b.biller,
                            funding: "pi_payment",
                          })
                        }
                        disabled={busy}
                        className="rounded-full bg-gold-grad px-3 py-1 text-[11px] font-semibold text-primary-foreground disabled:opacity-60"
                      >
                        Pay with Pi
                      </button>
                      <button
                        onClick={() =>
                          settleBill.mutate({
                            id: b.id,
                            amount: Number(b.amount_pi),
                            biller: b.biller,
                            funding: "balance",
                          })
                        }
                        disabled={busy || balance < Number(b.amount_pi)}
                        className="rounded-full border border-gold/40 px-3 py-1 text-[11px] disabled:opacity-50"
                      >
                        From balance
                      </button>
                      <button
                        onClick={() => dropBill.mutate(b.id)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Remove bill"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}

            <div className="grid gap-2 rounded-xl border border-dashed border-border p-3 sm:grid-cols-2">
              <input
                placeholder="Biller (e.g. Maersk Line)"
                value={bill.biller}
                onChange={(e) => setBill({ ...bill, biller: e.target.value })}
                className={input}
              />
              <input
                placeholder="Reference"
                value={bill.reference}
                onChange={(e) => setBill({ ...bill, reference: e.target.value })}
                className={input}
              />
              <input
                placeholder="Category (freight, duty…)"
                value={bill.category}
                onChange={(e) => setBill({ ...bill, category: e.target.value })}
                className={input}
              />
              <input
                type="number"
                min={0.01}
                step="0.01"
                value={bill.amountPi}
                onChange={(e) => setBill({ ...bill, amountPi: Number(e.target.value) })}
                className={input}
              />
              <input
                type="date"
                value={bill.dueDate}
                onChange={(e) => setBill({ ...bill, dueDate: e.target.value })}
                className={input}
              />
              <button
                onClick={() => createBill.mutate()}
                disabled={createBill.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold/40 px-4 py-2.5 text-sm font-medium transition hover:border-gold disabled:opacity-60"
              >
                <Plus className="size-4 text-gold" /> Add bill
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Ledger */}
      <section className="mt-6 rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-sm font-semibold">π ledger</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Each entry is written only after the Pi Network payment is verified with the Pi
          Platform API.
        </p>
        <div className="mt-4 space-y-2">
          {(data?.transactions ?? []).length === 0 && (
            <p className="text-xs text-muted-foreground">No movements yet.</p>
          )}
          {(data?.transactions ?? []).map((t) => (
            <div
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 px-3 py-2.5 text-sm"
            >
              <div className="flex items-center gap-2">
                {t.direction === "credit" ? (
                  <ArrowDownLeft className="size-4 text-emerald-400" />
                ) : (
                  <ArrowUpRight className="size-4 text-gold" />
                )}
                <div>
                  <div className="font-medium capitalize">{t.kind.replace(/_/g, " ")}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {t.counterparty ?? "—"}
                    {t.memo ? ` · ${t.memo}` : ""}
                    {t.pi_txid ? ` · tx ${t.pi_txid.slice(0, 10)}…` : ""}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`font-display ${t.direction === "credit" ? "text-emerald-400" : "text-gold"}`}
                >
                  {t.direction === "credit" ? "+" : "−"}
                  {pi(t.amount_pi)}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {new Date(t.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
