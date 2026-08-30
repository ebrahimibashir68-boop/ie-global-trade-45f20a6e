// Single source of truth for which Pi Network the app talks to.
// Switch the whole app with one env var:
//   VITE_PI_NETWORK = "mainnet" | "testnet"   (browser / Pi SDK sandbox flag)
//   PI_NETWORK      = "mainnet" | "testnet"   (server / Horizon + passphrase)
// Everything else — SDK version, sandbox mode, Horizon URL, network
// passphrase — is derived from it, so Mainnet and Testnet never drift apart.

export type PiNetwork = "mainnet" | "testnet";

/** Pi SDK version pinned by the Pi Platform (script tag must match). */
export const PI_SDK_VERSION = "2.0";

/** Pi Platform API base — identical on both networks. */
export const PI_API_BASE = "https://api.minepi.com/v2";

export const PI_HORIZON = {
  mainnet: "https://api.mainnet.minepi.com",
  testnet: "https://api.testnet.minepi.com",
} as const;

export const PI_PASSPHRASE = {
  mainnet: "Pi Network",
  testnet: "Pi Testnet",
} as const;

export function normalizeNetwork(value: string | undefined | null): PiNetwork {
  return String(value ?? "").trim().toLowerCase() === "testnet" ? "testnet" : "mainnet";
}

/** Network selected for browser-side Pi SDK usage. */
export function piNetwork(): PiNetwork {
  return normalizeNetwork(import.meta.env["VITE_PI_NETWORK"] as string | undefined);
}

/** Pi.init sandbox flag — true only on Testnet. */
export function piSandbox(): boolean {
  return piNetwork() === "testnet";
}

export function piNetworkLabel(network: PiNetwork = piNetwork()): string {
  return network === "testnet" ? "Pi Testnet" : "Pi Mainnet";
}
