import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { wipe } from "@remotion/transitions/wipe";
import { Backdrop } from "./components/Backdrop";
import { Scene } from "./scenes/Scene";
import { SCENES, sceneFrames } from "./theme";

export const TRANSITION = 20;

export const MainVideo: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    <TransitionSeries>
      {SCENES.flatMap((s, i) => {
        const nodes = [];
        if (i > 0) {
          nodes.push(
            <TransitionSeries.Transition
              key={`t-${s.id}`}
              presentation={wipe({ direction: i % 2 ? "from-right" : "from-bottom" })}
              timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION })}
            />,
          );
        }
        nodes.push(
          <TransitionSeries.Sequence key={s.id} durationInFrames={sceneFrames(s.seconds)}>
            <Scene
              id={s.id}
              kicker={s.kicker}
              title={s.title}
              bullets={s.bullets}
              index={i}
              total={SCENES.length}
            />
          </TransitionSeries.Sequence>,
        );
        return nodes;
      })}
    </TransitionSeries>
  </AbsoluteFill>
);
