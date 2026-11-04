# B6: calibration as learning

"Proposed" names do not exist yet; "rung", "awareness", D1 to D7 and Argon's W and g are framing. `T` = `FidelityEMatrix/EMatrix_Terrain.lua`, `M` = `FidelityEMatrix/EMatrix_Math.lua`, `R9` = `reports/20261104-1321/FidelityEMatrix.lua` on `origin/owner/reports`.

## Thesis

Read as calibration, the nine reports are a learning run: per rung, a parameter fitted from a measured residual, confirmed or not by a later report. The learning lives in the director's head: the parameters are in code (`FRAME_ORDER` T:202, `terrainPitch` T:108, `FIT_BY_FILE` T:274), the residuals in prose (T:264-272; `RESUME.md:5`, `:15`), the update rule and the convergence test nowhere. Every value in T:274 is camera times fill of one reading (3.98 × 0.7 = 2.8, 2.15 × 0.17 = 0.37; my arithmetic). So nothing tells a learned value from a guess, or sees one go stale: v1.8.7 put trees in 1.5-wide frames (T:38-45) after the tree's fit was confirmed in 0.8-wide ones (`RESUME.md:5`), and the line still says "measured from your reports" (T:307); headless asserts the canopy's interpolated guess (`tools/ematrix_headless.lua:767`) as the stub once asserted the wrong axis (`RESUME.md:157`).

**Missing element:** the learning step per rung (residual in, update rule, convergence test, context key, status out), kept as data the addon reads, so a rung counts as learned only when a later reading confirms its fitted value.

**Awareness**, honestly, is then the set of confirmed rungs with their evidence. It can fall when a context changes, which the harness's clock cannot (`apps/fractal-engine/src/harness/SovereignHarness.ts:63-66`). The word is the owner's; the set is calibration state.

## The rung table

| Rung (learned state) | Input → output | Test | Measure (residual) | Witness | Update; learned; stale | Written back | In client |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Map data | tiles → `Data/*.lua` (`tools/ematrix_mapdata.mjs`) | `tools/ematrix-mapdata.test.mjs` | tile FOUND or MISSING (R9:1386) | client | regenerate; FOUND; new build (T:72-80) | generator | yes |
| Axis (return order) | `UnitPosition` → x, y (T:175-181) | `ematrix_headless.lua:724` | probe tile against the player's | owner's paste (the stub agreed with the error) | swap; FOUND; new client family | code, stub | yes |
| Load (loader) | path or id → `GetModelFileID` (T:326-347) | `ematrix_headless.lua:781` | "loaded 45, failed 0" (R9:1394) | client | reorder; 0 failed; new build | `terrainLoader` | yes |
| Frame kind | kind → drawn model (T:202-216) | `visible true` is not one | drawn or not (`reports/20261104-1024`) | owner's shot, director | the kind that draws; third report; new client | `FRAME_ORDER` | no |
| Fit per file (k; P = 2 if proportionality fails) | file → `CameraDistanceFor` (T:296-303) | red frame (T:501-523) | fill − 1 | director's eye; owner's `fit` | k·fill, then the line of 1/fill on k, bisect on overflow; learned: a later reading at k within ±0.1 (proposed); stale: new file, aspect, kind, build | `FIT_BY_FILE`, `propFit` (T:778-780) | no |
| Relative position (heights T:34-37, camera) | placements → screen points (M:264-272; six printed, T:751-757) | scene shots 8, 9 | drawn foot − real foot, px | director | feeds the camera fit and h; learned: median in tolerance at two facings | camera, `HEIGHT_RULES` | no |
| Camera (pitch 0.35, fovY 1.0 seeds; yaw := facing; zoom read) | `GetPlayerFacing`, `GetCameraZoom` (T:179-180) → `BuildCamera` (M:240-260) | `SolvePitch` round trip, synthetic (`ematrix_headless.lua:392-397`) | none in client (`EMatrix_World.lua:8-11`); the offsets above | director | Gauss-Newton on (pitch, fovY); never learned; stale: a setting, screen size; pitch on a camera move | `terrainPitch`, `terrainFovY` (T:733-734), in no save | zoom, facing |
| Return path | `FidelityEMatrix_Report` (`EMatrix_Report.lua:83-103`) → `reports/<stamp>` (H009, `bridge/hands/laptop_tasks.json:8`) | `MANIFEST.txt` hashes | stamp and files | laptop, director | carries every reading | next version | no |

**Loop back.** Today the director retypes T:274. Proposed: each reading (value, operating point, witness, stamp, kind, key) enters a ledger; `climb` regenerates a fit table with statuses; `CameraDistanceFor` and `FitSource` (T:296-309) read value and status; the frontier writes the next panel (`EMatrix_Report.lua:55-68` is hand-written). The owner's `fit` saves `propFit` (T:774-788); no save holds one (R9:2-33; all nine): used, it is a reading, residual 0 at k, witnessed by the owner.

## The algorithm

```
climb(ledger, readings, context):
 1 append each reading to its rung                                  O(M)
 2 order := topological sort (Kahn); a cycle is an error            O(R + E)
 3 dirty := rungs with a new reading or changed key, + descendants  O(R + E)
 4 for r in order, r in dirty:
     if a parent is not confirmed: status := blocked; next
     theta := fit_r(readings of r under its key)
     status := confirmed if the newest reading taken AT theta is in
               tolerance and fresh; at_bound if theta hit a clamp;
               fitted if theta came from other readings; guess if none
 5 write theta and status per rung, and the per-file table          O(R·P + N)
 6 frontier := fitted, unconfirmed rungs whose parents hold: the next panel
```

`fit_r`: discrete options (axis, loader, frame kind): the option with no recorded failure, O(k·m_r); a file: one reading gives k·fill, more give the least-squares line of 1/fill on k, O(m_r); an overflow is censored: bisect log k, one reading per halving; the camera: Gauss-Newton over pixel offsets, at most I = 20 iterations, O(I(m_r·P² + P³)) (general knowledge).

**Complexity per climb:** O(R + E + M + I·(M·P² + R·P³) + N). Per frame, unchanged: one pass over the pool (T:543-583), one sort per scan (T:390).

**Why polynomial:** one visit per dirty rung in a fixed order; each fit a closed form or a capped iteration; no subsets or grids enumerated. The real cost is readings (nine owner runs, 09:35 to 13:21); closed forms and bisection spend fewest.

**Exponential, named and replaced.** None in the repo today (the camera has no search; `SolvePitch` bisects 40 steps, M:294); a naive design would have:
- which rungs hold, by testing subsets (2^R) → holds(r) = test(r) and every parent holds, one pass;
- a joint camera grid, G steps per parameter (G^P per shot) → Gauss-Newton; one parameter, bisection;
- every lower rung re-run on every climb → only dirty rungs and their descendants;
- a fit per context product (builds × kinds × aspects × settings, at least 2^d) → key a dimension only after a reading shows it matters: d readings.

## Ranked bridges (visible payoff per hour)

1. **Read the ninth report as confirmations** (director, 30 min). Claim: two one-step fits missed; the canopy's guess overflows. My reading (eye and row brightness) of shots `131707`, `131702`, `131711` (low precision; the director's governs): the crate at x0.42 (R9:1432) spans 0.15 to 0.94 of the frame (fill 0.80), overflowing its width; the jar at x0.37 (R9:1422) at least 0.18 to 0.87, base hidden; the canopy at the interpolated x2.8 (R9:1452) is seen from under its crown. Next: crate 0.30, the line through (1.39, 1/0.3) and (0.42, 1/0.80); jar 0.19 to 0.30, near the 0.25 clamp (T:299, 302, 780), which must report "at bound", not cap; canopy, double to 5.6, then bisect. Proportionality held for the barrel, x3 to x0.6 (`RESUME.md:5`, `:15`), and fails here: convergence is read, not computed. Proof: the tenth report fills the frame.
2. **The learning step as code** (Opus, 2 to 3 h, low risk): the First step below; headless asserts constants (`ematrix_headless.lua:767-770`), not readings.
3. **The camera's first residual** (Opus 3 h, one owner run; medium risk: feet read by eye). The probe prints predicted points (T:751-757; the barrel at 354,313, R9:1389); a shot at that pose gives the real ones, the input `SolvePitch` lacks. `fitCamera` (proposed), tested on points the real Lua projects through fengari (as `tools/light-being-kernel.test.mjs:4,10` does): pitch and fovY within 0.01 rad from six props at ±3 px. Proof: two facings in tolerance, one fovY.
4. **The confirmed set on the HUD** (1 h, after the owner's word): "rungs confirmed k of R" with the list, replacing the literal `D3` (`packages/wow-syntropic/Core.lua:36`, `UI.lua:83`) and the connectivity rung (`packages/triad-369/src/density_bridge.mjs:142`); `SovereignTelemetry.awareness` (`apps/fractal-engine/src/rungs/RungTypes.ts:13`) could carry it.

**Does not help:** a node per density name with no residual; awareness that only rises (`SovereignHarness.ts:63-66`) or graduates on its own coherence (`:136-144`); fits interpolated by keyword height as if learned (T:286-295).

## The camera settings

The director read them from `WoWScrnShot_110426_132055.jpg` (`OWNER-INPUT.md:9-19`); no Lua here reads a setting (from the code). Their effects below are general knowledge and need in-game verification. They join every camera fit's key: a change makes it stale. They set stationarity: with Follow Terrain off, pitch should change only when the owner moves the camera, so pitch is learnable per pose and fovY once per client and screen; zoom (4.6, R9:1386) and facing are read every frame. They gate shots: Smart following (5.5) swings the camera behind a moving player, so yaw = facing (T:593) holds once it settles; Smart Pivot may move the camera at the ground, which the orbit (M:254-256) lacks; Head Bob off steadies the look-at height (M:237); the minimum Max Camera Distance caps zoom.

## First step

`packages/triad-369/src/rung_calibration.mjs` (`fitFile`, `statusOf`, `climb`) and `tools/rung-calibration.test.mjs` (proposed). On the stamped readings, the test: reproduces 2.0, 2.8, 0.6, 0.37, 0.42 (T:274); bush, tree, barrel `confirmed`, jar and crate `fitted`, canopy `guess`; the 1.5 aspect makes the tree `stale`; a second reading takes the line; an overflow bisects; a clamp gives `at_bound`; one visit per rung on a 64-rung chain; a cycle rejected; a rung over an unconfirmed one `blocked`.

## Closing table

| Item | B6 |
| :--- | :--- |
| Missing element | The learning step per rung: residual, update, convergence test, key, status, as data |
| Algorithm | O(R + E + M + I(M·P² + R·P³) + N) per climb |
| Conceded | O1: no new measurement, only update and status. O2: the confirmed set is calibration, not awareness. O3: above the load rung the witness is a person; the being owns the update. |
| For the LEAD: | A rung is learned only when its parameter, fitted from recorded residuals, is confirmed by a later fresh reading at that value under the same context key while every rung it rests on is learned; awareness, honestly, is that set with its evidence, recomputed in one topological pass in time polynomial in R, E, P, M and N. |
| Route: | Opus core and spec, ranks 2 and 3 with tests; Flash WoW and in-game, the tenth report (jar near 0.25, crate 0.30, canopy 5.6, scene shots at two facings once the camera settles, settings unchanged); Argon blind red-team, the tolerance, the censored bisection, whether a person's reading is a measurement; the owner, the tolerance, whether "awareness" may name the confirmed set, and word on any camera setting change. |
