// Scene 8: The cat. Morning. Kip sits up in bed with his present in his lap; the cat on the windowsill. They stare.
// A see-through cat slowly rises out of her, looks at him and glides off through the wall: "...EVERYONE has it?!"
// Then the end screen: the room holds on him staring at the wall, the right 60% of the frame left clear.
//
// Once her ghost is out, the cat's body freezes like everyone else's (no breath, no blink).
import { V, catAt, faceTrack, track, E, ramp, kipInBed } from './stage.js';

const UP = 2.92;

function morning(w) {
  w.mood('morning');
  w.house.light('morning');
}

// the cat on the sill, sitting, turned to him
const SILL_YAW = -168;
function catOnSill(w, t, { live = true, head = [0, 0, 0], face = 'calm' } = {}) {
  const s = w.house.spots.kipSill;
  return catAt(w, w.cast.cat, t, { at: [s.x, s.y - 0.02, s.z - 0.04], yaw: SILL_YAW, pose: 'sit', face, head, live });
}

// Kip sitting up in bed, the present on his lap and his hands on it
function kipWithPresent(w, t, { head = [0, 0, 0], face = {}, who = null }) {
  const g = w.house.props.kipPresent.group;
  g.position.set(0, 0.83, 0.25);
  g.rotation.set(0, 0, 0);
  g.updateMatrixWorld(true);
  const L = g.localToWorld(V(0.25, 0.12, 0.05)), R = g.localToWorld(V(-0.25, 0.12, 0.05));
  return kipInBed(w, t, {
    sit: 1, live: true, who,
    upper: (r, base) => {
      const p = Object.assign({}, base, { spine: [8, 0, 0], head });
      r.setPose(p);
      r.root.updateMatrixWorld(true);
      return r.solve(p, { L, R });
    },
    face,
  });
}

const KIP_STARE = { lid: 0.12, browUp: 0.2, mouthCurve: 0.1 };

export const SCENE8 = {
  68: {
    key: 5.0,
    pose(w, lt, t) {
      morning(w);
      // the stare (3 s); her ghost rises out of her, looks at him, and glides off along the wall and into the corner;
      // his eyes follow it all the way: "...EVERYONE has it?!"
      const rise = ramp(lt, 3.6, 6.0, E.inOut), go = ramp(lt, 6.9, 8.6, E.inOut);
      const out = lt >= 3.6;
      const cat = catOnSill(w, t, { live: !out, head: [-4, 0, 0], face: out ? { eyeScale: 1.05 } : 'calm' });
      // the ghost: same pose and place, rising; a look to him; then off to her left (−x) and through the left wall
      if (out) {
        const s = w.house.spots.kipSill;
        const gx = s.x - 1.35 * go, gy = s.y - 0.02 + 0.3 * rise + 0.04 * Math.sin(lt * 2.6) * rise, gz = s.z - 0.04 - 0.1 * go;
        const turn = ramp(lt, 6.0, 6.5) * (1 - ramp(lt, 6.9, 7.3));
        catAt(w, w.cast.ghostCat, t, {
          at: [gx, gy, gz], yaw: SILL_YAW + (-90 - SILL_YAW) * ramp(lt, 6.7, 7.2), pose: w.Mascot.mixCatPose('sit', 'walk', ramp(lt, 6.7, 7.2)),
          face: 'calm', head: [10 * turn, 0, 14 * turn],
        });
      }
      // his head goes up with the ghost, follows it off to his right, and snaps back to the cat for the line
      const k = kipWithPresent(w, t, {
        who: 'kip',
        head: [track(lt, [[3.6, 6], [5.6, -6], [7.4, -2]]), track(lt, [[6.9, 14], [7.7, -24], [8.1, 12]]), 0],
        face: faceTrack(w, lt, [[0, KIP_STARE], [3.4, Object.assign({}, KIP_STARE, { lid: 0.2, lidSlant: 0.4, browTilt: 0.4 })], [4.4, { eyeScale: 1.25, browUp: 0.8, mouthOpen: 0.1, lookY: 0.2 }],
          [6.0, { eyeScale: 1.35, browUp: 1, mouthOpen: 0.2, mouthRound: 0.4, lookY: 0.25 }], [7.6, { eyeScale: 1.3, browUp: 1, lookX: 0.5 }],
          [9.4, { eyeScale: 1.4, browUp: 1, browTilt: -0.7, mouthCurve: -0.5, mouthWide: 1.1, lookX: 0.3 }]]),
      });
      void cat; void k;
      w.cam([0.0, UP + 1.45, 0.9], [-2.15, UP + 1.2, 1.2], 46);
    },
  },
  69: {
    key: 6.0,
    pose(w, lt, t) {
      morning(w);
      // the end screen: he sits holding his present, staring at the corner the ghost cat went into; the frozen cat on
      // the sill. He is kept in the left 40% of the frame; the right 60% is the quiet room, for YouTube's end-screen
      // elements and the "Next" title.
      catOnSill(w, t, { live: false, head: [-4, 0, 0], face: { eyeScale: 1.05 } });
      kipWithPresent(w, t, {
        head: [-4, -24, 0],
        face: faceTrack(w, lt, [[0, { eyeScale: 1.4, browUp: 1, browTilt: -0.7, mouthCurve: -0.5, mouthWide: 1.1, lookX: 0.3 }],
          [2.0, { eyeScale: 1.3, lid: 0.1, browUp: 0.8, browTilt: -0.6, mouthCurve: -0.4, lookX: 0.35 }], [15, { eyeScale: 1.25, lid: 0.15, browUp: 0.7, browTilt: -0.6, mouthCurve: -0.4, lookX: 0.35 }]]),
      });
      const push = ramp(lt, 0, 15, E.linear);
      w.cam([-2.66 + 0.04 * push, UP + 1.38, 2.15 - 0.14 * push], [-1.66, UP + 1.15, 0.42], 50);
    },
  },
};
