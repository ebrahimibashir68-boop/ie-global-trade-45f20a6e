import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C } from "../theme";

export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 120) * 40;
  const drift2 = Math.cos(frame / 90) * 30;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${C.bg} 0%, ${C.bg2} 60%, #0b1428 100%)` }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(600px 600px at ${1200 + drift}px ${220 + drift2}px, rgba(232,180,74,0.20), transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(700px 700px at ${180 - drift}px ${900 + drift2}px, rgba(60,120,220,0.16), transparent 70%)`,
        }}
      />
      {/* grid */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize: "96px 96px",
          transform: `translateY(${(frame % 96) * -0.25}px)`,
          opacity: 0.5,
        }}
      />
    </AbsoluteFill>
  );
};
