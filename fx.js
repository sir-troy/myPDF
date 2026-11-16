/* MyPDF - visual effects: 3D hero (Three.js), tilt cards, counters, rotating headline */
(() => {
'use strict';
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const isMobile = innerWidth < 760;

/* Animated stat counters */
const ease = t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
function runCounter(el) {
  const to = +el.dataset.count, suffix = el.dataset.suffix || '', dur = 1600, t0 = performance.now();
  if (reduceMotion || to === 0) { el.textContent = to.toLocaleString() + suffix; return; }
  const tick = now => {
    const p = Math.min(1, (now - t0) / dur);
    el.textContent = Math.round(to * ease(p)).toLocaleString() + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
const counters = document.querySelectorAll('[data-count]');
if ('IntersectionObserver' in window) {
  const co = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { runCounter(e.target); co.unobserve(e.target); } }), { threshold: .5 });
  counters.forEach(c => co.observe(c));
} else counters.forEach(runCounter);

/* 3D tilt cards */
if (finePointer && !reduceMotion) {
  document.querySelectorAll('.tilt').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--ry', ((x - .5) * 14).toFixed(2) + 'deg');
      card.style.setProperty('--rx', ((.5 - y) * 12).toFixed(2) + 'deg');
      card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    });
    card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
  });
}

/* Rotating hero headline (every 5 s) */
const HEADLINES = [
  ['Process PDFs', 'at the speed', 'of your device.'],
  ['Merge files', 'without uploading', 'a single byte.'],
  ['Sign documents', 'in seconds,', 'right in your browser.'],
  ['Split PDFs', 'with precision,', 'page by page.'],
  ['Turn images', 'into polished', 'PDFs instantly.'],
  ['Your files', 'stay private.', 'Always.'],
  ['Convert PDFs', 'to crisp images', 'in one click.'],
  ['No sign-up.', 'No uploads.', 'No limits.'],
  ['Built for speed,', 'designed for', 'privacy.'],
  ['One toolkit', 'for every', 'PDF task.']
];
const title = document.getElementById('hero-title'), bar = document.getElementById('headline-bar');
if (title) {
  const spans = [...title.querySelectorAll('.line > span')];
  let idx = 0, timer = null;
  const setText = v => spans.forEach((s, i) => (s.textContent = v[i]));
  // Reserve the tallest headline's height so the page doesn't jump when the text changes
  function reserveHeight() {
    if (!title.offsetWidth) return;
    title.style.minHeight = '';
    const clone = title.cloneNode(true);
    clone.removeAttribute('id');
    clone.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;width:${title.offsetWidth}px;min-height:0`;
    title.parentNode.appendChild(clone);
    const cs = [...clone.querySelectorAll('.line > span')];
    let max = 0;
    HEADLINES.forEach(v => { cs.forEach((s, i) => { s.textContent = v[i]; s.style.animation = 'none'; }); max = Math.max(max, clone.offsetHeight); });
    clone.remove();
    title.style.minHeight = max + 'px';
  }
  const runBar = () => { if (!bar) return; bar.classList.remove('run'); void bar.offsetWidth; bar.classList.add('run'); };
  function next() {
    idx = (idx + 1) % HEADLINES.length;
    if (reduceMotion) { setText(HEADLINES[idx]); runBar(); return; }
    title.classList.add('out');
    setTimeout(() => {
      setText(HEADLINES[idx]);
      title.classList.remove('out');
      spans.forEach(s => { s.style.animation = 'none'; void s.offsetWidth; s.style.animation = ''; });
      runBar();
    }, 650);
  }
  function startCycle() { clearInterval(timer); runBar(); timer = setInterval(() => { if (!document.hidden && !document.getElementById('home').hidden) next(); }, 5000); }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(reserveHeight);
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(reserveHeight, 150); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) startCycle(); });
  window.addEventListener('hashchange', () => { if (!document.getElementById('home').hidden) setTimeout(() => { reserveHeight(); startCycle(); }, 50); });
  startCycle();
}

/* Three.js hero */
const wrap = document.getElementById('hero-3d'), canvas = document.getElementById('hero-canvas');
if (!wrap || !canvas) return;
if (!window.THREE) { wrap.classList.add('no-webgl'); return; }
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
catch (e) { wrap.classList.add('no-webgl'); return; }

const T = THREE;
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isMobile ? 1.5 : 2));
const scene = new T.Scene();
const camera = new T.PerspectiveCamera(40, 1, 0.1, 100);
camera.position.set(0, 0, 9);

const PALETTE = {
  dark: { page: 0x0e1230, pageOpacity: .55, edge: [0x22d3ee, 0x8b5cf6, 0xec4899], line: 0x8aa0ff, particle: [0x22d3ee, 0x8b5cf6, 0xec4899, 0xffffff], wire: 0x8b5cf6, wireOpacity: .12, blending: T.AdditiveBlending },
  light: { page: 0xffffff, pageOpacity: .75, edge: [0x0891b2, 0x7c3aed, 0xdb2777], line: 0x6366f1, particle: [0x0891b2, 0x7c3aed, 0xdb2777, 0x334155], wire: 0x7c3aed, wireOpacity: .14, blending: T.NormalBlending }
};
let theme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';

scene.add(new T.AmbientLight(0xffffff, .65));
const l1 = new T.PointLight(0x22d3ee, 2.2, 30); l1.position.set(-5, 3, 6); scene.add(l1);
const l2 = new T.PointLight(0xec4899, 2, 30); l2.position.set(5, -3, 5); scene.add(l2);

const root = new T.Group(); scene.add(root);

// Document stack
const stack = new T.Group(); root.add(stack);
const pageGeo = new T.BoxGeometry(2.1, 2.8, 0.035);
const edgeGeo = new T.EdgesGeometry(pageGeo);
const pages = [], edges = [];
for (let i = 0; i < 3; i++) {
  const mat = new T.MeshPhysicalMaterial({ color: 0x0e1230, transparent: true, opacity: .55, roughness: .25, metalness: .2, clearcoat: 1, clearcoatRoughness: .2, side: T.DoubleSide });
  const page = new T.Mesh(pageGeo, mat);
  const edge = new T.LineSegments(edgeGeo, new T.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: .95 }));
  page.add(edge);
  page.position.z = (i - 1) * 0.42; page.rotation.z = (i - 1) * 0.06;
  stack.add(page); pages.push(page); edges.push(edge);
}
// text lines + header block on the front page
const front = pages[2];
const lineMat = new T.MeshBasicMaterial({ color: 0x8aa0ff, transparent: true, opacity: .55 });
const header = new T.Mesh(new T.PlaneGeometry(.7, .22), new T.MeshBasicMaterial({ color: 0xec4899, transparent: true, opacity: .9 }));
header.position.set(-.55, 1.05, .021); front.add(header);
const lines = [];
[[1.5, .62], [1.5, .38], [1.1, .14], [1.5, -.1], [1.3, -.34], [0.9, -.58]].forEach(([w, y]) => {
  const m = new T.Mesh(new T.PlaneGeometry(w, .07), lineMat); m.position.set(-0.75 + w / 2, y, .021); front.add(m); lines.push(m);
});
// signature squiggle on the front page
const sigPts = []; for (let i = 0; i <= 60; i++) { const t = i / 60; sigPts.push(new T.Vector3(-.75 + t * 1.3, -1 + Math.sin(t * 18) * .07 * (1 - t * .5) + t * .05, .022)); }
const sig = new T.Line(new T.BufferGeometry().setFromPoints(sigPts), new T.LineBasicMaterial({ color: 0x22d3ee }));
front.add(sig);
// scanner beam
const beam = new T.Mesh(new T.PlaneGeometry(2.3, .05), new T.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: .9, blending: T.AdditiveBlending, depthWrite: false }));
const beamGlow = new T.Mesh(new T.PlaneGeometry(2.3, .5), new T.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: .07, blending: T.AdditiveBlending, depthWrite: false }));
beam.add(beamGlow); beam.position.z = .06; front.add(beam);

// Orbit rings with satellites
const rings = [];
[[2.55, 0x22d3ee, [1.2, .3, 0]], [2.95, 0x8b5cf6, [-1.0, -.4, .4]]].forEach(([r, c, rot]) => {
  const g = new T.Group(); g.rotation.set(...rot);
  const ring = new T.Mesh(new T.TorusGeometry(r, .008, 8, 160), new T.MeshBasicMaterial({ color: c, transparent: true, opacity: .55 }));
  const sat = new T.Mesh(new T.SphereGeometry(.07, 16, 16), new T.MeshBasicMaterial({ color: c }));
  const satGlow = new T.Mesh(new T.SphereGeometry(.16, 16, 16), new T.MeshBasicMaterial({ color: c, transparent: true, opacity: .25, blending: T.AdditiveBlending, depthWrite: false }));
  sat.add(satGlow); g.add(ring); g.add(sat); root.add(g);
  rings.push({ g, ring, sat, r, speed: .35 + Math.random() * .3, phase: Math.random() * 6 });
});

// Wireframe shell
const shell = new T.Mesh(new T.IcosahedronGeometry(3.6, 1), new T.MeshBasicMaterial({ color: 0x8b5cf6, wireframe: true, transparent: true, opacity: .12 }));
root.add(shell);

// Particles
const N = isMobile ? 260 : 650;
const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
for (let i = 0; i < N; i++) {
  const r = 3 + Math.random() * 4.5, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
  pos[i * 3] = r * Math.sin(ph) * Math.cos(th); pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * .7; pos[i * 3 + 2] = r * Math.cos(ph);
}
const pGeo = new T.BufferGeometry();
pGeo.setAttribute('position', new T.BufferAttribute(pos, 3));
pGeo.setAttribute('color', new T.BufferAttribute(col, 3));
const dotTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.35, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c); })();
const pMat = new T.PointsMaterial({ size: .09, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, opacity: .9 });
const particles = new T.Points(pGeo, pMat); scene.add(particles);

function applyTheme() {
  const P = PALETTE[theme];
  pages.forEach((p, i) => { p.material.color.setHex(P.page); p.material.opacity = P.pageOpacity; edges[i].material.color.setHex(P.edge[i]); });
  lineMat.color.setHex(P.line);
  sig.material.color.setHex(P.edge[0]);
  shell.material.color.setHex(P.wire); shell.material.opacity = P.wireOpacity;
  beam.material.blending = beamGlow.material.blending = P.blending; beam.material.color.setHex(P.edge[0]); beamGlow.material.color.setHex(P.edge[0]);
  beam.material.needsUpdate = beamGlow.material.needsUpdate = true;
  pMat.blending = P.blending; pMat.needsUpdate = true;
  const c = new T.Color();
  for (let i = 0; i < N; i++) { c.setHex(P.particle[i % P.particle.length]); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  pGeo.attributes.color.needsUpdate = true;
  rings.forEach((r, i) => { r.ring.material.color.setHex(P.edge[i]); r.sat.material.color.setHex(P.edge[i]); });
}
applyTheme();
window.addEventListener('mypdf-theme', e => { theme = e.detail === 'light' ? 'light' : 'dark'; applyTheme(); render(performance.now()); });

// Sizing
function resize() {
  const w = wrap.clientWidth, h = wrap.clientHeight; if (!w || !h) return;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  camera.position.z = w < 420 ? 10.5 : 9;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(wrap); resize();

// Interaction
const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
if (finePointer) {
  window.addEventListener('pointermove', e => { target.x = (e.clientX / innerWidth - .5) * 2; target.y = (e.clientY / innerHeight - .5) * 2; }, { passive: true });
}
let dragging = false, lastX = 0, spin = 0, spinV = 0;
canvas.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; });
window.addEventListener('pointerup', () => (dragging = false));
window.addEventListener('pointermove', e => { if (!dragging) return; spinV = (e.clientX - lastX) * .006; lastX = e.clientX; }, { passive: true });

// Render loop (pauses when off-screen / hidden)
let visible = true, running = false;
function render(now) {
  const t = now / 1000;
  cur.x += (target.x - cur.x) * .05; cur.y += (target.y - cur.y) * .05;
  spin += spinV; spinV *= .94;
  root.rotation.y = Math.sin(t * .25) * .35 + cur.x * .45 + spin;
  root.rotation.x = Math.sin(t * .2) * .08 + cur.y * .25;
  root.position.y = Math.sin(t * .8) * .08;
  const spread = .42 + Math.sin(t * .9) * .14;
  pages.forEach((p, i) => { p.position.z = (i - 1) * spread; p.position.x = (i - 1) * .12 * Math.sin(t * .6); });
  beam.position.y = Math.sin(t * 1.3) * 1.3;
  beam.material.opacity = .45 + Math.sin(t * 6) * .2;
  rings.forEach(r => { const a = t * r.speed + r.phase; r.sat.position.set(Math.cos(a) * r.r, Math.sin(a) * r.r, 0); r.g.rotation.z += .0015; });
  shell.rotation.y = t * .05; shell.rotation.x = t * .03;
  particles.rotation.y = t * .03; particles.rotation.x = Math.sin(t * .1) * .1;
  renderer.render(scene, camera);
}
function loop(now) {
  if (!visible || document.hidden || reduceMotion) { running = false; return; }
  render(now); requestAnimationFrame(loop);
}
function start() { if (!running && !reduceMotion) { running = true; requestAnimationFrame(loop); } }
if ('IntersectionObserver' in window) {
  new IntersectionObserver(es => { visible = es[0].isIntersecting && !document.getElementById('home').hidden; if (visible) start(); }, { threshold: .02 }).observe(wrap);
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
window.addEventListener('hashchange', () => { visible = !document.getElementById('home').hidden; if (visible) setTimeout(() => { resize(); start(); }, 30); });
render(performance.now());
start();
})();
