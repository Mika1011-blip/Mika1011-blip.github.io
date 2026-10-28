import './styles.css';
import { CONTACT, PROJECTS, UI } from './content.js';
import { mountSampler } from './sampler.js';
import { mountSpacetime } from './spacetime.js';
import { mountBook } from './book.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const app = document.getElementById('app');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function storedLang() {
  try { const l = localStorage.getItem('lang'); if (l === 'en' || l === 'fr') return l; } catch {}
  return (navigator.language || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en';
}
let lang = storedLang();
let stopSampler = () => {};

// A row of semicircular scallops, drawn as one SVG path.
// Flat along the top, bumps hanging down; `flip` mirrors it for a top edge.
function scallops(n, flip = false) {
  const wdt = 100 / n;
  let d = 'M0 0';
  for (let i = 0; i < n; i++) d += ` A${wdt / 2} 10 0 0 0 ${(i + 1) * wdt} 0`;
  d += ' Z';
  return `<svg class="scallops${flip ? ' is-flipped' : ''}" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path d="${d}"/></svg>`;
}

// LifeIsGood has no screenshots yet: draw the idea instead (an address and the
// points of interest that pull on its rent estimate).
function neighbourhoodDrawing(alt) {
  const pois = [
    [120, 90, 'Metro'], [470, 70, 'School'], [540, 230, 'Market'],
    [430, 330, 'Clinic'], [110, 300, 'Park'], [60, 190, 'Bakery'], [300, 40, 'Bus'],
  ];
  const lines = pois.map(([x, y]) => `<path d="M300 190 Q ${(300 + x) / 2 + 12} ${(190 + y) / 2 - 10} ${x} ${y}"/>`).join('');
  const dots = pois.map(([x, y, l]) => `<circle cx="${x}" cy="${y}" r="9"/><text x="${x + 16}" y="${y + 5}">${l}</text>`).join('');
  return `<svg class="drawing" viewBox="0 0 640 400" role="img" aria-label="${esc(alt)}">
    <g class="rough">
      <g class="drawing-lines">${lines}</g>
      <g class="drawing-dots">${dots}</g>
      <rect x="276" y="160" width="48" height="44"/><path d="M268 164 L300 136 L332 164"/>
      <text class="drawing-big" x="300" y="246" text-anchor="middle">fair rent?</text>
    </g></svg>`;
}

function projectMedia(p, t) {
  const m = p.media;
  if (m.kind === 'video') {
    return `<figure class="page-media"><video src="${m.src}" poster="${m.poster}" muted loop playsinline preload="metadata"
      ${reducedMotion ? 'controls' : 'autoplay'} aria-label="${esc(t.alt)}" width="1600" height="1000"></video></figure>`;
  }
  if (m.kind === 'image') {
    return `<figure class="page-media"><img src="${m.src}" alt="${esc(t.alt)}" loading="lazy" width="1600" height="1000"></figure>`;
  }
  return `<figure class="page-media is-drawn">${neighbourhoodDrawing(t.alt)}</figure>`;
}

// One spread per project: the picture page and the write-up page.
function leftPage(p, u) {
  return `<h3 class="page-title">${esc(p.t.name)}</h3>
    ${projectMedia(p, p.t)}
    <p class="page-cat">${esc(p.t.category)}</p>
    <p class="page-stack">${p.stack.map(esc).join(' · ')}</p>`;
}
function rightPage(p, u) {
  return `<p class="page-lede">${esc(p.t.body)}</p>
    <h4>${u.learnedHead}</h4>
    <ul class="learned">${p.t.learned.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
    ${p.media.plate ? `<figure class="page-plate"><img src="${p.media.plate}" alt="${esc(p.t.plateAlt)}" loading="lazy" width="1600" height="1000"></figure>` : ''}
    ${p.repo ? `<a class="text-link" href="${p.repo}" target="_blank" rel="noopener">${u.repo}</a>` : `<p class="muted">${u.privateRepo}</p>`}`;
}

function render() {
  const u = UI[lang];
  const P = PROJECTS.map((p) => ({ ...p, t: p[lang] }));
  document.documentElement.lang = lang;
  document.title = lang === 'fr' ? 'Minh Khang Thai, ingénierie de l’IA' : 'Minh Khang Thai, AI engineering';

  // Three sections: who (with the sampled letter), the project notebook, contact.
  app.innerHTML = `
  <header class="bar">
    <a class="wordmark" href="#intro">Minh Khang Thai</a>
    <nav class="bar-nav" aria-label="${u.navLabel}">
      <a href="#intro">${u.nav[0]}</a><a href="#work">${u.nav[1]}</a><a href="#contact">${u.nav[2]}</a>
    </nav>
    <div class="bar-end">
      <div class="lang" role="group" aria-label="Language">
        <button type="button" data-lang="en" aria-pressed="${lang === 'en'}">EN</button>
        <button type="button" data-lang="fr" aria-pressed="${lang === 'fr'}">FR</button>
      </div>
      <a class="bar-link" href="${CONTACT.cv}" target="_blank" rel="noopener">${u.cv}</a>
    </div>
  </header>

  <main>
    <section class="s-intro" id="intro" aria-labelledby="intro-title">
      <div class="hero-copy">
        <h1 id="intro-title">${u.title}</h1>
        <p class="lede">${u.lede}</p>
      </div>
      <div class="intro-split" data-split>
        <div class="intro-left">
          <h2 class="reveal">${u.introHead}</h2>
          <p class="intro-note reveal" style="--d:1">${u.introNote}</p>
          <dl class="facts">
            ${u.facts.map(([k, v], i) => `
              <div class="fact" style="--d:${i + 2}">
                <dt>${k}${i === 1 ? '<svg class="pen-circle" viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M18 44 C 20 12, 172 6, 186 36 C 198 66, 40 78, 14 52 C 4 40, 30 22, 60 18"/></svg>' : ''}</dt>
                <dd>${v}</dd>
              </div>`).join('')}
          </dl>
          <figure class="plate reveal">
            <img src="img/einstein-cross.jpg" alt="${esc(u.crossAlt)}" width="1915" height="1849" loading="lazy">
            <figcaption>${u.crossCaption}</figcaption>
          </figure>
        </div>
        <article class="sheet" aria-labelledby="letter-h">
          <i class="sheet-paper" aria-hidden="true"></i>
          <h3 id="letter-h">${u.letterHead}</h3>
          <p class="sheet-note">${u.letterNote}</p>
          <div class="sampler" data-sampler>
            <div class="controls">
              <label for="temp">${u.temperature} <output data-temp-value for="temp">0.70</output></label>
              <input id="temp" type="range" min="0.1" max="1.6" step="0.05" value="0.7" data-temp>
              <button type="button" class="button" data-resample>${u.resample}</button>
            </div>
            <div class="dist">
              <h4>${u.distHead}</h4>
              <ol data-dist></ol>
            </div>
            <div class="letter" data-letter aria-live="polite"></div>
          </div>
          <p class="sign">${u.signoff}<span>${u.role}</span></p>
          ${scallops(10)}
        </article>
      </div>
    </section>

    <section class="work" id="work" aria-labelledby="work-h">
      <div class="work-head">
        <h2 id="work-h" class="reveal">${u.workHead}</h2>
        <p class="reveal" style="--d:1">${u.workNote}</p>
      </div>
      <div class="book" data-book tabindex="-1" aria-roledescription="notebook">
        <div class="ribbons" role="group" aria-label="${u.workHead}">
          ${P.map((p, i) => `<button type="button" class="ribbon" data-tab style="--i:${i}">${esc(p.t.name)}</button>`).join('')}
        </div>
        <div class="book-3d">
          <div class="book-cover" aria-hidden="true"><i class="headband is-top"></i><i class="headband is-bottom"></i><i class="marker-ribbon"></i></div>
          <div class="edges is-left" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          <div class="edges is-right" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          <div class="book-stage" data-stage>
            <div class="page page-left" data-page="left"></div>
            <div class="page page-right" data-page="right"></div>
            <i class="cast is-left" data-shade="left" aria-hidden="true"></i>
            <i class="cast is-right" data-shade="right" aria-hidden="true"></i>
          </div>
        </div>
        <div class="book-nav">
          <button type="button" class="button" data-prev aria-label="${u.prevPage}">←</button>
          <p data-status aria-live="polite"></p>
          <button type="button" class="button" data-next aria-label="${u.nextPage}">→</button>
        </div>
        <p class="book-hint">${u.bookHint}</p>
      </div>
    </section>

    <section class="contact" id="contact" aria-labelledby="contact-h">
      <form class="coupon" data-coupon>
        <div class="coupon-left">
          <h2 id="contact-h">${u.contactHead}</h2>
          <p>${u.contactNote}</p>
        </div>
        <div class="coupon-right">
          <label class="field"><span>${u.fName}</span><input name="name" autocomplete="name" required></label>
          <label class="field"><span>${u.fTopic}</span><select name="topic">${u.topics.map((t) => `<option>${t}</option>`).join('')}</select></label>
          <label class="field"><span>${u.fMessage}</span><textarea name="message" rows="3" required></textarea></label>
          <button class="button is-light is-wide" type="submit">${u.send}</button>
        </div>
      </form>
      <div class="postcard">
        ${scallops(12, true)}
        <div class="postcard-left">
          <h3>${u.footHead}</h3>
          <p>${u.footNote}</p>
        </div>
        <div class="postcard-right">
          <figure class="stamp"><img src="img/double-einstein-ring.jpg" alt="${esc(u.stampAlt)}" width="1920" height="1320" loading="lazy"></figure>
          <ul class="address">
            <li><a href="mailto:${CONTACT.email}">${CONTACT.email}</a></li>
            <li><a href="${CONTACT.github}" target="_blank" rel="noopener">GitHub</a></li>
            <li><a href="${CONTACT.linkedin}" target="_blank" rel="noopener">LinkedIn</a></li>
            <li><a href="${CONTACT.cv}" target="_blank" rel="noopener">${u.cv}</a></li>
          </ul>
        </div>
      </div>
    </section>
  </main>

  <footer class="foot">
    <p class="foot-name" aria-hidden="true">Minh Khang Thai</p>
    <p class="imprint">© 2026 Minh Khang Thai · ${u.credits}</p>
  </footer>`;


  app.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => {
    lang = b.dataset.lang;
    try { localStorage.setItem('lang', lang); } catch {}
    render();
    app.querySelector(`[data-lang="${lang}"]`).focus();
  }));

  app.querySelector('[data-coupon]').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const subject = `${f.get('topic')} · ${f.get('name')}`;
    location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(f.get('message'))}`;
  });

  mountBook(app.querySelector('[data-book]'), {
    pages: P.map((p) => ({ left: leftPage(p, u), right: rightPage(p, u), label: `${p.t.name} · ${p.t.category}` })),
    reducedMotion,
  });

  stopSampler();
  stopSampler = mountSampler(app.querySelector('[data-sampler]'), lang, { reducedMotion });
  observeReveals();
}

function observeReveals() {
  const els = app.querySelectorAll('.reveal, .fact, .sheet, .book, .coupon, .postcard');
  if (reducedMotion || !('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -10% 0px' });
  els.forEach((el) => io.observe(el));
}

document.documentElement.classList.add('js');
render();
// The spacetime paper lies under the whole first section; its masses drift in
// the open band between the lede and the intro split.
const paper = document.querySelector('.paper');
const fitPaper = () => { paper.style.height = `${document.getElementById('intro').offsetHeight + 80}px`; };
new ResizeObserver(fitPaper).observe(app);
fitPaper();
mountSpacetime(document.getElementById('spacetime'), {
  reducedMotion,
  band: () => {
    const lede = app.querySelector('.lede'), split = app.querySelector('[data-split]');
    return (lede.getBoundingClientRect().bottom + split.getBoundingClientRect().top) / 2 - paper.getBoundingClientRect().top;
  },
});
