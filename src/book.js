// The project notebook: an open book whose pages turn with a physical curl.
//
// The turning leaf is cut into thin vertical strips, each hinged to the previous
// one, so the sheet can bend. Its pose is one angle θ at the spine (0 = lying on
// the right, π = lying on the left) plus a bend that grows along the sheet:
//   φ(s) = θ + bend · s²,  s ∈ [0, 1] from spine to edge.
// θ is driven by a damped spring. While the reader drags, the spring pulls θ
// toward the pointer and the free edge leads; once released, the edge trails
// from air drag (bend ∝ −ω) and the leaf falls to whichever side its angle and
// angular velocity favour, settling with a slight overshoot.

const STRIPS = 22;
const STIFF = 90;         // spring stiffness toward the target angle (1/s²)
const DAMP = 13;          // damping (1/s); a little under critical, so it settles with a give
const DRAG_STIFF = 260;   // stiffer while held, so the sheet follows the hand
const AIR = 0.085;        // how much the edge trails per rad/s of angular velocity
const LEAD = 0.55;        // how much the edge leads while pulled
const FLICK = 0.22;       // seconds of momentum counted when deciding where a released page lands

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Pages that contain a video show its poster while they are in the air.
const still = (html) => html.replace(/<video[^>]*poster="([^"]+)"[^>]*><\/video>/g, '<img src="$1" alt="">');

export function mountBook(root, { pages, reducedMotion, at = 0 }) {
  const stage = root.querySelector('[data-stage]');
  const left = root.querySelector('[data-page="left"]');
  const right = root.querySelector('[data-page="right"]');
  const shadeL = root.querySelector('[data-shade="left"]');
  const shadeR = root.querySelector('[data-shade="right"]');
  const tabs = [...root.querySelectorAll('[data-tab]')];
  const prev = root.querySelector('[data-prev]');
  const next = root.querySelector('[data-next]');
  const status = root.querySelector('[data-status]');
  const flat = () => reducedMotion || matchMedia('(max-width: 760px)').matches;

  let index = at;
  let flip = null;      // the leaf in the air, if any
  let queue = [];       // further turns requested while one is in flight
  let raf = 0;

  function paint(side, i) { (side === 'left' ? left : right).innerHTML = pages[i][side]; }
  function sync() {
    tabs.forEach((t, k) => t.setAttribute('aria-pressed', String(k === index)));
    prev.disabled = index === 0;
    next.disabled = index === pages.length - 1;
    status.textContent = pages[index].label;
  }

  // ---- the leaf: nested hinged strips, each with a front and a back face ----
  function buildLeaf(frontHTML, backHTML) {
    const leaf = document.createElement('div');
    leaf.className = 'leaf';
    leaf.setAttribute('aria-hidden', 'true');
    const W = right.getBoundingClientRect().width;
    const H = right.getBoundingClientRect().height;
    const sw = W / STRIPS;
    const strips = [];
    let parent = leaf;
    for (let i = 0; i < STRIPS; i++) {
      const s = document.createElement('div');
      s.className = 'strip';
      s.style.width = `${sw + 0.6}px`; // a hair of overlap hides the seams
      s.style.height = `${H}px`;
      if (i > 0) s.style.left = `${sw}px`;
      s.innerHTML =
        `<div class="face front"><div class="page page-right" style="width:${W}px;height:${H}px;left:${-i * sw}px">${frontHTML}</div><i class="lit"></i></div>`
        + `<div class="face back"><div class="page page-left" style="width:${W}px;height:${H}px;left:${-(STRIPS - 1 - i) * sw}px">${backHTML}</div><i class="lit"></i></div>`;
      parent.appendChild(s);
      strips.push({ el: s, front: s.firstChild.lastChild, back: s.lastChild.lastChild });
      parent = s;
    }
    stage.appendChild(leaf);
    return { leaf, strips };
  }

  function pose(f) {
    let prevPhi = 0;
    f.parts.strips.forEach((st, i) => {
      const s = (i + 0.5) / STRIPS;
      const phi = clamp(f.theta + f.bend * s * s, 0, Math.PI);
      st.el.style.transform = `rotateY(${-(phi - prevPhi)}rad)`;
      prevPhi = phi;
      // light comes from the reader's side: a face is brightest when it lies flat
      // and darkens as it turns edge-on
      const edge = Math.abs(Math.sin(phi));
      st.front.style.opacity = (edge * 0.38).toFixed(3);
      st.back.style.opacity = (edge * 0.3).toFixed(3);
    });
    // the leaf throws a shadow on whichever page it hangs over // taste-skill-ignore: physical page lighting
    const t = f.theta / Math.PI;
    shadeR.style.opacity = (t < 0.5 ? Math.sin(f.theta) * 0.55 : 0).toFixed(3);
    shadeL.style.opacity = (t >= 0.5 ? Math.sin(f.theta) * 0.55 : 0).toFixed(3);
  }

  // dir = +1 turns forward (right page to the left), −1 turns back.
  function start(dir, held) {
    const to = index + dir;
    if (to < 0 || to >= pages.length) return null;
    const from = index;
    const front = still(dir > 0 ? pages[from].right : pages[to].right);
    const back = still(dir > 0 ? pages[to].left : pages[from].left);
    // under the leaf, the page it uncovers is already there
    if (dir > 0) paint('right', to); else paint('left', to);
    const f = {
      dir, from, to, held,
      theta: dir > 0 ? 0 : Math.PI, omega: 0, bend: 0,
      target: dir > 0 ? Math.PI : 0,
      parts: buildLeaf(front, back),
    };
    root.classList.add('is-turning');
    pose(f);
    return f;
  }

  function land(f) {
    const done = f.target === (f.dir > 0 ? Math.PI : 0);
    if (done) {
      index = f.to;
      if (f.dir > 0) paint('left', f.to); else paint('right', f.to);
    } else {
      // fell back: put the uncovered page as it was
      if (f.dir > 0) paint('right', f.from); else paint('left', f.from);
    }
    f.parts.leaf.remove();
    shadeL.style.opacity = shadeR.style.opacity = 0;
    root.classList.remove('is-turning');
    flip = null;
    sync();
    if (queue.length) { const d = queue.shift(); turn(d); }
  }

  let last = 0;
  function tick(now) {
    const dt = Math.min(0.033, (now - (last || now)) / 1000) || 0.016;
    last = now;
    const f = flip;
    if (!f) { raf = 0; last = 0; return; }
    const k = f.held ? DRAG_STIFF : STIFF;
    const d = f.held ? 2 * Math.sqrt(DRAG_STIFF) : DAMP;
    f.omega += (k * (f.target - f.theta) - d * f.omega) * dt;
    f.theta += f.omega * dt;
    // when it overshoots past flat, the sheet lands on the book and stops
    if (f.theta < 0) { f.theta = 0; f.omega = Math.abs(f.omega) * 0.25; }
    if (f.theta > Math.PI) { f.theta = Math.PI; f.omega = -Math.abs(f.omega) * 0.25; }
    const want = f.held
      ? clamp((f.target - f.theta) * LEAD * 4, -1.2, 1.2)
      : clamp(-f.omega * AIR, -1.1, 1.1);
    f.bend += (want - f.bend) * Math.min(1, dt * 14);
    pose(f);
    if (!f.held && Math.abs(f.target - f.theta) < 0.002 && Math.abs(f.omega) < 0.02) {
      land(f);
      raf = 0; last = 0;
      return;
    }
    raf = requestAnimationFrame(tick);
  }
  const run = () => { if (!raf) raf = requestAnimationFrame(tick); };

  function swap(to) { // no animation: reduced motion or the phone layout
    index = to;
    paint('left', to); paint('right', to);
    sync();
  }

  function turn(dir) {
    if (flip) { queue.push(dir); return; }
    if (flat()) { const to = index + dir; if (to >= 0 && to < pages.length) swap(to); return; }
    flip = start(dir, false);
    if (!flip) return;
    flip.omega = dir * 1.2; // a small push, then the spring and the air take over
    run();
  }
  function go(to) {
    if (to === index || to < 0 || to >= pages.length) return;
    if (flat()) { swap(to); return; }
    const dir = Math.sign(to - index);
    queue = [];
    const steps = Math.abs(to - index);
    for (let s = 0; s < steps; s++) turn(dir);
  }

  // ---- dragging a page by hand ----
  let drag = null;
  stage.addEventListener('pointerdown', (e) => {
    if (flip || flat() || e.button !== 0 || e.target.closest('a, button, video')) return;
    const r = stage.getBoundingClientRect();
    const dir = e.clientX > r.left + r.width / 2 ? 1 : -1;
    if (index + dir < 0 || index + dir >= pages.length) return;
    drag = { dir, x0: e.clientX, id: e.pointerId, started: false };
  });
  window.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.started) {
      if (Math.abs(e.clientX - drag.x0) < 8) return;
      drag.started = true;
      flip = start(drag.dir, true);
      try { stage.setPointerCapture(e.pointerId); } catch {}
      run();
    }
    // the pointer's distance from the spine sets the angle the hand is holding
    const r = stage.getBoundingClientRect();
    const half = r.width / 2;
    const x = clamp((e.clientX - (r.left + half)) / half, -1, 1);
    flip.target = Math.acos(x);
  });
  const release = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const f = flip;
    if (drag.started && f) {
      f.held = false;
      // where it lands: angle plus a little momentum, past the middle turns the page
      const aim = f.theta + f.omega * FLICK;
      f.target = aim > Math.PI / 2 ? Math.PI : 0;
      run();
    }
    drag = null;
  };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);

  prev.addEventListener('click', () => turn(-1));
  next.addEventListener('click', () => turn(1));
  tabs.forEach((t, k) => t.addEventListener('click', () => go(k)));
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { turn(1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { turn(-1); e.preventDefault(); }
  });

  paint('left', index); paint('right', index);
  sync();
  return { go, current: () => (flip ? flip.to : index) };
}
