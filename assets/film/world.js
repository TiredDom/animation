// The film's 3D world: one renderer for the whole film, Kip's house, the cast and their ghosts, the props, and
// the shot list that poses them. The composition (index.html, on hf-seek) and the board lab (tools/lab.html)
// both draw through world.renderAt(t), so a still on the board is the frame the film renders.
//
// Needs window.Mascot (assets/kit/mascot.js, then cat.js) loaded first, and an import map for 'three'.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { makeComposer, ghostify } from '../kit/studio.js';
import { buildHouse } from '../kit/house.js';
import { paintScreens } from './screens.js';
import { SHOTS } from './shots.js';

// Lenses (vertical FOV) from the spec.
export const LENS = { wide: 38, medium: 27, close: 16 };

const mat = (color, o) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.55 }, o || {}));
const cloth = (color, o) => new THREE.MeshPhysicalMaterial(Object.assign({ color, roughness: 0.9, sheen: 0.5, sheenRoughness: 0.5 }, o || {}));
const rbox = (w, h, d, r = 0.012) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4));
function mesh(parent, geo, m, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, m);
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}
function shadows(g) { g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; }

// ---------- hand props ----------

// A rounded dark-grey gamepad, about 26 cm across in Kip's scale. gripL / gripR are where the hand balls go: on
// the grip ends, so the hands cover them (the grip drawn over the controller).
function makeController() {
  const g = new THREE.Group();
  g.name = 'controller';
  const m = mat('#3A3F47', { roughness: 0.5 }), btn = mat('#626A75', { roughness: 0.45 });
  mesh(g, rbox(0.2, 0.045, 0.1, 0.02), m);
  for (const s of [-1, 1]) {
    const grip = mesh(g, new THREE.CapsuleGeometry(0.032, 0.07, 6, 16), m, s * 0.095, -0.014, -0.035);
    grip.rotation.set(-1.15, 0, s * 0.4);
    mesh(g, new THREE.CylinderGeometry(0.016, 0.018, 0.018, 16), btn, s * 0.035, 0.03, -0.012);
  }
  for (const [x, z] of [[0.068, 0.0], [0.082, 0.014], [0.082, -0.014], [0.096, 0.0]]) {
    mesh(g, new THREE.CylinderGeometry(0.007, 0.007, 0.01, 12), btn, x, 0.025, z);
  }
  mesh(g, rbox(0.032, 0.01, 0.01, 0.003), btn, -0.08, 0.025, 0);
  mesh(g, rbox(0.01, 0.01, 0.032, 0.003), btn, -0.08, 0.025, 0);
  g.userData.gripL = new THREE.Vector3(0.118, -0.04, -0.07);
  g.userData.gripR = new THREE.Vector3(-0.118, -0.04, -0.07);
  return g;
}

// Mom's mug of tea with two thin steam wisps (animated by userData.steam(t) on a 1.6 s loop). Local origin at the
// mug's base; userData.handle is where her hand ball goes.
function makeMug() {
  const g = new THREE.Group();
  g.name = 'mug';
  const glaze = mat('#E9DCC8', { roughness: 0.35 });
  const body = new THREE.LatheGeometry([[0, 0], [0.042, 0], [0.046, 0.005], [0.047, 0.1], [0.043, 0.1], [0.042, 0.012], [0, 0.012]]
    .map(([x, y]) => new THREE.Vector2(x, y)), 40);
  mesh(g, body, glaze);
  mesh(g, new THREE.CircleGeometry(0.042, 32), mat('#9A5A2E', { roughness: 0.2 }), 0, 0.085, 0).rotation.x = -Math.PI / 2;
  const handle = mesh(g, new THREE.TorusGeometry(0.03, 0.009, 10, 24, Math.PI * 1.2), glaze, 0.055, 0.052, 0);
  handle.rotation.z = -Math.PI * 0.6;
  const wisps = [];
  const steamMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide });
  for (let i = 0; i < 2; i++) {
    const pts = [];
    for (let k = 0; k <= 12; k++) pts.push(new THREE.Vector3(0, 0.1 + k * 0.012, 0));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.0035, 6), steamMat.clone());
    tube.userData.base = pts.map((p) => p.clone());
    tube.castShadow = false;
    g.add(tube);
    wisps.push(tube);
  }
  shadows(g);
  for (const w of wisps) { w.castShadow = false; w.receiveShadow = false; }
  g.userData.handle = new THREE.Vector3(0.09, 0.05, 0);
  g.userData.steam = (t, on = true) => {
    wisps.forEach((w, i) => {
      w.visible = on;
      if (!on) return;
      const ph = (t / 1.6) * Math.PI * 2 + i * 2.4;
      const pts = w.userData.base.map((p, k) => new THREE.Vector3(
        (i ? 0.012 : -0.01) + Math.sin(ph + k * 0.55) * 0.006 * (k / 12) * 2.4,
        p.y + Math.sin(ph * 0.5 + i) * 0.004,
        Math.cos(ph * 0.8 + k * 0.4) * 0.004 * (k / 12) * 2));
      w.geometry.dispose();
      w.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.0035 * (1 - 0.3 * i), 6);
      w.material.opacity = 0.22 + 0.06 * Math.sin(ph);
    });
  };
  return g;
}

// Mom's phone: rounded, dark. Local origin at its centre, screen facing +z.
function makePhone() {
  const g = new THREE.Group();
  g.name = 'phone';
  mesh(g, rbox(0.075, 0.15, 0.011, 0.01), mat('#2B2F36', { roughness: 0.35 }));
  mesh(g, rbox(0.066, 0.138, 0.002, 0.006), mat('#151820', { roughness: 0.15 }), 0, 0, 0.0056);
  return shadows(g);
}

// A black marker with a white cap. Local origin at the barrel's middle, the tip toward +y; userData.cap is the cap
// (the shot moves it), userData.tip the writing point.
function makeMarker() {
  const g = new THREE.Group();
  g.name = 'marker';
  const black = mat('#1E1F22', { roughness: 0.4 }), white = mat('#F2F0EB', { roughness: 0.4 });
  mesh(g, new THREE.CapsuleGeometry(0.012, 0.11, 6, 16), black);
  mesh(g, new THREE.ConeGeometry(0.009, 0.022, 16), black, 0, 0.075, 0);
  const cap = new THREE.Group();
  mesh(cap, new THREE.CapsuleGeometry(0.0135, 0.04, 6, 16), white, 0, 0, 0);
  mesh(cap, rbox(0.006, 0.03, 0.006, 0.002), white, 0.014, 0.0, 0);
  cap.position.y = 0.07;
  g.add(cap);
  g.userData.cap = cap;
  g.userData.tip = new THREE.Vector3(0, 0.088, 0);
  return shadows(g);
}

// A cupcake with one striped candle and a small flame (with its own warm light).
function makeCupcake() {
  const g = new THREE.Group();
  g.name = 'cupcake';
  mesh(g, new THREE.CylinderGeometry(0.06, 0.046, 0.06, 24), mat('#F2A7B5', { roughness: 0.6 }), 0, 0.03, 0);
  const cream = mat('#FFF4EE', { roughness: 0.5 });
  for (const [r, y] of [[0.058, 0.07], [0.044, 0.095], [0.028, 0.115]]) {
    mesh(g, new THREE.TorusGeometry(r, 0.02, 12, 28), cream, 0, y, 0).rotation.x = Math.PI / 2;
  }
  mesh(g, new THREE.SphereGeometry(0.018, 16, 12), cream, 0, 0.13, 0);
  mesh(g, new THREE.CylinderGeometry(0.006, 0.006, 0.07, 12), mat('#7FB4E8'), 0, 0.175, 0);
  shadows(g);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.011, 16, 12), new THREE.MeshBasicMaterial({ color: '#FFD27A' }));
  flame.scale.set(1, 1.7, 1);
  flame.position.y = 0.226;
  g.add(flame);
  const light = new THREE.PointLight('#FFB45E', 0.25, 2.5, 2);
  light.position.y = 0.24;
  g.add(light);
  g.userData.flame = flame;
  g.userData.light = light;
  return g;
}

// ---------- Mom's three decoys ----------

// A laundry pile lying on the floor like a body, face down, its head toward -z: lumps of cloth in muted colours.
function makeLaundryBody() {
  const g = new THREE.Group();
  g.name = 'laundry';
  const cols = ['#8D9CB0', '#B0907A', '#9AA889', '#C4B49A', '#7E7A8E'].map((c) => cloth(c));
  mesh(g, new THREE.SphereGeometry(0.2, 24, 16), cols[3], 0, 0.15, -0.72).scale.set(1.1, 0.75, 1);
  mesh(g, rbox(0.5, 0.2, 0.62, 0.09), cols[0], 0, 0.1, -0.25).rotation.y = 0.05;
  mesh(g, rbox(0.42, 0.14, 0.3, 0.06), cols[1], 0.03, 0.2, -0.32).rotation.set(0.1, 0.4, 0.05);
  for (const s of [-1, 1]) {
    mesh(g, new THREE.CapsuleGeometry(0.075, 0.5, 6, 14), cols[2], s * 0.13, 0.075, 0.32).rotation.set(Math.PI / 2, 0, s * 0.08);
    mesh(g, new THREE.CapsuleGeometry(0.06, 0.38, 6, 14), cols[4], s * 0.38, 0.06, -0.3).rotation.set(Math.PI / 2, 0, s * 0.5);
  }
  mesh(g, rbox(0.3, 0.06, 0.24, 0.03), cols[1], -0.2, 0.03, 0.05).rotation.y = 0.6;
  return shadows(g);
}

// Dad's coat slumped on a chair with his hat on top, so it reads as a man asleep there. Origin at the seat, facing +z.
function makeCoatOnChair() {
  const g = new THREE.Group();
  g.name = 'coat';
  const coat = cloth('#6B4E3A'), hatM = cloth('#3E3530', { sheen: 0.3 });
  mesh(g, rbox(0.46, 0.56, 0.3, 0.12), coat, 0, 0.3, -0.05).rotation.x = -0.18;
  mesh(g, rbox(0.4, 0.14, 0.34, 0.06), coat, 0, 0.06, 0.08);
  for (const s of [-1, 1]) mesh(g, new THREE.CapsuleGeometry(0.065, 0.42, 6, 14), coat, s * 0.27, 0.25, 0.02).rotation.set(0.15, 0, s * 0.12);
  mesh(g, new THREE.TorusGeometry(0.11, 0.045, 10, 24), coat, 0, 0.6, -0.08).rotation.x = Math.PI / 2 - 0.2;
  const hat = new THREE.Group();
  hat.position.set(0, 0.72, -0.1);
  hat.rotation.set(0.25, 0.3, 0.12);
  mesh(hat, new THREE.CylinderGeometry(0.13, 0.15, 0.13, 28), hatM, 0, 0.065, 0);
  mesh(hat, new THREE.CylinderGeometry(0.25, 0.25, 0.016, 32), hatM, 0, 0.008, 0);
  mesh(hat, new THREE.CylinderGeometry(0.152, 0.152, 0.03, 28), cloth('#8C3A2E'), 0, 0.03, 0);
  g.add(hat);
  return shadows(g);
}

// A heap of couch cushions under the throw, shaped like someone curled up on the floor.
function makeCushionHeap(sage) {
  const g = new THREE.Group();
  g.name = 'cushions';
  mesh(g, rbox(0.55, 0.16, 0.6, 0.07), sage, 0, 0.08, 0).rotation.y = 0.2;
  mesh(g, rbox(0.52, 0.4, 0.16, 0.07), sage, 0.05, 0.25, -0.12).rotation.set(-0.9, 0.4, 0.1);
  mesh(g, rbox(0.52, 0.4, 0.16, 0.07), sage, -0.22, 0.2, 0.18).rotation.set(-1.2, -0.5, 0.2);
  mesh(g, rbox(0.8, 0.05, 0.7, 0.025), cloth('#C9A87C'), 0, 0.36, 0.02).rotation.set(0.12, 0.3, -0.08);
  mesh(g, new THREE.SphereGeometry(0.16, 20, 14), sage, 0.36, 0.16, -0.18).scale.set(1, 0.8, 1);
  return shadows(g);
}

// ---------- Dad's photo ----------

// Dad in Kip's style, rendered once into the closet photo: Kip's build with a huge afro, a curly mustache and a
// disco shirt, smiling, on a warm seventies backdrop.
function paintDadPhoto(renderer, house, Mascot) {
  const W = 600, H = 800;
  const scene = new THREE.Scene();
  const bg = document.createElement('canvas');
  bg.width = 64; bg.height = 256;
  const bgx = bg.getContext('2d');
  const grd = bgx.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, '#C9894A'); grd.addColorStop(1, '#7A4524');
  bgx.fillStyle = grd; bgx.fillRect(0, 0, 64, 256);
  scene.background = new THREE.CanvasTexture(bg);
  scene.background.colorSpace = THREE.SRGBColorSpace;
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.5;
  const key = new THREE.DirectionalLight('#FFE2BE', 2.4);
  key.position.set(1.5, 3, 3);
  scene.add(key, new THREE.HemisphereLight('#FFF0DC', '#5A3A24', 0.6));
  const dad = Mascot.create(THREE, { colorway: { hoodie: '#D9772E', trim: '#8C3F1A', strings: '#F3D9A4', hair: '#2A1A12', skin: '#C98E62', pants: '#4A3020' }, seed: 9 });
  // a loud disco pattern on the shirt
  const pc = document.createElement('canvas');
  pc.width = 256; pc.height = 256;
  const p = pc.getContext('2d');
  p.fillStyle = '#D9772E'; p.fillRect(0, 0, 256, 256);
  for (let i = -4; i < 12; i++) {
    p.fillStyle = i % 2 ? '#F2C14E' : '#8C3F1A';
    p.save(); p.translate(i * 32, 0); p.rotate(0.5); p.fillRect(0, -40, 14, 400); p.restore();
  }
  const tex = new THREE.CanvasTexture(pc);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  dad.mats.hoodie.map = tex;
  dad.mats.hoodie.color.set('#ffffff');
  dad.mats.hoodie.needsUpdate = true;
  // a shirt, not a hoodie: no drawstrings, and a big pointed seventies collar over the neckline
  dad.root.traverse((o) => { if (o.isMesh && o.material === dad.mats.strings) o.visible = false; });
  const collarMat = new THREE.MeshStandardMaterial({ color: '#F3D9A4', roughness: 0.7, side: THREE.DoubleSide });
  for (const s of [-1, 1]) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([0.02 * s, 1.0, 0.235, 0.17 * s, 1.05, 0.17, 0.19 * s, 0.87, 0.175], 3));
    g.computeVertexNormals();
    const flap = new THREE.Mesh(g, collarMat);
    flap.position.y = -0.6;
    dad.joints.spine.add(flap);
  }
  // the afro: a big soft bumpy ball behind and above his head, its front pressed back behind the face, so from the
  // front it rings the head and never covers the face
  const afroG = new THREE.SphereGeometry(1, 72, 54);
  const pos = afroG.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const n = new THREE.Vector3().fromBufferAttribute(pos, i);
    const bump = 1 + 0.06 * Math.sin(n.x * 23) * Math.sin(n.y * 19) * Math.sin(n.z * 21) + 0.035 * Math.sin(n.x * 41 + n.y * 37);
    pos.setXYZ(i, n.x * 0.7 * bump, n.y * 0.62 * bump, (n.z > 0 ? n.z * 0.32 : n.z) * 0.6 * bump);
  }
  afroG.computeVertexNormals();
  const skull = dad.joints.head.children[0];
  const afro = new THREE.Mesh(afroG, new THREE.MeshStandardMaterial({ color: '#2A1A12', roughness: 0.95 }));
  afro.position.set(0, 0.22, -0.14);
  skull.add(afro);
  dad.setPose({ head: [-3, -6, 5], spine: [-2, -4, 0], armL: [-12, 0, 30], elbowL: [-70, 0, 0], armR: [-10, 0, 16], elbowR: [-20, 0, 0] });
  dad.setExpression({ happy: 0.55, mouthCurve: 1, mouthOpen: 0.38, teeth: 1, mouthWide: 1.15, browUp: 0.3, mustache: 1, blush: 0.3 });
  dad.root.rotation.y = 0.14;
  scene.add(dad.root);
  // head and shoulders with the whole afro: the frame runs from his chest to just over the hair
  const cam = new THREE.PerspectiveCamera(24, W / H, 0.1, 30);
  cam.position.set(0.12, 1.6, 3.6);
  cam.lookAt(0, 1.52, 0);
  // render at the photo's own size (tone mapped like the film), copy it out, and restore the canvas
  const size = renderer.getSize(new THREE.Vector2());
  renderer.setSize(W, H, false);
  renderer.setRenderTarget(null);
  renderer.render(scene, cam);
  const out = document.createElement('canvas');
  out.width = W; out.height = H;
  out.getContext('2d').drawImage(renderer.domElement, 0, 0, W, H, 0, 0, W, H);
  renderer.setSize(size.x, size.y, false);
  const photoTex = new THREE.CanvasTexture(out);
  photoTex.colorSpace = THREE.SRGBColorSpace;
  house.props.dadPhoto.photo.material = new THREE.MeshStandardMaterial({ map: photoTex, roughness: 0.35 });
  return out;
}

export async function createWorld(canvas, { width = 1920, height = 1080 } = {}) {
  const Mascot = window.Mascot;
  const font = new FontFace('Itim', 'url(' + new URL('../fonts/Itim-Regular.ttf', import.meta.url).href + ')');
  document.fonts.add(await font.load());

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const bgNight = new THREE.Color('#0E1118');
  scene.background = bgNight;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.15;
  const hemi = new THREE.HemisphereLight('#2E3B5C', '#3B2E25', 0.35);
  scene.add(hemi);
  // the night sky behind the dollhouse view
  const skyC = document.createElement('canvas');
  skyC.width = 16; skyC.height = 256;
  const sg = skyC.getContext('2d');
  const sgr = sg.createLinearGradient(0, 0, 0, 256);
  sgr.addColorStop(0, '#0B1226'); sgr.addColorStop(1, '#22345E');
  sg.fillStyle = sgr; sg.fillRect(0, 0, 16, 256);
  const bgSky = new THREE.CanvasTexture(skyC);
  bgSky.colorSpace = THREE.SRGBColorSpace;

  const house = buildHouse();
  scene.add(house.root);
  paintScreens(house.props.tv);
  const dadPortrait = paintDadPhoto(renderer, house, Mascot);

  // Every body has a ghost twin: a second rig drawn see-through by the composer's ghost pass.
  const cast = {
    kip: Mascot.create(THREE, { colorway: 'sunny', seed: 1 }),
    ghostKip: Mascot.create(THREE, { colorway: 'sunny', seed: 3 }),
    mom: Mascot.create(THREE, { design: 'mom', seed: 2 }),
    ghostMom: Mascot.create(THREE, { design: 'mom', seed: 4 }),
    cat: Mascot.createCat(THREE),
    ghostCat: Mascot.createCat(THREE, { seed: 13 }),
  };
  for (const k of ['ghostKip', 'ghostMom', 'ghostCat']) ghostify(cast[k].root, { amount: 0.72, rim: 0.8 });
  const ghosts = [cast.ghostKip, cast.ghostMom, cast.ghostCat];
  for (const c of Object.values(cast)) scene.add(c.root);

  // the gap of light under the garage present's lid, seen from inside the box (shot 29)
  const slit = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: '#FFE4B8' }));
  slit.name = 'slit';
  const props = {
    controller: makeController(), mug: makeMug(), phone: makePhone(), marker: makeMarker(), cupcake: makeCupcake(),
    laundry: makeLaundryBody(), coat: makeCoatOnChair(), cushions: makeCushionHeap(house.props.couch.mat), slit,
  };
  for (const p of Object.values(props)) scene.add(p);

  // the mirror in Kip's room becomes a real reflection only in the shots that show it
  const mg = house.props.mirror;
  const reflector = new Reflector(new THREE.PlaneGeometry(mg.size[0], mg.size[1]), {
    clipBias: 0.003, textureWidth: 1024, textureHeight: 2048, color: 0xc8d0d6,
  });
  reflector.position.copy(mg.glass.position);
  reflector.visible = false;
  mg.group.add(reflector);

  const camera = new THREE.PerspectiveCamera(LENS.medium, width / height, 0.05, 120);
  const composer = makeComposer(renderer, scene, camera, width, height, { ghosts: true });

  const pointShadows = [];
  house.root.traverse((o) => { if (o.isPointLight && o.castShadow) pointShadows.push(o); });

  const world = {
    THREE, Mascot, renderer, scene, camera, composer, house, cast, ghosts, props, width, height, SHOTS, LENS, dadPortrait,
    // camera from a position to a look-at point, with a vertical FOV and an optional roll in degrees
    cam(pos, look, fov = LENS.medium, roll = 0) {
      camera.fov = fov;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      camera.position.set(pos[0], pos[1], pos[2]);
      camera.up.set(0, 1, 0);
      camera.lookAt(look[0], look[1], look[2]);
      if (roll) camera.rotateZ((roll * Math.PI) / 180);
    },
    // camera framing a point: it sits at azimuth `az` (degrees; 0 = on the +z side, 90 = on the +x side) and
    // elevation `el` above the point, far enough that the frame is `h` metres tall there
    frameOn(look, h, { az = 0, el = 0, fov = LENS.medium, roll = 0, dx = 0, dy = 0 } = {}) {
      const d = h / 2 / Math.tan((fov * Math.PI) / 360), a = (az * Math.PI) / 180, e = (el * Math.PI) / 180;
      const pos = [look[0] + d * Math.sin(a) * Math.cos(e), look[1] + d * Math.sin(e), look[2] + d * Math.cos(a) * Math.cos(e)];
      world.cam(pos, look, fov, roll);
      if (dx || dy) { camera.translateX(dx); camera.translateY(dy); }
      return pos;
    },
    // show a rig at a place, turned yaw degrees from facing +z
    put(rig, x, y, z, yaw = 0) {
      rig.root.visible = true;
      rig.root.position.set(x, y, z);
      rig.root.rotation.set(0, (yaw * Math.PI) / 180, 0);
      return rig;
    },
    // yaw (degrees) that turns something at `from` to face the point `to` (both [x, y, z])
    yawTo(from, to) { return (Math.atan2(to[0] - from[0], to[2] - from[2]) * 180) / Math.PI; },
    // the light of the moment: night (the default), morning (Kip's room in the sun), or the dollhouse view
    mood(name) {
      if (name === 'morning') {
        scene.environmentIntensity = 0.6;
        hemi.color.set('#DCE6F2'); hemi.groundColor.set('#8A7460'); hemi.intensity = 0.55;
        house.morning(true);
      } else if (name === 'title') {
        scene.environmentIntensity = 0.3;
        scene.background = bgSky;
        house.cutaway(true);
        for (const l of pointShadows) l.castShadow = false;
      }
    },
    shotAt(t) {
      for (const s of SHOTS) if (t >= s.start && t < s.end) return s;
      return t < SHOTS[0].start ? SHOTS[0] : SHOTS[SHOTS.length - 1];
    },
    // Everything starts hidden in every frame; the shot shows and poses what it needs.
    reset() {
      for (const c of Object.values(cast)) {
        c.root.visible = false;
        c.root.scale.set(1, 1, 1);
        c.root.rotation.set(0, 0, 0);
        if (c.root.parent !== scene) scene.add(c.root);
      }
      for (const p of Object.values(props)) {
        p.visible = false;
        p.scale.set(1, 1, 1);
        p.rotation.set(0, 0, 0);
        if (p.parent !== scene) scene.add(p);
      }
      for (const room of Object.values(house.walls)) for (const w of Object.values(room)) w.visible = true;
      const mk = props.marker, cap = mk.userData.cap;
      if (cap.parent !== mk) mk.add(cap);
      cap.position.set(0, 0.07, 0);
      cap.rotation.set(0, 0, 0);
      cap.scale.set(1, 1, 1);
      cap.visible = true;
      const pr = house.props;
      for (const c of pr.garagePresent.group.children) c.visible = true;
      pr.garagePresent.inside.visible = false;
      pr.garagePresent.socks.visible = false;
      pr.garagePresent.group.visible = true;
      pr.garagePresent.group.scale.set(1, 1, 1);
      for (const c of pr.couch.seats.concat(pr.couch.backs)) c.visible = true;
      pr.kipPresent.group.visible = true;
      pr.bed.blanket.drape([]);
      pr.trunk.lid.rotation.x = 0;
      reflector.visible = false;
      mg.glass.visible = true;
      house.cutaway(false);
      house.morning(false);
      house.light('living');
      scene.background = bgNight;
      scene.environmentIntensity = 0.15;
      hemi.color.set('#2E3B5C'); hemi.groundColor.set('#3B2E25'); hemi.intensity = 0.35;
      for (const l of pointShadows) l.castShadow = true;
      composer.ghosts.opacity = 0.55;
    },
    mirror(on) { reflector.visible = on; mg.glass.visible = !on; },
    renderAt(t) {
      const shot = world.shotAt(t);
      world.reset();
      shot.pose(world, t - shot.start, t, shot);
      composer.ghosts.enabled = ghosts.some((g) => g.root.visible);
      composer.render();
      return shot;
    },
  };
  return world;
}
