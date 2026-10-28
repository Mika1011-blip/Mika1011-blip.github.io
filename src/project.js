// Entry for the project pages (projects/<id>/index.html). The page arrives
// pre-rendered in English; this re-renders it in the reader's language and keeps
// the EN / FR toggle working.
import './styles.css';
import { renderProjectPage } from './project-page.js';
import { storedLang, saveLang } from './shared.js';

const app = document.getElementById('app');
const base = import.meta.env.BASE_URL;
const id = document.body.dataset.project;
// The site animates everywhere, as Chrome shows it: Edge reports reduced motion
// whenever Windows animation effects are off, and the owner wants the motion kept.
const reducedMotion = false;
let lang = storedLang();

function render() {
  const page = renderProjectPage({ id, lang, base });
  if (!page) return;
  document.documentElement.lang = lang;
  document.title = page.title;
  app.innerHTML = page.html;
  observeFigures();
  mountReel();
  app.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => {
    lang = b.dataset.lang;
    saveLang(lang);
    render();
    app.querySelector(`[data-lang="${lang}"]`).focus();
  }));
}

// the red pen draws its arrows as each figure comes into view
function observeFigures() {
  const figs = app.querySelectorAll('.annot');
  if (reducedMotion || !('IntersectionObserver' in window)) { figs.forEach((f) => f.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -20% 0px' });
  figs.forEach((f) => io.observe(f));
}

// The gallery reel: the arrows step one print at a time, and the counter and the
// arrows' disabled state follow whatever scrolling the reader does by hand.
function mountReel() {
  const track = app.querySelector('[data-reel-track]');
  if (!track) return;
  const items = [...track.children];
  const count = app.querySelector('[data-reel-count]');
  const [prev, next] = app.querySelectorAll('[data-reel]');
  // the print nearest the reel's left edge is the current one
  const current = () => {
    const left = track.getBoundingClientRect().left;
    let best = 0, d = Infinity;
    items.forEach((el, k) => { const x = Math.abs(el.getBoundingClientRect().left - left); if (x < d) { d = x; best = k; } });
    return best;
  };
  const sync = () => {
    const end = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    const k = end ? items.length - 1 : current();
    count.textContent = `${k + 1} / ${items.length}`;
    prev.disabled = track.scrollLeft <= 4;
    next.disabled = end;
  };
  const go = (dir) => {
    const k = Math.min(items.length - 1, Math.max(0, current() + dir));
    track.scrollTo({ left: items[k].offsetLeft - items[0].offsetLeft, behavior: 'smooth' });
  };
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { go(1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { go(-1); e.preventDefault(); }
  });
  track.addEventListener('scroll', sync, { passive: true });
  sync();
}

document.documentElement.classList.add('js');
render();
