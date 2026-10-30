// Every shot of the film: the timeline's times (scripts/timeline.py) joined to each scene's poses.
import { TIMELINE } from './timeline.js';
import { SCENE1 } from './scene1.js';
import { SCENE2 } from './scene2.js';
import { SCENE3 } from './scene3.js';
import { SCENE4 } from './scene4.js';

const POSES = Object.assign({}, SCENE1, SCENE2, SCENE3, SCENE4);

// a shot not built yet: the living room, wide and empty, so nothing breaks while scenes are added
const pending = {
  pose(w, lt) {
    w.frameOn([0, 1.2, -1.2], 2.6, { fov: 38 });
  },
};

export const SHOTS = TIMELINE.shots.map((s) => {
  const p = POSES[s.n] || pending;
  const len = s.end - s.start;
  return Object.assign({}, s, { key: s.start + Math.min(len - 0.05, p.key == null ? len / 2 : p.key), pose: p.pose, built: !!POSES[s.n] });
});
