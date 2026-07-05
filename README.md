# PiTrade

Global import/export smart contracts settled on the Pi Network.

Built with TanStack Start, React 19, Tailwind v4, and the Pi SDK.

## Pi ecosystem docs

Pi Network reference documentation used by this app lives in [`docs/pi/`](./docs/pi):

- [Frontend SDK overview](./docs/pi/README.md)
- [SDK reference](./docs/pi/SDK_reference.md)
- [Authentication](./docs/pi/authentication.md)
- [Payments (U2A)](./docs/pi/payments.md)
- [Payments advanced (A2U)](./docs/pi/payments_advanced.md)
- [Platform API](./docs/pi/platform_API.md)
- [Ads](./docs/pi/ads.md)
- [PiNet metadata](./docs/pi/pinet.md)
- [Tokens](./docs/pi/tokens.md)
- [Developer Portal](./docs/pi/developer_portal.md)

## How the app maps to Pi

| Concern | Implementation |
| --- | --- |
| SDK init + `authenticate()` | `src/lib/pi.ts` (`initPi`, `authenticate`, `connectWallet`) |
| Access-token verification against `GET /v2/me` | `src/routes/api/pi.verify.ts` |
| U2A payment: server approval (`/v2/payments/:id/approve`) | `src/routes/api/pi.payments.approve.ts` |
| U2A payment: server completion (`/v2/payments/:id/complete`) | `src/routes/api/pi.payments.complete.ts` |
| Wallet scope (`wallet_address`) | `src/components/PiWalletButton.tsx` |
| Session storage | `src/lib/pi-session.ts` |

The `PI_API_KEY` server secret is required for payment approval / completion.
