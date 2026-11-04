# B1, the holon on the tiles (council round 4, builder)

Read-only on the code; no git, no network. The HeavyMetal2 repo (hm:universe:v2, PLAN_FRACTAL.md) is not in this checkout, so nothing here is checked against it. Labels: "from the code", "needs in-game verification", "general knowledge", "design choice" (mine, for the owner to sign), "estimate" (effort, not measured).

## Thesis

The bound entity can carry the honest holon flows onto cells 9 to 14 through one generated Lua file, and the client can age that file itself. What it can show is a snapshot of the state at the last load, aged by the client: no live tile, and no flow fresher than the owner's `/reload`. Under the current draw rule only two of the three honest flows can open a cell, F23 and F32, because the draw opens only `measured` sources (`EMatrix_Core.lua:183`) and F31 is a self-report that the code labels `measured` (`triad_369_process.mjs:183-184`), so the bridge must relabel it `symbolic` or a cell opens on it. The eight nameplate sources are a real measured presence, but their value is a constant per band label (`EMatrix_World.lua:149`), so the owner's screen confirmed the band ladder, not a distance. One trap sits in the registry: a wall-clock stamp passed to `BindCell` would read fresh forever (below).

## Ranked list (visible payoff per hour)

**1. Two measured flows, F23 and F32, open on cells 9 and 10 through a generated file.** The bridge is a Node writer on the laptop and a load-time data file.
- Evidence: F23 is a timed SSH read, fresh when Sol's file is at most 180 s old (`triad_369_process.mjs:172`); F32 is a timed push (`:197`). Both carry `kind: 'measured'` (`packages/triad-369/src/evidence.mjs:23`, `:32`). The Apex cycle is every 6 s (`triad_369_process.mjs:566`). The addon loads its data files from the TOC before `EMatrix_Core.lua` (`FidelityEMatrix/FidelityEMatrix.toc:13-15`), so the file is in place before the registry exists; it must write a plain global table, and the registry reads it at login.
- Cells 9 to 14 are free: actor slots publish only indices 1 to 8 (`EMatrix_World.lua:28`, `:321`). The registry keeps one record per index (`EMatrix_Core.lua:160-170`) and `PublishSlot` releases an unused slot's index (`EMatrix_World.lua:152`), so a shared index would be erased. Flows need reserved indices, or an owner key in the registry.
- Shape (design choice): `EMatrix_Flows = { at = <laptop epoch s>, flows = { { id="F23", cell=9, kind="measured", value=<number>, at=<epoch s>, maxAge=180, fresh=true }, ... } }`. `value` is `1 - age/maxAge` (design choice; the owner signs the mapping). The stamp for F23 is the laptop's own judgement time, not Sol's clock, because F23's age is computed on Sol's `at` (`triad_369_process.mjs:171-172`; O2 item 9).
- Freshness: the client computes `time() - at` in the 0.25 s driver (`EMatrix_Core.lua:904-908`) and requires `0 <= age <= maxAge`. `time()` is already used in the repo (`packages/wow-syntropic/Core.lua:73`); that it returns Unix epoch seconds on TBC Anniversary needs in-game verification. The laptop writes and the client runs on one machine, so skew is nil (general knowledge).
- Channel and where it is written: write from the Apex to the live AddOns Data folder, not the repo. H005 copies the repo folder with `robocopy /E` and no purge, then hash-checks 15 files (`bridge/hands/laptop_tasks.json:37-38`); a generated file in the repo would be stale at every deploy and would change that count. The Apex's `LOOP_DIR` is `BRIDGE_ROOT/loop` (`triad_369_process.mjs:17`), and which copy the laptop runs (repo `packages/triad-369/src` or legacy `bridge/loop`) is still open (`docs/council/2026-11-04-bridges/STEER.md`). Settle that first.
- Effort: about half a day (estimate). Risk: medium (clock semantics, copy question).
- First step: a new `packages/triad-369/src/wow_flows_lua.mjs` exporting `flowsLua(flows, nowMs)`, called after the flows array (`triad_369_process.mjs:191-197`) and written with the temp-then-rename pattern (`:60-70`). Commit a seed file with no flows so the TOC test passes (`tools/ematrix-toc.test.mjs:5` requires every listed file to exist). Add `Data\EMatrix_Flows.lua` to the TOCs; H005's expected count becomes 16.
- Tests: Node, `packages/triad-369/test/wow-flows.test.mjs` (new): an F23 fixture aged 100 s writes `fresh: false`; a Sol `at` skewed 10 min leaves the stamp at laptop time. Headless: add `FLOWS_SRC` next to the four sources (`tools/ematrix-lua.test.mjs:25-28`) and a `_G.time` stub beside `GetTime` (`tools/ematrix_headless.lua:120`; the harness has no `time` stub today). Cases: fresh measured opens; wall clock advanced past `maxAge` with no reload closes; a future stamp closes (the missing lower bound, see the trap); symbolic closes.
- Proof in game (needs in-game verification): after `/reload` with `/fide bind on`, cells 9 and 10 open and cell 11 stays closed; with no reload, they close after `maxAge`.

**2. F31 as a labelled, closed self-check on cell 11.** Same file, one more record.
- Evidence: F31 is the Apex's own state write (`triad_369_process.mjs:195`, `evWrite` at `:183-184`), a self-report that the code labels `kind: 'measured'`. `CellOpen` never opens a symbolic cell (`EMatrix_Core.lua:183`). Left as written, a fresh F31 would open cell 11 on the Apex's own clock: the generator must emit `symbolic`.
- Payoff: low. It can only read closed unless the owner rules that a symbolic source may show a labelled state, which the draw cannot express today.
- Effort: about 1 h (estimate). Risk: low.
- First step: a Node test that F31 is written `kind: "symbolic"`; a headless check that the cell reads closed and `/fide cells` prints `symbolic`.

**3. Give the eight actor sources a measured value, or label the band lookup.** A definition fix, not a visible one.
- Evidence: `BAND_VALUE` maps near/mid/far to 1.0/0.5/0.2 (`EMatrix_World.lua:149`), and `PublishSlot` stamps `GetTime()` at each publish (`:154`), so "age 0.0s" shows the scan ran, not the reading's age. `mid` opens because `0.5 >= 0.5` exactly (`EMatrix_Core.lua:183`). The STEER's definition asks for "a number the host read, not a constant".
- Effort: about 2 h (estimate). Risk: low; a stated label is honest, a new measurement needs an API that is not in this repo (any distance call needs in-game verification).
- First step: either print the band as the source's value label, or add a measured distance source with its own `kind`. Test: a headless fixture where two plates share a band must show what the band is, not a number.

**4. The click on a bound cell as an event, delivered at the next reload.** Low payoff.
- Channel: the only client-to-host store the repo declares is SavedVariables (`FidelityEMatrix/FidelityEMatrix.toc:6`); the client writes it at logout or reload (general knowledge, needs in-game verification). So a click is an event only after a reload.
- Effort: about 3 h (estimate). Risk: high if it is printed as live. First step: record the last click's cell and `time()` in `FidelityEMatrix_Config` and let the Apex read it on start.

## What the definition rules out, and what does not help

- Any tile value fresher than the last load. The addon's files are the TOC's (`FidelityEMatrix.toc:12-17`); reading a file during play is general knowledge, needs in-game verification, and nothing in the repo does it.
- F12, F21 and F13 on tiles, for now. F12's push is now gated on an aged Sol (`density_bridge.mjs:125`, `:207`, `solIsUp`), so O2's attack 1 is fixed in the code; but F12 reports a write result, and density's coherence still adds 0.04 for `solUp` (`density_bridge.mjs:129`). F21 has no Sol age (`triad_369_process.mjs:193`). F13 tests the density daemon, not the laptop's daemons (`:194`, O2 attack 3).
- Widening `FRESH_SECONDS` to 180 (`EMatrix_Core.lua:152`). It loosens the actor slots too; each source needs its own limit.
- A wall-clock stamp passed to `BindCell`. `CellFresh` is `now - rec.at <= 2.0` with no lower bound (`EMatrix_Core.lua:182`). An epoch stamp (about 1.7e9) against `GetTime()` gives a large negative number, so the cell reads fresh forever. The flows need their own record and the `0 <= age` check that `solIsUp` uses (`density_bridge.mjs:95-101`).
- Motion between snapshots, or any tile value animated as if live. That is invented data.
- Polling the file, or a SavedVariables channel, for live values (general knowledge, needs in-game verification).
- HeavyMetal2's `PLAN_FRACTAL.md`: not in this checkout; nothing here is checked against it.

## Closing table

| # | Bridge | Channel | Effort (est.) | Risk | Payoff | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | F23 + F32 on cells 9, 10 | generated Lua at load, client ages it | half day | medium (clock, copy) | medium | build first |
| 2 | F31 labelled, closed, cell 11 | same file | 1 h | low | low | after 1 |
| 3 | Measured or labelled actor value | registry (existing) | 2 h | low | none visible | definition fix |
| 4 | Click as event at reload | SavedVariables | 3 h | high if shown live | low | later |
| 5 | Six flows live, F12/F21/F13 on tiles | none honest yet | n/a | high | n/a | ruled out |
| 6 | Tiles fresher than `/reload` | none in repo | n/a | high | n/a | ruled out |
