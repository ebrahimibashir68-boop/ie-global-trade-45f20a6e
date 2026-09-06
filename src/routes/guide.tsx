import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import poster from "@/assets/pitrade-smart-contract.jpg";

const VIDEO_SRC = "/guide/pitrade-guide.mp4";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "PiTrade video guide · Learn the platform in 2 minutes" },
      {
        name: "description",
        content:
          "Watch the narrated PiTrade guide: Pi sign-in, funding your π wallet, drafting a trade contract, signing, funding in π, and milestone-based escrow release.",
      },
      { property: "og:title", content: "PiTrade video guide — trade settled in π" },
      {
        property: "og:description",
        content:
          "A narrated walkthrough of PiTrade: Pi sign-in, π wallet, contract drafting, signing and funding, milestones and payouts.",
      },
      { property: "og:type", content: "video.other" },
      { property: "og:url", content: "https://ie-global-trade.lovable.app/guide" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ie-global-trade.lovable.app/guide" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "VideoObject",
          name: "PiTrade video guide",
          description:
            "Narrated walkthrough of the PiTrade platform: Pi sign-in, π wallet, contract creation, signing and funding in π, milestone escrow release and the AI crew.",
          uploadDate: new Date().toISOString().slice(0, 10),
          contentUrl: "https://ie-global-trade.lovable.app/guide/pitrade-guide.mp4",
          embedUrl: "https://ie-global-trade.lovable.app/guide",
        }),
      },
    ],
  }),
  component: GuidePage,
});

const CHAPTERS = [
  {
    n: "01",
    t: "Sign in with Pi",
    d: "Open PiTrade in the Pi Browser. The app asks for username, payments and wallet-address consent, and your access token is verified with the Pi platform before a session starts.",
  },
  {
    n: "02",
    t: "Your π wallet",
    d: "Balance, transactions and bills are all in π. Top-ups, transfers, bill payments and withdrawals settle as real Pi payments — the ledger only moves after server verification.",
  },
  {
    n: "03",
    t: "Create a contract",
    d: "Goods, quantity and HS code, Incoterm 2020, origin and destination, delivery window and the counter-party's Pi username. Value is denominated in π; fiat is a customs reference only.",
  },
  {
    n: "04",
    t: "Sign and fund",
    d: "Both parties sign. The buyer pays in π: createPayment → server approve → server complete with the blockchain transaction id. Only then does the contract become Funded.",
  },
  {
    n: "05",
    t: "Ship and release",
    d: "Milestones run from documents issued to delivered. Each completed milestone releases its share of the escrowed π, with app-to-user payouts signed by the PiTrade app wallet.",
  },
  {
    n: "06",
    t: "Ask the AI crew",
    d: "Trade desk, compliance, documentation and settlement agents can draft clauses, run screenings and prepare paperwork whenever you are unsure.",
  },
];

function GuidePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-5 py-12">
        <div className="text-[11px] uppercase tracking-[0.22em] text-gold">Guide</div>
        <h1 className="mt-1 font-display text-4xl font-semibold md:text-5xl">
          Learn PiTrade in one narrated walkthrough.
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          A two-minute video with audio narration covering every step, from Pi sign-in to
          milestone-based settlement in π. Watch it here or download it to share with your team
          and counter-parties.
        </p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-gold/30 bg-card shadow-card">
          <video
            className="aspect-video w-full bg-black"
            src={VIDEO_SRC}
            poster={poster}
            controls
            preload="metadata"
            playsInline
          >
            Your browser cannot play this video.
          </video>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-5 py-4">
            <div className="text-sm text-muted-foreground">
              PiTrade guide · narrated · 2 minutes
            </div>
            <a
              href={VIDEO_SRC}
              download="pitrade-guide.mp4"
              className="rounded-full bg-gold-grad px-4 py-2 text-sm font-medium text-primary-foreground shadow-gold"
            >
              Download video
            </a>
          </div>
        </div>

        <h2 className="mt-12 font-display text-2xl font-semibold">Chapters</h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-2">
          {CHAPTERS.map((c) => (
            <li key={c.n} className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="font-display text-2xl font-semibold text-gold">{c.n}</div>
              <div>
                <div className="font-semibold text-foreground">{c.t}</div>
                <div className="mt-1 text-sm text-muted-foreground">{c.d}</div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 rounded-2xl border border-gold/30 bg-surface p-6 text-sm text-muted-foreground">
          <div className="font-display text-base text-foreground">Next steps</div>
          <p className="mt-2">
            Read the step-by-step{" "}
            <Link to="/how-it-works" className="text-gold">
              protocol page
            </Link>
            , review{" "}
            <Link to="/trust" className="text-gold">
              trust &amp; security
            </Link>
            , or{" "}
            <Link to="/contracts/new" className="text-gold">
              draft your first contract
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
