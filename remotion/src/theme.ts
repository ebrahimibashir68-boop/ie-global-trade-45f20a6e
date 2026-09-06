export const C = {
  bg: "#0a1020",
  bg2: "#111a30",
  ink: "#f4f1e8",
  muted: "#9aa7c2",
  gold: "#e8b44a",
  gold2: "#f7d98a",
  line: "rgba(232,180,74,0.28)",
};

export const SCENES = [
  {
    id: "01",
    kicker: "PiTrade",
    title: "Global trade,\nsettled in \u03c0.",
    bullets: ["Import & export smart contracts", "Built for the Pi ecosystem", "90-second walkthrough"],
    seconds: 14.064,
  },
  {
    id: "02",
    kicker: "Step 01",
    title: "Sign in with Pi.",
    bullets: ["Open PiTrade in the Pi Browser", "Grants username, payments, wallet address", "Token verified with the Pi platform"],
    seconds: 16.968,
  },
  {
    id: "03",
    kicker: "Step 02",
    title: "Your \u03c0 wallet.",
    bullets: ["Balance, history and bills in \u03c0", "Top up, transfer, pay, withdraw", "Ledger updates only after verification"],
    seconds: 17.616,
  },
  {
    id: "04",
    kicker: "Step 03",
    title: "Create a contract.",
    bullets: ["Goods, quantity, HS code", "Incoterm, origin, destination, window", "Counter-party Pi username"],
    seconds: 18.216,
  },
  {
    id: "05",
    kicker: "Step 04",
    title: "Sign and fund.",
    bullets: ["Both parties sign", "createPayment \u2192 approve \u2192 complete", "Contract moves to Funded"],
    seconds: 16.608,
  },
  {
    id: "06",
    kicker: "Step 05",
    title: "Ship and release.",
    bullets: ["Documents \u2192 loaded \u2192 transit \u2192 delivered", "Each milestone releases escrowed \u03c0", "Payouts signed by the app wallet"],
    seconds: 19.2,
  },
  {
    id: "07",
    kicker: "Anytime",
    title: "Ask the AI crew.",
    bullets: ["Trade desk, compliance, documents", "Clauses, screenings, paperwork", "Global trade, settled in \u03c0"],
    seconds: 15.168,
  },
] as const;

export const FPS = 30;
export const PAD = 20; // frames of breathing room per scene
export const sceneFrames = (s: number) => Math.ceil(s * FPS) + PAD;
