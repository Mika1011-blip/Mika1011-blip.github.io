// Entry for the project pages (projects/<id>/index.html). The page arrives
// pre-rendered in English; this re-renders it in the reader's language and keeps
// the EN / FR toggle working.
import './styles.css';
import { renderProjectPage } from './project-page.js';
import { storedLang, saveLang } from './shared.js';

const app = document.getElementById('app');
const base = import.meta.env.BASE_URL;
const id = document.body.dataset.project;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let lang = storedLang();

function render() {
  const page = renderProjectPage({ id, lang, base });
  if (!page) return;
  document.documentElement.lang = lang;
  document.title = page.title;
  app.innerHTML = page.html;
  observeFigures();
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

document.documentElement.classList.add('js');
render();
