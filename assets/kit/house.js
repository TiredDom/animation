// Kip's house: the rooms and furniture every episode shares, in the cast's look: matte, soft, physically lit,
// every edge rounded by about 1.5 cm, no outlines. ES module; 'three' and 'three/addons/' come from the page's
// import map.
//
//   const house = buildHouse();          // { root, rooms, props, spots, lights, walls }
//   scene.add(house.root);
//   house.light('living');               // that room's lights on, every other room's off
//   house.props.tv.show('died');         // the TV screen (see makeScreen)
//
// Units are metres; Kip stands about 1.78 tall. The house is laid out like a dollhouse seen from its open front:
// x runs along the front, y is up, +z points out of the front. Ground floor, left to right: garage, kitchen, living
// room (with the stairs up its right wall). Upstairs: Mom's walk-in closet over the garage, a hall along the back
// wall, Mom's room at the front over the kitchen, Kip's room at the front over the living room, the stairwell
// landing at the right. The attic runs under a gable roof over everything. Rooms are boxes of 10 cm walls that
// neighbours share, so a wall or floor pass in one room comes out in the room next to it.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const EDGE = 0.015;          // the rounding on every hard edge
const T = 0.1;               // wall thickness
const H = 2.8;               // ground floor ceiling height
const UP = H + 0.12;         // upstairs floor level
const UH = 2.6;              // upstairs ceiling height
const ATTIC = UP + UH + 0.12; // attic floor level
const RIDGE = ATTIC + 1.9;   // roof ridge
const DEG = Math.PI / 180;

export const LEVELS = { ground: 0, up: UP, attic: ATTIC, ridge: RIDGE };

export const ROOMS = {
  // interior boxes: x0..x1 along the front, z0..z1 back to front, floor y, ceiling height h
  living:  { x: [-3, 3], z: [-2.3, 2.3], y: 0, h: H, wall: '#D9C6B0' },
  kitchen: { x: [-7.4, -3.1], z: [-2.3, 2.3], y: 0, h: H, wall: '#CFDCD4' },
  garage:  { x: [-10.7, -7.5], z: [-2.3, 2.3], y: 0, h: H, wall: '#B9B6AE' },
  closet:  { x: [-10.7, -7.5], z: [-2.3, 2.3], y: UP, h: UH, wall: '#D8CCDD' },
  hall:    { x: [-7.4, 3.0], z: [-2.3, -0.9], y: UP, h: UH, wall: '#D6CFC6' },
  momRoom: { x: [-7.4, -3.1], z: [-0.8, 2.3], y: UP, h: UH, wall: '#D8CCDD' },
  kipRoom: { x: [-3.0, 1.9], z: [-0.8, 2.3], y: UP, h: UH, wall: '#C9D7E6' },
  landing: { x: [2.0, 3.0], z: [-0.8, 2.3], y: UP, h: UH, wall: '#D6CFC6' },
  attic:   { x: [-10.7, 3.0], z: [-2.3, 2.3], y: ATTIC, h: RIDGE - ATTIC, wall: '#B89A78' },
};
const FLOOR = '#A97C55';

// a small seeded PRNG, so the planks come out the same in every render
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const shade = (hex, k) => {
  const c = new THREE.Color(hex);
  return k >= 0 ? c.lerp(new THREE.Color('#ffffff'), k) : c.multiplyScalar(1 + k);
};

// 18 cm planks laid along x in staggered boards, each a touch lighter or darker, with soft dark seams.
// One tile covers 3.6 × 3.6 m.
function plankTexture(baseHex = FLOOR, seed = 11) {
  const S = 2048, rows = 20, rand = mulberry32(seed);
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const base = new THREE.Color(baseHex);
  const seam = '#' + base.clone().multiplyScalar(0.66).getHexString();
  const rowH = S / rows;
  for (let r = 0; r < rows; r++) {
    let x = -rand() * S * 0.5;
    while (x < S) {
      const len = S * (0.33 + rand() * 0.34);
      const k = (rand() - 0.5) * 0.12;
      g.fillStyle = '#' + base.clone().multiplyScalar(1 + k).getHexString();
      // boards wrap around the tile edge so the tile repeats without a seam
      for (const off of [0, S]) g.fillRect(x - off, r * rowH, len, rowH);
      g.globalAlpha = 0.06;
      g.fillStyle = '#5b3d24';
      for (let i = 0; i < 3; i++) {
        const gy = r * rowH + rowH * (0.2 + rand() * 0.6);
        for (const off of [0, S]) g.fillRect(x - off + len * 0.05, gy, len * (0.5 + rand() * 0.4), 1.5);
      }
      g.globalAlpha = 1;
      g.fillStyle = seam;
      for (const off of [0, S]) g.fillRect(x - off, r * rowH, 3, rowH);
      x += len;
    }
    g.fillStyle = seam;
    g.fillRect(0, r * rowH, S, 3);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

// Garage concrete: a soft mottled grey with a saw-cut joint every 1.2 m.
function concreteTexture() {
  const S = 1024, rand = mulberry32(5);
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#A9A69E';
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 900; i++) {
    const r = 6 + rand() * 40;
    g.fillStyle = `rgba(${rand() < 0.5 ? '255,255,255' : '40,38,34'},${0.02 + rand() * 0.03})`;
    g.beginPath(); g.arc(rand() * S, rand() * S, r, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = 'rgba(60,58,54,0.5)';
  g.fillRect(0, S / 2 - 2, S, 4);
  g.fillRect(S / 2 - 2, 0, 4, S);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

// The night outside a window: a deep blue that lightens toward the horizon, and (optionally) a pale moon.
function nightTexture(moon = true) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, '#141C33');
  grd.addColorStop(0.75, '#25335A');
  grd.addColorStop(1, '#33446E');
  g.fillStyle = grd;
  g.fillRect(0, 0, 512, 512);
  if (moon) {
    const m = g.createRadialGradient(370, 120, 0, 370, 120, 52);
    m.addColorStop(0, 'rgba(236,240,250,1)');
    m.addColorStop(0.82, 'rgba(236,240,250,1)');
    m.addColorStop(1, 'rgba(236,240,250,0)');
    g.fillStyle = m;
    g.beginPath(); g.arc(370, 120, 52, 0, Math.PI * 2); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// A morning sky: pale warm blue with a soft bright patch where the sun is.
function morningTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, '#9CC3E8');
  grd.addColorStop(1, '#E9EEF0');
  g.fillStyle = grd;
  g.fillRect(0, 0, 512, 512);
  const s = g.createRadialGradient(120, 380, 0, 120, 380, 260);
  s.addColorStop(0, 'rgba(255,246,222,0.95)');
  s.addColorStop(1, 'rgba(255,246,222,0)');
  g.fillStyle = s;
  g.fillRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Text on paper, in Itim (the channel face): a canvas texture for calendars, tags and labels.
export function paperTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.userData.canvas = c;
  t.userData.redraw = () => { draw(g, w, h); t.needsUpdate = true; };
  return t;
}

export function buildHouse() {
  const root = new THREE.Group();
  root.name = 'house';
  const rooms = {}, props = {}, spots = {}, lights = {}, walls = {};

  const mats = {
    floor: new THREE.MeshStandardMaterial({ map: plankTexture(), roughness: 0.6 }),
    atticFloor: new THREE.MeshStandardMaterial({ map: plankTexture('#8C6E50', 23), roughness: 0.75 }),
    concrete: new THREE.MeshStandardMaterial({ map: concreteTexture(), roughness: 0.92 }),
    slab: new THREE.MeshStandardMaterial({ color: '#8C7F72', roughness: 0.9 }),
    trim: new THREE.MeshStandardMaterial({ color: '#EFE8DD', roughness: 0.75 }),
    wood: new THREE.MeshStandardMaterial({ color: '#8A6A4E', roughness: 0.6 }),
    darkWood: new THREE.MeshStandardMaterial({ color: '#5A4636', roughness: 0.6 }),
    beam: new THREE.MeshStandardMaterial({ color: '#9A7A58', roughness: 0.8 }),
    metal: new THREE.MeshStandardMaterial({ color: '#3E3A36', roughness: 0.45, metalness: 0.4 }),
    steel: new THREE.MeshStandardMaterial({ color: '#8F959C', roughness: 0.45, metalness: 0.5 }),
    brass: new THREE.MeshStandardMaterial({ color: '#C9A24A', roughness: 0.35, metalness: 0.85 }),
    gold: new THREE.MeshStandardMaterial({ color: '#D4AF55', roughness: 0.3, metalness: 0.9 }),
    cardboard: new THREE.MeshStandardMaterial({ color: '#B98F62', roughness: 0.9 }),
    roof: new THREE.MeshStandardMaterial({ color: '#6E5A52', roughness: 0.85 }),
    lawn: new THREE.MeshStandardMaterial({ color: '#36503A', roughness: 1 }),
    night: new THREE.MeshBasicMaterial({ map: nightTexture() }),
    nightPlain: new THREE.MeshBasicMaterial({ map: nightTexture(false) }),
    morning: new THREE.MeshBasicMaterial({ map: morningTexture() }),
  };
  const plaster = (hex, o) => new THREE.MeshStandardMaterial(Object.assign({ color: hex, roughness: 0.9 }, o || {}));
  const fabric = (hex, o) => new THREE.MeshPhysicalMaterial(Object.assign({
    color: hex, roughness: 0.88, sheen: 0.6, sheenRoughness: 0.5, sheenColor: shade(hex, 0.45),
  }, o || {}));
  const paint = (hex, rough = 0.55) => new THREE.MeshStandardMaterial({ color: hex, roughness: rough });

  const box = (w, h, d, r = EDGE) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4));
  const add = (parent, geo, mat, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const group = (parent, x = 0, y = 0, z = 0, ry = 0) => {
    const o = new THREE.Group();
    o.position.set(x, y, z);
    o.rotation.y = ry;
    parent.add(o);
    return o;
  };

  // A wall along x or z from a to b, standing on y0 and h tall, with rectangular openings [from, to, y0, y1]
  // (heights above the wall's foot). Built from solid pieces around the openings, so light only comes in through them.
  function wall(parent, axis, at, a, b, mat, openings = [], y0 = 0, h = H, thick = T) {
    const g = group(parent);
    const piece = (u0, u1, v0, v1) => {
      if (u1 - u0 < 1e-3 || v1 - v0 < 1e-3) return;
      const len = u1 - u0, mid = (u0 + u1) / 2, hh = v1 - v0;
      const geo = axis === 'x' ? box(len, hh, thick, 0.008) : box(thick, hh, len, 0.008);
      add(g, geo, mat, axis === 'x' ? mid : at, y0 + (v0 + v1) / 2, axis === 'x' ? at : mid);
    };
    let u = a;
    for (const [o0, o1, v0, v1] of [...openings].sort((p, q) => p[0] - q[0])) {
      piece(u, o0, 0, h);
      piece(o0, o1, v1, h);
      piece(o0, o1, 0, v0);
      u = o1;
    }
    piece(u, b, 0, h);
    return g;
  }
  // A wall between two rooms of different colours: two half-walls back to back, matNeg facing -axis, matPos +axis.
  function wall2(parent, axis, at, a, b, matNeg, matPos, openings = [], y0 = 0, h = H) {
    const g = group(parent);
    wall(g, axis, at - T / 4, a, b, matNeg, openings, y0, h, T / 2);
    wall(g, axis, at + T / 4, a, b, matPos, openings, y0, h, T / 2);
    return g;
  }

  // Baseboards: a thin cream strip along the foot of a wall, skipping door gaps.
  function baseboard(parent, axis, at, a, b, inward, gaps = [], y0 = 0) {
    let u = a;
    const strip = (u0, u1) => {
      if (u1 - u0 < 0.02) return;
      const len = u1 - u0, mid = (u0 + u1) / 2;
      const geo = axis === 'x' ? box(len, 0.09, 0.02, 0.006) : box(0.02, 0.09, len, 0.006);
      add(parent, geo, mats.trim, axis === 'x' ? mid : at + inward * 0.01, y0 + 0.045, axis === 'x' ? at + inward * 0.01 : mid);
    };
    for (const [g0, g1] of [...gaps].sort((p, q) => p[0] - q[0])) { strip(u, g0); u = g1; }
    strip(u, b);
  }

  // A floor: planks (or another material whose map repeats every 3.6 m) over a rectangle.
  function floor(parent, x0, x1, z0, z1, y, base = mats.floor, tile = 3.6) {
    const mat = base.clone();
    if (base.map) {
      mat.map = base.map.clone();
      mat.map.repeat.set((x1 - x0) / tile, (z1 - z0) / tile);
      mat.map.offset.set(x0 / tile, z0 / tile);
      mat.map.needsUpdate = true;
    }
    const m = add(parent, new THREE.PlaneGeometry(x1 - x0, z1 - z0), mat, (x0 + x1) / 2, y, (z0 + z1) / 2);
    m.rotation.x = -Math.PI / 2;
    m.castShadow = false;
    return m;
  }

  // Door and window trim around an opening in a wall along x (at z) or along z (at x).
  function trimAround(parent, axis, at, u0, u1, v0, v1, y0 = 0, f = 0.06, depth = 0.14) {
    const cu = (u0 + u1) / 2, w = u1 - u0;
    const P = (u, v, du, dv) => (axis === 'x'
      ? add(parent, box(du, dv, depth), mats.trim, u, y0 + v, at)
      : add(parent, box(depth, dv, du), mats.trim, at, y0 + v, u));
    P(cu, v1 + f / 2, w + 2 * f, f);
    if (v0 > 0.01) P(cu, v0 - f / 2, w + 2 * f, f);
    P(u0 - f / 2, (v0 + v1) / 2, f, v1 - v0 + (v0 > 0.01 ? 0 : 0));
    P(u1 + f / 2, (v0 + v1) / 2, f, v1 - v0);
  }

  // A window in a wall along x (at z) or z (at x): trim, a sill on the inside, glazing bars and the sky behind.
  function windowIn(parent, axis, at, u0, u1, v0, v1, y0, inward, sky = mats.night, sill = 0.22) {
    trimAround(parent, axis, at, u0, u1, v0, v1, y0);
    const cu = (u0 + u1) / 2, cv = y0 + (v0 + v1) / 2, w = u1 - u0, hh = v1 - v0;
    const sillGeo = axis === 'x' ? box(w + 0.24, 0.04, sill) : box(sill, 0.04, w + 0.24);
    const sm = axis === 'x'
      ? add(parent, sillGeo, mats.trim, cu, y0 + v0 - 0.02, at + inward * (sill / 2 - 0.03))
      : add(parent, sillGeo, mats.trim, at + inward * (sill / 2 - 0.03), y0 + v0 - 0.02, cu);
    if (axis === 'x') {
      add(parent, box(0.035, hh, 0.04), mats.trim, cu, cv, at);
      add(parent, box(w, 0.035, 0.04), mats.trim, cu, cv + 0.12, at);
    } else {
      add(parent, box(0.04, hh, 0.035), mats.trim, at, cv, cu);
      add(parent, box(0.04, 0.035, w), mats.trim, at, cv + 0.12, cu);
    }
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), sky);
    if (axis === 'x') { glass.position.set(cu, cv, at - inward * 0.02); if (inward < 0) glass.rotation.y = Math.PI; }
    else { glass.position.set(at - inward * 0.02, cv, cu); glass.rotation.y = inward > 0 ? Math.PI / 2 : -Math.PI / 2; }
    parent.add(glass);
    return { glass, sill: sm, sillTop: y0 + v0, center: new THREE.Vector3(axis === 'x' ? cu : at, cv, axis === 'x' ? at : cu) };
  }

  // A room: floor (planks unless opts.floorMat), four walls (left/right/back/front: false when a neighbour owns
  // the shared wall), baseboards, and a ceiling slab with any holes cut out as [x0, x1, z0, z1].
  function shell(name, opts = {}) {
    const r = ROOMS[name];
    const [x0, x1] = r.x, [z0, z1] = r.z, y0 = r.y, h = r.h;
    const has = { left: opts.left !== false, right: opts.right !== false, back: opts.back !== false, front: opts.front !== false };
    const xa = x0 - (has.left ? T : 0), xb = x1 + (has.right ? T : 0);
    const g = group(root);
    g.name = name;
    const wallMat = plaster(r.wall);
    floor(g, x0, x1, z0, z1, y0 + 0.001, opts.floorMat || mats.floor, opts.tile || 3.6);
    if (y0 === 0) add(g, box(xb - xa, 0.12, z1 - z0 + 2 * T, 0.01), mats.slab, (xa + xb) / 2, -0.061, (z0 + z1) / 2);
    const w = {};
    const list = (k) => (Array.isArray(opts[k]) ? opts[k] : []);
    if (has.back) w.back = wall(g, 'x', z0 - T / 2, xa, xb, wallMat, list('back'), y0, h);
    if (has.front) w.front = wall(g, 'x', z1 + T / 2, xa, xb, wallMat, list('front'), y0, h);
    if (has.left) w.left = opts.leftMat ? wall2(g, 'z', x0 - T / 2, z0, z1, opts.leftMat, wallMat, list('left'), y0, h)
      : wall(g, 'z', x0 - T / 2, z0, z1, wallMat, list('left'), y0, h);
    if (has.right) w.right = wall(g, 'z', x1 + T / 2, z0, z1, wallMat, list('right'), y0, h);
    const gaps = (k) => list(k).filter((o) => o[2] < 0.01).map((o) => [o[0], o[1]]);
    if (opts.baseboards !== false) {
      baseboard(g, 'x', z0, x0, x1, 1, gaps('back'), y0);
      if (has.front) baseboard(g, 'x', z1, x0, x1, -1, gaps('front'), y0);
      baseboard(g, 'z', x0, z0, z1, 1, gaps('left'), y0);
      baseboard(g, 'z', x1, z0, z1, -1, gaps('right'), y0);
    }
    if (opts.ceiling !== false) {
      const ceil = group(g);
      const slab = (a0, a1, b0, b1) => {
        if (a1 - a0 < 1e-3 || b1 - b0 < 1e-3) return;
        add(ceil, box(a1 - a0, 0.12, b1 - b0, 0.01), wallMat, (a0 + a1) / 2, y0 + h + 0.06, (b0 + b1) / 2);
      };
      const holes = opts.holes || [];
      if (!holes.length) slab(xa, xb, z0 - T, z1 + T);
      for (const [hx0, hx1, hz0, hz1] of holes) {
        slab(xa, hx0, z0 - T, z1 + T);
        slab(hx1, xb, z0 - T, z1 + T);
        slab(hx0, hx1, z0 - T, hz0);
        slab(hx0, hx1, hz1, z1 + T);
      }
      w.ceiling = ceil;
    }
    walls[name] = w;
    rooms[name] = { group: g, box: r, walls: w, wallMat };
    return g;
  }

  // ======================= GROUND FLOOR =======================

  // ---------- the living room ----------
  // The couch on the back wall faces the TV on the front wall; the floor lamp stands at the couch's left end,
  // the cat's armchair beyond it under the window; the stairs climb the right wall toward the back; the
  // kitchen door is in the left wall near the front.
  const LV = ROOMS.living;
  const stairs = { x0: 2.05, x1: 2.95, zFront: 1.95, steps: 16, tread: 0.26, rise: UP / 16 };
  const kitchenWallMat = plaster(ROOMS.kitchen.wall, { side: THREE.DoubleSide });
  const living = shell('living', {
    back: [[-2.65, -1.55, 0.95, 2.15]],                   // the window
    left: [[0.6, 1.6, 0, 2.1]],                            // the kitchen door
    leftMat: kitchenWallMat,
    holes: [[stairs.x0 - 0.05, LV.x[1], LV.z[0], 0.95]],  // the stairwell
  });
  rooms.living.wallMat.side = THREE.DoubleSide;           // the shared kitchen wall is passed through
  spots.window = windowIn(living, 'x', LV.z[0] - T / 2, -2.65, -1.55, 0.95, 2.15, 0, 1).center;
  trimAround(living, 'z', LV.x[0] - T / 2, 0.6, 1.6, 0, 2.1, 0);
  spots.kitchenDoor = new THREE.Vector3(LV.x[0], 0, 1.1);
  // the stretch of the shared wall Kip leans through (shot 9): behind the armchair, between door and corner
  spots.kitchenWall = new THREE.Vector3(LV.x[0], 1.2, -0.95);

  add(living, box(2.9, 0.012, 2.0, 0.006), fabric('#CDBFAE', { sheen: 0.3 }), 0.25, 0.006, -0.55);

  // couch: sage, three seat cushions and three back cushions
  {
    const sage = fabric('#8FA38A');
    const cz = LV.z[0] + 0.45;
    const c = group(living, 0.25, 0, cz);
    c.name = 'couch';
    for (const [x, z] of [[-0.95, -0.36], [0.95, -0.36], [-0.95, 0.36], [0.95, 0.36]]) {
      add(c, new THREE.CylinderGeometry(0.03, 0.025, 0.06, 16), mats.darkWood, x, 0.03, z);
    }
    add(c, box(2.1, 0.22, 0.86, 0.04), sage, 0, 0.17, 0);
    add(c, box(2.1, 0.44, 0.2, 0.07), sage, 0, 0.5, -0.33);
    for (const s of [-1, 1]) add(c, box(0.2, 0.54, 0.86, 0.08), sage, s * 0.95, 0.33, 0);
    const seatW = (2.1 - 0.4) / 3;
    const seats = [], backs = [];
    for (let i = -1; i <= 1; i++) {
      seats.push(add(c, box(seatW - 0.01, 0.14, 0.62, 0.06), sage, i * seatW, 0.35, 0.12));
      const back = add(c, box(seatW - 0.02, 0.42, 0.17, 0.07), sage, i * seatW, 0.63, -0.15);
      back.rotation.x = -0.12;
      backs.push(back);
    }
    props.couch = { group: c, seats, backs, seatTop: 0.42, mat: sage };
    spots.couchSeats = [-1, 0, 1].map((i) => new THREE.Vector3(0.25 + i * seatW, 0.42, cz + 0.2));
    spots.couchFront = cz + 0.43;
  }

  // floor lamp at the couch's left end: a drum shade lit from inside
  {
    const l = group(living, -1.35, 0, LV.z[0] + 0.55);
    l.name = 'lamp';
    const baseG = new THREE.LatheGeometry([[0, 0], [0.15, 0], [0.16, 0.012], [0.152, 0.032], [0.11, 0.045], [0, 0.048]]
      .map(([x, y]) => new THREE.Vector2(x, y)), 40);
    add(l, baseG, mats.metal);
    add(l, new THREE.CylinderGeometry(0.014, 0.014, 1.3, 16), mats.metal, 0, 0.69, 0);
    const shadeMat = new THREE.MeshStandardMaterial({
      color: '#F3E3C6', roughness: 0.9, side: THREE.DoubleSide, emissive: '#FFC58A', emissiveIntensity: 0.55,
    });
    const shadeM = add(l, new THREE.CylinderGeometry(0.16, 0.21, 0.28, 48, 1, true), shadeMat, 0, 1.42, 0);
    shadeM.castShadow = false;
    for (const [r, y] of [[0.16, 1.56], [0.21, 1.28]]) {
      const rim = add(l, new THREE.TorusGeometry(r, 0.006, 8, 48), shadeMat, 0, y, 0);
      rim.rotation.x = Math.PI / 2;
      rim.castShadow = false;
    }
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), new THREE.MeshBasicMaterial({ color: '#FFE2B8' }));
    bulb.position.y = 1.38;
    l.add(bulb);
    const light = new THREE.PointLight('#FFC58A', 2.4, 0, 2);
    light.position.y = 1.38;
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.camera.near = 0.05;
    light.shadow.bias = -0.002;
    light.shadow.normalBias = 0.02;
    l.add(light);
    props.lamp = { group: l, shade: shadeM, light };
    spots.lampShade = new THREE.Vector3(-1.35, 1.42, LV.z[0] + 0.55);
  }

  // the cat's armchair, under the window, turned toward the room
  {
    const rust = fabric('#A97A66');
    const a = group(living, -2.15, 0, LV.z[0] + 0.95, 32 * DEG);
    a.name = 'armchair';
    for (const [x, z] of [[-0.4, -0.36], [0.4, -0.36], [-0.4, 0.36], [0.4, 0.36]]) {
      add(a, new THREE.CylinderGeometry(0.03, 0.025, 0.06, 16), mats.darkWood, x, 0.03, z);
    }
    add(a, box(0.95, 0.22, 0.88, 0.04), rust, 0, 0.17, 0);
    add(a, box(0.95, 0.52, 0.2, 0.07), rust, 0, 0.54, -0.34);
    for (const s of [-1, 1]) add(a, box(0.18, 0.5, 0.88, 0.08), rust, s * 0.385, 0.31, 0);
    add(a, box(0.58, 0.14, 0.66, 0.06), rust, 0, 0.35, 0.08);
    const back = add(a, box(0.56, 0.36, 0.15, 0.07), rust, 0, 0.6, -0.17);
    back.rotation.x = -0.12;
    props.armchair = { group: a, seatTop: 0.42 };
    spots.armchairSeat = new THREE.Vector3(0, 0.42, 0.06).applyAxisAngle(new THREE.Vector3(0, 1, 0), 32 * DEG).add(a.position);
    spots.armchairYaw = 32 * DEG;
  }

  // TV on a low stand against the front wall, facing the couch
  {
    const t = group(living, 0.25, 0, LV.z[1] - 0.24, Math.PI);
    t.name = 'tv';
    add(t, box(1.5, 0.04, 0.4, 0.01), mats.darkWood, 0, 0.02, 0);
    add(t, box(1.5, 0.4, 0.42, 0.03), mats.wood, 0, 0.24, 0);
    for (const s of [-1, 1]) add(t, box(0.7, 0.3, 0.02, 0.012), mats.wood, s * 0.37, 0.24, 0.215);
    add(t, box(0.3, 0.05, 0.18, 0.02), mats.darkWood, 0, 0.465, 0);
    add(t, box(0.05, 0.12, 0.05, 0.015), mats.darkWood, 0, 0.53, -0.02);
    const bezelMat = new THREE.MeshStandardMaterial({ color: '#1E2126', roughness: 0.4 });
    add(t, box(1.24, 0.72, 0.05, 0.02), bezelMat, 0, 0.94, 0);
    const screen = makeScreen();
    const sm = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 0.664), screen.material);
    sm.position.set(0, 0.94, 0.0255);
    t.add(sm);
    // the screen's own light: a soft cool spot on the couch, the motivated front fill on the gamer's face
    const glow = new THREE.SpotLight('#A8C4FF', 6, 0, 38 * DEG, 1, 2);
    glow.position.set(0, 0.94, 0.04);
    t.add(glow);
    root.add(glow.target);
    glow.target.position.copy(spots.couchSeats[1]).setY(0.9);
    screen.glow = glow;
    props.tv = Object.assign(screen, { group: t, mesh: sm });
    root.updateMatrixWorld(true);
    spots.tvScreen = sm.getWorldPosition(new THREE.Vector3());
  }

  // stairs up the right wall: solid steps with wooden treads, white balusters and a wooden rail
  {
    const s = stairs, g = group(living);
    g.name = 'stairs';
    const body = plaster(shade(LV.wall, -0.06));
    const w = s.x1 - s.x0, cx = (s.x0 + s.x1) / 2;
    for (let i = 0; i < s.steps; i++) {
      const h = (i + 1) * s.rise, z = s.zFront - (i + 0.5) * s.tread;
      add(g, box(w, h - 0.03, s.tread, 0.01), body, cx, (h - 0.03) / 2, z);
      add(g, box(w + 0.03, 0.03, s.tread + 0.025, 0.01), mats.wood, cx, h - 0.015, z + 0.0125);
    }
    const railX = s.x0 + 0.04, railH = 0.88;
    const stepTop = (i) => (i + 1) * s.rise;
    const zAt = (i) => s.zFront - (i + 0.5) * s.tread;
    add(g, box(0.09, 1.05, 0.09, 0.02), mats.trim, railX, 0.525, s.zFront - 0.13);
    for (let i = 1; i < s.steps - 3; i += 2) {
      add(g, new THREE.CylinderGeometry(0.014, 0.014, railH, 10), mats.trim, railX, stepTop(i) + railH / 2, zAt(i));
    }
    const a = new THREE.Vector3(railX, 1.05, s.zFront - 0.13), b = new THREE.Vector3(railX, stepTop(s.steps - 4) + railH, zAt(s.steps - 4));
    const rail = add(g, new THREE.CapsuleGeometry(0.028, a.distanceTo(b), 6, 16), mats.wood, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
    rail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    props.stairs = { group: g, rise: s.rise, tread: s.tread, zFront: s.zFront, x: cx, x0: s.x0, x1: s.x1, steps: s.steps, stepTop, zAt };
    spots.stairsFoot = new THREE.Vector3(cx, 0, s.zFront + 0.3);
  }

  // ---------- the kitchen ----------
  // The fridge stands against the shared wall in the back corner (Kip pokes out of that wall beside it); the
  // counter runs along the back wall under a window; a round table with two chairs sits near the front; a pendant
  // lamp hangs over the table. A door to the garage is in the left wall.
  const KT = ROOMS.kitchen;
  const kitchen = shell('kitchen', {
    right: false,
    back: [[-6.25, -5.05, 1.25, 2.15]],
    left: [[1.0, 1.9, 0, 2.1]],
    leftMat: plaster(ROOMS.garage.wall),
  });
  spots.kitchenWindow = windowIn(kitchen, 'x', KT.z[0] - T / 2, -6.25, -5.05, 1.25, 2.15, 0, 1, mats.nightPlain).center;
  trimAround(kitchen, 'z', KT.x[0] - T / 2, 1.0, 1.9, 0, 2.1, 0);
  {
    // fridge: off-white, two doors with long handles, the paper calendar on the top door
    const fx = KT.x[1] - 0.38, fz = KT.z[0] + 0.42;
    const f = group(kitchen, fx, 0, fz, -Math.PI / 2);
    f.name = 'fridge';
    const body = paint('#E9E6DF', 0.35);
    add(f, box(0.76, 1.86, 0.72, 0.04), body, 0, 0.93, 0);
    add(f, box(0.74, 0.012, 0.02, 0.004), paint('#C9C5BC'), 0, 1.3, 0.362);
    for (const [y, l] of [[1.55, 0.36], [0.95, 0.5]]) {
      add(f, box(0.03, l, 0.04, 0.012), paint('#B8B3AA', 0.4), -0.3, y, 0.385);
    }
    const cal = paperTexture(512, 680, drawCalendar);
    const calM = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.61), new THREE.MeshStandardMaterial({ map: cal, roughness: 0.85 }));
    calM.position.set(0.05, 1.38, 0.363);
    f.add(calM);
    add(f, new THREE.CylinderGeometry(0.018, 0.018, 0.012, 16), paint('#D8453A', 0.4), -0.15, 1.66, 0.368).rotation.x = Math.PI / 2;
    props.fridge = { group: f, calendar: calM };
    root.updateMatrixWorld(true);
    spots.calendar = calM.getWorldPosition(new THREE.Vector3());
    spots.fridgeFront = new THREE.Vector3(fx - 0.36, 0, fz);
  }
  // where Kip's head comes out of the shared wall, beside the fridge (shot 10)
  spots.kitchenPoke = new THREE.Vector3(KT.x[1], 1.45, -0.95);
  {
    // counter: base cabinets, a stone top, upper cabinets
    const cab = paint('#7F98A1', 0.6), top = paint('#E5E1D8', 0.4);
    const x0 = -7.25, x1 = -4.0, cz = KT.z[0] + 0.3;
    add(kitchen, box(x1 - x0, 0.86, 0.6, 0.02), cab, (x0 + x1) / 2, 0.45, cz);
    add(kitchen, box(x1 - x0 + 0.04, 0.05, 0.64, 0.015), top, (x0 + x1) / 2, 0.905, cz + 0.02);
    for (let x = x0 + 0.42; x < x1 - 0.1; x += 0.65) {
      add(kitchen, box(0.6, 0.7, 0.02, 0.01), paint('#88A1AA', 0.55), x, 0.45, cz + 0.305);
      add(kitchen, box(0.12, 0.02, 0.025, 0.008), mats.steel, x, 0.72, cz + 0.32);
    }
    add(kitchen, box(0.9, 0.62, 0.34, 0.02), cab, -7.2 + 0.45, 1.72, KT.z[0] + 0.17);
    add(kitchen, box(0.9, 0.62, 0.34, 0.02), cab, -4.45, 1.72, KT.z[0] + 0.17);
    props.counter = { top: 0.93, z: cz };
    spots.counterMom = new THREE.Vector3(-5.65, 0, KT.z[0] + 0.95);
  }
  {
    // a round table and two chairs
    const tx = -5.6, tz = 1.05;
    const tg = group(kitchen, tx, 0, tz);
    add(tg, new THREE.CylinderGeometry(0.5, 0.5, 0.04, 48), mats.wood, 0, 0.74, 0);
    add(tg, new THREE.CylinderGeometry(0.045, 0.05, 0.7, 16), mats.darkWood, 0, 0.37, 0);
    add(tg, new THREE.CylinderGeometry(0.26, 0.28, 0.03, 32), mats.darkWood, 0, 0.015, 0);
    const chair = (x, z, ry) => {
      const c = group(kitchen, x, 0, z, ry);
      add(c, box(0.44, 0.04, 0.42, 0.012), mats.wood, 0, 0.45, 0);
      for (const [lx, lz] of [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]]) {
        add(c, new THREE.CylinderGeometry(0.018, 0.016, 0.45, 10), mats.darkWood, lx, 0.225, lz);
      }
      add(c, box(0.42, 0.42, 0.03, 0.012), mats.wood, 0, 0.7, -0.2);
      return c;
    };
    props.chairs = [chair(tx - 0.72, tz + 0.05, Math.PI / 2), chair(tx + 0.75, tz - 0.05, -Math.PI / 2)];
    props.table = { group: tg, top: 0.76 };
    spots.coatChair = new THREE.Vector3(tx + 0.75, 0.47, tz - 0.05);
  }
  {
    // pendant lamp over the table
    const p = group(kitchen, -5.6, 0, 1.05);
    add(p, new THREE.CylinderGeometry(0.006, 0.006, 0.5, 8), mats.metal, 0, 2.55, 0);
    const shadeMat = new THREE.MeshStandardMaterial({ color: '#E8DCC6', roughness: 0.6, side: THREE.DoubleSide, emissive: '#FFD9A8', emissiveIntensity: 0.25 });
    const sh = add(p, new THREE.SphereGeometry(0.22, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), shadeMat, 0, 2.2, 0);
    sh.castShadow = false;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), new THREE.MeshBasicMaterial({ color: '#FFE8C8' }));
    bulb.position.y = 2.17;
    p.add(bulb);
    const light = new THREE.PointLight('#FFD1A0', 2.6, 0, 2);
    light.position.y = 2.12;
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.camera.near = 0.05;
    light.shadow.bias = -0.002;
    light.shadow.normalBias = 0.02;
    p.add(light);
    props.pendant = { light };
  }

  // ---------- the garage ----------
  // Concrete, a metal shelf of boxes against the back wall with the blue present beside it, a small window.
  const GR = ROOMS.garage;
  const garage = shell('garage', {
    right: false, floorMat: mats.concrete, tile: 2.4,
    left: [[-0.6, 0.4, 1.3, 2.0]],
  });
  windowIn(garage, 'z', GR.x[0] - T / 2, -0.6, 0.4, 1.3, 2.0, 0, 1, mats.nightPlain, 0.12);
  {
    const sx = -9.55, sz = GR.z[0] + 0.3, w = 1.5, d = 0.42;
    const sg = group(garage, sx, 0, sz);
    for (const [ux, uz] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) {
      add(sg, box(0.035, 1.9, 0.035, 0.006), mats.steel, ux, 0.95, uz);
    }
    for (const y of [0.32, 0.86, 1.4, 1.86]) add(sg, box(w + 0.04, 0.025, d + 0.02, 0.006), mats.steel, 0, y, 0);
    const rand = mulberry32(31);
    for (const y of [0.86, 1.4]) {
      let x = -w / 2 + 0.06;
      while (x < w / 2 - 0.25) {
        const bw = 0.22 + rand() * 0.18, bh = 0.18 + rand() * 0.18;
        add(sg, box(bw, bh, 0.32, 0.012), mats.cardboard, x + bw / 2, y + 0.0125 + bh / 2, 0);
        x += bw + 0.05;
      }
    }
    add(sg, new THREE.CylinderGeometry(0.11, 0.11, 0.22, 24), paint('#C9CDD2', 0.4), 0.45, 0.32 + 0.0125 + 0.11, 0);
    // the present, big enough for a ghost to put his head in: blue paper, a red ribbon cross and bow
    const pg = group(garage, -8.3, 0, GR.z[0] + 0.45, -0.18);
    pg.name = 'garagePresent';
    const paper = paint('#3E6FD8', 0.5), ribbon = paint('#E8453C', 0.45);
    const PW = 0.78, PH = 0.5, PD = 0.56;
    add(pg, box(PW, PH, PD, 0.02), paper, 0, PH / 2, 0);
    add(pg, box(PW + 0.006, PH + 0.006, 0.07, 0.006), ribbon, 0, PH / 2, 0);
    add(pg, box(0.07, PH + 0.006, PD + 0.006, 0.006), ribbon, 0, PH / 2, 0);
    for (const s of [-1, 1]) {
      const loop = add(pg, new THREE.TorusGeometry(0.075, 0.022, 10, 24), ribbon, s * 0.075, PH + 0.05, 0);
      loop.rotation.set(0, s * 0.5, s * 0.35);
    }
    // its inside, for the shot from in the box: dim cardboard, one sliver of light under the lid, rolled socks, a tag
    const inside = new THREE.Mesh(new THREE.BoxGeometry(PW - 0.03, PH - 0.03, PD - 0.03), new THREE.MeshStandardMaterial({ color: '#A8825A', roughness: 1, side: THREE.BackSide }));
    inside.position.y = PH / 2;
    inside.visible = false;
    pg.add(inside);
    const socks = group(pg, 0, 0, 0);
    socks.visible = false;
    const sockTex = paperTexture(256, 64, (g, w2, h2) => {
      g.fillStyle = '#F0EDE6'; g.fillRect(0, 0, w2, h2);
      g.fillStyle = '#8E98A8'; for (let i = 0; i < 4; i++) g.fillRect(i * 64 + 20, 0, 18, h2);
    });
    sockTex.wrapS = THREE.RepeatWrapping;
    const sockMat = fabric('#F0EDE6', { map: sockTex, sheen: 0.4 });
    for (const [x, z, ry] of [[-0.12, 0.03, 0.3], [0.1, -0.05, -0.4]]) {
      const s = add(socks, new THREE.CapsuleGeometry(0.06, 0.12, 8, 20), sockMat, x, 0.08, z);
      s.rotation.set(0, ry, Math.PI / 2);
      const band = add(socks, new THREE.TorusGeometry(0.058, 0.012, 8, 24), fabric('#E8453C'), x, 0.08, z);
      band.rotation.set(0, ry + Math.PI / 2, 0);
    }
    const tagTex = paperTexture(512, 256, (g, w2, h2) => {
      g.fillStyle = '#F6EFD8'; g.fillRect(0, 0, w2, h2);
      g.fillStyle = '#C8B98F'; g.beginPath(); g.arc(44, h2 / 2, 14, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#2C2622'; g.font = '62px Itim'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('To Dad,', w2 / 2 + 24, h2 * 0.36);
      g.fillText('from Grandma', w2 / 2 + 24, h2 * 0.68);
    });
    const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.1), new THREE.MeshStandardMaterial({ map: tagTex, roughness: 0.9, side: THREE.DoubleSide }));
    tag.position.set(0.0, 0.17, 0.09);
    tag.rotation.set(-0.5, 0.1, 0.05);
    socks.add(tag);
    const sliver = new THREE.SpotLight('#FFE9C4', 1.6, 1.2, 10 * DEG, 0.6, 2);
    sliver.position.set(0.0, PH - 0.02, -PD / 2 + 0.04);
    sliver.target.position.set(0.0, 0.1, 0.1);
    sliver.visible = false;
    pg.add(sliver, sliver.target);
    props.garagePresent = { group: pg, inside, socks, tag, tagTexture: tagTex, sliver, size: [PW, PH, PD] };
    root.updateMatrixWorld(true);
    spots.garagePresent = pg.getWorldPosition(new THREE.Vector3());
    spots.garageShelf = new THREE.Vector3(sx, 0, sz);
  }
  {
    // a bare bulb in the garage ceiling
    const light = new THREE.PointLight('#FFD9AE', 1.5, 0, 2);
    light.position.set(-9.1, 2.6, -0.3);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.camera.near = 0.05;
    light.shadow.bias = -0.002;
    light.shadow.normalBias = 0.02;
    garage.add(light);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 12), new THREE.MeshBasicMaterial({ color: '#FFEBD0' }));
    bulb.position.set(-9.1, 2.7, -0.3);
    garage.add(bulb);
    props.garageBulb = { light };
  }

  // ======================= UPSTAIRS =======================
  // One slab over the living room (with the stairwell) and the kitchen and garage is already in place; the upstairs
  // floors sit on it. Outer walls run round the whole floor; inner walls part the rooms.
  const up = group(root);
  up.name = 'upstairs';
  const X0 = ROOMS.closet.x[0], X1 = ROOMS.hall.x[1], Z0 = -2.3, Z1 = 2.3;
  const upMat = {};
  for (const k of ['closet', 'hall', 'momRoom', 'kipRoom']) upMat[k] = plaster(ROOMS[k].wall);
  // floors
  floor(up, ...ROOMS.closet.x, Z0, Z1, UP + 0.001);
  floor(up, ROOMS.hall.x[0], 2.0, ROOMS.hall.z[0], ROOMS.hall.z[1], UP + 0.001);
  floor(up, ...ROOMS.momRoom.x, ...ROOMS.momRoom.z, UP + 0.001);
  floor(up, ...ROOMS.kipRoom.x, ...ROOMS.kipRoom.z, UP + 0.001);
  floor(up, 2.0, 3.0, 0.95, Z1, UP + 0.001);
  // the threshold strips under the inner walls, so no gap shows between floors
  add(up, box(9.4, 0.02, 0.1, 0.004), mats.floor, -2.7, UP + 0.005, -0.85);
  add(up, box(0.1, 0.02, 0.92, 0.004), mats.floor, -7.45, UP + 0.005, -1.6);
  // outer walls: back (hall and closet), front (closet, Mom's room, Kip's room with its window, landing), the two ends
  const kipWin = [-2.45, -1.35, 0.9, 2.0];
  walls.upstairs = {};
  walls.upstairs.back = wall(up, 'x', Z0 - T / 2, X0 - T, X1 + T, upMat.hall, [], UP, UH);
  walls.upstairs.front = group(up);
  wall(walls.upstairs.front, 'x', Z1 + T / 2, X0 - T, -7.45, upMat.closet, [], UP, UH);
  wall(walls.upstairs.front, 'x', Z1 + T / 2, -7.45, -3.05, upMat.momRoom, [], UP, UH);
  wall(walls.upstairs.front, 'x', Z1 + T / 2, -3.05, 1.95, upMat.kipRoom, [kipWin], UP, UH);
  wall(walls.upstairs.front, 'x', Z1 + T / 2, 1.95, X1 + T, upMat.hall, [], UP, UH);
  walls.upstairs.left = wall(up, 'z', X0 - T / 2, Z0, Z1, upMat.closet, [], UP, UH);
  walls.upstairs.right = wall(up, 'z', X1 + T / 2, Z0, Z1, upMat.hall, [], UP, UH);
  // inner walls: the closet's door wall, the hall's front wall with two doors, Kip's room's two side walls
  const closetDoor = [-2.05, -1.15, 0, 2.05];
  walls.upstairs.closet = wall2(up, 'z', -7.45, Z0, Z1, upMat.closet, upMat.hall, [closetDoor], UP, UH);
  const momDoor = [-5.6, -4.7, 0, 2.05], kipDoor = [0.75, 1.65, 0, 2.05];
  walls.upstairs.hallFront = group(up);
  wall2(walls.upstairs.hallFront, 'x', -0.85, -7.4, -3.05, upMat.hall, upMat.momRoom, [momDoor], UP, UH);
  wall2(walls.upstairs.hallFront, 'x', -0.85, -3.05, 2.0, upMat.hall, upMat.kipRoom, [kipDoor], UP, UH);
  walls.upstairs.kipLeft = wall2(up, 'z', -3.05, -0.8, Z1, upMat.momRoom, upMat.kipRoom, [], UP, UH);
  walls.upstairs.kipRight = wall2(up, 'z', 1.95, -0.8, Z1, upMat.kipRoom, upMat.hall, [], UP, UH);
  // the stairwell is open to the hall: a railing along its edge, and one across the landing
  {
    const post = (x, z) => add(up, box(0.07, 0.95, 0.07, 0.015), mats.trim, x, UP + 0.475, z);
    post(2.0, ROOMS.hall.z[0] + 0.05); post(2.0, -0.85); post(2.0, 0.95); post(3.0, 0.95);
    add(up, box(0.06, 0.05, -0.85 - Z0, 0.015), mats.wood, 2.0, UP + 0.93, (Z0 - 0.85) / 2);
    add(up, box(1.0, 0.05, 0.06, 0.015), mats.wood, 2.5, UP + 0.93, 0.95);
    for (let z = Z0 + 0.2; z < -0.9; z += 0.16) add(up, new THREE.CylinderGeometry(0.012, 0.012, 0.9, 8), mats.trim, 2.0, UP + 0.45, z);
    for (let x = 2.15; x < 2.95; x += 0.16) add(up, new THREE.CylinderGeometry(0.012, 0.012, 0.9, 8), mats.trim, x, UP + 0.45, 0.95);
  }
  // doors: the closet door (closed, Kip's head comes through it), Kip's door (open a little), Mom's door
  {
    const doorMat = paint('#F1ECE3', 0.6);
    const door = (parent, w, open, hinge, axisZ) => {
      const pivot = group(parent, hinge.x, UP, hinge.z);
      const leaf = add(pivot, box(0.06, 2.02, w - 0.04, 0.012), doorMat, 0, 1.01, axisZ * (w / 2 - 0.02));
      add(pivot, new THREE.SphereGeometry(0.03, 16, 12), mats.brass, 0.05, 1.0, axisZ * (w - 0.12));
      add(pivot, new THREE.SphereGeometry(0.03, 16, 12), mats.brass, -0.05, 1.0, axisZ * (w - 0.12));
      pivot.rotation.y = open;
      return { pivot, leaf };
    };
    props.closetDoor = door(up, 0.9, 0, new THREE.Vector3(-7.45, 0, closetDoor[0]), 1);
    const kd = group(up, kipDoor[0], 0, -0.85, 0);
    kd.rotation.y = Math.PI / 2;
    props.kipDoor = door(kd, 0.9, 0, new THREE.Vector3(0, 0, 0), 1);
    props.kipDoor.pivot.rotation.y = 0.25;
    const md = group(up, momDoor[0], 0, -0.85, 0);
    md.rotation.y = Math.PI / 2;
    props.momDoor = door(md, 0.9, 0.0, new THREE.Vector3(0, 0, 0), 1);
    trimAround(up, 'z', -7.45, closetDoor[0], closetDoor[1], 0, 2.05, UP, 0.06, 0.12);
    trimAround(up, 'x', -0.85, momDoor[0], momDoor[1], 0, 2.05, UP, 0.06, 0.12);
    trimAround(up, 'x', -0.85, kipDoor[0], kipDoor[1], 0, 2.05, UP, 0.06, 0.12);
    spots.closetDoor = new THREE.Vector3(-7.45, UP, (closetDoor[0] + closetDoor[1]) / 2);
    spots.kipDoor = new THREE.Vector3((kipDoor[0] + kipDoor[1]) / 2, UP, -0.85);
  }
  baseboard(up, 'x', ROOMS.hall.z[0], -7.4, 2.0, 1, [], UP);
  baseboard(up, 'x', ROOMS.hall.z[1], -7.4, 2.0, -1, [[momDoor[0], momDoor[1]], [kipDoor[0], kipDoor[1]]], UP);
  baseboard(up, 'x', ROOMS.kipRoom.z[0], -3.0, 1.9, 1, [[kipDoor[0], kipDoor[1]]], UP);
  baseboard(up, 'x', ROOMS.kipRoom.z[1], -3.0, 1.9, -1, [], UP);
  baseboard(up, 'z', -3.0, -0.8, Z1, 1, [], UP);
  baseboard(up, 'z', 1.9, -0.8, Z1, -1, [], UP);
  baseboard(up, 'z', -7.5, Z0, Z1, -1, [[closetDoor[0], closetDoor[1]]], UP);
  baseboard(up, 'z', X0, Z0, Z1, 1, [], UP);
  // the upstairs ceiling: one slab, which is the attic floor
  const upCeil = group(up);
  add(upCeil, box(X1 - X0 + 2 * T, 0.12, Z1 - Z0 + 2 * T, 0.01), plaster('#E4DDD3'), (X0 + X1) / 2, UP + UH + 0.06, 0);
  walls.upstairs.ceiling = upCeil;
  rooms.upstairs = { group: up };
  for (const k of ['closet', 'hall', 'momRoom', 'kipRoom', 'landing']) rooms[k] = { group: up, box: ROOMS[k] };

  // ---------- Mom's closet ----------
  // A clothes rail along the back wall in four muted colours, a shelf with two shoeboxes above it, and Dad's
  // framed photo on the far wall, at a ghost's eye height.
  {
    const CL = ROOMS.closet, g = group(up);
    g.name = 'closetProps';
    const railZ = CL.z[0] + 0.32, rx0 = CL.x[0] + 0.35, rx1 = CL.x[1] - 0.45;
    add(g, new THREE.CylinderGeometry(0.014, 0.014, rx1 - rx0, 12), mats.steel, (rx0 + rx1) / 2, UP + 1.78, railZ).rotation.z = Math.PI / 2;
    for (const x of [rx0, rx1]) add(g, box(0.03, 0.2, 0.03, 0.006), mats.steel, x, UP + 1.88, railZ - 0.12);
    const colors = ['#9C8B7A', '#7D8C9A', '#A08A9E', '#8E9C82'];
    const rand = mulberry32(17);
    let x = rx0 + 0.15, i = 0;
    while (x < rx1 - 0.1) {
      const len = 0.72 + rand() * 0.45, wdt = 0.4 + rand() * 0.08, th = 0.07 + rand() * 0.04;
      const c = add(g, box(th, len, wdt, 0.03), fabric(colors[i % 4]), x, UP + 1.74 - len / 2, railZ);
      c.rotation.z = (rand() - 0.5) * 0.04;
      add(g, new THREE.TorusGeometry(0.035, 0.004, 6, 16, Math.PI), mats.steel, x, UP + 1.785, railZ).rotation.y = Math.PI / 2;
      x += th + 0.04 + rand() * 0.03;
      i += 1 + (rand() < 0.3 ? 1 : 0);
    }
    add(g, box(rx1 - rx0 + 0.3, 0.03, 0.4, 0.01), mats.trim, (rx0 + rx1) / 2, UP + 2.02, CL.z[0] + 0.22);
    const shoebox = (bx, col) => {
      add(g, box(0.42, 0.18, 0.28, 0.01), paint(col, 0.8), bx, UP + 2.035 + 0.09, CL.z[0] + 0.2);
      add(g, box(0.44, 0.03, 0.3, 0.01), paint(shade(col, -0.12).getStyle(), 0.8), bx, UP + 2.035 + 0.19, CL.z[0] + 0.2);
    };
    shoebox(CL.x[0] + 0.7, '#C9B8A3');
    shoebox(CL.x[0] + 1.25, '#B4C4CF');
    // Dad's photo: a gold frame on the end wall; world.js paints the portrait into photo.material.map
    const pz = 0.35, py = UP + 1.45;
    const fr = group(g, CL.x[0] + 0.02, py, pz, Math.PI / 2);
    const FW = 0.42, FH = 0.56, B = 0.05;
    add(fr, box(FW + 2 * B, B, 0.04, 0.012), mats.gold, 0, FH / 2 + B / 2, 0.02);
    add(fr, box(FW + 2 * B, B, 0.04, 0.012), mats.gold, 0, -FH / 2 - B / 2, 0.02);
    add(fr, box(B, FH, 0.04, 0.012), mats.gold, -FW / 2 - B / 2, 0, 0.02);
    add(fr, box(B, FH, 0.04, 0.012), mats.gold, FW / 2 + B / 2, 0, 0.02);
    const photo = new THREE.Mesh(new THREE.PlaneGeometry(FW, FH), new THREE.MeshStandardMaterial({ color: '#7A5A3A', roughness: 0.7 }));
    photo.position.z = 0.012;
    fr.add(photo);
    props.dadPhoto = { group: fr, photo, size: [FW, FH] };
    root.updateMatrixWorld(true);
    spots.dadPhoto = photo.getWorldPosition(new THREE.Vector3());
    const light = new THREE.PointLight('#FFE0B8', 1.4, 0, 2);
    light.position.set(-9.1, UP + 2.4, 0);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.camera.near = 0.05;
    light.shadow.bias = -0.002;
    light.shadow.normalBias = 0.02;
    up.add(light);
    props.closetLight = { light };
  }

  // ---------- the hall ----------
  {
    const light = new THREE.PointLight('#FFE3C0', 1.6, 0, 2);
    light.position.set(-2.0, UP + 2.3, -1.6);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.camera.near = 0.05;
    light.shadow.bias = -0.002;
    light.shadow.normalBias = 0.02;
    up.add(light);
    const l2 = new THREE.PointLight('#FFE3C0', 0.9, 0, 2);
    l2.position.set(-5.8, UP + 2.3, -1.6);
    up.add(l2);
    for (const x of [-2.0, -5.8]) {
      const fx = add(up, new THREE.SphereGeometry(0.16, 32, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#F4EBDD', emissive: '#FFE3C0', emissiveIntensity: 0.6 }), x, UP + UH, -1.6);
      fx.castShadow = false;
    }
    props.hallLights = [light, l2];
    spots.laundry = new THREE.Vector3(-2.6, UP, -1.6);
  }

  // ---------- Mom's room (seen in the dollhouse view) ----------
  {
    const g = group(up);
    const teal = fabric('#2FA39A');
    const bx = -5.25, bz = 0.35;
    add(g, box(1.5, 0.3, 2.0, 0.03), mats.wood, bx, UP + 0.2, bz);
    add(g, box(1.42, 0.16, 1.92, 0.05), fabric('#EEE9E1'), bx, UP + 0.42, bz);
    add(g, box(1.46, 0.08, 1.4, 0.04), teal, bx, UP + 0.53, bz + 0.27);
    add(g, box(1.5, 0.9, 0.08, 0.03), mats.wood, bx, UP + 0.55, bz - 1.0);
    for (const s of [-1, 1]) add(g, box(0.5, 0.12, 0.3, 0.05), fabric('#F6F2EA'), bx + s * 0.36, UP + 0.56, bz - 0.78);
    add(g, box(0.45, 0.5, 0.4, 0.02), mats.wood, bx + 1.05, UP + 0.25, bz - 0.75);
    const light = new THREE.PointLight('#FFE0B8', 1.0, 0, 2);
    light.position.set(-5.25, UP + 2.2, 0.8);
    up.add(light);
    props.momLight = { light };
  }

  // ---------- Kip's room ----------
  // The bed against the left wall (head to the back), his present hidden under it, the window in the front wall
  // with a deep sill for the cat, a tall mirror on the right wall, a nightstand lamp, a round rug. The door is in
  // the back wall, from the hall.
  {
    const KR = ROOMS.kipRoom, g = group(up);
    g.name = 'kipRoomProps';
    const win = windowIn(up, 'x', Z1 + T / 2, kipWin[0], kipWin[1], kipWin[2], kipWin[3], UP, -1, mats.nightPlain, 0.34);
    props.kipWindow = win;
    spots.kipSill = new THREE.Vector3(win.center.x, win.sillTop + 0.02, Z1 - 0.1);
    add(g, new THREE.CylinderGeometry(0.85, 0.85, 0.012, 48), fabric('#E2D8C6', { sheen: 0.3 }), -0.3, UP + 0.006, 0.9);
    // bed: frame, mattress, pillow; the blanket is draped by the film over whoever is in it (see bed.drape)
    const bx0 = KR.x[0] + 0.05, bW = 1.15, bL = 2.05, bz0 = KR.z[0] + 0.05;
    const bcx = bx0 + bW / 2, bcz = bz0 + bL / 2;
    const bed = group(g, bcx, UP, bcz);
    bed.name = 'bed';
    for (const [lx, lz] of [[-bW / 2 + 0.05, -bL / 2 + 0.05], [bW / 2 - 0.05, -bL / 2 + 0.05], [-bW / 2 + 0.05, bL / 2 - 0.05], [bW / 2 - 0.05, bL / 2 - 0.05]]) {
      add(bed, box(0.07, 0.31, 0.07, 0.01), mats.darkWood, lx, 0.155, lz);
    }
    add(bed, box(bW, 0.12, bL, 0.03), mats.wood, 0, 0.36, 0);
    add(bed, box(bW - 0.06, 0.16, bL - 0.06, 0.05), fabric('#F2EFE9'), 0, 0.5, 0);
    add(bed, box(bW, 0.95, 0.08, 0.03), mats.wood, 0, 0.475, -bL / 2 - 0.02);
    const pillow = add(bed, box(0.62, 0.12, 0.36, 0.05), fabric('#F8F6F2'), 0, 0.64, -bL / 2 + 0.28);
    const blanket = makeBlanket(bW + 0.08, bL - 0.5, fabric('#4C6EA8', { side: THREE.DoubleSide }));
    blanket.mesh.position.set(0, 0.585, 0.2);
    bed.add(blanket.mesh);
    props.bed = { group: bed, pillow, blanket, top: UP + 0.58, x: bcx, z: bcz, width: bW, length: bL, headZ: bz0 + 0.28 };
    // his present under the bed: yellow paper, a white ribbon, a tag that says KIP
    const pg = group(bed, 0.05, 0, 0.15, 0.12);
    const yellow = paint('#FFB833', 0.5), white = paint('#F7F5F0', 0.5);
    add(pg, box(0.55, 0.22, 0.42, 0.015), yellow, 0, 0.11, 0);
    add(pg, box(0.556, 0.226, 0.06, 0.005), white, 0, 0.11, 0);
    add(pg, box(0.06, 0.226, 0.426, 0.005), white, 0, 0.11, 0);
    for (const s of [-1, 1]) add(pg, new THREE.TorusGeometry(0.04, 0.013, 8, 20), white, s * 0.045, 0.245, 0).rotation.set(0, s * 0.5, s * 0.3);
    const kipTag = paperTexture(256, 160, (c, w2, h2) => {
      c.fillStyle = '#F6EFD8'; c.fillRect(0, 0, w2, h2);
      c.fillStyle = '#2C2622'; c.font = '96px Itim'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('KIP', w2 / 2, h2 / 2 + 4);
    });
    const tg = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.075), new THREE.MeshStandardMaterial({ map: kipTag, roughness: 0.9 }));
    tg.position.set(0.16, 0.14, 0.212);
    tg.rotation.z = -0.12;
    pg.add(tg);
    props.kipPresent = { group: pg };
    root.updateMatrixWorld(true);
    spots.kipPresent = pg.getWorldPosition(new THREE.Vector3());
    spots.bedPillow = pillow.getWorldPosition(new THREE.Vector3());
    // nightstand with a small lamp
    const nx = bx0 + bW + 0.32, nz = KR.z[0] + 0.3;
    add(g, box(0.42, 0.5, 0.38, 0.02), mats.wood, nx, UP + 0.25, nz);
    add(g, new THREE.CylinderGeometry(0.06, 0.08, 0.03, 24), mats.metal, nx, UP + 0.515, nz);
    add(g, new THREE.CylinderGeometry(0.012, 0.012, 0.22, 12), mats.metal, nx, UP + 0.64, nz);
    const ls = add(g, new THREE.CylinderGeometry(0.09, 0.12, 0.14, 32, 1, true), new THREE.MeshStandardMaterial({ color: '#F3E3C6', side: THREE.DoubleSide, emissive: '#FFC58A', emissiveIntensity: 0.5 }), nx, UP + 0.78, nz);
    ls.castShadow = false;
    const nl = new THREE.PointLight('#FFC58A', 0.9, 0, 2);
    nl.position.set(nx, UP + 0.76, nz);
    nl.castShadow = true;
    nl.shadow.mapSize.set(1024, 1024);
    nl.shadow.camera.near = 0.05;
    nl.shadow.bias = -0.002;
    nl.shadow.normalBias = 0.02;
    up.add(nl);
    // the tall mirror on the right wall; world.js turns the glass into a real reflection when a shot needs it
    const mz = 1.15, my = UP + 1.15;
    const mg = group(up, KR.x[1] - 0.03, my, mz, -Math.PI / 2);
    const MW = 0.6, MH = 1.5, MB = 0.05;
    add(mg, box(MW + 2 * MB, MB, 0.04, 0.012), mats.wood, 0, MH / 2 + MB / 2, 0);
    add(mg, box(MW + 2 * MB, MB, 0.04, 0.012), mats.wood, 0, -MH / 2 - MB / 2, 0);
    add(mg, box(MB, MH, 0.04, 0.012), mats.wood, -MW / 2 - MB / 2, 0, 0);
    add(mg, box(MB, MH, 0.04, 0.012), mats.wood, MW / 2 + MB / 2, 0, 0);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(MW, MH), new THREE.MeshStandardMaterial({ color: '#AFC0CC', roughness: 0.1, metalness: 0.8 }));
    glass.position.z = 0.005;
    mg.add(glass);
    props.mirror = { group: mg, glass, size: [MW, MH] };
    root.updateMatrixWorld(true);
    spots.mirror = glass.getWorldPosition(new THREE.Vector3());
    props.kipLamp = { light: nl, shade: ls };
  }

  // ---------- the attic ----------
  // Floorboards, the underside of the gable roof on rafters, a round window in the right gable end with the moon
  // coming through it, an old trunk with brass corners and a few boxes.
  {
    const AT = ROOMS.attic, g = group(root);
    g.name = 'attic';
    const ax0 = AT.x[0] - T, ax1 = AT.x[1] + T;
    floor(g, AT.x[0], AT.x[1], Z0, Z1, ATTIC + 0.001, mats.atticFloor);
    const halfD = 2.45, rise = RIDGE - ATTIC, slope = Math.atan2(rise, halfD), len = Math.hypot(rise, halfD) + 0.25;
    const roofMat = mats.roof, under = plaster('#C7A985');
    const roofs = [];
    for (const s of [-1, 1]) {
      const r = group(g, (ax0 + ax1) / 2, (ATTIC + RIDGE) / 2, s * halfD / 2);
      r.rotation.x = s * slope;
      add(r, box(ax1 - ax0 + 0.4, 0.12, len, 0.02), roofMat, 0, 0.1, 0);
      add(r, box(ax1 - ax0, 0.02, len - 0.25, 0.005), under, 0, 0.03, 0);
      roofs.push(r);
    }
    walls.attic = { back: roofs[0], front: roofs[1] };
    // rafters under the roof, every 0.9 m
    for (let x = ax0 + 0.3; x < ax1 - 0.2; x += 0.9) {
      for (const s of [-1, 1]) {
        const r = group(g, x, (ATTIC + RIDGE) / 2, s * halfD / 2);
        r.rotation.x = s * slope;
        add(r, box(0.08, 0.14, len - 0.3, 0.012), mats.beam, 0, -0.06, 0);
      }
    }
    add(g, box(ax1 - ax0, 0.16, 0.1, 0.015), mats.beam, (ax0 + ax1) / 2, RIDGE - 0.12, 0);
    // gable ends: a triangle of wall at each end; the right one has a round window
    const gable = (x, holeR) => {
      const shp = new THREE.Shape();
      shp.moveTo(-halfD - 0.05, 0); shp.lineTo(halfD + 0.05, 0); shp.lineTo(0, rise + 0.04); shp.closePath();
      if (holeR) { const h = new THREE.Path(); h.absarc(0, 0.85, holeR, 0, Math.PI * 2, true); shp.holes.push(h); }
      const geo = new THREE.ExtrudeGeometry(shp, { depth: T, bevelEnabled: false, curveSegments: 48 });
      geo.translate(0, 0, -T / 2);
      const m = add(g, geo, plaster(AT.wall), x, ATTIC, 0);
      m.rotation.y = Math.PI / 2;
      return m;
    };
    gable(ax0 + T / 2);
    gable(ax1 - T / 2, 0.36);
    const ring = add(g, new THREE.TorusGeometry(0.37, 0.035, 12, 48), mats.trim, ax1 - T / 2, ATTIC + 0.85, 0);
    ring.rotation.y = Math.PI / 2;
    const rw = new THREE.Mesh(new THREE.CircleGeometry(0.36, 48), mats.night);
    rw.position.set(ax1 - 0.02, ATTIC + 0.85, 0);
    rw.rotation.y = -Math.PI / 2;
    g.add(rw);
    for (const a of [0, Math.PI / 2]) {
      const bar = add(g, box(0.03, 0.72, 0.03, 0.008), mats.trim, ax1 - T / 2, ATTIC + 0.85, 0);
      bar.rotation.x = a;
    }
    spots.atticWindow = new THREE.Vector3(ax1 - T / 2, ATTIC + 0.85, 0);
    // the trunk: wood with brass corners and straps; its lid is a separate part (props.trunk.lid)
    const tx = 1.45, tz = 0.25;
    const tg = group(g, tx, ATTIC, tz, -0.35);
    const tw = 0.95, th = 0.46, td = 0.55;
    const woodT = paint('#7A5236', 0.7);
    add(tg, box(tw, th, td, 0.02), woodT, 0, th / 2, 0);
    const lid = group(tg, 0, th, -td / 2);
    const dome = (r, len, open) => {
      const g2 = new THREE.CylinderGeometry(r, r, len, 32, 1, open, -Math.PI / 2, Math.PI);
      g2.rotateZ(-Math.PI / 2);
      g2.rotateX(-Math.PI / 2);
      g2.scale(1, 0.42, 1);
      return g2;
    };
    add(lid, dome(td / 2, tw, false), woodT, 0, 0, td / 2);
    for (const sx of [-0.28, 0.28]) {
      add(tg, box(0.05, th + 0.01, td + 0.012, 0.006), mats.brass, sx, th / 2, 0);
      add(lid, dome(td / 2 + 0.006, 0.05, true), mats.brass, sx, 0, td / 2);
    }
    for (const [cx, cz] of [[-tw / 2, -td / 2], [tw / 2, -td / 2], [-tw / 2, td / 2], [tw / 2, td / 2]]) {
      for (const cy of [0.03, th - 0.03]) add(tg, box(0.07, 0.07, 0.07, 0.012), mats.brass, cx * 0.97, cy, cz * 0.97);
    }
    add(tg, box(0.08, 0.1, 0.02, 0.006), mats.brass, 0, th - 0.02, td / 2 + 0.01);
    props.trunk = { group: tg, lid, size: [tw, th, td] };
    root.updateMatrixWorld(true);
    spots.trunk = tg.getWorldPosition(new THREE.Vector3());
    const rand = mulberry32(41);
    for (const [bx, bz, s] of [[-0.6, -1.2, 0.5], [-1.2, -1.0, 0.36], [0.2, -1.45, 0.42], [-2.6, 0.9, 0.45], [-3.4, -1.1, 0.5]]) {
      add(g, box(s * (1 + rand() * 0.4), s * 0.8, s, 0.012), mats.cardboard, bx, ATTIC + s * 0.4, bz).rotation.y = rand() - 0.5;
    }
    // light: the moon through the round window, and a dim warm fill from below the boards
    const moon = new THREE.DirectionalLight('#A9C1F0', 1.6);
    moon.position.set(ax1 + 4, ATTIC + 2.6, 0.8);
    moon.target.position.set(0.8, ATTIC, 0.2);
    moon.castShadow = true;
    moon.shadow.mapSize.set(2048, 2048);
    Object.assign(moon.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 20 });
    moon.shadow.bias = -0.0004;
    moon.shadow.normalBias = 0.03;
    root.add(moon, moon.target);
    const fill = new THREE.PointLight('#E9C9A0', 0.9, 0, 2);
    fill.position.set(0.0, ATTIC + 1.2, 0.6);
    g.add(fill);
    props.attic = { moon, fill, roofs };
  }

  // ======================= OUTSIDE (the dollhouse view) =======================
  {
    const lawn = new THREE.Mesh(new THREE.PlaneGeometry(80, 60), mats.lawn);
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.set(-4, -0.125, 0);
    lawn.receiveShadow = true;
    lawn.visible = false;
    root.add(lawn);
    props.lawn = lawn;
  }

  // ======================= LIGHTS =======================
  // Lights of rooms the camera is not in are switched off (point lights pass through walls). Each room with a
  // window gets its own moon from that window's side.
  const moonFor = (pos, target, extent = 4.5, intensity = 1.0) => {
    const m = new THREE.DirectionalLight('#A9C1F0', intensity);
    m.position.copy(pos);
    m.target.position.copy(target);
    m.castShadow = true;
    m.shadow.mapSize.set(2048, 2048);
    Object.assign(m.shadow.camera, { left: -extent, right: extent, top: extent, bottom: -extent, near: 0.5, far: 24 });
    m.shadow.camera.updateProjectionMatrix();
    m.shadow.bias = -0.0004;
    m.shadow.normalBias = 0.03;
    root.add(m, m.target);
    return m;
  };
  const moonLiving = moonFor(new THREE.Vector3(-4.5, 4.2, LV.z[0] - 4.6), new THREE.Vector3(-1.2, 0.3, 0));
  const moonKitchen = moonFor(new THREE.Vector3(-6.4, 4.4, KT.z[0] - 4.4), new THREE.Vector3(-5.4, 0.3, 0), 4, 0.8);
  const moonGarage = moonFor(new THREE.Vector3(-14.5, 4.0, 0.6), new THREE.Vector3(-9.0, 0.2, 0), 4, 0.7);
  const moonKip = moonFor(new THREE.Vector3(-1.2, UP + 4.2, 6.5), new THREE.Vector3(-1.5, UP, 0.2), 4, 1.1);
  // the morning sun through Kip's window, for scene 7 (house.morning(true))
  const sun = new THREE.DirectionalLight('#FFE8C2', 2.6);
  sun.position.set(-3.6, UP + 3.4, 7.5);
  sun.target.position.set(-0.6, UP, 0.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 24 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  root.add(sun, sun.target);
  lights.living = [props.lamp.light, props.tv.glow, moonLiving];
  lights.kitchen = [props.pendant.light, moonKitchen];
  lights.garage = [props.garageBulb.light, moonGarage, props.garagePresent.sliver];
  lights.closet = [props.closetLight.light];
  lights.hall = props.hallLights;
  lights.momRoom = [props.momLight.light];
  lights.kipRoom = [props.kipLamp.light, moonKip];
  lights.morning = [sun];
  lights.attic = [props.attic.moon, props.attic.fill];

  root.traverse((o) => {
    if (o.isMesh && (o.material === mats.night || o.material === mats.nightPlain || o.material === mats.morning)) {
      o.castShadow = false; o.receiveShadow = false;
    }
  });
  root.updateMatrixWorld(true);

  const api = {
    root, rooms, props, spots, lights, walls, mats, levels: LEVELS,
    // switch on the lights of the named rooms, everything else off
    light(...names) {
      for (const k in lights) for (const l of lights[k]) l.visible = names.includes(k);
      props.garagePresent.sliver.visible = false;
    },
    // the dollhouse view: front walls and the front of the roof away, the lawn out
    cutaway(on) {
      for (const k of ['living', 'kitchen', 'garage']) if (walls[k] && walls[k].front) walls[k].front.visible = !on;
      walls.upstairs.front.visible = !on;
      walls.attic.front.visible = !on;
      props.lawn.visible = on;
    },
    // morning in Kip's room: the window shows day, the sun comes in, the nightstand lamp is off
    morning(on) {
      props.kipWindow.glass.material = on ? mats.morning : mats.nightPlain;
      props.kipLamp.shade.material.emissiveIntensity = on ? 0 : 0.5;
    },
  };
  return api;
}

// The fridge calendar: a month grid with tomorrow circled in red and KIP'S BIRTHDAY! written big under it.
function drawCalendar(g, w, h) {
  g.fillStyle = '#FBF8F1'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#E8453C'; g.fillRect(0, 0, w, 70);
  g.fillStyle = '#FFFFFF'; g.font = '50px Itim'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('MAY', w / 2, 38);
  const cols = 7, rows = 4, gx = 26, gy = 92, cw = (w - 2 * gx) / cols, ch = 64;
  g.strokeStyle = '#D9D2C4'; g.lineWidth = 2;
  g.fillStyle = '#6B645A'; g.font = '30px Itim';
  let d = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      g.strokeRect(gx + c * cw, gy + r * ch, cw, ch);
      g.fillText(String(d), gx + c * cw + cw / 2, gy + r * ch + ch / 2 + 2);
      d++;
    }
  }
  // tomorrow: the 17th, circled in red marker
  const tr = 2, tc = 2;
  g.strokeStyle = '#E8453C'; g.lineWidth = 7;
  g.beginPath(); g.ellipse(gx + tc * cw + cw / 2, gy + tr * ch + ch / 2, cw * 0.62, ch * 0.5, -0.1, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#E8453C'; g.font = '74px Itim';
  g.fillText("KIP'S", w / 2, h - 136);
  g.fillText('BIRTHDAY!', w / 2, h - 62);
}

// A blanket that drapes over whoever lies under it: a soft subdivided sheet whose height follows a few soft bumps
// (set with drape(bumps)), falling over the bed's sides. bumps: [{ x, z, rx, rz, h }] in the blanket's own frame.
function makeBlanket(W, L, mat) {
  const NX = 28, NZ = 40, overhang = 0.22;
  const geo = new THREE.PlaneGeometry(W + 2 * overhang, L, NX, NZ);
  geo.rotateX(-Math.PI / 2);
  const base = geo.attributes.position.array.slice();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const api = {
    mesh,
    drape(bumps = []) {
      const p = geo.attributes.position.array;
      for (let i = 0; i < p.length; i += 3) {
        const x = base[i], z = base[i + 2];
        // the flat top over the mattress, then the fall over each side edge
        const edge = Math.max(0, Math.abs(x) - W / 2);
        let y = 0.02 - Math.min(edge, overhang) * 1.15;
        let lift = 0;
        for (const b of bumps) {
          const dx = (x - b.x) / b.rx, dz = (z - b.z) / b.rz;
          const q = 1 - (dx * dx + dz * dz);
          if (q > 0) lift = Math.max(lift, b.h * Math.sqrt(q) * (0.6 + 0.4 * q));
        }
        p[i] = x;
        p[i + 1] = y + lift * (edge > 0 ? 0.6 : 1);
        p[i + 2] = z;
      }
      geo.attributes.position.needsUpdate = true;
      geo.computeVertexNormals();
    },
  };
  api.drape([]);
  return api;
}

// The TV screen: a canvas the film draws on. show(state, opts) repaints it; states are drawn by the
// episode through screen.painters[state] = (ctx, w, h, opts) => {}.
export function makeScreen(w = 1280, h = 720) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const material = new THREE.MeshBasicMaterial({ map: tex });
  const screen = {
    canvas: c, texture: tex, material, painters: {}, state: '', key: '',
    show(state, opts = {}) {
      const key = state + JSON.stringify(opts);
      if (key === screen.key) return screen;
      screen.key = key; screen.state = state;
      const g = c.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = '#05070B';
      g.fillRect(0, 0, w, h);
      const p = screen.painters[state];
      if (p) p(g, w, h, opts);
      tex.needsUpdate = true;
      return screen;
    },
  };
  return screen;
}
