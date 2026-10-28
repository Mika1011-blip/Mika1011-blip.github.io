# DESIGN.md — Minh Khang THAI Portfolio

Source of truth for the portfolio's visual system. Structure adapted from the
DESIGN.md format in [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md)
(reference only, not a dependency).

> **Status:** Sections marked **Current** describe the shipped site
> (`mika-portfolio-10oct26.html`, Oct 2026). A full art-direction redesign is planned;
> when a new direction is chosen (via the `design-taste-frontend` skill), replace the
> **Current** values and keep the **Invariants**, which apply to any direction.

## 1. Overview

- **Who:** Minh Khang THAI, a student heading into AI engineering at EFREI who is passionate about mathematics, physics and complexity.
- **What:** A single-page portfolio presenting an intro, selected projects (ML and medical imaging) and contact details.
- **Concept to carry:** *fields and emergence*. Simple rules produce complex structure. Pick visual ideas from the subject itself (particle fields, phase portraits, imaging slices), not generic "tech" styling.
- **Stack:** One static HTML file with inline CSS/JS, no build step, hosted on GitHub Pages. Any new dependency must work from a CDN `<script>`, or else justify adding a build step and an Actions deploy.

## 2. Colors

### Current (monochrome)

| Token | Dark | Light | Role |
|---|---|---|---|
| `--bg` | `#111111` | `#f2f2f2` | Page background |
| `--fg` | `#ececec` | `#1c1c1c` | Primary text |
| `--muted` | `#a3a3a3` | `#5f5f5f` | Secondary text |
| `--accent` | `#f4f4f4` | `#111111` | Emphasis, focus ring, live dot |
| `--panel` | `#1b1b1b` | `#e6e6e6` | Raised surfaces, dialogs |
| `--line` | `rgba(255,255,255,.15)` | `rgba(0,0,0,.17)` | Hairlines, borders |
| `--soft` | `rgba(255,255,255,.06)` | `rgba(0,0,0,.05)` | Hover fills |
| `--canvas` | `#8c8c8c` | `#6a6a6a` | Background particle field |

### Redesign: the physicist's notebook (branch `redesign`, `src/styles.css`)

| Token | Value | Role |
|---|---|---|
| `--bg` | `#e6dbc7` | Sand paper: page ground, notebook pages, text on cobalt |
| `--surface` | `#ddd0b9` | Raised paper: cards, frames, fields |
| `--ink` | `#062b8a` | Cobalt: text, buttons, the desk under the notebook and behind the contact postcard |
| `--muted` | `#3a5aa8` | Categories and labels |
| `--ink-2` | `#1a3f9e` | Lighter cobalt (a bookmark ribbon) |
| `--tone-1` … `--tone-4` | `#d9cbb0` → `#bba681` | Paper tones, back to front; `--tone-1` is the gutter strip at the spine |
| `--red` | `#b3291f` | Correction pen: notes, arrows, underlines, page numbers, margin rule |
| `--marker` | `#f2c84b` | Highlighter: tape, highlights, focus rings on cobalt |
| `--pen` | `#1d1b19` | Black pen outlines (`.ink`, the book outline) |
| `--print` | `#f5f0e6` | Photo print border |
| `--print-edge` | `#c9bca4` | Print thickness edge (1–2 px stepped, no blur); lighter steps are `color-mix` of it with `--print` |
| `--coffee` | `#a88f62` | Coffee-ring scribble on the notebook page |
| `--shadow-hard` | `rgb(1 10 40 / .45)` | Flat book shadow on the cobalt desk |

Focus rings are cobalt on paper and yellow (`--marker`) on cobalt.

### House-rule exceptions (intentional)
- **Hard shadow under the notebook.** `.book-shadow` is a flat block of `--shadow-hard` offset 12 px / 14 px with no blur. It is the only shadow on the site and reads as a printed offset, not a soft drop shadow.
- **Decorative equations layer.** `.equations` in the Projects section is about 25 hand-written equations and 7 line sketches in sand on cobalt (two in yellow). It is one `aria-hidden`, `pointer-events: none` layer behind the book, with nothing focusable. It is thinned below 900 px and hidden below 760 px.
- **Page-turn lighting.** The cast shadow of the turning leaf (`.cast`) uses gradients, marked `taste-skill-ignore`.

### Invariants
- Define every colour as a token on `:root` / `html[data-theme]`. Use no raw hex values in components.
- Body text must meet a contrast of ≥ 4.5:1 and large text/UI ≥ 3:1, in **both** themes.
- Use at most one chromatic accent. Avoid gradient soup and purple-to-blue "AI" gradients.

## 3. Typography

### Current
- Sans `Arial, Helvetica` is used for UI and headlines. Serif `Georgia` is used for italic emphasis inside the hero. Mono `SFMono/Consolas` is used for eyebrows, labels and nav indices (31 uses, which is too many).
- The hero is `clamp(62px, 6.7vw, 104px)`, weight 400, line-height .99, letter-spacing −.075em.
- Body copy is `clamp(15px, 1.18vw, 18px)` with line-height 1.75.
- The mono label is 11px uppercase with .1em tracking.

### Invariants
- Use a maximum of 2 families plus mono. Use mono only for genuinely technical strings (code, coordinates, metrics), not as decoration.
- Use fluid `clamp()` sizes and keep body text ≥ 16px on mobile.
- Webfonts go through Google Fonts with `display=swap`, or are self-hosted next to `index.html`.

## 4. Spacing & Layout

### Current
- The page gutter is `4.8%` and content max-width is `1600px`. The header is `94px` fixed and the footer zone is `116px`.
- Navigation is slide-based rather than scrolling: `.stage` is fixed between header and footer, and sections swap with a blur dissolve.
- The intro is a 57/43 grid of copy and visual.

### Invariants
- Use a 4px base spacing scale (4, 8, 12, 16, 24, 32, 48, 64, 96, 128).
- The layout has no horizontal scroll at 320px width and uses a 16px minimum side gutter on phones.
- Content must stay reachable at short viewports (the current `max-height` media queries exist for this).

## 5. Components

| Component | Notes |
|---|---|
| Header | Brand, numbered nav (`aria-current="page"`), location with live dot, theme and language toggles |
| Hero | Name, typed "generated" paragraph with caret, meta row |
| Project slider | Cards that open a `role="dialog" aria-modal` detail view |
| Contact | Links and an optional CV |
| Toast | Transient feedback |
| Notebook gallery (redesign) | Flat open book on the cobalt desk: pen outline + double spine (`#rough`), fixed 720 px pages (`overflow: hidden`), ribbons behind the right page, photo print with tape and caption, “Open the project” button, margin scribbles (`aria-hidden`). Phones (≤ 760 px) get one tall page per project with no turning. |
| Project page (redesign) | `projects/<id>/`, pre-rendered from `content.js` by `vite.config.js`: top bar, header with a details card, annotated figures (notes and arrows placed in percent of the figure, numbered pins on phones), video with “What it taught me” slips, next-project card. |
| Icon button | 38px round. **Touch targets must be ≥ 44px**, so this needs fixing in the redesign |

## 6. Imagery

- 8 embedded WebP illustrations (base64) are currently used. They are labelled as illustrations and **never presented as real demos**. Keep that honesty rule.
- Prefer real artefacts such as plots, model outputs and imaging slices (anonymised) over stock imagery.
- Images need `alt` text, explicit `width`/`height`, and `loading="lazy"` below the fold.
- `portfolio-teaser*.mp4` (~11 MB each) are not used yet. If used, they need a poster image, `muted playsinline` and no autoplay with sound, or they should be hosted externally.

## 7. Responsive Behavior

Current breakpoints are `1700 / 1100 / 900 / 620` px wide, plus height-based tweaks at
`760 / 700 / 560` px. Test at **375, 768, 1280 and 1920** widths with the Playwright MCP.

## 8. Motion

- Current motion: a canvas particle field, grain overlay, word-by-word text reveal, a "lightning" word effect, slide dissolve (`.24s` blur and `.42s` transform), and a breathing live dot.
- **Invariants:** animate only `transform`/`opacity` (and `filter` sparingly). The site deliberately animates even when the browser asks for reduced motion (owner's choice: Edge reports it whenever Windows animation effects are off); the reduced-motion code paths stay in the modules but are switched off in `main.js` / `project.js`. Pause the canvas when the tab is hidden. Motion should explain structure, not decorate.

## 9. Accessibility (non-negotiable)

- Use a visible `:focus-visible` ring, logical tab order, `Esc` to close dialogs, and focus trapping and return focus for the modal.
- Do not change content language without updating `lang`. Toggles need `aria-pressed` or an equivalent.
- Run the `web-design-guidelines` skill review before every deploy.
