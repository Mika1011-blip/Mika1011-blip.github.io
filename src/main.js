import './styles.css';
import { CONTACT, PROJECTS, UI } from './content.js';
import { mountSampler } from './sampler.js';
import { mountSpacetime } from './spacetime.js';
import { mountBook } from './book.js';
import { esc, storedLang, saveLang, langToggle, INKED, inkOutline } from './shared.js';
import { workSection, spreads } from './work.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const app = document.getElementById('app');
const BASE = import.meta.env.BASE_URL;
let lang = storedLang();
// A project page links back with ?project=<id>, so the notebook opens on it.
function startProject() {
  const id = new URLSearchParams(location.search).get('project');
  return Math.max(0, PROJECTS.findIndex((p) => p.id === id));
}
let stopSampler = () => {};
let space = null; // the spacetime paper, once mounted
let book = null;  // the notebook, so a language switch keeps its page

// A row of semicircular scallops, drawn as one SVG path.
// Flat along the top, bumps hanging down; `flip` mirrors it for a top edge.
function scallops(n, flip = false) {
  const wdt = 100 / n;
  let d = 'M0 0';
  for (let i = 0; i < n; i++) d += ` A${wdt / 2} 10 0 0 0 ${(i + 1) * wdt} 0`;
  d += ' Z';
  return `<svg class="scallops${flip ? ' is-flipped' : ''}" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path d="${d}"/></svg>`;
}

function render() {
  const u = UI[lang];
  const P = PROJECTS.map((p) => ({ ...p, t: p[lang] }));
  document.documentElement.lang = lang;
  document.title = lang === 'fr' ? 'Minh Khang Thai, ingénierie de l’IA' : 'Minh Khang Thai, AI engineering';

  // Three sections: who (with the sampled letter), the project notebook, contact.
  app.innerHTML = `
  <a class="skip" href="#main">${u.skip}</a>
  <header class="bar">
    <a class="wordmark" href="#intro">Minh Khang Thai</a>
    <nav class="bar-nav" aria-label="${u.navLabel}">
      <a href="#intro">${u.nav[0]}</a><a href="#work">${u.nav[1]}</a><a href="#contact">${u.nav[2]}</a>
    </nav>
    <div class="bar-end">
      ${langToggle(lang)}
      <a class="bar-link" href="${CONTACT.cv}" target="_blank" rel="noopener">${u.cv}</a>
    </div>
  </header>

  <main id="main">
    <section class="s-intro" id="intro" aria-labelledby="intro-title">
      <div class="hero-copy">
        <h1 id="intro-title">${u.title}</h1>
        <p class="lede">${u.lede}</p>
        <div class="ball-tools" role="group" aria-label="${u.ballsLabel}">
          <button type="button" class="button is-sketch" data-ball="add">+ ${u.addBall}</button>
          <button type="button" class="button is-sketch" data-ball="remove">− ${u.removeBall}</button>
          <span class="ball-count" data-ball-count aria-live="polite"></span>
        </div>
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

    ${workSection(P, u)}

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
    saveLang(lang);
    render();
    app.querySelector(`[data-lang="${lang}"]`).focus();
  }));

  app.querySelector('[data-coupon]').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const subject = `${f.get('topic')} · ${f.get('name')}`;
    location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(f.get('message'))}`;
  });

  book = mountBook(app.querySelector('[data-book]'), { pages: spreads(P, u, BASE), reducedMotion, at: book ? book.current() : startProject() });

  const count = app.querySelector('[data-ball-count]');
  const showCount = (n) => { count.textContent = u.ballCount(n); };
  app.querySelectorAll('[data-ball]').forEach((b) => b.addEventListener('click', () => {
    if (space) showCount(b.dataset.ball === 'add' ? space.add() : space.remove());
  }));
  if (space) showCount(space.count());

  app.querySelectorAll(INKED).forEach(inkOutline);

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
space = mountSpacetime(document.getElementById('spacetime'), {
  reducedMotion,
  band: () => {
    const lede = app.querySelector('.lede'), split = app.querySelector('[data-split]');
    return (lede.getBoundingClientRect().bottom + split.getBoundingClientRect().top) / 2 - paper.getBoundingClientRect().top;
  },
});
app.querySelector('[data-ball-count]').textContent = UI[lang].ballCount(space.count());
