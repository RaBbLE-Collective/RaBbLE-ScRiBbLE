# REFERENCES.md — RaBbLE-ScRiBbLE Decisions & Resources

## Architecture Decisions

| Date | Decision | Rationale |
|---|---|---|
| 2026-08-03 | Repo scaffolded, brand name corrected to `ScRiBbLE` (two b's) | Registry previously had `ScRibLE` (one b) — Mark's call: mirrors `RaBbLE`'s own "Bb" pattern and is correct English spelling |
| 2026-08-03 | v1 scope = single infinite canvas, local-only IndexedDB, no backend | Matches Collective's local-first rule; deferred Epoch-1+ member, not an EP1 gate |
| 2026-08-03 | Glow rendering = dual-canvas (flat + CSS `filter:blur`), reusing NeBuLA `AmbientField`'s technique | Zero JS/Skia cost, compositor-thread blur; same approach already proven at 60fps elsewhere in the Collective |
| 2026-08-03 | Toolbar built from Aether component classes (`.rabble-btn`, `.rabble-glass`, `.rabble-dock`), brand mark via NeBuLA `createEntityMini('e-scribble')` | Standard practice — don't reinvent UI elements the Collective already has |

## Repositories

| Project | Repo | Status |
|---|---|---|
| RaBbLE-ScRiBbLE | git@github.com:RaBbLE-Collective/RaBbLE-ScRiBbLE.git | v1 build in progress |

## Key External Resources

- Deploy target: `scribble.joinrabble.world` (Cloudflare Worker, same pattern as World/Aether/NeBuLA subdomains)
- Concept art: `RaBbLE-BaBbLE/intake/SCriBbLE_Concept_Art.png`

## Collective Reference

- Orientation: `~/RaBbLE-Collective/RaBbLE-Grimoire/gist/*.md`
- Identity: `~/RaBbLE-Collective/RaBbLE-Grimoire/RaBbLE-Agent/RaBbLE-Identity.md`
- Palette: `~/RaBbLE-Collective/RaBbLE-Grimoire/RaBbLE-Agent/RaBbLE-Palette.md`
- Plan doc (this build): `/home/rabble/.claude/plans/playful-whistling-locket.md`
