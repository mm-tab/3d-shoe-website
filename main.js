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
renderer.toneMappingExposure = 1.3;
renderer.setClearColor(0x000000);

const scene = new THREE.Scene();
scene.fog   = new THREE.FogExp2(0x000000, 0.007);

const camera = new THREE.PerspectiveCamera(56, window.innerWidth / window.innerHeight, 0.1, 600);
camera.position.set(1.5, 1.0, 5);

/* ═══════════════════════════════════════
   POST-PROCESSING
═══════════════════════════════════════ */
const composer  = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight), 0.55, 0.4, 0.82
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
   WARNING: THREE.Object3D.add() returns the PARENT, not the child.
   Always save lights/meshes to variables before setting position.
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
═══════════════════════════════════════ */
const camPath = new THREE.CatmullRomCurve3([
  new THREE.Vector3( 1.8,  1.2,   5.5),  // 0  Room 0 hero (3/4 right-front)
  new THREE.Vector3( 0.8,  0.7,   1.5),  // 1  push in
  new THREE.Vector3( 0.0,  0.4,  -8.0),  // 2  past shoe
  new THREE.Vector3( 0.0,  1.0, -28.0),  // 3  rising for sole view
  new THREE.Vector3( 0.0,  2.2, -50.0),  // 4  climbing
  new THREE.Vector3( 0.0,  3.0, -63.0),  // 5  Room 1 – above sole
  new THREE.Vector3( 1.0,  2.0, -84.0),  // 6  leaving, swing right
  new THREE.Vector3( 3.0,  0.8,-112.0),  // 7  arc rightward
  new THREE.Vector3( 4.4,  0.2,-132.0),  // 8  approach from right
  new THREE.Vector3( 5.0, -0.1,-140.0),  // 9  Room 2 – side/plate view
  new THREE.Vector3( 3.5,  0.8,-158.0),  // 10 leaving
  new THREE.Vector3( 1.2,  1.4,-182.0),  // 11 arc forward/left
  new THREE.Vector3( 0.0,  1.8,-204.0),  // 12 Room 3 – upper front view
  new THREE.Vector3( 0.6,  2.2,-226.0),  // 13 pull back
  new THREE.Vector3( 1.8,  2.8,-256.0),  // 14 rising for finale
  new THREE.Vector3( 2.2,  2.6,-274.0),  // 15 Room 4 – finale reveal
], false, 'catmullrom', 0.5);

const lookPath = new THREE.CatmullRomCurve3([
  new THREE.Vector3( 0.0,  0.2,   0.0),  // 0  shoe centre
  new THREE.Vector3( 0.0,  0.0,  -4.0),  // 1
  new THREE.Vector3( 0.0, -0.1, -15.0),  // 2
  new THREE.Vector3( 0.0,  0.5, -44.0),  // 3  toward sole
  new THREE.Vector3( 0.0,  0.5, -64.0),  // 4
  new THREE.Vector3( 0.0,  0.4, -70.0),  // 5  Room 1 – sole surface
  new THREE.Vector3( 0.0,  0.0, -84.0),  // 6
  new THREE.Vector3( 0.0, -0.2,-120.0),  // 7
  new THREE.Vector3( 0.0, -0.2,-138.0),  // 8
  new THREE.Vector3( 0.0, -0.2,-140.0),  // 9  Room 2 – plate zone
  new THREE.Vector3( 0.0,  0.1,-156.0),  // 10
  new THREE.Vector3( 0.0,  0.4,-198.0),  // 11
  new THREE.Vector3( 0.0,  0.3,-210.0),  // 12 Room 3 – upper
  new THREE.Vector3( 0.0,  0.5,-238.0),  // 13
  new THREE.Vector3( 0.0, -0.5,-274.0),  // 14
  new THREE.Vector3( 0.0, -1.2,-285.0),  // 15 Room 4
], false, 'catmullrom', 0.5);

/* ═══════════════════════════════════════
   CANVAS TEXTURES
═══════════════════════════════════════ */
function makeSwooshTex(color = '#111111') {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 256);
  ctx.fillStyle = color;
  ctx.beginPath();
  // Nike Tempo swoosh – wider, more aggressive than standard
  ctx.moveTo(22, 200);
  ctx.bezierCurveTo(60,  80, 320, 24, 495,  52);
  ctx.bezierCurveTo(380,  90, 130, 168,  52, 218);
  ctx.closePath();
  ctx.fill();
  return new THREE.CanvasTexture(c);
}

function makeKnitTex(tint = 'rgba(255,60,140,0.55)') {
  // Hexagonal mesh — represents Flyknit weave
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 512);
  ctx.strokeStyle = tint;
  ctx.lineWidth = 1.6;
  const s = 22, h = s * Math.sqrt(3);
  for (let row = -1; row < 28; row++) {
    for (let col = -1; col < 28; col++) {
      const x = col * s * 1.5;
      const y = row * h + (col % 2 === 0 ? 0 : h / 2);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a  = (Math.PI / 3) * i - Math.PI / 6;
        const px = x + s * 0.82 * Math.cos(a);
        const py = y + s * 0.82 * Math.sin(a);
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
  ctx.strokeStyle = 'rgba(55,75,210,0.32)';
  ctx.lineWidth = 1;
  for (let i = -256; i < 512; i += 12) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 256, 256); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i - 256, 256); ctx.stroke();
  }
  return new THREE.CanvasTexture(c);
}

function makeZoomXLogoTex() {
  // "ZoomX" label for midsole side
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 256, 64);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.font = 'bold 28px Arial Black, Arial';
  ctx.letterSpacing = '-1px';
  ctx.fillText('ZoomX', 12, 44);
  return new THREE.CanvasTexture(c);
}

/* ═══════════════════════════════════════
   SHOE BUILDER — Nike Air Zoom Tempo NEXT%
   Hot pink Flyknit upper / chunky yellow ZoomX midsole / black swoosh
   Proportions matched to the reference image:
     • Midsole is the dominant element — very tall and wide
     • Upper is low-profile over the midsole
     • Forefoot Air Zoom pod visible in sole
     • Aggressive toe spring (upward curve at front)
═══════════════════════════════════════ */
function buildShoe({
  upperColor  = 0xff1c72,  // hyper pink
  midsoleColor = 0xf5a800, // amber/yellow
  accentColor = 0xff1c72,  // pink
  swooshColor = '#111111', // black swoosh
  plateGlow   = 0.4,
} = {}) {
  const root = new THREE.Group();

  // Materials
  const mUpper  = new THREE.MeshStandardMaterial({ color: upperColor,   roughness: 0.62, metalness: 0.05 });
  const mSole   = new THREE.MeshStandardMaterial({ color: midsoleColor, roughness: 0.80, metalness: 0.00 });
  const mRubber = new THREE.MeshStandardMaterial({ color: 0x111111,     roughness: 0.70, metalness: 0.00 });
  const mAccent = new THREE.MeshStandardMaterial({
    color: accentColor, roughness: 0.28, metalness: 0.12,
    emissive: new THREE.Color(accentColor), emissiveIntensity: 0.15,
  });
  const mCarbon = new THREE.MeshStandardMaterial({
    map: makeCarbonTex(), color: 0x0d0d22, roughness: 0.10, metalness: 0.96,
    emissive: new THREE.Color(0x1122cc), emissiveIntensity: plateGlow,
  });
  const mSwoosh = new THREE.MeshStandardMaterial({
    map: makeSwooshTex(swooshColor), transparent: true,
    roughness: 0.25, metalness: 0.08, depthWrite: false,
  });
  const mZoomPod = new THREE.MeshStandardMaterial({
    color: 0x111133, roughness: 0.20, metalness: 0.60,
    transparent: true, opacity: 0.82,
    emissive: new THREE.Color(0x1122aa), emissiveIntensity: 0.3,
  });

  // ── OUTSOLE (black rubber, thin) ────────────────────────
  // Main outsole
  mkMesh(root, new THREE.BoxGeometry(1.10, 0.10, 3.50), mRubber, 0, -0.94, 0.05);
  // Outsole heel knob (slightly larger at heel for grip)
  mkMesh(root, new THREE.BoxGeometry(1.12, 0.04, 0.85), mRubber, 0, -0.97, -1.35);

  // ── MIDSOLE (yellow ZoomX foam — the hero element) ──────
  // Main midsole block — very tall compared to upper
  mkMesh(root, new THREE.BoxGeometry(1.06, 0.54, 3.30), mSole, 0, -0.62, 0.06);
  // Heel stack — extra foam height at heel (ZoomX heel bevel)
  const heelStack = mkMesh(root, new THREE.BoxGeometry(1.04, 0.20, 1.02), mSole, 0, -0.44, -1.30);
  // Midsole side lip (slight flare)
  mkMesh(root, new THREE.BoxGeometry(0.06, 0.54, 3.20), mSole,  0.54, -0.62,  0.06);
  mkMesh(root, new THREE.BoxGeometry(0.06, 0.54, 3.20), mSole, -0.54, -0.62,  0.06);

  // Air Zoom forefoot pod — dark oval visible at front-bottom of midsole
  const zoomPod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.30, 0.30, 0.14, 24),
    mZoomPod
  );
  zoomPod.rotation.x = Math.PI / 2; // lay flat (seen from side)
  zoomPod.position.set(0, -0.84, 1.10);
  root.add(zoomPod);
  root.userData.zoomPod = zoomPod;

  // ZoomX label on midsole side (right)
  const logoMat = new THREE.MeshBasicMaterial({
    map: makeZoomXLogoTex(), transparent: true, depthWrite: false, opacity: 0.55,
  });
  const logoMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.80, 0.20), logoMat);
  logoMesh.rotation.y = -Math.PI / 2;
  logoMesh.position.set(0.56, -0.72, -0.20);
  root.add(logoMesh);

  // ── CARBON FIBER PLATE (embedded between foam layers) ───
  mkMesh(root, new THREE.BoxGeometry(0.88, 0.045, 2.90), mCarbon, 0, -0.60, 0.04);

  // ── UPPER (low-profile pink Flyknit) ────────────────────
  // Main upper body — relatively flat/low compared to midsole
  const upperGeo = new THREE.BoxGeometry(0.92, 0.54, 2.75);
  taperBox(upperGeo, 0.72, 0.92, 0.44, 0.54); // taper toward toe
  const upper = new THREE.Mesh(upperGeo, mUpper);
  upper.position.set(0, 0.12, -0.06);
  upper.castShadow = upper.receiveShadow = true;
  root.add(upper);

  // Toe box — aggressive upward curve (toe spring)
  const toeMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.40, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.52),
    mUpper
  );
  toeMesh.scale.set(0.95, 0.68, 0.84);
  toeMesh.position.set(0, 0.22, 1.50); // raised higher = toe spring
  toeMesh.rotation.x = -0.20;          // tip slightly upward
  toeMesh.castShadow = true;
  root.add(toeMesh);

  // Heel counter — lower profile, streamlined
  const heelMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.44, 0.47, 0.65, 18, 1, false, 0, Math.PI),
    mUpper
  );
  heelMesh.rotation.y = Math.PI;
  heelMesh.position.set(0, 0.05, -1.50);
  heelMesh.castShadow = true;
  root.add(heelMesh);

  // Heel pull tab (small loop at top of heel)
  const pullTab = new THREE.Mesh(
    new THREE.TorusGeometry(0.08, 0.022, 6, 16, Math.PI),
    mAccent
  );
  pullTab.rotation.x = Math.PI / 2;
  pullTab.position.set(0, 0.60, -1.56);
  root.add(pullTab);

  // Tongue (low profile)
  mkMesh(root, new THREE.BoxGeometry(0.44, 0.42, 0.06),
    new THREE.MeshStandardMaterial({ color: upperColor, roughness: 0.70 }),
    0, 0.24, 0.70);

  // Ankle collar (thin, sits atop heel counter)
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.030, 8, 28, Math.PI), mAccent
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 0.48, -0.95);
  root.add(collar);

  // Laces — flat, almost flush with upper (modern racing style)
  const laceMat = new THREE.MeshStandardMaterial({ color: upperColor, roughness: 0.80 });
  for (let i = 0; i < 5; i++) {
    mkMesh(root, new THREE.BoxGeometry(0.48, 0.028, 0.032), laceMat, 0, 0.40, 0.22 + i * 0.20);
  }

  // ── SWOOSH (black, right side — the iconic mark) ────────
  const swooshGeo = new THREE.PlaneGeometry(1.62, 0.82);
  // Right side swoosh
  const swooshR = new THREE.Mesh(swooshGeo, mSwoosh);
  swooshR.rotation.y = -Math.PI / 2;
  swooshR.position.set(0.465, 0.08, -0.12);
  root.add(swooshR);
  // Left side (mirrored)
  const swooshL = new THREE.Mesh(swooshGeo, mSwoosh.clone());
  swooshL.material.map = makeSwooshTex(swooshColor);
  swooshL.rotation.y   =  Math.PI / 2;
  swooshL.scale.x      = -1;
  swooshL.position.set(-0.465, 0.08, -0.12);
  root.add(swooshL);

  root.scale.setScalar(0.72);
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
   Camera: 3/4 right-front-above
   Full shoe rotating — hot pink upper, yellow midsole hero shot
═══════════════════════════════════════ */
function makeRoom0() {
  const g = new THREE.Group();

  // Reflective dark floor
  mkMesh(g, new THREE.CircleGeometry(14, 64),
    new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.16, metalness: 0.94 }),
    0, -1.08, 0, -Math.PI / 2, 0, 0);

  // Pedestal
  mkMesh(g, new THREE.CylinderGeometry(0.92, 1.12, 0.22, 40),
    new THREE.MeshStandardMaterial({ color: 0x0e0e0e, roughness: 0.20, metalness: 0.90 }),
    0, -0.96, 0);
  mkMesh(g, new THREE.CylinderGeometry(1.22, 1.42, 0.07, 40),
    new THREE.MeshStandardMaterial({ color: 0x060606, roughness: 0.10, metalness: 0.96 }),
    0, -1.10, 0);

  // THE SHOE — 3/4 view showing right side (swoosh side) + top
  const shoe = buildShoe();
  shoe.position.set(0, -0.55, 0);
  shoe.rotation.y = -Math.PI / 6; // angle to show right side profile
  shoe.userData.spinMe = true;
  g.add(shoe);

  // Floor glow rings — pink/magenta tones
  const ringMat1 = new THREE.MeshBasicMaterial({ color: 0xff1c72, transparent: true, opacity: 0.42 });
  const ringMat2 = new THREE.MeshBasicMaterial({ color: 0xff1c72, transparent: true, opacity: 0.14 });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.018, 8, 72), ringMat1);
  ring1.rotation.x = -Math.PI / 2; ring1.position.y = -1.04;
  g.add(ring1);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.50, 0.010, 8, 72), ringMat2);
  ring2.rotation.x = -Math.PI / 2; ring2.position.y = -1.05;
  g.add(ring2);
  g.userData.rings = [ring1, ring2];

  // Yellow accent ring (midsole color)
  const ringMat3 = new THREE.MeshBasicMaterial({ color: 0xf5a800, transparent: true, opacity: 0.20 });
  const ring3 = new THREE.Mesh(new THREE.TorusGeometry(2.20, 0.012, 8, 72), ringMat3);
  ring3.rotation.x = -Math.PI / 2; ring3.position.y = -1.045;
  g.add(ring3);
  g.userData.rings.push(ring3);

  // Pink floating particles
  g.add(makeParticles(120, 0xff1c72, 5.0, 0.028));

  // Spotlight — slightly warm to complement the pink
  const spot = new THREE.SpotLight(0xfff0f5, 42, 26, Math.PI / 7, 0.24, 1.8);
  spot.position.set(0, 11, 2);
  spot.castShadow = true;
  spot.shadow.mapSize.setScalar(1024);
  spot.target.position.set(0, -0.4, 0);
  g.add(spot);
  g.add(spot.target);

  // Pink rim light (from left)
  const rimPink = new THREE.PointLight(0xff1c72, 4.5, 11);
  rimPink.position.set(-3, 0.5, -1);
  g.add(rimPink);

  // Warm yellow fill (echoes midsole colour)
  const fillYellow = new THREE.PointLight(0xf5a800, 2.0, 8);
  fillYellow.position.set(3, -0.5, 2);
  g.add(fillYellow);

  g.add(new THREE.AmbientLight(0x0f0a08, 2.5));

  return g;
}

/* ═══════════════════════════════════════
   ROOM 1 — ZOOMX MIDSOLE SOLE
   Camera: HIGH ABOVE looking DOWN at flipped shoe
   Focus: chunky yellow midsole face-on
═══════════════════════════════════════ */
function makeRoom1() {
  const g = new THREE.Group();
  g.position.set(0, 0, -70);

  // Shoe flipped — midsole / sole faces UP toward overhead camera
  const shoe = buildShoe({ midsoleColor: 0xf5a800, upperColor: 0xff1c72 });
  shoe.position.set(0, 0.5, 0);
  shoe.rotation.set(Math.PI, Math.PI / 7, 0); // flipped, slight y angle
  shoe.userData.cushShoe = true;
  g.add(shoe);

  // Foam cell bubbles — yellow/amber, orbit the sole
  const foamColors = [0xf5a800, 0xffcc44, 0xffd666, 0xf08000];
  const foamPieces = [];
  for (let i = 0; i < 22; i++) {
    const s    = 0.05 + Math.random() * 0.13;
    const foam = new THREE.Mesh(
      new THREE.SphereGeometry(s, 10, 8),
      new THREE.MeshStandardMaterial({
        color: foamColors[i % foamColors.length],
        roughness: 0.82, emissive: new THREE.Color(0x663300), emissiveIntensity: 0.25,
        transparent: true, opacity: 0.90,
      })
    );
    const angle = (i / 22) * Math.PI * 2;
    const r     = 0.6 + Math.random() * 1.1;
    foam.position.set(Math.cos(angle) * r, 1.0 + Math.random() * 0.8, Math.sin(angle) * r);
    foam.userData.baseY  = foam.position.y;
    foam.userData.speed  = Math.random() * 0.50 + 0.20;
    foam.userData.offset = Math.random() * Math.PI * 2;
    foamPieces.push(foam);
    g.add(foam);
  }
  g.userData.foamPieces = foamPieces;

  // Compression wave rings (yellow, pulse from sole impact point)
  const waveRings = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.1, 0.013, 6, 52),
      new THREE.MeshBasicMaterial({ color: 0xf5a800, transparent: true, opacity: 0.9 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 1.2, 0);
    ring.userData.waveOffset = i * (1 / 3);
    waveRings.push(ring);
    g.add(ring);
  }
  g.userData.waveRings = waveRings;

  // Annotation dots + rods
  const aDotGeo = new THREE.SphereGeometry(0.028, 6, 6);
  const aDotMat = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
  const aLineMat = new THREE.MeshBasicMaterial({ color: 0xf5a800, transparent: true, opacity: 0.6 });
  [[0.80, 1.6, 0.3, 0.5], [-0.85, 1.4, -0.2, 0.4]].forEach(([x, dy, z, h]) => {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, h, 4), aLineMat);
    rod.position.set(x, dy, z); g.add(rod);
    const dot = new THREE.Mesh(aDotGeo, aDotMat);
    dot.position.set(x, dy + h / 2, z); g.add(dot);
  });

  // Yellow particles
  g.add(makeParticles(220, 0xf5a800, 5.5, 0.030));

  // Floor
  mkMesh(g, new THREE.CircleGeometry(12, 48),
    new THREE.MeshStandardMaterial({ color: 0x0a0600, roughness: 0.9 }),
    0, -1.8, 0, -Math.PI / 2, 0, 0);

  // Lights — warm amber/yellow from above
  g.add(new THREE.AmbientLight(0x0f0800, 3.0));

  const topLight = new THREE.PointLight(0xf5a800, 14, 24);
  topLight.position.set(0, 5.5, 0);
  g.add(topLight);

  const fill1 = new THREE.PointLight(0xffcc44, 5, 16);
  fill1.position.set(-3, 2, 2);
  g.add(fill1);

  const fill2 = new THREE.DirectionalLight(0xffe080, 2.0);
  fill2.position.set(0, 8, 0);
  g.add(fill2);

  return g;
}

/* ═══════════════════════════════════════
   ROOM 2 — CARBON FIBER PLATE
   Camera: from the RIGHT side (shoe's swoosh side)
   Shows midsole cross-section + exploded layer diagram
═══════════════════════════════════════ */
function makeRoom2() {
  const g = new THREE.Group();
  g.position.set(0, 0, -140);

  // Shoe — nearly default y-rotation, camera sees swoosh side profile
  const shoe = buildShoe({ plateGlow: 1.4 });
  shoe.position.set(0, -0.3, 0);
  shoe.rotation.y = 0.06;
  shoe.userData.carbonShoe = true;
  g.add(shoe);

  // ── Exploded sole stack (x≈-2.5, shows layers floating apart) ──
  const stackX   = -2.5;
  const eRubMat  = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.65 });
  const ePlatMat = new THREE.MeshStandardMaterial({
    map: makeCarbonTex(), color: 0x0d0d22, roughness: 0.08, metalness: 0.96,
    emissive: new THREE.Color(0x1122ff), emissiveIntensity: 2.0,
  });
  const eFoamMat = new THREE.MeshStandardMaterial({
    color: 0xf5a800, roughness: 0.80,
    emissive: new THREE.Color(0x331100), emissiveIntensity: 0.15,
  });

  const eOut   = mkMesh(g, new THREE.BoxGeometry(0.92, 0.10, 2.5), eRubMat,  stackX, -0.82, 0);
  const ePlate = mkMesh(g, new THREE.BoxGeometry(0.88, 0.046, 2.2), ePlatMat, stackX, -0.28, 0);
  const eFoam  = mkMesh(g, new THREE.BoxGeometry(0.95, 0.56, 2.5), eFoamMat,  stackX,  0.16, 0);
  eOut.userData.baseY  = -0.82;
  ePlate.userData.baseY = -0.28;
  eFoam.userData.baseY  =  0.16;
  g.userData.ePlate      = ePlate;
  g.userData.stackLayers = [eOut, ePlate, eFoam];

  // Connector line
  const connGeo = new THREE.BufferGeometry();
  connGeo.setAttribute('position', new THREE.BufferAttribute(
    new Float32Array([-2.0, -0.28, 0,  -0.45, -0.28, 0]), 3
  ));
  g.add(new THREE.Line(connGeo,
    new THREE.LineBasicMaterial({ color: 0x3344ff, transparent: true, opacity: 0.4 })));

  // Propulsion cones — forward force (+x direction)
  const arrowMat  = new THREE.MeshBasicMaterial({ color: 0x4466ff, transparent: true, opacity: 0.7 });
  const propArrows = [];
  for (let i = 0; i < 5; i++) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.046, 0.24, 6), arrowMat);
    cone.rotation.z = -Math.PI / 2;
    cone.position.set(1.0 + i * 0.32, -0.28, -0.9 + i * 0.32);
    g.add(cone);
    propArrows.push(cone);
  }
  g.userData.propArrows = propArrows;

  // Plate-zone drifting particles
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(180 * 3);
  for (let i = 0; i < 180; i++) {
    pPos[i*3]   = (Math.random() - 0.5) * 9;
    pPos[i*3+1] = -0.28 + (Math.random() - 0.5) * 0.28;
    pPos[i*3+2] = (Math.random() - 0.5) * 4;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pPts = new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: 0x4466ff, size: 0.030, transparent: true, opacity: 0.70,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  pPts.userData.plateParticles = true;
  g.add(pPts);

  // Lights
  g.add(new THREE.AmbientLight(0x040410, 2.5));

  const sideKey = new THREE.SpotLight(0xfff8ff, 24, 30, Math.PI / 6, 0.28, 1.5);
  sideKey.position.set(7, 5, 0);
  sideKey.castShadow = true;
  sideKey.target.position.set(0, -0.3, 0);
  g.add(sideKey);
  g.add(sideKey.target);

  const blL1 = new THREE.PointLight(0x2233ff, 6, 18);
  blL1.position.set(-3.5, 0, 0);
  g.add(blL1);

  const blL2 = new THREE.PointLight(0x4466ff, 3.5, 12);
  blL2.position.set(0, -2.5, 2);
  g.add(blL2);

  // Pink rim to keep shoe colors alive
  const pinkRim = new THREE.PointLight(0xff1c72, 2, 10);
  pinkRim.position.set(-2, 2, -2);
  g.add(pinkRim);

  return g;
}

/* ═══════════════════════════════════════
   ROOM 3 — FLYKNIT UPPER
   Camera: front-above, looking at upper mesh face
   Pink hex knit overlay + airflow particles through mesh
═══════════════════════════════════════ */
function makeRoom3() {
  const g = new THREE.Group();
  g.position.set(0, 0, -210);

  // Shoe — slight angle, camera sees upper face-on
  const shoe = buildShoe({ plateGlow: 0.2 });
  shoe.position.set(0, -0.3, 0);
  shoe.rotation.set(-0.06, 0.30, 0);
  shoe.userData.breathShoe = true;
  g.add(shoe);

  // Flyknit hex-mesh overlay on the upper surface
  const knitMat = new THREE.MeshBasicMaterial({
    map: makeKnitTex('rgba(255,60,140,0.60)'), transparent: true,
    opacity: 0.68, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const knitTop = new THREE.Mesh(new THREE.PlaneGeometry(1.22, 0.80), knitMat);
  knitTop.position.set(0.06, 0.20, 0.80);
  knitTop.rotation.set(-0.06, 0.30, 0); // match shoe angle
  g.add(knitTop);
  g.userData.knitPlane = knitTop;

  // Side knit overlay
  const knitSide = new THREE.Mesh(new THREE.PlaneGeometry(0.90, 0.60), knitMat.clone());
  knitSide.rotation.y = -Math.PI / 2;
  knitSide.position.set(0.44, 0.14, 0.05);
  g.add(knitSide);

  // Airflow particles (pink) — stream through upper left→right
  const airCount = 500;
  const airGeo   = new THREE.BufferGeometry();
  const airPos   = new Float32Array(airCount * 3);
  const airPhase = new Float32Array(airCount);
  for (let i = 0; i < airCount; i++) {
    airPos[i*3]   = (Math.random() - 0.5) * 2.4;
    airPos[i*3+1] = -0.35 + Math.random() * 0.95;
    airPos[i*3+2] = -0.6 + Math.random() * 1.9;
    airPhase[i]   = Math.random() * Math.PI * 2;
  }
  airGeo.setAttribute('position', new THREE.BufferAttribute(airPos, 3));
  const airPts = new THREE.Points(airGeo, new THREE.PointsMaterial({
    color: 0xff88cc, size: 0.022, transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  airPts.userData.airPhase  = airPhase;
  airPts.userData.isAirflow = true;
  g.add(airPts);

  // Floating yarn threads — pink tones
  const yarns = [];
  for (let i = 0; i < 24; i++) {
    const len  = 0.7 + Math.random() * 1.8;
    const yarn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.003, len, 4),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.91 + Math.random() * 0.08, 1, 0.58 + Math.random() * 0.22),
        transparent: true, opacity: 0.30 + Math.random() * 0.45,
      })
    );
    yarn.position.set(
      (Math.random() - 0.5) * 4.0,
      -0.5 + Math.random() * 2.2,
      (Math.random() - 0.5) * 2.8
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
  const grid = new THREE.GridHelper(22, 24, 0x2a0a14, 0x1a0008);
  grid.position.y = -1.8;
  g.add(grid);

  // Lights — pink glow
  g.add(new THREE.AmbientLight(0x140608, 3.5));

  const pinkKey = new THREE.DirectionalLight(0xff88cc, 2.5);
  pinkKey.position.set(2, 8, 4);
  g.add(pinkKey);

  const rimPL = new THREE.PointLight(0xff1c72, 5.5, 14);
  rimPL.position.set(2.5, 2.5, 2);
  g.add(rimPL);

  const fillPL = new THREE.PointLight(0x880033, 2.5, 10);
  fillPL.position.set(-2.5, -0.5, 1);
  g.add(fillPL);

  return g;
}

/* ═══════════════════════════════════════
   ROOM 4 — FINALE REVEAL
   Camera: low dramatic angle, full shoe
   Stadium, confetti in shoe's color palette
═══════════════════════════════════════ */
function makeRoom4() {
  const g = new THREE.Group();
  g.position.set(0, 0, -285);

  // Stadium floor
  mkMesh(g, new THREE.CircleGeometry(32, 64),
    new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.82, metalness: 0.28 }),
    0, -2.8, 0, -Math.PI / 2, 0, 0);

  // Perimeter stadium rig lights
  for (let i = 0; i < 10; i++) {
    const a  = (i / 10) * Math.PI * 2;
    const pl = new THREE.PointLight(0xfff0f8, 2.5, 34);
    pl.position.set(Math.cos(a) * 16, 10, Math.sin(a) * 16);
    g.add(pl);
  }

  // Dramatic key spot
  const key = new THREE.SpotLight(0xfff0f8, 36, 42, Math.PI / 5.5, 0.15, 1.1);
  key.position.set(-6, 16, 7);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(1024);
  key.target.position.set(0, -1.5, 0);
  g.add(key);
  g.add(key.target);

  // Pink and yellow rims
  const pinkRim = new THREE.PointLight(0xff1c72, 5, 24);
  pinkRim.position.set(5, 4, -5);
  g.add(pinkRim);

  const yellRim = new THREE.PointLight(0xf5a800, 3, 18);
  yellRim.position.set(-5, 2, 4);
  g.add(yellRim);

  g.add(new THREE.AmbientLight(0x040404, 1.2));

  // Main shoe — larger scale, slightly angled
  const shoe = buildShoe({ plateGlow: 0.5 });
  shoe.scale.setScalar(1.32);
  shoe.position.set(0, -1.45, 0);
  shoe.rotation.y = -Math.PI / 5; // show swoosh side to camera
  shoe.userData.finaleShoe = true;
  g.add(shoe);

  // Floor halo — pink
  mkMesh(g, new THREE.CircleGeometry(3.6, 64),
    new THREE.MeshBasicMaterial({ color: 0xff1c72, transparent: true, opacity: 0.07 }),
    0, -2.79, 0, -Math.PI / 2, 0, 0);

  // Confetti — pink + yellow palette (shoe's colors)
  const cfCount = 500;
  const cfGeo   = new THREE.BufferGeometry();
  const cfPos   = new Float32Array(cfCount * 3);
  const cfCol   = new Float32Array(cfCount * 3);
  const cfPal   = [
    new THREE.Color(0xff1c72),  // hyper pink
    new THREE.Color(0xf5a800),  // amber yellow
    new THREE.Color(0xffffff),  // white
    new THREE.Color(0xff66aa),  // light pink
    new THREE.Color(0xffdd44),  // bright yellow
  ];
  for (let i = 0; i < cfCount; i++) {
    cfPos[i*3]   = (Math.random() - 0.5) * 26;
    cfPos[i*3+1] = Math.random() * 22;
    cfPos[i*3+2] = (Math.random() - 0.5) * 26;
    const c = cfPal[i % cfPal.length];
    cfCol[i*3] = c.r; cfCol[i*3+1] = c.g; cfCol[i*3+2] = c.b;
  }
  cfGeo.setAttribute('position', new THREE.BufferAttribute(cfPos, 3));
  cfGeo.setAttribute('color',    new THREE.BufferAttribute(cfCol, 3));
  const confetti = new THREE.Points(cfGeo, new THREE.PointsMaterial({
    size: 0.11, vertexColors: true, transparent: true, opacity: 0.92, sizeAttenuation: true,
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

// Background color per room — themed to shoe palette
const BG = [
  new THREE.Color(0x000000),   // Room 0: black
  new THREE.Color(0x0e0700),   // Room 1: warm dark (yellow midsole)
  new THREE.Color(0x050512),   // Room 2: deep blue (carbon)
  new THREE.Color(0x0e0008),   // Room 3: dark pink (flyknit)
  new THREE.Color(0x020202),   // Room 4: near-black stadium
];

const textEls = [0,1,2,3,4].map(i => document.getElementById(`text-${i}`));
const dots    = [...document.querySelectorAll('.dot')];
const ctaBtn  = document.getElementById('cta-btn');
let activeRoom = 0;
const bgColor  = new THREE.Color(0x000000);

// Mouse parallax — spring-lerped camera offset
const mouse = { x: 0, y: 0 };
const camOffset = { x: 0, y: 0 };
window.addEventListener('mousemove', e => {
  mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
  mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
});

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
      bgColor.lerp(BG[i], Math.sin(local * Math.PI) * 0.45);
    }
  }
  renderer.setClearColor(bgColor);
  scene.fog.color.copy(bgColor);

  // CSS class-based text state — Emil Kowalski approach
  // Transitions are defined in CSS with custom easing; JS only sets classes
  for (let i = 0; i < ZONES.length; i++) {
    const z     = ZONES[i];
    const el    = textEls[i];
    const inZone = t >= z.start && t <= z.end;
    const local  = inZone ? (t - z.start) / (z.end - z.start) : -1;
    const peak   = inZone && local >= 0.15 && local <= 0.85;

    if (peak) {
      if (!el.classList.contains('is-visible')) {
        el.classList.remove('is-exiting');
        el.classList.add('is-visible');
      }
    } else if (inZone && local > 0.85) {
      if (!el.classList.contains('is-exiting')) {
        el.classList.remove('is-visible');
        el.classList.add('is-exiting');
      }
    } else {
      el.classList.remove('is-visible', 'is-exiting');
    }
  }

  // CTA button — enters at 87% scroll
  const ctaVisible = t > 0.87;
  if (ctaVisible) {
    ctaBtn.classList.add('is-visible');
  } else {
    ctaBtn.classList.remove('is-visible');
  }

  // Progress dots
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

  // Mouse parallax — spring lerp toward cursor, 6% stiffness per frame
  const lerpK = 1 - Math.pow(0.06, dt);
  camOffset.x += (mouse.x * 0.22 - camOffset.x) * lerpK;
  camOffset.y += (-mouse.y * 0.12 - camOffset.y) * lerpK;
  camera.position.x += camOffset.x;
  camera.position.y += camOffset.y;

  // Room 0 — slowly spin shoe, pulse rings
  const r0shoe = rooms[0].children.find(c => c.userData.spinMe);
  if (r0shoe) r0shoe.rotation.y -= dt * 0.28; // spin to show all angles
  if (rooms[0].userData.rings) {
    rooms[0].userData.rings.forEach((r, i) => {
      r.material.opacity = (i === 2 ? 0.12 : 0.22) + Math.sin(time * 1.4 + i * 1.1) * 0.14;
    });
  }

  // Room 1 — float foam cells, expand wave rings
  if (rooms[1].userData.foamPieces) {
    rooms[1].userData.foamPieces.forEach(fp => {
      fp.position.y = fp.userData.baseY + Math.sin(fp.userData.offset + time * fp.userData.speed) * 0.20;
    });
  }
  if (rooms[1].userData.waveRings) {
    rooms[1].userData.waveRings.forEach(ring => {
      const phase = (time * 0.72 + ring.userData.waveOffset) % 1;
      const s     = 0.3 + phase * 3.2;
      ring.scale.set(s, s, s);
      ring.material.opacity = (1 - phase) * 0.85;
    });
  }

  // Room 2 — breathe carbon plate, animate arrows
  if (rooms[2].userData.ePlate) {
    rooms[2].userData.ePlate.material.emissiveIntensity = 1.4 + Math.sin(time * 2.0) * 0.55;
  }
  if (rooms[2].userData.propArrows) {
    rooms[2].userData.propArrows.forEach((arrow, i) => {
      arrow.material.opacity = 0.35 + Math.sin(time * 2.4 - i * 0.45) * 0.32;
    });
  }
  rooms[2].children.forEach(c => {
    if (!c.userData.plateParticles) return;
    const pos = c.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i) + 0.024;
      if (x > 4.5) x -= 9;
      pos.setX(i, x);
    }
    pos.needsUpdate = true;
  });

  // Room 3 — airflow, sway yarns, pulse knit
  rooms[3].children.forEach(c => {
    if (!c.userData.isAirflow) return;
    const pos   = c.geometry.attributes.position;
    const phase = c.userData.airPhase;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i) + 0.018 + Math.sin(phase[i] + time) * 0.002;
      if (x > 1.2) x -= 2.4;
      pos.setX(i, x);
    }
    pos.needsUpdate = true;
  });
  if (rooms[3].userData.yarns) {
    rooms[3].userData.yarns.forEach(y => {
      y.position.y = y.userData.baseY + Math.sin(y.userData.yarnOff + time * y.userData.yarnSpd) * 0.16;
      y.rotation.z += dt * 0.030;
    });
  }
  if (rooms[3].userData.knitPlane) {
    rooms[3].userData.knitPlane.material.opacity = 0.52 + Math.sin(time * 1.1) * 0.15;
  }

  // Room 4 — confetti + rotate finale shoe
  rooms[4].children.forEach(c => {
    if (c.userData.isConfetti) {
      const pos = c.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - 0.030;
        if (y < -3) y = 18 + Math.random() * 4;
        pos.setY(i, y);
        pos.setX(i, pos.getX(i) + Math.sin(time * 0.5 + i * 0.07) * 0.003);
      }
      pos.needsUpdate = true;
    }
    if (c.userData.finaleShoe) c.rotation.y += dt * 0.14;
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
    p = Math.min(p + Math.random() * 13 + 3, 100);
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
