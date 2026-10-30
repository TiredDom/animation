// Motion for the shots: the spec's natural eases, keyframe tracks, walk cycles, and mouths that follow the voice.
// Everything is a pure function of time, so any frame can be drawn on its own.
import { TIMELINE } from './timeline.js';
import { LIPS } from './lips.js';

const clamp01 = (x) => Math.max(0, Math.min(1, x));

// Eases (the spec: enter sine.out, move sine.inOut, exit sine.in, camera cubic.inOut; no overshoot anywhere).
export const E = {
  linear: (x) => x,
  in: (x) => 1 - Math.cos((x * Math.PI) / 2),
  out: (x) => Math.sin((x * Math.PI) / 2),
  inOut: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  cam: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
};

export function lerpAny(a, b, u) {
  if (Array.isArray(a)) return a.map((v, i) => lerpAny(v, b[i], u));
  if (typeof a === 'number') return a + (b - a) * u;
  return u < 0.5 ? a : b;
}

// A track: [[t, value], [t, value, ease], ...] in time order. It holds the first value before the first key and the
// last after the last; between two keys it eases with the later key's ease (default sine.inOut). `mix(a, b, u)`
// blends two values: numbers and arrays by default; pass Mascot.mixPose / mixFace for poses and faces.
export function track(t, keys, mix = lerpAny) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e = E.inOut] = keys[i];
    if (t < t1) {
      const [t0, v0] = keys[i - 1];
      return mix(v0, v1, e(clamp01((t - t0) / (t1 - t0))));
    }
  }
  return keys[keys.length - 1][1];
}

// 0 → 1 between a and b on an ease (handy for one-off blends)
export const ramp = (t, a, b, e = E.inOut) => e(clamp01((t - a) / (b - a)));

// ---------- walking ----------

// A person's walk at phase p (0..1 is two steps): the legs swing, the swinging knee lifts the foot, the arms swing
// against the legs, the hips sink at the long stride and rise as the legs pass. Returns pose values to merge onto a
// base pose. Drive p by distance (walkPhase) so the feet never slide.
export function walk(p, { swing = 21, knee = 36, arm = 14, bob = 0.034, twist = 4, lean = 4 } = {}) {
  const s = Math.sin(2 * Math.PI * p), c = Math.cos(2 * Math.PI * p);
  const L = -swing * s, R = swing * s;
  const kL = knee * Math.pow(Math.max(0, c), 1.5) + 3, kR = knee * Math.pow(Math.max(0, -c), 1.5) + 3;
  return {
    hipsY: -bob * s * s,
    spine: [lean, twist * s, 0],
    head: [-lean * 0.6, -twist * s * 0.6, 0],
    legL: [L, 0, 1.5], kneeL: kL, footL: 0.45 * L - 0.35 * kL + 4,
    legR: [R, 0, 1.5], kneeR: kR, footR: 0.45 * R - 0.35 * kR + 4,
    armL: [arm * s, 0, 9], elbowL: [-16 - 8 * Math.max(0, -s), 0, 0],
    armR: [-arm * s, 0, 9], elbowR: [-16 - 8 * Math.max(0, s), 0, 0],
  };
}
// phase for a walk that has covered `dist` metres with legs `leg` long (hip height) and the given swing
export const walkPhase = (dist, leg, swing = 21) => dist / (4 * leg * Math.sin((swing * Math.PI) / 180));

// The cat's walk at phase p: diagonal pairs swing together (front left with back right), the swinging knee lifts.
export function catWalk(p, { swing = 24, knee = 26 } = {}) {
  const s = Math.sin(2 * Math.PI * p), c = Math.cos(2 * Math.PI * p);
  const kA = knee * Math.pow(Math.max(0, c), 1.5), kB = knee * Math.pow(Math.max(0, -c), 1.5);
  return {
    bodyY: -0.006 * s * s,
    legFL: [-swing * s, 0, 0], kneeFL: kA, legBR: [-swing * 0.9 * s, 0, 0], kneeBR: kA * 0.8,
    legFR: [swing * s, 0, 0], kneeFR: kB, legBL: [swing * 0.9 * s, 0, 0], kneeBL: kB * 0.8,
  };
}
export const catPhase = (dist, swing = 24) => dist / (4 * 0.16 * Math.sin((swing * Math.PI) / 180));

// ---------- voices ----------

// The line `who` ('kip' or 'mom') is saying at film time t, or null.
export function lineAt(who, t) {
  for (const l of TIMELINE.lines) if (l.who === who && t >= l.start && t < l.end) return l;
  return null;
}
// Mouth shape for `who` at t (leading the voice by 2 frames, as the spec says), or null between lines.
export function mouth(who, t) {
  const tt = t + 2 / TIMELINE.fps, l = lineAt(who, tt);
  if (!l) return null;
  const L = LIPS[l.id], i = Math.floor((tt - l.start) * TIMELINE.fps);
  if (i < 0 || i >= L.open.length) return null;
  return { open: L.open[i], round: L.round[i], wide: L.wide[i], line: l };
}
// A face that talks: the mouth opens with the voice and rounds on o/u/w; between words the face keeps its own mouth.
// `face` is a resolved face (Mascot.resolveFace / mixFace output).
export function talk(face, who, t, { gain = 1 } = {}) {
  const m = mouth(who, t);
  if (!m) return face;
  const f = Object.assign({}, face);
  const o = m.open * 0.9 * gain;
  f.mouthOpen = Math.max(f.mouthOpen * (1 - m.open * 0.6), o);
  f.mouthRound = Math.max(f.mouthRound * 0.5, m.round * 0.85);
  f.mouthWide = f.mouthWide * (1 + 0.12 * m.wide - 0.18 * m.round);
  return f;
}

export { TIMELINE };
