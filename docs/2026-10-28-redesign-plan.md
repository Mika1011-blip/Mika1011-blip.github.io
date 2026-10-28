# Portfolio Redesign Plan — 2026-10-28

Owner: Minh Khang THAI · Status: **direction chosen, not yet built**
Current site: `mika-portfolio-10oct26.html` (single-file, monochrome, dark, slide-based)
Direction source: `design-taste-frontend` skill, direction sheet saved in `.taste-skill/direction.json`
(reprint with `node .claude/skills/design-taste-frontend/scripts/draw.mjs --show`)

---

## 1. Goals

1. **Show personality first,** then depth of understanding. The site should feel like *this person's* notebook, not a template.
2. **Keep the two signature ideas**, redesigned:
   - an LLM text generator with temperature control;
   - a background coordinate field where space bends around the mass and velocity of particles.
3. **Art style:** clean, catchy, sketchy hand-drawn texture, 2.5D depth.
4. Stay deployable on **GitHub Pages**.

Out of scope for now (later pass): project media, final project copy, bio wording.

---

## 2. Direction — "The physicist's notebook"

| | |
|---|---|
| Base direction | *The page is the object* (seed `1251145424`, sector personal-portfolio, tone playful) |
| Artefact | A working notebook / filed sheets of a maths-and-physics student |
| Hero | Tabbed folder stack on bending graph paper |
| Type | Big Shoulders (display) / Public Sans (text) |
| Colour | Cobalt on sand: two inks, like a two-colour print |
| Signature motion | Index with preview: folders pile up and open as you scroll |
| Redraws | `section:work` → `work-stacked-folders-tabs` (the dealt book-spine index needs 20–40 items and there are 4 projects) |

**Idea sentence:** *On this page, the student's working notebook becomes the page itself. The graph paper is spacetime and bends around moving masses, and the "about" letter is sampled live at the visitor's chosen temperature.*

The three dealt options were *page-is-the-object*, *quiet-instrument* and *dark-room*. The first was chosen because it is the only one that can hold hand-drawn texture, 2.5D paper depth and both live ideas together.

---

## 3. The two signature ideas, redesigned

### 3.1 Spacetime paper (hero ground)
- The notebook's squared paper **is** the coordinate grid. Lines are drawn in cobalt with a slight hand wobble.
- 3–6 "masses" are drawn as ink blots or hand-drawn circles with a velocity arrow. They drift slowly, and grid lines warp around each one in proportion to mass, with a velocity-dependent stretch (a visual nod to frame dragging and length contraction, not a solver).
- The **cursor or touch point is a mass too**, so visitors can bend the paper themselves.
- Optional detail for depth: a tiny pen annotation in the margin that shows the deformation formula used (e.g. displacement ∝ m / (r² + ε)).
- Implementation: a `<canvas>` drawing the line mesh, CPU-side displacement of mesh vertices, a rough line style through jittered segments, paused when the tab is hidden, and a still drawing under `prefers-reduced-motion`.

### 3.2 Temperature letter (about section) — the page's "live thing"
- The about section is a first-person **letter**, generated token by token.
- A **temperature dial** (a hand-drawn knob, keyboard-operable, range about 0.1–1.5) controls sampling:
  - low gives plain, predictable, professional sentences;
  - mid gives more personality and vocabulary;
  - high (>1.3) degrades into charming nonsense, which shows *why* temperature matters.
- Mechanism: a small hand-built next-token table (logits per context) with softmax(logits / T), real sampling and a seeded RNG for replay. The current probability distribution is shown as small hand-drawn bars next to the dial, which demonstrates understanding rather than just an effect.
- The page states plainly that it is a simulation (no API calls, no keys).
- Fallback without JavaScript: the letter at T = 0.7 as plain text.

---

## 4. Art style

### Colour (two inks)
```css
:root{
  --bg:#e6dbc7;       /* sand paper */
  --surface:#ddd0b9;  /* the sheet one step darker */
  --ink:#062b8a;      /* cobalt ballpoint: text, drawings, solid shapes */
  --muted:#3a5aa8;    /* secondary ink */
  --accent:#062b8a;   /* the action: cobalt block */
  --accent-ink:#e6dbc7;
}
```
- No black and no second hue. Contrast between cobalt and sand is high (≈ 10:1).
- Folders and sheets are separated by **tone steps** (sand → surface → a darker sand), never by outlines.
- Dark mode, if kept, is the *inverse print*: sand ink on deep cobalt paper (to be decided, §10).

### Type
- **Big Shoulders 800**, uppercase, leading 0.88, used for folder tabs, the name and section headings ("stamped labels").
- **Public Sans 400/600**, leading 1.5, used for all reading text, 17–19px.
- Five sizes maximum: small 13–14 / body 17–19 / lead 20–26 / head 40–88 / hero (fills the measure).
- Hand-lettering appears only in *drawn annotations* (SVG), never as a styled word inside a headline.

### Hand-drawn texture
- SVG `feTurbulence` + `feDisplacementMap` filter for a slight wobble on drawn strokes.
- Paper grain overlay (very low opacity noise).
- Pen annotations: circles around key numbers, arrows to details, a margin formula, underline scribbles. They are drawings, not decoration chips.
- Shaped paper edges: notches, scallops and perforations of round dots (≥ 4px), all made with `clip-path` or masks.

### 2.5D
- **Stacked paper.** Sheets are offset in hard steps (e.g. 8–12px down and right, in a darker sand), like a real pile. There are no blurred shadows.
- The folder stack shows each tab's strip and piles up while scrolling (`position: sticky` with increasing `top`).
- Optional subtle tilt (±1–2°) on loose sheets such as the letter and the coupon.
- Hairline isometric figures (MIT, installed) or the Anatomy skill can supply small 2.5D explainer drawings inside project folders, drawn in the cobalt ink.

---

## 5. Page structure

| # | Section | Blueprint | Content |
|---|---|---|---|
| 0 | **Header** | Slim row | Wordmark centred and one link right (CV or contact). No pill nav |
| 1 | **Hero** | Tabbed folder stack | `h1` name in large stamped caps, one sentence on what he does, then the spacetime paper as ground and **5 folders** (4 projects + About). The front folder is open with one action button |
| 2 | **Intro** | Title, note, facts row | Short heading and a 3-line note, then a facts row: EFREI · Big Data & ML · Paris · interests (maths, physics, complexity). Pen circles around one fact |
| 3 | **Work** | Stacked folders with tabs | One sticky band per project: LifeIsGood, AI-Assisted MRI Annotation, MesSous, RetinaSight. The tab holds the name and the strip holds the category. Open band: 16:10 picture (cols 1–7) and a ~60-word description with links (cols 9–12) |
| 4 | **About** | Founder's letter (sheet variant) | The temperature letter on a sand sheet with a scalloped bottom edge and a tear-off strip with the email |
| 5 | **Contact** | Clip-out coupon | A cobalt coupon with notches and a perforation. Fields become a pre-filled `mailto:`, since there is no backend on GitHub Pages |
| 6 | **Footer** | Back of the card | Postcard back: sign-off message, address-block links (email, GitHub, LinkedIn), a stamp (Hubble lensing image), imprint line, image credits |

Phone: the folders stack in normal flow (no sticky), the coupon turns upright, the letter goes full width, and the spacetime mesh uses fewer lines and responds to touch.

---

## 6. Motion

- **Signature move:** folders pile and open on scroll, with a ~240ms crossfade for the preview.
- Spacetime paper: continuous slow drift plus cursor gravity.
- Temperature letter: words appear token by token, with a quick "ink settling" on each word.
- Section entrances: heading, then text, then picture, staggered by 60–90ms and rising 16–32px.
- Feedback on every control (dial, tabs, buttons, links).
- Transform/opacity only. Full `prefers-reduced-motion` fallback (still mesh, letter shown complete).
- Content is never hidden when scripts fail.

---

## 7. Imagery

- **Projects:** real screenshots or crops of each app (deferred, see §9). These count toward the skill's floor of ≥ 4 real pictures.
- **Subject world (found, public domain):** Hubble/NASA gravitational-lensing images, already located:
  - *Einstein Cross* (NASA, ESA, STScI), public domain;
  - *Hubble sees double Einstein ring (heic0803a)* (NASA, ESA, R. Gavazzi & T. Treu), public domain.
  Used as the footer stamp and possibly as tipped-in plates. Credited in the footer.
- **Drawings:** the spacetime mesh, dial, annotations and small isometric explainers, all in cobalt.
- One treatment for all photos: duotone into cobalt/sand, so they print in the two inks.

---

## 8. Tech & deployment

**Recommendation: Vite with vanilla JS modules, deployed through GitHub Actions to Pages.**
- Neither the spacetime canvas nor the sampler needs React. Vanilla keeps it light and fast.
- Installed libraries vs this direction:
  - **Hairline** (MIT): fits for small isometric line figures.
  - **Anatomy skill**: fits for project explainer drawings.
  - **React Three Fiber**: only if a real 3D moment is added later. Not planned.
  - **ShaderGradient, Liquid Glass React, Paper LiquidMetal**: these clash with the direction (gradients and glass) and are **not used**. They can be uninstalled after the build to keep `package.json` lean.
- Proposed structure:
  ```
  index.html
  src/main.js · src/spacetime.js · src/sampler.js · src/folders.js
  src/styles/tokens.css · base.css · sections.css
  public/assets/ (images, fonts if self-hosted, CV)
  .github/workflows/deploy.yml   (build → upload dist → deploy-pages)
  ```
- Alternative if a build step is unwanted: keep a single `index.html`. Both features work without a bundler, but then Hairline must be loaded from a CDN.

---

## 9. Deferred (later pass)

- Project media: screenshots or recordings for the 4 projects. Teaser videos (`portfolio-teaser*.mp4`, ~11 MB) need compressing or external hosting.
- Final project copy (~60 words each) and the letter's sentence bank and token tables.
- Bilingual EN/FR toggle (exists today; decide whether to keep it).
- CV file.

---

## 10. Open decisions

1. Keep a dark mode (inverse print: sand on cobalt) or go light-only?
2. Keep the EN/FR toggle?
3. Build step (Vite, recommended) or a single HTML file?
4. Header link: CV or contact?

---

## 11. Rules and exceptions

The house rules of the taste skill apply: headlines of 2 lines or fewer, one `h1`, no eyebrows, no monospace outside code, no gradients, no shadows at rest, no glass, no 01/02/03 numbering, at most 2 typefaces, and equal margins.

**Intentional exceptions** (pass `--allow` to the inspector for these only):
- **Grid lines.** The graph paper *is* the spacetime figure (subject content, not ornament).
- **2.5D paper offsets.** Hard tone-step offsets, not blurred shadows. If the inspector reads them as shadows, keep them and document why.

Accessibility (via the `web-design-guidelines` skill): keyboard-operable dial (arrow keys, `role="slider"` with `aria-valuenow`), visible focus, tab order, contrast in both themes, 44px touch targets, `lang` updates if bilingual.

---

## 12. Build phases

1. **Foundation:** set up Vite and the Pages workflow, tokens, fonts, base styles, paper texture and the hand-drawn filter.
2. **Hero:** the folder stack and the spacetime paper canvas (with reduced-motion and phone versions).
3. **Sections:** intro, sticky project folders (placeholder media), letter sheet, coupon, postcard footer.
4. **Temperature letter:** token tables, sampler, dial, probability bars, fallback.
5. **Motion layer:** entrances, control feedback, folder signature move.
6. **Gate:** `lint.mjs`, `inspect.mjs` at 1440/768/390, Playwright interaction checks, `web-design-guidelines` review. Fix every FAIL.
7. **Look:** three critique rounds on the screenshots (`references/critique.md`).
8. **Content pass (later):** project media, copy, CV, credits.
9. **Deploy:** push to GitHub and verify the live Pages URL.
