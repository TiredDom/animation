// The sound cues of the picture, for the mix: [{ t, what, shot }], t in film seconds. Each cue is a moment in a shot
// (seconds into it) taken from that shot's motion in scene*.js (named beside it), so a cue moves with its shot when
// scripts/timeline.py retimes the film. The voice lines are not here: they are in TIMELINE.lines.
//
// Listed for the laptop's mix; nothing in the picture reads this file.
import { TIMELINE } from './timeline.js';

const START = Object.fromEntries(TIMELINE.shots.map((s) => [s.n, s.start]));

// [shot, seconds into the shot, what]
const AT = [
  // Scene 1
  [1, 0.0, 'game death sting: "YOU DIED" on the TV'],
  [1, 1.0, 'button click: Y is selected (tv "select" at 1.0)'],
  [2, 0.25, 'pop-out "fwoomp" and shimmer: the ghost lifts out of his body (the stretch peaks at 0.45)'],
  [4, 0.25, 'game beep: the TV flips to SPECTATING · RETURN IN 5:00'],
  [4, 0.9, 'timer tick: 5:00 → 4:59'],
  [4, 1.9, 'timer tick: 4:59 → 4:58'],
  [7, 3.95, 'cat hiss (the arch, 3.95–4.3)'],
  [9, 1.55, 'wall-pass whoosh, peak: the camera goes through the kitchen wall slab'],
  // Scene 2
  [10, 0.0, 'soft wall-pass: his head is out of the wall beside the fridge'],
  [15, 46.8 - START[15], 'the theme starts: downbeat on "Easy." (SPEC: f1404 = 46.8 s; check against k08)'],
  [16, 2.4, 'whoosh: ghost Kip shoots up through the kitchen ceiling (rise 1.6–2.7, accelerating)'],
  // Scene 3
  [17, 0.94, 'whoosh, peak: up through the floor slab into the hall'],
  [18, 0.2, 'whoosh: his head through the closet door'],
  [21, 0.1, 'timer tick: 3:41'],
  [23, 0.8, 'marker cap pop (the pull, 0.55–0.8)'],
  [24, 0.9, 'marker squeak: stroke 1 (0.9–1.2)'],
  [24, 1.35, 'marker squeak: stroke 2 (1.35–1.65)'],
  [24, 1.8, 'marker squeak: stroke 3 (1.8–2.1)'],
  [25, 1.0, '"Hup!" (m03) as she lifts him'],
  ...[1, 2, 3, 4, 5, 6, 7].map((i) => [25, 5.4 + 0.42 * i, `footstep on the stairs, tread ${i} (C0 5.4 + ${i} × STEP 0.42)`]),
  [28, 0.75, 'box rustle: his hands sink through the lid'],
  [28, 2.2, 'box rustle: again, harder, to the wrists'],
  [30, 0.1, 'timer tick: 2:10'],
  [31, 0.6, 'whoosh: up through the floor into the attic (rise 0–1.35)'],
  [33, 0.505, 'the tap on his shoulder: the music stops dead'],
  [33, 0.675, 'the second tap'],
  // Scene 4
  [42, 0.1, 'timer tick: 1:30, louder and faster from here'],
  [42, 0.6, 'the timer turns red'],
  [43, 2.1, 'whoosh: head-first dive through the attic floor (dive 1.82–2.32)'],
  // Scene 5
  [44, 0.4, 'whoosh: feet first down through the living-room ceiling (0–0.95)'],
  [45, 0.4, 'soft whoosh: Mom drifts down through the ceiling (0–1.5)'],
  [46, 0.05, 'whoosh: Kip zips in through the living-room wall (0–0.55)'],
  [47, 0.1, 'timer tick: 0:58'],
  [48, 1.0, 'laundry flump: head first into the pile (dive 0.75–1.25)'],
  [49, 0.95, 'whoosh: he lunges through the coat (0.7–1.25)'],
  [50, 0.95, 'cushion flump: into the heap (dive 0.7–1.15)'],
  [50, 0.1, 'timer tick: 0:31'],
  [52, 0.1, 'timer tick: 0:15, slower from here'],
  [53, 0.0, 'the low point: solo clarinet'],
  [54, 2.25, 'meow: the cat sits down beside him'],
  // Scene 6
  [56, 2.6, 'whoosh: through his bedroom door'],
  [57, 0.1, 'timer tick: 0:05'],
  [58, 0.1, 'timer tick: 0:03'],
  [58, 0.5, 'the swell begins: the leap'],
  [58, 1.1, 'timer tick: 0:02'],
  [58, 2.1, 'timer tick: 0:01'],
  [59, 0.0, 'the hit: cut to his eyes (no black frame)'],
  [59, 0.3, 'wake-up "whoomp": his eyes snap open (0.3–0.37)'],
  // Scene 7
  [62, 0.0, 'morning: the warm glockenspiel theme'],
  [62, 0.55, 'the door swings open (0.55–1.25)'],
  [62, 0.7, 'the candle: the cupcake comes in lit'],
  [65, 0.8, 'the present slides out from under the bed (0.8–1.4)'],
  [66, 2.0, 'the 1-second match: Dad\'s disco photo'],
  [67, 3.3, 'the music\'s button'],
  // Scene 8
  [68, 3.6, 'shimmer: a see-through cat rises out of the cat (3.6–6.0)'],
  [68, 6.9, 'the ghost cat glides off and through the wall (6.9–8.6)'],
  [68, 9.5, 'pizzicato button'],
  [69, 0.0, 'the end theme'],
];

export const CUES = AT.map(([shot, at, what]) => ({ t: Math.round((START[shot] + at) * 1000) / 1000, what, shot })).sort((a, b) => a.t - b.t);
