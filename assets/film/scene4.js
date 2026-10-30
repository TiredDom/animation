// Scene 4: Looking for something? (the attic, night). Kip pulls his head out of the trunk to find Mom's ghost
// beside him: she has had spectator mode all along. She explains the chips, then the rule: back in your body before
// the timer runs out, or stay like this forever. He dives straight down through the floor.
//
// Both ghosts float upright near the ridge (the only place the roof is high enough): Kip by the trunk's left end,
// Mom a step away toward the middle of the attic. Every setup stays on the front side of the line between them,
// so he always looks screen left and she screen right. Mom's real body is frozen in the kitchen (not in these shots).
import * as THREE from 'three';
import { V, L, person, faceTrack, poseTrack, headOf, track, E, ramp } from './stage.js';
import { proneKip } from './scene3.js';

const ATTIC = 5.64;
const DEG = Math.PI / 180;
const floatWith = (w, extra) => Object.assign({}, w.Mascot.POSES.float, extra);

// the marks: Kip just off the trunk's left end, Mom toward the middle of the attic, facing each other
const K0 = [0.78, ATTIC + 0.22, 0.2], M0 = [0.0, ATTIC + 0.12, -0.14];
const kYaw = (Math.atan2(M0[0] - K0[0], M0[2] - K0[2]) * 180) / Math.PI;
const mYaw = (Math.atan2(K0[0] - M0[0], K0[2] - M0[2]) * 180) / Math.PI;

// Mom's arms folded across her chest (her hands at the opposite elbows, elbows out).
function folded(r, local, base) {
  return r.solve(base, { L: local(-0.1, 1.0, 0.2), R: local(0.12, 0.95, 0.23) });
}
// Mom's ghost on her mark: arms folded unless `pose` says otherwise.
function momGhost(w, t, { face, pose = null, lean = 0, at = M0, yaw = mYaw, headTilt = 0 }) {
  return person(w, w.cast.ghostMom, t, {
    at, yaw, ghost: true, who: 'mom',
    pose: pose || ((r, local) => folded(r, local, { spine: [2 + lean, 0, 0], head: [4 + lean * 0.5, 0, headTilt], legL: [-6, 0, 2], kneeL: 8, footL: 20, legR: [-2, 0, 2], kneeR: 5, footR: 16 })),
    face,
  });
}
const momFace = { lid: 0.2, lidSlant: -0.1, browUp: 0.15, browAsym: 0.6, mouthCurve: 0.45, mouthSkew: 0.35 };

// the setups
const mid = [(K0[0] + M0[0]) / 2, (K0[2] + M0[2]) / 2];
function twoShot(w, lt, { h = 1.5 } = {}) {
  // low on the front side, under the roof slope, looking up at both of them and the ridge
  const n = [-(M0[2] - K0[2]), M0[0] - K0[0]], nl = Math.hypot(n[0], n[1]);
  const c = [mid[0] + (1.5 * n[0]) / nl, mid[1] + (1.5 * n[1]) / nl];
  w.cam([c[0] + 0.12, ATTIC + 0.86, c[1]], [mid[0] + 0.05, ATTIC + h, mid[1]], 46, 0.4 * Math.sin(lt * 0.7));
}
function kipCU(w, lt, h = 0.56, { az = 38, el = 2, dy = 0 } = {}) {
  const k = headOf(w.cast.ghostKip);
  w.frameOn([k.x, k.y - 0.02 + dy, k.z], h, { az: kYaw + az, el, fov: L.medium, roll: 0.4 * Math.sin(lt * 0.8) });
}
function momMCU(w, lt, h = 0.66, { az = -40, el = -14, dy = -0.04 } = {}) {
  const m = headOf(w.cast.ghostMom);
  w.frameOn([m.x, m.y + dy, m.z], h, { az: mYaw + az, el, fov: L.medium, roll: 0.4 * Math.sin(lt * 0.8) });
}

// Kip coming out of the trunk: from the dive of shots 32–33 to upright on his mark, turning to face Mom.
const _q = new THREE.Quaternion();
function kipOut(w, t, lt, { out, face, pose }) {
  const k = w.cast.ghostKip;
  // where the dive left him
  proneKip(w, t, 0, { kick: 0, live: false, who: null, pitch: 118 });
  const p0 = k.root.position.clone(), q0 = k.root.quaternion.clone(), dive = k.pose;
  // upright on the mark
  person(w, k, t, { at: K0, yaw: kYaw, ghost: true, who: 'kip', pose, face });
  const p1 = k.root.position.clone(), q1 = k.root.quaternion.clone();
  if (out < 1) {
    k.root.position.copy(p0).lerp(p1, out);
    k.root.quaternion.copy(_q.copy(q0).slerp(q1, out));
    k.setPose(w.Mascot.mixPose(dive, k.pose, out));
  }
  return k;
}

export const SCENE4 = {
  34: {
    key: 2.3,
    pose(w, lt, t) {
      w.house.light('attic');
      // he backs out of the trunk and rights himself, still muttering to himself, turns, and finds her there:
      // arms folded, one brow up. "Looking for something?"
      const out = ramp(lt, 0.05, 0.85, E.inOut);
      kipOut(w, t, lt, {
        out,
        pose: floatWith(w, { head: [0, track(lt, [[0.6, 40], [1.2, 0]]), 0], spine: [0, track(lt, [[0.6, 24], [1.15, 0]]), 0], armL: [-14, 0, 24], elbowL: [-40, 0, 0], armR: [-12, 0, 26], elbowR: [-36, 0, 0] }),
        face: faceTrack(w, lt, [[0, { lid: 0.2, mouthCurve: -0.2, lookX: 0.3 }], [0.95, { lid: 0.18, mouthCurve: -0.1, lookX: -0.4 }],
          [1.25, { eyeScale: 1.2, browUp: 0.9, lookX: -0.5, mouthOpen: 0.1 }], [2.3, { eyeScale: 1.25, browUp: 1, lookX: -0.5, mouthOpen: 0.25, mouthRound: 0.6 }]]),
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
      const go = ramp(lt, 0.0, 0.18, E.out);
      person(w, w.cast.ghostKip, t, {
        at: K0, yaw: kYaw, ghost: true, who: 'kip', talkGain: 1.1,
        pose: floatWith(w, {
          spine: [-12 * go, 0, 0], head: [-8 * go, 0, 2 * Math.sin(lt * 31) * ramp(lt, 0.2, 0.3) * (1 - ramp(lt, 1.3, 1.5))],
          armL: [-30 - 20 * go, 0, 30 + 70 * go], elbowL: [-40 - 70 * go, 0, 0], armR: [-28 - 22 * ramp(lt, 0.04, 0.22, E.out), 0, 30 + 66 * ramp(lt, 0.04, 0.22, E.out)], elbowR: [-40 - 66 * go, 0, 0],
        }),
        face: faceTrack(w, lt, [[0, { eyeScale: 1.25, browUp: 1, mouthOpen: 0.25, mouthRound: 0.6, lookX: -0.4 }], [0.12, { eyeScale: 1.38, browUp: 1, mouthOpen: 0.9, mouthWide: 1.2, mouthRound: 0.3, lookX: -0.4 }],
          [1.4, { eyeScale: 1.38, browUp: 1, mouthOpen: 0.8, mouthWide: 1.15, mouthRound: 0.3, lookX: -0.4 }], [1.8, { eyeScale: 1.25, browUp: 0.9, mouthOpen: 0.3, mouthRound: 0.5, lookX: -0.4 }]]),
      });
      kipCU(w, lt, 0.7, { dy: 0.04 });
    },
  },
  36: {
    key: 1.6,
    pose(w, lt, t) {
      w.house.light('attic');
      // "MOM?! You... you have...": he points at her, shaking; she waits, arms folded
      const pt = ramp(lt, 0.0, 0.3, E.out), shake = 2.2 * Math.sin(lt * 23) * pt;
      person(w, w.cast.ghostKip, t, {
        at: K0, yaw: kYaw, ghost: true, who: 'kip',
        pose: floatWith(w, {
          spine: [-6 + 4 * pt, 0, 0], head: [0, 6, 0],
          armL: [-12 - 64 * pt + shake, 0, 24 - 6 * pt], elbowL: [-40 + 34 * pt, 0, 0], armR: [-16, 0, 30], elbowR: [-70, 0, 0],
        }),
        face: faceTrack(w, lt, [[0, { eyeScale: 1.25, browUp: 0.9, lookX: -0.45, mouthOpen: 0.2 }], [1.1, { eyeScale: 1.2, browUp: 0.75, browTilt: -0.5, lookX: -0.45, mouthCurve: -0.3 }],
          [2.4, { eyeScale: 1.15, browUp: 0.6, browTilt: -0.7, lookX: -0.45, mouthCurve: -0.4, mouthOpen: 0.15 }]]),
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
      const tilt = track(lt, [[1.6, 0], [2.1, -7], [3.0, -7], [3.6, 0]]);
      momGhost(w, t, {
        headTilt: tilt,
        face: faceTrack(w, lt, [[0, momFace], [0.5, { lid: 0.18, browUp: 0.3, browAsym: 0.5, mouthCurve: 0.4 }], [1.8, { lid: 0.25, browUp: 0.15, mouthCurve: 0.6, happy: 0.2 }],
          [3.2, { lid: 0.15, browUp: 0.25, mouthCurve: 0.45, mouthSkew: 0.2 }]]),
      });
      momMCU(w, lt, track(lt, [[0, 0.68], [5.5, 0.64, E.cam]]));
    },
  },
  38: {
    key: 1.7,
    pose(w, lt, t) {
      w.house.light('attic');
      // she leans in to him, eyes narrowed, a sly smile: "How do you think I know about the chips?"
      const lean = ramp(lt, 0.15, 0.85);
      momGhost(w, t, {
        lean: 14 * lean,
        face: faceTrack(w, lt, [[0, momFace], [0.45, { lid: 0.32, lidSlant: -0.2, browUp: 0.05, browAsym: 0.3, mouthCurve: 0.55, mouthSkew: 0.4 }], [2.6, { lid: 0.36, lidSlant: -0.25, browAsym: 0.35, mouthCurve: 0.7, mouthSkew: 0.45 }]]),
      });
      momMCU(w, lt, track(lt, [[0, 0.64], [3.2, 0.6, E.cam]]), { el: -12 });
    },
  },
  39: {
    key: 3.3,
    pose(w, lt, t) {
      w.house.light('attic');
      // shock into realisation: "Every time I got caught..." (the face blends over 12 frames) "...that was YOU?"
      const pt = ramp(lt, 2.55, 2.85, E.out);
      person(w, w.cast.ghostKip, t, {
        at: K0, yaw: kYaw, ghost: true, who: 'kip',
        pose: floatWith(w, {
          spine: [2 + 6 * pt, 0, 0], head: [track(lt, [[0, -2], [1.4, 4], [2.6, 0], [2.9, -6]]), 4, 0],
          armL: [-12 - 60 * pt, 0, 24], elbowL: [-40 + 30 * pt, 0, 0], armR: [-16, 0, 28], elbowR: [-60, 0, 0],
        }),
        face: faceTrack(w, lt, [
          [0, { eyeScale: 1.22, browUp: 0.9, lookX: -0.45, mouthOpen: 0.15 }],
          [1.3, { eyeScale: 1.15, browUp: 0.7, lookX: -0.45, lookY: -0.2, mouthCurve: -0.2 }],
          [1.7, { lid: 0.28, lidSlant: 0.4, browUp: -0.2, browTilt: 0.6, lookX: -0.45, mouthCurve: -0.45 }],
          [3.6, { lid: 0.3, lidSlant: 0.6, browUp: -0.35, browTilt: 0.9, lookX: -0.45, mouthCurve: -0.55, mouthOpen: 0.1 }],
        ]),
      });
      kipCU(w, lt, track(lt, [[0, 0.62], [4.1, 0.56, E.cam]]));
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
        pose: (r, local) => {
          const base = { spine: [2, 0, 0], head: [4, 0, 9 * s], legL: [-6, 0, 2], kneeL: 8, footL: 20, legR: [-2, 0, 2], kneeR: 5, footR: 16 };
          const fold = folded(r, local, base);
          return w.Mascot.mixPose(fold, Object.assign({}, base, w.Mascot.POSES.shrug, { head: [0, 0, 9 * s] }), s);
        },
        face: faceTrack(w, lt, [[0, momFace], [0.45, { lid: 0.4, lidSlant: -0.2, browUp: 0.35, browAsym: 0.5, mouthCurve: 0.75, mouthSkew: 0.45, happy: 0.15 }], [1.9, { lid: 0.3, browUp: 0.2, browAsym: 0.6, mouthCurve: 0.6, mouthSkew: 0.4 }]]),
      });
      const m = headOf(w.cast.ghostMom);
      w.frameOn([m.x, m.y - 0.5, m.z], 1.45, { az: mYaw - 42, el: -8, fov: L.medium, roll: 0.3 * Math.sin(lt * 0.8) });
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
        lean: 10 * lean,
        face: faceTrack(w, lt, [[0, { lid: 0.2, browUp: 0.1, mouthCurve: 0.2 }], [1.2, { lid: 0.25, browUp: -0.05, browTilt: 0.2, mouthCurve: 0.05 }],
          [4.7, { lid: 0.3, browUp: -0.1, browTilt: 0.3, mouthCurve: 0.0 }], [6.8, { lid: 0.34, lidSlant: -0.2, browUp: 0.2, browAsym: 0.5, mouthCurve: 0.5, mouthSkew: 0.4 }]]),
      });
      momMCU(w, lt, track(lt, [[0, 0.6], [8.5, 0.53, E.cam]]), { el: -18, dy: -0.06 });
    },
  },
  42: {
    key: 1.0,
    pose(w, lt, t) {
      w.house.light('attic');
      // his view of her under the HUD (the HUD is an overlay): she looks straight at him, still smiling
      momGhost(w, t, { face: { lid: 0.28, browUp: 0.15, browAsym: 0.5, mouthCurve: 0.5, mouthSkew: 0.35 } });
      const m = headOf(w.cast.ghostMom), eye = [K0[0], K0[1] + 1.4, K0[2]];
      w.cam(eye, [m.x, m.y + 0.12, m.z], L.wide, 0.6 * Math.sin(lt * 0.8));
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
      person(w, k, t, {
        at: K0, yaw: kYaw, ghost: true, who: 'kip',
        pose: floatWith(w, {
          spine: [-4 * wind + 10 * dive, 0, 0], head: [-6 * wind + 20 * dive, 0, 0],
          armL: [-12 - 140 * Math.max(sal * 0.2, wind, dive), 0, 24 + 70 * sal], elbowL: [-40 - 70 * sal, 0, 0],
          armR: [-10 - 140 * Math.max(wind, dive), 0, 26], elbowR: [-30, 0, 0],
          legL: [-10 + 10 * dive, 0, 2], kneeL: 22 - 16 * dive, footL: 32 + 10 * dive, legR: [-3 + 3 * dive, 0, 2], kneeR: 14 - 10 * dive, footR: 26 + 14 * dive,
        }),
        face: faceTrack(w, lt, [[0, { eyeScale: 1.1, browUp: 0.6, mouthCurve: 0.3, lookX: -0.4 }], [0.3, { happy: 0.3, browUp: 0.5, mouthCurve: 0.8, lookX: -0.4 }],
          [1.55, { happy: 0.2, browUp: 0.4, mouthCurve: 0.6, lookX: -0.2 }], [1.8, { lid: 0.2, lidSlant: 0.5, browUp: -0.2, browTilt: 0.7, mouthCurve: 0.3 }]]),
      });
      if (wind > 0 || dive > 0) {
        // turn him head-down about his hips and drop him through the boards
        k.root.updateMatrixWorld(true);
        const hips = k.joints.hips.getWorldPosition(V(0, 0, 0)).add(V(0, 0.18 * wind - 2.7 * dive, 0));
        const q = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), kYaw * DEG).multiply(new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), 170 * DEG * dive));
        k.root.quaternion.copy(q);
        k.root.position.copy(hips).sub(V(0, k.dims.hipY, 0).applyQuaternion(q));
      }
      momGhost(w, t, { face: faceTrack(w, lt, [[0, momFace], [1.9, momFace], [2.2, Object.assign({}, momFace, { lookY: -0.6, browAsym: 0.7 })]]) });
      twoShot(w, lt);
    },
  },
};
