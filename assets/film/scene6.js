// Scene 6: 0:01. The cat leads Kip along the upstairs hall and in at his door; his body is tucked into his own bed,
// mustache and all; he dives back in with a second to spare, his eyes snap open, he sits bolt upright, panting, and
// finds his upper lip sticky.
//
// Kip's door stands a little wider open into his room tonight (DOOR), wide enough for the cat.
import * as THREE from 'three';
import { V, person, catAt, faceTrack, headOf, onHead, track, E, ramp, kipInBed } from './stage.js';
import { catWalk, catPhase } from './motion.js';

const UP = 2.92;
const DEG = Math.PI / 180;
const DOOR = -0.6;
const floatWith = (w, extra) => Object.assign({}, w.Mascot.POSES.float, extra);
const ghostKip = (w, t, o) => person(w, w.cast.ghostKip, t, Object.assign({ ghost: true, who: 'kip' }, o));

const pathOf = (pts) => new THREE.CatmullRomCurve3(pts.map(([x, z]) => V(x, 0, z)));
function along(curve, u) {
  const p = curve.getPointAt(Math.max(0, Math.min(1, u)));
  const tan = curve.getTangentAt(Math.min(0.999, Math.max(0.001, u)));
  return { x: p.x, z: p.z, yaw: (Math.atan2(tan.x, tan.z) * 180) / Math.PI, dist: u * curve.getLength() };
}
// the cat trotting: diagonal pairs by distance, head level, tail up
const trot = (w, dist) => Object.assign({ head: [-4, 0, 0], tail: [[-40, 6], [18, 4], [16, 2], [14, 0]] }, catWalk(catPhase(dist)));

// The cat's way from the top of the stairs (between two balusters of the stairwell rail) along the hall and in at
// the gap of Kip's door; Kip's a little behind and wider, through the door itself.
const CAT_PATH = pathOf([[2.62, -2.02], [2.0, -2.02], [1.78, -1.78], [1.69, -1.35], [1.62, -0.92], [1.45, -0.45], [1.15, 0.0]]);
const KIP_PATH = pathOf([[2.55, -1.75], [2.05, -1.7], [1.65, -1.5], [1.38, -1.15], [1.25, -0.7], [1.15, -0.2]]);

// the cat sits on the rug by the bed, watching
function catByBed(w, t, look, face = 'calm') {
  return catAt(w, w.cast.cat, t, { at: [-1.3, UP, 1.05], yaw: -125, pose: 'sit', face, look });
}

export const SCENE6 = {
  56: {
    key: 1.4,
    pose(w, lt, t) {
      w.house.light('hall');
      w.house.props.kipDoor.pivot.rotation.y = DOOR;
      // the cat trots up the last tread, slips between the balusters and along the hall, and in at Kip's door;
      // he floats up the stairwell after her, along the hall, and straight through the door
      const len = CAT_PATH.getLength(), u = Math.min(1, (lt * 1.05) / len);
      const c = along(CAT_PATH, u);
      if (u < 1) catAt(w, w.cast.cat, t, { at: [c.x, UP, c.z], yaw: c.yaw, pose: trot(w, c.dist), face: 'calm' });
      const ku = ramp(lt, 0.1, 3.45, (x) => x * (0.75 + 0.25 * x));
      const k = along(KIP_PATH, ku);
      const rise = track(lt, [[0, -0.55], [1.0, 0.12, E.out]]);
      // he follows low, bent over her, the way you follow a cat
      ghostKip(w, t, {
        at: [k.x, UP + rise, k.z], yaw: k.yaw,
        pose: floatWith(w, { spine: [24, 0, 0], head: [-16, 0, 0], legL: [-30, 0, 2], kneeL: 50, legR: [-22, 0, 2], kneeR: 44, armL: [-34, 0, 26], elbowL: [-40, 0, 0], armR: [-30, 0, 30], elbowR: [-44, 0, 0] }),
        face: { eyeScale: 1.08, browUp: 0.5, browTilt: 0.2, mouthCurve: 0.15, lookY: -0.35 },
      });
      // from the back of the hall, panning with them from the top of the stairs on to his door as he goes through
      const pan = ramp(lt, 0.6, 2.7, E.cam);
      w.cam([-0.9, UP + 1.4, -2.2], [1.9 - 0.7 * pan, UP + 0.92, -1.7 + 0.85 * pan], 46);
    },
  },
  57: {
    key: 1.6,
    pose(w, lt, t) {
      w.house.light('kipRoom');
      w.house.props.kipDoor.pivot.rotation.y = DOOR;
      // his body, tucked in: on its back, eyes shut, the mustache on its lip, the blanket to its shoulders
      kipInBed(w, t, { face: { eyeOpen: 0, mouthOpen: 0.06, mouthRound: 0.2, mouthCurve: 0.05 } });
      // in through the door, a few floats into the room, then he sees it: "THERE I AM!" and points
      const x = track(lt, [[0, 1.2], [1.0, 0.0, E.out]]), z = track(lt, [[0, -0.95], [1.0, 0.0, E.out]]);
      const see = ramp(lt, 0.7, 1.15), point = ramp(lt, 1.15, 1.5, E.out);
      const k = ghostKip(w, t, {
        at: [x, UP + 0.14, z], yaw: track(lt, [[0, 170], [0.7, 150], [1.15, -100]]),
        pose: floatWith(w, {
          spine: [-6 * see, 0, 0], head: [-6 * see, 0, 0],
          armR: [-80 * point, 0, 18 + 6 * point], elbowR: [-8, 0, 0], armL: [-20, 0, 34 + 20 * see], elbowL: [-50, 0, 0],
        }),
        face: faceTrack(w, lt, [[0, { eyeScale: 1.05, browUp: 0.4, lookY: -0.2 }], [0.75, { eyeScale: 1.05, browUp: 0.4, lookX: 0.5 }], [1.1, { eyeScale: 1.35, browUp: 1, mouthOpen: 0.4, mouthCurve: 0.6, lookX: 0.2 }],
          [2.6, { eyeScale: 1.2, browUp: 0.9, mouthCurve: 0.8, happy: 0.4, lookX: 0.2 }]]),
      });
      catByBed(w, t, headOf(k).toArray());
      w.cam([-0.75, UP + 1.62, 2.15], [-0.9, UP + 1.02, -0.25], 52);
    },
  },
  58: {
    key: 1.6,
    pose(w, lt, t) {
      w.house.light('kipRoom');
      kipInBed(w, t, { face: { eyeOpen: 0, mouthOpen: 0.06, mouthRound: 0.2, mouthCurve: 0.05 } });
      // half speed, from the side: a crouch at the foot of the bed, a long slow arc, head first into his own body
      const crouch = ramp(lt, 0, 0.45) * (1 - ramp(lt, 0.45, 0.75));
      const f = ramp(lt, 0.5, 2.55, E.linear);                       // the flight, 0..1, unhurried (slow motion)
      // from standing at the foot of the bed to lying along his body, hips on its hips (then on down into it)
      const bed = w.house.props.bed;
      const z = 1.9 + (bed.z + 0.04 - 1.9) * E.inOut(f);
      const arc = 4 * f * (1 - f);
      const sink = ramp(lt, 2.55, 2.85, E.in);
      const hipsY = UP + 0.7 + 0.08 * f + 0.62 * arc - 0.2 * crouch - 0.3 * sink;
      const pitch = 92 * E.inOut(ramp(lt, 0.45, 1.6)) + 8 * ramp(lt, 1.6, 2.5);
      const k = ghostKip(w, t, {
        at: [0, 0, 0], yaw: 180, who: null,
        pose: floatWith(w, {
          spine: [-6 * (1 - crouch) + 30 * crouch, 0, 0], head: [-30 * ramp(lt, 0.6, 1.4), 0, 0],
          armL: [-40 - 130 * ramp(lt, 0.45, 1.2), 0, 18], elbowL: [-10, 0, 0], armR: [-36 - 132 * ramp(lt, 0.45, 1.2), 0, 20], elbowR: [-12, 0, 0],
          legL: [-30 * crouch + 10 * f, 0, 3], kneeL: 60 * crouch + 20 * f, footL: 30, legR: [-34 * crouch + 14 * f, 0, 3], kneeR: 64 * crouch + 26 * f, footR: 28,
        }),
        face: faceTrack(w, lt, [[0, { lid: 0.2, lidSlant: 0.6, browUp: -0.3, browTilt: 0.8, mouthCurve: -0.2 }], [0.6, { lid: 0.3, lidSlant: 0.7, browTilt: 1, mouthOpen: 0.7, mouthWide: 1.1 }],
          [2.4, { lid: 0.55, lidSlant: 0.7, browTilt: 1, mouthOpen: 0.8, mouthWide: 1.2 }]]),
      });
      const q = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), Math.PI).multiply(new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), pitch * DEG));
      k.root.quaternion.copy(q);
      k.root.position.copy(V(bed.x, hipsY, z)).sub(V(0, k.dims.hipY, 0).applyQuaternion(q));
      k.root.visible = lt < 2.85;
      w.cam([-0.15, UP + 1.08, 0.75], [-2.4, UP + 1.0, 0.72], 52);
    },
  },
  59: {
    key: 0.6,
    pose(w, lt, t) {
      w.house.light('kipRoom');
      // straight down on his face on the pillow: the eyes snap open
      const open = ramp(lt, 0.3, 0.37, E.out);
      const body = kipInBed(w, t, {
        face: open > 0 ? { eyeOpen: open, eyeScale: 1 + 0.3 * open, browUp: 0.9 * open, mouthOpen: 0.06 + 0.2 * open, mouthRound: 0.3 } : { eyeOpen: 0, mouthOpen: 0.06, mouthRound: 0.2, mouthCurve: 0.05 },
      });
      const h = headOf(body), up = V(0, 0.94, 0.342);
      const at = h.clone().addScaledVector(up, 0.82).add(V(0.02, 0, 0.04));
      const look = h.clone().addScaledVector(up, 0.12);
      w.cam(at.toArray(), look.toArray(), 32, 0);
    },
  },
  60: {
    key: 1.6,
    pose(w, lt, t) {
      w.house.light('kipRoom');
      // bolt upright, panting, looking at his own hands: "Haah! I'm back! I'm..."
      const sit = ramp(lt, 0.0, 0.42, E.out);
      const pant = Math.sin(lt * 2 * Math.PI * 1.6) * (1 - 0.6 * ramp(lt, 2.5, 4.0));
      const hands = ramp(lt, 1.3, 1.9) * (1 - ramp(lt, 3.3, 3.9));
      const k = kipInBed(w, t, {
        sit, live: true, who: 'kip',
        upper: (r, base) => {
          const p = Object.assign({}, base, {
            spine: [6 + 4 * pant, 0, 0], head: [-6 - 3 * pant + 18 * hands, track(lt, [[0.6, 0], [1.0, -16], [1.3, 0]]), 0],
            armL: [-14 * sit, 0, 14 + 10 * sit], elbowL: [-20, 0, 0], armR: [-14 * sit, 0, 14 + 10 * sit], elbowR: [-20, 0, 0],
          });
          if (hands <= 0) return p;
          r.setPose(p);
          r.root.updateMatrixWorld(true);
          const loc = (x, y, z) => r.root.localToWorld(V(x, y, z));
          const qh = r.solve(p, { L: loc(0.14, 0.98, 0.34), R: loc(-0.14, 0.98, 0.34) });
          return w.Mascot.mixPose(p, qh, hands);
        },
        face: faceTrack(w, lt, [[0, { eyeOpen: 1, eyeScale: 1.3, browUp: 0.9, mouthOpen: 0.3, mouthRound: 0.3 }], [0.5, { eyeScale: 1.3, browUp: 1, mouthOpen: 0.5, mouthRound: 0.4 }],
          [1.4, { eyeScale: 1.2, browUp: 0.8, mouthCurve: 0.6, lookY: -0.5 }], [2.6, { eyeScale: 1.15, browUp: 0.7, mouthCurve: 0.9, happy: 0.5, lookY: -0.5 }],
          [3.4, { eyeScale: 1.1, browUp: 0.4, browTilt: -0.3, mouthCurve: 0.1, lookY: 0.1, lookX: -0.2 }]]),
      });
      const h = headOf(k);
      w.cam([-1.05, UP + 1.42, 1.65], [-2.25, track(lt, [[0, UP + 1.05], [0.5, h.y - 0.22, E.cam]]), 0.2], 40);
    },
  },
  61: {
    key: 2.0,
    pose(w, lt, t) {
      w.house.light('kipRoom');
      // close: his right hand comes up and a fingertip touches the corner of his upper lip, then he holds it out and
      // looks at it: "...Why is my lip sticky?"
      const reach = ramp(lt, 0.3, 0.9) * (1 - ramp(lt, 1.35, 1.9));
      const show = ramp(lt, 1.35, 1.9);
      const k = kipInBed(w, t, {
        sit: 1, live: true, who: 'kip',
        upper: (r, base) => {
          const p = Object.assign({}, base, { spine: [4, 0, 0], head: [6 * show, -8 * show, 4 * show], armL: [-6, 0, 18], elbowL: [-24, 0, 0], armR: [-10, 0, 20], elbowR: [-30, 0, 0] });
          if (reach <= 0 && show <= 0) return p;
          r.setPose(p);
          r.root.updateMatrixWorld(true);
          const lip = onHead(r, -30, -22, 1.08), held = r.root.localToWorld(V(-0.1, 1.06, 0.38));
          const rest = r.joints.handR.getWorldPosition(V(0, 0, 0));
          const target = rest.clone().lerp(lip, reach).lerp(held, show);
          return r.solve(p, { R: target });
        },
        face: faceTrack(w, lt, [[0, { eyeScale: 1.05, browUp: 0.3, mouthCurve: 0.3 }], [0.7, { browUp: 0.5, browAsym: 0.4, mouthCurve: 0, mouthSkew: 0.3, lookX: -0.2, lookY: -0.3 }],
          [1.6, { lid: 0.1, browUp: 0.7, browAsym: 0.5, mouthCurve: -0.2, lookX: -0.35, lookY: -0.55 }], [3.6, { eyeScale: 1.1, browUp: 0.85, browAsym: 0.6, mouthCurve: -0.35, lookX: -0.3, lookY: -0.5 }]]),
      });
      const h = headOf(k);
      w.cam([h.x + 0.6, h.y + 0.08, h.z + 1.6], [h.x + 0.03, h.y - 0.04, h.z], 36, 0.25 * Math.sin(lt * 0.7));
    },
  },
};
