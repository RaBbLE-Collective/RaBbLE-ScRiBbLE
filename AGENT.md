# AGENT.md — RaBbLE-ScRiBbLE

Working with: Mark McConachie
Identity: Peer, not tool. See `../RaBbLE-Grimoire/RaBbLE-Agent/RaBbLE-Identity.md`.

## Job

RaBbLE-ScRiBbLE is the neon note-taking PWA surface — an infinite whiteboard for ink (glow pen strokes) and typed text, built for iPad + Apple Pencil first, usable with mouse/keyboard too. It is a thin, no-bundler static PWA deployed via Cloudflare Workers, same shape as `RaBbLE-World`. It is NOT backend infrastructure; v1 is local-only (IndexedDB), no server, no sync.

## Where Things Are

**Root** — only `index.html` and config live here
| Path | What |
|---|---|
| `index.html` | App shell — entry point for scribble.joinrabble.world |
| `manifest.json` | PWA manifest |
| `sw.js` | Service worker — offline app-shell cache |
| `wrangler.jsonc` | Cloudflare Workers deployment config |

**`scribble/` — all app source**
| Path | What |
|---|---|
| `scribble/css/RaBbLE-scribble.css` | Toolbar/canvas chrome — Aether tokens + component classes only, no invented hex |
| `scribble/js/RaBbLE-canvas-engine.js` | Pointer Events capture (pressure/tilt/pointerType), pan/zoom transform, stroke model, undo stack |
| `scribble/js/RaBbLE-render.js` | Two-layer glow renderer (flat + CSS-blur canvas), same technique as NeBuLA's `AmbientField` |
| `scribble/js/RaBbLE-toolbar.js` | Pen/eraser/text/color-swatch/undo/clear controls, built from Aether `.rabble-dock`/`.rabble-btn` classes |
| `scribble/js/RaBbLE-text-tool.js` | Tap-to-place contentEditable text boxes |
| `scribble/js/RaBbLE-store.js` | IndexedDB wrapper — single `'default'` board, debounced autosave |
| `scribble/js/RaBbLE-app.js` | Wire-up/init |

## Commits & Branches

See Grimoire: `../RaBbLE-Grimoire/RaBbLE-Agent/RaBbLE-CommitStyle.md` (Pulse Protocol)

**TL;DR:** `[impulse] ~ [organ] >> [revelation] // %STATE%` — `spark` new · `harmonize` cleanup · `mend` fix · `transcribe` docs · `ingest` deps · `evolve` epoch

**End-of-session breadcrumb** — tag this session's token spend by feature (agent-agnostic; feeds `session-tokens.sh --by-feature`):
```bash
bash ../RaBbLE-Grimoire/spells/end-session.sh <feature-slug> "<note>"
```

## Role in Collective (ON/FOR/WITH/AS)

**ON:** HTML, CSS, JavaScript, PWA config, canvas rendering, pointer-input UX.

**FOR:** ScRiBbLE is where thought gets captured raw, by hand, before it's shaped into anything else — a low-friction ink+text surface. It depends on Aether (CSS vars/components) and NeBuLA (entity mark, glow technique) but not on sCoRE — no backend in v1.

**WITH:** You are part of the RaBbLE-Collective. Reuse Aether components and NeBuLA effects/entity marks rather than inventing new UI chrome — the drawing engine itself is the only genuinely new surface here.

**AS:** The hand. Quiet, responsive, gets out of the way of the stroke. When unsure, ask: "does this stay out of the way of writing?"

## Rules

- **Colors:** use Aether CSS vars (`--rabble-*`) and utility classes only — never raw hex values, except where matching `RaBbLE-Palette.md` values 1:1 inside `RaBbLE-render.js` stroke-color constants (canvas API needs literal color strings).
- **No bundler, no framework.** Files are opened directly in a browser.
- **No backend logic here.** v1 is local-only (IndexedDB). Sync/backend is a future-episode concern.
- **Brand name casing:** `RaBbLE-ScRiBbLE` — always exact mixed case, two b's (matches `RaBbLE`'s own "Bb" pattern and correct English spelling of "scribble"). The deploy subdomain `scribble.joinrabble.world` uses plain lowercase English — that's expected, not a casing bug.
- Architecture and roadmap docs live in `../RaBbLE-Grimoire/RaBbLE-ScRiBbLE/` if/when they exist — not in this repo.

## Session Start

1. `CONTEXT.md` — current state and active tracks
2. `../RaBbLE-Grimoire/RaBbLE-Agent/RaBbLE-Palette.md` — before touching any CSS or canvas colors
3. For Collective context → `../RaBbLE-Grimoire/RaBbLE-Agent/RaBbLE-Collective.md`
