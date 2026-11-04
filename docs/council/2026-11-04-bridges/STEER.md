# STEER: council round 2026-11-04-bridges, vector steering and bridge checks

Written 05:05Z by the director (Claude in the cloud). Six voices: B1 binding architect, B2 channel builder, B3 vector steering; O1 the WoW inputs, O2 the holon's flows, O3 the chain to the owner. Every claim used below was re-checked against the code; where a claim was landed as a fix, the fix has a test.

## The bridge checks: what holds, what broke, what was fixed this round

**The WoW inputs (O1).** No input in the addon carried an evidence kind; the HUD printed four literals, a literal coherence and a structurally-zero strain as readings; the "FTLE" heuristic measured a jump from (0, 0) whenever the map gave no position, so one zone crossing could trip DEVIANT. Verified in the code. Conceded: the click passes as a named, fresh event; the cursor and pad are the viewer's inputs; a nameplate token plus `UnitExists` is a present-or-absent reading per scan; range bands are labels, and "unknown" (the call did not answer) is not "far". **Fixed:** the HUD prints `seed` and `not measured` where nothing writes a value and only numbers with a writer as readings (`packages/wow-syntropic/UI.lua`, both copies); the kinematics only measures displacement between two samples that both had a map position. **Open:** the (8, 5) fallback origin for an off-grid click; the pad eye has no age; `GetCameraZoom`'s fallback of 8 yd looks like a reading.

**The holon's flows (O2).** Sol's `up: true` is written by Sol's own 60 s timer and the density bridge read it with no age check, so a dead Sol stayed "up" while its SSH daemon answered; the density status was the constant `synchronized`; the copy `triad.bat` runs has literal flows; F13 tests the density daemon, not the laptop's daemons; F31 is a self-check; coherence is integrity × 0.99; the Arena sync stamps "verified" when two ids match. Verified. **Fixed:** `solIsUp(sol, now)` with a 180 s age floor, tested; the density status is derived (`local_only`, `sol_unreachable`, `sol_read`, `synchronized`, `push_failed`), tested. **The minimal honest set a cell may show today:** F23 (age-floored), F32, and F31 labelled self-check; F12, F21, F13, the hands heartbeat and the Arena are not cell-ready.

**The chain to the owner (O3).** H005 pointed the laptop at `claude/ematrix-depth` (v1.6.1) and its own gate would have blocked; the build on your screen came from this branch through no task; no laptop result has ever reached the repo and the probe is unpasted; the Triad side runs the legacy copy; two checkouts under one task allow silent partial success. **Fixed:** H005 retargeted at this branch with a v1.7.4 gate, one checkout named, the report required to carry the commit and the toc version, and the owner's pastes named one by one. **Open and the owner's:** run it, paste; H007 for the arena daemon; the legacy copy's restart.

## Vector

1. **Bind before you decorate is now a switch.** v1.7.4 carries the registry (`ns.BindCell`, `ns.ReleaseCell`, `ns.CellSource`, `ns.BoundCounts`), the world overlay publishing its eight actor slots as sources (`actor:<token>:<band>`, value near 1.0 / mid 0.5 / far 0.2, kind `measured` when the range check answered, `not_measured` when not, `symbolic` for the player), `/fide cells`, the login line counting cells with a source, and the gate `/fide bind on|off` (default off: nothing on screen changes until the owner turns it on; on: bound cells open when fresh, measured and at least 0.5, unbound cells stay closed with no glint). Next on this line, in order: the owner's in-game word on the gate; B1's glint rule for unbound cells during the wave itself; then the six flows through a generated Lua file read at `/reload` (B2's rank 2), but only the honest set O2 named.
2. **Every shown number carries its kind.** Done this round for the HUD and the density status. Next: the Apex's `Vtx` and `Pxd` clocks labelled `symbolic`, `Aq`'s hard-coded gate `not_evaluated`, the 12/13 daemon defaults replaced by `null`, the legacy `bridge/loop` copy retired (rewrite H001 to name `packages/triad-369/src`; the restart is the owner's).
3. **One deploy path.** RESUME's four commands and H005 now agree on this branch. The landing closes on the pasted login line, which now counts the cells with a source.
4. **Held for the owner's word, with the cost said plainly:** the E atlas with one sun (no cost); spin 0 and gain cap 1.0 (the cost: the subject stops turning at rest; the textured, animated mobs you liked are the overlay copies and are not touched by this).
5. **Stop:** frame alternation; glasses-free claims; more texture before the binding is seen; any constant printed as a status.

## First step

Landed as v1.7.4 (169 tests, 168 pass, 1 skipped; headless 58/58; math 12/12):
- the binding registry, the slot sources, `/fide cells`, `/fide bind`, the login count (B1's design, behind the gate);
- `seed` / `not measured` on the FidelityWoW HUD, the `measured` flags set by the two real writers (FTLE, entropy);
- the kinematics false-teleport fix (both addon copies identical);
- `solIsUp` with an age floor and the derived density status, each with a test;
- H005 retargeted at this branch with a v1.7.4 gate.

## Forbidden until verified

- Turning `bindCells` on by default, or any claim that the box "shows the world", before the owner has seen the gate on.
- Printing any seed as a reading again; `synchronized` as a constant anywhere.
- Changing the overlay defaults; merging to `main` by hand; the six-flow binding before O2's honest set is what the flows report.

## The check that settles it

1. Flash runs the retargeted H005 (v1.7.4) and the result carries the commit and the toc version and 15 matching hashes.
2. The owner pastes the login line: it must say `cells with a source N of 135 (M fresh and measured)` with N the actors on screen plus the player.
3. With a few mobs around: `/fide cells` (one line per slot: token, band, value, age, kind), then `/fide box show`, `/fide bind on`, a click: the slot cells follow the mobs (near and mid open, far closed), every other cell closed with no glint; `/fide bind off` restores the box. Paste what happened.
4. The HUD after `/reload`: `Coherence: seed | Strain: not measured`, `S=seed(...)`, and the FTLE as a number once you have moved; `/fidelity audit` after crossing a zone line must not say DEVIANT on its own.
5. H007's inventory, and the owner's word on round 2's definition and on item 4 above.

## Next round's ASK

"What the bound entity can do": with eight real sources on eight cells and the honest flow set named, which bridges does the entity make possible (the holon on the tiles through a generated file; the eye; the click as an event) and which does it rule out. Builders and opposers, haiku, one file each.
