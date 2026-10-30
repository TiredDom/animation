// Staging helpers the scenes share: putting the cast in their places with a pose, a face, a voice and the
// spec's ghost hover, and the recurring setups (Kip's frozen body, Mom at the counter, the cat on her chair).
import * as THREE from 'three';
import { track, E, talk, ramp } from './motion.js';

export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const L = { wide: 38, medium: 27, close: 16 };
const TAU = Math.PI * 2;

// The ghost hover: ±2 cm on a 2.4 s cycle.
export const hover = (t, amp = 0.02) => amp * Math.sin((t / 2.4) * TAU);

// Put a person rig (Kip, Mom, or a ghost of either) in the frame.
//   at / yaw     where and which way (degrees from facing +z)
//   pose         a pose name or object, or a function (rig, local) → pose, called after placing, for IK;
//                local(x, y, z) turns a point in the rig's frame (x its left, y up, z its front) into world space
//   face         an expression name or face object
//   who          'kip' or 'mom': the mouth follows that voice's lines
//   live         false for a frozen body (no breathing, no blinks)
//   ghost        true adds the hover
export function person(w, rig, t, { at, yaw = 0, pose = 'idle', face = 'neutral', who = null, live = true, ghost = false, talkGain = 1 }) {
  const y = at[1] + (ghost ? hover(t) : 0);
  w.put(rig, at[0], y, at[2], yaw);
  rig.root.updateMatrixWorld(true);
  const local = (a, b, c) => rig.root.localToWorld(V(a, b, c));
  rig.setPose(typeof pose === 'function' ? pose(rig, local) : pose);
  let f = w.Mascot.resolveFace(face);
  if (who) f = talk(f, who, t, { gain: talkGain });
  rig.blink = live;
  rig.setExpression(f);
  if (live) rig.update(t);
  return rig;
}

// A face blended from a track of expressions: [[t, face], ...] (names or objects), eased.
export const faceTrack = (w, t, keys) => track(t, keys, w.Mascot.mixFace);
// A pose blended from a track: [[t, pose], ...].
export const poseTrack = (w, t, keys) => track(t, keys, w.Mascot.mixPose);
export const catPoseTrack = (w, t, keys) => track(t, keys, w.Mascot.mixCatPose);
export const catFaceTrack = (w, t, keys) => track(t, keys, w.Mascot.mixCatFace);

// Merge pose values onto a pose (resolved), e.g. a walk cycle onto a carry pose.
export function poseWith(w, base, extra) {
  const p = w.Mascot.resolvePose(base);
  for (const k in extra) p[k] = extra[k];
  return p;
}

// The skull centre of a rig in world space (faces and hands aim at it).
export function headOf(rig) {
  rig.root.updateMatrixWorld(true);
  return rig.joints.head.children[0].getWorldPosition(V(0, 0, 0));
}
// A point on a rig's head: azimuth (0 = the face, +90 = its left), elevation, distance in head radii.
export function onHead(rig, az, el, dist = 1, R = 0.36) {
  rig.root.updateMatrixWorld(true);
  const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180;
  return rig.joints.head.children[0].localToWorld(V(Math.sin(a) * Math.cos(e) * R * dist, Math.sin(e) * R * dist, Math.cos(a) * Math.cos(e) * R * dist));
}

// ---------- Kip's body ----------

// Kip's body on the middle couch seat, frozen mid-game: the controller in both hands, eyes on the TV. A frozen
// body neither breathes nor blinks. `mustache` (0..1) is Mom's marker.
export function bodyOnCouch(w, { mustache = 0, controller = true, face = null } = {}) {
  const { kip } = w.cast, seat = w.house.spots.couchSeats[1];
  w.put(kip, seat.x, 0, seat.z, 0);
  kip.sitOn(w.house.props.couch.seatTop);
  const c = w.props.controller;
  c.position.set(seat.x, 0.69, seat.z + 0.37);
  c.rotation.set(-0.55, 0, 0);
  c.updateMatrixWorld(true);
  c.visible = controller;
  kip.setPose(kip.solve('game', { L: c.localToWorld(c.userData.gripL.clone()), R: c.localToWorld(c.userData.gripR.clone()) }));
  kip.blink = false;
  kip.setExpression(Object.assign({ mouthOpen: 0.1, mouthCurve: 0.05, mouthRound: 0.3, lookY: 0.08, blush: 0.2 }, face || {}, { mustache }));
  return kip;
}
// The pose and place of the frozen body, for the ghost to lift out of.
export function bodyPose(w) {
  const k = w.cast.kip;
  return { at: [k.root.position.x, k.root.position.y, k.root.position.z], pose: k.pose };
}

// ---------- Mom ----------

// Mom at the kitchen counter on the phone, her back to the room: the phone pressed to the right side of her head,
// the mug in her left hand (sip 0..1 lifts it to her mouth). `turn` turns her toward the room (degrees).
export function momAtCounter(w, t, { rig = w.cast.mom, sip = 0, turn = 0, face = 'neutral', who = 'mom', live = true, at = null, phone = true } = {}) {
  const s = w.house.spots.counterMom;
  const pos = at || [s.x, 0, s.z];
  const yaw = 180 + turn;
  return person(w, rig, t, {
    at: pos, yaw, face, who, live,
    pose: (r, local) => {
      const base = w.Mascot.resolvePose({ spine: [3, 0, 0], head: [6 - 14 * sip, 8 - 6 * sip, -10 + 6 * sip] });
      r.setPose(base);
      // the phone against the right cheek, the hand under it
      const cheek = onHead(r, -72, -38, 1.02, 0.35);
      const R = cheek.clone().add(local(-0.06, 0, 0).sub(local(0, 0, 0)).multiplyScalar(1)).add(V(0, -0.06, 0));
      // the mug in front of her chest, lifted to her mouth for a sip
      const rest = local(0.12, 1.16, 0.3), lips = onHead(r, 8, -48, 1.08, 0.35).add(V(0, -0.06, 0));
      const Lh = rest.clone().lerp(lips, sip);
      const q = r.solve(base, phone ? { R, L: Lh } : { L: Lh });
      w.props.phone.visible = phone;
      if (phone) {
        w.props.phone.position.copy(cheek).add(V(0, -0.02, 0));
        w.props.phone.rotation.set(0, (yaw - 90) * Math.PI / 180, 0.2);
      }
      const mug = w.props.mug;
      mug.visible = true;
      mug.rotation.set(-0.5 * sip, (yaw + 90) * Math.PI / 180, 0);
      mug.position.copy(Lh).add(local(-0.09, -0.05, 0).sub(local(0, 0, 0)));
      mug.userData.steam(t, sip < 0.5);
      return q;
    },
  });
}

// Mom's real body after she turns ghost (from the tap in shot 33 on): frozen at the counter mid-sip, the mug at her
// lips, no breath, no blink, no phone. Every later shot that shows the kitchen counter shows her like this.
export function momFrozen(w, t) {
  return momAtCounter(w, t, { sip: 1, live: false, who: null, phone: false, face: { lid: 0.18, mouthCurve: 0.25, mouthRound: 0.3, mouthOpen: 0.08, lookY: -0.2 } });
}

// ---------- feet on the ground ----------

// Leg angles that put a foot's sole on a world point, the sole kept level: two-bone IK in the leg's swing plane
// (the hip pivot, the body's forward and up). Call after the body's pose is set, so the hip pivots are where they
// will be drawn. Returns { leg, knee, foot } pose values for that side.
const _q = new THREE.Quaternion();
export function legIK(rig, side, sole) {
  rig.root.updateMatrixWorld(true);
  const hip = rig.joints['leg' + side].getWorldPosition(V(0, 0, 0));
  const fwd = V(0, 0, 1).applyQuaternion(rig.root.getWorldQuaternion(_q));
  fwd.y = 0;
  fwd.normalize();
  const v = sole.clone().add(V(0, rig.dims.ankle, 0)).sub(hip);
  const f = v.dot(fwd), d = -v.y;
  const a = rig.dims.thigh, b = rig.dims.shin;
  const r = Math.min(a + b - 1e-3, Math.max(Math.abs(a - b) + 1e-3, Math.hypot(f, d)));
  const cl = (x) => Math.max(-1, Math.min(1, x));
  const al = Math.atan2(f, d) + Math.acos(cl((a * a + r * r - b * b) / (2 * a * r)));
  const kn = Math.PI - Math.acos(cl((a * a + b * b - r * r) / (2 * a * b)));
  const deg = 180 / Math.PI;
  return { leg: [-al * deg, 0, 1.5], knee: kn * deg, foot: (al - kn) * deg };
}

// Climbing a flight tread by tread: feet alternate, the first step lifts a foot from the floor to the first tread and
// every later one lifts a foot two treads, past the planted one; the pelvis rises one tread a step. `k` is how many
// steps are done (a float: 2.5 is halfway through the third). Returns the world sole points of both feet and the
// pelvis (hip-pivot) point; put the body there and solve the legs with legIK. The flight climbs toward -z.
export function stairGait(st, k, { x = st.x, startZ = st.zFront + 0.22, h = 0.6, hipX = 0.1, first = 'R' } = {}) {
  const tread = (i) => (i < 0 ? V(0, 0, startZ) : V(0, st.stepTop(i), st.zAt(i) + 0.03));
  const other = first === 'R' ? 'L' : 'R';
  const feet = {};
  for (const side of [first, other]) {
    const par = side === first ? 0 : 1;              // its steps are par, par + 2, ...
    const sx = x + (side === 'L' ? -1 : 1) * hipX;    // climbing toward -z: the left foot is on -x
    const done = Math.floor((k - par) / 2) * 2 + par; // its last step started at or before k
    let p;
    if (k < par) p = tread(-1);
    else {
      const u = Math.min(1, k - done);
      const from = tread(done - 2), to = tread(done);
      const e = E.inOut(u);
      p = from.clone().lerp(to, e);
      p.y += 0.12 * Math.sin(Math.PI * u) + 0.06 * Math.sin(Math.PI * Math.min(1, u * 1.4));
    }
    p.x = sx;
    feet[side] = p;
  }
  // the pelvis: between the two planted treads, one tread higher a step
  const at = (n) => {
    if (n <= 0) return V(x, h, startZ);
    const a = tread(n - 1), b = tread(n - 2);
    return V(x, Math.min(a.y, b.y) + h, (a.z + b.z) / 2);
  };
  const n0 = Math.floor(k), u = k - n0, e = 0.5 * u + 0.5 * E.inOut(u);
  const pelvis = at(n0).lerp(at(n0 + 1), e);
  return { feet, pelvis };
}

// A walk that is already under way at lt = a and eases to a stop at b: the share of the path covered (0..1),
// moving at constant speed, then slowing over the last `decel` seconds (sine out). The speed is path / (time).
export function cruise(lt, a, b, decel = 0.6) {
  const T = b - a, run = T - decel, total = run + (2 * decel) / Math.PI;
  const s = Math.max(0, Math.min(T, lt - a));
  if (s <= run) return s / total;
  return (run + (2 * decel / Math.PI) * Math.sin((Math.PI / 2) * ((s - run) / decel))) / total;
}

// ---------- the cat ----------

// The cat placed with a pose and a face; her head turns toward `look` (a world point) within a neck's range.
export function catAt(w, rig, t, { at, yaw = 0, pose = 'sit', face = 'calm', look = null, head = [0, 0, 0], live = true }) {
  w.put(rig, at[0], at[1], at[2], yaw);
  const p = typeof pose === 'string' ? w.Mascot.resolveCatPose ? w.Mascot.resolveCatPose(pose) : Object.assign({}, w.Mascot.CAT_POSES[pose]) : Object.assign({}, pose);
  let turn = 0;
  if (look) {
    turn = w.yawTo(at, look) - yaw;
    turn = ((turn + 540) % 360) - 180;
    turn = Math.max(-70, Math.min(70, turn));
  }
  const h = p.head || [0, 0, 0];
  p.head = [h[0] + head[0], h[1] + turn + head[1], h[2] + head[2]];
  rig.setPose(p);
  rig.setExpression(face);
  rig.blink = live;
  if (live) rig.update(t);
  return rig;
}

// The cat on her armchair (scene 1).
export function catOnChair(w, t, look, { pose = 'sit', face = 'calm', head = [0, 0, 0], yaw = null } = {}) {
  const s = w.house.spots.armchairSeat;
  const toLook = w.yawTo([s.x, 0, s.z], look);
  const bodyYaw = yaw == null ? toLook * 0.55 + 32 * 0.45 : yaw;
  return catAt(w, w.cast.cat, t, { at: [s.x, w.house.props.armchair.seatTop - 0.01, s.z], yaw: bodyYaw, pose, face, look, head });
}

export { track, E, ramp };
