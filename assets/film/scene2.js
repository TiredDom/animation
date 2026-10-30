// Scene 2: Easy (the kitchen, night). Mom on the phone at the counter; Kip learns the present is hidden and that
// she knows about the chips, and decides it'll be easy. Ends on the dollhouse title as he shoots up through the ceiling.
import { V, L, person, momAtCounter, faceTrack, poseTrack, track, E, ramp } from './stage.js';

const floatWith = (w, extra) => Object.assign({}, w.Mascot.POSES.float, extra);
const LEAN = [-5.65, 0, -1.5];          // Mom leaning back on the counter, facing the room

// Kip's head out of the shared wall beside the fridge: his body stays in the living room, leaning in.
function pokeOut(w, t, lt, { look = 0, face }) {
  return person(w, w.cast.ghostKip, t, {
    at: [-2.6, 0.3, -0.95], yaw: -90, ghost: true, who: 'kip',
    pose: floatWith(w, { spine: [18, 0, 0], head: [4, look, 0], armL: [12, 0, 10], elbowL: [-14, 0, 0], armR: [10, 0, 12], elbowR: [-18, 0, 0] }),
    face,
  });
}

export const SCENE2 = {
  10: {
    key: 1.6,
    pose(w, lt, t) {
      w.house.light('kitchen');
      // he looks at Mom, then turns his head to the calendar, and his eyes light up
      pokeOut(w, t, lt, {
        look: track(lt, [[0, 18], [0.9, 18], [1.4, -38]]),
        face: faceTrack(w, lt, [[0, { lookX: 0.2, browUp: 0.3 }], [1.3, { lookX: -0.4, lookY: 0.1, browUp: 0.2 }], [1.8, { eyeScale: 1.15, browUp: 0.8, lookX: -0.5, mouthCurve: 0.5, mouthOpen: 0.2 }], [3.5, { eyeScale: 1.1, happy: 0.35, browUp: 0.6, lookX: -0.5, mouthCurve: 0.9, mouthOpen: 0.15 }]]),
      });
      momAtCounter(w, t, {});
      w.frameOn(track(lt, [[0, [-3.52, 1.42, -1.38]], [3.5, [-3.6, 1.43, -1.6], E.cam]]), track(lt, [[0, 1.45], [3.5, 1.2, E.cam]]), { az: -68, el: 2, roll: 0.4 * Math.sin(lt * 0.8) });
    },
  },
  11: {
    key: 2.6,
    pose(w, lt, t) {
      w.house.light('kitchen');
      // she turns round to lean on the counter while she talks; he floats in behind her, sneaking
      const turn = track(lt, [[0, 0], [0.9, 180]]);
      momAtCounter(w, t, { turn, at: [track(lt, [[0, -5.65], [0.9, LEAN[0]]]), 0, track(lt, [[0, -1.35], [0.9, LEAN[2]]])], face: { mouthCurve: 0.35, lid: 0.12, browUp: 0.1 } });
      const k = ramp(lt, 1.0, 3.6, E.inOut);
      person(w, w.cast.ghostKip, t, {
        at: [-3.25 - 1.85 * k, 0.5, -0.95 - 0.75 * k], yaw: -90 + 40 * k, ghost: true,
        pose: floatWith(w, { spine: [10, 0, 0], head: [4, 0, 0], armL: [-30, 0, 20], elbowL: [-50, 0, 0], armR: [-26, 0, 22], elbowR: [-46, 0, 0] }),
        face: { lid: 0.2, lidSlant: 0.3, browUp: -0.1, browTilt: 0.3, mouthCurve: 0.2, mouthSkew: 0.4, lookX: -0.4 },
      });
      w.frameOn([-5.5, 1.45, -1.5], track(lt, [[0, 1.5], [4.3, 1.42, E.cam]]), { az: 18, el: 0 });
    },
  },
  12: {
    key: 1.6,
    pose(w, lt, t) {
      w.house.light('kitchen');
      // she sips her tea, deadpan, while he waves in her face
      const sip = track(lt, [[1.1, 0], [1.6, 1], [2.3, 1], [2.8, 0]]);
      momAtCounter(w, t, { turn: 180, at: LEAN, sip, face: { mouthCurve: 0.3, lid: 0.18 } });
      const wave = Math.sin(lt * 9) * (lt < 1.4 ? 22 : 34);
      person(w, w.cast.ghostKip, t, {
        at: [-5.06, 0.42, -0.98], yaw: 238, ghost: true, who: 'kip',
        pose: floatWith(w, {
          spine: [6, 0, 0], head: [-8, 0, 0],
          armR: [-30, 0, 96 + 0.3 * wave], elbowR: [0, 0, 60 + wave],
          armL: lt < 1.5 ? [-10, 0, 24] : [-28, 0, 98 - 0.3 * wave], elbowL: lt < 1.5 ? [-30, 0, 0] : [0, 0, 62 - wave],
        }),
        face: faceTrack(w, lt, [[0, { browUp: 0.5, eyeScale: 1.05 }], [1.5, { browUp: 0.9, eyeScale: 1.15, browTilt: -0.3 }], [3.0, { browUp: 0.6, mouthCurve: -0.3, lookX: 0.3 }]]),
      });
      w.frameOn([-5.36, 1.66, -1.22], 1.52, { az: -64, el: 2, fov: L.wide });
    },
  },
  13: {
    key: 2.0,
    pose(w, lt, t) {
      w.house.light('kitchen');
      momAtCounter(w, t, { turn: 180, at: LEAN, face: faceTrack(w, lt, [[0, { mouthCurve: 0.35, lid: 0.15 }], [2.2, { mouthCurve: 0.65, lid: 0.25, lidSlant: -0.2, browUp: 0.2, browAsym: 0.3 }]]) });
      person(w, w.cast.ghostKip, t, {
        at: [-4.45, 0.5, -1.15], yaw: -95, ghost: true,
        pose: floatWith(w, { spine: [4, 0, 0], head: [0, 0, 6] }),
        face: { browUp: 0.4, lookX: 0.3 },
      });
      w.frameOn([-5.62, 1.6, -1.5], track(lt, [[0, 1.0], [4.5, 0.92, E.cam]]), { az: 8, el: 0 });
    },
  },
  14: {
    key: 1.0,
    pose(w, lt, t) {
      w.house.light('kitchen');
      momAtCounter(w, t, { turn: 180, at: LEAN, face: { mouthCurve: 0.5, lid: 0.2 } });
      const at = [-4.7, 0.5, -1.2];
      person(w, w.cast.ghostKip, t, {
        at, yaw: -95, ghost: true, who: 'kip',
        pose: floatWith(w, { spine: [-6, 0, 0], head: [-10, 0, 0], armL: [-20, 0, 50], elbowL: [-70, 0, 20], armR: [-20, 0, 50], elbowR: [-70, 0, 20] }),
        face: faceTrack(w, lt, [[0, { browUp: 0.4 }], [0.25, 'angry'], [2.5, { lid: 0.2, lidSlant: 1, browUp: -0.5, browTilt: 1, mouthCurve: -0.6, mouthOpen: 0.3 }]]),
      });
      w.frameOn([at[0], at[1] + 1.4, at[2]], 0.82, { az: -42, el: 2 });
    },
  },
  15: {
    key: 3.4,
    pose(w, lt, t) {
      w.house.light('kitchen');
      momAtCounter(w, t, { turn: 180, at: LEAN, face: { mouthCurve: 0.4, lid: 0.15 } });
      // he turns from Mom to us, and the grin spreads on "Easy."
      const at = [-4.7, 0.5, -1.2];
      const turn = ramp(lt, 0.05, 0.6, E.inOut);
      person(w, w.cast.ghostKip, t, {
        at, yaw: -95 + 115 * turn, ghost: true, who: 'kip',
        pose: floatWith(w, { spine: [-2, 0, 0], head: [-4, 0, 4 * Math.sin(lt * 1.3)], armL: [-12, 0, 22], elbowL: [-40, 0, 0], armR: [-14, 0, 20], elbowR: [-46, 0, 0] }),
        face: faceTrack(w, lt, [[0, { browUp: 0.3, mouthCurve: -0.2 }], [0.6, { lid: 0.15, lidSlant: 0.4, mouthCurve: 0.3, mouthSkew: 0.4 }], [2.3, 'determined'],
          [3.0, { lid: 0.22, lidSlant: 0.55, browUp: -0.3, browTilt: 0.7, mouthCurve: 1, mouthSkew: 0.6, mouthWide: 1.1 }]]),
      });
      w.frameOn([at[0], at[1] + 1.38, at[2]], track(lt, [[0, 1.08], [4.5, 0.98, E.cam]]), { az: 40, el: 0 });
    },
  },
  16: {
    key: 1.4,
    pose(w, lt, t) {
      // the whole house cut open like a dollhouse; he shoots up out of the kitchen through the ceiling
      w.mood('title');
      w.house.light('kitchen', 'living', 'garage', 'closet', 'hall', 'momRoom', 'kipRoom', 'attic');
      momAtCounter(w, t, { turn: 180, at: LEAN, face: { mouthCurve: 0.4 } });
      bodyOnCouchWide(w);
      w.put(w.cast.cat, w.house.spots.armchairSeat.x, 0.41, w.house.spots.armchairSeat.z, 30);
      w.cast.cat.setPose('sit');
      w.cast.cat.update(t);
      const rise = ramp(lt, 1.6, 2.7, E.in);
      person(w, w.cast.ghostKip, t, {
        at: [-4.7, 0.5 + 3.6 * rise, -1.2], yaw: 20, ghost: true,
        pose: floatWith(w, { armL: [-10, 0, 150 * rise], elbowL: [-10, 0, 0], armR: [-10, 0, 150 * rise], elbowR: [-10, 0, 0], legL: [0, 0, 2], kneeL: 6, legR: [0, 0, 2], kneeR: 6, footL: 40, footR: 40 }),
        face: 'determined',
      });
      w.frameOn([-3.85, 4.15, 0], track(lt, [[0, 10.4], [3, 9.9, E.cam]]), { el: 9, fov: 34 });
    },
  },
};

// Kip's frozen body on the couch, seen in the dollhouse view (no controller detail needed at that size).
function bodyOnCouchWide(w) {
  const { kip } = w.cast, seat = w.house.spots.couchSeats[1];
  w.put(kip, seat.x, 0, seat.z, 0);
  kip.sitOn(w.house.props.couch.seatTop);
  kip.setPose('game');
  kip.blink = false;
  kip.setExpression({ mouthOpen: 0.1 });
}
