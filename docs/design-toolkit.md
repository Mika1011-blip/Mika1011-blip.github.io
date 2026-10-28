# Design toolkit

Set up 2026-10-28. Project: static single-file HTML portfolio on GitHub Pages (no React, no package.json).

## Skills (project-local, `.claude/skills/`)

| Skill | Source | License | Status | Use |
|---|---|---|---|---|
| `design-taste-frontend` | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) @ `12af471` | MIT | Installed (copied) | Art direction, composition, type, palette, imagery, screenshot critique loop |
| `web-design-guidelines` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) @ `1a2c79d` | MIT (per README) | Installed (copied) | Accessibility / UX / responsive / motion review |

Review notes:
- **taste-skill** scripts are zero-dependency Node. They spawn a local Chrome/Edge over CDP for screenshots, and `assets.mjs` queries public image APIs (Openverse, Wikimedia, Met, AIC, NASA, archive.org). They keep a history at `~/.taste-skill/history.json` and write project files to `.taste-skill/`. No credentials and no install scripts. Requires **Node 22+** (the machine has 24.19).
- **web-design-guidelines** is a single SKILL.md that fetches rules from `raw.githubusercontent.com/vercel-labs/web-interface-guidelines` at review time, so it needs network access.
- Other vercel skills (React, Vercel deploy, etc.) were skipped because they don't apply to this stack.
- To update a skill, re-clone its repo and re-copy the folder. Copies are not symlinks, so they stay portable on Windows.

## MCP servers

| Server | Where configured | Status |
|---|---|---|
| Playwright (`@playwright/mcp@0.0.83`, Apache-2.0, Microsoft) | `.mcp.json` (project) | Configured. **Approve it on first launch** (project MCP servers prompt once). Browsers download on first use. |
| Figma | claude.ai connector (account-level) | Connected, so it was not duplicated in `.mcp.json` |
| Notion | claude.ai connector (account-level) | Connected. Verified access to Home / Folders / System / Library |

`.mcp.json` uses `cmd /c npx` because Windows needs the wrapper for npx-based stdio servers. It contains no credentials.

## Design references (not dependencies)

- [alexpate/awesome-design-systems](https://github.com/alexpate/awesome-design-systems) (Unlicense): a catalogue of public design systems.
- [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) (MIT): DESIGN.md examples. `DESIGN.md` follows its section structure.

## Visual libraries — installed 2026-10-28 (`package.json`, `node_modules/`)

All packages import successfully under Node 24. `npm audit` reports 0 vulnerabilities.

| Library | Installed as | License | Notes |
|---|---|---|---|
| [Hairline](https://github.com/lucasmarkes/hairline) | `@lucasmarkes/hairline@0.5.1` | MIT | Isometric line figures for React or any DOM |
| [Anatomy](https://github.com/wheresryan22/anatomy) | Skill at `.claude/skills/anatomy` @ `1482e84` | MIT | Agent skill, not an npm library. Uses only Node built-ins. `scripts/publish.mjs` can push to its community gallery (via `gh`), but only when you explicitly ask |
| [ShaderGradient](https://github.com/ruucm/shadergradient) | `@shadergradient/react@2.4.20` + `three-stdlib`, `camera-controls` | npm package: MIT (the GitHub repo declares none) | Per its README install line |
| [Liquid Glass React](https://github.com/rdev/liquid-glass-react) | `liquid-glass-react@1.1.1` | MIT | Not updated since 2025-06 |
| [Liquid Logo](https://github.com/paper-design/liquid-logo) | `@paper-design/shaders-react@0.0.82` (exports `LiquidMetal`) | Apache-2.0 | The liquid-logo repo is a Next.js **app** under **PolyForm Shield** and is not an npm package. Its effect comes from Paper Shaders, which is what's installed |
| [React Three Fiber](https://github.com/pmndrs/react-three-fiber) | `@react-three/fiber@9.8.2` + `three@0.186.1` | MIT | Requires `react` ≥19 <19.4, so React is pinned at `19.3.1` |

Peers: `react` / `react-dom@19.3.1`. Dev: `@types/three`.

**Not done yet:** the site has no bundler, so these packages can't be used from the current
single HTML file. Using them needs a build step (e.g. Vite with `@vitejs/plugin-react`) and a GitHub
Actions workflow that deploys `dist/` to Pages.

## Remaining steps

1. Restart Claude Code in this folder and approve the `playwright` server, then check it with `/mcp`.
2. Run the taste skill to choose a new direction, then update `DESIGN.md`.
3. Rename the HTML file to `index.html` before pushing, and enable Pages (main / root).
4. This folder is not a git repo yet. Run `git init` when you're ready.
