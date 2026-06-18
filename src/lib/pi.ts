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
  init: (opts: { version: string; sandbox?: boolean }) => void;
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

let initialized = false;

export function isPiAvailable(): boolean {
  return typeof window !== "undefined" && !!window.Pi;
}

export function initPi() {
  if (initialized || typeof window === "undefined") return;
  if (window.Pi) {
    window.Pi.init({ version: "2.0", sandbox: PI_SANDBOX });
    initialized = true;
  }
}

export async function authenticate(): Promise<PiUser> {
  initPi();
  if (window.Pi) {
    const scopes = ["username", "payments"];
    const auth = await window.Pi.authenticate(scopes, (payment) => {
      console.warn("Incomplete payment found:", payment);
    });
    return {
      uid: auth.user.uid,
      username: auth.user.username,
      accessToken: auth.accessToken,
    };
  }
  // Mock fallback when not in Pi Browser
  await new Promise((r) => setTimeout(r, 600));
  return {
    uid: "mock-" + Math.random().toString(36).slice(2, 10),
    username: "pioneer_demo",
    accessToken: "mock-access-token",
  };
}

export type PaymentResult = {
  paymentId: string;
  txid: string;
  status: "completed" | "cancelled" | "error";
  message?: string;
};

export function createPayment(data: PaymentData): Promise<PaymentResult> {
  return new Promise((resolve) => {
    initPi();
    if (window.Pi) {
      window.Pi.createPayment(data, {
        onReadyForServerApproval: (paymentId) => {
          // In production: POST to your backend /payments/approve with paymentId
          console.log("[Pi] approve required:", paymentId);
        },
        onReadyForServerCompletion: (paymentId, txid) => {
          // In production: POST to your backend /payments/complete with {paymentId, txid}
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
    // Mock fallback
    setTimeout(() => {
      resolve({
        paymentId: "mock-pay-" + Math.random().toString(36).slice(2, 10),
        txid: "mock-tx-" + Math.random().toString(36).slice(2, 12),
        status: "completed",
      });
    }, 1200);
  });
}
