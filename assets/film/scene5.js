// Scene 5: Where's my body? Kip drops into the living room and finds the couch empty; Mom's ghost plays hot and cold;
// her frozen body in the kitchen; Mom's three decoys (laundry, Dad's coat, a heap of cushions); "you could just ask";
// he slumps on the stairs and the cat comes to sit beside him, then leads him up.
//
// Mom's real body stays frozen mid-sip at the counter (stage.momFrozen) in every shot that shows the kitchen.
import * as THREE from 'three';
import { V, L, person, catAt, momFrozen, faceTrack, headOf, track, E, ramp } from './stage.js';
import { LOUNGE, folded } from './scene4.js';

const UP = 2.92;
const DEG = Math.PI / 180;
const floatWith = (w, extra) => Object.assign({}, w.Mascot.POSES.float, extra);
const momFace = { lid: 0.2, lidSlant: -0.1, browUp: 0.15, browAsym: 0.6, mouthCurve: 0.45, mouthSkew: 0.35 };

// Mom's ghost lounging in the air, arms folded (as in the attic), eyes on Kip.
function momGhost(w, t, { at, yaw, face, lean = 0, tilt = 0, look = -0.4 }) {
  return person(w, w.cast.ghostMom, t, {
    at, yaw, ghost: true, who: 'mom',
    pose: (r) => folded(r, Object.assign({}, LOUNGE, { spine: [LOUNGE.spine[0] + lean, 0, 0], head: [LOUNGE.head[0] + lean * 0.3, 0, tilt] })),
    face: Object.assign({ lookX: look }, face),
  });
}
const kip = (w, t, o) => person(w, w.cast.ghostKip, t, Object.assign({ ghost: true, who: 'kip' }, o));

// the frozen body's controller, left in the dent of the middle seat (shot 25)
function controllerInDent(w) {
  const c = w.props.controller, seat = w.house.spots.couchSeats[1];
  c.visible = true;
  c.position.set(seat.x, 0.445, seat.z + 0.05);
  c.rotation.set(0, 0.4, 0);
}
// The cat on the stairs: `k` hops done (a float); each hop takes her up one tread on a low arc, paws together on
// the landing. Returns her root place (feet on the tread) and the pose for the moment.
const HOP = { bodyY: 0.01, body: [-8, 0, 0], legFL: [-36, 0, 0], kneeFL: 10, legFR: [-30, 0, 0], kneeFR: 12, legBL: [44, 0, 0], kneeBL: 8, legBR: [38, 0, 0], kneeBR: 10, tail: [[-40, 0], [16, 0], [14, 0], [10, 0]] };
function catOnStairs(w, st, k, { x = 2.8, startZ = st.zFront + 0.1 } = {}) {
  const tread = (i) => (i < 0 ? [0, startZ] : [st.stepTop(i), st.zAt(i)]);
  const i = Math.floor(k), u = k - i;
  const a = tread(i - 1), b = tread(i);
  const e = E.inOut(u);
  const y = a[0] + (b[0] - a[0]) * e + 0.07 * Math.sin(Math.PI * u);
  const z = a[1] + (b[1] - a[1]) * e;
  const air = Math.sin(Math.PI * u);
  return { at: [x, y, z], pose: w.Mascot.mixCatPose('stand', HOP, air) };
}

export const SCENE5 = {
  44: {
    key: 3.4,
    pose(w, lt, t) {
      w.house.light('living');
      w.house.props.tv.show('spectating', { left: Math.round(track(lt, [[0, 84], [4.5, 80]])) });
      controllerInDent(w);
      // feet first through the ceiling in front of the couch: empty, the controller in the dent. "No." He spins round,
      // "No no no." and looks all over the room: "Where am I?!"
      const y = track(lt, [[0, 2.45], [0.95, 0.32, E.out]]);
      const turn = ramp(lt, 1.5, 2.1, E.inOut);
      kip(w, t, {
        at: [0.22, y, -0.86], yaw: 180 - 160 * turn,
        pose: floatWith(w, {
          head: [track(lt, [[0.9, 14], [1.4, 18], [1.8, 0]]), track(lt, [[2.4, 0], [2.9, 30], [3.3, -30], [3.8, 0]]), 0],
          armL: [-18, 0, 30 + 40 * ramp(lt, 2.9, 3.3)], elbowL: [-50, 0, 0], armR: [-20, 0, 34 + 40 * ramp(lt, 2.95, 3.35)], elbowR: [-56, 0, 0],
        }),
        face: faceTrack(w, lt, [[0, { browUp: 0.4 }], [1.0, { eyeScale: 1.2, browUp: 0.9, mouthOpen: 0.2 }], [1.6, { eyeScale: 1.15, browUp: 0.8, browTilt: -0.6, mouthCurve: -0.4 }],
          [2.9, { eyeScale: 1.2, browUp: 1, browTilt: -0.8, mouthCurve: -0.5, lookX: 0.5 }], [3.3, { eyeScale: 1.2, browUp: 1, browTilt: -0.8, mouthCurve: -0.5, lookX: -0.5 }]]),
      });
      const s = w.house.spots.armchairSeat;
      catAt(w, w.cast.cat, t, { at: [s.x, w.house.props.armchair.seatTop - 0.01, s.z], yaw: 40, pose: 'sit', face: 'wide', look: [0.22, 1.4, -0.86] });
      w.cam([-2.82, 2.62, 2.12], [0.3, 0.75, -1.15], 42);
    },
  },
  45: {
    key: 2.0,
    pose(w, lt, t) {
      w.house.light('living');
      w.house.props.tv.show('spectating', { left: 78 });
      controllerInDent(w);
      // she drifts down through the ceiling beside him, lounging, unhurried, and settles at his eye level: "Warmer..."
      // (the two of them face each other, cheated open toward the lens)
      const y = track(lt, [[0, 2.25], [1.5, 0.02, E.out]]);
      momGhost(w, t, { at: [1.45, y, -0.7], yaw: -50, look: -0.3, face: faceTrack(w, lt, [[0, { lid: 0.3, mouthCurve: 0.3 }], [1.4, momFace]]), tilt: -5 });
      const see = ramp(lt, 0.5, 1.1), calm = ramp(lt, 0.3, 1.2);
      kip(w, t, {
        at: [0.22, 0.32, -0.86], yaw: 20 + 30 * see,
        pose: floatWith(w, { head: [-6 * see, 12 * see, 0], armL: [-18, 0, 70 - 42 * calm], elbowL: [-50, 0, 0], armR: [-20, 0, 74 - 44 * calm], elbowR: [-56, 0, 0] }),
        face: faceTrack(w, lt, [[0, { eyeScale: 1.2, browUp: 1, browTilt: -0.8, mouthCurve: -0.5, lookX: -0.3 }], [0.9, { eyeScale: 1.1, browUp: 0.6, mouthCurve: -0.3, lookX: 0.3, lookY: 0.15 }],
          [2.2, { lid: 0.25, lidSlant: 0.4, browUp: -0.2, browTilt: 0.6, mouthCurve: -0.4, lookX: 0.35 }]]),
      });
      w.cam([0.8, 1.5, 1.65], [0.85, track(lt, [[0, 2.15], [1.6, 1.38, E.cam]]), -0.8], 42);
    },
  },
  46: {
    key: 2.0,
    pose(w, lt, t) {
      w.house.light('kitchen');
      momFrozen(w, t);
      // he zips in through the living-room wall, past her, stops, turns back to her frozen mid-sip face, and recoils:
      // "Gah! Your body is so creepy." Then, from somewhere: "Colder."
      const x = track(lt, [[0, -3.1], [0.55, -4.78, E.out]]);
      const recoil = ramp(lt, 0.9, 1.15, E.out) * (1 - 0.6 * ramp(lt, 1.6, 2.2));
      kip(w, t, {
        at: [x + 0.28 * recoil, 0.22, -1.3], yaw: -90,
        pose: floatWith(w, {
          spine: [-14 * recoil, 0, 0], head: [-8 * recoil, 0, 0],
          armL: [-30 - 30 * recoil, 0, 30 + 40 * recoil], elbowL: [-60 - 30 * recoil, 0, 0], armR: [-28 - 26 * recoil, 0, 28 + 34 * recoil], elbowR: [-56 - 28 * recoil, 0, 0],
        }),
        face: faceTrack(w, lt, [[0, { lid: 0.2, browUp: -0.2, mouthCurve: 0.2 }], [0.85, { lid: 0.1, browUp: 0.2 }], [0.95, { eyeScale: 1.3, browUp: 1, mouthOpen: 0.6, mouthRound: 0.5 }],
          [1.6, { lid: 0.3, lidSlant: -0.4, browUp: 0.2, browTilt: -0.7, mouthCurve: -0.7, mouthWide: 0.9 }], [3.9, { lid: 0.3, lidSlant: -0.4, browUp: 0.2, browTilt: -0.7, mouthCurve: -0.6 }],
          [4.2, { lid: 0.2, browUp: 0.5, lookX: 0.6, lookY: 0.3, mouthCurve: -0.3 }]]),
      });
      w.cam([-6.25, 1.45, 0.75], [-5.1, 1.35, -1.35], 40);
    },
  },
  47: {
    key: 0.8,
    pose(w, lt, t) {
      // his view, close on her frozen face mid-sip (the HUD is an overlay)
      w.house.light('kitchen');
      const mom = momFrozen(w, t);
      const h = headOf(mom);
      w.cam([h.x + 0.35, h.y + 0.04, h.z + 1.15], [h.x, h.y + 0.1, h.z], L.wide, 0.6 * Math.sin(lt * 0.9));
    },
  },
  48: {
    key: 2.3,
    pose(w, lt, t) {
      w.house.light('hall');
      // the laundry pile shaped like someone lying in the hall; he spots it, dives in head first, comes up empty
      const lp = w.props.laundry, spot = w.house.spots.laundry;
      lp.visible = true;
      lp.position.set(spot.x, spot.y, spot.z + 0.05);
      lp.rotation.set(0, -Math.PI / 2, 0);
      const dive = ramp(lt, 0.75, 1.25, E.in), up = ramp(lt, 1.45, 2.0, E.out);
      const x = track(lt, [[0, -0.9], [0.75, -1.85, E.out], [1.25, -2.45, E.in], [2.0, -2.5]]);
      const y = UP + 0.3 - 0.75 * dive + 0.75 * up;
      const pitch = 85 * dive * (1 - up);
      const k = kip(w, t, {
        at: [x, y, -1.6], yaw: -90,
        pose: floatWith(w, {
          spine: [10 * dive * (1 - up), 0, 0], armL: [-12 - 150 * dive * (1 - up), 0, 24], elbowL: [-30, 0, 0], armR: [-10 - 150 * dive * (1 - up), 0, 26], elbowR: [-30, 0, 0],
          head: [0, -50 * ramp(lt, 2.0, 2.3), 0],
        }),
        face: faceTrack(w, lt, [[0, { eyeScale: 1.15, browUp: 0.7, mouthCurve: 0.6 }], [0.7, { lid: 0.2, lidSlant: 0.5, browUp: -0.3, browTilt: 0.7, mouthCurve: 0.4 }],
          [1.9, { lid: 0.3, browUp: 0.1, mouthCurve: -0.4 }], [2.4, { lid: 0.38, lidSlant: -0.3, browUp: 0.2, browTilt: -0.6, mouthCurve: -0.6, lookX: -0.4 }]]),
      });
      if (pitch > 0) {
        k.root.updateMatrixWorld(true);
        const hips = k.joints.hips.getWorldPosition(V(0, 0, 0));
        const q = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), -90 * DEG).multiply(new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), pitch * DEG));
        k.root.quaternion.copy(q);
        k.root.position.copy(hips).sub(V(0, k.dims.hipY, 0).applyQuaternion(q));
      }
      w.cam([-6.5, UP + 1.3, -1.45], [-2.6, UP + 1.0, -1.6], 40, 0.4 * Math.sin(lt * 0.8));
    },
  },
  49: {
    key: 2.2,
    pose(w, lt, t) {
      w.house.light('kitchen');
      momFrozen(w, t);
      // Dad's coat and hat slumped on a kitchen chair like a man asleep; he lunges through it and out the far side
      const c = w.props.coat, spot = w.house.spots.coatChair;
      c.visible = true;
      c.position.set(spot.x, spot.y, spot.z);
      c.rotation.set(0, -Math.PI / 2, 0);
      const lunge = ramp(lt, 0.7, 1.25, E.inOut);
      const x = -4.0 - 1.45 * lunge;
      kip(w, t, {
        at: [x, 0.16, 0.95], yaw: track(lt, [[0, -90], [1.3, -90], [1.75, -55]]),
        pose: floatWith(w, {
          spine: [26 * Math.sin(Math.PI * lunge), 0, 0], armL: [-20 - 120 * Math.sin(Math.PI * lunge), 0, 26], elbowL: [-30, 0, 0], armR: [-18 - 120 * Math.sin(Math.PI * lunge), 0, 28], elbowR: [-30, 0, 0],
        }),
        face: faceTrack(w, lt, [[0, { eyeScale: 1.1, lid: 0.15, lidSlant: 0.5, browTilt: 0.6, mouthCurve: 0.5 }], [1.6, { eyeScale: 1.1, browUp: 0.3 }],
          [1.85, { lid: 0.38, lidSlant: -0.3, browUp: 0.2, browTilt: -0.6, mouthCurve: -0.6 }]]),
      });
      w.cam([-6.7, 1.5, 1.9], [-4.75, 1.1, 0.8], 44, 0.3 * Math.sin(lt * 0.8));
    },
  },
  50: {
    key: 2.3,
    pose(w, lt, t) {
      w.house.light('living');
      w.house.props.tv.show('spectating', { left: 31 });
      controllerInDent(w);
      // a heap of cushions on the floor by the kitchen door, shaped like someone curled up; he dives in, pops out
      const h = w.props.cushions;
      h.visible = true;
      h.position.set(-2.25, 0, 1.35);
      h.rotation.set(0, 0.6, 0);
      const dive = ramp(lt, 0.7, 1.15, E.in), up = ramp(lt, 1.3, 1.8, E.out);
      kip(w, t, {
        at: [track(lt, [[0, -0.6], [0.7, -1.6, E.out], [1.15, -2.2, E.in], [1.8, -2.15]]), 0.3 - 0.9 * dive + 0.9 * up, track(lt, [[0, 0.5], [1.15, 1.3], [1.8, 1.2]])],
        yaw: -110 - 120 * ramp(lt, 1.6, 2.2),
        pose: floatWith(w, { spine: [40 * dive * (1 - up), 0, 0], armL: [-14 - 140 * dive * (1 - up), 0, 24], elbowL: [-30, 0, 0], armR: [-12 - 140 * dive * (1 - up), 0, 26], elbowR: [-30, 0, 0] }),
        face: faceTrack(w, lt, [[0, { eyeScale: 1.15, browUp: 0.7, mouthCurve: 0.5 }], [1.7, { lid: 0.3, browUp: 0.1, mouthCurve: -0.4 }], [2.1, { lid: 0.38, lidSlant: -0.3, browUp: 0.2, browTilt: -0.6, mouthCurve: -0.6 }]]),
      });
      w.cam([1.0, 1.55, -1.5], [-1.9, 1.25, 0.9], 40, 0.3 * Math.sin(lt * 0.8));
    },
  },
  51: {
    key: 1.6,
    pose(w, lt, t) {
      w.house.light('living');
      w.house.props.tv.show('spectating', { left: 24 });
      const h = w.props.cushions;
      h.visible = true;
      h.position.set(-2.25, 0, 1.35);
      h.rotation.set(0, 0.6, 0);
      // gentle: "You know, you could just ask." He folds his arms: "Then you'd win!" "Mm-hm."
      momGhost(w, t, { at: [-1.2, 0.0, 1.15], yaw: 150, look: 0.5,
        face: faceTrack(w, lt, [[0, momFace], [0.4, { lid: 0.18, browUp: 0.35, mouthCurve: 0.5, happy: 0.15 }], [4.5, { lid: 0.3, browUp: 0.3, browAsym: 0.6, mouthCurve: 0.6, mouthSkew: 0.4 }]]) });
      const fold = ramp(lt, 2.9, 3.4);
      kip(w, t, {
        at: [-2.05, 0.3, 0.7], yaw: 125,
        pose: (r, local) => {
          const base = floatWith(w, { head: [0, 24, 4 * ramp(lt, 3.0, 3.3)], spine: [-3, 0, 0] });
          if (fold <= 0) return base;
          r.setPose(base);
          r.root.updateMatrixWorld(true);
          const sp = r.joints.spine;
          const q = r.solve(base, { L: sp.localToWorld(V(-0.1, 0.3, 0.24)), R: sp.localToWorld(V(0.12, 0.25, 0.27)) });
          return w.Mascot.mixPose(base, q, fold);
        },
        face: faceTrack(w, lt, [[0, { lid: 0.2, browUp: 0.2, mouthCurve: -0.3, lookX: 0.4 }], [3.0, { lid: 0.25, lidSlant: 0.6, browUp: -0.4, browTilt: 0.9, mouthCurve: -0.5, lookX: 0.4 }],
          [4.4, { lid: 0.3, lidSlant: 0.5, browUp: -0.3, browTilt: 0.8, mouthCurve: -0.6, mouthSkew: 0.4, lookX: 0.6 }]]),
      });
      w.cam([0.25, 1.5, -1.05], [-1.55, 1.24, 0.95], 40, 0.3 * Math.sin(lt * 0.7));
    },
  },
  52: {
    key: 0.8,
    pose(w, lt) {
      // his view: the stairs, where he goes to sit (the HUD is an overlay)
      w.house.light('living');
      w.cam([-0.6, 1.62, 0.6], [2.4, 1.3, 0.4], L.wide, 0.6 * Math.sin(lt * 0.8));
    },
  },
  53: {
    key: 3.3,
    pose(w, lt, t) {
      w.house.light('living');
      const st = w.house.props.stairs;
      // he sinks the last of the way onto the sixth step and folds up, elbows on his knees, his head in his hands
      const sit = 0.35 + 0.65 * ramp(lt, 0, 1.2, E.inOut);
      const tr = 6, seatY = st.stepTop(tr) + 0.2, seatZ = st.zAt(tr) + 0.05;
      kip(w, t, {
        at: [2.62, seatY, seatZ - 0.04], yaw: 0,
        pose: (r) => {
          const p = w.Mascot.mixPose(floatWith(w, {}), { spine: [18, 0, 0], head: [-4, 0, -4], legL: [-82, 0, 8], kneeL: 96, footL: 10, legR: [-80, 0, 10], kneeR: 92, footR: 8 }, sit);
          r.setPose(p);
          r.root.updateMatrixWorld(true);
          if (lt < 0.7) return p;
          const hd = headOf(r);
          const q = r.solve(p, { L: hd.clone().add(V(0.3, -0.16, 0.06)), R: hd.clone().add(V(-0.3, -0.17, 0.05)) });
          return w.Mascot.mixPose(p, q, ramp(lt, 0.7, 1.4));
        },
        face: faceTrack(w, lt, [[0, { lid: 0.3, browUp: 0.3, browTilt: -0.7, mouthCurve: -0.5, lookY: -0.4 }], [2.0, { lid: 0.42, lidSlant: -0.5, browUp: 0.3, browTilt: -1, mouthCurve: -0.75, lookY: -0.6 }]]),
      });
      // sit on the tread (his hips there, hovering a hand above it)
      const k = w.cast.ghostKip;
      k.sitOn(seatY - 0.04 + 0.3 * (1 - sit));
      w.cam([0.15, 2.62, 1.2], [2.6, track(lt, [[0, 2.3], [1.4, 2.12, E.cam]]), 0.2], 44, 0.3 * Math.sin(lt * 0.6));
    },
  },
  54: {
    key: 3.0,
    pose(w, lt, t) {
      w.house.light('living');
      const st = w.house.props.stairs;
      // the cat hops up the treads and sits on his step, beside him, staring at him. "...What?"
      const tr = 6, seatY = st.stepTop(tr) + 0.2;
      const k = kip(w, t, {
        at: [2.62, seatY, st.zAt(tr) + 0.01], yaw: track(lt, [[2.0, 0], [2.5, -22]]),
        pose: (r) => {
          const p = { spine: [16, 0, 0], head: [8, track(lt, [[1.6, 0], [2.2, -40]]), 0], legL: [-82, 0, 8], kneeL: 96, footL: 10, legR: [-80, 0, 10], kneeR: 92, footR: 8, armL: [-40, 0, 16], elbowL: [-60, 0, 0], armR: [-42, 0, 16], elbowR: [-64, 0, 0] };
          return p;
        },
        face: faceTrack(w, lt, [[0, { lid: 0.42, lidSlant: -0.5, browUp: 0.3, browTilt: -1, mouthCurve: -0.75, lookY: -0.6 }], [1.6, { lid: 0.3, browUp: 0.3, lookX: -0.5 }],
          [2.4, { lid: 0.2, browUp: 0.5, browAsym: 0.4, mouthCurve: -0.2, lookX: -0.55 }]]),
      });
      k.sitOn(seatY - 0.04);
      const hops = Math.min(7, Math.max(0, (lt - 0.15) / 0.3));
      const c = lt < 0.15 + 7 * 0.3 ? catOnStairs(w, st, hops, { x: 2.3 }) : null;
      const sitAt = [2.3, st.stepTop(tr), st.zAt(tr) + 0.02];
      if (c) catAt(w, w.cast.cat, t, { at: c.at, yaw: 180, pose: c.pose, face: 'calm' });
      else {
        const s = ramp(lt, 0.15 + 7 * 0.3, 0.15 + 7 * 0.3 + 0.45);
        catAt(w, w.cast.cat, t, { at: sitAt, yaw: 180 - 80 * s, pose: w.Mascot.mixCatPose('stand', 'sit', s), face: 'calm', look: headOf(k).toArray() });
      }
      w.cam([0.3, 2.66, 1.15], [2.5, 1.98, 0.5], 48, 0.3 * Math.sin(lt * 0.6));
    },
  },
  55: {
    key: 3.0,
    pose(w, lt, t) {
      w.house.light('living', 'hall');
      const st = w.house.props.stairs;
      // she gets up, trots on up the stairs, stops four steps above him and looks back at him. "You know where I am?"
      const tr = 6, seatY = st.stepTop(tr) + 0.2;
      const k = kip(w, t, {
        at: [2.62, seatY, st.zAt(tr) + 0.01], yaw: track(lt, [[0, -22], [1.2, 0]]),
        pose: { spine: [8, 0, 0], head: [track(lt, [[0.6, 8], [1.6, -26]]), 0, 0], legL: [-82, 0, 8], kneeL: 96, footL: 10, legR: [-80, 0, 10], kneeR: 92, footR: 8, armL: [-40, 0, 16], elbowL: [-60, 0, 0], armR: [-42, 0, 16], elbowR: [-64, 0, 0] },
        face: faceTrack(w, lt, [[0, { lid: 0.2, browUp: 0.5, browAsym: 0.4, mouthCurve: -0.2, lookX: 0.55 }], [1.2, { browUp: 0.6, lookY: 0.6 }], [2.3, { eyeScale: 1.12, browUp: 0.75, lookY: 0.6, mouthCurve: 0.25 }]]),
      });
      k.sitOn(seatY - 0.04);
      const hops = 7 + Math.min(4, Math.max(0, (lt - 0.35) / 0.3));
      const done = lt > 0.35 + 4 * 0.3;
      const c = catOnStairs(w, st, Math.min(hops, 10.999), { x: 2.3 });
      const look = ramp(lt, 2.0, 2.4);
      catAt(w, w.cast.cat, t, {
        at: done ? [2.3, st.stepTop(10), st.zAt(10)] : c.at, yaw: 180 - 70 * look,
        pose: done ? w.Mascot.mixCatPose('stand', Object.assign({}, w.Mascot.CAT_POSES.lead, { body: [0, -12, 0], head: [-10, -75, -6] }), look) : c.pose, face: 'calm',
      });
      w.cam([-0.25, 2.8, 0.6], [2.45, 2.12, -0.3], 44, 0.3 * Math.sin(lt * 0.6));
    },
  },
};
