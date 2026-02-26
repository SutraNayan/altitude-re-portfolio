/* ════════════════════════════════════════════════════════════
   ALTITUDE.re — Main Script
   Full Brain Simulation · Mouse Repulsion · Neuron Cascade
   Spring Physics · Radish/Red+Gold Theme · GSAP Scroll
════════════════════════════════════════════════════════════ */

// Disable browser scroll restoration — always start at top on reload
history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════════
   SCROLL PROGRESS
═══════════════════════════════════════════════════════════ */
const progressBar = document.getElementById('scrollProgress');
window.addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (progressBar) progressBar.style.width = (window.scrollY / max * 100).toFixed(2) + '%';
}, { passive: true });

/* ═══════════════════════════════════════════════════════════
   CUSTOM CURSOR
═══════════════════════════════════════════════════════════ */
(function () {
  const cur = document.getElementById('cursor');
  const fol = document.getElementById('cursorFollower');
  if (!cur || !fol) return;

  let fx = window.innerWidth / 2, fy = window.innerHeight / 2;

  window.addEventListener('mousemove', e => {
    cur.style.left = e.clientX + 'px';
    cur.style.top  = e.clientY + 'px';
    fx += (e.clientX - fx) * 0.13;
    fy += (e.clientY - fy) * 0.13;
    fol.style.left = fx + 'px';
    fol.style.top  = fy + 'px';
    const hit = e.target.closest('a,button,.proj-card,.focus-card,.lang-card,.cert-card,.stack-item');
    cur.classList.toggle('cursor--hover', !!hit);
  });

  (function raf() { requestAnimationFrame(raf); })();
})();

/* ═══════════════════════════════════════════════════════════
   NAV
═══════════════════════════════════════════════════════════ */
(function () {
  const nav  = document.getElementById('nav');
  const ham  = document.getElementById('hamburger');
  const draw = document.getElementById('navDrawer');

  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 50), { passive: true });

  ham.addEventListener('click', () => {
    const open = ham.classList.toggle('open');
    draw.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  document.querySelectorAll('.drawer-link').forEach(a => a.addEventListener('click', () => {
    ham.classList.remove('open');
    draw.classList.remove('open');
    document.body.style.overflow = '';
  }));
})();

/* ═══════════════════════════════════════════════════════════
   TYPEWRITER
═══════════════════════════════════════════════════════════ */
(function () {
  const el = document.getElementById('typed');
  if (!el) return;
  const words = [
    'build AI for real estate.',
    'speak your language.',
    'serve Atlanta differently.',
    'think like a physicist.',
    'fly drones. Close deals.'
  ];
  let wi = 0, ci = 0, deleting = false;

  function type() {
    const word = words[wi];
    if (!deleting) {
      el.textContent = word.slice(0, ++ci);
      if (ci === word.length) { deleting = true; setTimeout(type, 1900); return; }
    } else {
      el.textContent = word.slice(0, --ci);
      if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; setTimeout(type, 380); return; }
    }
    setTimeout(type, deleting ? 48 : 85);
  }
  setTimeout(type, 900);
})();

/* ═══════════════════════════════════════════════════════════
   THREE.JS HERO — FULL BRAIN SIMULATION
   Features:
   · Spring-physics node positions
   · Mouse repulsion in 3D
   · Neuron cascade firing (random → neighbors → neighbors)
   · Glow halos per node
   · Dynamic line brightness
   · Traveling data packets
   · Background starfield
   · Camera drift
═══════════════════════════════════════════════════════════ */
(function initHero() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const W = () => window.innerWidth;
  const H = () => window.innerHeight;

  /* ── Renderer ── */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W(), H());

  /* ── Scene & Camera ── */
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(56, W() / H(), 0.1, 200);
  camera.position.set(0, 0, 12);

  /* ── Lights ── */
  scene.add(new THREE.AmbientLight(0x1a0005, 2));
  const keyLight = new THREE.PointLight(0xff2d55, 5, 35);
  keyLight.position.set(-3, 5, 6);
  scene.add(keyLight);
  const goldLight = new THREE.PointLight(0xffd60a, 2.5, 28);
  goldLight.position.set(5, -3, 4);
  scene.add(goldLight);
  const backLight = new THREE.PointLight(0xff6b6b, 1.5, 20);
  backLight.position.set(0, 2, -8);
  scene.add(backLight);

  /* ── Simulation constants ── */
  const NODE_COUNT = 62;
  const MAX_DIST   = 3.1;   // max connection distance
  const SPRING_K   = 0.022; // spring stiffness
  const DAMPING    = 0.87;  // velocity damping
  const REPEL_R    = 3.8;   // mouse repulsion radius
  const REPEL_F    = 0.09;  // mouse repulsion force
  const HOP_DELAY  = 0.26;  // seconds between cascade hops

  /* ── Node data buffers ── */
  const basePos  = new Float32Array(NODE_COUNT * 3);
  const curPos   = new Float32Array(NODE_COUNT * 3);
  const vel      = new Float32Array(NODE_COUNT * 3);
  const excite   = new Float32Array(NODE_COUNT);    // 0 = calm, 1 = fully fired
  const nodeScl  = new Float32Array(NODE_COUNT);    // per-node base scale

  for (let i = 0; i < NODE_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 3.0 + Math.random() * 4.0;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta) * 0.6;
    const z = r * Math.cos(phi);
    basePos[i*3] = curPos[i*3] = x;
    basePos[i*3+1] = curPos[i*3+1] = y;
    basePos[i*3+2] = curPos[i*3+2] = z;
    nodeScl[i] = 0.7 + Math.random() * 0.6;
  }

  /* ── Build connection graph ── */
  const connPairs = []; // {i, j}
  const nodeConns = Array.from({ length: NODE_COUNT }, () => []);

  for (let i = 0; i < NODE_COUNT; i++) {
    for (let j = i + 1; j < NODE_COUNT; j++) {
      const dx = basePos[i*3] - basePos[j*3];
      const dy = basePos[i*3+1] - basePos[j*3+1];
      const dz = basePos[i*3+2] - basePos[j*3+2];
      if (Math.sqrt(dx*dx + dy*dy + dz*dz) < MAX_DIST) {
        connPairs.push({ i, j });
        nodeConns[i].push(j);
        nodeConns[j].push(i);
      }
    }
  }
  const numConns = connPairs.length;

  /* ── Dummy for matrix ops ── */
  const dummy = new THREE.Object3D();

  /* ── Node spheres (InstancedMesh) ── */
  const nodeMesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.075, 10, 10),
    new THREE.MeshBasicMaterial(),
    NODE_COUNT
  );
  nodeMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const nodeColBuf = new THREE.InstancedBufferAttribute(new Float32Array(NODE_COUNT * 3), 3);
  nodeMesh.instanceColor = nodeColBuf;

  /* ── Glow halos ── */
  const haloMesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.28, 8, 8),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.055,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }),
    NODE_COUNT
  );
  haloMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const haloColBuf = new THREE.InstancedBufferAttribute(new Float32Array(NODE_COUNT * 3), 3);
  haloMesh.instanceColor = haloColBuf;

  /* ── Connection lines (dynamic buffer) ── */
  const linePosBuf = new Float32Array(numConns * 6);
  const lineColBuf = new Float32Array(numConns * 6);
  const lineGeo    = new THREE.BufferGeometry();
  const linePosAttr = new THREE.BufferAttribute(linePosBuf, 3).setUsage(THREE.DynamicDrawUsage);
  const lineColAttr = new THREE.BufferAttribute(lineColBuf, 3).setUsage(THREE.DynamicDrawUsage);
  lineGeo.setAttribute('position', linePosAttr);
  lineGeo.setAttribute('color',    lineColAttr);
  const lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }));

  /* ── Data packets ── */
  const MAX_PKT = 22;
  const packets = [];
  const pktMesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.06, 6, 6),
    new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
    MAX_PKT
  );
  pktMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const pktColBuf = new THREE.InstancedBufferAttribute(new Float32Array(MAX_PKT * 3), 3);
  pktMesh.instanceColor = pktColBuf;

  /* ── Background starfield ── */
  const starCount = 400;
  const starPosArr = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    const r  = 18 + Math.random() * 28;
    starPosArr[i*3]   = r * Math.sin(ph) * Math.cos(th);
    starPosArr[i*3+1] = r * Math.sin(ph) * Math.sin(th);
    starPosArr[i*3+2] = r * Math.cos(ph);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPosArr, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: 0xffe0e0, size: 0.045, transparent: true, opacity: 0.45, sizeAttenuation: true
  }));
  scene.add(stars);

  /* ── Scene group ── */
  const netGroup = new THREE.Group();
  netGroup.add(haloMesh, lines, nodeMesh, pktMesh);
  scene.add(netGroup);

  /* ── Node color helper ── */
  function nodeBaseColor(yVal) {
    // Red (bottom) → Gold (top) gradient
    const t = Math.max(0, Math.min(1, (yVal + 5) / 10));
    return {
      r: 1.0  * t + 1.0  * (1 - t),  // both full red channel
      g: 0.84 * t + 0.17 * (1 - t),  // gold.g → red.g
      b: 0.04 * t + 0.02 * (1 - t)
    };
  }

  /* ── Update all node visuals ── */
  function updateNodes() {
    for (let i = 0; i < NODE_COUNT; i++) {
      const x = curPos[i*3], y = curPos[i*3+1], z = curPos[i*3+2];
      const e  = excite[i];
      const bc = nodeBaseColor(y);

      // Blend toward bright white-gold when excited
      const r = bc.r + (1.0  - bc.r) * e;
      const g = bc.g + (0.98 - bc.g) * e;
      const b = bc.b + (0.85 - bc.b) * e;

      nodeColBuf.setXYZ(i, r, g, b);

      // Node scale pulses when fired
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(nodeScl[i] * (1 + e * 1.6));
      dummy.updateMatrix();
      nodeMesh.setMatrixAt(i, dummy.matrix);

      // Halo expands with excitement
      dummy.scale.setScalar(nodeScl[i] * (1 + e * 5.0));
      dummy.updateMatrix();
      haloMesh.setMatrixAt(i, dummy.matrix);
      haloColBuf.setXYZ(i, r * 0.7, g * 0.5, b * 0.2);
    }
    nodeMesh.instanceMatrix.needsUpdate  = true;
    nodeMesh.instanceColor.needsUpdate   = true;
    haloMesh.instanceMatrix.needsUpdate  = true;
    haloMesh.instanceColor.needsUpdate   = true;
  }

  /* ── Update line positions + colors ── */
  function updateLines() {
    connPairs.forEach(({ i, j }, ci) => {
      const b = ci * 6;
      linePosBuf[b]   = curPos[i*3];   linePosBuf[b+1] = curPos[i*3+1]; linePosBuf[b+2] = curPos[i*3+2];
      linePosBuf[b+3] = curPos[j*3];   linePosBuf[b+4] = curPos[j*3+1]; linePosBuf[b+5] = curPos[j*3+2];

      const exc = (excite[i] + excite[j]) * 0.5;
      const midY = (curPos[i*3+1] + curPos[j*3+1]) * 0.5;
      const tc = nodeBaseColor(midY);
      lineColBuf[b]   = lineColBuf[b+3] = Math.min(1, tc.r + exc * 0.6);
      lineColBuf[b+1] = lineColBuf[b+4] = Math.min(1, tc.g + exc * 0.7);
      lineColBuf[b+2] = lineColBuf[b+5] = Math.min(1, tc.b + exc * 0.5);
    });
    linePosAttr.needsUpdate = true;
    lineColAttr.needsUpdate = true;
  }

  /* ═══════════════════════════
     NEURON CASCADE FIRING
  ═══════════════════════════ */
  const firings = [];
  let lastFireTime = -99;

  function triggerFire(startIdx) {
    const idx = (startIdx !== undefined) ? startIdx : Math.floor(Math.random() * NODE_COUNT);
    excite[idx] = 1.0;
    firings.push({
      visited:      new Set([idx]),
      frontier:     [idx],
      lastHopTime:  clock.getElapsedTime(),
      hopCount:     0,
      maxHops:      8 + Math.floor(Math.random() * 6)
    });
  }

  function processFirings(t) {
    for (let fi = firings.length - 1; fi >= 0; fi--) {
      const f = firings[fi];
      if (t - f.lastHopTime < HOP_DELAY) continue;

      const next = [];
      f.frontier.forEach(idx => {
        nodeConns[idx].forEach(nb => {
          if (!f.visited.has(nb)) {
            f.visited.add(nb);
            excite[nb] = Math.max(excite[nb], 0.88);
            next.push(nb);
          }
        });
      });

      f.frontier     = next;
      f.lastHopTime  = t;
      f.hopCount++;

      if (next.length === 0 || f.hopCount >= f.maxHops) {
        firings.splice(fi, 1);
      }
    }
  }

  /* ═══════════════════════════
     NODE SPRING PHYSICS
  ═══════════════════════════ */
  function physicsStep(mouseX, mouseY) {
    for (let i = 0; i < NODE_COUNT; i++) {
      const ix = i*3, iy = i*3+1, iz = i*3+2;

      // Spring toward base position
      vel[ix] += (basePos[ix] - curPos[ix]) * SPRING_K;
      vel[iy] += (basePos[iy] - curPos[iy]) * SPRING_K;
      vel[iz] += (basePos[iz] - curPos[iz]) * SPRING_K;

      // Mouse repulsion (2D screen → approximate network plane)
      const dx = curPos[ix] - mouseX;
      const dy = curPos[iy] - mouseY;
      const dz = curPos[iz];
      const d2 = dx*dx + dy*dy + dz*dz * 0.25;
      if (d2 < REPEL_R * REPEL_R && d2 > 0.001) {
        const d = Math.sqrt(d2);
        const f = REPEL_F * (1 - d / REPEL_R);
        vel[ix] += (dx / d) * f;
        vel[iy] += (dy / d) * f;
        vel[iz] += (dz / d) * f * 0.3;
      }

      // Damp + integrate
      vel[ix] *= DAMPING; vel[iy] *= DAMPING; vel[iz] *= DAMPING;
      curPos[ix] += vel[ix]; curPos[iy] += vel[iy]; curPos[iz] += vel[iz];
    }
  }

  /* ── Packets ── */
  let lastPktTime = 0;
  function spawnPacket(t) {
    if (packets.length >= MAX_PKT || numConns === 0) return;
    const cp = connPairs[Math.floor(Math.random() * numConns)];
    packets.push({
      from: [curPos[cp.i*3], curPos[cp.i*3+1], curPos[cp.i*3+2]],
      to:   [curPos[cp.j*3], curPos[cp.j*3+1], curPos[cp.j*3+2]],
      t: 0,
      speed: 0.008 + Math.random() * 0.013
    });
    lastPktTime = t;
  }

  function updatePackets() {
    pktMesh.count = packets.length;
    for (let pi = packets.length - 1; pi >= 0; pi--) {
      const p = packets[pi];
      p.t += p.speed;
      if (p.t >= 1) { packets.splice(pi, 1); continue; }

      const lx = p.from[0] + (p.to[0] - p.from[0]) * p.t;
      const ly = p.from[1] + (p.to[1] - p.from[1]) * p.t;
      const lz = p.from[2] + (p.to[2] - p.from[2]) * p.t;
      const s  = 1 + Math.sin(p.t * Math.PI) * 1.8;

      dummy.position.set(lx, ly, lz);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      pktMesh.setMatrixAt(pi, dummy.matrix);

      // Color: red pulse → gold burst at peak
      const arc = Math.sin(p.t * Math.PI);
      pktColBuf.setXYZ(pi, 1, 0.17 + arc * 0.67, arc * 0.1);
    }
    pktMesh.instanceMatrix.needsUpdate = true;
    pktMesh.instanceColor.needsUpdate  = true;
  }

  /* ── Mouse tracking ── */
  let rawMX = 0, rawMY = 0, smoothMX = 0, smoothMY = 0;
  let netMX  = 0, netMY  = 0; // network-space mouse

  window.addEventListener('mousemove', e => {
    rawMX = (e.clientX / W() - 0.5) * 0.5;
    rawMY = (e.clientY / H() - 0.5) * 0.3;
    // Approximate mouse in network plane
    netMX =  (e.clientX / W() - 0.5) * 9;
    netMY = -(e.clientY / H() - 0.5) * 6;
  });

  /* ── Scroll driven scale ── */
  let scrollScale = 1;
  ScrollTrigger.create({
    trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1,
    onUpdate: self => { scrollScale = 1 - self.progress * 0.22; }
  });

  /* ════════════════════════════
     MAIN ANIMATION LOOP
  ════════════════════════════ */
  const clock = new THREE.Clock();

  function tick() {
    requestAnimationFrame(tick);
    const t = clock.getElapsedTime();

    // Auto-trigger neuron fires
    if (t - lastFireTime > 2.4 + Math.random() * 1.8) {
      triggerFire();
      lastFireTime = t;
      // Occasional double-fire for dramatic cascades
      if (Math.random() < 0.4) setTimeout(() => triggerFire(), 700 + Math.random() * 900);
    }

    // Process cascades
    processFirings(t);

    // Decay excitement
    for (let i = 0; i < NODE_COUNT; i++) excite[i] *= 0.952;

    // Smooth mouse for network rotation
    smoothMX += (rawMX - smoothMX) * 0.04;
    smoothMY += (rawMY - smoothMY) * 0.04;

    // Physics (with mouse repulsion)
    physicsStep(netMX, netMY);

    // Update visuals
    updateNodes();
    updateLines();

    // Spawn & animate packets
    if (t - lastPktTime > 0.32) spawnPacket(t);
    updatePackets();

    // Network transform
    netGroup.rotation.y = t * 0.038 + smoothMX;
    netGroup.rotation.x = smoothMY * 0.5;
    netGroup.scale.setScalar(scrollScale);

    // Camera gentle drift (breathes slowly)
    camera.position.x = Math.sin(t * 0.07) * 0.5;
    camera.position.y = Math.cos(t * 0.05) * 0.3;
    camera.lookAt(0, 0, 0);

    // Stars slow counter-rotate
    stars.rotation.y = t * 0.008;
    stars.rotation.x = t * 0.005;

    // Pulsing key light intensity
    keyLight.intensity = 4.5 + Math.sin(t * 0.9) * 0.8;

    renderer.render(scene, camera);
  }

  tick();

  // Hero entrance
  gsap.fromTo('#heroContent',
    { opacity: 0, y: 35 },
    { opacity: 1, y: 0, duration: 1.3, delay: 0.6, ease: 'power3.out' }
  );

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
  });
})();

/* ═══════════════════════════════════════════════════════════
   CONTACT CANVAS — floating orbs
═══════════════════════════════════════════════════════════ */
(function () {
  const canvas = document.getElementById('contactCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  function resize() { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; }
  resize();
  window.addEventListener('resize', resize);

  const orbs = Array.from({ length: 55 }, () => ({
    x: Math.random(), y: Math.random(),
    r: 0.8 + Math.random() * 2.2,
    vx: (Math.random() - .5) * .0004, vy: (Math.random() - .5) * .0004,
    a: Math.random() * Math.PI * 2,
    col: Math.random() > .45 ? '255,45,85' : '255,214,10'
  }));

  (function draw() {
    requestAnimationFrame(draw);
    ctx.clearRect(0, 0, W, H);
    orbs.forEach(o => {
      o.x += o.vx; o.y += o.vy; o.a += .012;
      if (o.x < 0 || o.x > 1) o.vx *= -1;
      if (o.y < 0 || o.y > 1) o.vy *= -1;
      ctx.beginPath();
      ctx.arc(o.x * W, o.y * H, o.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${o.col},${(Math.sin(o.a) * .5 + .5) * .38})`;
      ctx.fill();
    });
  })();
})();

/* ═══════════════════════════════════════════════════════════
   REVEAL — Intersection Observer
═══════════════════════════════════════════════════════════ */
(function () {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); } });
  }, { threshold: 0.08 });
  // Exclude .tl-item and .cert-card — GSAP handles those with explicit fromTo
  document.querySelectorAll('.reveal-up:not(.tl-item):not(.cert-card), .reveal-left, .reveal-right').forEach(el => io.observe(el));
})();

/* ═══════════════════════════════════════════════════════════
   COUNTERS
═══════════════════════════════════════════════════════════ */
(function () {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const el     = e.target;
      const target = +el.dataset.target;
      const suffix = el.dataset.suffix || '';
      gsap.fromTo({ v: 0 }, { v: target }, {
        duration: target > 50 ? 1.8 : 1.4, ease: 'power2.out',
        onUpdate() {
          const v = this.targets()[0].v;
          el.textContent = Math.round(v) + suffix;
        }
      });
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('.astat__n, .stat__num').forEach(el => io.observe(el));
})();

/* ═══════════════════════════════════════════════════════════
   GSAP — Hero parallax exit
═══════════════════════════════════════════════════════════ */
gsap.to('#heroContent', {
  y: -90, opacity: 0, ease: 'none',
  scrollTrigger: { trigger: '#hero', start: 'top top', end: '55% top', scrub: true }
});

/* ═══════════════════════════════════════════════════════════
   GSAP — Timeline stagger
═══════════════════════════════════════════════════════════ */
document.querySelectorAll('.tl-item').forEach((item, i) => {
  gsap.fromTo(item,
    { opacity: 0, x: i % 2 === 0 ? -28 : 28 },
    { opacity: 1, x: 0, duration: .65, ease: 'power2.out',
      scrollTrigger: { trigger: item, start: 'top 85%', toggleActions: 'play none none none' }
    }
  );
});

/* ═══════════════════════════════════════════════════════════
   GSAP — Cert cards wave entrance
═══════════════════════════════════════════════════════════ */
ScrollTrigger.create({
  trigger: '.certs-section', start: 'top 72%', once: true,
  onEnter: () => gsap.fromTo('.cert-card',
    { opacity: 0, y: 18, scale: .94 },
    { opacity: 1, y: 0, scale: 1, duration: .5, stagger: .07, ease: 'back.out(1.3)' }
  )
});

/* ═══════════════════════════════════════════════════════════
   BUTTON SPOTLIGHT
═══════════════════════════════════════════════════════════ */
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const r = btn.getBoundingClientRect();
    btn.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100) + '%');
    btn.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100) + '%');
  });
});

/* ═══════════════════════════════════════════════════════════
   3D CARD TILT
═══════════════════════════════════════════════════════════ */
document.querySelectorAll('.proj-card, .focus-card, .lang-card, .curr-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width  - .5) * 9;
    const y = ((e.clientY - r.top)  / r.height - .5) * -9;
    card.style.transform = `translateY(-5px) perspective(900px) rotateX(${y}deg) rotateY(${x}deg)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

/* ═══════════════════════════════════════════════════════════
   NAV ACTIVE SECTION HIGHLIGHT
═══════════════════════════════════════════════════════════ */
(function () {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-links a');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(a => {
          const active = a.getAttribute('href') === '#' + e.target.id;
          a.style.color      = active ? 'var(--text)' : '';
          a.style.background = active ? 'rgba(255,45,85,.1)' : '';
        });
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => io.observe(s));
})();

/* ═══════════════════════════════════════════════════════════
   SMOOTH ANCHOR SCROLL
═══════════════════════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 68, behavior: 'smooth' });
  });
});
