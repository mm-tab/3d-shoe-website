import * as THREE from 'three';
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass }      from 'three/addons/postprocessing/OutputPass.js';

/* ═══════════════════════════════════════
   RENDERER
═══════════════════════════════════════ */
const canvas   = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled   = true;
renderer.shadowMap.type      = THREE.PCFSoftShadowMap;
renderer.toneMapping         = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;
renderer.setClearColor(0x000000);

const scene = new THREE.Scene();
scene.fog   = new THREE.FogExp2(0x000000, 0.008);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 600);
camera.position.set(1.5, 1.0, 4);

/* ═══════════════════════════════════════
   POST-PROCESSING
═══════════════════════════════════════ */
const composer   = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass  = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight), 0.6, 0.4, 0.80
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

/* ═══════════════════════════════════════
   HELPERS
   NOTE: THREE.Object3D.add() returns 'this' (the parent), NOT the
   added object. Never chain .position.set() after .add() — always
   save to a variable first and set position before adding.
═══════════════════════════════════════ */
function mkMesh(parent, geo, mat, px=0, py=0, pz=0, rx=0, ry=0, rz=0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(px, py, pz);
  m.rotation.set(rx, ry, rz);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}

function mkPL(parent, color, intensity, distance, px, py, pz) {
  const l = new THREE.PointLight(color, intensity, distance);
  l.position.set(px, py, pz);
  parent.add(l);
  return l;
}

/* ═══════════════════════════════════════
   CAMERA PATH
   Room centres (world Z): 0 / -70 / -140 / -210 / -285

   Room 0 – 3/4 hero, full shoe
   Room 1 – camera HIGH ABOVE, looking DOWN at flipped sole (ZoomX foam)
   Room 2 – camera to the RIGHT, seeing side profile (carbon plate)
   Room 3 – camera FRONT-ABOVE, seeing upper knit (Flyknit)
   Room 4 – pulled back, dramatic low angle (Finale)
═══════════════════════════════════════ */
const camPath = new THREE.CatmullRomCurve3([
  new THREE.Vector3( 1.5,  1.0,   4.0),   // 0  Room 0 hero
  new THREE.Vector3( 0.6,  0.6,   0.5),   // 1  push in
  new THREE.Vector3( 0.0,  0.4,  -8.0),   // 2  past shoe
  new THREE.Vector3( 0.0,  1.0, -28.0),   // 3  rising
  new THREE.Vector3( 0.0,  2.0, -48.0),   // 4  climbing
  new THREE.Vector3( 0.0,  2.8, -62.0),   // 5  Room 1 – above sole
  new THREE.Vector3( 1.0,  2.0, -82.0),   // 6  leaving, swing right
  new THREE.Vector3( 2.8,  0.8,-110.0),   // 7  arc rightward
  new THREE.Vector3( 4.2,  0.2,-130.0),   // 8  approach from right
  new THREE.Vector3( 4.8, -0.1,-140.0),   // 9  Room 2 – side view
  new THREE.Vector3( 3.5,  0.8,-158.0),   // 10 leaving room 2
  new THREE.Vector3( 1.2,  1.2,-180.0),   // 11 arc back left
  new THREE.Vector3( 0.0,  1.6,-203.0),   // 12 Room 3 – upper view
  new THREE.Vector3( 0.5,  2.0,-225.0),   // 13 pulling back
  new THREE.Vector3( 1.5,  2.6,-254.0),   // 14 rising
  new THREE.Vector3( 2.0,  2.5,-272.0),   // 15 Room 4 – finale
], false, 'catmullrom', 0.5);

const lookPath = new THREE.CatmullRomCurve3([
  new THREE.Vector3( 0.0,  0.0,   0.0),   // 0  Room 0 shoe
  new THREE.Vector3( 0.0, -0.1,  -5.0),   // 1
  new THREE.Vector3( 0.0, -0.1, -15.0),   // 2
  new THREE.Vector3( 0.0,  0.4, -42.0),   // 3
  new THREE.Vector3( 0.0,  0.4, -62.0),   // 4
  new THREE.Vector3( 0.0,  0.3, -70.0),   // 5  Room 1 – sole surface
  new THREE.Vector3( 0.0,  0.0, -82.0),   // 6
  new THREE.Vector3( 0.0, -0.2,-118.0),   // 7
  new THREE.Vector3( 0.0, -0.2,-138.0),   // 8
  new THREE.Vector3( 0.0, -0.2,-140.0),   // 9  Room 2 – plate zone
  new THREE.Vector3( 0.0,  0.1,-155.0),   // 10
  new THREE.Vector3( 0.0,  0.4,-196.0),   // 11
  new THREE.Vector3( 0.0,  0.2,-210.0),   // 12 Room 3 – upper
  new THREE.Vector3( 0.0,  0.5,-235.0),   // 13
  new THREE.Vector3( 0.0, -0.5,-272.0),   // 14
  new THREE.Vector3( 0.0, -1.5,-285.0),   // 15 Room 4 – full shoe
], false, 'catmullrom', 0.5);

/* ═══════════════════════════════════════
   CANVAS TEXTURES
═══════════════════════════════════════ */
function makeSwooshTex(color = '#ffffff') {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 256);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(28, 195);
  ctx.bezierCurveTo(70, 90, 310, 32, 490, 55);
  ctx.bezierCurveTo(370, 88, 140, 162, 58, 215);
  ctx.closePath();
  ctx.fill();
  return new THREE.CanvasTexture(c);
}

function makeKnitTex() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 512);
  ctx.strokeStyle = 'rgba(80, 200, 255, 0.60)';
  ctx.lineWidth = 1.8;
  const s = 24;
  const h = s * Math.sqrt(3);
  for (let row = -1; row < 25; row++) {
    for (let col = -1; col < 25; col++) {
      const x = col * s * 1.5;
      const y = row * h + (col % 2 === 0 ? 0 : h / 2);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        const px = x + s * 0.85 * Math.cos(a);
        const py = y + s * 0.85 * Math.sin(a);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
  return new THREE.CanvasTexture(c);
}

function makeCarbonTex() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#05050f';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(60, 80, 210, 0.35)';
  ctx.lineWidth = 1;
  for (let i = -256; i < 512; i += 12) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 256, 256); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i - 256, 256); ctx.stroke();
  }
  return new THREE.CanvasTexture(c);
}

/* ═══════════════════════════════════════
   SHOE BUILDER
   Assembled from geometric primitives with canvas textures.
═══════════════════════════════════════ */
function buildShoe({
  bodyColor   = 0x181818,
  soleColor   = 0xf0f0f0,
  accentColor = 0xff5a00,
  swooshColor = '#ffffff',
  plateGlow   = 0.4,
} = {}) {
  const root = new THREE.Group();

  const mBody   = new THREE.MeshStandardMaterial({ color: bodyColor,   roughness: 0.65, metalness: 0.08 });
  const mFoam   = new THREE.MeshStandardMaterial({ color: soleColor,   roughness: 0.80, metalness: 0.00 });
  const mOut    = new THREE.MeshStandardMaterial({ color: 0x1c1c1c,    roughness: 0.65, metalness: 0.05 });
  const mCarbon = new THREE.MeshStandardMaterial({
    map: makeCarbonTex(), color: 0x111128, roughness: 0.12, metalness: 0.95,
    emissive: new THREE.Color(0x2233ff), emissiveIntensity: plateGlow,
  });
  const mAccent = new THREE.MeshStandardMaterial({
    color: accentColor, roughness: 0.28, metalness: 0.22,
    emissive: new THREE.Color(accentColor), emissiveIntensity: 0.22,
  });
  const mSwoosh = new THREE.MeshStandardMaterial({
    map: makeSwooshTex(swooshColor), transparent: true,
    roughness: 0.30, metalness: 0.05, depthWrite: false,
  });

  // ── Sole stack (bottom to top) ──────────
  mkMesh(root, new THREE.BoxGeometry(1.02, 0.09, 3.30), mOut,    0, -0.61,  0.10);
  mkMesh(root, new THREE.BoxGeometry(0.96, 0.26, 3.10), mFoam,   0, -0.38,  0.10);
  mkMesh(root, new THREE.BoxGeometry(0.96, 0.14, 0.92), mFoam,   0, -0.23, -1.26);
  const plateMesh = mkMesh(root, new THREE.BoxGeometry(0.86, 0.042, 2.82), mCarbon, 0, -0.22, 0.04);
  root.userData.plateMesh = plateMesh;

  // ── Upper ────────────────────────────────
  const upperGeo = new THREE.BoxGeometry(0.88, 0.80, 2.72);
  taperBox(upperGeo, 0.70, 0.88, 0.62, 0.80);
  const upper = new THREE.Mesh(upperGeo, mBody);
  upper.position.set(0, 0.22, -0.05);
  upper.castShadow = upper.receiveShadow = true;
  root.add(upper);

  // Toe box
  const toe = new THREE.Mesh(
    new THREE.SphereGeometry(0.44, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.56),
    mBody
  );
  toe.scale.set(1, 0.74, 0.80);
  toe.position.set(0, 0.05, 1.42);
  toe.castShadow = true;
  root.add(toe);

  // Heel counter
  const heel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.49, 0.80, 18, 1, false, 0, Math.PI),
    mBody
  );
  heel.rotation.y = Math.PI;
  heel.position.set(0, 0.12, -1.50);
  heel.castShadow = true;
  root.add(heel);

  // Heel accent cap
  mkMesh(root, new THREE.CylinderGeometry(0.43, 0.46, 0.24, 18, 1, false, 0, Math.PI),
    mAccent, 0, -0.20, -1.50, 0, Math.PI, 0);

  // Tongue
  mkMesh(root, new THREE.BoxGeometry(0.48, 0.55, 0.07),
    new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.88 }),
    0, 0.44, 0.68);

  // Ankle collar
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.36, 0.034, 8, 28, Math.PI), mAccent
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 0.60, -1.00);
  root.add(collar);

  // Laces
  const laceMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.88 });
  for (let i = 0; i < 5; i++) {
    mkMesh(root, new THREE.BoxGeometry(0.52, 0.030, 0.034), laceMat, 0, 0.56, 0.28 + i * 0.22);
  }

  // Swoosh right side
  const swooshGeo = new THREE.PlaneGeometry(1.58, 0.80);
  const sR = new THREE.Mesh(swooshGeo, mSwoosh);
  sR.rotation.y = -Math.PI / 2;
  sR.position.set(0.454, 0.18, -0.04);
  root.add(sR);

  // Swoosh left side (mirrored)
  const sL = new THREE.Mesh(swooshGeo, mSwoosh.clone());
  sL.material.map = makeSwooshTex(swooshColor);
  sL.rotation.y  =  Math.PI / 2;
  sL.scale.x     = -1;
  sL.position.set(-0.454, 0.18, -0.04);
  root.add(sL);

  root.scale.setScalar(0.74);
  return root;
}

function taperBox(geo, frontW, backW, frontH, backH) {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getZ(i) + geo.parameters.depth / 2) / geo.parameters.depth;
    pos.setX(i, pos.getX(i) * THREE.MathUtils.lerp(backW, frontW, t) / geo.parameters.width);
    pos.setY(i, pos.getY(i) * THREE.MathUtils.lerp(backH, frontH, t) / geo.parameters.height);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

function makeParticles(count, color, spread, size = 0.045) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i*3]   = (Math.random() - 0.5) * spread;
    pos[i*3+1] = (Math.random() - 0.5) * spread;
    pos[i*3+2] = (Math.random() - 0.5) * spread;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({
    color, size, transparent: true, opacity: 0.80,
    sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
}

/* ═══════════════════════════════════════
   ROOM 0 — INTRO
   Camera: 3/4 hero from right-front-above
   Full shoe slowly rotating on a lit pedestal
═══════════════════════════════════════ */
function makeRoom0() {
  const g = new THREE.Group();
  // g stays at (0,0,0) — scene origin

  // Reflective floor
  mkMesh(g, new THREE.CircleGeometry(14, 64),
    new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.18, metalness: 0.92 }),
    0, -1.05, 0, -Math.PI / 2, 0, 0);

  // Pedestal
  mkMesh(g, new THREE.CylinderGeometry(0.88, 1.08, 0.22, 40),
    new THREE.MeshStandardMaterial({ color: 0x0e0e0e, roughness: 0.22, metalness: 0.88 }),
    0, -0.93, 0);
  mkMesh(g, new THREE.CylinderGeometry(1.18, 1.38, 0.07, 40),
    new THREE.MeshStandardMaterial({ color: 0x060606, roughness: 0.12, metalness: 0.96 }),
    0, -1.07, 0);

  // Shoe — standard 3/4 orientation
  const shoe = buildShoe({ bodyColor: 0x141414, soleColor: 0xe8e8e8, accentColor: 0xff5a00 });
  shoe.position.set(0, -0.66, 0);
  shoe.rotation.y = Math.PI / 5;
  shoe.userData.spinMe = true;
  g.add(shoe);

  // Glow rings on floor
  const rMat1 = new THREE.MeshBasicMaterial({ color: 0xff5a00, transparent: true, opacity: 0.38 });
  const rMat2 = new THREE.MeshBasicMaterial({ color: 0xff5a00, transparent: true, opacity: 0.12 });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.018, 8, 72), rMat1);
  ring1.rotation.x = -Math.PI / 2; ring1.position.y = -1.02;
  g.add(ring1);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.010, 8, 72), rMat2);
  ring2.rotation.x = -Math.PI / 2; ring2.position.y = -1.03;
  g.add(ring2);
  g.userData.rings = [ring1, ring2];

  // Floating embers
  g.add(makeParticles(100, 0xff5a00, 4.5, 0.026));

  // Spotlight from above
  const spot = new THREE.SpotLight(0xfff8f0, 44, 24, Math.PI / 7.5, 0.26, 1.8);
  spot.position.set(0, 10, 1.5);
  spot.castShadow = true;
  spot.shadow.mapSize.setScalar(1024);
  spot.target.position.set(0, 0, 0);
  g.add(spot);
  g.add(spot.target);

  // Orange rim light (saved to variable — do NOT chain .position after g.add())
  const rim = new THREE.PointLight(0xff5a00, 4.0, 10);
  rim.position.set(-3, 0.5, -2);
  g.add(rim);

  g.add(new THREE.AmbientLight(0x0a0a0a, 2));

  return g;
}

/* ═══════════════════════════════════════
   ROOM 1 — ZOOMX FOAM SOLE
   Camera: HIGH ABOVE looking DOWN at upturned sole
   Shoe is flipped so midsole foam faces the camera
═══════════════════════════════════════ */
function makeRoom1() {
  const g = new THREE.Group();
  g.position.set(0, 0, -70);

  // Shoe flipped upside-down → sole faces UP toward camera overhead
  const shoe = buildShoe({
    bodyColor: 0x0e0e14, soleColor: 0xfafafa,
    accentColor: 0x00ddff, swooshColor: '#00ddff', plateGlow: 0.5,
  });
  shoe.position.set(0, 0.3, 0);
  shoe.rotation.set(Math.PI, Math.PI / 6, 0);
  shoe.userData.cushShoe = true;
  g.add(shoe);

  // Foam cell spheres orbiting the sole (camera looks down at them)
  const foamColors = [0xfafafa, 0xeef8ff, 0xcceeee, 0xbbddff];
  const foamPieces = [];
  for (let i = 0; i < 20; i++) {
    const s    = 0.05 + Math.random() * 0.12;
    const foam = new THREE.Mesh(
      new THREE.SphereGeometry(s, 8, 6),
      new THREE.MeshStandardMaterial({
        color: foamColors[i % foamColors.length],
        roughness: 0.85, emissive: 0x004466, emissiveIntensity: 0.3,
        transparent: true, opacity: 0.88,
      })
    );
    const angle = (i / 20) * Math.PI * 2;
    const r     = 0.5 + Math.random() * 1.1;
    foam.position.set(Math.cos(angle) * r, 0.8 + Math.random() * 0.7, Math.sin(angle) * r);
    foam.userData.baseY  = foam.position.y;
    foam.userData.speed  = Math.random() * 0.5 + 0.2;
    foam.userData.offset = Math.random() * Math.PI * 2;
    foamPieces.push(foam);
    g.add(foam);
  }
  g.userData.foamPieces = foamPieces;

  // Compression wave rings — expand outward from the sole contact point
  const waveRings = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.1, 0.012, 6, 48),
      new THREE.MeshBasicMaterial({ color: 0x00ccff, transparent: true, opacity: 0.8 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 1.1, 0);
    ring.userData.waveOffset = i * (1 / 3);
    waveRings.push(ring);
    g.add(ring);
  }
  g.userData.waveRings = waveRings;

  // Annotation rods with glowing tips pointing at sole layers
  const annotMat = new THREE.MeshBasicMaterial({ color: 0x00aaff, transparent: true, opacity: 0.55 });
  const dotMat   = new THREE.MeshBasicMaterial({ color: 0x00eeff });
  const dotGeo   = new THREE.SphereGeometry(0.026, 6, 6);
  const rods     = [
    { pos: [0.75, 1.5, 0.2],  dot: [0.75, 1.95, 0.2],  h: 0.6 },
    { pos: [-0.8, 1.3, 0.4],  dot: [-0.8, 1.6,  0.4],  h: 0.4 },
  ];
  rods.forEach(r => {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, r.h, 4), annotMat);
    rod.position.set(...r.pos); g.add(rod);
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.set(...r.dot); g.add(dot);
  });

  // Blue ambient particles
  g.add(makeParticles(250, 0x00aaff, 5, 0.030));

  // Floor visible below
  mkMesh(g, new THREE.CircleGeometry(12, 48),
    new THREE.MeshStandardMaterial({ color: 0x00040a, roughness: 0.9 }),
    0, -1.6, 0, -Math.PI / 2, 0, 0);

  // Lights — save to variables, set position BEFORE g.add()
  g.add(new THREE.AmbientLight(0x000a14, 3));

  const bl1 = new THREE.PointLight(0x00aaff, 12, 22);
  bl1.position.set(0, 5, 0);
  g.add(bl1);

  const bl2 = new THREE.PointLight(0x0066cc, 5, 15);
  bl2.position.set(-3, 2, 2);
  g.add(bl2);

  const topDir = new THREE.DirectionalLight(0xaaddff, 1.8);
  topDir.position.set(0, 8, 0);
  g.add(topDir);

  return g;
}

/* ═══════════════════════════════════════
   ROOM 2 — CARBON FIBER PLATE
   Camera: from the RIGHT side looking at shoe profile
   Shows midsole cross-section + exploded layer diagram
═══════════════════════════════════════ */
function makeRoom2() {
  const g = new THREE.Group();
  g.position.set(0, 0, -140);

  // Shoe — minimal y-rotation so camera sees the right side profile
  const shoe = buildShoe({
    bodyColor: 0x111111, soleColor: 0xf2f2f2,
    accentColor: 0x3355ff, swooshColor: '#ffffff', plateGlow: 1.2,
  });
  shoe.position.set(0, -0.3, 0);
  shoe.rotation.y = 0.08;
  shoe.userData.carbonShoe = true;
  g.add(shoe);

  // ── Exploded sole stack diagram (to the left, x≈-2.4) ──────
  const stackX = -2.4;
  const eOutMat  = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 });
  const ePlateMat = new THREE.MeshStandardMaterial({
    map: makeCarbonTex(), color: 0x111133, roughness: 0.10, metalness: 0.95,
    emissive: new THREE.Color(0x2244ff), emissiveIntensity: 1.8,
  });
  const eFoamMat = new THREE.MeshStandardMaterial({
    color: 0xf4f4f4, roughness: 0.80,
    emissive: new THREE.Color(0x004488), emissiveIntensity: 0.12,
  });

  const eOut = mkMesh(g, new THREE.BoxGeometry(0.9, 0.09, 2.4), eOutMat,  stackX, -0.75, 0);
  eOut.userData.baseY   = -0.75;
  const ePlate = mkMesh(g, new THREE.BoxGeometry(0.85, 0.042, 2.2), ePlateMat, stackX, -0.26, 0);
  ePlate.userData.baseY = -0.26;
  const eFoam  = mkMesh(g, new THREE.BoxGeometry(0.92, 0.28, 2.4), eFoamMat,  stackX,  0.22, 0);
  eFoam.userData.baseY  =  0.22;
  g.userData.ePlate = ePlate;
  g.userData.stackLayers = [eOut, ePlate, eFoam];

  // Thin connector line between diagram and shoe
  const connGeo = new THREE.BufferGeometry();
  connGeo.setAttribute('position', new THREE.BufferAttribute(
    new Float32Array([-1.88, -0.28, 0,  -0.40, -0.28, 0]), 3
  ));
  g.add(new THREE.Line(connGeo,
    new THREE.LineBasicMaterial({ color: 0x2244ff, transparent: true, opacity: 0.4 })));

  // Propulsion arrows (cones) pointing in +x — forward force
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0x4466ff, transparent: true, opacity: 0.7 });
  const propArrows = [];
  for (let i = 0; i < 5; i++) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.22, 6), arrowMat);
    cone.rotation.z = -Math.PI / 2;
    cone.position.set(1.0 + i * 0.3, -0.26, -0.8 + i * 0.3);
    g.add(cone);
    propArrows.push(cone);
  }
  g.userData.propArrows = propArrows;

  // Plate-zone particles drifting in +x
  const pGeo = new THREE.BufferGeometry();
  const pCount = 180;
  const pPos   = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    pPos[i*3]   = (Math.random() - 0.5) * 8;
    pPos[i*3+1] = -0.26 + (Math.random() - 0.5) * 0.3;
    pPos[i*3+2] = (Math.random() - 0.5) * 4;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const platePts = new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: 0x4466ff, size: 0.032, transparent: true, opacity: 0.7,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  platePts.userData.plateParticles = true;
  g.add(platePts);

  // Lights
  g.add(new THREE.AmbientLight(0x050510, 2.5));

  const sideKey = new THREE.SpotLight(0xffffff, 22, 28, Math.PI / 6, 0.3, 1.5);
  sideKey.position.set(6, 4, 0);
  sideKey.castShadow = true;
  sideKey.target.position.set(0, -0.3, 0);
  g.add(sideKey);
  g.add(sideKey.target);

  const blL1 = new THREE.PointLight(0x2233ff, 6, 18);
  blL1.position.set(-3, 0, 0);
  g.add(blL1);

  const blL2 = new THREE.PointLight(0x4466ff, 3, 12);
  blL2.position.set(0, -2, 2);
  g.add(blL2);

  return g;
}

/* ═══════════════════════════════════════
   ROOM 3 — FLYKNIT UPPER
   Camera: front-above, looking at upper knit face
   Hex knit overlay + airflow particles through mesh
═══════════════════════════════════════ */
function makeRoom3() {
  const g = new THREE.Group();
  g.position.set(0, 0, -210);

  // Shoe — slight angle so camera sees upper face-on
  const shoe = buildShoe({
    bodyColor: 0x0e1a28, soleColor: 0xf0f0f0,
    accentColor: 0x55aaff, swooshColor: '#55aaff', plateGlow: 0.3,
  });
  shoe.position.set(0, -0.3, 0);
  shoe.rotation.set(-0.08, 0.35, 0);
  shoe.userData.breathShoe = true;
  g.add(shoe);

  // Flyknit hex-mesh overlay on upper surface
  const knitMat = new THREE.MeshBasicMaterial({
    map: makeKnitTex(), transparent: true, opacity: 0.65,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const knitTop = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.85), knitMat);
  knitTop.position.set(0.08, 0.28, 0.82);
  knitTop.rotation.set(-0.08, 0.35, 0);
  g.add(knitTop);
  g.userData.knitPlane = knitTop;

  const knitSide = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.65), knitMat.clone());
  knitSide.rotation.y = -Math.PI / 2;
  knitSide.position.set(0.42, 0.22, 0.0);
  g.add(knitSide);

  // Airflow particles — stream left→right through the upper
  const airCount = 500;
  const airGeo   = new THREE.BufferGeometry();
  const airPos   = new Float32Array(airCount * 3);
  const airPhase = new Float32Array(airCount);
  for (let i = 0; i < airCount; i++) {
    airPos[i*3]   = (Math.random() - 0.5) * 2.2;
    airPos[i*3+1] = -0.4 + Math.random() * 1.0;
    airPos[i*3+2] = -0.5 + Math.random() * 1.8;
    airPhase[i]   = Math.random() * Math.PI * 2;
  }
  airGeo.setAttribute('position', new THREE.BufferAttribute(airPos, 3));
  const airPts = new THREE.Points(airGeo, new THREE.PointsMaterial({
    color: 0x66ccff, size: 0.022, transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  airPts.userData.airPhase  = airPhase;
  airPts.userData.isAirflow = true;
  g.add(airPts);

  // Floating yarn threads
  const yarns = [];
  for (let i = 0; i < 22; i++) {
    const len  = 0.8 + Math.random() * 1.6;
    const yarn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.003, len, 4),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.57 + Math.random() * 0.08, 0.8, 0.62 + Math.random() * 0.25),
        transparent: true, opacity: 0.3 + Math.random() * 0.4,
      })
    );
    yarn.position.set(
      (Math.random() - 0.5) * 3.5,
      -0.5 + Math.random() * 2.0,
      (Math.random() - 0.5) * 2.5
    );
    yarn.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    yarn.userData.yarnOff = Math.random() * Math.PI * 2;
    yarn.userData.yarnSpd = Math.random() * 0.25 + 0.08;
    yarn.userData.baseY   = yarn.position.y;
    yarns.push(yarn);
    g.add(yarn);
  }
  g.userData.yarns = yarns;

  // Background grid
  const grid = new THREE.GridHelper(20, 22, 0x112233, 0x0a1a28);
  grid.position.y = -1.8;
  g.add(grid);

  // Lights
  g.add(new THREE.AmbientLight(0x050e18, 3.5));

  const skyDir = new THREE.DirectionalLight(0x88ccff, 2.8);
  skyDir.position.set(0, 8, 4);
  g.add(skyDir);

  const rimPL = new THREE.PointLight(0x44aaff, 5.5, 14);
  rimPL.position.set(2.5, 2, 2);
  g.add(rimPL);

  const fillPL = new THREE.PointLight(0x0044aa, 2.5, 10);
  fillPL.position.set(-2.5, -0.5, 1);
  g.add(fillPL);

  return g;
}

/* ═══════════════════════════════════════
   ROOM 4 — FINALE REVEAL
   Camera: low dramatic angle, full shoe
   Stadium, confetti, CTA
═══════════════════════════════════════ */
function makeRoom4() {
  const g = new THREE.Group();
  g.position.set(0, 0, -285);

  // Stadium floor
  mkMesh(g, new THREE.CircleGeometry(32, 64),
    new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.82, metalness: 0.28 }),
    0, -2.8, 0, -Math.PI / 2, 0, 0);

  // Perimeter stadium lights
  for (let i = 0; i < 10; i++) {
    const a  = (i / 10) * Math.PI * 2;
    const pl = new THREE.PointLight(0xfff5e0, 2.5, 32);
    pl.position.set(Math.cos(a) * 15, 10, Math.sin(a) * 15);
    g.add(pl);
  }

  // Dramatic key spotlight
  const key = new THREE.SpotLight(0xfff8ec, 34, 40, Math.PI / 5.5, 0.16, 1.1);
  key.position.set(-5, 15, 6);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(1024);
  key.target.position.set(0, -1.5, 0);
  g.add(key);
  g.add(key.target);

  // Blue rim fill
  const blueRim = new THREE.PointLight(0x2244ff, 4.5, 26);
  blueRim.position.set(5, 3, -5);
  g.add(blueRim);

  g.add(new THREE.AmbientLight(0x040404, 1.2));

  // Main shoe
  const shoe = buildShoe({
    bodyColor: 0x0c0c0c, soleColor: 0xf5f5f5,
    accentColor: 0xff5a00, swooshColor: '#ffffff', plateGlow: 0.5,
  });
  shoe.scale.setScalar(1.30);
  shoe.position.set(0, -1.55, 0);
  shoe.rotation.y = Math.PI / 7;
  shoe.userData.finaleShoe = true;
  g.add(shoe);

  // Floor halo
  mkMesh(g, new THREE.CircleGeometry(3.5, 64),
    new THREE.MeshBasicMaterial({ color: 0xff5a00, transparent: true, opacity: 0.06 }),
    0, -2.79, 0, -Math.PI / 2, 0, 0);

  // Confetti
  const cfCount = 480;
  const cfGeo   = new THREE.BufferGeometry();
  const cfPos   = new Float32Array(cfCount * 3);
  const cfCol   = new Float32Array(cfCount * 3);
  const cfPal   = [
    new THREE.Color(0xff5a00), new THREE.Color(0xffffff),
    new THREE.Color(0xffcc00), new THREE.Color(0x33aaff), new THREE.Color(0xff3366),
  ];
  for (let i = 0; i < cfCount; i++) {
    cfPos[i*3]   = (Math.random() - 0.5) * 24;
    cfPos[i*3+1] = Math.random() * 20;
    cfPos[i*3+2] = (Math.random() - 0.5) * 24;
    const c = cfPal[i % cfPal.length];
    cfCol[i*3] = c.r; cfCol[i*3+1] = c.g; cfCol[i*3+2] = c.b;
  }
  cfGeo.setAttribute('position', new THREE.BufferAttribute(cfPos, 3));
  cfGeo.setAttribute('color',    new THREE.BufferAttribute(cfCol, 3));
  const confetti = new THREE.Points(cfGeo, new THREE.PointsMaterial({
    size: 0.11, vertexColors: true, transparent: true, opacity: 0.9, sizeAttenuation: true,
  }));
  confetti.userData.isConfetti = true;
  g.add(confetti);

  return g;
}

/* ═══════════════════════════════════════
   BUILD SCENE
═══════════════════════════════════════ */
const rooms = [makeRoom0(), makeRoom1(), makeRoom2(), makeRoom3(), makeRoom4()];
rooms.forEach(r => scene.add(r));
scene.add(new THREE.AmbientLight(0x000000, 0.2));

/* ═══════════════════════════════════════
   SCROLL TRIGGER
═══════════════════════════════════════ */
const { gsap, ScrollTrigger } = window;
gsap.registerPlugin(ScrollTrigger);

const ZONES = [
  { start: 0.00, end: 0.17 },
  { start: 0.14, end: 0.36 },
  { start: 0.33, end: 0.58 },
  { start: 0.55, end: 0.78 },
  { start: 0.75, end: 1.00 },
];
const BG = [
  new THREE.Color(0x000000),
  new THREE.Color(0x000610),
  new THREE.Color(0x050512),
  new THREE.Color(0x000914),
  new THREE.Color(0x020202),
];

const textEls = [0,1,2,3,4].map(i => document.getElementById(`text-${i}`));
const dots    = [...document.querySelectorAll('.dot')];
const ctaBtn  = document.getElementById('cta-btn');
let activeRoom = 0;
const bgColor  = new THREE.Color(0x000000);

ScrollTrigger.create({
  trigger: document.body,
  start: 'top top', end: 'bottom bottom',
  scrub: 1.2,
  onUpdate(self) { onScroll(self.progress); },
});

dots.forEach((dot, i) => {
  dot.addEventListener('click', () => {
    const peak = (ZONES[i].start + ZONES[i].end) * 0.5;
    window.scrollTo({ top: peak * (document.body.scrollHeight - window.innerHeight), behavior: 'smooth' });
  });
});

function onScroll(t) {
  camera.position.copy(camPath.getPoint(t));
  camera.lookAt(lookPath.getPoint(t));

  bgColor.set(0x000000);
  for (let i = 0; i < ZONES.length; i++) {
    const z = ZONES[i];
    if (t >= z.start && t <= z.end) {
      const local = (t - z.start) / (z.end - z.start);
      bgColor.lerp(BG[i], Math.sin(local * Math.PI) * 0.42);
    }
  }
  renderer.setClearColor(bgColor);
  scene.fog.color.copy(bgColor);

  for (let i = 0; i < ZONES.length; i++) {
    const z = ZONES[i];
    let op = 0;
    if (t >= z.start && t <= z.end) {
      const local = (t - z.start) / (z.end - z.start);
      op = local < 0.25 ? local / 0.25 : local < 0.72 ? 1 : (1 - local) / 0.28;
    }
    textEls[i].style.opacity   = op;
    textEls[i].style.transform = `translateY(${(1 - op) * 16}px)`;
  }

  const ctaA = t > 0.87 ? Math.min((t - 0.87) / 0.09, 1) : 0;
  ctaBtn.style.opacity       = ctaA;
  ctaBtn.style.pointerEvents = ctaA > 0 ? 'auto' : 'none';

  let newRoom = 0;
  for (let i = 0; i < ZONES.length; i++) {
    if (t >= (ZONES[i].start + ZONES[i].end) * 0.5 - 0.04) newRoom = i;
  }
  if (newRoom !== activeRoom) {
    dots[activeRoom].classList.remove('active');
    dots[newRoom].classList.add('active');
    activeRoom = newRoom;
  }
}

/* ═══════════════════════════════════════
   ANIMATION LOOP
═══════════════════════════════════════ */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt   = clock.getDelta();
  const time = clock.elapsedTime;

  // Room 0 — spin shoe, pulse rings
  const r0shoe = rooms[0].children.find(c => c.userData.spinMe);
  if (r0shoe) r0shoe.rotation.y += dt * 0.36;
  if (rooms[0].userData.rings) {
    rooms[0].userData.rings.forEach((r, i) => {
      r.material.opacity = 0.18 + Math.sin(time * 1.4 + i * 1.1) * 0.15;
    });
  }

  // Room 1 — float foam cells, expand wave rings
  if (rooms[1].userData.foamPieces) {
    rooms[1].userData.foamPieces.forEach(fp => {
      fp.position.y = fp.userData.baseY + Math.sin(fp.userData.offset + time * fp.userData.speed) * 0.18;
    });
  }
  if (rooms[1].userData.waveRings) {
    rooms[1].userData.waveRings.forEach(ring => {
      const phase = (time * 0.75 + ring.userData.waveOffset) % 1;
      const s     = 0.3 + phase * 3.0;
      ring.scale.set(s, s, s);
      ring.material.opacity = (1 - phase) * 0.80;
    });
  }

  // Room 2 — breathe carbon plate glow, animate propulsion arrows
  if (rooms[2].userData.ePlate) {
    rooms[2].userData.ePlate.material.emissiveIntensity = 1.2 + Math.sin(time * 2.2) * 0.5;
  }
  if (rooms[2].userData.propArrows) {
    rooms[2].userData.propArrows.forEach((arrow, i) => {
      arrow.material.opacity = 0.4 + Math.sin(time * 2.5 - i * 0.4) * 0.3;
    });
  }
  rooms[2].children.forEach(c => {
    if (!c.userData.plateParticles) return;
    const pos = c.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i) + 0.022;
      if (x > 4) x -= 8;
      pos.setX(i, x);
    }
    pos.needsUpdate = true;
  });

  // Room 3 — airflow through knit, sway yarns, pulse knit opacity
  rooms[3].children.forEach(c => {
    if (!c.userData.isAirflow) return;
    const pos   = c.geometry.attributes.position;
    const phase = c.userData.airPhase;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i) + 0.016 + Math.sin(phase[i] + time) * 0.002;
      if (x > 1.1) x -= 2.2;
      pos.setX(i, x);
    }
    pos.needsUpdate = true;
  });
  if (rooms[3].userData.yarns) {
    rooms[3].userData.yarns.forEach(y => {
      y.position.y = y.userData.baseY + Math.sin(y.userData.yarnOff + time * y.userData.yarnSpd) * 0.15;
      y.rotation.z += dt * 0.035;
    });
  }
  if (rooms[3].userData.knitPlane) {
    rooms[3].userData.knitPlane.material.opacity = 0.5 + Math.sin(time * 1.2) * 0.14;
  }

  // Room 4 — confetti fall, rotate finale shoe
  rooms[4].children.forEach(c => {
    if (c.userData.isConfetti) {
      const pos = c.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - 0.032;
        if (y < -3) y = 16 + Math.random() * 4;
        pos.setY(i, y);
        pos.setX(i, pos.getX(i) + Math.sin(time * 0.5 + i * 0.07) * 0.003);
      }
      pos.needsUpdate = true;
    }
    if (c.userData.finaleShoe) c.rotation.y += dt * 0.16;
  });

  composer.render();
}

/* ═══════════════════════════════════════
   LOADING
═══════════════════════════════════════ */
function startLoading() {
  const fill    = document.getElementById('loading-fill');
  const overlay = document.getElementById('loading');
  let p = 0;
  const id = setInterval(() => {
    p = Math.min(p + Math.random() * 14 + 3, 100);
    fill.style.width = p + '%';
    if (p >= 100) {
      clearInterval(id);
      setTimeout(() => {
        gsap.to(overlay, { opacity: 0, duration: 0.85,
          onComplete() { overlay.style.display = 'none'; }
        });
        onScroll(0);
        animate();
      }, 260);
    }
  }, 60);
}

startLoading();
