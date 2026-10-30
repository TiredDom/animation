// Kip's studio look, shared by the model sheet, the lab and the videos: a warm soft key, a cool rim,
// a sky fill, image-based light from a room, a floor that only shows shadows, a soft contact shadow,
// and ambient occlusion. ES module; 'three' and 'three/addons/' come from the page's import map.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

const DEG = Math.PI / 180;

// Neutral tone mapping darkens and saturates the darkest colours. A flat backdrop is passed
// through the inverse curve first, so it comes out exactly as the CSS colour it stands in for.
function untoned(css) {
  const t = new THREE.Color(css);   // linear
  let c = [t.r, t.g, t.b];
  const start = 0.76, d = 0.24, desat = 0.15;
  const newPeak = Math.max(...c);
  if (newPeak >= start) {
    const peak = (d * d) / (1 - newPeak) - d + start;
    const g = 1 - 1 / (desat * (peak - newPeak) + 1);
    c = c.map((v) => ((v - g * newPeak) / (1 - g)) * (peak / newPeak));
  }
  const m = Math.min(...c);
  const off = m < 0.04 ? Math.sqrt(m / 6.25) - m : 0.04;
  return new THREE.Color().setRGB(c[0] + off, c[1] + off, c[2] + off, THREE.LinearSRGBColorSpace);
}

function blobTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(0,0,0,0.5)');
  grd.addColorStop(0.45, 'rgba(0,0,0,0.2)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeStudio(renderer, { background = '#DCE2E9' } = {}) {
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const key = new THREE.DirectionalLight(0xfff2e4, 2.3);
  key.position.set(2.4, 4.6, 3.4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -1.5, right: 1.5, top: 2.3, bottom: -0.8, near: 1, far: 12 });
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.02;
  const rim = new THREE.DirectionalLight(0xdce6ff, 1.7);
  rim.position.set(-3.2, 2.8, -3.8);
  const sky = new THREE.HemisphereLight(0xf3f6ff, 0xb7aa9a, 0.5);
  // A soft fill from the camera side, slightly low, so the chin and the underside of the face stay clean.
  const fill = new THREE.DirectionalLight(0xfff8f0, 0.55);
  fill.position.set(0.5, 0.9, 5);
  fill.target.position.set(0, 1.2, 0);
  scene.add(key, rim, sky, fill, fill.target);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(8, 64), new THREE.ShadowMaterial({ opacity: 0.14 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  const blob = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 1.2),
    new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false }),
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.003;
  scene.add(floor, blob);

  const studio = {
    scene, key, rim, sky, fill, floor, blob,
    setBackground(css) { scene.background = untoned(css); },
  };
  studio.setBackground(background);
  return studio;
}

// Render through AO: scene → GTAO → (ghosts) → OutputPass (tone mapping + sRGB). Sizes are CSS pixels;
// call setPixelRatio / setSize on the result when the canvas changes. With { ghosts: true } the composer gets a
// GhostPass (composer.ghosts) that lays the ghost layer over the frame.
export function makeComposer(renderer, scene, camera, w, h, opts = {}) {
  const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  const ao = new GTAOPass(scene, camera, w, h);
  ao.blendIntensity = 0.85;
  ao.updateGtaoMaterial({ radius: 0.25, distanceExponent: 1.5, thickness: 1, scale: 1, samples: 16 });
  ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
  composer.addPass(ao);
  composer.ao = ao;
  if (opts.ghosts) {
    composer.ghosts = new GhostPass(scene, camera, w, h, opts.ghosts === true ? {} : opts.ghosts);
    composer.addPass(composer.ghosts);
  }
  composer.addPass(new OutputPass());
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(w, h);
  return composer;
}

// Ghosts are characters on layer 1, drawn as one see-through layer: rendered on their own (hidden by whatever
// stands in front of them, never showing one of their parts through another), then laid over the frame at
// `opacity`. They cast and catch no shadows and get no AO. ghostify(root) puts a rig on the layer and tints it.
export const GHOST_LAYER = 1;

export class GhostPass extends Pass {
  constructor(scene, camera, w, h, { opacity = 0.55 } = {}) {
    super();
    this.scene = scene;
    this.camera = camera;
    this.target = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4 });
    this.depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false });
    this.quad = new FullScreenQuad(new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null }, tGhost: { value: null }, opacity: { value: opacity } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `
        uniform sampler2D tDiffuse; uniform sampler2D tGhost; uniform float opacity; varying vec2 vUv;
        void main() {
          vec4 base = texture2D(tDiffuse, vUv);
          vec4 g = texture2D(tGhost, vUv);
          vec3 gc = g.a > 0.0001 ? g.rgb / g.a : vec3(0.0);
          gl_FragColor = vec4(mix(base.rgb, gc, clamp(g.a, 0.0, 1.0) * opacity), base.a);
        }`,
    }));
  }
  // Switch the pass off (enabled = false) in shots without a ghost; the composer then skips it.
  get opacity() { return this.quad.material.uniforms.opacity.value; }
  set opacity(v) { this.quad.material.uniforms.opacity.value = v; }
  setSize(w, h) { this.target.setSize(w, h); }
  render(renderer, writeBuffer, readBuffer) {
    const { scene, camera, quad } = this;
    const out = this.renderToScreen ? null : writeBuffer;
    scene.traverse((o) => { if (o.isLight) o.layers.enable(GHOST_LAYER); });
    const mask = camera.layers.mask, bg = scene.background, ov = scene.overrideMaterial;
    const shadowAuto = renderer.shadowMap.autoUpdate, autoClear = renderer.autoClear;
    const clearColor = renderer.getClearColor(new THREE.Color()), clearAlpha = renderer.getClearAlpha();
    renderer.shadowMap.autoUpdate = false;
    renderer.autoClear = false;
    scene.background = null;
    renderer.setRenderTarget(this.target);
    renderer.setClearColor(0x000000, 0);
    renderer.clear(true, true, true);
    camera.layers.set(0);
    scene.overrideMaterial = this.depthOnly;
    renderer.render(scene, camera);
    scene.overrideMaterial = ov;
    camera.layers.set(GHOST_LAYER);
    renderer.render(scene, camera);
    camera.layers.mask = mask;
    scene.background = bg;
    renderer.shadowMap.autoUpdate = shadowAuto;
    renderer.autoClear = autoClear;
    renderer.setClearColor(clearColor, clearAlpha);
    quad.material.uniforms.tDiffuse.value = readBuffer.texture;
    quad.material.uniforms.tGhost.value = this.target.texture;
    renderer.setRenderTarget(out);
    quad.render(renderer);
  }
}

// Put a rig on the ghost layer: no shadows, and every material tinted toward a pale blue with a brighter rim
// at grazing angles (lit like everything else, so a ghost in a dark room stays dark; nothing glows).
export function ghostify(root, { tint = '#A8CFFF', amount = 0.45, rim = 0.4 } = {}) {
  const tintC = new THREE.Color(tint);
  root.traverse((o) => {
    o.layers.set(GHOST_LAYER);
    if (!o.isMesh) return;
    o.castShadow = false;
    o.receiveShadow = false;
    const m = o.material;
    if (m.userData.ghost) return;
    m.userData.ghost = true;
    m.onBeforeCompile = (sh) => {
      sh.uniforms.ghostTint = { value: tintC };
      sh.fragmentShader = 'uniform vec3 ghostTint;\n' + sh.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
        {
          float L = dot(gl_FragColor.rgb, vec3(0.2126, 0.7152, 0.0722));
          float Lt = dot(ghostTint, vec3(0.2126, 0.7152, 0.0722));
          vec3 tinted = mix(gl_FragColor.rgb, ghostTint * (L / Lt), ${amount.toFixed(3)});
          float facing = abs(dot(normalize(normal), normalize(vViewPosition)));
          gl_FragColor.rgb = tinted * (1.0 + ${rim.toFixed(3)} * pow(1.0 - facing, 2.0));
        }`);
    };
    m.customProgramCacheKey = () => 'ghost';
    m.needsUpdate = true;
  });
}

// Frame the whole body or the face on a long lens, whatever the aspect. `fit` is the character's own
// framing (a design's `fit`, e.g. Mom's); without it the numbers are Kip's.
const KIP_FIT = { y: 0.88, h: 2.15, w: 1.75, lift: 0.12, faceY: 1.37, faceH: 1.0, faceW: 0.95 };
export function frame(camera, aspect, framing, fit) {
  const f = Object.assign({}, KIP_FIT, fit || {});
  const face = framing === 'face';
  const target = new THREE.Vector3(0, face ? f.faceY : f.y, 0);
  const needH = face ? f.faceH : f.h, needW = face ? f.faceW : f.w;
  const t = Math.tan((camera.fov * DEG) / 2);
  const d = Math.max(needH / 2 / t, needW / 2 / (t * aspect));
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  camera.position.set(0, target.y + (face ? 0.02 : f.lift), d);
  camera.lookAt(target);
}
