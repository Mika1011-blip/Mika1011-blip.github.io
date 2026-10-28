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

  function seed() {
    const n = w < 640 ? 3 : 4;
    bodies = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + 0.6;
      return {
        x: w * (0.5 + Math.cos(a) * 0.36), y: bandY + Math.sin(a) * 30,
        vx: -Math.sin(a) * 0.8, vy: Math.cos(a) * 0.12,
        m: [1.4, 0.8, 1.1, 0.6][i],
      };
    });
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
      b.vy *= 0.985;
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

  function drawBody(b, n) {
    const r = 7 + b.m * 7;
    ctx.fillStyle = ink; ctx.strokeStyle = ink; ctx.lineWidth = 1.4;
    // ink blot, two loose circles
    ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.ellipse(b.x + 1.2, b.y - 0.8, r + 4, r + 3, 0.4, 0.2, Math.PI * 1.85); ctx.stroke();
    ctx.globalAlpha = 1;
    // velocity arrow, in red pen
    const sp = Math.hypot(b.vx, b.vy);
    ctx.strokeStyle = red; ctx.lineWidth = 1.8;
    if (sp > 0.05) {
      const ux = b.vx / sp, uy = b.vy / sp, len = r + 14 + sp * 22;
      const ex = b.x + ux * len, ey = b.y + uy * len;
      ctx.beginPath();
      ctx.moveTo(b.x + ux * (r + 6), b.y + uy * (r + 6)); ctx.lineTo(ex, ey);
      ctx.moveTo(ex, ey); ctx.lineTo(ex - ux * 8 - uy * 5, ey - uy * 8 + ux * 5);
      ctx.moveTo(ex, ey); ctx.lineTo(ex - ux * 8 + uy * 5, ey - uy * 8 - ux * 5);
      ctx.stroke();
    }
    ctx.fillStyle = red;
    ctx.font = 'italic 14px "Public Sans", sans-serif';
    ctx.fillText(`m${'₁₂₃₄'[n] || ''}`, b.x + r + 6, b.y - r - 4);
  }

  function loop() {
    step(); draw();
    raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
  }
  function start() { if (!raf && !reducedMotion) raf = requestAnimationFrame(loop); }

  // The canvas sits under the page content, so listen on the window.
  const release = () => { pointer.target = 0; if (reducedMotion) { pointer.m = 0; draw(); } };
  window.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (y < 0 || y > r.height) return release();
    pointer.x = x; pointer.y = y;
    if (e.pointerType === 'mouse' || e.pressure > 0) pointer.target = 2.2;
    if (reducedMotion) { pointer.m = pointer.target; draw(); }
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
}
