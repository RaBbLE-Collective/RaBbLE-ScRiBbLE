# CONTEXT.md — RaBbLE-ScRiBbLE Current State

```
epoch: 0 | project: RaBbLE-ScRiBbLE | status: v1 build in progress
```

## What We Are Building

A neon note-taking PWA — single infinite canvas, glow-pen ink (concept art: `RaBbLE-BaBbLE/intake/SCriBbLE_Concept_Art.png`) + typed text boxes. iPad + Apple Pencil first, mouse/keyboard fully usable. Local-only (IndexedDB), fully offline. Deploys to `scribble.joinrabble.world`.

This member was deferred in the Grimoire epoch registry ("Mobile PWA — Epoch 1+"); Mark chose to start it ahead of that schedule. Not an EP1 gate — doesn't block Episode 1 air.

## Active Work

- [x] Repo scaffolded
- [ ] PWA shell (index.html, manifest.json, sw.js)
- [ ] Canvas engine (pointer input, pan/zoom, strokes, undo)
- [ ] Glow renderer (dual-canvas blur/bloom)
- [ ] Toolbar (Aether components + NeBuLA entity mini)
- [ ] Text tool + IndexedDB store
- [ ] Deploy config (wrangler + GH Actions)
- [ ] Local verification
- [ ] GitHub repo created + pushed

## What Good Looks Like

Strokes glow like the concept art (neon core + soft bloom, no jank at 60fps). Pen, mouse, and touch all draw. Text boxes get native keyboard/selection. Reload restores the board exactly. Works offline after first load. No invented hex — all color from `RaBbLE-Palette.md` / Aether tokens. Toolbar chrome comes from Aether components, not hand-rolled buttons.

## What To Avoid

- Don't reinvent buttons/panels/dock chrome — Aether already has `.rabble-btn`, `.rabble-glass`, `.rabble-dock` etc.
- Don't build a custom canvas text renderer — contentEditable divs are simpler and get native behavior for free.
- Don't add sync/backend/auth — v1 is local-only by design.
- Don't touch Cloudflare secrets/DNS — that's Mark's step (same open blocker B-12 affects every repo's deploy).

## Immediate Priorities

1. PWA shell + Aether/NeBuLA CDN loaders
2. Canvas engine + glow renderer
3. Toolbar + text tool + store
4. Local verification, then hand off deploy wiring to Mark
