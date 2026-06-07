import * as THREE from 'three';
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass }      from 'three/addons/postprocessing/OutputPass.js';

/* ─────────────────────────────────────────
   RENDERER + SCENE + CAMERA
───────────────────────────────────────── */
const canvas   = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled  = true;
renderer.shadowMap.type     = THREE.PCFSoftShadowMap;
renderer.toneMapping        = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
renderer.setClearColor(0x000000);

const scene  = new THREE.Scene();
scene.fog    = new THREE.FogExp2(0x000000, 0.012);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 600);
camera.position.set(0, 2, 18);

/* ─────────────────────────────────────────
   POST-PROCESSING
───────────────────────────────────────── */
const composer   = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.55, 0.4, 0.82
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

/* ─────────────────────────────────────────
   RESIZE
───────────────────────────────────────── */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  bloomPass.resolution.set(window.innerWidth, window.innerHeight);
});

/* ─────────────────────────────────────────
   CAMERA PATH — CatmullRom through all 5 rooms
   Rooms are positioned at Z: 0, -70, -140, -210, -285
───────────────────────────────────────── */
const camPath = new THREE.CatmullRomCurve3([
  new THREE.Vector3(  0,  2.2,  18),   // 0  intro — far back
  new THREE.Vector3(  0,  1.6,   9),   // 1  push in toward shoe
  new THREE.Vector3(0.3,  1.0,   3),   // 2  very close to intro shoe
  new THREE.Vector3(  0,  0.5, -12),   // 3  past intro, drop down
  new THREE.Vector3(  1, -0.4, -38),   // 4  banking toward sole
  new THREE.Vector3(  0, -0.8, -60),   // 5  beneath sole
  new THREE.Vector3( -1,  0.4, -80),   // 6  pulling out, banking left
  new THREE.Vector3(  0,  1.2, -100),  // 7  enter speed tunnel
  new THREE.Vector3(  0,  1.2, -130),  // 8  mid tunnel
  new THREE.Vector3(  0,  1.4, -155),  // 9  exit tunnel
  new THREE.Vector3( -1.8, 1.6, -175), // 10 banking into breathability
  new THREE.Vector3(  0,  1.2, -200),  // 11 breathability centre
  new THREE.Vector3(  1.2, 1.8, -220), // 12 swing right
  new THREE.Vector3(  0,  3.5, -248),  // 13 rise for finale
  new THREE.Vector3(  0,  3.0, -270),  // 14 high orbit
  new THREE.Vector3(  0,  2.4, -290),  // 15 finale close
], false, 'catmullrom', 0.5);

const lookPath = new THREE.CatmullRomCurve3([
  new THREE.Vector3(  0,  0.5,   0),   // 0  shoe on pedestal
  new THREE.Vector3(  0,  0.2,  -5),   // 1
  new THREE.Vector3(  0,  0.0, -12),   // 2
  new THREE.Vector3(  0, -0.5, -28),   // 3
  new THREE.Vector3(  0, -1.0, -55),   // 4  look at sole
  new THREE.Vector3(  0, -0.5, -65),   // 5
  new THREE.Vector3(  0,  0.5, -82),   // 6
  new THREE.Vector3(  0,  1.0, -115),  // 7
  new THREE.Vector3(  0,  1.0, -140),  // 8
  new THREE.Vector3(  0,  1.0, -160),  // 9
  new THREE.Vector3(  0,  1.0, -185),  // 10
  new THREE.Vector3(  0,  0.8, -205),  // 11
  new THREE.Vector3(  0,  1.0, -225),  // 12
  new THREE.Vector3(  0,  0.5, -270),  // 13
  new THREE.Vector3(  0,  0.0, -285),  // 14  finale shoe
  new THREE.Vector3(  0, -0.2, -295),  // 15
], false, 'catmullrom', 0.5);

/* ─────────────────────────────────────────
   NIKE SWOOSH — canvas texture
───────────────────────────────────────── */
function makeSwooshTexture(color = '#ffffff') {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 256);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(28, 195);
  ctx.bezierCurveTo(70,  90, 310, 32, 490,  55);
  ctx.bezierCurveTo(370,  88, 140, 162,  58, 215);
  ctx.closePath();
  ctx.fill();
  return new THREE.CanvasTexture(c);
}

/* ─────────────────────────────────────────
   SHOE BUILDER — geometric primitive shoe
───────────────────────────────────────── */
function buildShoe({ bodyColor = 0x111111, accentColor = 0xff5a00, soleColor = 0xeeeeee, swooshColor = '#ffffff' } = {}) {
  const root = new THREE.Group();

  const mBody   = new THREE.MeshStandardMaterial({ color: bodyColor,   roughness: 0.70, metalness: 0.10 });
  const mSole   = new THREE.MeshStandardMaterial({ color: soleColor,   roughness: 0.55, metalness: 0.00 });
  const mAccent = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.30, metalness: 0.20,
                    emissive: new THREE.Color(accentColor), emissiveIntensity: 0.25 });
  const mCarbon = new THREE.MeshStandardMaterial({ color: 0x080810, roughness: 0.15, metalness: 0.90,
                    emissive: 0x001030, emissiveIntensity: 0.4 });
  const mSwoosh = new THREE.MeshStandardMaterial({ map: makeSwooshTexture(swooshColor),
                    transparent: true, roughness: 0.35, metalness: 0.05, depthWrite: false });

  // Outsole
  add(root, new THREE.BoxGeometry(1.02, 0.10, 3.30), mSole,   [0, -0.62,  0.10]);
  // Midsole main
  add(root, new THREE.BoxGeometry(0.96, 0.28, 3.10), mSole,   [0, -0.39,  0.10]);
  // Midsole heel raise
  add(root, new THREE.BoxGeometry(0.96, 0.16, 0.90), mSole,   [0, -0.22, -1.25]);
  // Carbon plate strip
  add(root, new THREE.BoxGeometry(0.88, 0.045, 2.80), mCarbon, [0, -0.22, 0.05]);

  // Main upper body (elongated tapered)
  const upperGeo = new THREE.BoxGeometry(0.88, 0.80, 2.70);
  const upper = new THREE.Mesh(upperGeo, mBody);
  upper.position.set(0, 0.22, -0.05);
  // Taper the upper toward the toe (front)
  modifyBoxTaper(upperGeo, 0.72, 0.88, 0.65, 0.80);
  upper.castShadow = true;
  root.add(upper);

  // Toe box (rounded front)
  const toeGeo = new THREE.SphereGeometry(0.44, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const toe = new THREE.Mesh(toeGeo, mBody);
  toe.scale.set(1, 0.75, 0.78);
  toe.position.set(0, 0.05, 1.42);
  toe.castShadow = true;
  root.add(toe);

  // Heel counter (half cylinder)
  const heelGeo = new THREE.CylinderGeometry(0.46, 0.48, 0.78, 18, 1, false, 0, Math.PI);
  const heel = new THREE.Mesh(heelGeo, mBody);
  heel.rotation.y = Math.PI;
  heel.position.set(0, 0.12, -1.50);
  heel.castShadow = true;
  root.add(heel);

  // Heel accent cap
  add(root, new THREE.CylinderGeometry(0.44, 0.46, 0.25, 18, 1, false, 0, Math.PI), mAccent, [0, -0.20, -1.50], [0, Math.PI, 0]);

  // Tongue
  add(root, new THREE.BoxGeometry(0.48, 0.55, 0.07), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 }), [0, 0.44, 0.68]);

  // Ankle collar ring
  const collarGeo = new THREE.TorusGeometry(0.36, 0.035, 8, 28, Math.PI);
  const collar = new THREE.Mesh(collarGeo, mAccent);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 0.60, -1.00);
  root.add(collar);

  // Laces
  const laceMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.9 });
  for (let i = 0; i < 5; i++) {
    add(root, new THREE.BoxGeometry(0.52, 0.032, 0.035), laceMat, [0, 0.56, 0.28 + i * 0.22]);
  }
  // Aglets
  for (let i = 0; i < 2; i++) {
    add(root, new THREE.CylinderGeometry(0.022, 0.022, 0.06, 6), mAccent, [(i === 0 ? 0.27 : -0.27), 0.56, 0.28 + 4 * 0.22], [0, 0, Math.PI / 2]);
  }

  // Swoosh planes (both sides)
  const swooshGeo = new THREE.PlaneGeometry(1.55, 0.78);
  const swooshR = new THREE.Mesh(swooshGeo, mSwoosh);
  swooshR.rotation.y = -Math.PI / 2;
  swooshR.position.set(0.45, 0.18, -0.05);
  root.add(swooshR);

  const swooshL = new THREE.Mesh(swooshGeo, mSwoosh.clone());
  swooshL.material.map = makeSwooshTexture(swooshColor);
  swooshL.rotation.y =  Math.PI / 2;
  swooshL.scale.x = -1;
  swooshL.position.set(-0.45, 0.18, -0.05);
  root.add(swooshL);

  // Rear Nike logo
  const logoPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.19), new THREE.MeshStandardMaterial({
    map: makeSwooshTexture(swooshColor), transparent: true, roughness: 0.4, depthWrite: false
  }));
  logoPlane.rotation.y = Math.PI;
  logoPlane.position.set(0, 0.18, -1.52);
  root.add(logoPlane);

  root.scale.setScalar(0.72);
  return root;
}

function add(parent, geo, mat, pos = [0,0,0], rot = [0,0,0]) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos);
  m.rotation.set(...rot);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}

function modifyBoxTaper(geo, frontW, backW, frontH, backH) {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    const t = (z + geo.parameters.depth / 2) / geo.parameters.depth; // 0=back,1=front
    const wScale = THREE.MathUtils.lerp(backW, frontW, t) / geo.parameters.width;
    const hScale = THREE.MathUtils.lerp(backH, frontH, t) / geo.parameters.height;
    pos.setX(i, pos.getX(i) * wScale);
    pos.setY(i, pos.getY(i) * hScale);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

/* ─────────────────────────────────────────
   PARTICLES HELPER
───────────────────────────────────────── */
function makeParticles(count, color, spread, size = 0.045) {
  const geo  = new THREE.BufferGeometry();
  const pos  = new Float32Array(count * 3);
  const vels = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i*3]   = (Math.random() - 0.5) * spread;
    pos[i*3+1] = (Math.random() - 0.5) * spread;
    pos[i*3+2] = (Math.random() - 0.5) * spread;
    vels[i*3]   = (Math.random() - 0.5) * 0.018;
    vels[i*3+1] = (Math.random() - 0.5) * 0.018;
    vels[i*3+2] = (Math.random() - 0.5) * 0.018;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color, size, transparent: true, opacity: 0.8,
    sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false
  });
  const pts = new THREE.Points(geo, mat);
  pts.userData.vels = vels;
  return pts;
}

/* ─────────────────────────────────────────
   ROOM 0 — INTRO
   Dark dramatic pedestal, single spotlight, rotating shoe
───────────────────────────────────────── */
function makeRoom0() {
  const g = new THREE.Group();
  g.position.set(0, 0, 0);

  // Reflective floor disc
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(12, 64),
    new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.2, metalness: 0.9 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.05;
  floor.receiveShadow = true;
  g.add(floor);

  // Pedestal
  const ped = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 1.05, 0.22, 40),
    new THREE.MeshStandardMaterial({ color: 0x0e0e0e, roughness: 0.25, metalness: 0.85 })
  );
  ped.position.set(0, -0.93, 0);
  ped.receiveShadow = true;
  g.add(ped);

  const pedBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.15, 1.35, 0.08, 40),
    new THREE.MeshStandardMaterial({ color: 0x060606, roughness: 0.15, metalness: 0.95 })
  );
  pedBase.position.set(0, -1.07, 0);
  g.add(pedBase);

  // Shoe
  const shoe = buildShoe({ bodyColor: 0x090909, accentColor: 0xff5a00, soleColor: 0xe8e8e8 });
  shoe.position.set(0, -0.68, 0);
  shoe.rotation.y = Math.PI / 5;
  shoe.userData.spinMe = true;
  g.add(shoe);

  // Glow rings on floor
  const ringMat1 = new THREE.MeshBasicMaterial({ color: 0xff5a00, transparent: true, opacity: 0.35 });
  const ringMat2 = new THREE.MeshBasicMaterial({ color: 0xff5a00, transparent: true, opacity: 0.12 });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.018, 8, 72), ringMat1);
  ring1.rotation.x = -Math.PI / 2; ring1.position.y = -1.02;
  g.add(ring1);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.010, 8, 72), ringMat2);
  ring2.rotation.x = -Math.PI / 2; ring2.position.y = -1.03;
  g.add(ring2);
  g.userData.rings = [ring1, ring2];

  // Orange glow particles
  const sparks = makeParticles(120, 0xff5a00, 4.5, 0.028);
  g.add(sparks);

  // Spotlight from above
  const spot = new THREE.SpotLight(0xfff8f0, 40, 22, Math.PI / 7.5, 0.28, 1.8);
  spot.position.set(0, 10, 1.5);
  spot.target.position.set(0, 0, 0);
  spot.castShadow = true;
  spot.shadow.mapSize.setScalar(1024);
  g.add(spot, spot.target);

  // Rim light (orange)
  const rim = new THREE.PointLight(0xff5a00, 3.5, 9);
  rim.position.set(-3, 0, -2);
  g.add(rim);

  // Ambient (near-zero)
  g.add(new THREE.AmbientLight(0x040404, 1));

  return g;
}

/* ─────────────────────────────────────────
   ROOM 1 — CUSHIONING
   Deep blue, exploded foam sole, burst particles
───────────────────────────────────────── */
function makeRoom1() {
  const g = new THREE.Group();
  g.position.set(0, 0, -70);

  // Dark blue floor
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(14, 48),
    new THREE.MeshStandardMaterial({ color: 0x00060e, roughness: 0.9 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y  = -2;
  floor.receiveShadow = true;
  g.add(floor);

  // Shoe — elevated, rotated to show sole
  const shoe = buildShoe({ bodyColor: 0x080818, accentColor: 0x00ccff, soleColor: 0x00aaff, swooshColor: '#00ccff' });
  shoe.position.set(0, 0, 0);
  shoe.rotation.set(0.35, -0.4, 0.12); // angled to show sole
  shoe.userData.cushShoe = true;
  g.add(shoe);

  // Exploded foam chunks
  const foamPieces = [];
  const foamColors = [0x00bbff, 0x0088dd, 0x44ddff, 0x006699];
  for (let i = 0; i < 14; i++) {
    const w = 0.14 + Math.random() * 0.28;
    const h = 0.08 + Math.random() * 0.14;
    const d = 0.18 + Math.random() * 0.28;
    const foam = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({
        color: foamColors[i % foamColors.length],
        roughness: 0.75, emissive: 0x003366, emissiveIntensity: 0.5
      })
    );
    foam.position.set(
      (Math.random() - 0.5) * 3.5,
      (Math.random() - 0.5) * 2.2,
      (Math.random() - 0.5) * 2.0
    );
    foam.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    foam.userData.basePos   = foam.position.clone();
    foam.userData.floatSpd  = Math.random() * 0.45 + 0.2;
    foam.userData.floatOff  = Math.random() * Math.PI * 2;
    foam.castShadow = true;
    foamPieces.push(foam);
    g.add(foam);
  }
  g.userData.foamPieces = foamPieces;

  // Burst particles
  const pts = makeParticles(320, 0x00aaff, 7, 0.038);
  g.add(pts);

  // Lighting
  g.add(new THREE.AmbientLight(0x000814, 2.5));
  const bl1 = new THREE.PointLight(0x0077ff, 8, 18);
  bl1.position.set(0, 4, 0);
  g.add(bl1);
  const bl2 = new THREE.PointLight(0x00ddff, 4, 12);
  bl2.position.set(-4, -1, 2);
  g.add(bl2);
  const bl3 = new THREE.PointLight(0x0044aa, 3, 10);
  bl3.position.set(3, -2, -2);
  g.add(bl3);

  return g;
}

/* ─────────────────────────────────────────
   ROOM 2 — SPEED
   White tunnel, motion streaks, shoe flying alongside
───────────────────────────────────────── */
function makeRoom2() {
  const g = new THREE.Group();
  g.position.set(0, 0, -140);

  // Tunnel cylinder (camera flies through it)
  const tunnel = new THREE.Mesh(
    new THREE.CylinderGeometry(5.5, 5.5, 65, 36, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide, transparent: true, opacity: 0.04 })
  );
  tunnel.rotation.x = Math.PI / 2;
  tunnel.position.z = -28;
  g.add(tunnel);

  // Tunnel ring lights (glowing hoops)
  for (let i = 0; i < 8; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(5.4, 0.035, 8, 48),
      new THREE.MeshBasicMaterial({ color: 0x8888ff, transparent: true, opacity: 0.18 })
    );
    ring.position.z = -5 - i * 7.5;
    g.add(ring);
  }

  // Speed streaks
  const streaks = [];
  for (let i = 0; i < 55; i++) {
    const len   = 3.5 + Math.random() * 9;
    const angle = Math.random() * Math.PI * 2;
    const r     = 1.4 + Math.random() * 3.8;
    const x     = Math.cos(angle) * r;
    const y     = Math.sin(angle) * r;
    const z     = -(Math.random() * 58);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array([x, y, z, x, y, z - len]), 3
    ));
    const hue  = 0.58 + Math.random() * 0.1;
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
      color: new THREE.Color().setHSL(hue, 1, 0.75),
      transparent: true, opacity: 0.25 + Math.random() * 0.45
    }));
    line.userData.streakSpd = 0.18 + Math.random() * 0.38;
    streaks.push(line);
    g.add(line);
  }
  g.userData.streaks = streaks;

  // Shoe flying alongside (slightly to the right, angled)
  const shoe = buildShoe({ bodyColor: 0x0d0d0d, accentColor: 0xffffff, soleColor: 0xdddddd });
  shoe.position.set(2.2, -0.1, -25);
  shoe.rotation.set(0.05, -Math.PI / 3.5, 0.12);
  shoe.userData.speedShoe = true;
  g.add(shoe);

  // Glowing carbon plate (visible near shoe)
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.025, 1.85),
    new THREE.MeshBasicMaterial({ color: 0x6666ff, transparent: true, opacity: 0.75 })
  );
  plate.position.set(2.2, -0.28, -25);
  plate.rotation.y = -Math.PI / 3.5;
  g.add(plate);

  // White speed particles
  const pts = makeParticles(250, 0xaaaaff, 9, 0.022);
  g.add(pts);

  // Lighting
  g.add(new THREE.AmbientLight(0x080818, 3.5));
  const wl = new THREE.PointLight(0xffffff, 10, 35);
  wl.position.set(0, 6, -20);
  g.add(wl);
  const bl = new THREE.PointLight(0x4444ff, 5, 22);
  bl.position.set(-4, 0, -30);
  g.add(bl);

  return g;
}

/* ─────────────────────────────────────────
   ROOM 3 — BREATHABILITY
   Airy open space, mesh fibers, airflow particles
───────────────────────────────────────── */
function makeRoom3() {
  const g = new THREE.Group();
  g.position.set(0, 0, -210);

  // Ambient sky sphere
  g.add(new THREE.Mesh(
    new THREE.SphereGeometry(35, 28, 14),
    new THREE.MeshBasicMaterial({ color: 0x020d18, side: THREE.BackSide })
  ));

  // Soft floor grid
  const grid = new THREE.GridHelper(28, 26, 0x1a3344, 0x0d1d28);
  grid.position.y = -2.2;
  g.add(grid);

  // Floating mesh fiber strands
  const fibers = [];
  for (let i = 0; i < 38; i++) {
    const len = 1.2 + Math.random() * 2.2;
    const fiber = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, len, 4),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.55 + Math.random() * 0.08, 0.85, 0.65 + Math.random() * 0.2),
        transparent: true, opacity: 0.35 + Math.random() * 0.45
      })
    );
    fiber.position.set(
      (Math.random() - 0.5) * 9,
      (Math.random() - 0.5) * 4.5,
      (Math.random() - 0.5) * 9
    );
    fiber.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    fiber.userData.floatSpd = Math.random() * 0.28 + 0.08;
    fiber.userData.floatOff = Math.random() * Math.PI * 2;
    fiber.userData.baseY    = fiber.position.y;
    fibers.push(fiber);
    g.add(fiber);
  }
  g.userData.fibers = fibers;

  // Airflow particle stream
  const airGeo = new THREE.BufferGeometry();
  const airCount = 600;
  const airPos = new Float32Array(airCount * 3);
  for (let i = 0; i < airCount; i++) {
    airPos[i*3]   = (Math.random() - 0.5) * 10;
    airPos[i*3+1] = (Math.random() - 0.5) *  5;
    airPos[i*3+2] = (Math.random() - 0.5) * 10;
  }
  airGeo.setAttribute('position', new THREE.BufferAttribute(airPos, 3));
  const airPts = new THREE.Points(airGeo, new THREE.PointsMaterial({
    color: 0x88ddff, size: 0.028, transparent: true, opacity: 0.55,
    sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false
  }));
  airPts.userData.airflow = true;
  g.add(airPts);

  // Shoe — upper close-up perspective
  const shoe = buildShoe({ bodyColor: 0x1a2d40, accentColor: 0x66ccff, soleColor: 0xf0f0f0, swooshColor: '#66ccff' });
  shoe.position.set(-0.6, -0.4, 0);
  shoe.rotation.y = Math.PI / 4.5;
  shoe.userData.breathShoe = true;
  g.add(shoe);

  // Lighting
  g.add(new THREE.AmbientLight(0x06111c, 3.5));
  const sky = new THREE.DirectionalLight(0x88ccff, 2.8);
  sky.position.set(0, 12, 4);
  g.add(sky);
  const rim = new THREE.PointLight(0x44aaff, 4, 14);
  rim.position.set(3.5, 2.5, 2);
  g.add(rim);
  const fill = new THREE.PointLight(0x002244, 2, 10);
  fill.position.set(-3, -1, 3);
  g.add(fill);

  return g;
}

/* ─────────────────────────────────────────
   ROOM 4 — FINALE
   Dark stadium, dramatic key light, confetti, full shoe
───────────────────────────────────────── */
function makeRoom4() {
  const g = new THREE.Group();
  g.position.set(0, 0, -285);

  // Stadium floor
  g.add(new THREE.Mesh(
    new THREE.CircleGeometry(32, 64),
    new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.85, metalness: 0.25 })
  )).receiveShadow = true;
  g.children[0].rotation.x = -Math.PI / 2;
  g.children[0].position.y = -2.8;

  // Stadium perimeter lights
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const pl = new THREE.PointLight(0xfff5e0, 2.2, 28);
    pl.position.set(Math.cos(a) * 14, 9, Math.sin(a) * 14);
    g.add(pl);
  }

  // Dramatic key light (angled spot)
  const key = new THREE.SpotLight(0xfff8ec, 28, 35, Math.PI / 5.5, 0.18, 1.2);
  key.position.set(-6, 14, 6);
  key.target.position.set(0, -1, 0);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(1024);
  g.add(key, key.target);

  // Blue fill
  const fill = new THREE.PointLight(0x3355ff, 4, 22);
  fill.position.set(5, 3, -4);
  g.add(fill);

  g.add(new THREE.AmbientLight(0x040404, 1.2));

  // Main shoe — large, on display
  const shoe = buildShoe({ bodyColor: 0x080808, accentColor: 0xff5a00, soleColor: 0xf5f5f5 });
  shoe.scale.setScalar(1.28);
  shoe.position.set(0, -1.6, 0);
  shoe.rotation.y = Math.PI / 7;
  shoe.userData.finaleShoe = true;
  g.add(shoe);

  // Floor glow halo
  g.add(new THREE.Mesh(
    new THREE.CircleGeometry(3.2, 64),
    new THREE.MeshBasicMaterial({ color: 0xff5a00, transparent: true, opacity: 0.07 })
  )).rotation.x = -Math.PI / 2;
  g.children[g.children.length - 1].position.y = -2.79;

  // Confetti
  const cfCount = 500;
  const cfGeo   = new THREE.BufferGeometry();
  const cfPos   = new Float32Array(cfCount * 3);
  const cfCol   = new Float32Array(cfCount * 3);
  const cfPal   = [
    new THREE.Color(0xff5a00), new THREE.Color(0xffffff),
    new THREE.Color(0xffcc00), new THREE.Color(0x33aaff),
    new THREE.Color(0xff3366),
  ];
  for (let i = 0; i < cfCount; i++) {
    cfPos[i*3]   = (Math.random() - 0.5) * 22;
    cfPos[i*3+1] = Math.random() * 18;
    cfPos[i*3+2] = (Math.random() - 0.5) * 22;
    const c = cfPal[i % cfPal.length];
    cfCol[i*3] = c.r; cfCol[i*3+1] = c.g; cfCol[i*3+2] = c.b;
  }
  cfGeo.setAttribute('position', new THREE.BufferAttribute(cfPos, 3));
  cfGeo.setAttribute('color',    new THREE.BufferAttribute(cfCol, 3));
  const confetti = new THREE.Points(cfGeo, new THREE.PointsMaterial({
    size: 0.12, vertexColors: true, transparent: true, opacity: 0.88, sizeAttenuation: true
  }));
  confetti.userData.isConfetti = true;
  g.add(confetti);

  return g;
}

/* ─────────────────────────────────────────
   BUILD ALL ROOMS
───────────────────────────────────────── */
const rooms = [makeRoom0(), makeRoom1(), makeRoom2(), makeRoom3(), makeRoom4()];
rooms.forEach(r => scene.add(r));

// Faint global fill
scene.add(new THREE.AmbientLight(0x000000, 0.3));

/* ─────────────────────────────────────────
   SCROLL TRIGGER
───────────────────────────────────────── */
const { gsap, ScrollTrigger } = window;
gsap.registerPlugin(ScrollTrigger);

// Room active zones — scroll progress [0,1]
const ZONES = [
  { start: 0.00, peak: 0.06, end: 0.17 },  // Room 0
  { start: 0.14, peak: 0.26, end: 0.36 },  // Room 1
  { start: 0.33, peak: 0.48, end: 0.58 },  // Room 2
  { start: 0.55, peak: 0.68, end: 0.78 },  // Room 3
  { start: 0.75, peak: 0.88, end: 1.00 },  // Room 4
];

const BG_COLORS = [
  new THREE.Color(0x000000),
  new THREE.Color(0x00060f),
  new THREE.Color(0x06060e),
  new THREE.Color(0x000a15),
  new THREE.Color(0x020202),
];

const textEls = [0,1,2,3,4].map(i => document.getElementById(`text-${i}`));
const dots    = [...document.querySelectorAll('.dot')];
const ctaBtn  = document.getElementById('cta-btn');

let scrollProg = 0;
let activeRoom = 0;
const bgColor  = new THREE.Color(0x000000);

ScrollTrigger.create({
  trigger: document.body,
  start:   'top top',
  end:     'bottom bottom',
  scrub:   1.2,
  onUpdate(self) {
    scrollProg = self.progress;
    onScroll(scrollProg);
  }
});

// Dot click — scroll to room
dots.forEach((dot, i) => {
  dot.addEventListener('click', () => {
    const target = ZONES[i].peak;
    window.scrollTo({ top: target * (document.body.scrollHeight - window.innerHeight), behavior: 'smooth' });
  });
});

function onScroll(t) {
  // Camera position
  const camPos  = camPath.getPoint(t);
  camera.position.copy(camPos);

  const lookPos = lookPath.getPoint(t);
  camera.lookAt(lookPos);

  // Background color blend
  bgColor.set(0x000000);
  for (let i = 0; i < ZONES.length; i++) {
    const z = ZONES[i];
    if (t >= z.start && t <= z.end) {
      const local = (t - z.start) / (z.end - z.start);
      const alpha = Math.sin(local * Math.PI) * 0.45;
      bgColor.lerp(BG_COLORS[i], alpha);
    }
  }
  renderer.setClearColor(bgColor);
  scene.fog.color.copy(bgColor);

  // Text overlays
  for (let i = 0; i < ZONES.length; i++) {
    const z = ZONES[i];
    let op = 0;
    if (t >= z.start && t <= z.end) {
      const local = (t - z.start) / (z.end - z.start);
      op = local < 0.25 ? local / 0.25 : local < 0.72 ? 1 : (1 - local) / 0.28;
      op = Math.max(0, Math.min(1, op));
    }
    textEls[i].style.opacity = op;
    textEls[i].style.transform = `translateY(${(1 - op) * 18}px)`;
  }

  // CTA button (room 4, near end)
  const ctaAlpha = t > 0.86 ? Math.min((t - 0.86) / 0.1, 1) : 0;
  ctaBtn.style.opacity        = ctaAlpha;
  ctaBtn.style.pointerEvents  = ctaAlpha > 0 ? 'auto' : 'none';

  // Active room for dots
  let newActive = 0;
  for (let i = 0; i < ZONES.length; i++) {
    if (t >= (ZONES[i].start + ZONES[i].end) * 0.5 - 0.04) newActive = i;
  }
  if (newActive !== activeRoom) {
    dots[activeRoom].classList.remove('active');
    dots[newActive].classList.add('active');
    activeRoom = newActive;
  }
}

/* ─────────────────────────────────────────
   ANIMATION LOOP
───────────────────────────────────────── */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt   = clock.getDelta();
  const time = clock.elapsedTime;

  // Room 0 — rotate shoe, pulse rings
  const r0 = rooms[0];
  const shoe0 = r0.children.find(c => c.userData.spinMe);
  if (shoe0) shoe0.rotation.y += dt * 0.38;
  if (r0.userData.rings) {
    r0.userData.rings.forEach((ring, i) => {
      ring.material.opacity = 0.18 + Math.sin(time * 1.4 + i * 1.1) * 0.14;
    });
  }

  // Room 1 — float foam pieces
  if (rooms[1].userData.foamPieces) {
    rooms[1].userData.foamPieces.forEach(fp => {
      const s = fp.userData.floatOff + time * fp.userData.floatSpd;
      fp.position.y = fp.userData.basePos.y + Math.sin(s) * 0.22;
      fp.rotation.x += dt * 0.18;
      fp.rotation.z += dt * 0.12;
    });
  }

  // Room 2 — advance speed streaks
  if (rooms[2].userData.streaks) {
    rooms[2].userData.streaks.forEach(line => {
      line.position.z += line.userData.streakSpd;
      if (line.position.z > 6) line.position.z = -60;
    });
  }

  // Room 2 — speed shoe subtle wobble
  const shoe2 = rooms[2].children.find(c => c.userData.speedShoe);
  if (shoe2) {
    shoe2.rotation.z = 0.12 + Math.sin(time * 2.2) * 0.025;
    shoe2.position.y = -0.1 + Math.sin(time * 1.6) * 0.08;
  }

  // Room 3 — sway fibers + airflow
  if (rooms[3].userData.fibers) {
    rooms[3].userData.fibers.forEach(f => {
      const s = f.userData.floatOff + time * f.userData.floatSpd;
      f.position.y = f.userData.baseY + Math.sin(s) * 0.18;
      f.rotation.z += dt * 0.04;
    });
  }
  rooms[3].children.forEach(child => {
    if (!child.userData.airflow) return;
    const pos = child.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i) + 0.012;
      if (x > 5) x -= 10;
      pos.setX(i, x);
    }
    pos.needsUpdate = true;
  });

  // Room 4 — confetti fall + finale shoe rotate
  rooms[4].children.forEach(child => {
    if (child.userData.isConfetti) {
      const pos = child.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - 0.035;
        if (y < -3) y = 14 + Math.random() * 4;
        pos.setY(i, y);
        pos.setX(i, pos.getX(i) + Math.sin(time * 0.6 + i * 0.08) * 0.004);
      }
      pos.needsUpdate = true;
    }
    if (child.userData.finaleShoe) {
      child.rotation.y += dt * 0.18;
    }
  });

  // Render
  composer.render();
}

/* ─────────────────────────────────────────
   LOADING SEQUENCE
───────────────────────────────────────── */
function startLoading() {
  const fill    = document.getElementById('loading-fill');
  const overlay = document.getElementById('loading');
  let p = 0;

  const interval = setInterval(() => {
    p = Math.min(p + Math.random() * 14 + 2, 100);
    fill.style.width = p + '%';
    if (p >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        gsap.to(overlay, {
          opacity: 0, duration: 0.9,
          onComplete() { overlay.style.display = 'none'; }
        });
        // Kick the initial camera + text state
        onScroll(0);
        animate();
      }, 280);
    }
  }, 65);
}

startLoading();
