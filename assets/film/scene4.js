// Scene 4: Looking for something? (the attic, night). Kip pulls his head out of the trunk to find Mom's ghost
// beside him: she has had spectator mode all along. She explains the chips, then the rule: back in your body before
// the timer runs out, or stay like this forever. He dives straight down through the floor.
//
// Staging: the roof is a tent, so the cameras look down the length of the attic (the trunk and the moonlit round
// window behind the two of them). Kip floats upright on the ridge line; Mom lounges in the air beside him, legs
// crossed, arms folded: completely at home. Both bodies are opened to the camera, eyes on each other: he is screen
// left and looks right, she is screen right and looks left, in every setup. Mom's real body is frozen in the kitchen.
import * as THREE from 'three';
import { V, L, person, faceTrack, headOf, track, E, ramp } from './stage.js';
import { proneKip } from './scene3.js';

const ATTIC = 5.64;
const DEG = Math.PI / 180;
const floatWith = (w, extra) => Object.assign({}, w.Mascot.POSES.float, extra);

// the marks: side by side across the ridge, a little in front of the trunk
const K0 = [0.5, ATTIC + 0.22, -0.5], M0 = [0.62, ATTIC + 0.05, 0.5];
const kYaw = -52, mYaw = -128;          // opened to the camera at -x, turned toward each other

// Mom lounging in the air: sitting back on nothing, right leg crossed over the left, arms folded on her chest.
export const LOUNGE = { spine: [-20, 0, 0], head: [10, 0, 0], legL: [-80, 0, 6], kneeL: 86, footL: 16, legR: [-98, 0, -10], kneeR: 66, footR: 24 };
export function folded(r, base) {
  r.setPose(base);
  r.root.updateMatrixWorld(true);
  const sp = r.joints.spine;            // hands at the opposite elbows, in the chest's own frame
  return r.solve(base, { L: sp.localToWorld(V(-0.1, 0.33, 0.22)), R: sp.localToWorld(V(0.12, 0.28, 0.25)) });
}
function momGhost(w, t, { face, lean = 0, tilt = 0, pose = null, at = M0, yaw = mYaw }) {
  return person(w, w.cast.ghostMom, t, {
    at, yaw, ghost: true, who: 'mom',
    pose: pose || ((r) => folded(r, Object.assign({}, LOUNGE, { spine: [LOUNGE.spine[0] + lean, 0, 0], head: [LOUNGE.head[0] + lean * 0.3, 8, tilt] }))),
    face: Object.assign({ lookX: -0.45 }, face),
  });
}
const momFace = { lid: 0.2, lidSlant: -0.1, browUp: 0.15, browAsym: 0.6, mouthCurve: 0.45, mouthSkew: 0.35 };

// the setups: the two-shot down the attic, and singles from just either side of it
function twoShot(w, lt, { h = 1.75, look = 0 } = {}) {
  w.frameOn([0.56, ATTIC + 1.3 + look, 0.04], h, { az: -90, el: 0, fov: L.wide, roll: 0.4 * Math.sin(lt * 0.7) });
}
function kipCU(w, lt, h = 0.82, { az = -80, el = 2, dy = 0.02 } = {}) {
  const k = headOf(w.cast.ghostKip);
  w.frameOn([k.x, k.y + dy, k.z], h, { az, el, fov: L.medium, roll: 0.4 * Math.sin(lt * 0.8) });
}
function momMCU(w, lt, h = 0.8, { az = -100, el = 2, dy = 0.05 } = {}) {
  const m = headOf(w.cast.ghostMom);
  w.frameOn([m.x, m.y + dy, m.z], h, { az, el, fov: L.medium, roll: 0.4 * Math.sin(lt * 0.8) });
}

// Kip coming out of the trunk: from the dive of shots 32–33 to upright on his mark.
const _q = new THREE.Quaternion();
function kipOut(w, t, lt, { out, face, pose, at = K0, yaw = kYaw }) {
  const k = w.cast.ghostKip;
  proneKip(w, t, 0, { kick: 0, live: false, who: null, pitch: 118 });
  const p0 = k.root.position.clone(), q0 = k.root.quaternion.clone(), dive = k.pose;
  person(w, k, t, { at, yaw, ghost: true, who: 'kip', pose, face });
  if (out < 1) {
    k.root.position.lerp(p0, 1 - out);
    k.root.quaternion.copy(_q.copy(q0).slerp(k.root.quaternion.clone(), out));
    k.setPose(w.Mascot.mixPose(dive, k.pose, out));
  }
  return k;
}
function kipGhost(w, t, { pose, face, at = K0, yaw = kYaw, talkGain = 1 }) {
  return person(w, w.cast.ghostKip, t, { at, yaw, ghost: true, who: 'kip', pose, face: Object.assign({ lookX: 0.45 }, face), talkGain });
}

export const SCENE4 = {
  34: {
    key: 2.3,
    pose(w, lt, t) {
      w.house.light('attic');
      // he backs out of the trunk and rights himself, turns, and finds her right there: lounging in the air, arms
      // folded, one brow up. "Looking for something?"
      const out = ramp(lt, 0.0, 0.85, E.inOut);
      const turn = ramp(lt, 0.7, 1.25, E.inOut);
      kipOut(w, t, lt, {
        out, yaw: 70 + (kYaw - 70) * turn,
        pose: floatWith(w, { head: [0, -20 * (1 - turn), 0], armL: [-14, 0, 24], elbowL: [-40, 0, 0], armR: [-12, 0, 26], elbowR: [-36, 0, 0] }),
        face: faceTrack(w, lt, [[0, { lid: 0.2, mouthCurve: -0.2, lookX: -0.2 }], [1.0, { lid: 0.18, mouthCurve: -0.1, lookX: 0.4 }],
          [1.25, { eyeScale: 1.2, browUp: 0.9, lookX: 0.5, mouthOpen: 0.1 }], [2.3, { eyeScale: 1.25, browUp: 1, lookX: 0.5, mouthOpen: 0.25, mouthRound: 0.6 }]]),
      });
      momGhost(w, t, { face: faceTrack(w, lt, [[0, momFace], [1.2, Object.assign({}, momFace, { browAsym: 0.75, browUp: 0.2 })]]) });
      twoShot(w, lt);
    },
  },
  35: {
    key: 0.7,
    pose(w, lt, t) {
      w.house.light('attic');
      // the scream: a 5-frame wind-up, then recoil, eyes and mouth wide, hands up beside his face
      const go = ramp(lt, 0.0, 0.18, E.out), goR = ramp(lt, 0.05, 0.24, E.out);
      kipGhost(w, t, {
        talkGain: 1.1,
        pose: floatWith(w, {
          spine: [-12 * go, 0, 0], head: [-8 * go, 0, 2 * Math.sin(lt * 31) * ramp(lt, 0.2, 0.3) * (1 - ramp(lt, 1.3, 1.5))],
          armL: [-30 - 20 * go, 0, 30 + 70 * go], elbowL: [-40 - 70 * go, 0, 0], armR: [-28 - 22 * goR, 0, 30 + 66 * goR], elbowR: [-40 - 66 * goR, 0, 0],
        }),
        face: faceTrack(w, lt, [[0, { eyeScale: 1.25, browUp: 1, mouthOpen: 0.25, mouthRound: 0.6 }], [0.12, { eyeScale: 1.38, browUp: 1, mouthOpen: 0.9, mouthWide: 1.2, mouthRound: 0.3 }],
          [1.4, { eyeScale: 1.38, browUp: 1, mouthOpen: 0.8, mouthWide: 1.15, mouthRound: 0.3 }], [1.8, { eyeScale: 1.25, browUp: 0.9, mouthOpen: 0.3, mouthRound: 0.5 }]]),
      });
      momGhost(w, t, { face: momFace });
      kipCU(w, lt, 0.92);
    },
  },
  36: {
    key: 1.6,
    pose(w, lt, t) {
      w.house.light('attic');
      // "MOM?! You... you have...": he points at her, shaking; she waits, arms folded
      const pt = ramp(lt, 0.0, 0.3, E.out), shake = 2.2 * Math.sin(lt * 23) * pt;
      kipGhost(w, t, {
        pose: floatWith(w, {
          spine: [-6 + 4 * pt, 0, 0], head: [0, -10, 0],
          armL: [-16, 0, 30], elbowL: [-70, 0, 0], armR: [-12 - 64 * pt + shake, -22 * pt, 24 - 6 * pt], elbowR: [-40 + 34 * pt, 0, 0],
        }),
        face: faceTrack(w, lt, [[0, { eyeScale: 1.25, browUp: 0.9, mouthOpen: 0.2 }], [1.1, { eyeScale: 1.2, browUp: 0.75, browTilt: -0.5, mouthCurve: -0.3 }],
          [2.4, { eyeScale: 1.15, browUp: 0.6, browTilt: -0.7, mouthCurve: -0.4, mouthOpen: 0.15 }]]),
      });
      momGhost(w, t, { face: momFace });
      twoShot(w, lt);
    },
  },
  37: {
    key: 2.4,
    pose(w, lt, t) {
      w.house.light('attic');
      // calm, a little amused: "Spectator mode? Sweetie." (her head tilts on Sweetie) "I've had it since I was your age."
      momGhost(w, t, {
        tilt: track(lt, [[1.6, 0], [2.1, -7], [3.0, -7], [3.6, 0]]),
        face: faceTrack(w, lt, [[0, momFace], [0.5, { lid: 0.18, browUp: 0.3, browAsym: 0.5, mouthCurve: 0.4 }], [1.8, { lid: 0.25, browUp: 0.15, mouthCurve: 0.6, happy: 0.2 }],
          [3.2, { lid: 0.15, browUp: 0.25, mouthCurve: 0.45, mouthSkew: 0.2 }]]),
      });
      kipGhost(w, t, { pose: floatWith(w, {}), face: { eyeScale: 1.15, browUp: 0.6, mouthOpen: 0.1 } });
      momMCU(w, lt, track(lt, [[0, 0.92], [5.5, 0.88, E.cam]]));
    },
  },
  38: {
    key: 1.7,
    pose(w, lt, t) {
      w.house.light('attic');
      // she sits up and leans in to him, eyes narrowed, a sly smile: "How do you think I know about the chips?"
      const lean = ramp(lt, 0.15, 0.85);
      momGhost(w, t, {
        lean: 28 * lean,
        face: faceTrack(w, lt, [[0, momFace], [0.45, { lid: 0.32, lidSlant: -0.2, browUp: 0.05, browAsym: 0.3, mouthCurve: 0.55, mouthSkew: 0.4 }], [2.6, { lid: 0.36, lidSlant: -0.25, browAsym: 0.35, mouthCurve: 0.7, mouthSkew: 0.45 }]]),
      });
      kipGhost(w, t, { pose: floatWith(w, {}), face: { eyeScale: 1.15, browUp: 0.6, mouthOpen: 0.1 } });
      momMCU(w, lt, track(lt, [[0, 0.9], [3.2, 0.86, E.cam]]));
    },
  },
  39: {
    key: 3.3,
    pose(w, lt, t) {
      w.house.light('attic');
      // shock into realisation: "Every time I got caught..." (the face blends over 12 frames) "...that was YOU?"
      const pt = ramp(lt, 2.55, 2.85, E.out);
      kipGhost(w, t, {
        pose: floatWith(w, {
          spine: [2 + 6 * pt, 0, 0], head: [track(lt, [[0, -2], [1.4, 4], [2.6, 0], [2.9, -6]]), -6, 0],
          armL: [-16, 0, 28], elbowL: [-60, 0, 0], armR: [-12 - 60 * pt, -20 * pt, 24], elbowR: [-40 + 30 * pt, 0, 0],
        }),
        face: faceTrack(w, lt, [
          [0, { eyeScale: 1.22, browUp: 0.9, mouthOpen: 0.15 }],
          [1.3, { eyeScale: 1.15, browUp: 0.7, lookY: -0.2, mouthCurve: -0.2 }],
          [1.7, { lid: 0.28, lidSlant: 0.4, browUp: -0.2, browTilt: 0.6, mouthCurve: -0.45 }],
          [3.6, { lid: 0.3, lidSlant: 0.6, browUp: -0.35, browTilt: 0.9, mouthCurve: -0.55, mouthOpen: 0.1 }],
        ]),
      });
      momGhost(w, t, { face: momFace });
      kipCU(w, lt, track(lt, [[0, 0.88], [4.1, 0.82, E.cam]]));
    },
  },
  40: {
    key: 1.2,
    pose(w, lt, t) {
      w.house.light('attic');
      // a shrug, smug: a small dip, the hands open out at her sides, a tilt of the head, and the arms fold again
      const s = track(lt, [[0.15, 0], [0.55, 1], [1.35, 1], [1.85, 0]]);
      const dip = Math.sin(Math.PI * ramp(lt, 0.0, 0.25)) * 0.015;
      momGhost(w, t, {
        at: [M0[0], M0[1] - dip, M0[2]],
        pose: (r) => {
          const base = Object.assign({}, LOUNGE, { head: [LOUNGE.head[0], 8, 9 * s] });
          return w.Mascot.mixPose(folded(r, base), Object.assign({}, base, { armL: [-26, 0, 40], elbowL: [-74, 0, 22], armR: [-26, 0, 40], elbowR: [-74, 0, 22] }), s);
        },
        face: faceTrack(w, lt, [[0, momFace], [0.45, { lid: 0.4, lidSlant: -0.2, browUp: 0.35, browAsym: 0.5, mouthCurve: 0.75, mouthSkew: 0.45, happy: 0.15 }], [1.9, { lid: 0.3, browUp: 0.2, browAsym: 0.6, mouthCurve: 0.6, mouthSkew: 0.4 }]]),
      });
      kipGhost(w, t, { pose: floatWith(w, { armL: [-16, 0, 30], elbowL: [-60, 0, 0], armR: [-20, 0, 34], elbowR: [-64, 0, 0] }), face: { lid: 0.3, lidSlant: 0.6, browUp: -0.35, browTilt: 0.9, mouthCurve: -0.55 } });
      momMCU(w, lt, 1.5, { az: -96, dy: -0.32 });
    },
  },
  41: {
    key: 6.6,
    pose(w, lt, t) {
      w.house.light('attic');
      // closer and lower; level, quiet: "One more thing. If your timer hits zero before you're back in your body..."
      // a beat, she leans in, "...you stay like this." A glint: "Forever."
      const lean = ramp(lt, 4.6, 5.3);
      momGhost(w, t, {
        lean: 10 + 16 * lean,
        face: faceTrack(w, lt, [[0, { lid: 0.2, browUp: 0.1, mouthCurve: 0.2 }], [1.2, { lid: 0.25, browUp: -0.05, browTilt: 0.2, mouthCurve: 0.05 }],
          [4.7, { lid: 0.3, browUp: -0.1, browTilt: 0.3, mouthCurve: 0.0 }], [6.8, { lid: 0.34, lidSlant: -0.2, browUp: 0.2, browAsym: 0.5, mouthCurve: 0.5, mouthSkew: 0.4 }]]),
      });
      kipGhost(w, t, { pose: floatWith(w, {}), face: { eyeScale: 1.1, browUp: 0.5 } });
      momMCU(w, lt, track(lt, [[0, 0.88], [8.5, 0.82, E.cam]]), { az: -100, el: -5, dy: 0.05 });
    },
  },
  42: {
    key: 1.0,
    pose(w, lt, t) {
      w.house.light('attic');
      // his view of her under the HUD (the HUD is an overlay): she looks straight at him, still smiling
      momGhost(w, t, { face: { lid: 0.28, browUp: 0.15, browAsym: 0.5, mouthCurve: 0.5, mouthSkew: 0.35, lookX: 0 }, lean: 6 });
      const m = headOf(w.cast.ghostMom), eye = [K0[0] - 0.1, K0[1] + 1.38, K0[2]];
      w.cam(eye, [m.x, m.y - 0.08, m.z], 58, 0.6 * Math.sin(lt * 0.8));
    },
  },
  43: {
    key: 1.0,
    pose(w, lt, t) {
      w.house.light('attic');
      // "Okay, bye!" with a quick two-finger salute, a wind-up, and he dives head first straight down through the
      // floor; she watches him go, unimpressed
      const k = w.cast.ghostKip;
      const wind = ramp(lt, 1.62, 1.82, E.inOut), dive = ramp(lt, 1.82, 2.32, E.in);
      const sal = track(lt, [[0.1, 0], [0.4, 1], [1.2, 1], [1.55, 0]]);
      kipGhost(w, t, {
        pose: floatWith(w, {
          spine: [-4 * wind + 10 * dive, 0, 0], head: [-6 * wind + 20 * dive, 0, 0],
          armR: [-12 - 140 * Math.max(wind, dive), 0, 24 + 70 * sal], elbowR: [-40 - 70 * sal, 0, 0],
          armL: [-10 - 140 * Math.max(wind, dive), 0, 26], elbowL: [-30, 0, 0],
          legL: [-10 + 10 * dive, 0, 2], kneeL: 22 - 16 * dive, footL: 32 + 10 * dive, legR: [-3 + 3 * dive, 0, 2], kneeR: 14 - 10 * dive, footR: 26 + 14 * dive,
        }),
        face: faceTrack(w, lt, [[0, { eyeScale: 1.1, browUp: 0.6, mouthCurve: 0.3 }], [0.3, { happy: 0.3, browUp: 0.5, mouthCurve: 0.8 }],
          [1.55, { happy: 0.2, browUp: 0.4, mouthCurve: 0.6, lookX: 0.2 }], [1.8, { lid: 0.2, lidSlant: 0.5, browUp: -0.2, browTilt: 0.7, mouthCurve: 0.3, lookX: 0 }]]),
      });
      if (wind > 0 || dive > 0) {
        // turn him head-down about his hips and drop him through the boards
        k.root.updateMatrixWorld(true);
        const hips = k.joints.hips.getWorldPosition(V(0, 0, 0)).add(V(0, 0.18 * wind - 2.7 * dive, 0));
        const q = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), kYaw * DEG).multiply(new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), 170 * DEG * dive));
        k.root.quaternion.copy(q);
        k.root.position.copy(hips).sub(V(0, k.dims.hipY, 0).applyQuaternion(q));
      }
      momGhost(w, t, { face: faceTrack(w, lt, [[0, momFace], [1.9, momFace], [2.2, Object.assign({}, momFace, { lookY: -0.6, lookX: -0.2, browAsym: 0.7 })]]) });
      twoShot(w, lt);
    },
  },
};
