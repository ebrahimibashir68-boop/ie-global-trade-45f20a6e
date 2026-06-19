import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/trust")({
  head: () => ({
    meta: [
      { title: "Trust, security & privacy · PiTrade" },
      { name: "description", content: "How PiTrade handles authentication, payments, data, and privacy on the Pi Network." },
      { property: "og:title", content: "Trust, security & privacy · PiTrade" },
      { property: "og:description", content: "How PiTrade handles authentication, payments, data, and privacy on the Pi Network." },
    ],
  }),
  component: TrustPage,
});

const SECTIONS: { t: string; d: string }[] = [
  {
    t: "Authentication",
    d: "Sign-in runs through the official Pi Network SDK. PiTrade requests only the username and payments scopes. Every access token is re-validated server-side by calling the Pi Platform's /v2/me endpoint before a session is established.",
  },
  {
    t: "Payments",
    d: "User-to-app payments are created via Pi.createPayment. PiTrade's server approves and completes each payment against api.minepi.com using a server-only API key. The privileged approve and complete endpoints require a bearer access token on every call and reject unauthenticated requests.",
  },
  {
    t: "Data we handle",
    d: "PiTrade processes the Pi username and uid returned by sign-in, plus the contract fields the user enters (goods, quantity, Incoterm, origin, destination, counter-party Pi username). Contract drafts in this MVP are stored locally in the user's browser; payment identifiers and transaction ids flow through the Pi Platform.",
  },
  {
    t: "Secrets & API keys",
    d: "Server-side secrets (such as the Pi Platform API key) are stored in the hosting environment and are never shipped to the browser. Client code only ever sees the user's own Pi access token.",
  },
  {
    t: "Transport security",
    d: "PiTrade is served over HTTPS. Calls to the Pi Platform API (api.minepi.com) and to PiTrade's own /api routes are encrypted in transit.",
  },
  {
    t: "Hosting & platform",
    d: "PiTrade is built and hosted on Lovable. Lovable provides the build, hosting, and deployment platform. This page lists controls PiTrade has enabled in the app; it is not an independent audit or certification.",
  },
  {
    t: "Error handling",
    d: "When an upstream Pi Platform call fails, PiTrade returns a generic error message to the client and logs the underlying detail only on the server, so upstream internals are not exposed to end users.",
  },
  {
    t: "Your responsibilities",
    d: "Use the official Pi Browser, keep your Pi Wallet recovery phrase private, and verify the counter-party Pi username and contract details before signing a payment. PiTrade cannot reverse a completed on-chain Pi transaction.",
  },
  {
    t: "Security contact",
    d: "If you believe you have found a security issue in PiTrade, please contact the app owner through the channels listed on the home page so it can be triaged.",
  },
];

function TrustPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-5 py-12">
        <div className="text-[11px] uppercase tracking-[0.22em] text-gold">Trust</div>
        <h1 className="mt-1 font-display text-4xl font-semibold md:text-5xl">
          Security, privacy & how PiTrade handles your data.
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          This page is maintained by the PiTrade app owner to answer common
          security and privacy questions about PiTrade. It describes controls
          the app has enabled today and is not a certification or independent
          audit. Lovable provides the underlying build and hosting platform;
          claims about your own data handling, retention, and compliance remain
          the responsibility of the app owner.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {SECTIONS.map((s) => (
            <section
              key={s.t}
              className="rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <h2 className="font-display text-lg font-semibold text-foreground">{s.t}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-gold/30 bg-surface p-6 text-sm text-muted-foreground">
          <div className="font-display text-base text-foreground">Editable content</div>
          <p className="mt-2">
            The statements above reflect the current PiTrade implementation. If
            the app owner adds new integrations, changes data storage, or
            obtains formal compliance attestations, this page should be updated
            to match. See <Link to="/how-it-works" className="text-gold">How it works</Link> for the
            end-to-end payment flow.
          </p>
        </div>
      </div>
    </div>
  );
}
