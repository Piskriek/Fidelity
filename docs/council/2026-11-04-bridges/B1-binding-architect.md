# B1, Binding architect: the bridges we could build

**Thesis.** The cheapest honest bridge is inside the WoW addon, not across the holon. The eight nameplate actor slots already have a named source (`World.Scan`), a measured range read (`CheckInteractDistance`), a stale-close path (`HideSlot`) and a fixed slot count (`MAX_ACTORS = 8`), so the first binding is eight cells driven by those slots, with a registry, a "no source" draw and a report around it. The six holon flows cannot bind yet: the addon has no channel from the holon, and its only SavedVariables is its own config. The binding must age on `GetTime()`, not on the `dt` the driver accumulates, because the driver detaches when idle. Every default stays as it is until the owner turns a gate on. This round's inputs are the entity steer (`docs/council/2026-11-04-entity/STEER.md` §2–3) and the round-1 steer (`docs/council/2026-11-04/STEER.md`). `PLAN_FRACTAL.md` (HeavyMetal2) is not in this checkout, so nothing here is checked against it.

## Ranked list (by visible payoff per hour; hours are my estimates, not measurements)

**1. Registry, API, "no source" draw, `/fide cells`, login count, config gate (about 3 h).** Visible payoff: the bound state becomes printable text the owner can paste; the draw changes only when the gate is on. Risk: low; the draw path is the risk, so the gate is the control.
- *Claim:* a cell opens only on a source that is named, measured, fresh and of kind `measured`.
- *Evidence:* the definition (entity STEER §2); the kinds at `packages/triad-369/src/evidence.mjs:33-34` (`symbolic` is "a model statement", `notMeasured` is "a value the system does not measure at all").
- *Where:* a pure validator in `FidelityEMatrix/EMatrix_Math.lua` (its header says it has zero WoW globals, line 3), so `tools/test_ematrix_math.mjs` can run it; the registry and `ns.BindCell` in `EMatrix_Core.lua`, next to `ns.Cfg` (`:91`).
- *API:* `ns.BindCell(id, source, value, at, kind)`, with `id` 1..135, `value` finite in [0,1], `at` a `GetTime()` stamp. The caller passes a timestamp, not an age: an age the caller computed is already stale when it arrives. `ns.ReleaseCell(id)`. Invalid input is rejected and counted, never clamped silently.
- *Gate:* `bindCells = false` in `DEFAULTS` (`EMatrix_Core.lua:55-87`). `MergeDefaults` (`:97-106`) adds missing keys without touching a saved choice, so `CONFIG_VERSION` (`:24`) need not change. With the gate off, the registry still records (for the report) and the draw is the v1.7.3 draw.
- *No-source draw:* the closed E at its own orientation (`ShowFace`, `:263-273`), with the specular bar held at alpha 0 for an unbound cell during a flip. Today the driver sets `specBar` alpha from the flip curve on every flipping cell (`:776-782`), so the glint is the one thing that changes.
- *Report:* `/fide cells` added to the dispatcher (`:972-1000`) and the help list (`:1255-1271`): bound count, then each bound cell's source, value, age, kind and fresh/stale.
- *Login line:* `Say` in `Bringup` (`:1304`) gets "cells bound: N of 135 (gate on/off)".
- *Test:* `tools/ematrix_headless.lua`: a fresh `measured` bind opens; the same bind after `now` advances past the threshold reads stale; `symbolic` and `not_measured` never open; NaN, a value outside [0,1] and an unknown kind are rejected; with the gate off, the flap and spec call log equals a run with no bindings.
- *Proves it works:* the test log above, plus the login count matching `/fide cells` in the game.

**2. Eight actor slots as the first binding (about 5 h).** Visible payoff: in the box, with the gate on and `/fide box show`, a cell lights only while a named actor is in range. Risk: medium; the band semantics are unverified in the client.
- *Claim:* slot *i* drives cell *i*; the band is a bin, not a distance.
- *Evidence:* `MAX_ACTORS = 8` (`FidelityEMatrix/EMatrix_World.lua:28`); the player is inserted first (`World.Scan`, `:143-170`); `RangeBand` returns `near | mid | far | unknown` from two `CheckInteractDistance` calls (`:131-141`). That answers "within about 10 yd" and "within about 28 yd" (comment, `EMatrix_World.lua:11`), and those figures are "needs in-game verification"; the stub's 9.9 and 28 (`tools/ematrix_headless.lua:147-153`) are test choices, not client facts.
- *Mapping:* `near` 1.0, `mid` 0.5, `far` 0.0 is a band code, labelled as such in the report, not a distance.
- *Kinds:* `measured` when a range call answered; `not_measured` when the band is `unknown` (the brief says symbolic; `evidence.mjs:33-34` says a non-measurement is `not_measured`, so I recommend that correction).
- *Player slot:* a constant (`PLAYER_Z`, `:45`), so it never opens a cell. It may bind as `symbolic` for display only.
- *Stale close:* a unit leaving makes `HideSlot` (`:224-234`) call `ns.ReleaseCell`. `World.Stop` (`:331-338`), `World.Suspend` and `World.Rebuild` (`:373`) release all. A stale check at draw time handles the case where the overlay is off.
- *Band hysteresis:* `ConfirmBand` (`:236-247`) already holds a band change for `BAND_CONFIRM = 2` scans; the bind uses the confirmed band only.
- *Test:* a headless case with three plates (near, mid, far) binds three cells; a unit removed from the plate list releases its cell in the same `Refresh`; `CheckInteractDistance` returning nothing gives `not_measured` and no open cell; the player never opens.
- *Proves it works:* in the game (below).

**3. Holon flows on six tiles (large; not buildable as a reader now).** Visible payoff: none until a channel exists. Risk: high (staleness, and a new file format).
- *Evidence:* the six flows are Sol and Apex links (`packages/triad-369/src/triad_369_process.mjs:192-197`), not WoW data. The addon's only SavedVariables is `FidelityEMatrix_Config` (`FidelityEMatrix/FidelityEMatrix_TBC.toc:6`). The only WoW-to-holon reader is `packages/triad-369/src/wow_adapter.mjs:330-354`, which finds the client's written file, so a holon value would reach the addon only as the file the client writes at logout or reload (general knowledge; needs in-game verification).
- *First step:* none in this round. Needs Codex's Triad-to-WoW channel (entity STEER §3) and an age on the file's own timestamp, using `evidence.mjs` `fileEvidence` (`:18-25`).

## What does not help

- **The four pre-lit atlas orientations** (`tools/gen_e_atlas.mjs`): a texture fix, binds nothing.
- **Warped nebula, jitter and a second star layer** (round 1 list): decoration; the steer itself says so.
- **Measuring nameplates** for position: the client refuses (`EMatrix_World.lua:7-8`, "Can't measure restricted regions"; the stub reproduces it at `tools/ematrix_headless.lua`, nameplate fixtures). Range bands are the most the addon can read.
- **Ageing on the driver's `dt`:** `CheckIdleCondition` detaches `OnUpdate` when nothing moves (`EMatrix_Core.lua:913-920`), so a `dt` age freezes exactly when a source goes stale. Use `GetTime()`, which the stub provides (`tools/ematrix_headless.lua:120`); the client's `GetTime` is general knowledge, needs in-game verification.
- **Raising `MAX_ACTORS`** before the first eight are verified.
- **Headless passes as client proof:** the header says the harness proves "the code paths run" and "what it cannot prove: how the client renders them" (`tools/ematrix_headless.lua:8-9`).
- **Housekeeping:** the harness header names `tools/test_ematrix_lua.mjs` (`:3`); the driver is `tools/ematrix-lua.test.mjs`. Fix the comment.

## First in-game check (after the gate and the actor binding land)

1. Gate on, `/fide box show`, two nameplate units at different ranges plus the player.
2. `/fide cells` should list two bound cells, kinds `measured`, bands matching what the eye sees (near and mid, not far).
3. Walk away from the far unit: its cell should close within the stated threshold (about 1 s at 0.25 s scans, `EMatrix_World.lua:29`).
4. Confirm an unbound cell mid-wave has no glint.
5. Record the checks in `LANDED.md`, with the band readings and the closing time.

Pass: the printed bands and the cell state agree, and the unbound cells show no glint. Fail: a band disagrees with the eye, or a cell stays open after its unit leaves. Either result is an answer to "needs in-game verification".

## Closing table

| Rank | Bridge | Visible payoff | Effort (est.) | Risk | Proves it works |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Registry, API, no-source draw, `/fide cells`, gate | Printable state; draw only when gated | ~3 h | Low | Headless log; login count matches `/fide cells` |
| 2 | Eight actor slots as cells (first binding) | Lit cells per in-range actor, box on | ~5 h | Medium (band semantics) | In-game check above |
| 3 | Holon flows on six tiles | None until a channel exists | Large | High | Needs a channel first |
| x | Atlas, nebula, jitter, stars, raising `MAX_ACTORS` | Texture or none | varies | low | Does not bind; excluded |
