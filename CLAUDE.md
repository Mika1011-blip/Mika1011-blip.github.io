# CLAUDE.md

Static single-file portfolio (`mika-portfolio-10oct26.html`, to become `index.html`) deployed on GitHub Pages. No build step. Content lives in the `PORTFOLIO` object in the script.

## Design toolkit — when to use what

- **DESIGN.md** is the source of truth for tokens, type, layout, motion and accessibility rules. Read it before any visual change and update it when the direction changes.
- **`design-taste-frontend` skill** (`.claude/skills/design-taste-frontend`): use it for art direction, redesign, composition, type, palette and imagery, and when a page "looks generic". Its scripts need Node 22+ and Chrome/Edge, and write to `.taste-skill/` (gitignored).
- **`web-design-guidelines` skill**: use it for accessibility, focus, keyboard, forms, navigation, responsiveness and motion review. It fetches rules from GitHub at run time. Run it before every deploy.
- **Playwright MCP** (`.mcp.json`): use it for screenshots, responsive checks at 375/768/1280/1920, and interaction tests. Serve the folder locally (e.g. `npx serve .`) rather than using `file://`.
- **`anatomy` skill**: use it for interactive isometric SVG explainers of a project's mechanism. Never run its `publish.mjs` unless asked.
- **Visual libraries** (`package.json`): Hairline (line figures), ShaderGradient (animated gradient backgrounds), Paper Shaders `LiquidMetal` (liquid logo), Liquid Glass React, and React Three Fiber (3D). All are React and need a bundler (see `docs/design-toolkit.md`). Pick the ones that serve the chosen direction rather than stacking effects.
- **Figma MCP** (claude.ai connector): only when a Figma file or URL is involved.
- **Notion MCP** (claude.ai connector): use it for references in Home → Folders → System → Library (e.g. "Awesome Design", "AI Style Atlas").

## Git & deployment

- Repo: `Mika1011-blip/Mika1011-blip.github.io`. Pages currently deploys **`main` / root** (legacy mode), so anything merged to `main` goes live.
- The redesign is drafted on branch `redesign`, in the worktree `.claude/worktrees/redesign`. Do not commit redesign work to `main`.
- To go live: merge `redesign` into `main` only when the user approves. If the build moves to Vite, switch Pages to "GitHub Actions" first so that `.claude/`, `docs/` and the sources are not served.

## Rules

- Keep it deployable to GitHub Pages as static files. Add a build step plus an Actions workflow only if a chosen library requires React.
- Never add design-reference repos as runtime dependencies. Never commit credentials.
- See `docs/design-toolkit.md` for sources and setup status.
