/* The family cat: a plump grey toon cat on a small four-legged rig, in the same look as the cast.
 *
 * Classic script; load it after mascot.js. It adds Mascot.createCat(THREE, opts).
 *
 *   const cat = Mascot.createCat(THREE);
 *   scene.add(cat.root);
 *   cat.setPose('sit');            // a name from Mascot.CAT_POSES, or a pose object (degrees)
 *   cat.setExpression('wide');     // a name from Mascot.CAT_EXPRESSIONS, or face params
 *   cat.update(t);                 // breathing, a slow tail sway and blinks; a pure function of t
 *
 * Dot eyes painted on the head like the rest of the cast. The ghost gag: her eyes go 1.6× wide
 * ('wide'), and when she hisses the back arches, the ears flatten and the tail stands up and puffs.
 * Scale: about 0.72 tall to the ear tips, standing; feet on y = 0, facing +Z; her left is +X.
 */
(function (global) {
  'use strict';

  const Mascot = global.Mascot;
  if (!Mascot) throw new Error('cat.js: load mascot.js first');
  const { clamp, lerp, smooth, makeCanvas, headGeometries, limb } = Mascot.util;
  const DEG = Math.PI / 180;

  const R = 0.165;                                   // head radius
  const LEG = { upper: 0.085, lower: 0.072, r: 0.04, paw: 0.047 };
  // body pivot height standing: the leg pivots sit 0.04 under it, and the paws just touch the floor
  const BODY_Y = 0.04 + LEG.upper + LEG.lower + 0.002 + LEG.paw * 0.62;
  // the tail: segment lengths, and the radius at each joint down to the tip (one smooth taper)
  const TAIL_LEN = [0.085, 0.08, 0.075, 0.07];
  const TAIL_R = [0.036, 0.033, 0.03, 0.026, 0.022];
  const COLORS = { fur: '#8E959E', white: '#F2F0EC', pink: '#E7A0A6', eye: '#1F1512', mouth: '#5B2421' };

  const FACE = { eyeOpen: 1, eyeScale: 1, lookX: 0, lookY: 0, lid: 0, lidSlant: 0, happy: 0, mouthOpen: 0, mouthCurve: 0.4 };
  const FACE_KEYS = Object.keys(FACE);
  const EXPRESSIONS = {
    calm:    {},
    wide:    { eyeScale: 1.6, mouthOpen: 0.12 },                     // she sees the ghost
    hiss:    { eyeScale: 1.15, lid: 0.2, lidSlant: 0.9, mouthOpen: 0.85 },
    content: { happy: 1, mouthCurve: 0.6 },
    sleepy:  { eyeOpen: 0.12 },
    meow:    { mouthOpen: 0.45, eyeScale: 1.05 },
  };

  // Poses in degrees. Legs [x, y, z] in XZY order like the people (negative x swings forward), right side
  // mirrored; knees bend back with positive x. arch tips the front half down and the back half down
  // (a raised spine); ears turn back with positive values; tail: [x, y] per segment, each bending the next
  // (negative x leans back); puff thickens the tail.
  const REST = {
    bodyY: 0, body: [0, 0, 0], arch: 0, head: [0, 0, 0], ears: [0, 0],
    tail: [[-70, 0], [28, 0], [30, 0], [28, 0]], puff: 1,
    legFL: [0, 0, 0], kneeFL: 0, legFR: [0, 0, 0], kneeFR: 0,
    legBL: [0, 0, 0], kneeBL: 0, legBR: [0, 0, 0], kneeBR: 0,
  };
  const POSES = {
    stand: {},
    sit: {
      bodyY: -0.065, body: [-35, 0, 0], head: [32, 0, 0],
      legFL: [35, 0, 0], legFR: [35, 0, 0],
      legBL: [-70, 0, 6], kneeBL: 110, legBR: [-70, 0, 6], kneeBR: 110,
      tail: [[60, 0], [25, 40], [20, 40], [15, 35]],
    },
    walk: {
      legFL: [-24, 0, 0], kneeFL: 8, legFR: [18, 0, 0], kneeFR: 14,
      legBL: [18, 0, 0], kneeBL: 14, legBR: [-22, 0, 0], kneeBR: 6,
      head: [-4, 6, 0], tail: [[-45, 8], [20, 6], [18, 4], [15, 0]],
    },
    // the Halloween arch: back up in a hump, legs straight and planted (they cancel the arch, so the paws stay
    // on the floor), head low but lifted to face the threat, ears flat, the tail straight up and puffed
    hiss: {
      bodyY: 0.052, arch: 34, head: [-40, 0, 0], ears: [65, 65],
      legFL: [-34, 0, 4], legFR: [-34, 0, 4], legBL: [34, 0, 4], legBR: [34, 0, 4],
      tail: [[34, 0], [-6, 0], [-8, 0], [-10, 0]], puff: 1.55,
    },
    lead: {
      legFL: [-26, 0, 0], kneeFL: 10, legFR: [20, 0, 0], kneeFR: 16,
      legBL: [20, 0, 0], kneeBL: 16, legBR: [-24, 0, 0], kneeBR: 8,
      body: [0, 12, 0], head: [-6, 75, 6], tail: [[-30, -10], [20, -8], [20, -6], [18, 0]],
    },
  };

  const clone = (o) => JSON.parse(JSON.stringify(o));
  function resolvePose(p) {
    const src = typeof p === 'string' ? POSES[p] : p;
    if (typeof p === 'string' && !src) throw new Error('cat: unknown pose "' + p + '"');
    return Object.assign(clone(REST), clone(src || {}));
  }
  function resolveFace(e) {
    const src = typeof e === 'string' ? EXPRESSIONS[e] : e;
    if (typeof e === 'string' && !src) throw new Error('cat: unknown expression "' + e + '"');
    return Object.assign({}, FACE, src || {});
  }
  function mixPose(a, b, t) {
    a = resolvePose(a); b = resolvePose(b);
    const mix = (x, y) => (Array.isArray(x) ? x.map((v, i) => mix(v, y[i])) : lerp(x, y, t));
    const out = {};
    for (const k in a) out[k] = mix(a[k], b[k]);
    return out;
  }
  function mixFace(a, b, t) {
    a = resolveFace(a); b = resolveFace(b);
    const out = {};
    for (const k of FACE_KEYS) out[k] = lerp(a[k], b[k], t);
    return out;
  }

  // The cat's face in head units (x, y in multiples of R, seen from the front): a white muzzle and chin,
  // a pink nose, a "w" mouth that opens into a hiss with two fangs, dot eyes and white whiskers.
  function drawCatFace(ctx, S, f, rough) {
    const u = S / 2;
    const X = (x) => u + x * u, Y = (y) => u - y * u, L = (v) => v * u;
    const grey = (v) => { const c = Math.round(v * 255); return 'rgb(' + c + ',' + c + ',' + c + ')'; };
    const col = rough
      ? { fur: grey(0.82), white: grey(0.82), pink: grey(0.45), eye: grey(0.14), shine: grey(0.14), mouth: grey(0.4), whisk: grey(0.8), fang: grey(0.3) }
      : { fur: COLORS.fur, white: COLORS.white, pink: COLORS.pink, eye: COLORS.eye, shine: '#ffffff', mouth: COLORS.mouth, whisk: '#F7F5F2', fang: '#FFFDF7' };
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = col.fur;
    ctx.fillRect(0, 0, S, S);

    // muzzle: two puffs and a chin
    ctx.fillStyle = col.white;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(X(s * 0.13), Y(-0.3), L(0.19), L(0.15), 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.beginPath(); ctx.ellipse(X(0), Y(-0.43), L(0.13), L(0.09), 0, 0, Math.PI * 2); ctx.fill();

    // eyes: the same dot eyes as the people, without brows
    const clipOut = (fn) => { ctx.beginPath(); ctx.rect(0, 0, S, S); fn(); ctx.clip('evenodd'); };
    for (const s of [-1, 1]) {
      const ex = s * 0.33 + f.lookX * 0.035, ey = 0.04 + f.lookY * 0.03;
      const rx = 0.1 * f.eyeScale, ry0 = 0.12 * f.eyeScale, ry = ry0 * clamp(f.eyeOpen, 0, 1.3);
      ctx.save();
      if (f.lid > 0.001 || Math.abs(f.lidSlant) > 0.001) {
        const top = ey + ry0, yl = top - f.lid * 2 * ry0, k = s * f.lidSlant * 0.6;
        clipOut(() => {
          ctx.moveTo(X(ex - 0.3), Y(yl - k * 0.3)); ctx.lineTo(X(ex + 0.3), Y(yl + k * 0.3));
          ctx.lineTo(X(ex + 0.3), Y(top + 0.4)); ctx.lineTo(X(ex - 0.3), Y(top + 0.4)); ctx.closePath();
        });
      }
      if (f.happy > 0.001) {
        const off = lerp(2.3, 0.42, clamp(f.happy, 0, 1)) * ry0;
        clipOut(() => { ctx.moveTo(X(ex + rx * 1.3), Y(ey - off)); ctx.ellipse(X(ex), Y(ey - off), L(rx * 1.3), L(ry0 * 1.08), 0, 0, Math.PI * 2); });
      }
      if (ry < ry0 * 0.12) {
        ctx.strokeStyle = col.eye; ctx.lineWidth = L(0.032); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(X(ex - rx), Y(ey)); ctx.quadraticCurveTo(X(ex), Y(ey - 0.035), X(ex + rx), Y(ey)); ctx.stroke();
      } else {
        ctx.fillStyle = col.eye;
        ctx.beginPath(); ctx.ellipse(X(ex), Y(ey), L(rx), L(ry), 0, 0, Math.PI * 2); ctx.fill();
        if (f.eyeOpen > 0.55 && f.happy < 0.45) {
          ctx.fillStyle = col.shine;
          ctx.beginPath(); ctx.arc(X(ex + rx * 0.32), Y(ey + ry * 0.42), L(0.03 * f.eyeScale), 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }

    // whiskers: three a side, fanning out from the muzzle
    ctx.strokeStyle = col.whisk; ctx.lineWidth = L(0.014); ctx.lineCap = 'round';
    for (const s of [-1, 1]) {
      for (const a of [-12, 0, 12]) {
        const r = a * DEG, x0 = s * 0.24, y0 = -0.27 + a * 0.002;
        ctx.beginPath(); ctx.moveTo(X(x0), Y(y0));
        ctx.quadraticCurveTo(X(x0 + s * 0.18), Y(y0 + Math.sin(r) * 0.12 + 0.01), X(x0 + s * 0.36 * Math.cos(r)), Y(y0 + Math.sin(r) * 0.26));
        ctx.stroke();
      }
    }

    // nose: a soft pink triangle
    ctx.fillStyle = col.pink;
    ctx.beginPath();
    ctx.moveTo(X(-0.055), Y(-0.14)); ctx.quadraticCurveTo(X(0), Y(-0.125), X(0.055), Y(-0.14));
    ctx.quadraticCurveTo(X(0.03), Y(-0.19), X(0), Y(-0.205)); ctx.quadraticCurveTo(X(-0.03), Y(-0.19), X(-0.055), Y(-0.14));
    ctx.fill();

    // mouth: the "w" under the nose, or an open hiss with two fangs
    const open = clamp(f.mouthOpen, 0, 1);
    if (open < 0.05) {
      ctx.strokeStyle = col.eye; ctx.lineWidth = L(0.024); ctx.lineCap = 'round';
      const c = f.mouthCurve * 0.04;
      ctx.beginPath(); ctx.moveTo(X(0), Y(-0.2)); ctx.lineTo(X(0), Y(-0.245)); ctx.stroke();
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(X(0), Y(-0.245));
        ctx.quadraticCurveTo(X(s * 0.05), Y(-0.29 - c), X(s * 0.1), Y(-0.245 + c * 0.5)); ctx.stroke();
      }
    } else {
      const top = -0.215, bot = top - open * 0.22, w = 0.075 + open * 0.05;
      const shape = () => {
        ctx.beginPath(); ctx.moveTo(X(-w), Y(top));
        ctx.quadraticCurveTo(X(0), Y(top + 0.02), X(w), Y(top));
        ctx.bezierCurveTo(X(w), Y(bot), X(-w), Y(bot), X(-w), Y(top)); ctx.closePath();
      };
      ctx.fillStyle = col.mouth; shape(); ctx.fill();
      ctx.save(); shape(); ctx.clip();
      ctx.fillStyle = col.fang;
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(X(s * (w - 0.03)), Y(top + 0.01)); ctx.lineTo(X(s * (w - 0.005)), Y(top + 0.01));
        ctx.lineTo(X(s * (w - 0.02)), Y(top - 0.06 * open)); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
  }

  // A rounded, flattened ear: a lathe cone with a soft tip, base on the origin pointing +Y.
  function earGeometry(THREE, s) {
    const prof = [[0, 0], [0.062, 0], [0.058, 0.035], [0.04, 0.08], [0.018, 0.115], [0.006, 0.124], [0, 0.126]]
      .map(([x, y]) => new THREE.Vector2(x * s, y * s));
    const g = new THREE.LatheGeometry(prof, 32);
    g.scale(1, 1, 0.42);
    return g;
  }

  function createCat(THREE, opts) {
    opts = opts || {};
    const FS = opts.faceSize || 1024;
    const seed = opts.seed || 7;

    const Mt = (o) => new THREE.MeshPhysicalMaterial(o);
    const tint = (hex, k) => new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), k);
    const mats = {
      fur: Mt({ color: COLORS.fur, roughness: 0.86, sheen: 0.8, sheenRoughness: 0.45, sheenColor: tint(COLORS.fur, 0.5) }),
      white: Mt({ color: COLORS.white, roughness: 0.86, sheen: 0.6, sheenRoughness: 0.5, sheenColor: tint(COLORS.white, 0.3) }),
      inner: Mt({ color: COLORS.pink, roughness: 0.7, sheen: 0.3, sheenRoughness: 0.6, sheenColor: tint(COLORS.pink, 0.4) }),
    };
    const faceCanvas = makeCanvas(FS), roughCanvas = makeCanvas(FS);
    const faceTex = new THREE.CanvasTexture(faceCanvas);
    faceTex.colorSpace = THREE.SRGBColorSpace;
    faceTex.anisotropy = 8;
    const roughTex = new THREE.CanvasTexture(roughCanvas);
    mats.face = Mt({ roughness: 1, map: faceTex, roughnessMap: roughTex, sheen: 0.6, sheenRoughness: 0.5, sheenColor: tint(COLORS.fur, 0.5) });

    const mesh = (g, m) => new THREE.Mesh(g, m);
    const group = (parent, x, y, z, order) => {
      const o = new THREE.Group();
      o.position.set(x, y, z);
      if (order) o.rotation.order = order;
      parent.add(o);
      return o;
    };
    const blob = (parent, m, sx, sy, sz, x, y, z) => {
      const o = mesh(new THREE.SphereGeometry(1, 40, 28), m);
      o.scale.set(sx, sy, sz);
      o.position.set(x, y, z);
      parent.add(o);
      return o;
    };

    const root = new THREE.Group();
    root.name = 'cat';
    const J = {};
    J.body = group(root, 0, BODY_Y, 0);
    J.front = group(J.body, 0, 0, 0);
    J.back = group(J.body, 0, 0, 0);
    blob(J.front, mats.fur, 0.135, 0.125, 0.165, 0, 0.015, 0.06);         // chest
    blob(J.front, mats.fur, 0.146, 0.132, 0.14, 0, 0.008, -0.005);        // middle, so the body reads as one
    blob(J.back, mats.fur, 0.145, 0.13, 0.17, 0, 0, -0.07);               // rump
    blob(J.front, mats.white, 0.085, 0.1, 0.06, 0, 0, 0.17);              // white bib
    for (const s of [1, -1]) blob(J.back, mats.fur, 0.06, 0.095, 0.1, s * 0.105, -0.015, -0.1);   // haunches

    const legs = [['FL', J.front, 1, 0.07, 0.1], ['FR', J.front, -1, 0.07, 0.1], ['BL', J.back, 1, 0.085, -0.11], ['BR', J.back, -1, 0.085, -0.11]];
    for (const [id, parent, s, x, z] of legs) {
      const leg = group(parent, s * x, -0.04, z, 'XZY');
      leg.add(mesh(limb(THREE, LEG.r, LEG.upper), mats.fur));
      const knee = group(leg, 0, -LEG.upper, 0);
      knee.add(mesh(limb(THREE, LEG.r, LEG.lower), mats.fur));
      const paw = mesh(new THREE.SphereGeometry(LEG.paw, 28, 20), mats.white);
      paw.scale.set(1, 0.62, 1.25);
      paw.position.set(0, -LEG.lower - 0.002, 0.012);
      knee.add(paw);
      J['leg' + id] = leg; J['knee' + id] = knee;
    }

    J.head = group(J.front, 0, 0.075, 0.13);
    const skull = group(J.head, 0, 0.11, 0.06);
    skull.scale.set(1.08, 0.94, 0.98);
    const [frontG, backG] = headGeometries(THREE, R);
    skull.add(mesh(frontG, mats.face), mesh(backG, mats.face));
    J.ears = [];
    const baseQ = [];
    for (const [i, s] of [[0, 1], [1, -1]]) {
      const p = new THREE.Vector3(Math.sin(s * 40 * DEG) * Math.cos(52 * DEG), Math.sin(52 * DEG), Math.cos(s * 40 * DEG) * Math.cos(52 * DEG));
      const ear = group(skull, p.x * R * 0.9, p.y * R * 0.9, p.z * R * 0.9);
      ear.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p.clone().normalize());
      baseQ.push(ear.quaternion.clone());
      ear.add(mesh(earGeometry(THREE, 1), mats.fur));
      const inner = mesh(earGeometry(THREE, 0.7), mats.inner);
      inner.position.set(0, 0.012, 0.016);
      ear.add(inner);
      J.ears.push(ear);
    }

    // The tail: a chain of tapered segments with a ball at every joint of the same radius, so it bends
    // smoothly; the last segment ends in a round tip.
    J.tail = [];
    const tailMeshes = [];
    let parent = group(J.back, 0, 0.05, -0.225);
    for (let i = 0; i < TAIL_LEN.length; i++) {
      const len = TAIL_LEN[i];
      const joint = i === 0 ? parent : group(parent, 0, TAIL_LEN[i - 1], 0);
      const seg = new THREE.CylinderGeometry(TAIL_R[i + 1], TAIL_R[i], len, 20, 1, true);
      seg.translate(0, len / 2, 0);
      const parts = [mesh(seg, mats.fur), mesh(new THREE.SphereGeometry(TAIL_R[i], 20, 14), mats.fur)];
      if (i === TAIL_LEN.length - 1) {
        const tip = mesh(new THREE.SphereGeometry(TAIL_R[i + 1], 20, 14), mats.fur);
        tip.position.y = len;
        parts.push(tip);
      }
      for (const m of parts) { joint.add(m); tailMeshes.push(m); }
      J.tail.push(joint);
      parent = joint;
    }

    root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

    let pose = resolvePose('stand');
    let face = resolveFace('calm');
    let faceKey = '';

    function paint(f) {
      const key = FACE_KEYS.map((k) => Math.round(f[k] * 1000)).join(',');
      if (key === faceKey) return;
      faceKey = key;
      drawCatFace(faceCanvas.getContext('2d'), FS, f, false);
      drawCatFace(roughCanvas.getContext('2d'), FS, f, true);
      faceTex.needsUpdate = true;
      roughTex.needsUpdate = true;
    }

    const setRot = (o, a, mirror) => o.rotation.set(a[0] * DEG, (mirror ? -a[1] : a[1]) * DEG, (mirror ? -a[2] : a[2]) * DEG);
    const earBack = new THREE.Quaternion(), xAxis = new THREE.Vector3(1, 0, 0);
    function applyPose(p, t) {
      J.body.position.y = BODY_Y + p.bodyY;
      setRot(J.body, p.body);
      J.front.rotation.x = p.arch * DEG;
      J.back.rotation.x = -p.arch * DEG;
      setRot(J.head, p.head);
      for (let i = 0; i < 2; i++) J.ears[i].quaternion.copy(baseQ[i]).multiply(earBack.setFromAxisAngle(xAxis, -p.ears[i] * DEG));
      for (let i = 0; i < J.tail.length; i++) {
        const sway = t == null ? 0 : 7 * Math.sin(t * 1.3 - i * 0.7);
        J.tail[i].rotation.set(p.tail[i][0] * DEG, (p.tail[i][1] + sway) * DEG, 0);
      }
      for (const m of tailMeshes) m.scale.set(p.puff, m.geometry.type === 'SphereGeometry' ? p.puff : 1, p.puff);
      for (const id of ['FL', 'BL']) { setRot(J['leg' + id], p['leg' + id]); J['knee' + id].rotation.set(p['knee' + id] * DEG, 0, 0); }
      for (const id of ['FR', 'BR']) { setRot(J['leg' + id], p['leg' + id], true); J['knee' + id].rotation.set(p['knee' + id] * DEG, 0, 0); }
      if (t != null) J.front.rotation.x += 0.01 * Math.sin((t / 2.4) * Math.PI * 2);   // breathing
    }

    const hash = (n) => { const x = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453; return x - Math.floor(x); };
    function blinkAt(t) {
      let start = 1.4 + hash(0) * 2, last = -1, n = 1;
      while (start <= t) { last = start; start += 3.4 + hash(n++) * 3.6; }
      if (last < 0) return 1;
      const u = t - last;
      if (u < 0.08) return 1 - smooth(0, 0.08, u);
      if (u < 0.22) return smooth(0.08, 0.22, u);
      return 1;
    }

    const api = {
      root, joints: J, mats, faceCanvas, design: 'cat',
      fit: { y: 0.31, h: 0.92, w: 1.0, lift: 0.08, faceY: 0.43, faceH: 0.5, faceW: 0.5 },
      blink: true,
      get pose() { return clone(pose); },
      get face() { return Object.assign({}, face); },
      setColorway() { return api; },
      setPose(p) { pose = resolvePose(p); applyPose(pose, null); return api; },
      setExpression(e) { face = resolveFace(e); paint(face); return api; },
      update(t) {
        applyPose(pose, t);
        const f = Object.assign({}, face);
        if (api.blink) f.eyeOpen *= blinkAt(t);
        paint(f);
        return api;
      },
    };
    applyPose(pose, null);
    paint(face);
    return api;
  }

  Mascot.createCat = createCat;
  Mascot.CAT_POSES = POSES;
  Mascot.CAT_EXPRESSIONS = EXPRESSIONS;
  Mascot.mixCatPose = mixPose;
  Mascot.mixCatFace = mixFace;
})(typeof window !== 'undefined' ? window : globalThis);
