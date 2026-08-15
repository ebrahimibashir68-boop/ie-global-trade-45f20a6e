// Single entry point for every Pi payment in the app.
// Guarantees the Pi Wallet is connected (payments + wallet_address scopes)
// before opening the User-to-App payment sheet, so all money movement in
// PiTrade runs on the same verified Pi Wallet rail.

import {
  authenticate,
  createPayment,
  hasPaymentsScope,
  hasWalletScope,
  WALLET_SCOPES,
  type PiUser,
} from "./pi";
import { loadSession, saveSession } from "./pi-session";

export type PiProof = { paymentId: string; txid: string };

/** Ensure a Pi session exists with payments + wallet_address consent. */
export async function ensurePiWallet(): Promise<PiUser> {
  const current = loadSession();
  if (current && hasPaymentsScope(current) && hasWalletScope(current)) return current;
  const fresh = await authenticate(WALLET_SCOPES);
  saveSession(fresh);
  return fresh;
}

/**
 * Run the official Pi U2A flow (createPayment → server approve → server
 * complete) and return the payment proof used for server-side verification.
 */
export async function payWithPiWallet(
  amount: number,
  memo: string,
  metadata: Record<string, unknown> = {},
): Promise<PiProof & { username: string; walletAddress?: string }> {
  const session = await ensurePiWallet();
  const res = await createPayment(
    {
      amount,
      memo,
      metadata: { ...metadata, piUsername: session.username, piUid: session.uid },
    },
    session.accessToken,
  );
  if (res.status === "cancelled") throw new Error("Pi payment cancelled.");
  if (res.status !== "completed" || !res.txid)
    throw new Error(res.message ?? "Pi payment could not be completed.");
  return {
    paymentId: res.paymentId,
    txid: res.txid,
    username: session.username,
    walletAddress: session.walletAddress,
  };
}
