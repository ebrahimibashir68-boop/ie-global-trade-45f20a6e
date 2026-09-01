// Live status of the PiTrade app wallet on the Pi Network.
// Public, read-only: only ever exposes the app wallet's PUBLIC address
// (which is public information on the blockchain) — never the seed or key.

import { createServerFn } from "@tanstack/react-start";
import { Keypair } from "@stellar/stellar-base";
import { piHorizonUrl, piServerNetwork } from "./pi-network.server";

export type AppWalletStatus = {
  configured: boolean;
  apiKeyConfigured: boolean;
  network: "mainnet" | "testnet";
  address: string | null;
  onChain: boolean;
  balancePi: number | null;
  payoutsReady: boolean;
};

export const getAppWalletStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<AppWalletStatus> => {
    const seed = process.env["PI_WALLET_PRIVATE_SEED"];
    const apiKey = process.env["PI_API_KEY"];
    const network = piServerNetwork();
    const base: AppWalletStatus = {
      configured: false,
      apiKeyConfigured: !!apiKey,
      network,
      address: null,
      onChain: false,
      balancePi: null,
      payoutsReady: false,
    };
    if (!seed) return base;

    let address: string;
    try {
      address = Keypair.fromSecret(seed).publicKey();
    } catch {
      console.error("[Pi] PI_WALLET_PRIVATE_SEED is not a valid Stellar secret");
      return base;
    }

    let onChain = false;
    let balancePi: number | null = null;
    try {
      const res = await fetch(`${piHorizonUrl()}/accounts/${address}`);
      if (res.ok) {
        const acc = (await res.json()) as {
          balances?: { asset_type: string; balance: string }[];
        };
        onChain = true;
        const native = acc.balances?.find((b) => b.asset_type === "native");
        if (native) balancePi = Number(native.balance);
      }
    } catch (e) {
      console.error("[Pi] app wallet horizon check failed", e);
    }

    return {
      ...base,
      configured: true,
      address,
      onChain,
      balancePi,
      payoutsReady: !!apiKey && onChain,
    };
  },
);
