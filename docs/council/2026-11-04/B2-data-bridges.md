# B2: New data bridges (builders' council, 2026-11-04)

**Thesis.** EMatrix learns little about the world beyond what the window shows. Distance comes from two range checks (about 10 and 28 yd, `EMatrix_World.lua:11`), heights from a keyword table that defaults to 3 yd (`EMatrix_Terrain.lua:33-46`), and data from nine tiles. Three cheap probes could replace guesses with measurements: `UnitPosition` on group and nameplate tokens, the nameplate's scale as a distance proxy, and M2 bounding boxes in the converter. The return path matters as much: the addon writes only `FidelityEMatrix_Config` (`FidelityEMatrix_TBC.toc:6`), and the hands channel carries JSON text only, so each tuning round still depends on screenshots pasted by the owner. A SavedVariables log plus a hands task would close that loop. Claims are marked as repo evidence (file:line) or as general WoW API knowledge that needs in-game verification.

## Ranked proposals

**1. Measure distance with `UnitPosition` instead of bracketing it.**
- Claim: group members, and possibly nameplate tokens, give exact world positions, so distance becomes a number.
- Evidence: the repo calls `UnitPosition("player")` only (`EMatrix_Terrain.lua:161-163`); the bands come from `CheckInteractDistance` (`EMatrix_World.lua:131-141`). Whether `partyN` or `nameplateN` tokens work on TBC Anniversary is general API knowledge, uncertain.
- Effort: low. Value: high. Risk: restricted calls may error; guard with `pcall` and treat `nil` as unavailable.
- First step: a `/fide diag` probe printing `pcall(UnitPosition, "party1")` and `pcall(UnitPosition, "nameplate1")`, with error text.
- Proof: with a party member at a distance `CheckInteractDistance(…,3)` confirms, the `UnitPosition` distance agrees within about 1 yd over 20 samples and moves when the member walks.

**2. Read the nameplate's scale as a continuous distance proxy.**
- Claim: the copies already inherit the plate's scale (`EMatrix_World.lua:102-108`), so the plate's scale gives distance without measuring the plate.
- Evidence: plate measuring is refused (`EMatrix_World.lua:8-9`). Whether `GetScale` on a plate is restricted is uncertain. The repo reads no nameplate cvars. Retail-era names (`nameplateMinScale`, `nameplateMaxScaleDistance` and similar) are general knowledge; their presence here is uncertain.
- Effort: low. Value: medium to high. Risk: the scale function may not be linear; cvars may be unreadable.
- First step: `pcall` the plate's `GetScale`; print `GetCVar` for each candidate name.
- Proof: the scale falls as a mob walks away, and the copy's on-screen height follows it within 10%.

**3. Real prop heights from M2 bounding boxes in the converter.**
- Claim: replace keyword heights with each model's box, scaled by the placement scale.
- Evidence: `NominalHeight` falls back to 3 yd, with the comment "until bounding boxes are read from the models" (`EMatrix_Terrain.lua:33-46`). The converter reads placement scale (`tools/ematrix_mapdata.mjs:126`) but never opens an M2. `fileUrl` (`tools/ematrix_fetch_tiles.mjs:45-47`) takes any FileDataID, but `tileFileIds` (`:18-43`) maps ADT names only. That the M2 header holds a bounding box is general format knowledge; the offsets are uncertain and need the wowdev wiki.
- Effort: medium. Value: high for terrain. Risk: wrong offsets give plausible wrong sizes.
- First step: fetch one tree M2 by FileDataID, parse the header, print the box beside the keyword estimate.
- Proof: `/fide terrain probe` gives a pixel height for one tree that agrees with a screenshot measurement within about 10%. Store the box per model path, not per placement.

**4. A finer distance ladder from spell and item range checks (LibRangeCheck style).**
- Claim: more brackets than two sharpen each unit's band.
- Evidence: bands are near, mid and far only (`EMatrix_World.lua:39-44`). The range functions are general API knowledge; names and availability are uncertain. Usable spells depend on class.
- Effort: medium. Value: medium; gives brackets, not exact yards. Risk: class-dependent ladders.
- First step: probe one harmful and one friendly spell from the spellbook with `pcall(IsSpellInRange, …)`.
- Proof: at stepped distances the ladder answers in order, with no reversals over 20 steps.

**5. Export the overlays' own measurements to SavedVariables.**
- Claim: a small `FidelityEMatrix_Log` (band or distance, height, zoom, focal length, frame type, probe results) is flushed to disk on logout or `/reload`.
- Evidence: the addon declares only `FidelityEMatrix_Config` (`FidelityEMatrix_TBC.toc:6`). The only export that exists is the Syntropic addon's `FidelityWoW_Export` (`packages/wow-syntropic/FidelityWoW.toc:5-6`). Flush timing is general WoW knowledge.
- Effort: low. Value: medium to high. Risk: positions of other players must stay out; apply the opt-in gate the Syntropic addon uses (`packages/wow-syntropic/Core.lua:73-80`).
- First step: write the log from `/fide world status` and `/fide terrain probe`, behind `/fide log on`.
- Proof: after `/reload` the file exists in the account's SavedVariables and its numbers match the status line.

**6. The hands channel as a two-way instrument.**
- Claim: the laptop reports probe output and the log each cycle, with no pasting.
- Evidence: `hands_sync.mjs` parses the results file as JSON, redacts it and pushes it (about lines 199-216); non-JSON is refused. So a screenshot cannot travel as a file, only as base64 inside JSON or through a second path. The 20 KB per-task cap is a rule (`bridge/hands/LAPTOP-HANDS.md:74`); a grep of `hands_sync.mjs` found no size check.
- Effort: medium. Value: high for the feedback loop. Risk: secrets (redaction is pattern-based, `LAPTOP-HANDS.md:83`) and output size.
- First step: a laptop task that copies the log into `output`, trimmed to 20 KB.
- Proof: after one logout, the table appears in `laptop_results.json` within one 20 s cycle, and `hands.log` shows the expected byte count.

**7. More tiles and zones, and their size.**
- Claim: coverage can grow one zone at a time with a known cost.
- Evidence: the tbc file holds nine tiles in 1,226,865 bytes, about 136 KB per tile. About 657 KB is heights and about 5,070 object entries are doodads plus WMOs (grep counts, approximate). The 2.x TOC loads only that file (`FidelityEMatrix_TBC.toc:9-10`).
- Effort: low per zone; the listfile and wago fetch are external. Value: medium. Risk: memory and load time; measure `collectgarbage("count")` before and after (general Lua knowledge).
- First step: convert one adjacent block as a `LoadOnDemand` addon and measure its size and load time.
- Proof: `/reload` time and memory rise by the expected amount, and terrain status counts the new placements.

**8. `head.json` consumers.**
- Claim: head data could feed the daemons, and the eye could be logged.
- Evidence: the fields are listed in `tools/headtrack/README.md:68-70`. A grep for `head.json` across `.lua`, `.mjs`, `.py` and `.md` found only the writer and docs; no reader is in this checkout. The addon cannot read files (general WoW sandbox knowledge).
- Effort: low. Value: low now. Risk: none significant.
- First step: a reader that logs `z` and `lost` each second.
- Proof: the log shows the lean and lost-face events the README describes.

**Not recommended:** feeding EMatrix data into the verifier. `wow_adapter.mjs` reads `FidelityWoW` exports only, behind a consent check (around line 212), and EMatrix positions would be a privacy and scope change with no clear gain.

## Closing table

| # | Bridge | Value | Effort | Feasibility | Risk | Proof |
|---|---|---|---|---|---|---|
| 1 | `UnitPosition` on party and nameplate tokens | High | Low | Uncertain | pcall-guarded | 20 samples within 1 yd |
| 2 | Plate scale and cvars as distance | Med-High | Low | Uncertain | Non-linear scale | Monotonic; height within 10% |
| 3 | M2 bounding boxes in converter | High | Medium | Format known, offsets uncertain | Wrong offsets | Tree height within 10% |
| 4 | Spell and item range ladder | Medium | Medium | Uncertain names | Class-dependent | Ordered steps over 20 distances |
| 5 | Overlay SavedVariables log | Med-High | Low | Known mechanism | Privacy if misused | File matches status after `/reload` |
| 6 | Hands as two-way instrument | High | Medium | JSON only today | Secrets, size | Results line within one cycle |
| 7 | More zones as LoadOnDemand | Medium | Low per zone | Pipeline exists | Memory, load time | Measured size and load time |
| 8 | `head.json` reader | Low | Low | Writer only | None | Logged lean and lost events |
