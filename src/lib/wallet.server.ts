// Server-only π wallet helpers.
// Every value here is denominated in Pi (π). Real-money movement always
// happens on the Pi Network first (createPayment → /approve → /complete);
// this module only mutates the ledger AFTER a payment is verified with the
// Pi Platform API, or when funds already exist in the user's π balance.

import type { SupabaseClient } from "@supabase/supabase-js";

export type PiPaymentProof = { paymentId: string; txid: string };

export type PiPaymentCheck =
  | { ok: true; amount: number }
  | { ok: false; reason: string };

/**
 * Verify a Pi payment against the Pi Platform API.
 * Confirms the payment exists, is developer-approved, carries a verified
 * blockchain transaction with the txid we were given, and is at least the
 * amount the ledger is about to move.
 */
export async function verifyPiPayment(
  proof: PiPaymentProof,
  expectedAmount: number,
): Promise<PiPaymentCheck> {
  const apiKey = process.env["PI_API_KEY"];
  if (!apiKey) return { ok: false, reason: "Server misconfigured" };
  try {
    const res = await fetch(`https://api.minepi.com/v2/payments/${proof.paymentId}`, {
      headers: { Authorization: `Key ${apiKey}` },
    });
    if (!res.ok) return { ok: false, reason: "Pi payment could not be verified" };
    const p = (await res.json()) as {
      amount?: number;
      status?: { developer_approved?: boolean; transaction_verified?: boolean; cancelled?: boolean };
      transaction?: { txid?: string; verified?: boolean } | null;
    };
    if (p.status?.cancelled) return { ok: false, reason: "Pi payment was cancelled" };
    if (!p.status?.developer_approved) return { ok: false, reason: "Pi payment is not approved" };
    const txid = p.transaction?.txid;
    if (!txid || txid !== proof.txid)
      return { ok: false, reason: "Blockchain transaction does not match" };
    if (!(p.status?.transaction_verified || p.transaction?.verified))
      return { ok: false, reason: "Blockchain transaction not verified yet" };
    const amount = Number(p.amount ?? 0);
    if (!(amount > 0) || amount + 1e-7 < expectedAmount)
      return { ok: false, reason: "Pi payment amount is lower than the ledger amount" };
    return { ok: true, amount };
  } catch (e) {
    console.error("[Pi] payment verification error", e);
    return { ok: false, reason: "Pi payment could not be verified" };
  }
}

type Admin = SupabaseClient<never, never, never>;

export async function getAdmin(): Promise<Admin> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as Admin;
}

const sb = (a: Admin) => a as unknown as SupabaseClient;

export async function ensureWallet(admin: Admin, userId: string): Promise<number> {
  const { data } = await sb(admin)
    .from("pi_wallets")
    .select("balance_pi")
    .eq("user_id", userId)
    .maybeSingle();
  if (data) return Number(data.balance_pi);
  const { error } = await sb(admin).from("pi_wallets").insert({ user_id: userId });
  if (error && !/duplicate/i.test(error.message)) throw new Error(error.message);
  return 0;
}

export async function setBalance(admin: Admin, userId: string, balance: number) {
  const { error } = await sb(admin)
    .from("pi_wallets")
    .update({ balance_pi: round7(balance) })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export function round7(n: number) {
  return Math.round(n * 1e7) / 1e7;
}

export type LedgerEntry = {
  user_id: string;
  kind: "topup" | "transfer_in" | "transfer_out" | "bill_payment" | "withdrawal";
  amount_pi: number;
  direction: "credit" | "debit";
  counterparty?: string | null;
  memo?: string | null;
  pi_payment_id?: string | null;
  pi_txid?: string | null;
  balance_after?: number | null;
};

export async function writeLedger(admin: Admin, entry: LedgerEntry) {
  const { error } = await sb(admin).from("pi_transactions").insert({
    ...entry,
    amount_pi: round7(entry.amount_pi),
    balance_after: entry.balance_after == null ? null : round7(entry.balance_after),
    status: "completed",
  });
  if (error) throw new Error(error.message);
}

/** True when this Pi payment has already been written to the ledger. */
export async function paymentAlreadyUsed(admin: Admin, paymentId: string) {
  const { data } = await sb(admin)
    .from("pi_transactions")
    .select("id")
    .eq("pi_payment_id", paymentId)
    .maybeSingle();
  return !!data;
}

/** Resolve a Pi username to a desk account id. */
export async function findUserByPiUsername(admin: Admin, username: string) {
  const handle = username.trim().replace(/^@/, "");
  const { data } = await sb(admin)
    .from("profiles")
    .select("id, display_name")
    .ilike("display_name", handle)
    .maybeSingle();
  return data as { id: string; display_name: string } | null;
}
