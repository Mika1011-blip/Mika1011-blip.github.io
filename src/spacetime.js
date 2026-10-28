// Spacetime paper: the notebook's squared paper is a coordinate grid that bends
// around moving masses. Each grid vertex is pulled toward every mass by
// m·r/(r²+ε²) (a softened well) and dragged along the mass's velocity
// (a nod to frame dragging). Masses attract each other with softened gravity;
// the pointer is a heavy mass that does not move on its own.

const G = 0.9;          // body–body attraction
const WELL = 1500;      // depth of the grid deformation per unit mass
const DRAG = 26;        // velocity drag on the grid per unit mass
const SOFT = 70;        // softening length, px
const MAX_SPEED = 1.6;  // px per frame
const MAX_BODIES = 12;
// Muted, earthy inks: nothing neon.
const PALETTE = ['#d08c60', '#7fa384', '#e3b75a', '#6b7fa8', '#a56b7f', '#8c6a4f', '#5f8f8a', '#c46a5a', '#9a8fbf', '#b8a05a', '#6f8f5a', '#c98b9a'];
const OUTLINE = '#1d1b19';

export function mountSpacetime(canvas, { reducedMotion, band }) {
  let bandY = 0;
  const findBand = () => { bandY = band ? band() : h * 0.5; };
  const ctx = canvas.getContext('2d');
  const css = getComputedStyle(document.documentElement);
  const ink = css.getPropertyValue('--ink').trim() || '#062b8a';
  const red = css.getPropertyValue('--red').trim() || '#c8372d';
  let w = 0, h = 0, dpr = 1, spacing = 36, cols = 0, rows = 0, jitter = [];
  let bodies = [];
  const pointer = { x: 0, y: 0, m: 0, target: 0 };
  let raf = 0, visible = true;

  // Fixed per-vertex jitter so the lines look hand-ruled without shimmering.
  function rand(i) { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

  function resize() {
    const r = canvas.getBoundingClientRect();
    w = r.width; h = r.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    spacing = w < 640 ? 30 : 38;
    cols = Math.ceil(w / spacing) + 3; rows = Math.ceil(h / spacing) + 3;
    jitter = Array.from({ length: cols * rows }, (_, i) => [(rand(i) - 0.5) * 1.6, (rand(i + 9999) - 0.5) * 1.6]);
    findBand();
    if (!bodies.length) seed();
    draw();
  }

  function makeBody(x, y, vx, vy, m) {
    return {
      x, y, m,
      vx: reducedMotion ? 0 : vx, vy: reducedMotion ? 0 : vy, // with reduced motion they wait to be pulled
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      blink: 1 + Math.random() * 4, // seconds until the next blink
      lid: 0,                        // 0 open … 1 shut
      wobble: Math.random() * 6.28,  // phase for the scribbled outline
    };
  }

  function seed() {
    const n = w < 640 ? 3 : 4;
    bodies = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + 0.6;
      return makeBody(w * (0.5 + Math.cos(a) * 0.36), bandY + Math.sin(a) * 30, -Math.sin(a) * 0.8, Math.cos(a) * 0.12, [1.4, 0.8, 1.1, 0.6][i]);
    });
  }

  function add() {
    if (bodies.length >= MAX_BODIES) return bodies.length;
    const a = Math.random() * Math.PI * 2;
    bodies.push(makeBody(w * (0.15 + Math.random() * 0.7), bandY + (Math.random() - 0.5) * 60,
      Math.cos(a) * 0.9, Math.sin(a) * 0.3, 0.5 + Math.random() * 1.1));
    if (reducedMotion) draw();
    return bodies.length;
  }
  function remove() {
    if (bodies.length > 1) bodies.pop();
    if (reducedMotion) draw();
    return bodies.length;
  }

  function step() {
    pointer.m += (pointer.target - pointer.m) * 0.08;
    const all = pointer.m > 0.02 ? [...bodies, pointer] : bodies;
    for (const b of bodies) {
      let ax = 0, ay = 0;
      for (const o of all) {
        if (o === b) continue;
        const dx = o.x - b.x, dy = o.y - b.y;
        const r2 = dx * dx + dy * dy + SOFT * SOFT;
        const f = (G * o.m) / (r2 * Math.sqrt(r2)) * 900;
        ax += dx * f; ay += dy * f;
        // short-range repulsion: bodies scatter instead of merging into one blot
        const r = Math.sqrt(dx * dx + dy * dy) || 1;
        if (o !== pointer && r < 90) { const p = (90 - r) * 0.0025; ax -= (dx / r) * p; ay -= (dy / r) * p; }
      }
      // a soft spring keeps the system on the page, in a flat band between the
      // name and the folders, so the ink blots stay off the headline
      ax += (w * 0.5 - b.x) * 0.00003; ay += (bandY - b.y) * 0.0006;
      // soft walls near the edges, so a slung mass turns back instead of
      // wandering off the page for half a minute
      const edge = Math.max(48, w * 0.06);
      if (b.x < edge) ax += (edge - b.x) * 0.002;
      else if (b.x > w - edge) ax -= (b.x - (w - edge)) * 0.002;
      b.vy *= 0.985;
      // with reduced motion the masses only move while the cursor pulls them,
      // and come to rest once it lets go
      if (reducedMotion && pointer.target === 0) { b.vx *= 0.9; b.vy *= 0.9; }
      b.vx += ax; b.vy += ay;
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > MAX_SPEED) { b.vx *= MAX_SPEED / sp; b.vy *= MAX_SPEED / sp; }
      b.x += b.vx; b.y += b.vy;
    }
  }

  function displaced(x, y, all) {
    let ox = 0, oy = 0;
    for (const b of all) {
      const dx = b.x - x, dy = b.y - y;
      const r2 = dx * dx + dy * dy + SOFT * SOFT;
      const k = (WELL * b.m) / r2;
      let px = dx * k, py = dy * k;
      const r = Math.sqrt(dx * dx + dy * dy);
      const mag = Math.hypot(px, py);
      if (mag > r * 0.8 && mag > 0) { px *= (r * 0.8) / mag; py *= (r * 0.8) / mag; }
      const d = (DRAG * b.m * SOFT) / r2;
      ox += px + (b.vx || 0) * d * 10; oy += py + (b.vy || 0) * d * 10;
    }
    return [x + ox, y + oy];
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const all = pointer.m > 0.02 ? [...bodies, pointer] : bodies;
    const x0 = -spacing, y0 = -spacing;
    const pts = new Array(cols * rows);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const k = j * cols + i;
      const [x, y] = displaced(x0 + i * spacing + jitter[k][0], y0 + j * spacing + jitter[k][1], all);
      pts[k] = [x, y];
    }
    ctx.strokeStyle = ink; ctx.lineCap = 'round';
    for (const pass of [[0.32, 1, 0], [0.14, 0.8, 0.9]]) {
      ctx.globalAlpha = pass[0]; ctx.lineWidth = pass[1];
      ctx.beginPath();
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const [x, y] = pts[j * cols + i];
        if (i === 0) ctx.moveTo(x + pass[2], y); else ctx.lineTo(x + pass[2], y);
      }
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        const [x, y] = pts[j * cols + i];
        if (j === 0) ctx.moveTo(x, y + pass[2]); else ctx.lineTo(x, y + pass[2]);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    bodies.forEach(drawBody);
  }

  // A wobbly closed loop around (x, y): the radius wanders a little, and the
  // wander changes a few times a second so the line "boils" like stop-motion ink.
  function scribble(x, y, rx, ry, seed, passes = 2) {
    for (let p = 0; p < passes; p++) {
      ctx.beginPath();
      const steps = 18, start = seed + p * 1.7;
      for (let i = 0; i <= steps + 1; i++) {
        const a = (i / steps) * Math.PI * 2 + start * 0.3;
        const k = 1 + Math.sin(a * 3 + start) * 0.035 + Math.sin(a * 5 + start * 2) * 0.025;
        const px = x + Math.cos(a) * rx * k, py = y + Math.sin(a) * ry * k;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }

  function mood(b) {
    const sp = Math.hypot(b.vx, b.vy);
    const near = bodies.reduce((d, o) => (o === b ? d : Math.min(d, Math.hypot(o.x - b.x, o.y - b.y))), Infinity);
    const toPointer = pointer.m > 0.3 ? Math.hypot(pointer.x - b.x, pointer.y - b.y) : Infinity;
    if (toPointer < 140) return 'delighted';
    if (near < 70) return 'worried';
    if (sp > 1.15) return 'whee';
    return 'calm';
  }

  function drawBody(b, n) {
    const r = 11 + b.m * 8;
    const sp = Math.hypot(b.vx, b.vy);
    const ux = sp > 0.01 ? b.vx / sp : 1, uy = sp > 0.01 ? b.vy / sp : 0;
    const boil = Math.floor(frame / 7) + b.wobble * 10;

    // body: coloured fill, squashed a little along its velocity
    const stretch = Math.min(0.12, sp * 0.06);
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(Math.atan2(uy, ux));
    ctx.scale(1 + stretch, 1 - stretch);
    ctx.fillStyle = b.color;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    scribble(0, 0, r, r, boil);
    ctx.restore();

    // face: eyes follow the cursor if it is near, otherwise look where it is going
    const m = mood(b);
    let lx = ux, ly = uy;
    if (pointer.m > 0.3) { const dx = pointer.x - b.x, dy = pointer.y - b.y, d = Math.hypot(dx, dy); if (d < 420) { lx = dx / d; ly = dy / d; } }
    const eyeR = r * 0.24, gap = r * 0.36, ey = b.y - r * 0.18;
    for (const s of [-1, 1]) {
      const ex = b.x + s * gap;
      ctx.fillStyle = '#fbf7ef';
      ctx.beginPath(); ctx.ellipse(ex, ey, eyeR, eyeR * (1 - b.lid * 0.92) + 0.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = 1.3; ctx.stroke();
      if (b.lid < 0.6) {
        ctx.fillStyle = OUTLINE;
        const pr = m === 'whee' ? eyeR * 0.38 : eyeR * 0.5;
        ctx.beginPath(); ctx.arc(ex + lx * eyeR * 0.42, ey + ly * eyeR * 0.42, pr, 0, Math.PI * 2); ctx.fill();
      }
      // brows: worried tilts them up in the middle
      if (m === 'worried') {
        ctx.beginPath(); ctx.moveTo(ex - s * eyeR, ey - eyeR * 1.5); ctx.lineTo(ex + s * eyeR * 0.6, ey - eyeR * 2.1); ctx.stroke();
      }
    }
    // mouth
    const my = b.y + r * 0.36;
    ctx.strokeStyle = OUTLINE; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    ctx.beginPath();
    if (m === 'whee') { ctx.fillStyle = OUTLINE; ctx.ellipse(b.x, my, r * 0.16, r * 0.2, 0, 0, Math.PI * 2); ctx.fill(); }
    else if (m === 'worried') { ctx.moveTo(b.x - r * 0.28, my + 1); ctx.quadraticCurveTo(b.x - r * 0.1, my - 3, b.x, my); ctx.quadraticCurveTo(b.x + r * 0.1, my + 3, b.x + r * 0.28, my - 1); ctx.stroke(); }
    else if (m === 'delighted') {
      ctx.moveTo(b.x - r * 0.32, my - 2); ctx.quadraticCurveTo(b.x, my + r * 0.4, b.x + r * 0.32, my - 2); ctx.closePath();
      ctx.fillStyle = OUTLINE; ctx.fill();
      ctx.fillStyle = 'rgb(200 80 80 / 0.35)';
      ctx.beginPath(); ctx.arc(b.x - r * 0.6, my - 2, r * 0.14, 0, Math.PI * 2); ctx.arc(b.x + r * 0.6, my - 2, r * 0.14, 0, Math.PI * 2); ctx.fill();
    } else { ctx.moveTo(b.x - r * 0.26, my - 1); ctx.quadraticCurveTo(b.x, my + r * 0.22, b.x + r * 0.26, my - 1); ctx.stroke(); }

    // velocity arrow, in red pen
    ctx.strokeStyle = red; ctx.lineWidth = 1.8;
    if (sp > 0.05) {
      const len = r + 14 + sp * 22;
      const ex = b.x + ux * len, ey2 = b.y + uy * len;
      ctx.beginPath();
      ctx.moveTo(b.x + ux * (r + 6), b.y + uy * (r + 6)); ctx.lineTo(ex, ey2);
      ctx.moveTo(ex, ey2); ctx.lineTo(ex - ux * 8 - uy * 5, ey2 - uy * 8 + ux * 5);
      ctx.moveTo(ex, ey2); ctx.lineTo(ex - ux * 8 + uy * 5, ey2 - uy * 8 - ux * 5);
      ctx.stroke();
    }
    ctx.fillStyle = red;
    ctx.font = '700 16px "Kalam", cursive';
    ctx.fillText(`m${n + 1}`, b.x + r + 6, b.y - r - 2);
  }

  function blinkStep(dt) {
    for (const b of bodies) {
      b.blink -= dt;
      if (b.blink <= 0) { b.lid = Math.min(1, b.lid + dt * 14); if (b.lid >= 1) b.blink = 2 + Math.random() * 4; }
      else if (b.lid > 0) b.lid = Math.max(0, b.lid - dt * 10);
    }
  }

  let frame = 0;
  function loop() {
    frame++;
    step(); blinkStep(1 / 60); draw();
    raf = visible && !document.hidden && (!reducedMotion || pulling() || moving()) ? requestAnimationFrame(loop) : 0;
  }
  const pulling = () => pointer.target > 0 || pointer.m > 0.02;
  const moving = () => bodies.some((b) => Math.abs(b.vx) + Math.abs(b.vy) > 0.02);
  // Reduced motion: nothing drifts on its own; the loop runs only while the
  // reader's cursor is pulling (motion they start themselves) and until the
  // masses settle.
  function start() { if (!raf && (!reducedMotion || pulling())) raf = requestAnimationFrame(loop); }

  // The canvas sits under the page content, so listen on the window.
  const release = () => { pointer.target = 0; };
  window.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (y < 0 || y > r.height) return release();
    pointer.x = x; pointer.y = y;
    if (e.pointerType === 'mouse' || e.pressure > 0) { pointer.target = 2.2; start(); }
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', release);
  window.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') release(); });
  window.addEventListener('pointercancel', release);

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
  if (reducedMotion) pointer.m = 0;
  resize();
  start();
  return { add, remove, count: () => bodies.length };
}
