// Server-side Pi network resolution. Reads process.env inside functions
// (never at module scope) so the Worker runtime injects values at call time.

import { PI_HORIZON, PI_PASSPHRASE, normalizeNetwork, type PiNetwork } from "./pi-config";

export function piServerNetwork(): PiNetwork {
  return normalizeNetwork(process.env["PI_NETWORK"]);
}

export function piHorizonUrl(): string {
  return process.env["PI_HORIZON_URL"] ?? PI_HORIZON[piServerNetwork()];
}

export function piNetworkPassphrase(): string {
  return process.env["PI_NETWORK_PASSPHRASE"] ?? PI_PASSPHRASE[piServerNetwork()];
}
