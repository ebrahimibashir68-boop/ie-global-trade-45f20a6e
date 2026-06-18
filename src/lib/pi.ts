// Pi Network SDK wrapper.
// Loads the official Pi SDK from the Pi Browser context.
// Outside the Pi Browser (e.g. desktop preview) it falls back to a mock
// so the UI remains testable. Swap PI_SANDBOX to false for production.

export type PiUser = {
  uid: string;
  username: string;
  accessToken: string;
};

export type PaymentData = {
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
};

type PiSDK = {
  init: (opts: { version: string; sandbox?: boolean }) => Promise<void> | void;
  authenticate: (
    scopes: string[],
    onIncompletePaymentFound: (payment: unknown) => void,
  ) => Promise<{ user: { uid: string; username: string }; accessToken: string }>;
  createPayment: (
    payment: PaymentData,
    callbacks: {
      onReadyForServerApproval: (paymentId: string) => void;
      onReadyForServerCompletion: (paymentId: string, txid: string) => void;
      onCancel: (paymentId: string) => void;
      onError: (error: Error, payment?: unknown) => void;
    },
  ) => void;
};

declare global {
  interface Window {
    Pi?: PiSDK;
  }
}

export const PI_SANDBOX = true;

let initPromise: Promise<boolean> | null = null;

export function isPiAvailable(): boolean {
  return typeof window !== "undefined" && !!window.Pi;
}

/**
 * Wait for the Pi SDK script to load, then call Pi.init() and await its Promise.
 * Resolves true when the real SDK is initialized, false if it never appears
 * (e.g. running outside the Pi Browser).
 */
export function initPi(): Promise<boolean> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    if (typeof window === "undefined") return false;
    // Wait up to ~5s for the deferred Pi SDK script to attach window.Pi
    const start = Date.now();
    while (!window.Pi && Date.now() - start < 5000) {
      await new Promise((r) => setTimeout(r, 100));
    }
    if (!window.Pi) return false;
    // Pi.init returns a Promise — await it fully before authenticate()
    await Promise.resolve(window.Pi.init({ version: "2.0", sandbox: PI_SANDBOX }));
    return true;
  })();
  return initPromise;
}

export type PiVerifiedSession = PiUser & { verified: boolean };

export async function authenticate(): Promise<PiVerifiedSession> {
  const ready = await initPi();
  if (ready && window.Pi) {
    // Only the "username" scope per requirements
    const scopes = ["username"];
    const auth = await window.Pi.authenticate(scopes, (payment) => {
      console.warn("Incomplete payment found:", payment);
    });
    // Send the access token to the backend for verification against
    // GET https://api.minepi.com/v2/me before establishing a session.
    const res = await fetch("/api/pi/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: auth.accessToken }),
    });
    if (!res.ok) {
      throw new Error(`Pi token verification failed (${res.status})`);
    }
    const verified = (await res.json()) as { uid: string; username: string };
    return {
      uid: verified.uid,
      username: verified.username,
      accessToken: auth.accessToken,
      verified: true,
    };
  }
  // Mock fallback when not in Pi Browser
  await new Promise((r) => setTimeout(r, 400));
  return {
    uid: "mock-" + Math.random().toString(36).slice(2, 10),
    username: "pioneer_demo",
    accessToken: "mock-access-token",
    verified: false,
  };
}

export type PaymentResult = {
  paymentId: string;
  txid: string;
  status: "completed" | "cancelled" | "error";
  message?: string;
};

export async function createPayment(data: PaymentData): Promise<PaymentResult> {
  const ready = await initPi();
  return new Promise((resolve) => {
    if (ready && window.Pi) {
      window.Pi.createPayment(data, {
        onReadyForServerApproval: (paymentId) => {
          console.log("[Pi] approve required:", paymentId);
        },
        onReadyForServerCompletion: (paymentId, txid) => {
          console.log("[Pi] complete required:", paymentId, txid);
          resolve({ paymentId, txid, status: "completed" });
        },
        onCancel: (paymentId) =>
          resolve({ paymentId, txid: "", status: "cancelled" }),
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
