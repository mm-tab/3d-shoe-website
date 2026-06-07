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
scene.fog   = new THREE.FogExp2(0x000000, 0.010);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 600);
camera.position.set(1.5, 1.0, 4);

/* ═══════════════════════════════════════
   POST-PROCESSING
═══════════════════════════════════════ */
const composer   = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
const bloomPass = new UnrealBloomPass(
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
   CAMERA PATH
   Each room has a deliberate camera angle facing a specific shoe feature.

   Room 0  (z= 0)   — 3/4 hero view, full shoe
   Room 1  (z=-70)  — above, looking DOWN at upturned sole (ZoomX foam)
   Room 2  (z=-140) — right side, looking at midsole profile (carbon plate)
   Room 3  (z=-210) — front-above, looking at upper knit texture (Flyknit)
   Room 4  (z=-285) — pulled-back, dramatic low angle (Finale reveal)
═══════════════════════════════════════ */
const camPath = new THREE.CatmullRomCurve3([
  new THREE.Vector3( 1.5,  1.0,   4.0),  // 0  Room 0 — 3/4 hero
  new THREE.Vector3( 0.6,  0.6,   0.5),  // 1  push in
  new THREE.Vector3( 0.0,  0.4,  -8.0),  // 2  past shoe
  new THREE.Vector3( 0.0,  1.0,  -28.0), // 3  rising toward sole view
  new THREE.Vector3( 0.0,  2.0,  -48.0), // 4  climbing
  new THREE.Vector3( 0.0,  2.8,  -62.0), // 5  Room 1 — above sole
  new THREE.Vector3( 1.0,  2.0,  -82.0), // 6  leaving, sweep right
  new THREE.Vector3( 2.8,  0.8, -110.0), // 7  arcing rightward
  new THREE.Vector3( 4.2,  0.2, -130.0), // 8  approaching side
  new THREE.Vector3( 4.8, -0.1, -140.0), // 9  Room 2 — side/plate view
  new THREE.Vector3( 3.5,  0.8, -158.0), // 10 leaving room 2
  new THREE.Vector3( 1.2,  1.2, -180.0), // 11 arcing back left
  new THREE.Vector3( 0.0,  1.6, -203.0), // 12 Room 3 — upper front view
  new THREE.Vector3( 0.5,  2.0, -225.0), // 13 pulling back
  new THREE.Vector3( 1.5,  2.6, -254.0), // 14 rising for finale
  new THREE.Vector3( 2.0,  2.5, -272.0), // 15 Room 4 — finale
], false, 'catmullrom', 0.5);

const lookPath = new THREE.CatmullRomCurve3([
  new THREE.Vector3( 0.0,  0.0,   0.0),  // 0  Room 0 — shoe center
  new THREE.Vector3( 0.0, -0.1,  -5.0),  // 1
  new THREE.Vector3( 0.0, -0.1, -15.0),  // 2
  new THREE.Vector3( 0.0,  0.4, -42.0),  // 3  angling toward sole
  new THREE.Vector3( 0.0,  0.4, -62.0),  // 4
  new THREE.Vector3( 0.0,  0.3, -70.0),  // 5  Room 1 — sole surface
  new THREE.Vector3( 0.0,  0.0, -82.0),  // 6
  new THREE.Vector3( 0.0, -0.2, -118.0), // 7
  new THREE.Vector3( 0.0, -0.2, -138.0), // 8
  new THREE.Vector3( 0.0, -0.2, -140.0), // 9  Room 2 — plate zone
  new THREE.Vector3( 0.0,  0.1, -155.0), // 10
  new THREE.Vector3( 0.0,  0.4, -196.0), // 11
  new THREE.Vector3( 0.0,  0.2, -210.0), // 12 Room 3 — upper
  new THREE.Vector3( 0.0,  0.5, -235.0), // 13
  new THREE.Vector3( 0.0, -0.5, -272.0), // 14
  new THREE.Vector3( 0.0, -1.5, -285.0), // 15 Room 4 — full shoe
], false, 'catmullrom', 0.5);

/* ═══════════════════════════════════════
   TEXTURES
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
  ctx.strokeStyle = 'rgba(80, 200, 255, 0.55)';
  ctx.lineWidth = 1.8;
  const s = 24;
  const h = s * Math.sqrt(3);
  for (let row = -1; row < 24; row++) {
    for (let col = -1; col < 24; col++) {
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
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(60, 80, 200, 0.3)';
  ctx.lineWidth = 1;
  // Diagonal weave pattern
  for (let i = -256; i < 512; i += 12) {
    ctx.beginPath(); ctx.moveTo(i, 0);      ctx.lineTo(i + 256, 256); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i, 0);      ctx.lineTo(i - 256, 256); ctx.stroke();
  }
  return new THREE.CanvasTexture(c);
}

/* ═══════════════════════════════════════
   SHOE BUILDER
   The shoe is assembled from geometric primitives.
   bodyColor     — upper/heel
   soleColor     — midsole foam (bright white in most rooms)
   accentColor   — heel cap, collar, swoosh emissive
   plateGlow     — carbon fiber plate glow intensity
═══════════════════════════════════════ */
function buildShoe({
  bodyColor   = 0x111111,
  soleColor   = 0xf0f0f0,
  accentColor = 0xff5a00,
  swooshColor = '#ffffff',
  plateGlow   = 0.4,
} = {}) {
  const root = new THREE.Group();

  const mBody   = new THREE.MeshStandardMaterial({ color: bodyColor,   roughness: 0.68, metalness: 0.08 });
  const mFoam   = new THREE.MeshStandardMaterial({ color: soleColor,   roughness: 0.80, metalness: 0.00 });
  const mOut    = new THREE.MeshStandardMaterial({ color: 0x181818,    roughness: 0.65, metalness: 0.05 });
  const mCarbon = new THREE.MeshStandardMaterial({
    map: makeCarbonTex(), color: 0x111128, roughness: 0.12, metalness: 0.95,
    emissive: new THREE.Color(0x2233ff), emissiveIntensity: plateGlow,
  });
  const mAccent = new THREE.MeshStandardMaterial({
    color: accentColor, roughness: 0.28, metalness: 0.22,
    emissive: new THREE.Color(accentColor), emissiveIntensity: 0.22,
  });
  const mSwoosh = new THREE.MeshStandardMaterial({
    map: makeSwooshTex(swooshColor), transparent: true, roughness: 0.30, metalness: 0.05, depthWrite: false,
  });

  // ── Sole stack ──────────────────────────
  // Outsole (rubber, bottom)
  mesh(root, new THREE.BoxGeometry(1.02, 0.09, 3.30), mOut,    [0, -0.61,  0.10]);
  // ZoomX midsole (main foam block)
  mesh(root, new THREE.BoxGeometry(0.96, 0.26, 3.10), mFoam,   [0, -0.38,  0.10]);
  // Heel rise (extra foam at heel)
  mesh(root, new THREE.BoxGeometry(0.96, 0.14, 0.92), mFoam,   [0, -0.23, -1.26]);
  // Carbon fiber plate (sits between foam layers)
  const plateGeo = new THREE.BoxGeometry(0.86, 0.042, 2.82);
  const plateMesh = mesh(root, plateGeo, mCarbon, [0, -0.22, 0.04]);
  root.userData.plateMesh = plateMesh;

  // ── Upper body ──────────────────────────
  // Main upper (tapered box)
  const upperGeo = new THREE.BoxGeometry(0.88, 0.80, 2.72);
  taperBox(upperGeo, 0.70, 0.88, 0.62, 0.80);
  const upper = new THREE.Mesh(upperGeo, mBody);
  upper.position.set(0, 0.22, -0.05);
  upper.castShadow = upper.receiveShadow = true;
  root.add(upper);

  // Toe box (rounded front)
  const toeMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.44, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.56),
    mBody
  );
  toeMesh.scale.set(1, 0.74, 0.80);
  toeMesh.position.set(0, 0.05, 1.42);
  toeMesh.castShadow = true;
  root.add(toeMesh);

  // Heel counter (half cylinder)
  const heelM = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.49, 0.80, 18, 1, false, 0, Math.PI),
    mBody
  );
  heelM.rotation.y = Math.PI;
  heelM.position.set(0, 0.12, -1.50);
  heelM.castShadow = true;
  root.add(heelM);

  // Heel accent cap
  mesh(root, new THREE.CylinderGeometry(0.43, 0.46, 0.24, 18, 1, false, 0, Math.PI), mAccent, [0, -0.20, -1.50], [0, Math.PI, 0]);

  // Tongue
  mesh(root, new THREE.BoxGeometry(0.48, 0.55, 0.07),
    new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.88 }), [0, 0.44, 0.68]);

  // Ankle collar
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.36, 0.034, 8, 28, Math.PI),
    mAccent
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 0.60, -1.00);
  root.add(collar);

  // Laces
  const laceMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.88 });
  for (let i = 0; i < 5; i++) {
    mesh(root, new THREE.BoxGeometry(0.52, 0.030, 0.034), laceMat, [0, 0.56, 0.28 + i * 0.22]);
  }

  // Swoosh (right side)
  const swooshGeo = new THREE.PlaneGeometry(1.58, 0.80);
  const sR = new THREE.Mesh(swooshGeo, mSwoosh);
  sR.rotation.y = -Math.PI / 2;
  sR.position.set(0.454, 0.18, -0.04);
  root.add(sR);

  // Swoosh (left, mirrored)
  const sL = new THREE.Mesh(swooshGeo, mSwoosh.clone());
  sL.material.map = makeSwooshTex(swooshColor);
  sL.rotation.y  = Math.PI / 2;
  sL.scale.x     = -1;
  sL.position.set(-0.454, 0.18, -0.04);
  root.add(sL);

  root.scale.setScalar(0.74);
  return root;
}

function mesh(parent, geo, mat, pos = [0,0,0], rot = [0,0,0]) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos); m.rotation.set(...rot);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}

function taperBox(geo, frontW, backW, frontH, backH) {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const t  = (pos.getZ(i) + geo.parameters.depth / 2) / geo.parameters.depth;
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
   Focus: full shoe beauty shot
═══════════════════════════════════════ */
function makeRoom0() {
  const g = new THREE.Group();
  g.position.set(0, 0, 0);

  // Reflective floor
  mesh(g, new THREE.CircleGeometry(14, 64),
    new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.18, metalness: 0.92 }),
    [0, -1.05, 0], [-Math.PI / 2, 0, 0]);

  // Pedestal
  mesh(g, new THREE.CylinderGeometry(0.88, 1.08, 0.22, 40),
    new THREE.MeshStandardMaterial({ color: 0x0e0e0e, roughness: 0.22, metalness: 0.88 }),
    [0, -0.93, 0]);
  mesh(g, new THREE.CylinderGeometry(1.18, 1.38, 0.07, 40),
    new THREE.MeshStandardMaterial({ color: 0x060606, roughness: 0.12, metalness: 0.96 }),
    [0, -1.07, 0]);

  // Shoe — standard 3/4 orientation
  const shoe = buildShoe({ bodyColor: 0x080808, soleColor: 0xe8e8e8, accentColor: 0xff5a00 });
  shoe.position.set(0, -0.66, 0);
  shoe.rotation.y = Math.PI / 5;
  shoe.userData.spinMe = true;
  g.add(shoe);

  // Orange glow rings on floor
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

  // Lights
  const spot = new THREE.SpotLight(0xfff8f0, 44, 24, Math.PI / 7.5, 0.26, 1.8);
  spot.position.set(0, 10, 1.5); spot.castShadow = true;
  spot.shadow.mapSize.setScalar(1024);
  spot.target.position.set(0, 0, 0);
  g.add(spot, spot.target);
  g.add(new THREE.PointLight(0xff5a00, 3.5, 9)).position.set(-3, 0.5, -2);
  g.add(new THREE.AmbientLight(0x040404, 1));

  return g;
}

/* ═══════════════════════════════════════
   ROOM 1 — ZOOMX FOAM SOLE
   Camera: HIGH ABOVE looking down at upturned sole
   Focus: midsole foam face-on, foam cell details
═══════════════════════════════════════ */
function makeRoom1() {
  const g = new THREE.Group();
  g.position.set(0, 0, -70);

  // Shoe flipped upside-down — sole faces UP toward camera
  const shoe = buildShoe({
    bodyColor: 0x0a0a0a, soleColor: 0xfafafa,
    accentColor: 0x00ddff, swooshColor: '#00ddff',
    plateGlow: 0.5,
  });
  shoe.position.set(0, 0.3, 0);
  shoe.rotation.set(Math.PI, Math.PI / 6, 0); // flipped, slight y-angle
  shoe.userData.cushShoe = true;
  g.add(shoe);

  // Floating foam cell clusters — scattered around the sole zone
  // (camera is above, so these appear around/below the upturned shoe)
  const foamColors = [0xfafafa, 0xeef8ff, 0xddffff, 0xbbeeee];
  const foamPieces = [];
  for (let i = 0; i < 18; i++) {
    const s = 0.06 + Math.random() * 0.12;
    const foam = new THREE.Mesh(
      new THREE.SphereGeometry(s, 8, 6),
      new THREE.MeshStandardMaterial({
        color: foamColors[i % foamColors.length],
        roughness: 0.85, emissive: 0x004466, emissiveIntensity: 0.25,
        transparent: true, opacity: 0.85,
      })
    );
    // Spread them near the sole (y≈1 since shoe is flipped)
    const angle = (i / 18) * Math.PI * 2;
    const r     = 0.5 + Math.random() * 1.0;
    foam.position.set(Math.cos(angle) * r, 0.8 + Math.random() * 0.6, Math.sin(angle) * r);
    foam.userData.baseY  = foam.position.y;
    foam.userData.speed  = Math.random() * 0.5 + 0.2;
    foam.userData.offset = Math.random() * Math.PI * 2;
    foamPieces.push(foam);
    g.add(foam);
  }
  g.userData.foamPieces = foamPieces;

  // Compression wave rings — pulse outward from sole (Y-up plane)
  const waveRings = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.1, 0.012, 6, 48),
      new THREE.MeshBasicMaterial({ color: 0x00ccff, transparent: true, opacity: 0.8 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 1.1, 0);
    ring.userData.waveOffset = i * 0.7;
    waveRings.push(ring);
    g.add(ring);
  }
  g.userData.waveRings = waveRings;

  // Sole-anatomy annotation lines (thin glowing rods pointing to sole layers)
  // Outsole marker (bottom-most layer, now at top since flipped)
  const lineMat = new THREE.MeshBasicMaterial({ color: 0x00aaff, transparent: true, opacity: 0.6 });
  const annot1 = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.7, 4), lineMat);
  annot1.position.set(0.7, 1.6, 0);
  g.add(annot1);
  const annot2 = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.4, 4), lineMat);
  annot2.position.set(-0.8, 1.4, 0.3);
  g.add(annot2);

  // Dot tips
  const dotGeo = new THREE.SphereGeometry(0.025, 6, 6);
  const dot1 = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: 0x00eeff }));
  dot1.position.set(0.7, 2.0, 0); g.add(dot1);
  const dot2 = new THREE.Mesh(dotGeo.clone(), new THREE.MeshBasicMaterial({ color: 0x00eeff }));
  dot2.position.set(-0.8, 1.65, 0.3); g.add(dot2);

  // Blue ambient particles
  g.add(makeParticles(250, 0x00aaff, 5, 0.030));

  // Floor (visible below, since camera is above)
  mesh(g, new THREE.CircleGeometry(12, 48),
    new THREE.MeshStandardMaterial({ color: 0x00040a, roughness: 0.9 }),
    [0, -1.5, 0], [-Math.PI / 2, 0, 0]);

  // Lights — blue tones, from above-ish (camera is above)
  g.add(new THREE.AmbientLight(0x000a14, 2.5));
  const bl = new THREE.PointLight(0x00aaff, 10, 20);
  bl.position.set(0, 5, 0); g.add(bl);
  const bl2 = new THREE.PointLight(0x0066cc, 5, 14);
  bl2.position.set(-3, 2, 2); g.add(bl2);
  const topRim = new THREE.DirectionalLight(0xaaddff, 1.5);
  topRim.position.set(0, 8, 0); g.add(topRim);

  return g;
}

/* ═══════════════════════════════════════
   ROOM 2 — CARBON FIBER PLATE
   Camera: from the RIGHT side, looking at shoe profile
   Focus: midsole cross-section, glowing carbon plate layer
═══════════════════════════════════════ */
function makeRoom2() {
  const g = new THREE.Group();
  g.position.set(0, 0, -140);

  // Shoe — standard orientation, camera sees right side profile
  // rotation.y ≈ 0 means toe points +z, right side (+x) faces camera at +x
  const shoe = buildShoe({
    bodyColor: 0x0a0a0a, soleColor: 0xf2f2f2,
    accentColor: 0x3355ff, swooshColor: '#ffffff',
    plateGlow: 1.2,  // carbon plate glows brightly in this room
  });
  shoe.position.set(0, -0.3, 0);
  shoe.rotation.y = 0.08; // barely-rotated so camera sees right side + swoosh
  shoe.userData.carbonShoe = true;
  g.add(shoe);

  // ── EXPLODED SOLE DIAGRAM (to the left, x=-2.2) ──────────────
  // Shown as separated layers so user can see the stack clearly

  // Labels: outsole / carbon / foam
  const stackX = -2.4;

  // Outsole layer
  const eOut = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.09, 2.4),
    new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.6, metalness: 0.1 })
  );
  eOut.position.set(stackX, -0.75, 0);
  eOut.userData.stackLayer = true;
  eOut.userData.baseY = -0.75;
  g.add(eOut);

  // Carbon plate (glowing)
  const ePlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.042, 2.2),
    new THREE.MeshStandardMaterial({
      map: makeCarbonTex(), color: 0x111133, roughness: 0.10, metalness: 0.95,
      emissive: new THREE.Color(0x2244ff), emissiveIntensity: 1.6,
    })
  );
  ePlate.position.set(stackX, -0.26, 0);
  ePlate.userData.stackLayer = true;
  ePlate.userData.baseY = -0.26;
  g.add(ePlate);
  g.userData.ePlate = ePlate;

  // ZoomX foam layer
  const eFoam = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.28, 2.4),
    new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.80, metalness: 0.0,
      emissive: 0x004488, emissiveIntensity: 0.1 })
  );
  eFoam.position.set(stackX, 0.22, 0);
  eFoam.userData.stackLayer = true;
  eFoam.userData.baseY = 0.22;
  g.add(eFoam);

  // Thin connector line between stack and shoe
  const connGeo = new THREE.BufferGeometry();
  connGeo.setAttribute('position', new THREE.BufferAttribute(
    new Float32Array([-1.88, -0.28, 0, -0.40, -0.28, 0]), 3
  ));
  g.add(new THREE.Line(connGeo, new THREE.LineBasicMaterial({ color: 0x2244ff, transparent: true, opacity: 0.4 })));

  // Propulsion arrows (carbon plate forward drive)
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0x4466ff, transparent: true, opacity: 0.7 });
  for (let i = 0; i < 5; i++) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.22, 6), arrowMat);
    cone.rotation.z = -Math.PI / 2; // point in +x
    cone.position.set(1.0 + i * 0.3, -0.26, -0.8 + i * 0.3);
    cone.userData.propArrow = i;
    g.add(cone);
  }
  g.userData.propArrows = g.children.filter(c => c.userData.propArrow !== undefined);

  // Speed particles radiating from carbon plate zone
  const pGeo = new THREE.BufferGeometry();
  const pCount = 180;
  const pPos = new Float32Array(pCount * 3);
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

  // Lights — blue/white from the side
  g.add(new THREE.AmbientLight(0x050510, 2));
  const sideKey = new THREE.SpotLight(0xffffff, 20, 25, Math.PI / 6, 0.3, 1.5);
  sideKey.position.set(6, 4, 0);
  sideKey.target.position.set(0, -0.3, 0);
  sideKey.castShadow = true;
  g.add(sideKey, sideKey.target);
  g.add(new THREE.PointLight(0x2233ff, 6, 16)).position.set(-3, 0, 0);
  g.add(new THREE.PointLight(0x4466ff, 3, 10)).position.set(0, -2, 2);

  return g;
}

/* ═══════════════════════════════════════
   ROOM 3 — FLYKNIT UPPER
   Camera: front-above, looking at upper knit face
   Focus: upper mesh texture, breathable structure
═══════════════════════════════════════ */
function makeRoom3() {
  const g = new THREE.Group();
  g.position.set(0, 0, -210);

  // Shoe — slight angle so camera sees upper from front
  const shoe = buildShoe({
    bodyColor: 0x0e1a28, soleColor: 0xf0f0f0,
    accentColor: 0x55aaff, swooshColor: '#55aaff',
    plateGlow: 0.3,
  });
  shoe.position.set(0, -0.3, 0);
  shoe.rotation.set(-0.08, 0.35, 0); // tilt slightly to show upper
  shoe.userData.breathShoe = true;
  g.add(shoe);

  // Flyknit mesh overlay — hex grid plane positioned over the upper
  const knitPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.85),
    new THREE.MeshBasicMaterial({
      map: makeKnitTex(), transparent: true, opacity: 0.65,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  knitPlane.position.set(0.08, 0.28, 0.82); // sits on upper surface
  knitPlane.rotation.set(-0.08, 0.35, 0);   // match shoe angle
  g.add(knitPlane);
  g.userData.knitPlane = knitPlane;

  // Second knit overlay (sides)
  const knitSide = new THREE.Mesh(
    new THREE.PlaneGeometry(0.85, 0.65),
    new THREE.MeshBasicMaterial({
      map: makeKnitTex(), transparent: true, opacity: 0.4,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  knitSide.rotation.y = -Math.PI / 2;
  knitSide.position.set(0.42, 0.22, 0.0);
  g.add(knitSide);

  // Airflow particles — stream LEFT to RIGHT through the upper
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
  airPts.userData.airPhase   = airPhase;
  airPts.userData.isAirflow  = true;
  g.add(airPts);

  // Floating yarn threads
  for (let i = 0; i < 22; i++) {
    const len  = 0.8 + Math.random() * 1.6;
    const yarn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.003, len, 4),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.57 + Math.random() * 0.08, 0.8, 0.6 + Math.random() * 0.25),
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
    g.add(yarn);
  }
  g.userData.yarns = g.children.filter(c => c.userData.yarnOff !== undefined);

  // Background grid (airy, open)
  const grid = new THREE.GridHelper(20, 22, 0x112233, 0x0a1a28);
  grid.position.y = -1.8;
  g.add(grid);

  // Lights — sky-blue, soft
  g.add(new THREE.AmbientLight(0x050e18, 3));
  const skyDir = new THREE.DirectionalLight(0x88ccff, 2.5);
  skyDir.position.set(0, 8, 4); g.add(skyDir);
  g.add(new THREE.PointLight(0x44aaff, 5, 12)).position.set(2.5, 2, 2);
  g.add(new THREE.PointLight(0x0044aa, 2.5, 8)).position.set(-2.5, -0.5, 1);

  return g;
}

/* ═══════════════════════════════════════
   ROOM 4 — FINALE REVEAL
   Camera: low dramatic angle, full shoe
   Full reveal, confetti, stadium
═══════════════════════════════════════ */
function makeRoom4() {
  const g = new THREE.Group();
  g.position.set(0, 0, -285);

  // Stadium floor
  const floor = mesh(g, new THREE.CircleGeometry(32, 64),
    new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.82, metalness: 0.28 }),
    [0, -2.8, 0], [-Math.PI / 2, 0, 0]);
  floor.receiveShadow = true;

  // Perimeter stadium lights
  for (let i = 0; i < 10; i++) {
    const a  = (i / 10) * Math.PI * 2;
    const pl = new THREE.PointLight(0xfff5e0, 2.5, 30);
    pl.position.set(Math.cos(a) * 15, 10, Math.sin(a) * 15);
    g.add(pl);
  }

  // Dramatic key spotlight (angled from above-left)
  const key = new THREE.SpotLight(0xfff8ec, 32, 38, Math.PI / 5.5, 0.16, 1.1);
  key.position.set(-5, 15, 6);
  key.castShadow = true; key.shadow.mapSize.setScalar(1024);
  key.target.position.set(0, -1.5, 0);
  g.add(key, key.target);

  // Blue rim fill
  g.add(new THREE.PointLight(0x2244ff, 4.5, 24)).position.set(5, 3, -5);
  g.add(new THREE.AmbientLight(0x040404, 1.2));

  // Main shoe — larger, classic orientation
  const shoe = buildShoe({
    bodyColor: 0x070707, soleColor: 0xf5f5f5,
    accentColor: 0xff5a00, swooshColor: '#ffffff',
    plateGlow: 0.5,
  });
  shoe.scale.setScalar(1.30);
  shoe.position.set(0, -1.55, 0);
  shoe.rotation.y = Math.PI / 7;
  shoe.userData.finaleShoe = true;
  g.add(shoe);

  // Floor halo glow
  mesh(g, new THREE.CircleGeometry(3.5, 64),
    new THREE.MeshBasicMaterial({ color: 0xff5a00, transparent: true, opacity: 0.06 }),
    [0, -2.79, 0], [-Math.PI / 2, 0, 0]);

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
scene.add(new THREE.AmbientLight(0x000000, 0.25));

/* ═══════════════════════════════════════
   SCROLL TRIGGER
═══════════════════════════════════════ */
const { gsap, ScrollTrigger } = window;
gsap.registerPlugin(ScrollTrigger);

const ZONES = [
  { start: 0.00, end: 0.17 }, // Room 0
  { start: 0.14, end: 0.36 }, // Room 1
  { start: 0.33, end: 0.58 }, // Room 2
  { start: 0.55, end: 0.78 }, // Room 3
  { start: 0.75, end: 1.00 }, // Room 4
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

  // ── Room 0: spin shoe, pulse rings ──
  const r0shoe = rooms[0].children.find(c => c.userData.spinMe);
  if (r0shoe) r0shoe.rotation.y += dt * 0.36;
  if (rooms[0].userData.rings) {
    rooms[0].userData.rings.forEach((r, i) => {
      r.material.opacity = 0.18 + Math.sin(time * 1.4 + i * 1.1) * 0.15;
    });
  }

  // ── Room 1: float foam cells, pulse wave rings ──
  if (rooms[1].userData.foamPieces) {
    rooms[1].userData.foamPieces.forEach(fp => {
      fp.position.y = fp.userData.baseY + Math.sin(fp.userData.offset + time * fp.userData.speed) * 0.18;
    });
  }
  if (rooms[1].userData.waveRings) {
    rooms[1].userData.waveRings.forEach(ring => {
      const phase = (time * 0.8 + ring.userData.waveOffset) % 1;
      const scale = 0.3 + phase * 2.8;
      ring.scale.set(scale, scale, scale);
      ring.material.opacity = (1 - phase) * 0.75;
    });
  }

  // ── Room 2: pulse carbon plate glow, animate propulsion arrows ──
  if (rooms[2].userData.ePlate) {
    rooms[2].userData.ePlate.material.emissiveIntensity = 1.2 + Math.sin(time * 2.2) * 0.5;
  }
  if (rooms[2].userData.propArrows) {
    rooms[2].userData.propArrows.forEach((arrow, i) => {
      arrow.material.opacity = 0.4 + Math.sin(time * 2.5 - i * 0.4) * 0.3;
    });
  }
  // Plate particles — drift in +x
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

  // ── Room 3: airflow, sway yarns, pulse knit ──
  rooms[3].children.forEach(c => {
    if (c.userData.isAirflow) {
      const pos   = c.geometry.attributes.position;
      const phase = c.userData.airPhase;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i) + 0.016 + Math.sin(phase[i] + time) * 0.002;
        if (x > 1.1) x -= 2.2;
        pos.setX(i, x);
      }
      pos.needsUpdate = true;
    }
  });
  if (rooms[3].userData.yarns) {
    rooms[3].userData.yarns.forEach(y => {
      y.position.y = y.userData.baseY + Math.sin(y.userData.yarnOff + time * y.userData.yarnSpd) * 0.15;
      y.rotation.z += dt * 0.035;
    });
  }
  if (rooms[3].userData.knitPlane) {
    rooms[3].userData.knitPlane.material.opacity = 0.5 + Math.sin(time * 1.2) * 0.15;
  }

  // ── Room 4: confetti fall, rotate finale shoe ──
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
