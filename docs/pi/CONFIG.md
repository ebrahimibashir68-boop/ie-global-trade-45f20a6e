# Pi network configuration

The whole app (SDK sandbox flag, Horizon endpoint, network passphrase) is
driven by one setting per side.

| Variable | Side | Values | Default |
| --- | --- | --- | --- |
| `VITE_PI_NETWORK` | browser | `mainnet` \| `testnet` | `mainnet` |
| `PI_NETWORK` | server | `mainnet` \| `testnet` | `mainnet` |
| `PI_HORIZON_URL` | server (optional override) | URL | derived from `PI_NETWORK` |
| `PI_NETWORK_PASSPHRASE` | server (optional override) | string | derived from `PI_NETWORK` |
| `PI_API_KEY` | server | Pi Developer Portal API key | — |
| `PI_WALLET_PRIVATE_SEED` | server | app wallet seed (A2U payouts) | — |

Derived values:

- Mainnet → Horizon `https://api.mainnet.minepi.com`, passphrase `Pi Network`, `Pi.init({ sandbox: false })`
- Testnet → Horizon `https://api.testnet.minepi.com`, passphrase `Pi Testnet`, `Pi.init({ sandbox: true })`

The Pi Platform API base (`https://api.minepi.com/v2`) is the same on both
networks and lives in `src/lib/pi-config.ts`.

## Payment lifecycle implemented

1. `Pi.init({ version: "2.0", sandbox })` — awaited as a Promise.
2. `Pi.authenticate(["username","payments","wallet_address"], onIncompletePaymentFound)`.
3. Unfinished payments are settled automatically: `/api/pi/payments/complete`
   when a blockchain txid exists, otherwise `/api/pi/payments/cancel`.
4. U2A: `Pi.createPayment` → `/api/pi/payments/approve` → `/api/pi/payments/complete`.
5. A2U: create payment on the Pi API → sign/submit on Horizon with the app
   wallet → complete with the txid (`src/lib/pi-a2u.server.ts`).

Every privileged route verifies the caller's Pi access token against
`GET /v2/me` before touching the Pi API.
