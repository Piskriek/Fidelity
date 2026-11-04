# O1: what the eight sources add (round 4, "can")

Viewpoint: opposer. Read-only. The HeavyMetal2 repo (hm:universe:v2, PLAN_FRACTAL.md) is not in this checkout and is not used. Unmarked code claims are "from the code" with file:line.

## Thesis

The eight actor sources add one bit per cell to what the owner's screen already shows. A cell draws open or closed (`ApplyBindings`, EMatrix_Core.lua:1034-1054), and opens only when a value of at least 0.5 is fresh and measured (EMatrix_Core.lua:183). The sources come from the nameplate list and two yes/no range calls (EMatrix_World.lua:133-166), with a constant value per label (149). Only a near-or-mid range bit is not on screen, and it is a yes/no answer. The entity can do nothing new until a source not on screen binds. Of the three bridges, only the head tracker's eye is such a source, and it is not yet a binding.

## Ranked attacks (most fatal first)

**1. The draw has one bit per cell; value, age and kind are not drawn.** Every open cell gets the same window texture with identity coordinates (EMatrix_Core.lua:324-334), and ApplyBindings changes only face and alpha (1034-1054). Near (1.00) and mid (0.50) both open; far (0.20) and unknown (0.00) both close (EMatrix_World.lua:149; EMatrix_Core.lua:183). The owner's "1.00" and "0.50" appear only in `/fide cells` text (EMatrix_Core.lua:1240-1250). *Check:* with `/fide bind on`, move one unit across the band edges and compare a near cell with a mid cell. The code says the pixels match; needs in-game verification.

**2. The range value is a label, not a distance.** The band comes from `CheckInteractDistance(unit, 3)` and then `(unit, 4)`, and "far" is what both answer not-within (EMatrix_World.lua:133-142). The value is a table entry (149). The yard figures (7, 18, 45) are constants that set copy size and depth (39-44, 296-300). The "measured" kind is correct for the call's answer, but no distance is measured. Argon's rule ("every visual traces to a number") fails for 1.00, 0.50 and 0.20: they trace to a label. *Check:* the range thresholds are stated only in a comment as about 10 yd and 28 yd (EMatrix_World.lua:11). Needs in-game verification with a unit at 15 yd and at 25 yd.

**3. "No source" has no visual form.** A closed face covers no source, far, not_measured and stale alike (EMatrix_Core.lua:183, 1034-1054). The round's definition says a cell "reads 'no source'" (docs/council/2026-11-04-entity/STEER.md section 2), but only `/fide cells` tells the states apart. *Check:* compare the screen with a far unit and with a not_measured unit; expect identical faces.

**4. The age floor cannot fail for the actor sources.** PublishSlot stamps `GetTime()` at publish (EMatrix_World.lua:154), in the same scan that made the range call (165). The scan runs every 0.25 s (28-29, 327-329). The 2 s window (EMatrix_Core.lua:152, 182) fails only if the scan stops, and then Stop releases the cells (EMatrix_World.lua:347-350). So "age 0.0s" measures the scan clock, not an answer's age. This is synchronous and adequate for these sources, but the floor tests nothing here.

**5. The count is capped, and the far units go first.** MAX_ACTORS is 8 (EMatrix_World.lua:28), the player takes a slot first (177), and `n = math.min(#found, MAX_ACTORS)` (268). Sorting puts near, mid, unknown, far in that order (170-175). At most seven units get a cell, and the far ones are the first dropped. The screen can show more units than the cells do. *Check:* with nine or more nameplates, `/fide cells` should list eight slots and no more; needs in-game verification of how many plates appear.

**6. The click is not a source, and its result is overwritten.** A left click calls `TriggerScoreboardWave` with the cell index (EMatrix_Core.lua:604-630, debounced at 607). An off-grid click becomes origin (8, 5) (623). The wave flips a global target (1013), not the clicked cell's state. When a cell settles it takes that target (884-890), but ApplyBindings resets it to CellOpen within 0.25 s (908, 1034-1054). ApplyBindings is skipped only while the wave runs (1035). So with the gate on, a click leaves no per-cell state. Recording a click as a source would need a kind, and a click is an input, not a host measurement. Its source would last 2 s (152, 182). *Check:* with the gate on, click a closed cell and read its face 1 s and 3 s after the settle. Whether an addon may act on a click in combat is general knowledge, needs in-game verification.

**7. A generated Lua file is a snapshot, and its stamp cannot be aged.** The addon's only SavedVariables is `FidelityEMatrix_Config` (FidelityEMatrix.toc:6), and no file reader or wall-clock call exists in `FidelityEMatrix/*.lua` (grep). `BindCell` stamps `tonumber(at) or Now()` (EMatrix_Core.lua:168), so a file that omits `at` is fresh at every load. The Triad's windows differ from the addon's: F32 uses 90 s (packages/triad-369/src/triad_369_process.mjs:186), F23 uses `evSol.fresh` (196), and the addon uses 2 s (EMatrix_Core.lua:152). The Triad's `fileEvidence` also falls back to the file's mtime when no timestamp is read (packages/triad-369/src/evidence.mjs:14, 23), so "measured" can come from a modification time. Whether the client re-reads addon files only at load is general knowledge; needs in-game verification. A flow is therefore live only as of the last `/reload`. *Check:* write a file with an `at` 60 s old, `/reload`, and read the age in `/fide cells`.

**8. The cursor is on screen; the pad is not, but it has no age and no range.** The cursor eye reads `GetCursorPosition` (EMatrix_Core.lua:924-925), and the owner sees the pointer, so it adds nothing. The pad path returns the stick and an axis with no timestamp (807-820). The stick is signed and clamped to [-1, 1] (917-919), and BindCell clamps to [0, 1] (168), so every negative stick reads 0 and closed. The default eye is the cursor (EMatrix_Core.lua:82). *Check:* `/fide eye probe` with the tracker running, and the stick over 10 s; needs in-game verification that C_GamePad answers on this client.

## Concessions the evidence forces

- A cell does show a fact the nameplate does not: the mid-range call. Seven units can be in range at once, a count the screen does not state. Whether plates show beyond 28 yd is a client setting, general knowledge, needs in-game verification.
- The kind is visible only in text. Symbolic (the player, cell 1) and far cells both close, as the owner's screen showed.
- Freshness is real for each scan, since the overlay defaults on (EMatrix_Core.lua:72). It attests that the scan ran, not the answer's age.
- The head is the one input the screen cannot show. Its README calibrates a rest pose (tools/headtrack/README.md).
- The holon's flows reach cells only as a snapshot, labelled "as of the last reload".

**Bridges ranked by the test (binds a source not already on screen):**
1. **Eye via head tracker.** Passes: the head is not on screen. Fails as built: no timestamp, signed value clamped to 0 below rest (attack 8). Live per frame.
2. **Holon flows via a generated file.** Passes the on-screen test. Fails the freshness clause: a snapshot as of the last reload, against a 2 s window (attack 7).
3. **Click as an event.** Fails the test: the click and the wave are already on screen. Its result is erased at settle (attack 6).

**Minimal honest version.** Keep the eight nameplate sources, labelled as "range bit (yes/no call), count capped at seven", not as a distance or a measured value. Draw "no source" as its own state only if the owner approves a new visual. The first honest eye binding is the pad's head pose: a per-frame `at`, kind `measured` only when the read is non-nil, a value mapped to [0, 1] around the rest pose, and a check of the tracker's own sample time. The file bridge is not honest for live flows; a stamped value may appear, labelled "as of reload", and only on a cell whose window exceeds the reload interval.

## Closing table

| # | Attack | Fatal? | Evidence | Settling check |
| :--- | :--- | :--- | :--- | :--- |
| 1 | One bit per cell; value, age, kind not drawn | Yes | EMatrix_Core.lua:324-334, 1034-1054, 183 | Compare near and mid cell pixels with bind on (in-game) |
| 2 | Range value is a label; yards are constants | Yes | EMatrix_World.lua:133-149, 39-44 | Unit at 15 yd vs 25 yd: same band? (in-game) |
| 3 | "No source" not drawn; equals far and stale | Partly | EMatrix_Core.lua:183, 1034-1054 | Far and not_measured units look identical (in-game) |
| 4 | Age floor cannot fail for actor sources | Partly | EMatrix_World.lua:154, 165, 327-329, 347-350 | Stop the scan and time the release (code test) |
| 5 | Count capped at 7 units, far dropped first | Partly | EMatrix_World.lua:28, 170-177, 268 | Nine plates: `/fide cells` shows eight (in-game) |
| 6 | Click leaves no per-cell state; overwritten at settle | Yes for click | EMatrix_Core.lua:604-630, 884-890, 908, 1013 | Read face 1 s and 3 s after settle (in-game) |
| 7 | File is a snapshot; stamp defaults to load time | Yes for live flows | EMatrix_Core.lua:152, 168; FidelityEMatrix.toc:6; triad_369_process.mjs:186, 196; evidence.mjs:14, 23 | File with 60 s-old `at`, `/reload`, read age (in-game) |
| 8 | Pad eye unstamped; negatives clamp to closed | Yes for the pad | EMatrix_Core.lua:807-820, 917-919, 168 | `/fide eye probe` over 10 s (in-game) |
