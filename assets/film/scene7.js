// Scene 7: Happy birthday. Morning sun in Kip's room. Mom brings a one-candle cupcake, clocks the mustache and keeps
// a straight face; "about last night" gets "no idea what you mean"; the present was under his bed all along; he
// catches himself in the mirror (and, for one second, Dad's disco photo); "MOM!" as she goes.
import * as THREE from 'three';
import { V, person, faceTrack, headOf, poseWith, cruise, track, E, ramp, kipInBed } from './stage.js';
import { walk, walkPhase } from './motion.js';

const UP = 2.92;
const DEG = Math.PI / 180;
const momLeg = 0.642, kipLeg = 0.578;
const MOM_AT = [-1.4, UP, 0.06];     // where she stands by the bed, in front of the nightstand, facing the room,
const MOM_YAW = -20;                 // her head turned to him (MOM_LOOK)
const MOM_LOOK = -36;

const pathOf = (pts) => new THREE.CatmullRomCurve3(pts.map(([x, z]) => V(x, 0, z)));
function along(curve, u) {
  const p = curve.getPointAt(Math.max(0, Math.min(1, u)));
  const tan = curve.getTangentAt(Math.min(0.999, Math.max(0.001, u)));
  return { at: [p.x, UP, p.z], yaw: (Math.atan2(tan.x, tan.z) * 180) / Math.PI, dist: u * curve.getLength() };
}

// A stride phase scaled so a walk of `len` metres ends on a passing position.
const strideScale = (len, leg) => { const p = walkPhase(len, leg); return Math.max(0.5, Math.round(p * 2) / 2) / p; };

function morning(w) {
  w.mood('morning');
  w.house.light('morning');
}

// Mom with the cupcake in both hands in front of her chest, the candle lit; `stride` a walk phase (or null).
function momCupcake(w, t, { at, yaw, base = {}, face = 'neutral', stride = null, cupcake = true }) {
  const cc = w.props.cupcake;
  return person(w, w.cast.mom, t, {
    at, yaw, face, who: 'mom',
    pose: (r, local) => {
      const p = poseWith(w, 'idle', Object.assign({}, stride == null ? {} : walk(stride, { arm: 0, swing: 18 }), base));
      if (!cupcake) return p;
      r.setPose(p);
      r.root.updateMatrixWorld(true);
      cc.visible = true;
      cc.position.copy(local(0, 1.0, 0.3));
      cc.rotation.set(0, yaw * DEG, 0);
      const f = cc.userData.flame;
      f.scale.set(1, 1.7 + 0.18 * Math.sin(t * 23) + 0.1 * Math.sin(t * 37), 1);
      return r.solve(p, { L: local(0.075, 1.02, 0.29), R: local(-0.075, 1.02, 0.29) });
    },
  });
}

// Kip's face from here on always carries Mom's mustache
const withMustache = (w, f) => Object.assign(w.Mascot.resolveFace(f), { mustache: 1 });

// the present on the bed beside him (bed coordinates)
function presentOnBed(w) {
  const g = w.house.props.kipPresent.group;
  g.position.set(0.22, 0.58, 0.62);
  g.rotation.set(0, -0.3, 0);
}

// Mom's door-side face: warm, then the straight face she keeps after clocking the mustache
const MOM_WARM = { lid: 0.12, browUp: 0.3, mouthCurve: 0.85, happy: 0.35 };
const MOM_STRAIGHT = { lid: 0.2, lidSlant: -0.1, browUp: 0.2, browAsym: 0.25, mouthCurve: 0.25, mouthWide: 0.85 };

export const SCENE7 = {
  62: {
    key: 2.6,
    pose(w, lt, t) {
      morning(w);
      // the door swings open to her shoulder and she comes in with the cupcake, to the bedside: "Happy birthday,
      // sweetie." He wakes on it and sits up; her eyes find the mustache, and she keeps a straight face.
      const door = w.house.props.kipDoor.pivot;
      door.rotation.y = -0.25 - 1.15 * ramp(lt, 0.55, 1.25, E.out);
      const curve = pathOf([[1.25, -1.45], [1.18, -0.6], [0.35, -0.08], [-0.55, 0.06], [MOM_AT[0], MOM_AT[2]]]);
      const len = curve.getLength();
      const p = along(curve, cruise(lt, 0, 2.55, 0.7));
      const yaw = p.yaw + (MOM_YAW - p.yaw) * ramp(lt, 2.2, 2.8);
      momCupcake(w, t, {
        at: p.at, yaw, stride: walkPhase(p.dist, momLeg) * strideScale(len, momLeg),
        base: { head: [8 * ramp(lt, 2.4, 3.0), MOM_LOOK * ramp(lt, 2.4, 3.0), 0] },
        face: faceTrack(w, lt, [[0, MOM_WARM], [3.3, Object.assign({}, MOM_WARM, { lookY: -0.1 })], [3.5, { lid: 0.1, browUp: 0.55, mouthCurve: 0.6, lookY: -0.25 }],
          [3.8, MOM_STRAIGHT]]),
      });
      const sit = ramp(lt, 2.1, 3.1, E.inOut) * 0.88;
      kipInBed(w, t, {
        sit, live: true,
        upper: { head: [0, 14 * ramp(lt, 2.4, 3.0), 0] },
        face: faceTrack(w, lt, [[0, { eyeOpen: 0, mouthCurve: 0.1 }], [1.7, { eyeOpen: 0, mouthCurve: 0.1 }], [2.1, { eyeOpen: 0.6, lid: 0.35, browUp: 0.2, mouthCurve: 0 }],
          [3.0, { eyeOpen: 1, lid: 0.15, browUp: 0.4, mouthCurve: 0.45, lookX: 0.35 }]]),
      });
      w.cam([-0.75, UP + 1.62, 2.15], [track(lt, [[0.6, -0.6], [2.8, -1.45, E.cam]]), UP + 1.0, -0.25], 52);
    },
  },
  63: {
    key: 1.4,
    pose(w, lt, t) {
      morning(w);
      // the two-shot from the foot of the bed: "Mom. About last night..." "No idea what you mean."
      momCupcake(w, t, {
        at: MOM_AT, yaw: MOM_YAW,
        base: { head: [8, MOM_LOOK + 14 * ramp(lt, 2.7, 3.1) * (1 - ramp(lt, 4.4, 4.9)), 0] },
        face: faceTrack(w, lt, [[0, MOM_STRAIGHT], [2.6, Object.assign({}, MOM_STRAIGHT, { lookX: 0 })], [2.9, { lid: 0.25, lidSlant: -0.2, browUp: 0.45, browAsym: 0.3, mouthCurve: 0.35, mouthSkew: 0.3, lookX: 0.4 }],
          [4.6, { lid: 0.2, browUp: 0.35, mouthCurve: 0.45, mouthSkew: 0.35, lookX: 0 }]]),
      });
      kipInBed(w, t, {
        sit: 0.88, live: true, who: 'kip',
        upper: { spine: [4, 0, 0], head: [4, 28, 0] },
        face: faceTrack(w, lt, [[0, { lid: 0.15, browUp: 0.5, browTilt: -0.3, mouthCurve: -0.1, lookX: 0.5 }], [2.6, { lid: 0.1, browUp: 0.7, browTilt: -0.6, mouthCurve: -0.25, lookX: 0.55 }],
          [3.4, { eyeScale: 1.08, lid: 0.25, lidSlant: 0.3, browUp: -0.1, browTilt: 0.4, mouthCurve: -0.35, mouthSkew: -0.3, lookX: 0.55 }]]),
      });
      w.cam([-2.7, UP + 1.47, 1.92], [-1.88, UP + 1.4, 0.2], 40, 0.2 * Math.sin(lt * 0.6));
    },
  },
  64: {
    key: 1.8,
    pose(w, lt, t) {
      morning(w);
      // close on her, from his side of the bed: "Your present's been under your bed the whole time."
      const mom = momCupcake(w, t, {
        at: MOM_AT, yaw: MOM_YAW,
        base: { head: [8 + 10 * ramp(lt, 1.4, 1.9) * (1 - ramp(lt, 2.6, 3.1)), MOM_LOOK, 0] },
        face: faceTrack(w, lt, [[0, { lid: 0.2, browUp: 0.35, mouthCurve: 0.45, mouthSkew: 0.3 }], [1.4, { lid: 0.2, browUp: 0.55, mouthCurve: 0.45, lookY: -0.45, lookX: 0.2 }],
          [2.6, { lid: 0.22, browUp: 0.6, browAsym: 0.4, mouthCurve: 0.55, mouthSkew: 0.4, lookY: 0 }]]),
      });
      kipInBed(w, t, { sit: 0.88, live: true, upper: { head: [4, 28, 0] }, face: { lid: 0.15, browUp: 0.6, lookX: 0.5 } });
      const h = headOf(mom);
      w.cam([-1.75, UP + 1.52, 1.52], [h.x + 0.14, h.y - 0.1, h.z], 36, 0.2 * Math.sin(lt * 0.6));
    },
  },
  65: {
    key: 2.3,
    pose(w, lt, t) {
      morning(w);
      // from high over the room side of the bed: he leans over the edge, reaches under and slides out the yellow
      // present, right from under where he slept, sits back and stares down at it: "...I slept on it."
      // Mom, from the door: "All night."
      const lean = 50 * ramp(lt, 0.0, 0.7, E.inOut) * (1 - 0.8 * ramp(lt, 1.45, 2.0, E.inOut));
      const slide = ramp(lt, 0.8, 1.4, E.inOut);
      const g = w.house.props.kipPresent.group;
      g.position.set(0.05 + 0.78 * slide, 0, 0.18);
      g.rotation.set(0, 0.12 - 0.2 * slide, 0);
      g.updateMatrixWorld(true);
      const grip = g.localToWorld(V(-0.2, 0.17, 0.0));
      kipInBed(w, t, {
        sit: 1, lean, live: true, who: 'kip',
        upper: (r, base) => {
          const p = Object.assign({}, base, {
            spine: [6, 0, 0], head: [16, 30 * ramp(lt, 1.5, 2.1), -10 + 10 * ramp(lt, 1.5, 2.1)],
            armR: [-20, 0, 10], elbowR: [-30, 0, 0], armL: [-16, 0, 14], elbowL: [-24, 0, 0],
          });
          const reach = ramp(lt, 0.45, 0.85) * (1 - ramp(lt, 1.4, 1.9));
          if (reach <= 0) return p;
          r.setPose(p);
          r.root.updateMatrixWorld(true);
          return w.Mascot.mixPose(p, r.solve(p, { L: grip }), reach);
        },
        face: faceTrack(w, lt, [[0, { browUp: 0.4, lookY: -0.4 }], [1.3, { eyeScale: 1.2, browUp: 0.8, mouthOpen: 0.15, lookY: -0.6 }],
          [1.9, { eyeScale: 1.1, lid: 0.3, browUp: 0.3, browTilt: -0.5, mouthCurve: -0.4, lookY: -0.55 }], [3.6, { lid: 0.5, lidSlant: -0.4, browUp: 0.2, browTilt: -0.8, mouthCurve: -0.6, lookY: -0.55 }]]),
      });
      w.cam([-0.55, UP + 2.05, 1.9], [-1.95, UP + 0.78, 0.36], 50);
    },
  },
  66: {
    key: 4.0,
    pose(w, lt, t) {
      // one second of Dad's disco photo, matched to his face in the mirror
      if (lt >= 2.0 && lt < 3.0) {
        w.house.light('closet');
        const p = w.house.spots.dadPhoto;
        w.cam([p.x + 0.62, p.y - 0.06, p.z + 0.01], [p.x, p.y - 0.06, p.z], 30);
        return;
      }
      morning(w);
      w.house.props.kipDoor.pivot.rotation.y = -1.3;
      presentOnBed(w);
      // the mirror's view of him: he crosses to it, catches himself, a double take, leans in on the mustache; then,
      // eye to eye with himself: "...I look like Dad."
      const d = 0.85 * cruise(lt, 0, 1.0, 0.45);
      const take = ramp(lt, 0.95, 1.15, E.out) * (1 - ramp(lt, 1.15, 1.5)), leanIn = ramp(lt, 1.35, 1.95) * (1 - 0.5 * ramp(lt, 3.0, 3.6));
      const k = person(w, w.cast.kip, t, {
        at: [-0.25 + d, UP, 1.15], yaw: 90, who: 'kip',
        pose: w.Mascot.mixPose(poseWith(w, 'idle', walk(walkPhase(d, kipLeg) * strideScale(0.85, kipLeg))),
          { spine: [10 * leanIn - 4 * take, 0, 0], head: [6 * leanIn - 8 * take, 0, 0], armL: [-8, 0, 10], elbowL: [-16, 0, 0], armR: [-8, 0, 10], elbowR: [-16, 0, 0] }, ramp(lt, 0.75, 1.05)),
        face: withMustache(w, faceTrack(w, lt, [[0, { browUp: 0.2, mouthCurve: 0.3, lookX: 0.3 }], [0.9, { eyeScale: 1.1, browUp: 0.5 }], [1.15, { eyeScale: 1.35, browUp: 1, mouthOpen: 0.25, mouthRound: 0.4 }],
          [1.9, { eyeScale: 1.25, browUp: 0.9, mouthOpen: 0.1, lookY: -0.25 }], [3.0, { eyeScale: 1.2, lid: 0.2, browUp: 0.6, browTilt: -0.4, mouthCurve: -0.3 }],
          [4.6, { eyeScale: 1.1, lid: 0.35, lidSlant: -0.3, browUp: 0.4, browTilt: -0.8, mouthCurve: -0.55 }]])),
      });
      const h = headOf(k);
      w.cam([1.8, UP + 1.42, 1.15], [h.x, track(lt, [[0, h.y - 0.08], [1.5, h.y - 0.04, E.cam]]), 1.15], 50);
    },
  },
  67: {
    key: 0.9,
    pose(w, lt, t) {
      morning(w);
      w.mirror(true);
      w.house.props.kipDoor.pivot.rotation.y = -1.3;
      presentOnBed(w);
      // he spins from the mirror to the open door: "MOM!" Her voice, from down the hall: "Happy birthday!"
      const turn = ramp(lt, 0.0, 0.4, E.out);
      person(w, w.cast.kip, t, {
        at: [0.98, UP, 1.15], yaw: 90 + 105 * turn, who: 'kip',
        pose: { spine: [8 * ramp(lt, 0.3, 0.6) * (1 - ramp(lt, 1.6, 2.4)), 0, 0], head: [-6, 0, 0], armL: [-6, 0, 14], elbowL: [-20, 0, 0], armR: [-6, 0, 14], elbowR: [-20, 0, 0] },
        face: withMustache(w, faceTrack(w, lt, [[0, { eyeScale: 1.1, lid: 0.35, browUp: 0.4, browTilt: -0.8, mouthCurve: -0.55 }], [0.4, { eyeScale: 1.2, lid: 0.3, lidSlant: 0.6, browUp: -0.3, browTilt: 1, mouthCurve: -0.5 }],
          [1.8, { eyeScale: 1.1, lid: 0.3, lidSlant: 0.5, browTilt: 0.8, mouthCurve: -0.6, mouthWide: 0.9 }], [3.6, { lid: 0.4, lidSlant: 0.4, browTilt: 0.6, mouthCurve: -0.4, mouthSkew: 0.4 }]])),
      });
      w.cam([0.25, UP + 1.5, -0.62], [0.35, UP + 1.02, 1.2], 54);
    },
  },
};
