// Pi Network SDK wrapper — current Pi Platform behaviour (SDK 2.0).
//
// * Pi.init() is awaited as a Promise before any authenticate/createPayment.
// * Network (Mainnet/Testnet) and the sandbox flag come from pi-config.ts,
//   driven by a single env var, so nothing is hardcoded per environment.
// * onIncompletePaymentFound is handled everywhere the Pi docs require it:
//   an unfinished payment is settled server-side (complete with its txid, or
//   cancelled when it never reached the blockchain) before a new one opens.
// * Outside the Pi Browser the wrapper falls back to a clearly-marked mock so
//   desktop preview stays usable without ever touching real Pi.

import { PI_SDK_VERSION, piSandbox } from "./pi-config";

export type PiUser = {
  uid: string;
  username: string;
  accessToken: string;
  scopes?: string[];
  walletAddress?: string;
};

export const REQUIRED_PAYMENT_SCOPES = ["username", "payments"] as const;
export const WALLET_SCOPES = ["username", "payments", "wallet_address"] as const;

export function hasPaymentsScope(user: { scopes?: string[] } | null | undefined): boolean {
  return !!user?.scopes?.includes("payments");
}

export function hasWalletScope(user: { scopes?: string[] } | null | undefined): boolean {
  return !!user?.scopes?.includes("wallet_address");
}

export type PaymentData = {
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
};

/** Shape of the payment object the SDK hands to onIncompletePaymentFound. */
export type PiIncompletePayment = {
  identifier: string;
  transaction?: { txid?: string; _link?: string } | null;
};

type PiSDK = {
  init: (opts: { version: string; sandbox?: boolean }) => Promise<void> | void;
  authenticate: (
    scopes: string[],
    onIncompletePaymentFound: (payment: PiIncompletePayment) => void,
  ) => Promise<{
    user: { uid: string; username: string; wallet_address?: string };
    accessToken: string;
  }>;
  createPayment: (
    payment: PaymentData,
    callbacks: {
      onReadyForServerApproval: (paymentId: string) => void;
      onReadyForServerCompletion: (paymentId: string, txid: string) => void;
      onCancel: (paymentId: string) => void;
      onError: (error: Error, payment?: unknown) => void;
    },
  ) => void;
  openShareDialog?: (title: string, message: string) => void;
};

declare global {
  interface Window {
    Pi?: PiSDK;
  }
}

let initPromise: Promise<boolean> | null = null;

export function isPiAvailable(): boolean {
  return typeof window !== "undefined" && !!window.Pi;
}

/** Best-effort Pi Browser detection (for guidance copy only). */
export function isPiBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /PiBrowser/i.test(navigator.userAgent) || isPiAvailable();
}

/**
 * Wait for the Pi SDK script, then call Pi.init() and await its Promise.
 * Resolves true when the real SDK is initialised, false outside Pi Browser.
 */
export function initPi(): Promise<boolean> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    if (typeof window === "undefined") return false;
    const start = Date.now();
    while (!window.Pi && Date.now() - start < 5000) {
      await new Promise((r) => setTimeout(r, 100));
    }
    if (!window.Pi) return false;
    await Promise.resolve(
      window.Pi.init({ version: PI_SDK_VERSION, sandbox: piSandbox() }),
    );
    return true;
  })();
  return initPromise;
}

function authHeaders(accessToken?: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

/**
 * Settle a payment the Pi SDK reports as incomplete. Per the Pi Platform
 * docs a pioneer cannot open a new payment while one is unfinished, so this
 * completes it when a blockchain txid exists and cancels it otherwise.
 */
export async function resolveIncompletePayment(
  payment: PiIncompletePayment,
  accessToken?: string,
): Promise<void> {
  const paymentId = payment?.identifier;
  if (!paymentId) return;
  const txid = payment.transaction?.txid;
  try {
    const endpoint = txid ? "/api/pi/payments/complete" : "/api/pi/payments/cancel";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: authHeaders(accessToken),
      body: JSON.stringify(txid ? { paymentId, txid } : { paymentId }),
    });
    if (!res.ok) console.error("[Pi] incomplete payment cleanup failed", res.status);
  } catch (e) {
    console.error("[Pi] incomplete payment cleanup error", e);
  }
}

export type PiVerifiedSession = PiUser & { verified: boolean };

export async function authenticate(
  scopes: readonly string[] = REQUIRED_PAYMENT_SCOPES,
): Promise<PiVerifiedSession> {
  const ready = await initPi();
  if (ready && window.Pi) {
    const requested = [...scopes];
    const auth = await window.Pi.authenticate(requested, (payment) => {
      void resolveIncompletePayment(payment);
    });
    // Verify the access token server-side against GET /v2/me, then exchange
    // the returned one-time token for an app session. Pi is the only identity.
    const res = await fetch("/api/pi/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: auth.accessToken }),
    });
    if (!res.ok) {
      throw new Error(`Pi sign-in failed (${res.status})`);
    }
    const verified = (await res.json()) as {
      uid: string;
      username: string;
      tokenHash: string;
    };

    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.auth.verifyOtp({
      token_hash: verified.tokenHash,
      type: "email",
    });
    if (error) throw new Error(`Pi session could not be established: ${error.message}`);

    return {
      uid: verified.uid,
      username: verified.username,
      accessToken: auth.accessToken,
      scopes: requested,
      walletAddress: auth.user.wallet_address,
      verified: true,
    };
  }

  // Mock fallback when not in Pi Browser
  await new Promise((r) => setTimeout(r, 400));
  return {
    uid: "mock-" + Math.random().toString(36).slice(2, 10),
    username: "pioneer_demo",
    accessToken: "mock-access-token",
    scopes: [...scopes],
    walletAddress: scopes.includes("wallet_address")
      ? "GDEMO" + Math.random().toString(36).slice(2, 10).toUpperCase()
      : undefined,
    verified: false,
  };
}

/**
 * Re-authenticate to grant the `wallet_address` scope and return the
 * connected wallet address. Uses the standard authenticate() flow so all
 * scopes are re-consented together.
 */
export async function connectWallet(): Promise<PiVerifiedSession> {
  return authenticate(WALLET_SCOPES);
}

export type PaymentResult = {
  paymentId: string;
  txid: string;
  status: "completed" | "cancelled" | "error";
  message?: string;
};

export async function createPayment(
  data: PaymentData,
  accessToken?: string,
): Promise<PaymentResult> {
  const ready = await initPi();
  const headers = authHeaders(accessToken);
  return new Promise((resolve) => {
    if (ready && window.Pi) {
      window.Pi.createPayment(data, {
        onReadyForServerApproval: async (paymentId) => {
          try {
            const res = await fetch("/api/pi/payments/approve", {
              method: "POST",
              headers,
              body: JSON.stringify({ paymentId }),
            });
            if (!res.ok) console.error("[Pi] approve failed", res.status);
          } catch (e) {
            console.error("[Pi] approve error", e);
          }
        },
        onReadyForServerCompletion: async (paymentId, txid) => {
          try {
            const res = await fetch("/api/pi/payments/complete", {
              method: "POST",
              headers,
              body: JSON.stringify({ paymentId, txid }),
            });
            if (!res.ok) {
              console.error("[Pi] complete failed", res.status);
              resolve({ paymentId, txid, status: "error", message: "Server completion failed" });
              return;
            }
          } catch (e) {
            console.error("[Pi] complete error", e);
            resolve({ paymentId, txid, status: "error", message: String(e) });
            return;
          }
          resolve({ paymentId, txid, status: "completed" });
        },
        onCancel: (paymentId) => resolve({ paymentId, txid: "", status: "cancelled" }),
        onError: (error, payment) =>
          resolve({
            paymentId: (payment as { identifier?: string })?.identifier ?? "",
            txid: "",
            status: "error",
            message: error.message,
          }),
      });
      return;
    }
    setTimeout(() => {
      resolve({
        paymentId: "mock-pay-" + Math.random().toString(36).slice(2, 10),
        txid: "mock-tx-" + Math.random().toString(36).slice(2, 12),
        status: "completed",
      });
    }, 1200);
  });
}
