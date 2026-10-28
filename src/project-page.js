// A project page: the annotated lab log. One pure function renders it from
// content.js, so vite.config.js can pre-render every page at build time (it reads
// without JavaScript) and project.js can re-render it when the language changes.
import { CONTACT, PROJECTS, UI } from './content.js';
import { esc, inkSvg, langToggle, neighbourhoodDrawing, nextIndex } from './shared.js';
import { projectHref } from './work.js';

// Figure geometry, in the units of the arrows' viewBox: the print is FIG.w wide
// with a FIG.pad border, and a FIG.band strip above and below holds the notes.
const FIG = { w: 840, pad: 12, band: 80 };

function figureBox(f) {
  const imgH = ((FIG.w - 2 * FIG.pad) * f.h) / f.w;
  const frameH = imgH + 2 * FIG.pad;
  return { H: Math.round(FIG.band * 2 + frameH), frameH };
}

// A pen arrow that bows a little to one side, with an open head.
function arrow([fx, fy], [tx, ty]) {
  const dx = tx - fx, dy = ty - fy, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len, k = len * 0.16;
  const c1 = [fx + dx * 0.3 + nx * k, fy + dy * 0.3 + ny * k];
  const c2 = [fx + dx * 0.72 + nx * k * 0.5, fy + dy * 0.72 + ny * k * 0.5];
  const a = Math.atan2(ty - c2[1], tx - c2[0]), h = 13, s = 0.5;
  const p = (n) => n.toFixed(1);
  return `<path pathLength="1" d="M${p(fx)} ${p(fy)} C ${p(c1[0])} ${p(c1[1])}, ${p(c2[0])} ${p(c2[1])}, ${p(tx)} ${p(ty)}"/>`
    + `<path pathLength="1" d="M${p(tx - h * Math.cos(a - s))} ${p(ty - h * Math.sin(a - s))} L${p(tx)} ${p(ty)} L${p(tx - h * Math.cos(a + s))} ${p(ty - h * Math.sin(a + s))}"/>`;
}

function figure(f, i, lang, base, u) {
  const { H, frameH } = figureBox(f);
  const px = ([x, y]) => [(x / 100) * FIG.w, (y / 100) * H];
  const ink = f.notes.map((n, k) => {
    const to = px(n.to);
    const ring = n.ring ? `<ellipse pathLength="1" cx="${to[0].toFixed(1)}" cy="${to[1].toFixed(1)}" rx="${((n.ring[0] / 100) * FIG.w).toFixed(1)}" ry="${((n.ring[1] / 100) * H).toFixed(1)}"/>` : '';
    return `<g style="--k:${k}">${arrow(px(n.from), to)}${ring}</g>`;
  }).join('');
  // on a phone the arrows give way to numbered pins on the print
  const pins = f.notes.map((n, k) => {
    const [x, y] = px(n.to);
    return `<span class="annot-pin" style="left:${((x / FIG.w) * 100).toFixed(2)}%;top:${(((y - FIG.band) / frameH) * 100).toFixed(2)}%">${k + 1}</span>`;
  }).join('');
  const pic = f.drawing
    ? neighbourhoodDrawing(f.alt[lang])
    : `<img src="${base}${f.src}" alt="${esc(f.alt[lang])}" width="${f.w}" height="${f.h}" loading="${i ? 'lazy' : 'eager'}" decoding="async">`;
  const hid = `fig-${i + 1}`;
  return `
  <section class="pp-fig is-${f.side}" aria-labelledby="${hid}">
    <div class="pp-fig-copy">
      <h2 id="${hid}">${esc(f.head[lang])}</h2>
      ${f.body[lang].map((b) => `<p>${esc(b)}</p>`).join('')}
    </div>
    <figure class="annot" style="aspect-ratio:${FIG.w} / ${H};--top:${((FIG.band / H) * 100).toFixed(2)}%">
      <div class="annot-frame">${pic}<span aria-hidden="true">${pins}</span></div>
      <svg class="annot-ink" viewBox="0 0 ${FIG.w} ${H}" aria-hidden="true"><g>${ink}</g></svg>
      <figcaption><ol class="annot-notes" aria-label="${u.notesLabel}">${f.notes.map((n) =>
        `<li style="left:${n.at[0]}%;top:${n.at[1]}%;width:${n.w || 30}%">${esc(n.text[lang])}</li>`).join('')}</ol></figcaption>
    </figure>
  </section>`;
}

// The phrase to circle in red pen, if the lede has one.
const circled = '<svg viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M8 22 C 6 6, 100 2, 114 16 C 122 30, 40 40, 12 30 C 2 26, 6 14, 22 8"/></svg>';
function lede(t) {
  const body = esc(t.body);
  if (!t.circle || !body.includes(esc(t.circle))) return body;
  return body.replace(esc(t.circle), `<span class="circled">${esc(t.circle)}${circled}</span>`);
}

function video(p, t, base, u) {
  const v = p.video;
  if (!v) return '';
  const media = v.href
    ? `<a class="pp-watch" href="${v.href}" target="_blank" rel="noopener">
        <img src="${base}${v.poster}" alt="" loading="lazy" decoding="async" width="1600" height="900">
        <span class="pp-watch-label"><svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="36"/><path d="M32 26 L56 40 L32 54 Z"/></svg>${u.watch} <span class="visually-hidden">(YouTube)</span></span>
      </a>`
    : `<video controls muted playsinline preload="none" poster="${base}${v.poster}" width="1600" height="900"><source src="${base}${v.src}" type="video/mp4"></video>`;
  return `<figure class="pp-video">${media}<figcaption>${esc(t.videoCaption || '')}</figcaption></figure>`;
}

// Every screen and clip of the project, as a row of prints at the foot of the
// page that scrolls sideways (swipe, trackpad, or the arrow buttons, which
// project.js wires up); the annotated figures above keep only the key screens.
function gallery(p, lang, base, u) {
  if (!p.gallery) return '';
  const item = (g, k) => {
    const cap = `<figcaption>${esc(g.caption[lang])}</figcaption>`;
    const media = g.video
      ? `<video controls muted playsinline preload="metadata" src="${base}${g.video}"></video>`
      : `<a href="${base}${g.src}" target="_blank" rel="noopener"><img src="${base}${g.thumb || g.src}" alt="${esc(g.caption[lang])}" width="${g.w}" height="${g.h}" loading="lazy" decoding="async"><span class="visually-hidden"> (${u.fullSize})</span></a>`;
    return `<figure class="sheet-print${g.video ? ' is-video' : ''}" style="--r:${[-0.8, 0.6, -0.3, 0.9][k % 4]}deg">${media}${cap}</figure>`;
  };
  return `
    <section class="pp-gallery" aria-labelledby="gallery-h">
      <div class="pp-gallery-top">
        <div>
          <h2 id="gallery-h">${u.galleryHead}</h2>
          <p class="pp-gallery-note">${u.galleryNote}</p>
        </div>
        <div class="reel-nav">
          <button type="button" class="nav-btn" data-reel="-1" aria-label="${u.reelPrev}">←</button>
          <span class="reel-count" data-reel-count aria-live="polite">1 / ${p.gallery.length}</span>
          <button type="button" class="nav-btn" data-reel="1" aria-label="${u.reelNext}">→</button>
        </div>
      </div>
      <div class="reel" data-reel-track tabindex="0" role="region" aria-label="${u.galleryHead}">${p.gallery.map(item).join('')}</div>
    </section>`;
}

export function renderProjectPage({ id, lang, base }) {
  const i = PROJECTS.findIndex((p) => p.id === id);
  if (i < 0) return null;
  const p = PROJECTS[i], t = p[lang], u = UI[lang];
  const next = PROJECTS[nextIndex(i, PROJECTS.length)], nt = next[lang];
  const html = `
  <a class="skip" href="#main">${u.skip}</a>
  <main class="pp" id="main">
    <nav class="pp-bar" aria-label="${u.projectNav}">
      <a href="${base}?project=${p.id}#work"><span aria-hidden="true">←</span> ${u.allProjects}</a>
      ${langToggle(lang)}
      <a href="${projectHref(base, next.id)}">${u.nextShort}: ${esc(nt.name)} <span aria-hidden="true">→</span></a>
    </nav>

    <header class="pp-head">
      <div class="pp-head-copy">
        <p class="pp-cat">${esc(t.category)}</p>
        <h1 translate="no">${esc(t.name)}</h1>
        <p class="pp-lede">${lede(t)}</p>
      </div>
      <dl class="pp-card">
        <div><dt>${u.roleLabel}</dt><dd>${esc(t.role)}</dd></div>
        <div><dt>${u.builtWith}</dt><dd>${p.stack.map(esc).join(' · ')}</dd></div>
        <div><dt>${u.when}</dt><dd>${esc(t.year)}</dd></div>
        <div><dt>${u.code}</dt><dd>${p.repo ? `<a href="${p.repo}" target="_blank" rel="noopener">${u.repo}</a>` : `<i>${u.privateRepo}</i>`}</dd></div>
        ${inkSvg()}
      </dl>
    </header>

    ${p.figures.map((f, k) => figure(f, k, lang, base, u)).join('')}

    <section class="pp-learn${p.video ? '' : ' is-solo'}" aria-labelledby="learned-h">
      <div class="pp-lessons">
        <h2 id="learned-h">${u.learnedHead}</h2>
        <div class="slips">${t.learned.map((l) => `<p class="slip">${esc(l)}${inkSvg()}</p>`).join('')}</div>
      </div>
      ${video(p, t, base, u)}
    </section>

    ${gallery(p, lang, base, u)}

    <a class="next-card" href="${projectHref(base, next.id)}">
      <span>
        <span class="next-k">${u.nextProject}</span>
        <span class="next-n" translate="no">${esc(nt.name)}</span>
        <span class="next-c">${esc(nt.category)}</span>
      </span>
      <span class="next-arrow" aria-hidden="true">→</span>
    </a>
  </main>
  <footer class="pp-foot">
    <p>© 2026 Minh Khang Thai · <a href="mailto:${CONTACT.email}">${CONTACT.email}</a> · <a href="${CONTACT.github}" target="_blank" rel="noopener">GitHub</a></p>
  </footer>`;
  return { html, title: `${t.name} · Minh Khang Thai`, description: `${t.category}. ${t.body}` };
}

// The whole static document for projects/<id>/index.html, in English.
export function projectDocument(id, base) {
  const page = renderProjectPage({ id, lang: 'en', base });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#e6dbc7">
<meta name="description" content="${esc(page.description)}">
<title>${esc(page.title)}</title>
<link rel="icon" href="${base}favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&display=swap" rel="stylesheet">
</head>
<body class="is-project" data-project="${id}">
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <filter id="rough"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="3.5"/></filter>
</svg>
<div id="app">${page.html}</div>
<script type="module" src="/src/project.js"></script>
</body>
</html>
`;
}
