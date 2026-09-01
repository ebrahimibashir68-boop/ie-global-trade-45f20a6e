// Server-only App-to-User (A2U) payouts on the Pi Network.
// Flow (Pi Platform docs): create payment on the Pi API → sign and submit the
// blockchain transaction from the app wallet → complete the payment with the
// resulting txid. Only ever called after the app ledger has authorised the
// payout for the signed-in pioneer.

import {
  Account,
  Asset,
  Keypair,
  Memo,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-base";

import { PI_API_BASE } from "./pi-config";
import { piHorizonUrl, piNetworkPassphrase } from "./pi-network.server";

export type A2UResult =
  | { ok: true; paymentId: string; txid: string }
  | { ok: false; reason: string };

const PI_API = PI_API_BASE;

/**
 * Resolve the network passphrase from the live Horizon root, falling back to
 * the env-configured network (PI_NETWORK / PI_NETWORK_PASSPHRASE).
 */
async function networkPassphrase(horizon: string): Promise<string> {
  try {
    const res = await fetch(horizon);
    if (res.ok) {
      const root = (await res.json()) as { network_passphrase?: string };
      if (root.network_passphrase) return root.network_passphrase;
    }
  } catch (e) {
    console.error("[Pi] horizon root fetch failed", e);
  }
  return piNetworkPassphrase();
}

/**
 * Send π from the app wallet to a pioneer's Pi Wallet.
 * `uid` is the Pi Network user id of the recipient.
 */
export async function sendA2UPayment(params: {
  uid: string;
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
}): Promise<A2UResult> {
  const apiKey = process.env["PI_API_KEY"];
  const seed = process.env["PI_WALLET_PRIVATE_SEED"];
  if (!apiKey || !seed)
    return { ok: false, reason: "Payouts are not configured on this app wallet yet." };

  const amount = Math.round(params.amount * 1e7) / 1e7;
  if (!(amount > 0)) return { ok: false, reason: "Invalid payout amount." };

  let paymentId: string | undefined;
  try {
    // 1. Create the A2U payment on the Pi Platform API.
    const createRes = await fetch(`${PI_API}/payments`, {
      method: "POST",
      headers: { Authorization: `Key ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        payment: {
          amount,
          memo: params.memo.slice(0, 28),
          metadata: params.metadata,
          uid: params.uid,
        },
      }),
    });
    if (!createRes.ok) {
      console.error("[Pi] A2U create failed", createRes.status, await createRes.text().catch(() => ""));
      return { ok: false, reason: "Pi could not open a payout for this account." };
    }
    const payment = (await createRes.json()) as {
      identifier: string;
      recipient: string;
      amount: number;
    };
    paymentId = payment.identifier;

    // 2. Sign and submit the blockchain transaction from the app wallet.
    const horizon = piHorizonUrl();
    const keypair = Keypair.fromSecret(seed);
    const [passphrase, accRes] = await Promise.all([
      networkPassphrase(horizon),
      fetch(`${horizon}/accounts/${keypair.publicKey()}`),
    ]);
    if (!accRes.ok) {
      console.error("[Pi] app wallet account lookup failed", accRes.status);
      return { ok: false, reason: "App wallet is unavailable. Try again shortly." };
    }
    const acc = (await accRes.json()) as { sequence: string };
    const tx = new TransactionBuilder(new Account(keypair.publicKey(), acc.sequence), {
      fee: "1000000",
      networkPassphrase: passphrase,
    })
      .addOperation(
        Operation.payment({
          destination: payment.recipient,
          asset: Asset.native(),
          amount: amount.toFixed(7),
        }),
      )
      .addMemo(Memo.text(paymentId))
      .setTimeout(180)
      .build();
    tx.sign(keypair);

    const submitRes = await fetch(`${horizon}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ tx: tx.toXDR() }).toString(),
    });
    if (!submitRes.ok) {
      console.error("[Pi] A2U submit failed", submitRes.status, await submitRes.text().catch(() => ""));
      return { ok: false, reason: "The Pi Network rejected the payout transaction." };
    }
    const submitted = (await submitRes.json()) as { id?: string; hash?: string };
    const txid = submitted.id ?? submitted.hash;
    if (!txid) return { ok: false, reason: "Payout transaction had no id." };

    // 3. Acknowledge completion with the Pi Platform API.
    const completeRes = await fetch(`${PI_API}/payments/${paymentId}/complete`, {
      method: "POST",
      headers: { Authorization: `Key ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ txid }),
    });
    if (!completeRes.ok) {
      console.error("[Pi] A2U complete failed", completeRes.status);
    }
    return { ok: true, paymentId, txid };
  } catch (e) {
    console.error("[Pi] A2U payout error", e);
    if (paymentId) {
      await fetch(`${PI_API}/payments/${paymentId}/cancel`, {
        method: "POST",
        headers: { Authorization: `Key ${apiKey}` },
      }).catch(() => undefined);
    }
    return { ok: false, reason: "Payout could not be completed." };
  }
}
