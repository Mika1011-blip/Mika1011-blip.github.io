#!/usr/bin/env python3
"""The portfolio film: an art-direction explainer, a tour of the real site and a
closing card, with a soft soundtrack, in the site's own style.

Runs inside the ai-workspace/renderer-html image (Python, Playwright Chromium,
ffmpeg), with the repository mounted at /work and the site built into dist/:

  npm run build
  docker run --rm -v "<repo>:/work" --entrypoint python ai-workspace/renderer-html \
      /work/video/film.py all

Steps (each can run alone): explainer, outro, tour, sound, final, all.
Everything lands in video/out/ (gitignored); the film is video/out/portfolio-film.mp4.

The explainer and the closing card are canvas pages drawn as a pure function of
time (video/explainer.html, window.seek). The tour drives the built site in
Chromium on Playwright's fake clock: the clock only moves when a frame is
taken, so the masses, the letter and the page turns play back frame-exact.
"""

import base64
import functools
import http.server
import json
import math
import struct
import subprocess
import sys
import threading
from pathlib import Path

ROOT = Path('/work')
VIDEO = ROOT / 'video'
OUT = VIDEO / 'out'
SITE = ROOT / 'dist'
W, H, FPS = 1920, 1080, 30
PORT = 8765


def log(msg):
    print(msg, flush=True)


def encoder(path, codec='mjpeg'):
    """An ffmpeg process that turns piped JPEG frames into an H.264 file."""
    return subprocess.Popen(
        ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(FPS), '-c:v', codec, '-i', '-',
         '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', str(path)],
        stdin=subprocess.PIPE)


def finish(enc, path):
    enc.stdin.close()
    if enc.wait() != 0:
        raise RuntimeError(f'ffmpeg failed on {path}')


def serve(directory, port):
    """Serve a folder over HTTP in the background (the built site, the video pages)."""
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(directory))
    handler.log_message = lambda *a: None
    httpd = http.server.ThreadingHTTPServer(('127.0.0.1', port), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


# ---------------------------------------------------------------- canvas pages

def render_canvas(browser, url, out, cues_out):
    page = browser.new_page(viewport={'width': W, 'height': H})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(url, wait_until='load', timeout=60_000)
    page.wait_for_function("() => typeof window.seek === 'function'", timeout=30_000)
    page.evaluate('async () => { await window.ready; await document.fonts.ready; }')
    duration = float(page.evaluate('() => window.DURATION'))
    frames = round(duration * FPS)
    log(f'{out.name}: {duration}s, {frames} frames')
    enc = encoder(out)
    for i in range(frames):
        data = page.evaluate(f"() => {{ window.seek({i / FPS}); return document.querySelector('canvas').toDataURL('image/jpeg', 0.95); }}")
        enc.stdin.write(base64.b64decode(data.split(',', 1)[1]))
        if i % (FPS * 10) == 0:
            log(f'  frame {i}/{frames}')
    finish(enc, out)
    cues_out.write_text(json.dumps({'duration': duration, 'cues': page.evaluate('() => window.CUES')}))
    if errors:
        log('page errors: ' + '; '.join(errors[:5]))
    page.close()


def explainer(browser):
    httpd = serve(VIDEO, PORT + 1)
    try:
        render_canvas(browser, f'http://127.0.0.1:{PORT + 1}/explainer.html?render', OUT / 'explainer.mp4', OUT / 'explainer.json')
    finally:
        httpd.shutdown()


def outro(browser):
    httpd = serve(VIDEO, PORT + 1)
    try:
        render_canvas(browser, f'http://127.0.0.1:{PORT + 1}/explainer.html?render#outro', OUT / 'outro.mp4', OUT / 'outro.json')
    finally:
        httpd.shutdown()


# ---------------------------------------------------------------- the tour

# Injected into every page of the tour: a drawn cursor (headless screenshots have
# none), a red ring for clicks, and a caption slip in the site's style.
OVERLAY = r"""
try { localStorage.setItem('lang', 'en'); } catch {}
window.addEventListener('DOMContentLoaded', () => {
  const css = document.createElement('style');
  css.textContent = `
    html { scroll-behavior: auto !important; }
    #film-cap { position: fixed; left: 56px; bottom: 52px; z-index: 2147483000; max-width: 820px;
      padding: 18px 30px 20px; background: #f5f0e6; border: 2.5px solid #1d1b19; box-shadow: 3px 3px 0 #c9bca4;
      rotate: -1deg; font: 700 38px/1.2 'Kalam', cursive; color: #b3291f; opacity: 0; pointer-events: none; }
    #film-cap span { display: block; font: 400 26px/1.2 'Kalam', cursive; color: #3a5aa8; margin-bottom: 4px; }
    #film-cursor { position: fixed; left: 0; top: 0; z-index: 2147483001; width: 34px; height: 52px; pointer-events: none; }
    #film-ring { position: fixed; z-index: 2147483000; width: 60px; height: 60px; margin: -30px 0 0 -30px; border: 4px solid #b3291f;
      border-radius: 50%; opacity: 0; pointer-events: none; }`;
  document.head.appendChild(css);
  const cap = document.createElement('div'); cap.id = 'film-cap';
  const cur = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); cur.id = 'film-cursor';
  cur.setAttribute('viewBox', '-3 -3 40 58');
  cur.innerHTML = '<path d="M0 0 L0 44 L11 34 L19 52 L27 48 L19 31 L33 31 Z" fill="#fbf7ef" stroke="#1d1b19" stroke-width="2.6" stroke-linejoin="round"/>';
  const ring = document.createElement('div'); ring.id = 'film-ring';
  document.body.append(cap, ring, cur);
  window.__film = (s) => {
    cur.style.transform = `translate(${s.x}px, ${s.y}px)`;
    if (cap.dataset.text !== s.text) { cap.dataset.text = s.text; cap.innerHTML = s.text ? `<span>${s.kicker}</span>${s.text}` : ''; }
    cap.style.opacity = s.capA;
    cap.style.clipPath = `inset(0 ${(1 - s.capW) * 100}% 0 0)`;
    ring.style.left = s.rx + 'px'; ring.style.top = s.ry + 'px';
    ring.style.opacity = s.ringA; ring.style.transform = `scale(${s.ringS})`;
    if (s.scroll != null) window.scrollTo(0, s.scroll);
  };
});
"""


class Tour:
    """Steps the page one frame at a time and records it."""

    def __init__(self, page, enc):
        self.page, self.enc = page, enc
        self.frame = 0
        self.x, self.y = 1700.0, 1000.0
        self.caption = ('', '', -1)      # text, kicker, start frame
        self.ring = None                 # (x, y, start frame)
        self.scroll = None               # pending scroll position for this frame
        self.cues = []                   # (seconds, kind) for the soundtrack
        self.ms = 0.0

    @property
    def t(self):
        return self.frame / FPS

    def shoot(self):
        cap_text, kicker, c0 = self.caption
        age = (self.frame - c0) / FPS if c0 >= 0 else 0
        ring_age = (self.frame - self.ring[2]) / FPS if self.ring else 9
        state = {
            'x': self.x, 'y': self.y, 'text': cap_text, 'kicker': kicker,
            'capA': min(1, age / 0.25) if cap_text else 0, 'capW': min(1, age / 0.9) if cap_text else 0,
            'rx': self.ring[0] if self.ring else 0, 'ry': self.ring[1] if self.ring else 0,
            'ringA': max(0, 1 - ring_age / 0.45), 'ringS': 0.5 + ring_age * 2.2,
            'scroll': self.scroll,
        }
        self.page.evaluate('(s) => window.__film && window.__film(s)', state)
        self.scroll = None
        # the clock moves 1/30 s per frame, rounded to whole milliseconds
        self.ms += 1000 / FPS
        step = int(self.ms); self.ms -= step
        self.page.clock.run_for(step)
        self.enc.stdin.write(self.page.screenshot(type='jpeg', quality=92))
        self.frame += 1
        if self.frame % 300 == 0:
            log(f'tour: frame {self.frame} ({self.t:.0f}s)')

    def wait(self, sec):
        for _ in range(round(sec * FPS)):
            self.shoot()

    def say(self, text, kicker):
        self.caption = (text, kicker, self.frame)
        self.cues.append((self.t, 'write'))

    def move(self, x, y, sec=1.0, hover=True):
        x0, y0, n = self.x, self.y, max(1, round(sec * FPS))
        for i in range(1, n + 1):
            p = i / n; p = 4 * p ** 3 if p < 0.5 else 1 - (-2 * p + 2) ** 3 / 2
            self.x, self.y = x0 + (x - x0) * p, y0 + (y - y0) * p
            if hover:
                self.page.mouse.move(self.x, self.y)
            self.shoot()

    def wander(self, points, sec):
        """A smooth path through points (Catmull-Rom), the site feeling every move."""
        pts = [(self.x, self.y)] + points
        pts = [pts[0]] + pts + [pts[-1]]
        n = max(1, round(sec * FPS)); segs = len(pts) - 3
        for i in range(1, n + 1):
            u = i / n * segs; k = min(int(u), segs - 1); s = u - k
            p0, p1, p2, p3 = pts[k], pts[k + 1], pts[k + 2], pts[k + 3]
            def cr(a, b, c, d):
                return 0.5 * (2 * b + (-a + c) * s + (2 * a - 5 * b + 4 * c - d) * s * s + (-a + 3 * b - 3 * c + d) * s ** 3)
            self.x, self.y = cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])
            self.page.mouse.move(self.x, self.y)
            self.shoot()

    def click(self, shoot=True):
        self.page.mouse.click(self.x, self.y)
        self.ring = (self.x, self.y, self.frame)
        self.cues.append((self.t, 'click'))
        if shoot:  # not while the page is navigating away
            self.shoot()

    def center(self, selector, nth=0):
        r = self.page.evaluate("([s, n]) => { const e = document.querySelectorAll(s)[n]; const b = e.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2, b.width, b.height]; }", [selector, nth])
        return r

    def doc_top(self, selector):
        return self.page.evaluate("(s) => document.querySelector(s).getBoundingClientRect().top + scrollY", selector)

    def scroll_to(self, y, sec=1.5):
        y0 = self.page.evaluate('() => scrollY')
        y = max(0, min(y, self.page.evaluate('() => document.documentElement.scrollHeight - innerHeight')))
        n = max(1, round(sec * FPS))
        for i in range(1, n + 1):
            p = i / n; p = 4 * p ** 3 if p < 0.5 else 1 - (-2 * p + 2) ** 3 / 2
            self.scroll = y0 + (y - y0) * p
            self.shoot()
        self.page.mouse.move(self.x, self.y)

    def drag(self, x1, y1, x2, y2, sec=1.0):
        self.move(x1, y1, 0.5)
        self.page.mouse.down()
        self.move(x2, y2, sec)
        self.page.mouse.up()
        self.shoot()

    def settle(self):
        """After a navigation: fonts in, clock paused again."""
        self.page.wait_for_load_state('load')
        self.page.evaluate('async () => { await document.fonts.ready; }')
        # Python's clock API counts in seconds, the page in milliseconds
        self.page.clock.pause_at((self.page.evaluate('() => Date.now()') + 50) / 1000)


def tour(browser):
    httpd = serve(SITE, PORT)
    try:
        ctx = browser.new_context(viewport={'width': W, 'height': H}, device_scale_factor=1)
        ctx.add_init_script(OVERLAY)
        page = ctx.new_page()
        page.clock.install()
        page.goto(f'http://127.0.0.1:{PORT}/', wait_until='load')
        enc = encoder(OUT / 'tour.mp4')
        r = Tour(page, enc)
        r.settle()
        r.page.mouse.move(r.x, r.y)

        # 1. the hero: the cursor has mass
        band = page.evaluate("() => { const l = document.querySelector('.lede').getBoundingClientRect(), s = document.querySelector('[data-split]').getBoundingClientRect(); return (l.bottom + s.top) / 2; }")
        r.wait(0.6)
        r.say('Move the cursor: it has mass, and the paper bends', '1 · the hero')
        r.wander([(1350, band - 40), (1000, band + 30), (700, band - 20), (1050, band + 10), (1300, band - 30), (900, band + 20)], 7.0)
        r.say('Add a mass, or take one away', '1 · the hero')
        bx, by, _, _ = r.center('[data-ball="add"]')
        r.move(bx, by, 0.8); r.wait(0.2); r.click(); r.wait(0.5); r.click(); r.wait(0.4)
        r.wander([(1100, band), (800, band + 20), (1200, band - 10)], 3.0)

        # 2. the letter, written token by token
        r.say('A tiny model writes this letter, token by token', '2 · the letter')
        r.scroll_to(r.doc_top('[data-sampler]') - 140, 1.6)
        bx, by, _, _ = r.center('[data-resample]')
        r.move(bx, by, 0.8); r.click(); r.wait(3.2)
        r.say('Turn the temperature up: the rare words start to win', '2 · the letter')
        sx, sy, sw, _ = r.center('[data-temp]')
        knob = sx - sw / 2 + sw * (0.7 - 0.1) / 1.5
        r.drag(knob, sy, sx + sw / 2 - 4, sy, 1.0)
        r.wait(3.6)

        # 3. the notebook
        r.say('Every project is a spread in a notebook', '3 · the projects')
        r.scroll_to(r.doc_top('#work') - 10, 1.8)
        r.wait(0.6)
        bx, by, _, _ = r.center('[data-next]')
        r.move(bx, by, 0.9); r.click(); r.wait(1.4); r.click(); r.wait(1.4)
        r.say('Drag a corner to turn a page by hand', '3 · the projects')
        st = page.evaluate("() => { const b = document.querySelector('[data-stage]').getBoundingClientRect(); return [b.x, b.y, b.width, b.height]; }")
        r.drag(st[0] + st[2] - 40, st[1] + st[3] - 80, st[0] + st[2] * 0.22, st[1] + st[3] * 0.62, 1.3)
        r.cues.append((r.t, 'page'))
        r.wait(1.4)
        r.say('Bookmark ribbons jump straight to a project', '3 · the projects')
        bx, by, _, _ = r.center('[data-tab]', 0)
        r.move(bx, by, 0.9); r.click(); r.wait(3.0)

        # 4. a project page
        r.say('Open a project: its lab log', '4 · a project page')
        bx, by, _, _ = r.center('.open-btn')
        r.move(bx, by, 0.9); r.wait(0.2)
        with page.expect_navigation():
            r.click(shoot=False)
        r.settle()
        r.shoot(); r.wait(1.4)
        r.say('Annotated screens, in red pen', '4 · a project page')
        r.scroll_to(r.doc_top('.pp-fig') - 60, 2.0); r.wait(2.2)
        r.scroll_to(page.evaluate("() => document.querySelectorAll('.pp-fig')[1].getBoundingClientRect().top + scrollY") - 60, 1.8); r.wait(2.0)
        r.say('What it taught me, and the build story', '4 · a project page')
        r.scroll_to(r.doc_top('.pp-learn') - 80, 2.0); r.wait(2.0)
        r.say('Then a reel of every screen', '4 · a project page')
        r.scroll_to(r.doc_top('.pp-gallery') - 80, 1.8)
        bx, by, _, _ = r.center('[data-reel="1"]')
        r.move(bx, by, 0.8); r.click(); r.wait(0.9); r.click(); r.wait(0.9); r.click(); r.wait(1.2)

        # 5. back home, and a postcard
        r.say('And a postcard to say hello', '5 · contact')
        bx, by, _, _ = r.center('.pp-bar a')
        r.scroll_to(0, 1.4)
        bx, by, _, _ = r.center('.pp-bar a')
        r.move(bx, by, 0.8)
        with page.expect_navigation():
            r.click(shoot=False)
        r.settle()
        r.shoot()
        r.scroll_to(r.doc_top('#contact') - 40, 2.2)
        r.move(1300, 700, 1.0); r.wait(2.4)
        r.caption = ('', '', -1); r.wait(0.6)
        finish(enc, OUT / 'tour.mp4')
        (OUT / 'tour.json').write_text(json.dumps({'duration': r.t, 'cues': r.cues}))
        log(f'tour: {r.t:.1f}s, {r.frame} frames')
        ctx.close()
    finally:
        httpd.shutdown()


# ---------------------------------------------------------------- the soundtrack

# A soft pad on a slow four-chord loop, with small sounds on the cues: a pencil
# scratch when something is written, a tick per sampled token, a pop, a page.
SOUND = r"""
async (args) => {
  const { duration, cues, sr } = args;
  const ac = new OfflineAudioContext(2, Math.ceil(duration * sr), sr);
  const master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
  // gentle fade in and out of the whole film
  master.gain.setValueAtTime(0, 0); master.gain.linearRampToValueAtTime(0.9, 1.5);
  master.gain.setValueAtTime(0.9, duration - 3); master.gain.linearRampToValueAtTime(0, duration);
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400; lp.connect(master);
  const chords = [[48, 55, 64, 71], [45, 52, 60, 67], [41, 48, 57, 64], [43, 50, 59, 62]];
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const bar = 4;
  for (let t = 0, k = 0; t < duration; t += bar, k++) {
    for (const m of chords[k % 4]) {
      for (const [type, det, g] of [['triangle', -4, 0.022], ['sine', 5, 0.03]]) {
        const o = ac.createOscillator(); o.type = type; o.frequency.value = hz(m); o.detune.value = det;
        const v = ac.createGain(); v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(g, t + 1.2);
        v.gain.setValueAtTime(g, t + bar - 0.6); v.gain.linearRampToValueAtTime(0, t + bar + 0.8);
        o.connect(v).connect(lp); o.start(t); o.stop(t + bar + 0.9);
      }
    }
  }
  const noise = ac.createBuffer(1, sr * 2, sr); const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  function burst(t, dur, f1, f2, q, g) {
    const s = ac.createBufferSource(); s.buffer = noise;
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q;
    bp.frequency.setValueAtTime(f1, t); bp.frequency.linearRampToValueAtTime(f2, t + dur);
    const v = ac.createGain(); v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(g, t + 0.03); v.gain.linearRampToValueAtTime(0, t + dur);
    s.connect(bp).connect(v).connect(master); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  function tone(t, f1, f2, dur, g, type = 'sine') {
    const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const v = ac.createGain(); v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(g, t + 0.005); v.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(v).connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  for (const [t, kind] of cues) {
    if (t < 0 || t > duration) continue;
    if (kind === 'write') for (let i = 0; i < 4; i++) burst(t + i * 0.13, 0.11, 3800, 2600, 1.4, 0.05);
    if (kind === 'scratch') burst(t, 0.45, 2400, 4200, 1.2, 0.045);
    if (kind === 'tick') tone(t, 1800, 1500, 0.06, 0.06);
    if (kind === 'pop') tone(t, 720, 360, 0.12, 0.09);
    if (kind === 'click') { tone(t, 1300, 900, 0.05, 0.07); burst(t, 0.04, 5000, 5000, 2, 0.04); }
    if (kind === 'page') burst(t, 0.55, 700, 2600, 0.8, 0.09);
    if (kind === 'swoosh') burst(t, 0.6, 500, 3000, 0.7, 0.07);
    if (kind === 'swell') for (const m of [60, 67, 72]) tone(t, hz(m), hz(m), 1.6, 0.02, 'triangle');
  }
  const buf = await ac.startRendering();
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  const pcm = new Int16Array(L.length * 2);
  for (let i = 0; i < L.length; i++) { pcm[2 * i] = Math.max(-1, Math.min(1, L[i])) * 32767; pcm[2 * i + 1] = Math.max(-1, Math.min(1, R[i])) * 32767; }
  let s = ''; const b = new Uint8Array(pcm.buffer);
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  return btoa(s);
}
"""


def parts():
    ex = json.loads((OUT / 'explainer.json').read_text())
    to = json.loads((OUT / 'tour.json').read_text())
    ou = json.loads((OUT / 'outro.json').read_text())
    return ex, to, ou


def sound(browser):
    ex, to, ou = parts()
    duration = ex['duration'] + to['duration'] + ou['duration']
    cues = list(ex['cues'])
    cues += [[t + ex['duration'], k] for t, k in to['cues']]
    cues += [[t + ex['duration'] + to['duration'], k] for t, k in ou['cues']]
    page = browser.new_page()
    sr = 48000
    pcm = base64.b64decode(page.evaluate(SOUND, {'duration': duration, 'cues': cues, 'sr': sr}))
    n = len(pcm)
    (OUT / 'sound.wav').write_bytes(b'RIFF' + struct.pack('<I', 36 + n) + b'WAVEfmt ' + struct.pack('<IHHIIHH', 16, 1, 2, sr, sr * 4, 4, 16) + b'data' + struct.pack('<I', n) + pcm)
    page.close()
    log(f'sound: {duration:.1f}s, {len(cues)} cues')


def final(_browser=None):
    out = OUT / 'portfolio-film.mp4'
    subprocess.run(
        ['ffmpeg', '-y', '-loglevel', 'error',
         '-i', str(OUT / 'explainer.mp4'), '-i', str(OUT / 'tour.mp4'), '-i', str(OUT / 'outro.mp4'), '-i', str(OUT / 'sound.wav'),
         '-filter_complex', '[0:v][1:v][2:v]concat=n=3:v=1:a=0[v]', '-map', '[v]', '-map', '3:a',
         '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k',
         '-shortest', '-movflags', '+faststart', str(out)],
        check=True)
    log(f'wrote {out} ({out.stat().st_size // 1_000_000} MB)')


STEPS = {'explainer': explainer, 'outro': outro, 'tour': tour, 'sound': sound, 'final': final}


def main(argv):
    from playwright.sync_api import sync_playwright
    want = argv[0] if argv else 'all'
    order = list(STEPS) if want == 'all' else [want]
    if any(s not in STEPS for s in order):
        print(__doc__)
        return 2
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for s in order:
            log(f'== {s}')
            STEPS[s](browser)
        browser.close()
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
