# RaBbLE-ScRiBbLE

**Live:** [scribble.joinrabble.world](https://scribble.joinrabble.world)

```
spark ~ scribble >> ink meets glow // %SCRIBBLE_ONLINE%
```

Neon note-taking PWA — infinite canvas, glow-pen ink + typed text. Built for iPad + Apple Pencil first, usable with mouse/keyboard too. No bundler, no framework, no build step.

---

## What This Is

RaBbLE-ScRiBbLE is a thin, no-bundler static PWA — same shape as RaBbLE-World — deployed via Cloudflare Workers. It's where thought gets captured raw, by hand, before it's shaped into anything else. v1 is local-only (IndexedDB): no server, no sync.

This repo is intentionally minimal on `main`. Active development happens on `new-horizons`, matching every other Collective member.

---

## App Shell

| File | Purpose |
|---|---|
| `index.html` | App shell — entry point for scribble.joinrabble.world |
| `manifest.json` | PWA manifest |
| `sw.js` | Service worker — offline app-shell cache |
| `src/js/RaBbLE-canvas-engine.js` | Pointer Events capture (pressure/tilt/pointerType), pan/zoom, stroke model, undo stack |
| `src/js/RaBbLE-render.js` | Two-layer glow renderer (flat + CSS-blur canvas) |
| `src/js/RaBbLE-toolbar.js` | Pen/eraser/text/color-swatch/undo/clear controls |
| `src/js/RaBbLE-text-tool.js` | Tap-to-place contentEditable text boxes |
| `src/js/RaBbLE-store.js` | IndexedDB wrapper — single board, debounced autosave |

---

## Documentation

Architecture and roadmap docs live in **RaBbLE-Grimoire**, not in this repo — see [`RaBbLE-ScRibLE-Overview.md`](https://github.com/RaBbLE-Collective/RaBbLE-Grimoire/blob/main/RaBbLE-ScRibLE/RaBbLE-ScRibLE-Overview.md).

For entity identity, palette, commit style, and the broader Collective — start at [RaBbLE-Grimoire](https://github.com/RaBbLE-Collective/RaBbLE-Grimoire).

---

## Quick Start

```sh
# No build step. Serve locally:
python3 -m http.server 8080
# → http://localhost:8080/index.html
```

---

```
transcribe ~ scribble >> the hand finds the page // %SCRIBBLE_ONLINE%
```
