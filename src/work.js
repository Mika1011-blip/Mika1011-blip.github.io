// Section 2: the project notebook, lying open on a cobalt desk covered in
// scribbled equations. The spreads are HTML strings that book.js paints and turns.
import { esc, inkSvg, neighbourhoodDrawing } from './shared.js';

// The equations on the desk, placed as in the 1440 × 1180 design (x, y in px,
// turned into percent of the section). `thin` ones go below 900 px, and those in
// the bottom band below 1100 px, where they would meet the buttons; `hi` are
// written in highlighter yellow.
const EQUATIONS = [
  [20, 22, 20, 0.4, -4, '∂L/∂w = (ŷ − y)·x'],
  [360, 20, 20, 0.35, 2, 'P(A|B) = P(B|A) P(A) / P(B)', 'thin'],
  [690, 30, 20, 0.35, -2, '∇×B = μ<sub>0</sub>J + μ<sub>0</sub>ε<sub>0</sub> ∂E/∂t', 'thin'],
  [1010, 20, 42, 0.5, -6, 'E = mc<sup>2</sup>'],
  [1200, 92, 24, 0.4, 4, 'iℏ ∂ψ/∂t = Ĥψ', 'thin'],
  [970, 146, 22, 0.45, -2, 'softmax(z<sub>i</sub>) = e<sup>z<sub>i</sub>/T</sup> / Σ<sub>j</sub> e<sup>z<sub>j</sub>/T</sup>', 'thin'],
  [1240, 190, 18, 0.75, 3, 'T ↑ → more chaos', 'hi'],
  [28, 290, 22, 0.4, -6, '∇·E = ρ/ε<sub>0</sub>', 'thin'],
  [40, 370, 30, 0.45, 4, 'F = ma'],
  [28, 580, 20, 0.4, -3, 'Δx·Δp ≥ ℏ/2'],
  [56, 630, 72, 0.25, 0, '∑', 'thin'],
  [30, 760, 26, 0.45, 6, 'λ = h/p'],
  [40, 980, 26, 0.45, -5, 'dS ≥ 0', 'thin'],
  [1336, 226, 84, 0.25, 8, 'π'],
  [1300, 350, 20, 0.4, -4, 'a<sup>2</sup> + b<sup>2</sup> = c<sup>2</sup>', 'thin'],
  [1300, 520, 20, 0.4, 3, 'ζ(s) = Σ 1/n<sup>s</sup>'],
  [1294, 760, 18, 0.4, -2, 'σ(x) = 1/(1+e<sup>−x</sup>)', 'thin'],
  [1340, 816, 64, 0.28, 0, '∞'],
  [1296, 920, 20, 0.4, 5, '∮ B·dl = μ<sub>0</sub>I', 'thin'],
  [1300, 1000, 20, 0.4, -3, 'ẋ = σ(y − x)'],
  [60, 1106, 24, 0.45, -3, 'x<sub>n+1</sub> = r x<sub>n</sub>(1 − x<sub>n</sub>)'],
  [420, 1124, 24, 0.45, 2, '∫<sub>0</sub><sup>∞</sup> e<sup>−x²</sup> dx = √π / 2', 'thin'],
  [820, 1108, 22, 0.4, -2, 'G<sub>μν</sub> + Λg<sub>μν</sub> = 8πG/c<sup>4</sup> T<sub>μν</sub>'],
  [1150, 1040, 24, 0.45, -4, 'e<sup>iπ</sup> + 1 = 0', 'thin'],
  [1190, 1130, 22, 0.4, 3, 'S = −k Σ p ln p', 'thin'],
  [340, 1080, 18, 0.75, -2, 'chaos ≠ random', 'hi'],
];

// Line sketches: x, y, width, height, viewBox, inner SVG, flags.
const SKETCHES = [
  // a sine wave on axes
  [20, 450, 120, 80, '0 0 120 80', '<path d="M6 4 L6 76 M2 40 L118 40"/><path d="M6 40 C 16 4, 26 4, 36 40 S 56 76, 66 40 S 86 4, 96 40 S 112 66, 118 52"/>'],
  // the unit circle with θ
  [22, 830, 110, 110, '0 0 110 110', '<circle cx="55" cy="55" r="44"/><path d="M55 55 L95 36 M55 55 L99 55 M95 36 L95 55"/><path d="M72 55 A17 17 0 0 0 70 47"/><text x="76" y="52">θ</text>', 'thin'],
  // a right triangle
  [1310, 396, 100, 80, '0 0 100 80', '<path d="M8 72 L92 72 L92 10 Z"/><path d="M82 72 L82 62 L92 62"/><text x="46" y="86">a</text><text x="96" y="44">b</text><text x="38" y="36">c</text>', 'thin'],
  // a pendulum
  [1320, 584, 90, 130, '0 0 90 130', '<path d="M10 6 L80 6"/><path d="M45 6 L72 100"/><path d="M45 6 L45 110" stroke-dasharray="4 5"/><path d="M45 34 A28 28 0 0 0 53 33"/><path d="M14 104 C 30 118, 60 118, 80 96"/><circle class="fill" cx="72" cy="100" r="8"/>'],
  // a Lorenz loop
  [150, 990, 170, 90, '0 0 170 90', '<path d="M85 45 C 60 5, 10 10, 20 45 C 30 80, 75 70, 85 45 C 95 20, 150 10, 152 45 C 154 82, 100 76, 85 45 C 70 18, 30 22, 34 46 C 38 66, 70 62, 85 45 C 100 28, 138 26, 138 46 C 138 66, 104 64, 85 45"/>'],
  // an arrow with a tick
  [230, 300, 120, 40, '0 0 120 40', '<path d="M4 20 L116 20 M100 8 L116 20 L100 32 M60 4 L60 36"/>', 'thin'],
  // the yellow loop round E = mc²
  [990, 6, 200, 70, '0 0 200 70', '<path d="M12 40 C 8 12, 150 2, 186 26 C 204 46, 120 70, 40 62 C 10 58, 4 40, 30 24"/>', 'hi'],
];

const place = (x, y) => `left:${(x / 14.4).toFixed(2)}%;top:${(y / 11.8).toFixed(2)}%`;
const flags = (f, y) => (f ? ` is-${f}` : '') + (y >= 960 ? ' is-low' : '');

function equations() {
  const eqs = EQUATIONS.map(([x, y, s, o, r, html, f]) =>
    `<p class="eq${flags(f, y)}" style="${place(x, y)};font-size:${s}px;opacity:${o};rotate:${r}deg">${html}</p>`).join('');
  const sk = SKETCHES.map(([x, y, w, h, vb, inner, f]) =>
    `<svg class="sketch${flags(f, y)}" viewBox="${vb}" style="${place(x, y)};width:${w}px;height:${h}px">${inner}</svg>`).join('');
  return `<div class="equations" aria-hidden="true">${eqs}${sk}</div>`;
}

// ---- the spreads ----

const scribblesLeft = `
  <svg class="scribble sc-star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 L14.6 9 L22 9.4 L16.2 14 L18.4 21.6 L12 17.2 L5.6 21.6 L7.8 14 L2 9.4 L9.4 9 Z"/></svg>
  <p class="scribble sc-euler is-minor" aria-hidden="true">e<sup>iπ</sup> + 1 = 0</p>
  <svg class="scribble sc-osc is-minor" viewBox="0 0 130 64" aria-hidden="true"><path d="M6 4 L6 60 L126 60"/><path d="M6 32 C 14 2, 22 2, 30 32 S 44 54, 52 32 S 62 18, 70 32 S 80 42, 86 32 S 94 26, 100 32 S 108 36, 112 32 S 118 30, 124 32"/><text x="14" y="10">x(t)</text></svg>`;

const scribblesRight = `
  <svg class="scribble sc-spiral" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 20 m0 -2 a2 2 0 1 1 -2 3 a5 5 0 1 1 7 -6 a9 9 0 1 1 -14 10 a13 13 0 1 1 22 -12 a17 17 0 1 1 -28 12"/></svg>
  <svg class="scribble sc-coffee is-minor" viewBox="0 0 120 120" aria-hidden="true"><path d="M60 6 C 92 5, 115 30, 114 60 C 113 92, 88 114, 58 114 C 28 113, 6 90, 7 60 C 8 34, 26 10, 52 7"/><path class="thin" d="M62 14 C 88 15, 106 36, 105 60"/></svg>
  <svg class="scribble sc-arrow" viewBox="0 0 34 18" aria-hidden="true"><path d="M2 10 C 10 6, 20 12, 30 9 M24 3 L31 9 L24 15"/></svg>
  <p class="scribble sc-bang" aria-hidden="true">!!</p>
  <svg class="scribble sc-zigzag is-minor" viewBox="0 0 100 34" aria-hidden="true"><path d="M4 20 L14 8 L20 26 L30 6 L36 28 L46 8 L52 26 L62 6 L68 28 L78 8 L84 24 L96 12 M2 17 C 30 12, 70 22, 98 15"/></svg>`;

const underline = `<svg class="underline" viewBox="0 0 240 14" aria-hidden="true"><path d="M2 9 C 50 3, 110 13, 170 6 S 225 7, 238 4"/><path class="thin" d="M30 12 C 90 8, 150 12, 200 9"/></svg>`;

// The screenshot as a photo print, taped in, with its caption on the frame.
function print(p, base) {
  const pic = p.cover
    ? `<img src="${base}${p.cover.src}" alt="${esc(p.t.alt)}" width="${p.cover.w}" height="${p.cover.h}" loading="lazy" decoding="async">`
    : neighbourhoodDrawing(p.t.alt);
  return `<figure class="print"><i class="tape" aria-hidden="true"></i><i class="tape is-2" aria-hidden="true"></i>
    ${pic}<figcaption>${esc(p.t.caption)}</figcaption></figure>`;
}

export const projectHref = (base, id) => `${base}projects/${id}/`;

function leftPage(p, u, base) {
  return `${scribblesLeft}
    <p class="page-cat">${esc(p.t.category)}</p>
    <h3 class="page-title" translate="no">${esc(p.t.name)}</h3>
    ${underline}
    ${print(p, base)}
    <div class="page-actions">
      <a class="button open-btn" href="${projectHref(base, p.id)}" aria-label="${esc(u.openLabel(p.t.name))}">${u.openProject}${inkSvg()}</a>
      ${p.repo ? `<a class="repo-link" href="${p.repo}" target="_blank" rel="noopener">${u.repo}</a>` : `<span class="private">${u.privateRepo}</span>`}
    </div>`;
}

function rightPage(p, u, i, n) {
  return `${scribblesRight}
    <p class="page-lede">${esc(p.t.body)}</p>
    <h4>${u.learnedHead}</h4>
    <ul class="learned">${p.t.learned.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
    <p class="page-stack"><b>${u.builtWith}</b> ${p.stack.map(esc).join(' · ')}</p>
    <p class="page-num">${i + 1} / ${n}</p>`;
}

export function spreads(P, u, base) {
  return P.map((p, i) => ({
    left: leftPage(p, u, base),
    right: rightPage(p, u, i, P.length),
    label: `${p.t.name} · ${u.of(i + 1, P.length)}`,
  }));
}

// The pen outline round the whole book, with a double stroke down the spine.
const bookInk = `<svg class="ink book-ink" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"><g>
  <path d="M6 9 C 180 4, 380 11, 500 6 C 650 2, 830 10, 994 5 C 998 200, 992 420, 996 610 C 999 790, 993 900, 995 993 C 820 998, 620 990, 500 995 C 320 999, 160 991, 5 996 C 2 800, 8 600, 4 400 C 1 240, 7 120, 6 9"/>
  <path class="ink-2" d="M14 3 C 260 10, 640 1, 988 11 M999 18 C 993 380, 1000 720, 991 986 M984 999 C 640 992, 300 1000, 12 990 M-1 980 C 6 640, -2 300, 9 16"/>
  <path class="spine" d="M500 6 C 503 260, 496 520, 501 760 C 503 880, 499 950, 500 995"/>
  <path class="spine ink-2" d="M506 30 C 509 300, 503 640, 507 970"/>
</g></svg>`;

export function workSection(P, u) {
  return `
    <section class="work" id="work" aria-labelledby="work-h">
      ${equations()}
      <div class="work-head">
        <h2 id="work-h" class="reveal">${u.workHead}</h2>
        <p class="reveal" style="--d:1">${u.workNote}</p>
      </div>
      <div class="book" data-book tabindex="-1" aria-roledescription="notebook">
        <div class="book-body">
          <div class="ribbons" role="group" aria-label="${u.workHead}">
            ${P.map((p) => `<button type="button" class="ribbon" data-tab><span translate="no">${esc(p.t.name)}</span></button>`).join('')}
          </div>
          <div class="book-block">
            <i class="book-shadow" aria-hidden="true"></i>
            <i class="marker-ribbon" aria-hidden="true"></i>
            <div class="book-stage" data-stage>
              <article class="page page-left" data-page="left"></article>
              <article class="page page-right" data-page="right"></article>
              <i class="cast is-left" data-shade="left" aria-hidden="true"></i>
              <i class="cast is-right" data-shade="right" aria-hidden="true"></i>
            </div>
            ${bookInk}
          </div>
        </div>
        <div class="book-nav">
          <button type="button" class="nav-btn" data-prev aria-label="${u.prevPage}">←</button>
          <p data-status aria-live="polite"></p>
          <button type="button" class="nav-btn" data-next aria-label="${u.nextPage}">→</button>
        </div>
        <p class="book-hint">${u.bookHint}</p>
      </div>
    </section>`;
}
