import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../out");
fs.mkdirSync(outDir, { recursive: true });

const bundled = await bundle({ entryPoint: path.resolve(__dirname, "../src/index.ts") });
const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: { args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"] },
  chromeMode: "chrome-for-testing",
});
const composition = await selectComposition({ serveUrl: bundled, id: "main", puppeteerInstance: browser });

const CHUNK = 600;
const total = composition.durationInFrames;
const chunks = [];
for (let s = 0; s < total; s += CHUNK) chunks.push([s, Math.min(s + CHUNK - 1, total - 1)]);

const deadline = Date.now() + Number(process.env.BUDGET_MS ?? 420000);
for (const [i, [from, to]] of chunks.entries()) {
  const out = path.join(outDir, `chunk-${String(i).padStart(2, "0")}.mp4`);
  if (fs.existsSync(out)) continue;
  if (Date.now() > deadline) {
    console.log("BUDGET_REACHED");
    break;
  }
  console.log("rendering", i, from, to);
  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: "h264",
    audioCodec: "aac",
    outputLocation: out,
    puppeteerInstance: browser,
    concurrency: 8,
    scale: 2 / 3,
    frameRange: [from, to],
  });
}
await browser.close({ silent: false });
const done = fs.readdirSync(outDir).filter((f) => f.endsWith(".mp4")).length;
console.log(`chunks ${done}/${chunks.length}`);
