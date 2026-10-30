// Scene 3: The search. Up into the hall, Mom's closet and Dad's photo, Mom finds the body and draws the mustache,
// she carries it upstairs; the garage present is socks; the attic trunk, and a hand on his shoulder.
import * as THREE from 'three';
import { V, L, person, bodyOnCouch, catOnChair, faceTrack, poseTrack, poseWith, headOf, onHead, track, E, ramp } from './stage.js';
import { walk, walkPhase } from './motion.js';

const floatWith = (w, extra) => Object.assign({}, w.Mascot.POSES.float, extra);
const UP = 2.92, ATTIC = 5.64;
const momLeg = 0.642;

// Mom walking along a path of [x, z] points (a smooth curve) from lt a to b; returns place, heading and distance.
function walkPath(lt, a, b, pts) {
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => V(x, 0, z)));
  const len = curve.getLength();
  const u = ramp(lt, a, b, E.inOut);
  const p = curve.getPointAt(u), tan = curve.getTangentAt(Math.min(0.999, Math.max(0.001, u)));
  return { at: [p.x, 0, p.z], yaw: (Math.atan2(tan.x, tan.z) * 180) / Math.PI, dist: u * len, moving: lt > a && lt < b };
}

// Kip's body over Mom's right shoulder like a sack: hips on her shoulder, torso hanging down her back, legs in
// front, arms dangling. Returns the body's world transform for her current pose.
const _m = new THREE.Matrix4();
function carryTransform(w, mom) {
  const kip = w.cast.kip;
  mom.root.updateMatrixWorld(true);
  const t = V(0, -0.8, -0.6).normalize(), f = V(0, 0, 1).addScaledVector(t, 0.6).normalize(), x = new THREE.Vector3().crossVectors(t, f);
  const q = new THREE.Quaternion().setFromRotationMatrix(_m.makeBasis(x, t, f));
  const pelvis = V(-0.22, 0.43 + 0.13, -0.02);
  const local = pelvis.clone().sub(V(0, kip.dims.hipY, 0).applyQuaternion(q));
  const sp = mom.joints.spine.matrixWorld;
  const pos = local.applyMatrix4(sp);
  const quat = new THREE.Quaternion().setFromRotationMatrix(_m.extractRotation(sp)).multiply(q);
  return { pos, quat };
}
const CARRY = { legL: [-80, 0, 6], kneeL: 70, footL: 20, legR: [-86, 0, 8], kneeR: 64, footR: 16, spine: [6, 0, 0], head: [20, 0, 0] };

export const SCENE3 = {
  17: {
    key: 2.2,
    pose(w, lt, t) {
      w.house.light('kitchen', 'hall');
      const rise = ramp(lt, 0.1, 2.0, E.inOut);
      person(w, w.cast.ghostKip, t, {
        at: [-4.7, 0.5 + (UP + 0.42 - 0.5) * rise, -1.35], yaw: 90 - 40 * ramp(lt, 2.0, 2.8), ghost: true,
        pose: floatWith(w, { armL: [-12, 0, 40 - 20 * rise], elbowL: [-20, 0, 0], armR: [-10, 0, 44 - 22 * rise], elbowR: [-16, 0, 0], head: [-14 * (1 - rise), 0, 0] }),
        face: faceTrack(w, lt, [[0, 'determined'], [2.1, 'determined'], [2.6, { browUp: 0.3, lookX: -0.4 }]]),
      });
      // the camera rises with him through the slab (a horizontal wipe) and comes up in the hall
      const cy = track(lt, [[0, 1.25], [2.1, UP + 1.35, E.cam]]);
      w.cam([-3.5, cy, -1.6], [-4.7, cy + 0.15 + 0.4 * (1 - rise), -1.35], L.wide, 0.5 * Math.sin(lt));
    },
  },
  18: {
    key: 3.2,
    pose(w, lt, t) {
      w.house.light('closet', 'hall');
      // his head pushes through the closed door, then he floats in and scans the clothes and shoeboxes; his eyes land on the photo
      const x = track(lt, [[0, -7.15], [0.8, -7.5], [1.5, -8.3]]);
      const scan = track(lt, [[1.5, 0], [2.2, 35], [2.9, -10], [3.5, 30], [4.0, 70]]);
      person(w, w.cast.ghostKip, t, {
        at: [x, UP + 0.32, track(lt, [[0, -1.6], [1.5, -1.5]])], yaw: -90 + 30 * ramp(lt, 1.5, 2.2) - 30 * ramp(lt, 3.6, 4.2), ghost: true, who: 'kip',
        pose: floatWith(w, { spine: [lt < 0.8 ? 14 : 4, 0, 0], head: [6, scan, 0], armL: [-10, 0, 20], elbowL: [-40, 0, 0], armR: [-10, 0, 22], elbowR: [-36, 0, 0] }),
        face: faceTrack(w, lt, [[0, { browUp: 0.3 }], [1.6, { lid: 0.15, browUp: -0.1, mouthCurve: -0.1 }], [3.7, { lid: 0.15, browUp: -0.1, lookX: 0.5 }], [4.2, { eyeScale: 1.15, browUp: 0.8, lookX: 0.6 }]]),
      });
      w.frameOn([-8.0, UP + 1.45, -1.25], 1.6, { az: -100, el: 0, fov: L.wide, roll: 0.4 * Math.sin(lt * 0.7) });
    },
  },
  19: {
    key: 2.6,
    pose(w, lt) {
      w.house.light('closet');
      const p = w.house.spots.dadPhoto;
      w.cam([p.x + track(lt, [[0, 1.12], [4.0, 0.98, E.cam]]), p.y, p.z + 0.04], [p.x, p.y, p.z], 33);
    },
  },
  20: {
    key: 1.4,
    pose(w, lt, t) {
      w.house.light('closet');
      const at = [-9.25, UP + 0.32, 0.2];
      person(w, w.cast.ghostKip, t, {
        at, yaw: -90, ghost: true, who: 'kip',
        pose: floatWith(w, { spine: [-4, 0, 0], head: [-2, 0, 3 * Math.sin(lt * 14) * ramp(lt, 2.4, 2.6) * (1 - ramp(lt, 2.8, 3.0))] }),
        face: faceTrack(w, lt, [[0, { eyeScale: 1.25, browUp: 1, mouthOpen: 0.1 }], [0.4, { eyeScale: 1.2, browUp: 0.7, browTilt: -0.8, mouthCurve: -0.5, mouthWide: 0.8, lookY: 0.05 }]]),
      });
      w.frameOn([at[0], at[1] + 1.4, at[2]], 0.78, { az: -90, el: 2, fov: L.wide });
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
    key: 3.0,
    pose(w, lt, t) {
      w.house.light('living');
      w.house.props.tv.show('spectating', { left: 221 });
      bodyOnCouch(w);
      const path = walkPath(lt, 0.0, 2.7, [[-3.4, 1.1], [-2.6, 1.0], [-1.2, 0.1], [-0.4, -0.7]]);
      const yaw = lt < 2.7 ? path.yaw : track(lt, [[2.7, path.yaw], [3.2, 150]]);
      const walking = walk(walkPhase(path.dist, momLeg), { arm: 12 });
      const stop = ramp(lt, 2.4, 2.8);
      person(w, w.cast.mom, t, {
        at: path.at, yaw,
        pose: w.Mascot.mixPose(poseWith(w, 'idle', walking), { head: [8, 0, 0] }, stop),
        face: faceTrack(w, lt, [[0, 'neutral'], [2.7, { lid: 0.1 }], [2.95, { lid: 0.3, lidSlant: -0.3 }], [3.5, { lid: 0.32, lidSlant: -0.4, mouthCurve: 0.85, mouthSkew: 0.3, browUp: 0.35, browAsym: 0.4 }]]),
      });
      catOnChair(w, t, [path.at[0], 1.4, path.at[2]], { yaw: 25, face: 'sleepy' });
      w.cam([1.7, 1.45, 2.05], [-0.9, 1.0, -0.6], L.wide);
    },
  },
  23: {
    key: 1.6,
    pose(w, lt, t) {
      w.house.light('living');
      bodyOnCouch(w);
      const mom = w.cast.mom, at = [-0.15, 0, -0.85];
      const mk = w.props.marker, cap = mk.userData.cap;
      person(w, mom, t, {
        at, yaw: 150,
        pose: (r, local) => {
          const base = { spine: [10, 0, 0], head: [16, 0, 0] };
          const R = local(-0.08, 0.98, 0.32), Lh = local(0.06, 1.02, 0.34).add(local(0.0, 0.0, 0).sub(local(0, 0, 0)));
          const pull = ramp(lt, 1.1, 1.5, E.out);
          Lh.add(local(0.12 * pull, 0.04 * pull, 0).sub(local(0, 0, 0)));
          const q = r.solve(base, { R, L: Lh });
          // the marker in her right hand, tip up; the cap comes off with her left
          mk.visible = true;
          mk.position.copy(R).add(V(0, 0.03, 0));
          mk.rotation.set(0.3, 0, -0.5);
          mk.updateMatrixWorld(true);
          if (pull > 0) {
            w.scene.attach(cap);
            cap.position.copy(Lh).add(V(0, 0.02, 0));
            cap.rotation.set(0, 0, -0.5 + 0.8 * pull);
          }
          return q;
        },
        face: { lid: 0.3, lidSlant: -0.4, mouthCurve: 0.8, mouthSkew: 0.3, browUp: 0.3, browAsym: 0.4, lookY: -0.6 },
      });
      w.frameOn([at[0] + 0.02, 1.02, at[2] + 0.18], 0.6, { az: track(lt, [[0, 110], [2.5, 104]]), el: 6 });
    },
  },
  24: {
    key: 1.9,
    pose(w, lt, t) {
      w.house.light('living');
      // three strokes: the curly mustache drawn on from his right to his left
      const m = track(lt, [[1.0, 0], [1.35, 0.33], [1.5, 0.33], [1.85, 0.66], [2.0, 0.66], [2.35, 1]]);
      const body = bodyOnCouch(w, { mustache: m });
      const mom = w.cast.mom;
      const tip = onHead(body, -28 + 56 * m, -15, 1.0);
      const into = lt < 1.0 ? ramp(lt, 0.3, 1.0) : lt > 2.5 ? 1 - ramp(lt, 2.5, 3.2) : 1;
      const tipAt = tip.clone().add(V(0.25, -0.2, 0.25).multiplyScalar(1 - into));
      person(w, mom, t, {
        at: [0.62, 0, -1.05], yaw: -125,
        pose: (r) => {
          const mk = w.props.marker;
          mk.visible = true;
          mk.userData.cap.visible = false;
          const dir = V(0.35, -0.2, 0.6).normalize();
          mk.position.copy(tipAt).addScaledVector(dir, 0.088);
          mk.quaternion.setFromUnitVectors(V(0, 1, 0), dir.clone().negate());
          const hand = tipAt.clone().addScaledVector(dir, 0.13);
          return r.solve({ spine: [22, 0, 0], head: [20, 0, 0] }, { R: hand });
        },
        face: { lid: 0.35, lidSlant: -0.4, mouthCurve: 0.9, mouthSkew: 0.4, lookY: -0.5 },
      });
      const head = headOf(body);
      w.frameOn([head.x + 0.04, head.y - 0.06, head.z], 0.82, { az: -10, el: 2, fov: L.close });
    },
  },
  25: {
    key: 1.2,
    pose(w, lt, t) {
      w.house.light('living', 'hall');
      const mom = w.cast.mom, kip = w.cast.kip;
      const st = w.house.props.stairs;
      // pick up (Hup!), turn, walk to the foot of the stairs, climb out of frame
      const lift = ramp(lt, 0.6, 1.4, E.inOut);
      const path = walkPath(lt, 1.6, 4.6, [[-0.1, -0.9], [0.5, -0.2], [1.6, 1.3], [2.5, 2.35]]);
      let at = path.at, yaw = path.yaw, dist = path.dist;
      if (lt < 1.6) { at = [-0.1, 0, -0.9]; yaw = track(lt, [[0, 180], [1.4, 180], [1.9, path.yaw]]); }
      let climbY = 0;
      if (lt > 4.6) {
        const c = ramp(lt, 4.6, 6.05, E.linear);
        const z = 2.35 - c * 1.9;
        at = [2.5, 0, z];
        yaw = 180;
        climbY = Math.max(0, ((1.95 - z) / st.tread) * st.rise);
        dist = path.dist + c * 1.9;
      }
      const bend = lt < 1.6 ? Math.sin(Math.PI * ramp(lt, 0.4, 1.4)) : 0;
      const walking = lt > 1.6 ? walk(walkPhase(dist, momLeg, lt > 4.6 ? 26 : 21), { arm: 10, knee: lt > 4.6 ? 60 : 36, lean: 9 }) : {};
      person(w, mom, t, {
        at: [at[0], climbY, at[2]], yaw, who: 'mom',
        pose: (r, local) => {
          const base = poseWith(w, 'idle', Object.assign({}, walking, {
            spine: [8 + 34 * bend, (walking.spine || [0, 0])[1], 0], hipsY: (walking.hipsY || 0) - 0.16 * bend,
            legL: walking.legL || [-14 * bend, 0, 4], kneeL: walking.kneeL != null ? walking.kneeL : 30 * bend,
            legR: walking.legR || [-14 * bend, 0, 4], kneeR: walking.kneeR != null ? walking.kneeR : 30 * bend,
          }));
          r.setPose(base);
          // the body: seated on the couch, then lifted onto her shoulder
          const seat = w.house.spots.couchSeats[1];
          const carry = carryTransform(w, r);
          const fromPos = V(seat.x, w.house.props.couch.seatTop - 0.015 - (kip.dims.hipY - kip.dims.pelvisDrop), seat.z);
          kip.root.visible = true;
          kip.root.position.copy(fromPos.lerp(carry.pos, lift));
          kip.root.quaternion.copy(new THREE.Quaternion().slerp(carry.quat, lift));
          kip.root.updateMatrixWorld(true);
          const pose = w.Mascot.mixPose('game', CARRY, lift);
          kip.setPose(pose);
          if (lift > 0.5) {
            // arms dangle toward the floor
            kip.root.updateMatrixWorld(true);
            const hang = (side) => kip.joints['arm' + side].getWorldPosition(V(0, 0, 0)).add(V(0, -0.42, 0.02));
            kip.setPose(kip.solve(pose, { L: hang('L'), R: hang('R') }));
          }
          kip.blink = false;
          kip.setExpression({ mouthOpen: 0.1, mouthRound: 0.3, mustache: 1 });
          // her right arm over his thighs, her left hand reaching for him, then swinging
          kip.root.updateMatrixWorld(true);
          const thighs = kip.joints.kneeR.getWorldPosition(V(0, 0, 0)).lerp(kip.joints.legR.getWorldPosition(V(0, 0, 0)), 0.45).add(V(0, 0.07, 0));
          const hands = lift > 0.05 ? { R: thighs } : {};
          if (lt < 1.4) hands.L = kip.joints.spine.getWorldPosition(V(0, 0, 0)).add(V(0.1, 0.1, 0));
          return r.solve(base, hands);
        },
        face: faceTrack(w, lt, [[0, { lid: 0.3, mouthCurve: 0.6 }], [0.9, { lid: 0.45, mouthCurve: 0.2, browUp: -0.2, mouthOpen: 0.3 }], [1.5, { lid: 0.2, mouthCurve: 0.55, mouthSkew: 0.3 }]]),
      });
      w.props.controller.visible = true;
      const seat = w.house.spots.couchSeats[1];
      w.props.controller.position.set(seat.x, 0.43, seat.z + 0.05);
      w.props.controller.rotation.set(0, 0.4, 0);
      catOnChair(w, t, [at[0], 1.4, at[2]], { yaw: 25, face: 'sleepy' });
      w.cam([-2.55, 1.6, 2.1], [0.75, 1.15, -0.25], L.wide);
    },
  },
  26: {
    key: 1.6,
    pose(w, lt, t) {
      w.house.light('garage');
      const y = track(lt, [[0, 3.1], [1.3, 0.38, E.out]]);
      person(w, w.cast.ghostKip, t, {
        at: [-9.0, y, -0.95], yaw: track(lt, [[0, 160], [2.2, 160], [2.9, 120]]), ghost: true,
        pose: floatWith(w, { armL: [-8, 0, 40 - 20 * ramp(lt, 0.8, 1.5)], elbowL: [-20, 0, 0], armR: [-6, 0, 44 - 22 * ramp(lt, 0.8, 1.5)], elbowR: [-16, 0, 0] }),
        face: faceTrack(w, lt, [[0, { browUp: 0.3 }], [1.6, { lid: 0.15, lookX: 0.3 }], [2.5, { eyeScale: 1.15, browUp: 0.7, lookX: 0.5, mouthCurve: 0.5 }]]),
      });
      w.cam([-8.0, 0.55, 0.9], [-9.1, 1.75, -1.3], L.wide, 0.4 * Math.sin(lt));
    },
  },
  27: {
    key: 1.6,
    pose(w, lt, t) {
      w.house.light('garage');
      const p = w.house.spots.garagePresent;
      const lean = ramp(lt, 0, 1.0);
      person(w, w.cast.ghostKip, t, {
        at: [p.x + 0.1, 0.08, p.z + 0.85], yaw: 185, ghost: true, who: 'kip',
        pose: floatWith(w, { spine: [16 * lean, 0, 0], head: [10 * lean, 0, 0], armL: [-20, 0, 28], elbowL: [-60, 0, 0], armR: [-24, 0, 26], elbowR: [-64, 0, 0] }),
        face: faceTrack(w, lt, [[0, { eyeScale: 1.1, browUp: 0.6 }], [1.1, { happy: 0.3, mouthCurve: 1, mouthSkew: 0.4, lid: 0.1, browUp: 0.4 }], [2.4, 'happy']]),
      });
      w.frameOn([p.x + 0.08, 0.95, p.z + 0.3], 1.25, { az: 5, el: 4 });
    },
  },
  28: {
    key: 1.3,
    pose(w, lt, t) {
      w.house.light('garage');
      const p = w.house.spots.garagePresent;
      // he grabs for it and his hands go straight through the sides
      const grab = track(lt, [[0.2, 0], [0.9, 1], [1.2, 1.25], [2.6, 1.25], [3.2, 0.3]]);
      person(w, w.cast.ghostKip, t, {
        at: [p.x + 0.08, 0.04, p.z + 0.78], yaw: 185, ghost: true, who: 'kip',
        pose: (r, local) => r.solve(floatWith(w, { spine: [30, 0, 0], head: [14, 0, 0] }), {
          L: V(p.x + 0.47 - 0.18 * grab, 0.3, p.z + 0.05), R: V(p.x - 0.33 + 0.18 * grab, 0.3, p.z + 0.02),
        }),
        face: faceTrack(w, lt, [[0, { happy: 0.3, mouthCurve: 0.9 }], [1.0, { eyeScale: 1.2, browUp: 0.9, mouthOpen: 0.3, mouthRound: 0.5 }], [1.6, { lid: 0.3, browUp: -0.4, browTilt: 0.6, mouthCurve: -0.5 }]]),
      });
      w.frameOn([p.x + 0.05, 0.42, p.z + 0.1], 0.82, { az: 8, el: 18 });
    },
  },
  29: {
    key: 2.8,
    pose(w, lt, t) {
      // inside the box: dim cardboard, one sliver of light, the rolled socks and the tag; his face pushes in
      w.house.light('garage');
      const gp = w.house.props.garagePresent;
      gp.inside.visible = true;
      gp.socks.visible = true;
      gp.sliver.visible = true;
      gp.group.updateMatrixWorld(true);
      const inBox = (x, y, z) => gp.group.localToWorld(V(x, y, z));
      const push = ramp(lt, 0.2, 1.2, E.out);
      const face = inBox(0.0, 0.26, 0.5 - 0.1 * push);
      person(w, w.cast.ghostKip, t, {
        at: [face.x, face.y - 1.36, face.z + 0.36 * Math.cos(0) + 0.0], yaw: 185, ghost: true, who: 'kip',
        pose: floatWith(w, { spine: [0, 0, 0], head: [0, 0, 0] }),
        face: faceTrack(w, lt, [[0, { eyeScale: 1.1, browUp: 0.6 }], [1.4, { lookY: -0.6, browUp: 0.3 }], [2.6, { lid: 0.42, browUp: -0.2, mouthCurve: -0.2, lookY: -0.5 }]]),
      });
      const cam = inBox(0.02, 0.2, -0.24), look = inBox(0.0, 0.16, 0.2);
      w.cam([cam.x, cam.y, cam.z], [look.x, look.y, look.z], 46);
    },
  },
  30: {
    key: 1.0,
    pose(w, lt) {
      w.house.light('garage');
      const p = w.house.spots.garagePresent;
      w.cam([p.x + 0.4, 1.7, p.z + 1.6], [p.x, 0.3, p.z], L.wide, 0.6 * Math.sin(lt * 0.8));
    },
  },
  31: {
    key: 2.0,
    pose(w, lt, t) {
      w.house.light('attic');
      const rise = ramp(lt, 0.0, 1.2, E.out);
      person(w, w.cast.ghostKip, t, {
        at: [0.2, ATTIC - 1.2 + 1.6 * rise, 0.0], yaw: 70, ghost: true, who: 'kip',
        pose: floatWith(w, { spine: [8 * ramp(lt, 1.0, 1.6), 0, 0], head: [6, 0, 0], armL: [-14, 0, 22], elbowL: [-50, 0, 0], armR: [-12, 0, 24], elbowR: [-44, 0, 0] }),
        face: faceTrack(w, lt, [[0, { browUp: 0.4 }], [1.1, { lid: 0.2, lidSlant: 0.4, mouthCurve: 0.4, mouthSkew: 0.4, lookX: 0.5 }]]),
        talkGain: 0.6,
      });
      w.cam([-3.2, ATTIC + 1.3, 1.6], [0.6, ATTIC + 0.75, -0.1], L.wide);
    },
  },
  32: {
    key: 2.0,
    pose(w, lt, t) {
      w.house.light('attic');
      const tr = w.house.spots.trunk;
      // bent over the trunk with his head through the lid; the rest of him sticks out
      person(w, w.cast.ghostKip, t, {
        at: [tr.x - 0.75, ATTIC + 0.22, tr.z + 0.3], yaw: 108, ghost: true, who: 'kip', talkGain: 0.4,
        pose: floatWith(w, { spine: [80, 0, 0], head: [30, 0, 0], legL: [-24, 0, 2], kneeL: 34, legR: [-18, 0, 2], kneeR: 28, armL: [-70, 0, 20], elbowL: [-30, 0, 0], armR: [-66, 0, 22], elbowR: [-34, 0, 0] }),
        face: 'neutral',
      });
      w.cam([tr.x - 2.3, ATTIC + 1.2, tr.z + 1.9], [tr.x - 0.35, ATTIC + 0.55, tr.z + 0.1], L.wide);
    },
  },
  33: {
    key: 1.0,
    pose(w, lt, t) {
      w.house.light('attic');
      const tr = w.house.spots.trunk;
      const kat = [tr.x - 0.75, ATTIC + 0.22, tr.z + 0.3];
      const kip = person(w, w.cast.ghostKip, t, {
        at: kat, yaw: 108, ghost: true, who: 'kip', talkGain: 0.4,
        pose: floatWith(w, { spine: [80, 0, 0], head: [30, 0, 0], legL: [-24, 0, 2], kneeL: 34, legR: [-18, 0, 2], kneeR: 28, armL: [-70, 0, 20], elbowL: [-30, 0, 0], armR: [-66, 0, 22], elbowR: [-34, 0, 0] }),
        face: 'neutral',
        live: lt < 0.95,
      });
      // a see-through hand comes in and taps his shoulder twice
      kip.root.updateMatrixWorld(true);
      const shoulder = kip.joints.armR.getWorldPosition(V(0, 0, 0)).add(V(0, 0.07, 0));
      const tap = lt < 0.5 ? 0 : Math.max(0, Math.sin(Math.PI * ((lt - 0.5) / 0.22))) * (lt < 0.94 ? 1 : 0);
      person(w, w.cast.ghostMom, t, {
        at: [kat[0] + 0.05, ATTIC + 0.2, kat[2] + 0.75], yaw: 160, ghost: true,
        pose: (r) => r.solve({ spine: [6, 0, 0] }, { L: shoulder.clone().add(V(0, 0.03 + 0.03 * tap, 0.03)).lerp(shoulder.clone().add(V(0.15, -0.25, 0.3)), 1 - ramp(lt, 0.0, 0.45)) }),
        face: { lid: 0.2, mouthCurve: 0.3 },
      });
      w.frameOn([shoulder.x, shoulder.y + 0.02, shoulder.z], 0.7, { az: 150, el: 12 });
    },
  },
};
