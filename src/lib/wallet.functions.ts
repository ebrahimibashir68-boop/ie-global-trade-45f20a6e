// Authenticated π wallet server functions.
// Thin module: imports, types and server-function declarations only.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  ensureWallet,
  findUserByPiUsername,
  getAdmin,
  paymentAlreadyUsed,
  round7,
  setBalance,
  verifyPiPayment,
  writeLedger,
} from "./wallet.server";

export type PiTransaction = {
  id: string;
  kind: "topup" | "transfer_in" | "transfer_out" | "bill_payment" | "withdrawal";
  amount_pi: number;
  direction: "credit" | "debit";
  counterparty: string | null;
  memo: string | null;
  status: string;
  pi_payment_id: string | null;
  pi_txid: string | null;
  balance_after: number | null;
  created_at: string;
};

export type PiBill = {
  id: string;
  biller: string;
  reference: string | null;
  category: string | null;
  amount_pi: number;
  due_date: string | null;
  status: "unpaid" | "paid";
  paid_at: string | null;
  pi_txid: string | null;
};

const proof = z.object({ paymentId: z.string().min(3), txid: z.string().min(3) });
const amount = z.number().positive().max(1_000_000);

export const getWalletOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await getAdmin();
    const balance = await ensureWallet(admin, context.userId);
    const [{ data: tx }, { data: bills }] = await Promise.all([
      context.supabase
        .from("pi_transactions")
        .select(
          "id, kind, amount_pi, direction, counterparty, memo, status, pi_payment_id, pi_txid, balance_after, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(50),
      context.supabase
        .from("pi_bills")
        .select("id, biller, reference, category, amount_pi, due_date, status, paid_at, pi_txid")
        .order("due_date", { ascending: true }),
    ]);
    return {
      balancePi: balance,
      transactions: (tx ?? []) as unknown as PiTransaction[],
      bills: (bills ?? []) as unknown as PiBill[],
    };
  });

export const recordTopUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    proof.extend({ amountPi: amount }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const admin = await getAdmin();
    if (await paymentAlreadyUsed(admin, data.paymentId))
      throw new Error("This Pi payment has already been settled.");
    const check = await verifyPiPayment(data, data.amountPi);
    if (!check.ok) throw new Error(check.reason);

    const balance = await ensureWallet(admin, context.userId);
    const next = round7(balance + check.amount);
    await setBalance(admin, context.userId, next);
    await writeLedger(admin, {
      user_id: context.userId,
      kind: "topup",
      amount_pi: check.amount,
      direction: "credit",
      counterparty: "Pi Network wallet",
      memo: "Wallet top-up settled on the Pi Network",
      pi_payment_id: data.paymentId,
      pi_txid: data.txid,
      balance_after: next,
    });
    return { balancePi: next };
  });

export const sendTransfer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        toUsername: z.string().min(2).max(60),
        amountPi: amount,
        memo: z.string().max(200).optional(),
        funding: z.enum(["balance", "pi_payment"]),
        paymentId: z.string().optional(),
        txid: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const admin = await getAdmin();
    const recipient = await findUserByPiUsername(admin, data.toUsername);
    if (!recipient) throw new Error("No Pi desk account found for that username.");
    if (recipient.id === context.userId) throw new Error("You cannot transfer to yourself.");

    const senderBalance = await ensureWallet(admin, context.userId);
    let senderAfter = senderBalance;

    if (data.funding === "pi_payment") {
      if (!data.paymentId || !data.txid) throw new Error("Missing Pi payment proof.");
      if (await paymentAlreadyUsed(admin, data.paymentId))
        throw new Error("This Pi payment has already been settled.");
      const check = await verifyPiPayment(
        { paymentId: data.paymentId, txid: data.txid },
        data.amountPi,
      );
      if (!check.ok) throw new Error(check.reason);
    } else {
      if (senderBalance + 1e-7 < data.amountPi)
        throw new Error("Insufficient π balance — top up from your Pi Wallet first.");
      senderAfter = round7(senderBalance - data.amountPi);
      await setBalance(admin, context.userId, senderAfter);
    }

    const recipientBalance = await ensureWallet(admin, recipient.id);
    const recipientAfter = round7(recipientBalance + data.amountPi);
    await setBalance(admin, recipient.id, recipientAfter);

    const senderHandle = (context.claims as { user_metadata?: { pi_username?: string } })
      ?.user_metadata?.pi_username;

    await writeLedger(admin, {
      user_id: context.userId,
      kind: "transfer_out",
      amount_pi: data.amountPi,
      direction: "debit",
      counterparty: `@${recipient.display_name}`,
      memo: data.memo ?? null,
      pi_payment_id: data.paymentId ?? null,
      pi_txid: data.txid ?? null,
      balance_after: senderAfter,
    });
    await writeLedger(admin, {
      user_id: recipient.id,
      kind: "transfer_in",
      amount_pi: data.amountPi,
      direction: "credit",
      counterparty: senderHandle ? `@${senderHandle}` : "PiTrade desk",
      memo: data.memo ?? null,
      pi_txid: data.txid ?? null,
      balance_after: recipientAfter,
    });
    return { balancePi: senderAfter };
  });

export const addBill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        biller: z.string().min(2).max(120),
        reference: z.string().max(80).optional(),
        category: z.string().max(60).optional(),
        amountPi: amount,
        dueDate: z.string().max(20).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("pi_bills").insert({
      user_id: context.userId,
      biller: data.biller,
      reference: data.reference ?? null,
      category: data.category ?? null,
      amount_pi: data.amountPi,
      due_date: data.dueDate || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeBill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("pi_bills").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const payBill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        funding: z.enum(["balance", "pi_payment"]),
        paymentId: z.string().optional(),
        txid: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: bill, error } = await context.supabase
      .from("pi_bills")
      .select("id, biller, amount_pi, status")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!bill) throw new Error("Bill not found.");
    if (bill.status === "paid") throw new Error("This bill is already settled.");

    const admin = await getAdmin();
    const due = Number(bill.amount_pi);
    const balance = await ensureWallet(admin, context.userId);
    let after = balance;

    if (data.funding === "pi_payment") {
      if (!data.paymentId || !data.txid) throw new Error("Missing Pi payment proof.");
      if (await paymentAlreadyUsed(admin, data.paymentId))
        throw new Error("This Pi payment has already been settled.");
      const check = await verifyPiPayment(
        { paymentId: data.paymentId, txid: data.txid },
        due,
      );
      if (!check.ok) throw new Error(check.reason);
    } else {
      if (balance + 1e-7 < due)
        throw new Error("Insufficient π balance — top up from your Pi Wallet first.");
      after = round7(balance - due);
      await setBalance(admin, context.userId, after);
    }

    const { error: upErr } = await (admin as unknown as typeof context.supabase)
      .from("pi_bills")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        pi_payment_id: data.paymentId ?? null,
        pi_txid: data.txid ?? null,
      })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (upErr) throw new Error(upErr.message);

    await writeLedger(admin, {
      user_id: context.userId,
      kind: "bill_payment",
      amount_pi: due,
      direction: "debit",
      counterparty: bill.biller,
      memo: `Bill settled in π${data.funding === "pi_payment" ? " via Pi Wallet" : " from π balance"}`,
      pi_payment_id: data.paymentId ?? null,
      pi_txid: data.txid ?? null,
      balance_after: after,
    });
    return { balancePi: after };
  });

/**
 * App-to-User payout: move π from the desk balance back to the pioneer's
 * Pi Wallet using the Pi Platform A2U flow. The ledger is only debited once
 * the blockchain transaction has been submitted and completed.
 */
export const withdrawToPiWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ amountPi: amount, memo: z.string().max(120).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const meta = (context.claims as { user_metadata?: { pi_uid?: string; pi_username?: string } })
      ?.user_metadata;
    const uid = meta?.pi_uid;
    if (!uid)
      throw new Error("Connect your Pi Wallet by signing in through Pi Browser first.");

    const admin = await getAdmin();
    const balance = await ensureWallet(admin, context.userId);
    if (balance + 1e-7 < data.amountPi)
      throw new Error("Insufficient π balance for this withdrawal.");

    const { sendA2UPayment } = await import("./pi-a2u.server");
    const payout = await sendA2UPayment({
      uid,
      amount: data.amountPi,
      memo: (data.memo ?? "PiTrade withdrawal").slice(0, 28),
      metadata: { type: "wallet_withdrawal", userId: context.userId },
    });
    if (!payout.ok) throw new Error(payout.reason);

    const after = round7(balance - data.amountPi);
    await setBalance(admin, context.userId, after);
    await writeLedger(admin, {
      user_id: context.userId,
      kind: "withdrawal",
      amount_pi: data.amountPi,
      direction: "debit",
      counterparty: meta?.pi_username ? `@${meta.pi_username} (Pi Wallet)` : "Pi Network wallet",
      memo: data.memo ?? "Withdrawal to Pi Wallet",
      pi_payment_id: payout.paymentId,
      pi_txid: payout.txid,
      balance_after: after,
    });
    return { balancePi: after, txid: payout.txid };
  });
