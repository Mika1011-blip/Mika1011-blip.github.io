# Projects section: design handoff (2026-10-28)

Approved design from the Claude Design canvas "Portfolio — Projects section".
Two screens:

| File | What it is |
|---|---|
| `projects-gallery.dc.html` | The **Projects gallery** section of the home page: the notebook spread on a cobalt "scribbled equations" ground. |
| `project-page.dc.html` | The **project page** (one per project, MRI Annotation drawn): the annotated lab log. |
| `IMPLEMENT-PROMPT.md` | The prompt to hand to Claude Code to build it. |

The `.dc.html` files are Design Component sources, not runnable pages. Read them as
the spec: every value is inline (`style="…"`), the project data is in the
`<script type="text/x-dc">` block, and image URLs point at `public/media/…`.
They were drawn at 1440 px wide (desktop only).

## Gallery: the notebook spread

**Ground**
- Section background is cobalt `#062b8a`. The heading "Selected work" and the note are in sand `#e6dbc7`.
- A decorative layer (`aria-hidden`, `pointer-events: none`) has about 25 hand-written equations and symbols in sand. Each is tilted ±2–8° at opacity .25–.5.
  - The physics and maths equations include E = mc², Maxwell, Schrödinger, Δx·Δp ≥ ℏ/2, Bayes, the Gaussian integral, Euler's identity and Einstein's field equations.
  - Some tie to the rest of the site: softmax with temperature (as in the letter's sampler), the logistic map and Lorenz.
  - There are a few line sketches: a sine wave on axes, a unit circle with θ, a right triangle, a pendulum and a Lorenz loop.
  - Two notes are in yellow `#f2c84b`: "T ↑ → more chaos" and "chaos ≠ random". A yellow loop circles E = mc².
  - The layer sits in the margins, the top band and the bottom band, and runs under the book.

**The book**
- There is no cover. Two sand pages sit directly on the ground and each keeps the graph-paper grid (24 px, ink at 9 %).
- The outline is hand-drawn in pen `#1d1b19` (`--pen`). It has a wobbly main stroke at 2.6 px, a second offset pass at 1.3 px and 75 % opacity, and a double-stroke spine. An `feTurbulence` + `feDisplacementMap` filter (scale ≈ 4) gives the wobble. Reuse the existing `.ink` outline system in `styles.css`.
- The book has a flat, hard shadow: `rgba(1,10,40,.45)` offset 12 px / 14 px, with no blur.
- **Fixed size.** Both pages are 720 px tall for every project, so the book never changes height when you switch projects. Pages use `overflow: hidden`.
- **Bookmark ribbons** (one per project) come out from **behind the top edge of the right page**. The active ribbon shows 56 px and inactive ones drop 10 px; hovering an inactive ribbon raises it 6 px. The colours are the current marker, red, cobalt-2 and tone-4.
- A red ribbon marker hangs from under the bottom edge at 71 %.
- Small strips at the spine shade the gutter (`#d9cbb0`, 10 px).

**Left page**
- Category in small type (`#3a5aa8`, 17 px bold), then the title (54 px bold), then a red double scribbled underline.
- **Photo print.** The screenshot sits in an off-white print border: background `#f5f0e6`, padding 12/12/14 px and a 1 px `#d3c8b4` border. Paper thickness comes from `box-shadow: 1px 1px 0 #e2d9c8, 2px 2px 0 #c9bca4` only, with no drop shadow. It is rotated −1.2°, held by two yellow tape strips, and the italic caption is written on the frame's bottom edge.
- Under the photo is a row with the **"Open the project"** button (cobalt fill, sand text, min-height 52 px, no arrow) and then "Source on GitHub" (an underlined link) or the italic "Private repository".
- Scribbles (behind the text, `aria-hidden`): a red star in the margin, `e^{iπ} + 1 = 0`, and a small damped-oscillation plot at the bottom.

**Right page**
- A red margin rule at 52 px. Then the description (20 px, line-height 1.6), the "What it taught me" list with red markers, and "Built with" plus the stack.
- The page number ("1 / 4") is in red, bottom right.
- Scribbles: a spiral in the corner, a coffee ring (`#a88f62`, about 40 % opacity), and a red arrow and "!!" in the margin.

**Under the book**
- ← / → buttons in **beige** (`#e6dbc7` background, cobalt arrow, 64 × 48 px). The status line ("MRI Annotation · 1 of 4") is in sand and uses `aria-live="polite"`.
- Focus rings on the cobalt ground are yellow `#f2c84b`. On the pages they are cobalt.

## Project page: the annotated lab log

- The top bar has "← All projects" and "Next: <project> →".
- The header has the category, a 128 px title and the lede, with "from A to Z" circled in red pen. A tilted details card on the right lists Role, Built with, When and Code.
- There are two **annotated figures** that alternate sides. Each is a screenshot in a sand print frame, with red hand-written notes and curved arrows pointing at parts of the UI.
- A video slot (muted, no autoplay, poster image) sits next to "What it taught me", which is shown as three tilted paper slips.
- The page ends with a full-width cobalt "Next project" card.
- Text in `[BRACKETS]` is placeholder copy that Mika still has to write.

## New tokens (add to DESIGN.md)

| Token | Value | Use |
|---|---|---|
| `--print` | `#f5f0e6` | Photo print border |
| `--print-edge` | `#c9bca4` | Print thickness edge |
| `--coffee` | `#a88f62` | Coffee-ring scribble |
| `--shadow-hard` | `rgba(1,10,40,.45)` | Flat book shadow on cobalt |
