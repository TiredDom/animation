/* Kip, the channel mascot, and his cast: simple 3D toon characters on one shared rig.
 *
 * LOCKED v1, approved by the user on 2026-10-30 (name Kip, Sunny yellow hoodie). Keep this look:
 * rig, motion and new poses or expressions are fine, changes to the design itself need the user's OK.
 * Other characters are designs on the same rig (DESIGNS below); Kip's design numbers never change.
 *
 * Classic script, no imports. It defines window.Mascot and takes Three.js as an argument,
 * so the same file runs in a plain page, an Artifact and a HyperFrames composition.
 *
 *   const kip = Mascot.create(THREE, { colorway: 'sunny' });   // Mom: Mascot.create(THREE, { design: 'mom' })
 *   scene.add(kip.root);
 *   kip.setPose('wave');           // a name from Mascot.POSES, or a pose object (degrees)
 *   kip.setExpression('happy');    // a name from Mascot.EXPRESSIONS, or face params
 *   kip.update(t);                 // t in seconds: breathing + blinks; a pure function of t, so seek-safe
 *
 * Look rules: no neck (the head sits in the collar), no outlines, the face is painted on the head
 * (dot eyes, brows, mouth), round nub hands, rigid parts that turn at real joints.
 * Scale: Kip stands about 1.78 tall, Mom about 1.98; feet on y = 0, facing +Z; their left is +X.
 */
(function (global) {
  'use strict';

  const DEG = Math.PI / 180;

  // Kip's hair clumps: points as [azimuth°, elevation°, distance × R] (azimuth 0 is the front, +90 his left),
  // root half-width × R, and thickness as a share of the width.
  const KIP_CLUMPS = [
    // the fringe, swept from a part on his right across the forehead to his left temple
    { pts: [[-38, 60, 0.99], [-14, 50, 1.06], [12, 41, 1.075], [36, 34, 1.07], [56, 30, 1.05]], w: 0.25, flat: 0.42 },
    // the short side of the part, falling toward his right temple
    { pts: [[-30, 62, 0.99], [-48, 48, 1.06], [-62, 36, 1.055], [-72, 30, 1.03]], w: 0.17, flat: 0.45 },
    // two flicks at the crown, for the silhouette
    { pts: [[168, 66, 1.0], [172, 76, 1.12], [186, 80, 1.24]], w: 0.085, flat: 0.7 },
    { pts: [[150, 68, 1.0], [146, 77, 1.11], [132, 79, 1.2]], w: 0.07, flat: 0.7 },
  ];

  // Everything that differs between characters. Lengths are scene units; profiles are (radius, height).
  const DESIGNS = {
    kip: {
      R: 0.36,                                            // head radius; the body is sized from it
      thigh: 0.245, shin: 0.235, ankle: 0.0984,           // ankle: ankle pivot height above the sole
      hipX: 0.1, spineY: 0.6,
      shoulderX: 0.245, shoulderY: 0.94, upper: 0.19, fore: 0.165,
      neckY: 1.05, headY: 1.36, headScale: [1, 0.94, 0.97],
      // the hoodie, turned on a lathe and flattened front to back
      torso: [
        [0, 0.49], [0.17, 0.49], [0.245, 0.497], [0.27, 0.515], [0.278, 0.55], [0.282, 0.66],
        [0.279, 0.78], [0.268, 0.88], [0.248, 0.955], [0.215, 1.015], [0.165, 1.06], [0.095, 1.088], [0, 1.096],
      ],
      torsoDepth: 0.8,
      hem: { r: 0.272, tube: 0.024, y: 0.515 },
      pelvis: { r: 0.19, scale: [1, 0.55, 0.8] },
      limb: { thigh: 0.086, shin: 0.08, upper: 0.068, foreTop: 0.063, foreBottom: 0.058, cuff: [0.057, 0.02], hand: 0.07, handDrop: 0.052 },
      outfit: 'hoodie',
      // capsule radius, length, scale, position under the ankle: the upper and the sole
      feet: { upper: [0.074, 0.13, [0.96, 0.74, 1], [0, -0.035, 0.05]], sole: [0.078, 0.135, [1.02, 0.3, 1.02], [0, -0.075, 0.05]] },
      // hairline elevation by azimuth: base + front·cos φ + twice·cos 2φ − dips (deg), each dip [at°, depth°, width°]:
      // a short sideburn in front of each ear and three soft points at the nape
      hair: { line: [6, 35, -6], dips: [[74, 16, 11], [180, 9, 8], [152, 9, 8]], thick: [0.075, 0.012], clumps: KIP_CLUMPS, bun: null },
      face: { lashes: false, brow: 0.042 },
      fit: null,                                          // studio.frame() defaults are Kip's
      colorway: 'sunny',
    },
    mom: {
      R: 0.35,
      thigh: 0.29, shin: 0.28, ankle: 0.072,
      hipX: 0.098, spineY: 0.67,
      shoulderX: 0.232, shoulderY: 1.1, upper: 0.215, fore: 0.19,
      neckY: 1.21, headY: 1.53, headScale: [1, 0.94, 0.97],
      // the cardigan: a waist at 0.82 and a hem that flares out a little
      torso: [
        [0, 0.575], [0.16, 0.575], [0.24, 0.582], [0.268, 0.6], [0.272, 0.635], [0.256, 0.71], [0.232, 0.8],
        [0.228, 0.87], [0.242, 0.96], [0.243, 1.04], [0.226, 1.12], [0.188, 1.18], [0.134, 1.225], [0.07, 1.248], [0, 1.255],
      ],
      torsoDepth: 0.78,
      hem: { r: 0.268, tube: 0.022, y: 0.6 },
      // the cardigan falls open: half-angle (rad) at the hem and at the neckline, and the height it reaches;
      // the collar ring: radius, tube, height, backward tilt
      opening: [0.28, 0.46, 1.2],
      collar: [0.165, 0.045, 1.235, 0.3],
      pelvis: { r: 0.18, scale: [1, 0.55, 0.8] },
      limb: { thigh: 0.08, shin: 0.075, upper: 0.062, foreTop: 0.058, foreBottom: 0.053, cuff: [0.052, 0.018], hand: 0.064, handDrop: 0.048 },
      outfit: 'cardigan',
      // soft slippers, lower than sneakers
      feet: { upper: [0.077, 0.12, [0.98, 0.62, 1], [0, -0.03, 0.045]], sole: [0.073, 0.125, [1.02, 0.22, 1.02], [0, -0.056, 0.045]] },
      // hair pulled back into a bun: no nape points, a small dip in front of each ear
      hair: {
        line: [4, 34, -8], dips: [[74, 8, 12]], thick: [0.06, 0.01],
        clumps: [
          // the fringe, swept from a part on her left across the forehead to her right temple
          { pts: [[30, 62, 0.99], [8, 50, 1.055], [-18, 40, 1.07], [-42, 31, 1.065], [-62, 24, 1.045]], w: 0.24, flat: 0.4 },
          // the short side, toward her left temple
          { pts: [[34, 62, 0.99], [52, 48, 1.05], [64, 36, 1.045]], w: 0.13, flat: 0.45 },
          // one loose strand framing her face on the right
          { pts: [[-66, 26, 1.0], [-74, 8, 1.04], [-78, -10, 1.035]], w: 0.07, flat: 0.6 },
          // the rest swept up into the bun: three from the nape, one over each ear
          { pts: [[180, -28, 1.0], [180, 0, 1.055], [180, 28, 1.075], [180, 46, 1.08]], w: 0.2, flat: 0.3 },
          { pts: [[150, -22, 1.0], [158, 5, 1.05], [168, 30, 1.07], [174, 46, 1.075]], w: 0.17, flat: 0.3 },
          { pts: [[210, -22, 1.0], [202, 5, 1.05], [192, 30, 1.07], [186, 46, 1.075]], w: 0.17, flat: 0.3 },
          { pts: [[100, 14, 1.0], [125, 22, 1.05], [150, 34, 1.07], [168, 48, 1.075]], w: 0.13, flat: 0.3 },
          { pts: [[-100, 14, 1.0], [-125, 22, 1.05], [-150, 34, 1.07], [-168, 48, 1.075]], w: 0.13, flat: 0.3 },
        ],
        bun: { at: [180, 56, 1.14], r: 0.13, scale: [1, 0.9, 0.95], band: [0.085, 0.016] },
      },
      face: { lashes: true, brow: 0.034 },
      earrings: { r: 0.022, color: '#E3B34C' },
      mats: { shoes: { roughness: 0.92, sheen: 0.7, sheenRoughness: 0.6, clearcoat: 0 } },
      fit: { y: 0.98, h: 2.42, w: 1.9, lift: 0.13, faceY: 1.55, faceH: 1.02, faceW: 0.97 },
      colorway: 'teal',
    },
  };

  // Colours by design. Mom's keys follow Kip's slots: hoodie = her cardigan, strings = her cream top,
  // shoes and sole = her slippers, band = her hair tie.
  const COLORWAYS = {
    sunny:     { label: 'Sunny',     hoodie: '#FFB833', trim: '#EC9A1A', pants: '#2E3859', shoes: '#F3EFE7', sole: '#CEC5B5', strings: '#FFF7E8', hair: '#3A2820', skin: '#E0A378' },
    tangerine: { label: 'Tangerine', hoodie: '#FF7B36', trim: '#E1601F', pants: '#2B2F3B', shoes: '#F3EFE7', sole: '#CEC5B5', strings: '#FFF3EA', hair: '#3A2820', skin: '#E0A378' },
    sky:       { label: 'Sky',       hoodie: '#4C8DFF', trim: '#3170E2', pants: '#2A2E3B', shoes: '#F3EFE7', sole: '#C9CDD6', strings: '#F4F7FF', hair: '#3A2820', skin: '#E0A378' },
    mint:      { label: 'Mint',      hoodie: '#38C88F', trim: '#22A774', pants: '#2B3140', shoes: '#F3EFE7', sole: '#C8CFC9', strings: '#F1FFF8', hair: '#3A2820', skin: '#E0A378' },
  };
  const DESIGN_COLORWAYS = {
    mom: {
      teal: { label: 'Teal', hoodie: '#2FA39A', trim: '#23867E', strings: '#F1E9DC', pants: '#3A3D46', shoes: '#A9ABB0', sole: '#7E8187', hair: '#3A2820', skin: '#E0A378', band: '#2FA39A', ink: { lip: '#9E4450' } },
    },
  };
  // Face paint shared by every colorway (a colorway may override any of these under `ink`).
  const INK = { eye: '#1F1512', mouth: '#5B2421', tongue: '#E6766B', teeth: '#FFFDF7', cheek: '#F07A6A' };

  // Face dials. Every expression is a set of these, so any two blend smoothly, and lip-sync is
  // just mouthOpen / mouthRound over time. mustache 0–1 draws one on, left to right, like a marker.
  const FACE = {
    eyeOpen: 1, eyeScale: 1, lookX: 0, lookY: 0, lid: 0, lidSlant: 0, happy: 0,
    browUp: 0, browTilt: 0, browAsym: 0,
    mouthCurve: 0.3, mouthOpen: 0, mouthWide: 1, mouthRound: 0, mouthSkew: 0, teeth: 0, blush: 0.35,
    mustache: 0,
  };
  const FACE_KEYS = Object.keys(FACE);

  const EXPRESSIONS = {
    neutral:    {},
    happy:      { happy: 0.7, browUp: 0.25, mouthCurve: 0.9, mouthOpen: 0.42, mouthWide: 1.12, teeth: 0.8, blush: 0.55 },
    laugh:      { happy: 1, browUp: 0.45, mouthCurve: 1, mouthOpen: 0.85, mouthWide: 1.22, teeth: 0.8, blush: 0.75 },
    surprised:  { eyeScale: 1.18, browUp: 1, mouthCurve: 0, mouthOpen: 0.75, mouthRound: 1, mouthWide: 0.9 },
    sad:        { lid: 0.22, lidSlant: -0.8, lookY: -0.45, browUp: 0.15, browTilt: -1, mouthCurve: -0.75, blush: 0.15 },
    angry:      { lid: 0.28, lidSlant: 1, browUp: -0.55, browTilt: 1, mouthCurve: -0.6, mouthOpen: 0.55, mouthWide: 1.1, teeth: 1 },
    determined: { lid: 0.16, lidSlant: 0.55, browUp: -0.3, browTilt: 0.7, mouthCurve: 0.3, mouthSkew: 0.5, mouthWide: 0.95 },
    unsure:     { lookX: 0.55, lookY: 0.35, browAsym: 0.85, mouthCurve: -0.15, mouthSkew: -0.6, mouthWide: 0.85 },
    worried:    { eyeScale: 0.95, browUp: 0.5, browTilt: -0.9, mouthCurve: -0.35, mouthOpen: 0.12, mouthWide: 0.8 },
    sleepy:     { eyeOpen: 0.12, browUp: -0.25, mouthCurve: 0.1, mouthWide: 0.8, blush: 0.25 },
  };

  // Poses: Euler degrees [x, y, z] per joint. Arms and legs turn in XZY order (twist, then out,
  // then swing): negative x swings forward, positive z swings out. Right-side values are written
  // mirrored, as if for the left side, so a symmetric pose has the same numbers on both sides.
  // Elbows bend forward with negative x; knees bend back with positive x; feet point toes down
  // with positive x; spine and head lean forward / nod down with positive x.
  const REST = {
    hipsY: 0, hips: [0, 0, 0], spine: [2, 0, 0], head: [0, 0, 0],
    armL: [-3, 0, 9], elbowL: [-12, 0, 0], armR: [-3, 0, 9], elbowR: [-12, 0, 0],
    legL: [0, 0, 1.5], kneeL: 0, footL: 0, legR: [0, 0, 1.5], kneeR: 0, footR: 0,
  };
  const POSES = {
    idle:  {},
    wave:  { armR: [-14, 0, 102], elbowR: [0, 0, 64], head: [-3, -8, -5], spine: [0, 0, 2] },
    point: { armL: [-80, 0, 20], elbowL: [-4, 0, 0], armR: [6, 0, 8], head: [-4, 16, 0], spine: [0, 10, 0] },
    think: { armR: [-55, 0, -25], elbowR: [-120, 0, 0], armL: [-24, 0, -6], elbowL: [-88, 0, 0], head: [5, 8, 10], spine: [3, 0, 0] },
    shrug: { armL: [-18, 0, 36], elbowL: [-78, 0, 20], armR: [-18, 0, 36], elbowR: [-78, 0, 20], head: [0, 0, 9] },
    cheer: { armL: [-8, 0, 146], elbowL: [-14, 0, 0], armR: [-8, 0, 146], elbowR: [-14, 0, 0], head: [-10, 0, 0], spine: [-4, 0, 0] },
    walk:  {
      hipsY: -0.042, spine: [5, -6, 0], head: [-3, 5, 0],
      legL: [-24, 0, 0], kneeL: 6, footL: -12, legR: [24, 0, 0], kneeR: 6, footR: 12,
      armL: [18, 0, 8], elbowL: [-14, 0, 0], armR: [-18, 0, 8], elbowR: [-26, 0, 0],
    },
    // Seated poses keep the hips at standing height: put the character on a seat with sitOn(). Hands that hold
    // something are placed with solve() (IK); the arm numbers here are only a starting point.
    sit:   {
      spine: [4, 0, 0], legL: [-88, 0, 5], kneeL: 92, footL: 12, legR: [-86, 0, 6], kneeR: 90, footR: 10,
      armL: [-30, 0, 12], elbowL: [-46, 0, 0], armR: [-28, 0, 12], elbowR: [-50, 0, 0],
    },
    game:  {
      spine: [12, 0, 0], head: [-9, 0, 0], legL: [-88, 0, 5], kneeL: 92, footL: 12, legR: [-86, 0, 6], kneeR: 90, footR: 10,
      armL: [-42, -24, 12], elbowL: [-78, 0, 0], armR: [-40, -24, 12], elbowR: [-80, 0, 0],
    },
    // a ghost hanging in the air: legs loose, toes down, arms a little out, never quite symmetric
    float: {
      spine: [1, 0, 0], legL: [-10, 0, 2], kneeL: 22, footL: 32, legR: [-3, 0, 2], kneeR: 14, footR: 26,
      armL: [-8, 0, 22], elbowL: [-22, 0, 0], armR: [-5, 0, 26], elbowR: [-14, 0, 0],
    },
  };

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const rgba = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  };

  function resolvePose(p) {
    const src = typeof p === 'string' ? POSES[p] : p;
    if (typeof p === 'string' && !src) throw new Error('Mascot: unknown pose "' + p + '"');
    return Object.assign(clone(REST), clone(src || {}));
  }
  function resolveFace(e) {
    const src = typeof e === 'string' ? EXPRESSIONS[e] : e;
    if (typeof e === 'string' && !src) throw new Error('Mascot: unknown expression "' + e + '"');
    return Object.assign({}, FACE, src || {});
  }
  function mixPose(a, b, t) {
    a = resolvePose(a); b = resolvePose(b);
    const out = {};
    for (const k in a) out[k] = Array.isArray(a[k]) ? a[k].map((v, i) => lerp(v, b[k][i], t)) : lerp(a[k], b[k], t);
    return out;
  }
  function mixFace(a, b, t) {
    a = resolveFace(a); b = resolveFace(b);
    const out = {};
    for (const k of FACE_KEYS) out[k] = lerp(a[k], b[k], t);
    return out;
  }

  // ---------- geometry ----------

  // A capsule hanging down from its pivot: the top cap is centred on the joint, the bottom cap
  // on the next joint, so bends stay round and seamless.
  function limb(THREE, r, len) {
    const g = new THREE.CapsuleGeometry(r, len, 10, 28);
    g.translate(0, -len / 2, 0);
    return g;
  }

  // The head is two half spheres. The front half is UV-mapped straight from the front, so the
  // face canvas paints on exactly as drawn; the back half samples a plain skin corner.
  function headGeometries(THREE, R) {
    const front = new THREE.SphereGeometry(R, 64, 56, 0, Math.PI);
    const p = front.attributes.position, uv = front.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, 0.5 + p.getX(i) / (2 * R), 0.5 + p.getY(i) / (2 * R));
    const back = new THREE.SphereGeometry(R, 64, 56, Math.PI, Math.PI);
    const bu = back.attributes.uv;
    for (let i = 0; i < bu.count; i++) bu.setXY(i, 0.003, 0.003);
    return [front, back];
  }

  function hairline(hair, phi) {
    const deg = Math.abs(Math.atan2(Math.sin(phi), Math.cos(phi))) / DEG;
    let dips = 0;
    for (const [at, depth, width] of hair.dips) dips += depth * Math.exp(-Math.pow((deg - at) / width, 2));
    const [base, front, twice] = hair.line;
    return (base + front * Math.cos(phi) + twice * Math.cos(2 * phi) - dips) * DEG;
  }
  // A cap from the crown (s = 0) down to the hairline (s = 1) that thins to almost nothing at its
  // edge, so the hair meets the skin softly instead of as a shell.
  function hairCapGeometry(THREE, R, hair) {
    const thick = (s) => lerp(hair.thick[0], hair.thick[1], smooth(0.45, 1, s));
    const NA = 144, NS = 30, pos = [0, R * (1 + thick(0)), 0], idx = [];
    for (let j = 1; j <= NS; j++) {
      const s = j / NS;
      for (let i = 0; i < NA; i++) {
        const phi = (i / NA) * Math.PI * 2;
        const e = Math.PI / 2 - s * (Math.PI / 2 - hairline(hair, phi));
        const r = R * (1 + thick(s));
        pos.push(r * Math.sin(phi) * Math.cos(e), r * Math.sin(e), r * Math.cos(phi) * Math.cos(e));
      }
    }
    for (let i = 0; i < NA; i++) idx.push(0, 1 + i, 1 + ((i + 1) % NA));
    for (let j = 1; j < NS; j++) {
      const a = 1 + (j - 1) * NA, b = 1 + j * NA;
      for (let i = 0; i < NA; i++) {
        const k = (i + 1) % NA;
        idx.push(a + i, b + i, b + k, a + i, b + k, a + k);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  // The radius of a lathe profile at height y, between its two axis ends.
  function radiusAt(profile, y) {
    const pts = profile.filter(([x]) => x > 0);
    if (y <= pts[0][1]) return pts[0][0];
    for (let i = 1; i < pts.length; i++) {
      if (y <= pts[i][1]) return lerp(pts[i - 1][0], pts[i][0], (y - pts[i - 1][1]) / (pts[i][1] - pts[i - 1][1]));
    }
    return pts[pts.length - 1][0];
  }
  // A strip of the torso's own surface around the front, from y0 to y1, its half-angle open(y) changing with
  // height, pushed out by k so it sits just proud of the torso.
  function frontPanelGeometry(THREE, profile, depth, y0, y1, open, k) {
    const rows = 40, cols = 16, pos = [], idx = [];
    for (let i = 0; i <= rows; i++) {
      const y = lerp(y0, y1, i / rows), r = radiusAt(profile, y) * k, a = open(y);
      for (let j = 0; j <= cols; j++) {
        const phi = lerp(-a, a, j / cols);
        pos.push(Math.sin(phi) * r, y, Math.cos(phi) * r * depth);
      }
    }
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const a = i * (cols + 1) + j, b = a + 1, c = a + cols + 1, d = c + 1;
        idx.push(a, b, c, b, d, c);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  function onHead(THREE, R, [phi, e, k]) {
    const p = phi * DEG, el = e * DEG, r = R * k;
    return new THREE.Vector3(r * Math.sin(p) * Math.cos(el), r * Math.sin(el), r * Math.cos(p) * Math.cos(el));
  }
  // A hair clump: a flattened, tapered ribbon along a curve over the head, wide across the head and
  // thin away from it, rounded at the root and the tip.
  function clumpGeometry(THREE, pts, w0, flat) {
    const curve = new THREE.CatmullRomCurve3(pts);
    const segs = 44, radial = 24;
    const P = new THREE.Vector3(), T = new THREE.Vector3(), U = new THREE.Vector3();
    const S = new THREE.Vector3(), V = new THREE.Vector3();
    const pos = [], idx = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      curve.getPointAt(t, P);
      curve.getTangentAt(t, T);
      U.copy(P).normalize();                 // out of the head (the skull is centred on the origin)
      S.crossVectors(T, U).normalize();      // across the clump, along the head
      V.crossVectors(S, T).normalize();      // the clump's thickness
      let w = w0 * (1 - 0.8 * t);
      if (t < 0.12) w *= Math.sqrt(1 - Math.pow(1 - t / 0.12, 2));
      if (t > 0.86) w *= Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.86) / 0.14, 2)));
      w = Math.max(w, 1e-4);
      const h = w * flat;
      for (let j = 0; j < radial; j++) {
        const a = (j / radial) * Math.PI * 2, c = Math.cos(a) * w, s = Math.sin(a) * h;
        pos.push(P.x + S.x * c + V.x * s, P.y + S.y * c + V.y * s, P.z + S.z * c + V.z * s);
      }
    }
    for (let i = 0; i < segs; i++) {
      for (let j = 0; j < radial; j++) {
        const a = i * radial + j, b = i * radial + ((j + 1) % radial), c = a + radial, d = b + radial;
        idx.push(a, c, b, b, c, d);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  // ---------- face paint ----------

  function makeCanvas(size) {
    if (typeof document !== 'undefined') {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      return c;
    }
    return new OffscreenCanvas(size, size);
  }

  // Paints the face in head units: x, y in multiples of R, seen from the front. The same strokes
  // run twice: once for colour, once for the roughness map (glossy eyes, matte skin).
  function drawFace(ctx, S, f, cw, rough, look) {
    const u = S / 2;
    const X = (x) => u + x * u, Y = (y) => u - y * u, L = (v) => v * u;
    const grey = (v) => { const c = Math.round(v * 255); return 'rgb(' + c + ',' + c + ',' + c + ')'; };
    const ink = Object.assign({}, INK, cw.ink || {});
    const col = rough
      ? { skin: grey(0.62), eye: grey(0.14), shine: grey(0.14), brow: grey(0.8), mouth: grey(0.4), tongue: grey(0.42), teeth: grey(0.3), stache: grey(0.7), lip: grey(0.14) }
      : { skin: cw.skin, eye: ink.eye, shine: '#ffffff', brow: cw.hair, mouth: ink.mouth, tongue: ink.tongue, teeth: ink.teeth, stache: ink.eye, lip: ink.lip || ink.eye };

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = col.skin;
    ctx.fillRect(0, 0, S, S);

    // Clip to everything except the shape fn draws.
    const clipOut = (fn) => { ctx.beginPath(); ctx.rect(0, 0, S, S); fn(); ctx.clip('evenodd'); };

    if (!rough && f.blush > 0.005) {
      for (const s of [-1, 1]) {
        ctx.save();
        ctx.translate(X(s * 0.5), Y(-0.15));
        ctx.scale(1.3, 0.78);
        const r = L(0.14), g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        g.addColorStop(0, rgba(ink.cheek, 0.5 * clamp(f.blush, 0, 1)));
        g.addColorStop(1, rgba(ink.cheek, 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }

    for (const s of [-1, 1]) {
      // Eyes: dark ovals with a catchlight. The upper lid slants for angry / sad, the lower lid
      // pushes up into a crescent for a smile, and eyeOpen squashes the oval for blinks.
      const ex = s * 0.31 + f.lookX * 0.035, ey = -0.01 + f.lookY * 0.03;
      const rx = 0.088 * f.eyeScale, ry0 = 0.128 * f.eyeScale;
      const ry = ry0 * clamp(f.eyeOpen, 0, 1.3);
      ctx.save();
      if (f.lid > 0.001 || Math.abs(f.lidSlant) > 0.001) {
        const top = ey + ry0, yl = top - f.lid * 2 * ry0, k = s * f.lidSlant * 0.6;
        const x0 = ex - 0.25, x1 = ex + 0.25;
        clipOut(() => {
          ctx.moveTo(X(x0), Y(yl + k * (x0 - ex)));
          ctx.lineTo(X(x1), Y(yl + k * (x1 - ex)));
          ctx.lineTo(X(x1), Y(top + 0.4));
          ctx.lineTo(X(x0), Y(top + 0.4));
          ctx.closePath();
        });
      }
      if (f.happy > 0.001) {
        const off = lerp(2.3, 0.42, clamp(f.happy, 0, 1)) * ry0;
        clipOut(() => {
          ctx.moveTo(X(ex + rx * 1.3), Y(ey - off));
          ctx.ellipse(X(ex), Y(ey - off), L(rx * 1.3), L(ry0 * 1.08), 0, 0, Math.PI * 2);
        });
      }
      if (ry < ry0 * 0.12) {
        ctx.strokeStyle = col.eye; ctx.lineWidth = L(0.03); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(X(ex - rx), Y(ey));
        ctx.quadraticCurveTo(X(ex), Y(ey - 0.035), X(ex + rx), Y(ey)); ctx.stroke();
      } else {
        ctx.fillStyle = col.eye;
        ctx.beginPath(); ctx.ellipse(X(ex), Y(ey), L(rx), L(ry), 0, 0, Math.PI * 2); ctx.fill();
        if (f.eyeOpen > 0.55 && f.happy < 0.45) {
          ctx.fillStyle = col.shine;
          ctx.beginPath(); ctx.arc(X(ex + rx * 0.32), Y(ey + ry * 0.42), L(0.027 * f.eyeScale), 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();

      // Lashes (designs that have them): two short flicks off the outer top of each eye; on a closed or
      // nearly closed eye they droop from the outer end of the lid line instead.
      if (look.lashes) {
        ctx.strokeStyle = col.eye; ctx.lineWidth = L(0.018); ctx.lineCap = 'round';
        const lift = f.happy > 0.45 ? 0.3 : 0;
        const flicks = ry < ry0 * 0.35
          ? [[0.86, ey - 0.006, 1.22, ey - 0.05], [0.5, ey - 0.024, 0.7, ey - 0.072]]
          : [[0.78, ey + ry * (0.55 - lift), 1.28, ey + ry * (0.9 - lift)], [0.4, ey + ry * (0.9 - lift), 0.72, ey + ry * (1.3 - lift)]];
        for (const [a, y1, c, y2] of flicks) {
          ctx.beginPath();
          ctx.moveTo(X(ex + s * rx * a), Y(y1));
          ctx.quadraticCurveTo(X(ex + s * rx * (a + c) * 0.5), Y((y1 + y2) * 0.5 + 0.004), X(ex + s * rx * c), Y(y2));
          ctx.stroke();
        }
      }

      // Brows: short round strokes in the hair colour.
      const bx = s * 0.31 + f.lookX * 0.012, by = 0.235 + f.browUp * 0.06 + f.browAsym * s * 0.055;
      const half = 0.09, tilt = f.browTilt * 0.045;
      const yi = by - tilt, yo = by + tilt * 0.4;
      ctx.strokeStyle = col.brow; ctx.lineWidth = L(look.brow); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(X(bx - s * half), Y(yi));
      ctx.quadraticCurveTo(X(bx), Y(Math.max(yi, yo) + 0.022), X(bx + s * half), Y(yo)); ctx.stroke();
    }

    // Mouth: a curved line when closed; open, an upper and a lower lip curve with teeth and tongue inside.
    const open = clamp(f.mouthOpen, 0, 1), round = clamp(f.mouthRound, 0, 1), curve = f.mouthCurve;
    const my = -0.27, w = 0.115 * f.mouthWide * (1 - 0.42 * round);
    const yl = my + curve * 0.045 - f.mouthSkew * 0.03, yr = my + curve * 0.045 + f.mouthSkew * 0.03;
    if (open < 0.04) {
      const dip = curve * 0.055;
      ctx.strokeStyle = col.lip; ctx.lineWidth = L(0.034); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(X(-w), Y(yl));
      ctx.bezierCurveTo(X(-w * 0.45), Y(my - dip), X(w * 0.45), Y(my - dip), X(w), Y(yr)); ctx.stroke();
    } else {
      const cy = (yl + yr) / 2;
      // a frown lifts the middle of the mouth: the upper lip arches, the lower lip comes up
      const frown = Math.max(-curve, 0);
      const up = open * (0.02 + 0.09 * round + 0.12 * frown);
      const down = open * ((0.24 + 0.08 * Math.max(curve, 0)) * (1 - round) + 0.11 * round) * (1 - 0.6 * frown);
      const ctop = cy + up / 0.75, cbot = cy - down / 0.75;
      const ux = 0.3 + 0.7 * round, dx = 0.78 + 0.22 * round;
      const lips = () => {
        ctx.beginPath(); ctx.moveTo(X(-w), Y(yl));
        ctx.bezierCurveTo(X(-w * ux), Y(ctop), X(w * ux), Y(ctop), X(w), Y(yr));
        ctx.bezierCurveTo(X(w * dx), Y(cbot), X(-w * dx), Y(cbot), X(-w), Y(yl));
        ctx.closePath();
      };
      ctx.fillStyle = col.mouth; lips(); ctx.fill();
      ctx.save(); lips(); ctx.clip();
      if (open > 0.3) {
        ctx.fillStyle = col.tongue;
        ctx.beginPath(); ctx.ellipse(X(0), Y(cy - down * 0.95), L(w * 0.6), L(down * 0.5), 0, 0, Math.PI * 2); ctx.fill();
      }
      if (f.teeth > 0.01 && open > 0.1) {
        const th = Math.min(0.034, down * 0.3) * clamp(f.teeth, 0, 1);
        ctx.fillStyle = col.teeth;
        ctx.fillRect(X(-w - 0.02), Y(cy + up + 0.06), L(2 * w + 0.04), L(up + 0.06 + th));
      }
      ctx.restore();
    }

    // Mustache: a curly handlebar between the eyes and the mouth, revealed left to right as the dial runs.
    if (f.mustache > 0.001) {
      ctx.save();
      ctx.beginPath(); ctx.rect(X(-0.24), Y(0), L(0.48 * clamp(f.mustache, 0, 1)), L(0.4)); ctx.clip();
      ctx.fillStyle = col.stache;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(X(0), Y(-0.15));
        ctx.bezierCurveTo(X(s * 0.06), Y(-0.125), X(s * 0.12), Y(-0.13), X(s * 0.165), Y(-0.115));
        ctx.bezierCurveTo(X(s * 0.205), Y(-0.1), X(s * 0.205), Y(-0.06), X(s * 0.175), Y(-0.06));
        ctx.bezierCurveTo(X(s * 0.16), Y(-0.06), X(s * 0.165), Y(-0.08), X(s * 0.175), Y(-0.085));
        ctx.bezierCurveTo(X(s * 0.15), Y(-0.15), X(s * 0.08), Y(-0.195), X(0), Y(-0.17));
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // ---------- the character ----------

  function create(THREE, opts) {
    opts = opts || {};
    const designName = opts.design || 'kip';
    const d = DESIGNS[designName];
    if (!d) throw new Error('Mascot: unknown design "' + designName + '"');
    const R = d.R;
    const HIP_Y = d.thigh + d.shin + d.ankle;
    const FS = opts.faceSize || 1024;
    const seed = opts.seed || 1;
    const palette = Object.assign({}, COLORWAYS, DESIGN_COLORWAYS[designName] || {});
    const pickColorway = (c) => Object.assign({}, palette[d.colorway], typeof c === 'string' ? palette[c] : c);
    let cw = pickColorway(opts.colorway || d.colorway);

    const M = (o) => new THREE.MeshPhysicalMaterial(o);
    const mats = {
      hoodie: M({ roughness: 0.8, sheen: 0.6, sheenRoughness: 0.5 }),
      trim: M({ roughness: 0.82, sheen: 0.45, sheenRoughness: 0.55 }),
      pants: M({ roughness: 0.86, sheen: 0.35, sheenRoughness: 0.6 }),
      shoes: M({ roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.45 }),
      sole: M({ roughness: 0.7 }),
      strings: M({ roughness: 0.7 }),
      hair: M({ roughness: 0.64, sheen: 0.5, sheenRoughness: 0.4, side: THREE.DoubleSide }),
      skin: M({ roughness: 0.62, sheen: 0.15, sheenRoughness: 0.7 }),
    };
    if (d.hair.bun) mats.band = M({ roughness: 0.6, sheen: 0.4, sheenRoughness: 0.5 });
    for (const k in d.mats || {}) Object.assign(mats[k], d.mats[k]);
    const faceCanvas = makeCanvas(FS), roughCanvas = makeCanvas(FS);
    const faceTex = new THREE.CanvasTexture(faceCanvas);
    faceTex.colorSpace = THREE.SRGBColorSpace;
    faceTex.anisotropy = 8;
    const roughTex = new THREE.CanvasTexture(roughCanvas);
    mats.face = M({ roughness: 1, map: faceTex, roughnessMap: roughTex, sheen: 0.15, sheenRoughness: 0.7 });

    const mesh = (g, m) => new THREE.Mesh(g, m);
    const group = (parent, x, y, z, order) => {
      const o = new THREE.Group();
      o.position.set(x, y, z);
      if (order) o.rotation.order = order;
      parent.add(o);
      return o;
    };

    const root = new THREE.Group();
    root.name = designName;
    const J = {};

    J.hips = group(root, 0, HIP_Y, 0);
    const pelvis = mesh(new THREE.SphereGeometry(d.pelvis.r, 32, 20), mats.pants);
    pelvis.scale.set(d.pelvis.scale[0], d.pelvis.scale[1], d.pelvis.scale[2]);
    J.hips.add(pelvis);

    for (const s of [1, -1]) {
      const side = s > 0 ? 'L' : 'R';
      const leg = group(J.hips, s * d.hipX, 0, 0, 'XZY');
      leg.add(mesh(limb(THREE, d.limb.thigh, d.thigh), mats.pants));
      const knee = group(leg, 0, -d.thigh, 0);
      knee.add(mesh(limb(THREE, d.limb.shin, d.shin), mats.pants));
      const foot = group(knee, 0, -d.shin, 0);
      for (const [part, mat] of [['upper', mats.shoes], ['sole', mats.sole]]) {
        const [r, len, sc, at] = d.feet[part];
        const g = new THREE.CapsuleGeometry(r, len, 8, 28);
        g.rotateX(Math.PI / 2);
        const m = mesh(g, mat);
        m.scale.set(sc[0], sc[1], sc[2]);
        m.position.set(at[0], at[1], at[2]);
        foot.add(m);
      }
      J['leg' + side] = leg; J['knee' + side] = knee; J['foot' + side] = foot;
    }

    J.spine = group(J.hips, 0, d.spineY - HIP_Y, 0);
    // Torso parts are modelled in standing coordinates, then hung on the spine pivot.
    const body = (g, m) => { const o = mesh(g, m); o.position.y = -d.spineY; J.spine.add(o); return o; };
    const profile = d.torso.map(([x, y]) => new THREE.Vector2(x, y));
    const torsoG = new THREE.LatheGeometry(profile, 72);
    torsoG.scale(1, 1, d.torsoDepth);
    body(torsoG, mats.hoodie);
    const hemG = new THREE.TorusGeometry(d.hem.r, d.hem.tube, 14, 72);
    hemG.rotateX(Math.PI / 2); hemG.scale(1, 1, d.torsoDepth); hemG.translate(0, d.hem.y, 0);
    body(hemG, mats.trim);
    if (d.outfit === 'hoodie') {
      // The hood, down: a soft collar ring around the base of the head, higher at the back.
      const hoodG = new THREE.TorusGeometry(0.168, 0.068, 18, 56);
      hoodG.scale(1, 0.9, 1); hoodG.rotateX(Math.PI / 2 + 0.38); hoodG.translate(0, 1.055, -0.015);
      body(hoodG, mats.hoodie);
      for (const s of [1, -1]) {
        const strG = new THREE.CapsuleGeometry(0.0105, 0.11, 4, 10);
        strG.translate(0, -0.055, 0);
        const str = mesh(strG, mats.strings);
        str.position.set(s * 0.05, 1.03 - d.spineY, 0.2);
        str.rotation.x = -0.15;
        const tip = mesh(new THREE.CapsuleGeometry(0.0135, 0.022, 4, 10), mats.strings);
        tip.position.y = -0.125;
        str.add(tip);
        J.spine.add(str);
      }
    } else if (d.outfit === 'cardigan') {
      // An open cardigan: the cream top shows down the front as a strip of the torso's own surface, opening
      // wider toward the neck; both edges get a knitted band, and a soft collar sits around the head.
      const [o0, o1, y1] = d.opening, y0 = d.hem.y;
      const open = (y) => lerp(o0, o1, smooth(y0, y1, y));
      body(frontPanelGeometry(THREE, d.torso, d.torsoDepth, y0, y1, open, 1.008), mats.strings);
      for (const s of [1, -1]) {
        const pts = [];
        for (let i = 0; i <= 24; i++) {
          const y = lerp(y0 + 0.02, y1, i / 24), r = radiusAt(d.torso, y) * 1.012, a = s * open(y);
          pts.push(new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r * d.torsoDepth));
        }
        body(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.018, 10), mats.hoodie);
      }
      const [cr, ct, cy, tilt] = d.collar;
      const collarG = new THREE.TorusGeometry(cr, ct, 16, 56);
      collarG.scale(1, 0.9, 1); collarG.rotateX(Math.PI / 2 + tilt); collarG.translate(0, cy, -0.01);
      body(collarG, mats.hoodie);
    }

    for (const s of [1, -1]) {
      const side = s > 0 ? 'L' : 'R';
      const arm = group(J.spine, s * d.shoulderX, d.shoulderY - d.spineY, 0, 'XZY');
      arm.add(mesh(limb(THREE, d.limb.upper, d.upper), mats.hoodie));
      const elbow = group(arm, 0, -d.upper, 0, 'XZY');
      const foreG = new THREE.CylinderGeometry(d.limb.foreTop, d.limb.foreBottom, d.fore, 28);
      foreG.translate(0, -d.fore / 2, 0);
      elbow.add(mesh(foreG, mats.hoodie));
      const cuffG = new THREE.TorusGeometry(d.limb.cuff[0], d.limb.cuff[1], 12, 36);
      cuffG.rotateX(Math.PI / 2); cuffG.translate(0, -d.fore + 0.006, 0);
      elbow.add(mesh(cuffG, mats.trim));
      const hand = group(elbow, 0, -d.fore, 0);
      const ball = mesh(new THREE.SphereGeometry(d.limb.hand, 32, 24), mats.skin);
      ball.position.y = -d.limb.handDrop;
      hand.add(ball);
      J['arm' + side] = arm; J['elbow' + side] = elbow; J['hand' + side] = hand;
    }

    J.head = group(J.spine, 0, d.neckY - d.spineY, 0);
    const skull = group(J.head, 0, d.headY - d.neckY, 0);
    skull.scale.set(d.headScale[0], d.headScale[1], d.headScale[2]);
    const [frontG, backHeadG] = headGeometries(THREE, R);
    skull.add(mesh(frontG, mats.face), mesh(backHeadG, mats.face));
    skull.add(mesh(hairCapGeometry(THREE, R, d.hair), mats.hair));
    for (const c of d.hair.clumps) {
      skull.add(mesh(clumpGeometry(THREE, c.pts.map((p) => onHead(THREE, R, p)), c.w * R, c.flat), mats.hair));
    }
    if (d.hair.bun) {
      // A round bun at the back of the crown, tied off with a band where it meets the head.
      const bun = d.hair.bun, at = onHead(THREE, R, bun.at), n = at.clone().normalize();
      const ball = mesh(new THREE.SphereGeometry(bun.r, 40, 30), mats.hair);
      ball.scale.set(bun.scale[0], bun.scale[1], bun.scale[2]);
      ball.position.copy(at);
      skull.add(ball);
      const band = mesh(new THREE.TorusGeometry(bun.band[0], bun.band[1], 12, 40), mats.band);
      band.position.copy(at).addScaledVector(n, -bun.r * 0.55);
      band.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
      skull.add(band);
    }
    for (const s of [1, -1]) {
      const ear = mesh(new THREE.SphereGeometry(R * 0.22, 24, 18), mats.skin);
      ear.scale.set(0.42, 0.72, 0.58);
      ear.position.set(s * R * 0.975, -R * 0.06, -R * 0.04);
      ear.rotation.y = -s * 0.25;
      skull.add(ear);
    }
    if (d.earrings) {
      // small gold studs on the earlobes
      mats.earrings = M({ color: d.earrings.color, metalness: 1, roughness: 0.3 });
      for (const s of [1, -1]) {
        const stud = mesh(new THREE.SphereGeometry(d.earrings.r, 16, 12), mats.earrings);
        stud.position.set(s * R * 0.99, -R * 0.06 - R * 0.22 * 0.72 * 0.9, -R * 0.03);
        skull.add(stud);
      }
    }

    root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

    // ---------- state ----------

    let pose = resolvePose('idle');
    let face = resolveFace('neutral');
    let faceKey = '';

    function recolor() {
      const tint = (hex, k) => new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), k);
      mats.hoodie.color.set(cw.hoodie); mats.hoodie.sheenColor.copy(tint(cw.hoodie, 0.45));
      mats.trim.color.set(cw.trim); mats.trim.sheenColor.copy(tint(cw.trim, 0.4));
      mats.pants.color.set(cw.pants); mats.pants.sheenColor.copy(tint(cw.pants, 0.35));
      mats.shoes.color.set(cw.shoes); mats.shoes.sheenColor.copy(tint(cw.shoes, 0.4));
      mats.sole.color.set(cw.sole);
      mats.strings.color.set(cw.strings);
      mats.hair.color.set(cw.hair); mats.hair.sheenColor.copy(tint(cw.hair, 0.35));
      mats.skin.color.set(cw.skin); mats.skin.sheenColor.copy(tint(cw.skin, 0.5));
      mats.face.sheenColor.copy(mats.skin.sheenColor);
      if (mats.band) { mats.band.color.set(cw.band || cw.hoodie); mats.band.sheenColor.copy(tint(cw.band || cw.hoodie, 0.4)); }
    }

    function paint(f) {
      const key = FACE_KEYS.map((k) => Math.round(f[k] * 1000)).join(',');
      if (key === faceKey) return;
      faceKey = key;
      drawFace(faceCanvas.getContext('2d'), FS, f, cw, false, d.face);
      drawFace(roughCanvas.getContext('2d'), FS, f, cw, true, d.face);
      faceTex.needsUpdate = true;
      roughTex.needsUpdate = true;
    }

    const setRot = (o, a, mirror) => o.rotation.set(a[0] * DEG, (mirror ? -a[1] : a[1]) * DEG, (mirror ? -a[2] : a[2]) * DEG);
    function applyPose(p, breath) {
      J.hips.position.y = HIP_Y + p.hipsY;
      setRot(J.hips, p.hips);
      setRot(J.spine, p.spine);
      setRot(J.head, p.head);
      setRot(J.armL, p.armL); setRot(J.elbowL, p.elbowL);
      setRot(J.armR, p.armR, true); setRot(J.elbowR, p.elbowR, true);
      setRot(J.legL, p.legL); J.kneeL.rotation.set(p.kneeL * DEG, 0, 0); J.footL.rotation.set(p.footL * DEG, 0, 0);
      setRot(J.legR, p.legR, true); J.kneeR.rotation.set(p.kneeR * DEG, 0, 0); J.footR.rotation.set(p.footR * DEG, 0, 0);
      if (breath) {
        J.spine.rotation.x += 0.012 * breath;
        J.head.rotation.x -= 0.009 * breath;
        J.armL.rotation.z += 0.012 * breath;
        J.armR.rotation.z -= 0.012 * breath;
      }
    }

    // Blinks at uneven gaps of 2.6–5.4 s, each 0.19 s: a quick close, a slower open.
    const hash = (n) => { const x = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453; return x - Math.floor(x); };
    function blinkAt(t) {
      let start = 0.9 + hash(0) * 1.5, last = -1, n = 1;
      while (start <= t) { last = start; start += 2.6 + hash(n++) * 2.8; }
      if (last < 0) return 1;
      const u = t - last;
      if (u < 0.07) return 1 - smooth(0, 0.07, u);
      if (u < 0.19) return smooth(0.07, 0.19, u);
      return 1;
    }

    // Two-bone IK for an arm: the shoulder-to-hand-centre chain reaches a world point, the elbow bending
    // toward `pole` (a direction in the chest's frame; default out, down and a little back, so elbows point
    // away from the body). Returns pose values ({ arm, elbow }, degrees, right side written mirrored) for the
    // body as it is posed now.
    const _m = new THREE.Matrix4(), _e = new THREE.Euler(0, 0, 0, 'XZY');
    function reach(side, target, pole) {
      root.updateMatrixWorld(true);
      const sgn = side === 'L' ? 1 : -1;
      const S = J['arm' + side].position.clone();
      const Tg = target.clone().applyMatrix4(_m.copy(J.spine.matrixWorld).invert());
      const L1 = d.upper, L2 = d.fore + d.limb.handDrop;
      const v = Tg.sub(S);
      const dist = clamp(v.length(), Math.abs(L1 - L2) + 1e-3, L1 + L2 - 1e-3);
      const vn = v.normalize();
      const p = pole ? pole.clone() : new THREE.Vector3(sgn, -0.6, -0.35);
      p.addScaledVector(vn, -p.dot(vn));
      if (p.lengthSq() < 1e-8) p.set(sgn, 0, 0).addScaledVector(vn, -vn.x * sgn);
      p.normalize();
      const cosA = clamp((L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist), -1, 1);
      const u = vn.clone().multiplyScalar(cosA).addScaledVector(p, Math.sqrt(1 - cosA * cosA));
      const f = S.clone().addScaledVector(vn, dist).sub(S.clone().addScaledVector(u, L1)).normalize();
      const w = f.clone().addScaledVector(u, -f.dot(u));
      if (w.lengthSq() < 1e-8) w.copy(p);
      w.normalize();
      const y = u.clone().negate();
      _m.makeBasis(new THREE.Vector3().crossVectors(y, w), y, w);
      _e.setFromRotationMatrix(_m, 'XZY');
      const bend = Math.acos(clamp(u.dot(f), -1, 1));
      return { arm: [_e.x / DEG, (sgn * _e.y) / DEG, (sgn * _e.z) / DEG], elbow: [-bend / DEG, 0, 0] };
    }

    const api = {
      root, joints: J, mats, faceCanvas, design: designName, fit: d.fit,
      // body numbers for staging: hip pivot height standing, and how far the pelvis hangs below it
      dims: { hipY: HIP_Y, pelvisDrop: d.pelvis.r * d.pelvis.scale[1], thigh: d.thigh, shin: d.shin, ankle: d.ankle, hand: d.limb.hand },
      blink: true,
      reach,
      // a pose with the hands put on world points: hands = { L, R, poleL, poleR } (any of them)
      solve(p, hands) {
        const q = resolvePose(p);
        applyPose(q, 0);
        for (const side of ['L', 'R']) {
          if (!hands[side]) continue;
          const r = reach(side, hands[side], hands['pole' + side]);
          q['arm' + side] = r.arm;
          q['elbow' + side] = r.elbow;
        }
        applyPose(pose, 0);
        return q;
      },
      // stand the root so a seated pose rests its pelvis on a seat top at height y (sinking in by `sink`)
      sitOn(y, sink = 0.015) { root.position.y = y - sink - (HIP_Y - api.dims.pelvisDrop); return api; },
      get colorway() { return Object.assign({}, cw); },
      get pose() { return clone(pose); },
      get face() { return Object.assign({}, face); },
      setColorway(c) { cw = pickColorway(c); recolor(); faceKey = ''; paint(face); return api; },
      setPose(p) { pose = resolvePose(p); applyPose(pose, 0); return api; },
      setExpression(e) { face = resolveFace(e); paint(face); return api; },
      // The idle layer on top of the current pose and face. Same t, same frame.
      update(t) {
        applyPose(pose, Math.sin((t / 3.6) * Math.PI * 2));
        if (!api.blink) { paint(face); return api; }
        const f = Object.assign({}, face);
        f.eyeOpen *= blinkAt(t);
        paint(f);
        return api;
      },
    };

    recolor();
    applyPose(pose, 0);
    paint(face);
    return api;
  }

  global.Mascot = {
    create, DESIGNS, COLORWAYS, EXPRESSIONS, POSES, REST, FACE,
    resolvePose, resolveFace, mixPose, mixFace,
    CHIN_Y: DESIGNS.kip.headY - DESIGNS.kip.R * DESIGNS.kip.headScale[1],
    // shared pieces for other body plans (the cat)
    util: { clamp, lerp, smooth, rgba, makeCanvas, clumpGeometry, headGeometries, limb, INK },
  };
})(typeof window !== 'undefined' ? window : globalThis);
