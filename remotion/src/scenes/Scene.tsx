import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadDisplay } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";
import { C } from "../theme";

const display = loadDisplay("normal", { weights: ["600", "700"], subsets: ["latin"] }).fontFamily;
const body = loadBody("normal", { weights: ["400", "500"], subsets: ["latin"] }).fontFamily;

export const Scene: React.FC<{
  id: string;
  kicker: string;
  title: string;
  bullets: readonly string[];
  index: number;
  total: number;
}> = ({ id, kicker, title, bullets, index, total }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const intro = spring({ frame, fps, config: { damping: 200 } });
  const titleY = interpolate(intro, [0, 1], [46, 0]);
  const blur = interpolate(frame, [0, 18], [10, 0], { extrapolateRight: "clamp" });
  const float = Math.sin(frame / 45) * 6;
  const progress = (index + 1) / total;

  return (
    <AbsoluteFill style={{ fontFamily: body, color: C.ink }}>
      <Audio src={staticFile(`audio/${id}.mp3`)} />

      {/* big ghost numeral */}
      <div
        style={{
          position: "absolute",
          right: -60,
          bottom: -180,
          fontFamily: display,
          fontSize: 620,
          fontWeight: 700,
          color: "rgba(232,180,74,0.07)",
          transform: `translateY(${float}px)`,
          letterSpacing: -20,
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>

      <div style={{ position: "absolute", left: 120, top: 200, maxWidth: 1180 }}>
        <div
          style={{
            opacity: interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" }),
            letterSpacing: 8,
            fontSize: 22,
            textTransform: "uppercase",
            color: C.gold,
            fontWeight: 500,
          }}
        >
          {kicker}
        </div>
        <div
          style={{
            fontFamily: display,
            fontWeight: 700,
            fontSize: 116,
            lineHeight: 1.02,
            marginTop: 18,
            whiteSpace: "pre-line",
            transform: `translateY(${titleY}px)`,
            filter: `blur(${blur}px)`,
            opacity: intro,
            letterSpacing: -2,
          }}
        >
          {title}
        </div>

        <div style={{ marginTop: 56, display: "flex", flexDirection: "column", gap: 22 }}>
          {bullets.map((b, i) => (
            <Sequence key={b} from={26 + i * 14} layout="none">
              <Bullet text={b} />
            </Sequence>
          ))}
        </div>
      </div>

      {/* progress rail */}
      <div style={{ position: "absolute", left: 120, right: 120, bottom: 96, height: 3, background: "rgba(255,255,255,0.09)" }}>
        <div style={{ width: `${progress * 100}%`, height: "100%", background: `linear-gradient(90deg, ${C.gold}, ${C.gold2})` }} />
      </div>
      <div style={{ position: "absolute", left: 120, bottom: 44, fontSize: 20, color: C.muted, letterSpacing: 3 }}>
        PITRADE GUIDE
      </div>
      <div style={{ position: "absolute", right: 120, bottom: 44, fontSize: 20, color: C.muted, letterSpacing: 3 }}>
        {index + 1} / {total}
      </div>
    </AbsoluteFill>
  );
};

const Bullet: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 18, stiffness: 140 } });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        transform: `translateX(${interpolate(s, [0, 1], [-40, 0])}px)`,
        opacity: s,
      }}
    >
      <span
        style={{
          display: "grid",
          placeItems: "center",
          width: 40,
          height: 40,
          borderRadius: 12,
          background: "linear-gradient(140deg,#e8b44a,#f7d98a)",
          color: "#161007",
          fontFamily: display,
          fontWeight: 700,
          fontSize: 24,
          flexShrink: 0,
        }}
      >
        π
      </span>
      <span style={{ fontSize: 38, color: "rgba(244,241,232,0.92)" }}>{text}</span>
    </div>
  );
};
