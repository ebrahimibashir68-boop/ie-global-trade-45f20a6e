import { Composition } from "remotion";
import { MainVideo, TRANSITION } from "./MainVideo";
import { SCENES, FPS, sceneFrames } from "./theme";

const total =
  SCENES.reduce((a, s) => a + sceneFrames(s.seconds), 0) - TRANSITION * (SCENES.length - 1);

export const RemotionRoot: React.FC = () => (
  <Composition
    id="main"
    component={MainVideo}
    durationInFrames={total}
    fps={FPS}
    width={1280}
    height={720}
  />
);
