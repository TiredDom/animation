// Scene 3: The search. Up into the hall, Mom's closet and Dad's photo, Mom finds the body and draws the mustache,
// she carries it upstairs; the garage present is socks; the attic trunk, and a hand on his shoulder.
import * as THREE from 'three';
import { V, L, person, bodyOnCouch, catOnChair, faceTrack, poseTrack, poseWith, headOf, legIK, stairGait, cruise, track, E, ramp } from './stage.js';
import { walk, walkPhase } from './motion.js';

const floatWith = (w, extra) => Object.assign({}, w.Mascot.POSES.float, extra);
const UP = 2.92, ATTIC = 5.64;
const momLeg = 0.642;
const DEG = Math.PI / 180;
const MARKER = 1.6;   // the marker is drawn 1.6× its kit size, so it reads in the round nub hands

// A smooth path of [x, z] points on the floor.
const pathOf = (pts) => new THREE.CatmullRomCurve3(pts.map(([x, z]) => V(x, 0, z)));
// Where a walker is on a path after covering share u of it: place, heading (degrees) and distance.
function along(curve, u) {
  const p = curve.getPointAt(Math.max(0, Math.min(1, u)));
  const tan = curve.getTangentAt(Math.min(0.999, Math.max(0.001, u)));
  return { at: [p.x, 0, p.z], yaw: (Math.atan2(tan.x, tan.z) * 180) / Math.PI, dist: u * curve.getLength() };
}
// A stride phase scaled so a walk of `len` metres ends on a passing position (both feet under the body).
const strideScale = (len, leg) => { const p = walkPhase(len, leg); return Math.max(0.5, Math.round(p * 2) / 2) / p; };

// Kip's body over Mom's shoulder like a sack (side 1: her left, -1: her right): hips on her shoulder, torso hanging
// down her back, legs in front, arms dangling. Returns the body's world transform for her current pose.
const _m = new THREE.Matrix4();
function carryTransform(w, mom, side = 1) {
  const kip = w.cast.kip;
  mom.root.updateMatrixWorld(true);
  const t = V(0, -0.8, -0.6).normalize(), f = V(0, 0, 1).addScaledVector(t, 0.6).normalize(), x = new THREE.Vector3().crossVectors(t, f);
  const q = new THREE.Quaternion().setFromRotationMatrix(_m.makeBasis(x, t, f));
  const pelvis = V(0.22 * side, 0.43 + 0.13, -0.02);
  const local = pelvis.clone().sub(V(0, kip.dims.hipY, 0).applyQuaternion(q));
  const sp = mom.joints.spine.matrixWorld;
  const pos = local.applyMatrix4(sp);
  const quat = new THREE.Quaternion().setFromRotationMatrix(_m.extractRotation(sp)).multiply(q);
  return { pos, quat };
}
const CARRY = { legL: [-80, 0, 6], kneeL: 70, footL: 20, legR: [-86, 0, 8], kneeR: 64, footR: 16, spine: [6, 0, 0], head: [20, 0, 0] };

// Kip's ghost face-down in the air with his head and arms in the trunk (through its left end), legs out behind.
// Returns the place and the turn of the body for shots 32 and 33.
export function inTrunk(w) {
  const tr = w.house.props.trunk.group;
  tr.updateMatrixWorld(true);
  const head = tr.localToWorld(V(-0.22, 0.31, 0.0));
  const yaw = (tr.rotation.y * 180) / Math.PI + 90;          // facing the trunk's left end, from outside it
  const dir = V(Math.sin(yaw * DEG), 0, Math.cos(yaw * DEG));
  return { head, yaw, dir };
}
export function proneKip(w, t, lt, { kick = 1, live = true, who = 'kip', pitch = 106 } = {}) {
  const k = w.cast.ghostKip, { head, yaw, dir } = inTrunk(w);
  const s1 = Math.sin(lt * 3.1) * kick, s2 = Math.sin(lt * 3.1 + 1.9) * kick;
  person(w, k, t, {
    at: [0, 0, 0], yaw, ghost: false, who, talkGain: 0.4, live,
    pose: {
      spine: [-6, 0, 0], head: [-14, 0, 0],
      armL: [-158 + 6 * s1, 0, 16], elbowL: [-24 - 10 * s2, 0, 0], armR: [-152 + 6 * s2, 0, 14], elbowR: [-30 - 10 * s1, 0, 0],
      legL: [6 + 10 * s1, 0, 4], kneeL: 28 + 18 * Math.max(0, s1), footL: 34, legR: [10 - 10 * s1, 0, 3], kneeR: 22 + 18 * Math.max(0, -s1), footR: 30,
    },
    face: 'neutral',
  });
  // tip him forward into a dive (the root turned `pitch` degrees about his own left-right axis: head down into the
  // trunk, hips and legs higher, his chest clear of the boards) and slide him so the skull centre sits in the trunk;
  // the 2.4 s ghost hover rides on top
  k.root.rotation.set(0, 0, 0);
  k.root.quaternion.setFromAxisAngle(V(0, 1, 0), yaw * DEG).multiply(new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), pitch * DEG));
  k.root.position.set(0, 0, 0);
  k.root.updateMatrixWorld(true);
  const now = headOf(k);
  k.root.position.copy(head).sub(now).add(V(0, 0.02 * Math.sin((t / 2.4) * Math.PI * 2), 0));
  k.root.updateMatrixWorld(true);
  return { rig: k, dir };
}

export const SCENE3 = {
  17: {
    key: 1.6,
    pose(w, lt, t) {
      w.house.light('hall');
      // he shoots up through the floorboards (hands, head, then the rest), slows, looks round the hall and settles
      // on the closet door at its end, behind the camera; he starts toward it
      const rise = ramp(lt, 0, 1.5, E.out), drift = ramp(lt, 2.5, 3.0, E.in);
      const aL = 1 - ramp(lt, 0.75, 1.6), aR = 1 - ramp(lt, 0.85, 1.7), legs = ramp(lt, 0.9, 1.8);
      const at = [-4.3 - 0.22 * drift, UP - 1.25 + 1.5 * rise, -1.42];
      person(w, w.cast.ghostKip, t, {
        at, yaw: -90, ghost: true,
        pose: () => {
          const p = w.Mascot.mixPose({ legL: [0, 0, 2], kneeL: 6, footL: 40, legR: [0, 0, 2], kneeR: 6, footR: 40 }, 'float', legs);
          p.armL = [-8 - 2 * aL, 0, 22 + 128 * aL]; p.elbowL = [-22 + 12 * aL, 0, 0];
          p.armR = [-5 - 5 * aR, 0, 26 + 124 * aR]; p.elbowR = [-14 + 4 * aR, 0, 0];
          p.head = [track(lt, [[0, -12], [1.4, 0], [2.6, 0], [3.0, 4]]), track(lt, [[1.55, 0], [1.9, 30], [2.3, -24], [2.65, 0]]), 0];
          p.spine = [track(lt, [[2.4, 1], [3.0, 7]]), 0, 0];
          return p;
        },
        face: faceTrack(w, lt, [
          [0, 'determined'], [1.3, 'determined'], [1.5, { browUp: 0.35, mouthCurve: 0.2 }],
          [1.75, { browUp: 0.3, lookX: 0.55, mouthCurve: 0.2 }], [2.15, { browUp: 0.3, lookX: -0.55, mouthCurve: 0.2 }],
          [2.55, { lid: 0.16, lidSlant: 0.55, browUp: -0.3, browTilt: 0.7, mouthCurve: 0.5, mouthSkew: 0.5 }],
        ]),
      });
      // low at the start, the camera cranes up with him to his chest and holds
      const cy = track(lt, [[0, 0.5], [1.8, 1.1, E.cam]]), ly = track(lt, [[0, 0.42], [1.8, 1.12, E.cam], [3.0, 1.18]]);
      w.cam([-7.15, UP + cy, -1.86], [-4.3, UP + ly, -1.5], 42, 0.5 * Math.sin(lt * 0.9));
    },
  },
  18: {
    key: 3.0,
    pose(w, lt, t) {
      w.house.light('closet');
      // his head pushes through the closed door and looks; he floats in, scans the clothes and the shoeboxes
      // ("Shoes... shoes... shoes..."), and his eyes land on the photo on the end wall, off to the camera's left
      const lean = track(lt, [[0, 18], [0.9, 12], [1.4, 8], [2.6, 3]]);
      const hx = track(lt, [[0, -7.3], [0.85, -7.9, E.out], [1.35, -7.9], [2.6, -8.72]]);
      const hz = track(lt, [[1.35, -1.45], [2.6, -1.22]]);
      const yaw = track(lt, [[1.6, -90], [2.3, -108], [3.5, -100], [4.15, -84]]);
      const reach = 0.76 * Math.sin(lean * DEG);
      const at = [hx - Math.sin(yaw * DEG) * reach, UP + 0.3, hz - Math.cos(yaw * DEG) * reach];
      person(w, w.cast.ghostKip, t, {
        at, yaw, ghost: true, who: 'kip',
        pose: floatWith(w, {
          spine: [lean, 0, 0],
          head: [track(lt, [[2.6, 2], [3.0, -16], [3.6, -12], [3.95, 0]]), track(lt, [[1.35, 0], [1.8, -32], [2.6, -26], [3.0, -12], [3.65, -10], [4.05, 48]]), 0],
          armL: [-10, 0, 20], elbowL: [-40, 0, 0], armR: [-12, 0, 22], elbowR: [-36, 0, 0],
        }),
        face: faceTrack(w, lt, [
          [0, { browUp: 0.35, lookX: 0.2 }], [0.6, { lid: 0.12, browUp: 0.1, lookX: -0.3 }],
          [1.6, { lid: 0.15, browUp: -0.1, mouthCurve: -0.1, lookX: -0.5 }], [2.7, { lid: 0.15, browUp: -0.05, mouthCurve: -0.1, lookX: -0.35, lookY: 0.5 }],
          [3.55, { lid: 0.2, browUp: -0.15, mouthCurve: -0.15, lookY: 0.4 }], [3.7, { lid: 0.3, browUp: -0.25, lookX: 0.3 }],
          [3.9, { eyeScale: 1.18, browUp: 0.85, lookX: 0.65, mouthOpen: 0.15, mouthRound: 0.6 }],
        ]),
      });
      const look = track(lt, [[0, [-7.75, UP + 1.5, -1.45]], [1.3, [-7.95, UP + 1.55, -1.42]], [2.7, [-8.7, UP + 1.62, -1.25], E.cam]]);
      w.cam([-10.25, UP + 1.5, 0.95], look, track(lt, [[0, 30], [2.7, 27, E.cam]]), 0.4 * Math.sin(lt * 0.7));
    },
  },
  19: {
    key: 2.0,
    pose(w, lt) {
      // his view: Dad's photo, the whole gold frame, a slow push in on "Dad?"
      w.house.light('closet');
      const p = w.house.spots.dadPhoto;
      const d = track(lt, [[0, 1.6], [4.0, 1.48, E.cam]]);
      w.cam([p.x + d, p.y + 0.06, p.z + 0.03], [p.x, p.y, p.z], 27, 0.3 * Math.sin(lt * 0.6));
    },
  },
  20: {
    key: 1.3,
    pose(w, lt, t) {
      w.house.light('closet');
      const at = [-9.25, UP + 0.3, 0.2];
      const shudder = 3 * Math.sin(lt * 14) * ramp(lt, 2.35, 2.5) * (1 - ramp(lt, 2.75, 2.95));
      person(w, w.cast.ghostKip, t, {
        at, yaw: -90, ghost: true, who: 'kip',
        pose: floatWith(w, { spine: [-4, 0, 0], head: [-2, 0, shudder], armL: [-14, 0, 18], elbowL: [-30, 0, 0], armR: [-10, 0, 20], elbowR: [-26, 0, 0] }),
        face: faceTrack(w, lt, [
          [0, { eyeScale: 1.25, browUp: 1, mouthOpen: 0.1 }],
          [0.4, { eyeScale: 1.2, browUp: 0.7, browTilt: -0.8, mouthCurve: -0.5, mouthWide: 0.8, lookY: 0.05 }],
          [2.3, { eyeScale: 1.2, browUp: 0.7, browTilt: -0.8, mouthCurve: -0.5, mouthWide: 0.8, lookY: 0.05 }],
          [2.6, { eyeScale: 1.0, lid: 0.3, browUp: 0.45, browTilt: -0.9, mouthCurve: -0.7, mouthWide: 0.85, lookY: -0.2 }],
        ]),
      });
      w.frameOn([at[0], at[1] + 1.42, at[2]], 1.0, { az: -90, el: 2, fov: L.wide });
    },
  },
  21: {
    key: 1.0,
    pose(w, lt) {
      // his view in the closet, under the HUD (the HUD itself is an overlay in the composition)
      w.house.light('closet');
      w.cam([-8.4, UP + 1.72, 0.9], [-10.0, UP + 1.3, -1.6], L.wide, 0.6 * Math.sin(lt * 0.8));
    },
  },
  22: {
    key: 3.2,
    pose(w, lt, t) {
      w.house.light('living');
      w.house.props.tv.show('spectating', { left: 221 });
      bodyOnCouch(w);
      // she walks in from the kitchen door already under way, slows and stops in front of the couch, turns to the
      // body and, after a beat, smiles
      const curve = pathOf([[-2.75, 1.12], [-1.85, 0.72], [-1.05, 0.02], [-0.45, -0.68]]);
      const len = curve.getLength();
      const p = along(curve, cruise(lt, 0, 2.55, 0.8));
      const toKip = w.yawTo(p.at, [0.25, 0, -1.65]);
      const yaw = p.yaw + (toKip - p.yaw) * ramp(lt, 2.25, 2.95);
      const stride = walk(walkPhase(p.dist, momLeg) * strideScale(len, momLeg), { arm: 12 });
      person(w, w.cast.mom, t, {
        at: p.at, yaw,
        pose: w.Mascot.mixPose(poseWith(w, 'idle', stride), { head: [7, 0, 0], spine: [2, 0, 0] }, ramp(lt, 2.15, 2.75)),
        face: faceTrack(w, lt, [
          [0, 'neutral'], [2.55, { lid: 0.08 }], [2.8, { lid: 0.32, lidSlant: -0.3, browUp: -0.1, mouthCurve: 0.15 }],
          [3.35, { lid: 0.32, lidSlant: -0.4, mouthCurve: 0.85, mouthSkew: 0.3, browUp: 0.35, browAsym: 0.4 }],
        ]),
      });
      catOnChair(w, t, [p.at[0], 1.4, p.at[2]], { yaw: 25, face: 'sleepy' });
      w.cam([1.9, 1.65, 2.15], [-1.0, 1.08, -0.8], track(lt, [[0, 42], [3.5, 39.5, E.cam]]));
    },
  },
  23: {
    key: 0.95,
    pose(w, lt, t) {
      w.house.light('living');
      bodyOnCouch(w);
      // her hands in front of her chest: the marker across them, the cap toward her left hand; she pulls the cap
      // off along the marker (the pop), takes it away, and turns the tip up
      const mom = w.cast.mom, at = [-0.45, 0, -0.68], yaw = 147;
      const mk = w.props.marker, cap = mk.userData.cap;
      const pull = ramp(lt, 0.55, 0.8, E.inOut), away = ramp(lt, 0.95, 1.6), up = ramp(lt, 1.35, 2.2);
      person(w, mom, t, {
        at, yaw,
        pose: (r, local) => {
          const base = { spine: [6, 0, 0], head: [24, 0, 0] };
          const o = local(0, 0, 0);
          const side = local(1, 0, 1).sub(o).normalize(), tipUp = local(0.25, 0.55, 0.8).sub(o).normalize();
          const dir = side.clone().lerp(tipUp, up).normalize();
          const R = local(-0.08, 0.86, 0.3).lerp(local(-0.02, 0.95, 0.42), up);
          // marker origin (the barrel's middle) above the right hand's grip on the lower barrel
          mk.visible = true;
          mk.scale.setScalar(MARKER);
          mk.quaternion.setFromUnitVectors(V(0, 1, 0), dir);
          mk.position.copy(R).addScaledVector(dir, 0.055);
          mk.updateMatrixWorld(true);
          // the cap: on the marker until the pull, then in her left hand
          const capAt = mk.position.clone().addScaledVector(dir, 0.112 + 0.11 * pull);
          let Lh = capAt.clone().addScaledVector(dir, 0.09);
          if (pull > 0) {
            w.scene.attach(cap);
            const rest = local(0.3, 0.8, 0.24);
            Lh = Lh.lerp(rest, away);
            cap.position.copy(Lh).addScaledVector(dir, -0.09 * (1 - away)).add(V(0, 0.045 * away, 0));
            cap.quaternion.setFromUnitVectors(V(0, 1, 0), side.clone().lerp(V(0, 1, 0), away).normalize());
          }
          return r.solve(base, { R, L: Lh });
        },
        face: { lid: 0.3, lidSlant: -0.4, mouthCurve: 0.8, mouthSkew: 0.3, browUp: 0.3, browAsym: 0.4, lookY: -0.6 },
      });
      // close on her hands from her front-right, square to the marker, the lamp-lit corner behind them
      mom.root.updateMatrixWorld(true);
      const c = mom.root.localToWorld(V(0.04, 0.88, 0.42));
      w.frameOn([c.x, c.y, c.z], 0.42, { az: yaw - 45, el: 8, fov: L.medium });
    },
  },
  24: {
    key: 1.6,
    pose(w, lt, t) {
      w.house.light('living');
      // three strokes over 1.2 s, from his right to his left, the marker tip on the painted line; between strokes
      // the tip lifts a little and moves on
      const m = track(lt, [[0.9, 0], [1.2, 0.36], [1.35, 0.36], [1.65, 0.68], [1.8, 0.68], [2.1, 1]]);
      const lift = Math.max(0, Math.sin(Math.PI * ramp(lt, 1.2, 1.35, E.linear)), Math.sin(Math.PI * ramp(lt, 1.65, 1.8, E.linear)));
      const body = bodyOnCouch(w, { mustache: m });
      const skull = body.joints.head.children[0];
      body.root.updateMatrixWorld(true);
      // the tip on the head surface where the reveal edge crosses the mustache (face coordinates in head radii)
      const R = 0.36, fx = Math.max(-0.2, Math.min(0.2, -0.24 + 0.48 * m));
      const ax = Math.abs(fx), fy = ax < 0.12 ? -0.16 + 0.1 * ax : -0.148 + (ax - 0.12) * 1.1;
      const surf = skull.localToWorld(V(fx * R, fy * R, Math.sqrt(R * R - fx * fx * R * R - fy * fy * R * R)));
      const centre = skull.getWorldPosition(V(0, 0, 0));
      const nrm = surf.clone().sub(centre).normalize();
      const into = lt < 0.9 ? ramp(lt, 0.25, 0.9) : lt > 2.2 ? 1 - ramp(lt, 2.2, 2.9) : 1;
      const out = 0.004 + 0.018 * lift + 0.25 * (1 - into);
      const tip = surf.clone().addScaledVector(nrm, out).add(V(0.08, -0.1, 0.12).multiplyScalar(1 - into));
      // the marker comes in from his left, angled down, its barrel kept under the drawn line and his eyes
      const dir = V(0.82, -0.38, 0.42).normalize();
      const mk = w.props.marker;
      mk.visible = true;
      mk.scale.setScalar(MARKER);
      mk.userData.cap.visible = false;
      mk.quaternion.setFromUnitVectors(V(0, 1, 0), dir.clone().negate());
      mk.position.copy(tip).addScaledVector(dir, 0.088 * MARKER);
      const hand = tip.clone().addScaledVector(dir, 0.088 * MARKER + 0.055);
      // Mom at his left, leaning in, her profile beside his face (both faces clear of the marker and of each other)
      const mat = [0.8, 0, -0.96];
      person(w, w.cast.mom, t, {
        at: mat, yaw: -90,
        pose: (r) => r.solve({ spine: [-3, 0, 0], head: [14, -6, 0] }, { R: hand }),
        face: { lid: 0.35, lidSlant: -0.4, mouthCurve: 0.9, mouthSkew: 0.4, lookY: -0.5, lookX: -0.2 },
      });
      const head = headOf(body);
      w.frameOn([head.x + 0.3, head.y + 0.2, head.z + 0.15], 1.24, { az: -15, el: 3, fov: L.medium });
    },
  },
  25: {
    key: 3.4,
    pose(w, lt, t, shot) {
      w.house.light('living', 'hall');
      const mom = w.cast.mom, kip = w.cast.kip, st = w.house.props.stairs;
      const len = shot.end - shot.start;
      // the beats: she bends over him (0.3–0.95), Hup! pulls him onto her right shoulder (0.95–1.3), stands up with
      // him (1.2–1.9), turns, walks to the foot of the stairs (2.2–W), turns onto them and climbs tread by tread
      // until the ceiling of the stairwell takes her
      const bend = ramp(lt, 0.3, 0.95) * (1 - ramp(lt, 1.2, 1.9));
      const lift = ramp(lt, 0.95, 1.3, E.inOut);
      const W0 = 2.05, W1 = 5.05, C0 = 5.4, STEP = 0.42;
      const curve = pathOf([[0.3, -0.7], [1.0, 0.5], [1.7, 1.75], [2.1, 2.08], [2.5, 2.1]]);
      const plen = curve.getLength();
      const stand = [0.25, 0, -0.75];
      let at = stand, yaw = 180, legs = null, k = -1;
      const p = along(curve, cruise(lt, W0, W1, 0.7) * (lt > W0 ? 1 : 0));
      if (lt < W0) {
        yaw = 180 + (p.yaw - 180) * ramp(lt, 1.75, 2.35);
        at = [stand[0] + (p.at[0] - stand[0]) * ramp(lt, 1.8, 2.15), 0, stand[2] + (p.at[2] - stand[2]) * ramp(lt, 1.8, 2.15)];
      } else if (lt < W1) {
        at = p.at; yaw = p.yaw;
      } else {
        at = p.at;
        yaw = p.yaw + (180 - p.yaw) * ramp(lt, W1 - 0.15, C0 + 0.1);
        k = (lt - C0) / STEP;
      }
      const stride = lt > W0 && lt < W1 + 0.2 ? walk(walkPhase(p.dist, momLeg) * strideScale(plen, momLeg), { arm: 10, lean: 7 }) : null;
      let rootAt = [at[0], 0, at[2]];
      let gait = null;
      if (k >= 0) {
        gait = stairGait(st, k, { x: at[0], startZ: at[2], h: 0.642 - 0.04 * Math.min(1, k), hipX: 0.098, first: 'R' });
        rootAt = [gait.pelvis.x, gait.pelvis.y - mom.dims.hipY, gait.pelvis.z];
      }
      person(w, mom, t, {
        at: rootAt, yaw, who: 'mom',
        pose: (r, local) => {
          // the body of the pose: a squat for the hoist, the walk, or the climb
          const base = poseWith(w, 'idle', Object.assign({}, stride || {}, {
            spine: [6 + 46 * bend + (k >= 0 ? 8 : 0), stride ? stride.spine[1] : 0, 0],
            head: [8 + 6 * bend, 0, 0],
            hipsY: (stride ? stride.hipsY : 0) - 0.3 * bend,
          }));
          r.setPose(base);
          // feet: planted under her while she squats, the stair gait while she climbs, the walk cycle between
          if (!stride) {
            r.root.updateMatrixWorld(true);
            const soles = gait ? gait.feet : { L: local(0.098, 0, 0.04), R: local(-0.098, 0, 0.04) };
            if (!gait) { soles.L.y = 0; soles.R.y = 0; }
            for (const side of ['L', 'R']) {
              const g = legIK(r, side, soles[side]);
              base['leg' + side] = g.leg; base['knee' + side] = g.knee; base['foot' + side] = g.foot;
            }
            r.setPose(base);
          }
          // Kip: seated, pulled onto her shoulder, then carried
          const seat = w.house.spots.couchSeats[1];
          const carry = carryTransform(w, r, -1);
          const fromPos = V(seat.x, w.house.props.couch.seatTop - 0.015 - (kip.dims.hipY - kip.dims.pelvisDrop), seat.z);
          kip.root.visible = true;
          kip.root.position.copy(fromPos.lerp(carry.pos, lift));
          kip.root.quaternion.copy(new THREE.Quaternion().slerp(carry.quat, lift));
          kip.root.updateMatrixWorld(true);
          const kp = w.Mascot.mixPose('game', CARRY, lift);
          kip.setPose(kp);
          if (lift > 0.5) {
            kip.root.updateMatrixWorld(true);
            const hang = (side) => kip.joints['arm' + side].getWorldPosition(V(0, 0, 0)).add(V(0, -0.42, 0.02));
            kip.setPose(kip.solve(kp, { L: hang('L'), R: hang('R') }));
          }
          kip.blink = false;
          kip.setExpression({ mouthOpen: 0.1, mouthRound: 0.3, mustache: 1, lookY: 0.08 });
          kip.root.updateMatrixWorld(true);
          // her hands: both on his waist for the pull, then her right arm over his thighs; the left on the rail
          const waist = kip.joints.spine.getWorldPosition(V(0, 0, 0));
          const thighs = kip.joints.kneeR.getWorldPosition(V(0, 0, 0)).lerp(kip.joints.legR.getWorldPosition(V(0, 0, 0)), 0.45).add(V(0, 0.07, 0));
          const hands = {};
          if (lt < 1.25) {
            const reachIn = ramp(lt, 0.35, 0.9);
            hands.L = local(0.2, 0.95, 0.25).lerp(waist.clone().add(local(0.17, 0, 0).sub(local(0, 0, 0))), reachIn);
            hands.R = local(-0.2, 0.95, 0.25).lerp(waist.clone().add(local(-0.17, 0, 0).sub(local(0, 0, 0))), reachIn);
          }
          if (lt > 1.0) hands.R = (hands.R || thighs).clone().lerp(thighs, ramp(lt, 1.0, 1.3));
          if (lt > 1.3 && !stride && k < 0) delete hands.L;
          if (k > 0.3) {
            const zr = gait.pelvis.z - 0.12;
            const rail = V(st.x0 + 0.04, 1.05 + 0.705 * (st.zFront - 0.13 - zr) + 0.03, zr);
            hands.L = local(0.25, 0.9, 0.1).lerp(rail, ramp(k, 0.3, 1.2));
          }
          return r.solve(base, hands);
        },
        face: faceTrack(w, lt, [[0, { lid: 0.3, mouthCurve: 0.6 }], [0.9, { lid: 0.45, mouthCurve: 0.2, browUp: -0.2, mouthOpen: 0.3 }], [1.5, { lid: 0.2, mouthCurve: 0.55, mouthSkew: 0.3 }]]),
      });
      // the controller: in his hands until the pull, then left in the dent of the seat
      const c = w.props.controller, seat = w.house.spots.couchSeats[1];
      c.visible = true;
      if (lift <= 0) {
        bodyOnCouchHands(w, c);
      } else {
        c.position.set(seat.x, 0.445, seat.z + 0.05);
        c.rotation.set(0, 0.4, 0);
      }
      catOnChair(w, t, [rootAt[0], 1.4, rootAt[2]], { yaw: 25, face: 'sleepy' });
      w.cam([-2.75, 2.1, 0.2], [1.2, 1.2, 0.1], 46);
    },
  },
  26: {
    key: 1.6,
    pose(w, lt, t) {
      w.house.light('garage');
      // feet first through the garage ceiling, slowing to a hover; he looks round and finds the box over his shoulder
      const y = track(lt, [[0, 2.55], [1.35, 0.35, E.out]]);
      const arms = 1 - ramp(lt, 0.6, 1.4);
      person(w, w.cast.ghostKip, t, {
        at: [-8.95, y, -0.95], yaw: 20, ghost: true,
        pose: floatWith(w, {
          armL: [-8, 0, 22 + 110 * arms], elbowL: [-22, 0, 0], armR: [-6, 0, 26 + 104 * ramp(1 - lt, -0.1, 0.5) * arms], elbowR: [-14, 0, 0],
          head: [track(lt, [[0, 14], [1.3, 0], [2.0, 4]]), track(lt, [[1.7, 0], [2.3, 62]]), 0],
          spine: [0, track(lt, [[1.75, 0], [2.4, 18]]), 0],
        }),
        face: faceTrack(w, lt, [[0, { browUp: 0.3 }], [1.5, { lid: 0.12, lookX: -0.3 }], [1.95, { lid: 0.1, lookX: 0.6 }], [2.35, { eyeScale: 1.15, browUp: 0.75, lookX: 0.6, mouthCurve: 0.55 }]]),
      });
      w.cam([-8.15, 0.45, 1.35], [-8.95, track(lt, [[0, 2.15], [1.4, 1.65, E.cam]]), -0.95], 44, 0.4 * Math.sin(lt));
    },
  },
  27: {
    key: 1.7,
    pose(w, lt, t) {
      w.house.light('garage');
      // he settles low beside the box and leans in to it, delighted: "Bingo."
      const gp = w.house.props.garagePresent.group;
      gp.updateMatrixWorld(true);
      const box = gp.localToWorld(V(0, 0.3, 0)), at = gp.localToWorld(V(-0.78, 0, 0.34));
      const lean = ramp(lt, 0.1, 1.0);
      person(w, w.cast.ghostKip, t, {
        at: [at.x, -0.02 + 0.06 * (1 - lean), at.z], yaw: w.yawTo([at.x, 0, at.z], [box.x, 0, box.z]), ghost: true, who: 'kip',
        pose: floatWith(w, {
          spine: [8 + 16 * lean, 0, 0], head: [6 + 6 * lean, 0, 0],
          legL: [-70, 0, 10], kneeL: 100, footL: 20, legR: [-64, 0, 12], kneeR: 94, footR: 24,
          armL: [-36, 0, 22], elbowL: [-74, 0, 0], armR: [-40, 0, 20], elbowR: [-70, 0, 0],
        }),
        face: faceTrack(w, lt, [[0, { eyeScale: 1.1, browUp: 0.6 }], [1.05, { happy: 0.3, mouthCurve: 1, mouthSkew: 0.4, lid: 0.1, browUp: 0.4 }], [2.4, 'happy']]),
      });
      w.cam([-7.72, 0.85, 0.0], [-8.62, 0.7, -1.7], 42, 0.3 * Math.sin(lt * 0.8));
    },
  },
  28: {
    key: 1.4,
    pose(w, lt, t) {
      w.house.light('garage');
      // from the box's left end he reaches over to grab it and his hands sink straight through the lid; he tries
      // again, harder, and they go in to the wrists
      const gp = w.house.props.garagePresent.group;
      gp.updateMatrixWorld(true);
      const at = gp.localToWorld(V(-0.74, 0, 0.04)), mid = gp.localToWorld(V(0, 0, 0));
      const g1 = track(lt, [[0.2, 0], [0.75, 1], [1.05, 1.3], [1.55, 1.3], [1.85, 0.55], [2.2, 1.0], [2.5, 1.7], [3.2, 1.7]]);
      const sink = Math.max(0, g1 - 1);
      person(w, w.cast.ghostKip, t, {
        at: [at.x, 0.12, at.z], yaw: w.yawTo([at.x, 0, at.z], [mid.x, 0, mid.z]), ghost: true, who: 'kip',
        pose: (r) => {
          const hand = (x, z) => gp.localToWorld(V(x - 0.18, 0.8, z)).lerp(gp.localToWorld(V(x, 0.53, z)), Math.min(1, g1)).add(V(0, -0.34 * sink, 0));
          return r.solve(floatWith(w, { spine: [30 + 8 * sink, 0, 0], head: [16, 0, 0] }), { R: hand(-0.16, 0.14), L: hand(-0.18, -0.13) });
        },
        face: faceTrack(w, lt, [[0, { happy: 0.3, mouthCurve: 0.9 }], [0.9, { eyeScale: 1.2, browUp: 0.9, mouthOpen: 0.3, mouthRound: 0.5 }], [1.5, { lid: 0.3, browUp: -0.4, browTilt: 0.6, mouthCurve: -0.5 }]]),
      });
      const look = gp.localToWorld(V(-0.3, 0.5, 0.02));
      w.frameOn([look.x, look.y, look.z], 0.95, { az: (gp.rotation.y * 180) / Math.PI - 4, el: 24, fov: L.medium });
    },
  },
  29: {
    key: 2.9,
    pose(w, lt, t) {
      // inside the box, scaled up so his head fits (nothing outside shows from in here): dim cardboard, the gap of
      // light under the lid, one sliver of light across his see-through face, the rolled socks and the tag
      w.house.light();
      const gp = w.house.props.garagePresent;
      gp.group.scale.set(1.2, 1.6, 1.6);
      for (const c of gp.group.children) if (c.isMesh && c !== gp.inside) c.visible = false;
      gp.inside.visible = true;
      gp.socks.visible = true;
      gp.group.updateMatrixWorld(true);
      const inBox = (x, y, z) => gp.group.localToWorld(V(x, y, z));
      // his face pushes in through the front wall, then hangs there; head centre in box space
      const push = ramp(lt, 0.1, 1.1, E.out);
      const hc = inBox(0.0, 0.25, 0.42 - 0.1 * push);
      const k = w.cast.ghostKip;
      person(w, k, t, {
        at: [0, 0, 0], yaw: 180 + (gp.group.rotation.y * 180) / Math.PI, ghost: true, who: 'kip',
        pose: floatWith(w, { spine: [10, 0, 0], head: [8, 0, 0] }),
        face: faceTrack(w, lt, [[0, { eyeScale: 1.1, browUp: 0.6 }], [1.3, { lookY: -0.7, browUp: 0.35 }], [2.5, { lid: 0.42, browUp: -0.2, mouthCurve: -0.2, lookY: -0.6 }]]),
      });
      k.root.updateMatrixWorld(true);
      k.root.position.add(hc.clone().sub(headOf(k)));
      // the light: the gap under the lid along the top back edge, and a narrow spot from it across his eyes
      const s = gp.sliver;
      s.visible = true;
      s.position.set(0, 0.47, -0.24);
      s.target.position.set(0, 0.29, 0.1);
      s.angle = 15 * DEG; s.penumbra = 0.85; s.intensity = 1.1; s.distance = 1.6;
      const slit = w.props.slit;
      slit.visible = true;
      const a = inBox(-0.3, 0.483, -0.255), b = inBox(0.3, 0.483, -0.255);
      slit.position.copy(a).lerp(b, 0.5);
      slit.quaternion.copy(gp.group.quaternion);
      slit.scale.set(a.distanceTo(b), 0.006, 0.006);
      // the tag lies on the socks turned to us; we look down past it at his face
      gp.tag.rotation.set(0.95, Math.PI + 0.1, 0.03);
      gp.tag.position.set(0.0, 0.18, -0.02);
      const cam = inBox(0.06, 0.4, -0.235), look = inBox(-0.01, 0.2, 0.18);
      w.cam([cam.x, cam.y, cam.z], [look.x, look.y, look.z], 50);
    },
  },
  30: {
    key: 1.0,
    pose(w, lt) {
      // his view, deflated, looking down at the box (the HUD is an overlay)
      w.house.light('garage');
      const p = w.house.spots.garagePresent;
      w.cam([p.x + 0.4, 1.7, p.z + 1.6], [p.x, 0.3, p.z], L.wide, 0.6 * Math.sin(lt * 0.8));
    },
  },
  31: {
    key: 2.2,
    pose(w, lt, t) {
      w.house.light('attic');
      // up through the floorboards into the moonlit attic, the trunk beyond him; a whisper to himself, a glance back
      const rise = ramp(lt, 0.0, 1.35, E.out);
      const at = [-0.45, ATTIC - 1.25 + 1.47 * rise, 0.42];
      const toCam = w.yawTo(at, [-3.75, 0, -0.55]);
      person(w, w.cast.ghostKip, t, {
        at, yaw: toCam, ghost: true, who: 'kip', talkGain: 0.6,
        pose: floatWith(w, {
          spine: [6 * ramp(lt, 1.0, 1.6), 0, 0], head: [track(lt, [[0, -10], [1.3, 4]]), track(lt, [[2.9, 0], [3.45, 64]]), 0],
          armL: [-14, 0, 22 + 40 * (1 - rise)], elbowL: [-50, 0, 0], armR: [-12, 0, 24 + 36 * (1 - rise)], elbowR: [-44, 0, 0],
        }),
        face: faceTrack(w, lt, [[0, { browUp: 0.45, lookY: 0.3 }], [1.1, { lid: 0.2, lidSlant: 0.4, mouthCurve: 0.4, mouthSkew: 0.4, lookX: 0.5 }],
          [2.85, { lid: 0.2, lidSlant: 0.4, mouthCurve: 0.45, mouthSkew: 0.4, lookX: 0.5 }], [3.15, { lid: 0.1, browUp: 0.4, lookX: 0.7, mouthCurve: 0.6 }]]),
      });
      w.cam([-3.75, ATTIC + 1.1, -0.55], [0.6, ATTIC + 0.92, 0.25], 40, 0.4 * Math.sin(lt * 0.8));
    },
  },
  32: {
    key: 2.0,
    pose(w, lt, t) {
      w.house.light('attic');
      // head and arms in the trunk, rummaging; the rest of him sticks out behind, legs paddling
      proneKip(w, t, lt);
      const { head, dir } = inTrunk(w);
      const mid = head.clone().addScaledVector(dir, -0.75).add(V(0, 0.02, 0));
      w.cam([mid.x - 0.25, ATTIC + 0.9, 1.4], [mid.x + 0.1, ATTIC + 0.36, mid.z], 44, 0.4 * Math.sin(lt * 0.7));
    },
  },
  33: {
    key: 1.2,
    pose(w, lt, t) {
      w.house.light('attic');
      // still in the trunk; a see-through hand comes in and taps his shoulder blade twice, and he goes still.
      // Close at his left shoulder, side on: she floats kneeling beside his hip, out of frame, and only her arm and
      // hand come in (she is shown in the next shot).
      const { rig: k, dir } = proneKip(w, t, lt, { kick: 1 - ramp(lt, 0.7, 1.0), live: lt < 0.9, pitch: 118 });
      k.root.updateMatrixWorld(true);
      const right = V(-dir.z, 0, dir.x);               // his right, horizontal (he dives along dir)
      const back = V(0, 0, -1).applyQuaternion(k.root.quaternion);
      const shoulder = k.joints.armL.getWorldPosition(V(0, 0, 0));
      const blade = shoulder.clone().addScaledVector(back, 0.17).addScaledVector(right, 0.06);
      const tap = lt < 0.42 ? 0 : Math.max(0, Math.sin(Math.PI * ((lt - 0.42) / 0.17))) * (lt < 0.76 ? 1 : 0);
      const onBack = blade.clone().addScaledVector(back, 0.07 + 0.05 * tap);
      const mAt = shoulder.clone().addScaledVector(right, -0.33).addScaledVector(dir, -0.3);
      const mom = w.cast.ghostMom;
      // kneeling in the air, her knees a hand's width over the boards
      person(w, mom, t, {
        at: [mAt.x, ATTIC - 0.2, mAt.z], yaw: w.yawTo([mAt.x, 0, mAt.z], [blade.x, 0, blade.z]), ghost: true,
        pose: (r) => r.solve({ spine: [16, 0, 0], head: [8, 0, 0], legL: [4, 0, 4], kneeL: 100, footL: 30, legR: [8, 0, 4], kneeR: 104, footR: 30 }, {
          L: onBack.clone().lerp(onBack.clone().addScaledVector(right, -0.25).add(V(0, 0.2, 0)), 1 - ramp(lt, 0.0, 0.42)),
        }),
        face: { lid: 0.2, mouthCurve: 0.3 },
      });
      const look = blade.clone().addScaledVector(back, 0.1).addScaledVector(dir, -0.03);
      const cam = blade.clone().addScaledVector(right, -0.74).addScaledVector(dir, 0.24).add(V(0, 0.1, 0));
      w.cam([cam.x, cam.y, cam.z], [look.x, look.y, look.z], 42, 0.3 * Math.sin(lt * 0.7));
    },
  },
};

// The frozen body's controller in his hands (the grip from bodyOnCouch), for the frames before the hoist.
function bodyOnCouchHands(w, c) {
  const seat = w.house.spots.couchSeats[1];
  c.position.set(seat.x, 0.69, seat.z + 0.37);
  c.rotation.set(-0.55, 0, 0);
}
