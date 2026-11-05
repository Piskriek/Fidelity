# O1: ceremony, not awareness (opposer, round 2026-11-04-rungs)

Abbreviations: T `FidelityEMatrix/EMatrix_Terrain.lua`, M `EMatrix_Math.lua`, W `EMatrix_World.lua`, R `EMatrix_Report.lua`, C `EMatrix_Core.lua`, H `tools/ematrix_headless.lua`, R9 `origin/owner/reports:reports/20261104-1321/FidelityEMatrix.lua` (the ninth report; RESUME's newest section is still the eighth, `RESUME.md:3`).

## Thesis

Every rung the terrain climbed already has the owner's node under other names: an input, an output, a test, a measure and a write-back (section 2). The eight builders wrap that one table in eight new modules, and none adds a measurement. The camera lacks a measure because the client gives no pitch and no measurable nameplate; no node changes that. The evidence forces narrower concessions: the readings above the load rung live as prose, the status line prints a saved pitch as if read, and nothing refuses a claim resting on an unread parameter. So the honest addition is a label, a probe and at most one ledger, not a node per rung. "Awareness" and D1 to D7 are framing.

## 1. The missing element

The being lacks a reading, not a node: pitch and field of view are saved constants printed as readings (pitch, focal: T:108, 749-750, 804-807). The measure that could replace them, the probe's predicted positions against the picture taken 0.5 s later (R:14, 57; T:751-756), has never been read as a number.

## 2. The node each rung already has

| Rung | Input | Output | Test | Measure; witness | Written back | In client |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Map data | ADT (`tools/ematrix_mapdata.mjs:7, 221`) | `Data/*.lua` | synthetic tile (`tools/ematrix-mapdata.test.mjs:2-3`) | probe FOUND (T:742-744); client | regenerated | yes |
| Axis | `UnitPosition` (T:170-175) | `PlayerState` (T:181) | owner's numbers as fixture (H:724-730) | owner's probe (`RESUME.md:106`) | stub, fixture (H:186-191) | yes |
| Load | `SetModel` (T:336) | `loadStats` (T:244, 339-345) | `GetModelFileID` (T:247-251); stub 424242 (H:198-201) | "loaded 45 failed 0" (R9:1385) | retry (T:28), loader (T:735) | yes; trusts the call without it (T:248) |
| Frame kind | `FRAME_ORDER` (T:202) | PlayerModel (T:206-208) | `IsVisible` is the stub's flag (H:89) | owner's screenshots (`RESUME.md:59`) | `FRAME_ORDER` (T:197-202) | no |
| Fit | `FIT_BY_FILE`, `propFit` (T:274-285) | `SetCamDistanceScale` (T:315-317) | typed constants (H:767-770) | fill by eye (T:267; `RESUME.md:5, 15`); director | table retyped; `propFit` unused | no |
| Projection (camera and position, one rung) | facing, zoom (T:179-180); saved pitch, fov (T:108) | props (M:240-272) | `SolvePitch` round trip (H:392-397) | scene pictures; probe in step 2 only (R:57, 62-64) | `terrainPitch`, `terrainFovY` (T:733-734) unused | not yet (W:8-9) |
| Return path | `Report.STEPS` (R:55-68) | the SavedVariable | H:1240-1242 | none (R:7) | H009 (`bridge/hands/laptop_tasks.json:8-28`) | n/a |

A new node adds only a name to each row.

## 3. Ranked attacks

1. **Eight names for one table (most fatal).** The modules are `rung_ledger` (`B1-ladder.md:93`), `rung_loop` (`B2-control.md:58`), `rung_ladder` (`B3-irungnode.md:52`), `witness_ladder` (`B4-witness.md:81`), a camera test (`B5-camera.md:97`), `rung_calibration` (`B6-calibration.md:72`), `rung_nodes` (`B7-holon.md:30`) and `rung_handshake` (`B8-argon.md:82`). All eight algorithms are Kahn, a dirty set and a fit (B1:40-54, B2:40-52, B3:58-70, B4:46-55, B5:58-68, B6:33-47, B7:49-56, B8:49-64). Each row is the registry's record (C:164-180) plus "rests on". Check: map every proposed field to C:164-180 or a citation above. Whatever maps to neither is new.
2. **No node supplies the missing measure.** The client gives facing and zoom, not pitch (M:231-233). The nameplate `SolvePitch` needs is restricted (W:8-9), so its only caller (H:395) is a test that recovers the pitch it built (H:392-397). Check: no call in `FidelityEMatrix/`.
3. **The harness pins readings; it cannot take one.** It says so (H:7-9). `IsVisible` is a stub flag (H:89), so "visible true" printed while Model frames drew nothing (`RESUME.md:59`). The fit tests assert typed constants (H:767-770). The axis stub copied the wrong belief (H:186-188). The kernel tests compare JS with Lua (`tools/light-being-kernel.test.mjs:41-147`). Check: set the tree's fit to 5.0; only the pin at H:770 fails.
4. **The camera sub-nodes share one measurement.** B5 measures its yaw, pitch and fov nodes by scene residuals (`B5-camera.md:34-37`) and rests position on them (`B5-camera.md:41`). Those residuals are the position readings, so "position holds when the camera holds" cannot fail on its own.
5. **Rungs without measures already exist.** The HUD's rung is the literal D3 (`packages/wow-syntropic/Core.lua:36`, `UI.lua:69`), printed bare beside "seed" (`UI.lua:80-83`; `WoWScrnShot_110426_131658.jpg`). The Triad's rung is connectivity (`density_bridge.mjs:142`). `IRungNode` has `update` and `setTransitionAlpha` only (`RungTypes.ts:20-27`). Its awareness is a ramp of 0.02 per second capped at 0.65 (`SovereignHarness.ts:15, 48, 63-67`); graduation is its own coherence (`SovereignHarness.ts:140-145`). A per-rung awareness node adds a fourth.
6. **The write-back channels sit unused.** The pitch, fov and fit commands (T:733-734, 778-787) write SavedVariables, but R9's config holds none of them (R9:2-33). H009 still reads `requested` (`laptop_tasks.json:27-28`) although its report landed.
7. **The bound is met; the cost is reports.** No code enumerates rung combinations. The only searches are a 40-step bisection (M:294) and one sort per scan (T:390) over at most 24 props (T:21). Reports come 21 to 35 minutes apart (folders 0935 to 1321), so reports per climb are what must stay polynomial.

## 4. The loop back

Today the director retypes `FIT_BY_FILE` (T:274-275). The owner can save `propFit`, `terrainPitch` and `terrainFovY` (T:733-734, 778-781); a saved fit re-settles the pool at once (T:782-787). A finding becomes a fixture (H:725-730). The transport is R, the SavedVariable, H009 and `owner/reports`, with SHA256 per file. The saved file's hash matches only with CRLF restored (git holds 143,328 bytes, the manifest 144,917). Minimal version: the same channels, plus one ledger row per reading (rung, witness, artifact and line, value, at, context). Next time, a reading beyond tolerance or a changed context reopens that rung and its descendants.

## 5. The camera settings

No Lua here reads a setting (no `GetCVar` in either addon or H). They are the director's reading of the options picture (`OWNER-INPUT.md:7-19`), so they change one thing: every projection reading's context key. All 18 zoom readings in R9 say 4.6; with the slider at its minimum (`OWNER-INPUT.md:14`), whether the client pins the zoom there needs in-game verification. Follow Terrain and Head Bob off should hold pitch constant within a session (general knowledge, needs in-game verification), so one saved pitch is the right shape. Smart following puts yaw at the facing (T:179) only after the camera swings behind (general knowledge, needs in-game verification). In the ninth run's step 2, the probe put the camp's props at x 346 to 354 of 1507, left of centre (R9:1386-1393). By my eye, that picture's barrel and crate stand right of centre and no copy is at the predicted place. That unrecorded pair is the first camera reading (needs in-game verification: the same pose, overlay off).

## 6. The algorithm

Inputs: R rungs, E rests-on edges, P ≤ 3 parameters per rung, M readings, N props.

1. Bucket readings by rung; drop any whose context is not current. O(M).
2. Kahn's order; a cycle is an error. O(R + E).
3. Dirty set: rungs with new readings, plus descendants. O(R + E).
4. Per dirty rung, in order:
   - Fit: fill = fit / k, so fit = Σ(f/k) / Σ(1/k²). O(m).
   - Projection: Gauss-Newton, I ≤ 10, at O(I(mP² + P³)); pitch alone by bisection at O(40m).
   - holds = a reading, residual ≤ τ, every base holds. O(1 + degree).
5. Write back through the existing channels and re-settle the props. O(RP + N).
6. Frontier: each unheld rung whose bases hold becomes one panel step. O(R + E).

**Total:** O(M + R + E + I(MP² + RP³) + N). With I and P bounded it is linear: each reading, rung and edge is touched boundedly often.

**Exponential parts replaced:**
- Subsets of held rungs (2^R): the held set is closed downward, so one ordered pass decides it.
- A grid over camera parameters (G^P): least squares or bisection.
- Re-running lower rungs on every climb (O(R²) reports): the dirty set, since step 2 re-reads every lower host number in one press (R:57).
- Fewest presses (set cover, NP-hard, general knowledge): not attempted; one step per frontier rung.

On the record, the tree's x3.98 at fill 0.7 and x6 at 0.55 (`RESUME.md:15`) give fits 2.79 and 3.30 (computed here); the barrel's give 0.60 twice. No file records the tree's residual.

## 7. Concessions, and the minimal honest version

The evidence forces four concessions.
- (a) The tests are pins, so they are "the nodes" only with the owner's eye as the measure (O3's point).
- (b) The readings above load live in prose and comments (`RESUME.md:5, 15`; T:264-272), so no code compares new readings with old.
- (c) Nothing refuses a claim on an unread parameter: "standing where the real objects stand" (`RESUME.md:9`) was written over a constant pitch.
- (d) The probe and status print that constant as a reading (T:749-750, 804-807), against `.agents/skills/compassion-loop/SKILL.md:59`, while fits already name their source (T:304-309).

**Salvageable:** one ledger, B1's by name with the other seven rejected: the registry's fields (C:164-180) plus witness, context and "rests on", the pass above, and labels where numbers print.

**Not salvageable:** an `IRungNode` change before any fractal rung has a measure; a node per camera parameter; an awareness number not labelled symbolic.

## 8. First step

Add `"terrain probe"` to scene steps 7 to 9 (R:62-64; B1's first step, `B1-ladder.md:88`). Print "pitch 20.1 deg (saved, not measured)" and the focal (from the saved fov) likewise, as `FitSource` does for fits.

Headless test:
- each scene step captures a `probe:` line with screen positions;
- the default pitch reads "saved, not measured", and after `/fide terrain pitch 25` it reads "your setting, not measured";
- no camera number prints without its kind.

| Question | O1's answer |
| :--- | :--- |
| Missing element | a recorded reading, labelled where it prints; not a node |
| Node per rung | already held (section 2); a new one adds a name |
| Loop back | existing channels plus one ledger |
| Camera settings | the context key; zoom 4.6 throughout; yaw unverified |
| Algorithm | O(M + R + E + I(MP² + RP³) + N), linear when bounded |
| First step | probe in scene steps, labels, one headless test |

For the LEAD: A rung claims only on a recorded reading with its witness and context, checked once in dependency order; the rest already exists, so add one ledger and two labels, not a node per rung.

Route: Opus core and spec (ledger, labels, test); Flash WoW and in-game (the next report, with step 2's pose repeated overlay-off); Argon blind red-team (can the camera sub-nodes fail independently; does the tree's residual break the fit rule); the owner (do the camp's copies stand on the real camp).
