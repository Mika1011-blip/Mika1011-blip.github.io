// Helpers shared by the home page and the project pages. Nothing here touches
// the DOM at import time, so vite.config.js can import it to pre-render pages.

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function storedLang() {
  try { const l = localStorage.getItem('lang'); if (l === 'en' || l === 'fr') return l; } catch {}
  return (navigator.language || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en';
}
export function saveLang(l) { try { localStorage.setItem('lang', l); } catch {} }

export const langToggle = (lang) => `<div class="lang" role="group" aria-label="Language">
  <button type="button" data-lang="en" aria-pressed="${lang === 'en'}">EN</button>
  <button type="button" data-lang="fr" aria-pressed="${lang === 'fr'}">FR</button>
</div>`;

// Black pen outlines, drawn twice and a little off, like a quick sketch around
// each paper object. The SVG stretches to the element; the stroke keeps its width.
export const INKED = '.sheet, .plate, .postcard, .button, .stamp, .dist, .pp-card, .slip';
function roughRect(j) {
  const r = () => (Math.random() - 0.5) * j;
  const o = () => -1.2 + Math.random() * 1.6; // corners overshoot like a hand-drawn box
  return `M${o()} ${r()} L${100 + r()} ${o()} L${100 - o()} ${100 + r()} L${r()} ${100 - o()} Z`;
}
export const inkSvg = () => `<svg class="ink" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <path d="${roughRect(1.2)}"/><path class="ink-2" d="${roughRect(1.8)}"/></svg>`;
export function inkOutline(el) {
  if (!el.querySelector(':scope > .ink')) el.insertAdjacentHTML('beforeend', inkSvg());
}

// LifeIsGood has no screenshots yet: draw the idea instead (an address and the
// points of interest that pull on its rent estimate).
export function neighbourhoodDrawing(alt) {
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

// The page index of the project after `i`, wrapping round.
export const nextIndex = (i, n) => (i + 1) % n;
