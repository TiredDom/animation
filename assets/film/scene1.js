// Scene 1: Spectate (living room, night). Shot numbers are SPEC.md's; their times come from the timeline.
// pose(w, lt, t) poses the world lt seconds into the shot (film time t). key: the board still, seconds into the shot.
import { V, L, person, bodyOnCouch, bodyPose, catOnChair, momAtCounter, faceTrack, poseTrack, track, E, ramp } from './stage.js';

const tvGlow = (w, red) => w.house.props.tv.glow.color.set(red ? '#FF8E80' : '#A8C4FF');

// the ghost's float pose with the hands brought up in front of him (IK), turning over as he looks at them
function handsUp(w, g, local, lt, base) {
  const a = Math.sin(lt * 2.2), b = Math.sin(lt * 2.2 + 1.3);
  return g.solve(base, {
    L: local(0.14 + 0.03 * a, 1.0 + 0.03 * b, 0.3 + 0.02 * a),
    R: local(-0.16 - 0.02 * b, 0.98 + 0.03 * a, 0.28 + 0.02 * b),
  });
}
const floatWith = (w, extra) => Object.assign({}, w.Mascot.POSES.float, extra);

export const SCENE1 = {
  1: {
    key: 0.9,
    pose(w, lt) {
      w.house.props.tv.show('died', { prompt: lt >= 0.6, select: lt >= 1.0 });
      tvGlow(w, true);
      bodyOnCouch(w);
      w.cam([0.25, 1.0, 0.2], [0.25, 0.92, 2.03], track(lt, [[0, 26], [1.2, 24.8, E.cam]]));
    },
  },
  2: {
    key: 2.0,
    pose(w, lt, t) {
      w.house.props.tv.show('spectating', { left: 300 });
      tvGlow(w, false);
      bodyOnCouch(w);
      const b = bodyPose(w);
      // the lift: out of the body, up and forward to his right, with one quick comic stretch on the way out
      const off = track(lt, [[0.25, [0, 0, 0]], [2.6, [0.6, 0.5, 0.4], E.out]]);
      const at = [b.at[0] + off[0], b.at[1] + off[1], b.at[2] + off[2]];
      const stretch = lt < 0.45 ? 1 + 0.12 * ramp(lt, 0.25, 0.45, E.out) : 1 + 0.12 * (1 - ramp(lt, 0.45, 0.78, E.inOut));
      const g = person(w, w.cast.ghostKip, t, {
        at, yaw: track(lt, [[0.25, 0], [2.6, -14]]),
        pose: (r, local) => {
          const lift = poseTrack(w, lt, [[0.35, b.pose], [1.5, 'float']]);
          if (lt < 2.3) return lift;
          const up = handsUp(w, r, local, lt, floatWith(w, { head: [18, 0, 0], spine: [5, 0, 0] }));
          return w.Mascot.mixPose(lift, up, ramp(lt, 2.3, 3.2));
        },
        face: faceTrack(w, lt, [
          [0.3, { mouthOpen: 0.1, mouthRound: 0.3, lookY: 0.08 }], [0.75, { eyeOpen: 0.3, mouthOpen: 0.05 }],
          [1.0, 'surprised'], [2.3, 'surprised'], [2.9, { eyeScale: 1.1, browUp: 0.75, lookY: -0.6, mouthOpen: 0.15, mouthRound: 0.5 }],
        ]),
      });
      g.root.position.y += lt > 1.0 ? 0.02 * Math.sin(((t - 1) / 2.4) * Math.PI * 2) * ramp(lt, 1.0, 1.6) : 0;
      g.root.scale.set(1 / Math.sqrt(stretch), stretch, 1 / Math.sqrt(stretch));
      w.composer.ghosts.opacity = 0.55 * ramp(lt, 0.25, 0.55, E.out);
      catOnChair(w, t, lt < 1.1 ? [0.25, 1.0, 1.5] : [at[0], at[1] + 1.4, at[2]], { yaw: 20, face: lt < 1.3 ? 'calm' : { eyeScale: 1.15 } });
      w.frameOn([-0.42, 1.24, -1.55], track(lt, [[0, 2.36], [3.3, 2.28, E.cam]]), { el: 2, fov: L.wide });
    },
  },
  3: {
    key: 1.3,
    pose(w, lt, t) {
      w.house.props.tv.show('spectating', { left: 300 });
      bodyOnCouch(w);
      const at = [track(lt, [[0, 0.9], [3, 1.08]]), 0.58, track(lt, [[0, -1.18], [3, -0.98]])];
      catOnChair(w, t, [at[0], 1.8, at[2]], { yaw: 20, face: { eyeScale: 1.15 } });
      person(w, w.cast.ghostKip, t, {
        at, yaw: -25, ghost: true, who: 'kip',
        pose: (r, local) => {
          const look = poseTrack(w, lt, [[0, { head: [18, 0, 0], spine: [5, 0, 0] }], [1.8, { head: [8, 8, -6], spine: [3, 0, 0] }],
            [2.2, { head: [-4, -14, 4], spine: [1, -4, 0] }], [2.6, { head: [-4, 10, -3] }], [3.0, { head: [22, 0, 0], spine: [8, 0, 0] }]]);
          return handsUp(w, r, local, lt, floatWith(w, { head: look.head, spine: look.spine }));
        },
        face: faceTrack(w, lt, [
          [0, { eyeScale: 1.1, browUp: 0.75, lookY: -0.6, mouthOpen: 0.15, mouthRound: 0.5 }],
          [1.0, { browUp: 0.4, browAsym: 0.5, lookY: -0.35, mouthCurve: -0.15, mouthSkew: -0.4 }],
          [1.9, { eyeScale: 1.08, browUp: 0.85, lookX: -0.45, lookY: 0.1 }], [2.4, { eyeScale: 1.08, browUp: 0.85, lookX: 0.45, lookY: 0.1 }],
          [2.9, { browUp: 0.5, lookY: -0.7, mouthRound: 0.4, mouthOpen: 0.1 }],
        ]),
      });
      w.frameOn([at[0] + 0.34, 1.86, at[2]], 1.25, { az: -25, el: 4, roll: 0.5 * Math.sin(lt * 0.9) });
    },
  },
  4: {
    key: 1.1,
    pose(w, lt) {
      const left = lt < 0.9 ? 300 : lt < 1.9 ? 299 : 298;
      if (lt < 0.25) w.house.props.tv.show('died', { prompt: true, select: true });
      else w.house.props.tv.show('spectating', { left });
      tvGlow(w, lt < 0.25);
      bodyOnCouch(w);
      w.cam([0.25, 0.95, 0.75], [0.25, 0.94, 2.03], track(lt, [[0, 26], [2.5, 25.2, E.cam]]));
    },
  },
  5: {
    key: 1.6,
    pose(w, lt, t) {
      w.house.props.tv.show('spectating', { left: 297 });
      bodyOnCouch(w);
      const shade = w.house.spots.lampShade;
      const at = [track(lt, [[0, -0.55], [0.7, -0.82, E.out]]), 0.36, -1.62];
      catOnChair(w, t, [at[0], 1.7, at[2]], { yaw: 20, face: { eyeScale: 1.15 } });
      person(w, w.cast.ghostKip, t, {
        at, yaw: track(lt, [[0, -10], [1.0, -18], [3.0, -18], [3.5, 30]]), ghost: true, who: 'kip',
        pose: (r) => {
          const base = poseTrack(w, lt, [
            [0, floatWith(w, { head: [4, -20, -4], spine: [2, -8, 0] })],
            [2.2, floatWith(w, { head: [10, -26, -6], spine: [4, -10, 0] })],
            [3.0, floatWith(w, { head: [4, 10, 0], spine: [2, 0, 0] })],
          ]);
          // the hand goes into the shade, holds there, comes back out to be looked at
          const inside = V(shade.x + 0.08, shade.y, shade.z + 0.03), outside = V(shade.x + 0.36, shade.y - 0.05, shade.z + 0.12);
          const R = outside.clone().lerp(inside, track(lt, [[0.4, 0], [1.3, 1], [1.9, 1], [2.4, 0.15]]));
          if (lt > 2.4) R.add(V(0.02, 0.05 * ramp(lt, 2.4, 2.8), 0.08 * ramp(lt, 2.4, 2.8)));
          return r.solve(base, { R });
        },
        face: faceTrack(w, lt, [[0, { eyeScale: 1.05, browUp: 0.5 }], [1.3, { eyeScale: 1.2, browUp: 0.9, mouthOpen: 0.2, mouthRound: 0.6 }],
          [2.0, 'worried'], [3.5, 'worried']]),
      });
      w.frameOn([track(lt, [[0, -1.2], [3.5, -1.3, E.cam]]), 1.7, -1.68], 1.38, { az: track(lt, [[0, 4], [3.5, -4]]), roll: 0.5 * Math.sin(lt * 0.8) });
    },
  },
  6: {
    key: 2.0,
    pose(w, lt, t) {
      w.house.props.tv.show('spectating', { left: 295 });
      const body = bodyOnCouch(w);
      body.root.updateMatrixWorld(true);
      const head = body.joints.head.children[0].getWorldPosition(V(0, 0, 0));
      const cheek = head.clone().add(V(0.217, -0.07, 0.269));
      const at = [0.86, 0.2, -1.2];
      person(w, w.cast.ghostKip, t, {
        at, yaw: w.yawTo(at, [head.x, 0, head.z]), ghost: true, who: 'kip',
        pose: (r) => {
          const base = floatWith(w, { head: [6, 0, 0], spine: [8, 0, 0] });
          // in from the right, into the cheek, a little deeper, and away again
          const k = track(lt, [[0.5, 0], [1.6, 1], [2.2, 1.12], [2.9, 1.12], [3.5, 0]]);
          const from = cheek.clone().add(V(0.42, -0.12, 0.3));
          const dir = cheek.clone().sub(head).normalize();
          const R = from.clone().lerp(cheek, Math.min(1, k)).addScaledVector(dir, -0.18 * Math.max(0, k - 1));
          return r.solve(base, { R });
        },
        face: { lid: 0.3, lidSlant: -0.4, browUp: 0.2, browTilt: -0.6, mouthCurve: -0.7, mouthOpen: 0.25, mouthWide: 0.9, mouthSkew: 0.6 },
      });
      w.frameOn([head.x, head.y - 0.02, head.z], track(lt, [[0, 0.88], [3.57, 0.84, E.cam]]), { az: -8, el: 2, fov: L.close });
    },
  },
  7: {
    key: 2.2,
    pose(w, lt, t) {
      w.house.props.tv.show('spectating', { left: 293 });
      bodyOnCouch(w);
      const s = w.house.spots.armchairSeat;
      // from his eyes, hanging in the air: a slow float, so her head has something to follow
      const eye = w.frameOn([s.x + 0.05, 0.8, s.z], 0.86, { az: 80 + 4 * Math.sin(lt * 0.7), el: 18 + 1.5 * Math.sin(lt * 0.5), roll: 0.5 * Math.sin(lt * 0.9) });
      const hiss = ramp(lt, 3.95, 4.3, E.out);
      const crouch = { bodyY: -0.08, legBL: [-75, 0, 6], kneeBL: 115, legBR: [-75, 0, 6], kneeBR: 115, body: [-30, 0, 0], head: [28, 0, 0], legFL: [30, 0, 0], legFR: [30, 0, 0] };
      const pose = w.Mascot.mixCatPose(w.Mascot.mixCatPose('sit', crouch, ramp(lt, 3.75, 3.95)), 'hiss', hiss);
      const face = lt < 4.2 ? w.Mascot.mixCatFace('calm', 'wide', ramp(lt, 1.0, 1.4)) : w.Mascot.mixCatFace('wide', 'hiss', ramp(lt, 4.2, 4.3));
      catOnChair(w, t, lt < 0.4 ? [0.25, 1.0, -1.6] : eye, { pose, face, yaw: w.yawTo([s.x, 0, s.z], eye) - 30 - 55 * hiss });
    },
  },
  8: {
    key: 0.8,
    pose(w, lt, t) {
      w.house.props.tv.show('spectating', { left: 291 });
      bodyOnCouch(w);
      const at = [-0.95, 0.6, -1.45], s = w.house.spots.armchairSeat;
      catOnChair(w, t, [at[0], 1.7, at[2]], { pose: 'hiss', face: lt < 0.4 ? 'hiss' : 'wide', yaw: w.yawTo([s.x, 0, s.z], at) - 85 });
      const turn = ramp(lt, 1.95, 2.5);
      const offended = { lid: 0.34, lidSlant: -0.35, browUp: -0.15, browTilt: 0.5, browAsym: 0.5, mouthCurve: -0.45, mouthSkew: 0.55, mouthWide: 0.75, lookX: -0.5 };
      person(w, w.cast.ghostKip, t, {
        at, yaw: 5 - 80 * turn, ghost: true, who: 'kip',
        pose: floatWith(w, { head: [-8, -28 + 20 * turn, 7 - 7 * turn], spine: [-3, -6, 0], armL: [-18, 0, 30], elbowL: [-60, 0, 0], armR: [-6, 0, 20], elbowR: [-24, 0, 0] }),
        face: faceTrack(w, lt, [[0, { lid: 0.1, browUp: 0.3 }], [0.25, offended], [1.9, offended], [2.3, { lid: 0.2, browUp: -0.1, mouthCurve: 0.1, mouthSkew: 0.3, lookX: 0.3 }]]),
      });
      w.frameOn([at[0], 1.95, at[2]], 1.18, { az: -15, roll: 0.4 * Math.sin(lt * 0.8) });
    },
  },
  9: {
    key: 0.9,
    pose(w, lt, t) {
      w.house.props.tv.show('spectating', { left: 290 });
      w.house.light('living', 'kitchen');
      // he floats to the wall and leans in head first; then his head comes out on the kitchen side
      const x = track(lt, [[0, -2.25], [1.0, -2.78], [1.9, -2.95]]);
      const lean = track(lt, [[0, 0], [0.9, 26], [1.9, 18]]);
      person(w, w.cast.ghostKip, t, {
        at: [x, 0.3, -0.95], yaw: -90, ghost: true,
        pose: floatWith(w, {
          spine: [lean, 0, 0], head: [lean * 0.45, 0, 0], armL: [-40, 0, 14], elbowL: [-20, 0, 0], armR: [-36, 0, 12], elbowR: [-26, 0, 0],
          legL: [14, 0, 2], kneeL: 30, legR: [8, 0, 2], kneeR: 22,
        }),
        face: { eyeScale: 0.95, lid: 0.15, browUp: -0.1, mouthCurve: 0.1, mouthSkew: 0.3 },
      });
      // Mom on the phone in the kitchen, seen once the camera is through
      momAtCounter(w, t, { face: 'neutral' });
      // the camera glides left along the wall in profile, then through the 10 cm slab (the wipe) into the kitchen
      const cx = track(lt, [[0, -2.15], [1.15, -2.75], [1.95, -3.35, E.linear], [2.5, -3.75, E.out]]);
      const look = track(lt, [[0, [-2.6, 1.32, -0.95]], [1.2, [-2.95, 1.32, -0.95]], [2.5, [-4.3, 1.32, -1.5]]]);
      w.cam([cx, 1.36, track(lt, [[0, 0.55], [2.5, 0.4]])], look, L.wide, 0.5 * Math.sin(lt));
    },
  },
};
