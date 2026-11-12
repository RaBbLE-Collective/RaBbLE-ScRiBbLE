# RaBbLE-ScRiBbLE

A note-taking app with an infinite canvas, glowing pen ink and typed text. It is built for iPad with Apple Pencil, and works with a mouse and keyboard too. Notes stay on your device (IndexedDB); there is no account, server or sync yet.

**Genesis release `0.1.0`** · Live at [scribble.joinrabble.world](https://scribble.joinrabble.world)

## Quickstart

It is a static page with no build step. From this folder:

```sh
python3 -m http.server 8080
```

Open <http://localhost:8080/index.html>.

## What is in it

| File | What it does |
|---|---|
| `index.html` | The app |
| `manifest.json`, `sw.js` | Install as an app, work offline |
| `src/js/RaBbLE-canvas-engine.js` | Pen input (pressure, tilt), pan and zoom, strokes, undo |
| `src/js/RaBbLE-render.js` | The glow renderer |
| `src/js/RaBbLE-toolbar.js` | Pen, eraser, text, colours, undo, clear |
| `src/js/RaBbLE-text-tool.js` | Tap to place a text box |
| `src/js/RaBbLE-store.js` | Saves the board to IndexedDB |

## Deploying

A push to `main` or `new-horizons` deploys the live site (`.github/workflows/deploy.yml`). `main` only receives release pull requests.

## More

[Overview](https://github.com/RaBbLE-Collective/RaBbLE-Grimoire/blob/main/RaBbLE-ScRiBbLE/RaBbLE-ScRiBbLE-Overview.md) · [The Collective](https://github.com/RaBbLE-Collective/RaBbLE-Grimoire)

## Licence

Source-available under the RaBbLE Sovereign Accord: free for personal use, commercial use by agreement. See [LICENSE](LICENSE).
