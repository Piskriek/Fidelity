# O3: the measure needs a human (opposer, DECISION, round 2026-11-04-rungs)

Framing: "awareness" and the density names are the owner's and the Triad's words; nothing here measures them. T `FidelityEMatrix/EMatrix_Terrain.lua`, M `EMatrix_Math.lua`, W `EMatrix_World.lua`, Rep `EMatrix_Report.lua`, C `EMatrix_Core.lua`, H `tools/ematrix_headless.lua`, R9 `origin/owner/reports:reports/20261104-1321/FidelityEMatrix.lua`.

## Thesis

Above the load rung the being measured nothing. Frame kind, fit and relative position were settled outside it, the camera not at all: the owner stood at the Abbey door, pressed and saved; the director read the pictures; the owner's words gave the rule. Every being-run check passed through every failure (attack 1). A node the being cannot run is the owner's (for the reading, the director's); filing it under the being hides who measured. Forced correction: the eye on fits and frame kind was the director's. The human the measure needs is the owner's hands, pose and word; the eye is what a tool might take.

**Missing element:** the being has no model of its own blindness: no rung records which measures the host can take and which it must ask the owner for, so the owner's and the director's readings enter the record as the being's own "measured".

## The node per rung, by who runs it

| Rung | Input | Output | Test | Measure | Witness | Written back | In client? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Map data | tiles | `Data/*.lua` | real tiles skipped (`tools/ematrix-mapdata.test.mjs:123`) | `32:48 FOUND` (R9:1386) | host | nothing | yes |
| Axis | `UnitPosition` (T:175) | north-south first | tile found | MISSING, then FOUND (T:170-174) | owner's paste, now host | stub (H:186-188) | yes |
| Load | path, id | model | file id > 0 (T:247-251) | 45 loaded, 0 failed | host (T:248 trusts the call) | `loadStats` (T:244) | yes |
| Frame kind | `FRAME_ORDER` (T:202) | pixels | `IsVisible`, a shown flag | the picture | owner's shutter, director's eye | constant retyped | no |
| Fit | k per file | red-frame fill | fill 1 | "read by eye" (T:262, 267) | director's eye; owner's `fit` (T:778-781) unused | `FIT_BY_FILE` (T:274) retyped | no |
| Relative position | projected foot (T:753-756) | copy on real object | owner's rule (RESUME.md:17) | none numeric | owner's word, director's eye | nothing | no |
| Camera | facing, zoom (T:179-180); pitch, fov saved (T:108) | `ProjectPoint` (M:264) | `SolvePitch` (M:276) lacks input (W:8-10) | none for pitch, fov | host: facing, zoom; nobody: pitch, fov | nothing | partly |
| Return path | panel (Rep:55-68) | shots, lines | "not taken" (Rep:87) | none (Rep:7) | director | prose, constants | no |

## The algorithm (polynomial)

Inputs: R rungs; E edges (map → axis → camera; load → frame kind → fit; all → relative position); per rung ≤ P parameters, tolerance τ, window, admissible witnesses A_r ⊆ {host, tool, director-eye, owner-eye, owner-word}; M readings (rung, key, value, witness, artifact hash, time, settings key); N props; S pixels per shot.

1. Kahn order, O(R + E).
2. Admit readings whose witness is in A_r, hash matches the manifest, settings key is current: O(M).
3. Tool readings: the red frame by its colour (T:509), then the model's extent: O(M·S).
4. Promote a tool only if it matches the eye within τ on every shared artifact: O(M).
5. Calibrate in order: discrete rungs keep the option that succeeded and never failed; fit = k × fill (T:267), least squares of 1/fill on k when several; a clipped fill is censored: bisect log k, one press per step; pitch and fov by Gauss–Newton on placement residuals, O(I·(M·P² + P³)).
6. Gate in order: a rung holds iff its newest admissible reading is fresh, within τ, and its predecessors hold: O(R + E).
7. Write back ledger rows and parameters (fits as data, `terrainPitch`, `terrainFovY`): O(R·P + N).
8. Ask: unheld rungs whose A_r has an owner class, in order, one panel step each: O(R + E).

Total O(R + E + M·S + I·R·(M·P² + P³) + N), polynomial; linear with S fixed and P ≤ 3. Replaced: every rung combination, O(2^R), by one ordered pass; re-running lower rungs per climb, by redoing 5-6 below a changed reading only; a joint pitch × fov × yaw grid, O(r^P), by Gauss–Newton (`SolvePitch` already bisects, M:294); the fewest shots covering all stale rungs (set cover; general knowledge), by one step per rung. Owner presses, O(R + N·log(1/ε)), are the cost in human time: nine reports, 09:35 to 13:21 local.

## Attacks, ranked by how fatal

1. **No being-run test can disagree above load.** `IsVisible` (T:486) is the shown flag (H:89): `visible true` on frames that drew nothing (RESUME.md:59); `npm test` 182 pass, 0 fail while no prop showed (RESUME.md:73, 85); the harness "cannot tell" (RESUME.md:91, 106); the stub copied the axis belief (H:186-188); headless asserts the typed fits (H:767-770). *Check:* set `FIT_BY_FILE.jar01` to 3.7 and `FRAME_ORDER` to Model first, drop the constant asserts, run `npm test`: if all pass, these rungs are not the being's.
2. **The record names the wrong measurer.** `FitSource` says "measured from your reports" (T:307) of constants the director typed by eye (T:267); kinds carry no witness (C:156, 164-178; `packages/triad-369/src/evidence.mjs:48-51`); `fileEvidence` calls any file `measured` (evidence.mjs:23). *Check:* any reading record with a witness field; none.
3. **The only climbing code climbs on its own number.** Graduation is its own coherence ≥ 0.95 for 1.5 s (`apps/fractal-engine/src/harness/SovereignHarness.ts:140-144`); `IRungNode` has no test or measure (`apps/fractal-engine/src/rungs/RungTypes.ts:20-27`); the Triad's rung is connectivity (`packages/triad-369/src/density_bridge.mjs:142`), the HUD's a literal (`packages/wow-syntropic/Core.lua:36`, `UI.lua:83`). *Check:* a rung writer that reads a report; none.
4. **The eye has no stated precision.** Of `20261104-1321/…131702.jpg`: "about 0.9" (B1-ladder.md:32), "at least 0.18 to 0.87, base hidden" (B6-calibration.md:59); the tree's fit spans 2.79 to 3.7 over three readings (B1-ladder.md:27); `FIT_BY_FILE` keeps one number. *Check:* two readers and a tool on the same eight shots.
5. **The owner's word is the one measure not returned.** H009 asks for his line on the fills and the trees (`bridge/hands/laptop_tasks.json:12`); the ninth MANIFEST has none. *Check:* the tenth folder holds it, or the record says "not returned".
6. **The camera has no witness.** Pitch and fov are saved (T:108) yet print like readings (R9:1387). *Check:* an overlay-off shot at the probe's pose, residuals of its six projected points (T:751-756).

## Can a tool take the eye's place?

In memory (no file written), a colour threshold found the red frame in four test shots (`20261104-1247/…124636`, `…124704`, `…124716`, `20261104-1321/…131702`) at rows 315-732, columns 758-1092: 417 × 334 px, 0.398 of the height, aspect 0.80 (T:478-480). Localisation can leave the eye now; the fill cannot, on these shots. A brightness count gave 1.00 for the tree at x2.8 (director: fills), 0.65 for the jar at x2.15 and 0.62 for the crate at x1.39 (director: 0.17, 0.3), 0.82 for the ninth's jar at x0.37. In `…124704` (viewed) the player and a larger figure, by my reading the world overlay's 343 px player copy (R9:1384), fill the frame's lower half; the jar is the small object on the mid-line. The eye separates it, the count does not, so the tree's 1.00 proves nothing. The test never touches the world overlay (searched T) and dims at 0.6 (T:491); an opaque mode exists (T:673).

*Check that settles it:* the test on the opaque backdrop with the world overlay hidden (needs in-game verification), or each shot paired with an empty-frame shot; the tool must match the director's independent readings within τ on every recorded fill, then predict the tenth report's before he reads them. Only then may a fit's witness be `tool`.

## Loop back

Today: panel, `Screenshot()` (Rep:99), Save, H009, `owner/reports`, the director's eye, a retyped constant, H005; the panel measures nothing (Rep:7). The owner node exists: `fit` writes `propFit` (T:778-781), read first (T:281-285, 298) as "your saved fit" (T:306); never pressed (no `propFit` in R9). Proposed: ledger rows with witness and artifact, compiled into a `Data` file read before `FIT_BY_FILE`; `FitSource` prints the witness; step 8's ask list becomes the next panel.

## The camera settings

The director read them from the owner's screenshot (OWNER-INPUT.md:7); no Lua here calls `GetCVar` (searched). So they key every camera reading as owner-word, valid until he says they changed. Max Camera Distance at minimum (OWNER-INPUT.md:14) agrees with zoom 4.6 in all 18 zoom readings in R9: the one camera number the being reads never varied, so a pitch or fov fit holds there only. Smart following and Smart Pivot (OWNER-INPUT.md:13, 17) make yaw = `GetPlayerFacing` (T:179) hold only after the camera swings back; Follow Terrain and Head Bob off (OWNER-INPUT.md:15-16) make one pitch per session fair (both general knowledge, needs in-game verification). Each scene shot needs his "camera at rest".

## First step

The five fits become readings `{file, k_used, fill, witness: "director-eye", artifact, sha256}` from the fifth, seventh and eighth reports (T:266-270); `FitSource` prints witness and artifact; a shot-fill tool (proposed) reads each artifact. Test: every fit has a witness and an artifact whose hash matches its MANIFEST; the tool finds the frame at 0.4 of the height and the file's aspect (T:41-45) in every recorded test shot, and stays unpromoted on today's shots, so the record keeps `director-eye`; a `host` witness is refused for the fit rung. Then the status line names whose reading holds each rung.

## Concessions

The being measures its map, axis (since the fix), load, facing and zoom: those nodes are its own. The eye on fits and frame kind was the director's, so "only the owner's eye" overstates; his hands, pose and word are what no code here replaces. Nobody measured pitch or fov. The frame's location is tool-measurable now, and `fit` already is an owner node. Minimal honest version: every reading names its witness and artifact; a rung is claimed only on an admissible fresh reading; the owner's rule, settings and "works" (`.agents/skills/compassion-loop/SKILL.md:63`) stay his, recorded as owner-word.

## Closing

| | |
| :--- | :--- |
| Missing element | the being's model of its own blindness |
| For the LEAD: | A rung is claimed only on a fresh reading whose named witness (host, a tool that passed its agreement check, the director's eye, or the owner's eye or word) is admissible for it while every rung beneath holds; the being calls its own only what the host measured. |
| Route: | Opus core and spec: witness field, ledger, ask list, shot-fill tool, tests. Flash WoW and in-game: opaque test backdrop, world overlay hidden, overlay-off shots per scene pose, the owner's line per report. Argon blind red-team: is the director a third witness; does agreeing with one reader measure. The owner: which rungs stay his; τ. |
