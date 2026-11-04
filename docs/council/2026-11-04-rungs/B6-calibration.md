# B6: calibration as learning

Voice B6 (builder), round 2026-11-04-rungs. Read-only; names marked "proposed" do not exist yet. "Rung", "awareness", "Light Being", D1 to D7 and Argon's W and g are framing; nothing here measures awareness. `T` = `FidelityEMatrix/EMatrix_Terrain.lua`, `M` = `FidelityEMatrix/EMatrix_Math.lua`, `R9` = `reports/20261104-1321/FidelityEMatrix.lua` on `origin/owner/reports`.

## Thesis

Read as calibration, the nine reports are a learning run: each rung's parameter was fitted from a residual someone measured, and a later report confirmed it or not. The learning lives in the director's head. The parameters are in code (`FRAME_ORDER` T:202, `terrainPitch` T:108, `FIT_BY_FILE` T:274), the residuals in prose (T:264-272; `RESUME.md:5`, `:15`), the update rule and the convergence test nowhere. Every value in T:274 is camera times fill of one reading (3.98 × 0.7, 1.49 × 0.4, 2.15 × 0.17, 1.39 × 0.3; my arithmetic). So nothing can tell a learned value from a guess, or see one go stale: v1.8.7 put trees in 1.5-wide frames (T:38-45) after the tree's fit was confirmed in 0.8-wide ones (`RESUME.md:5`), and the line still says "measured from your reports" (T:307); headless asserts the canopy's interpolated guess (`tools/ematrix_headless.lua:767`) as the stub once asserted the wrong axis (`RESUME.md:157`).

**Missing element:** the learning step per rung (a residual in, an update rule, a convergence test, a context key, a status out), kept as data the addon reads, so a rung counts as learned only when a later reading confirms its fitted value.

**Awareness**, honestly, is then the set of confirmed rungs with their evidence. It can fall when a context changes, which the harness's clock cannot (`apps/fractal-engine/src/harness/SovereignHarness.ts:63-66`). The word stays the owner's; the set is calibration state.

## The rung table

| Rung (learned state) | Input → output | Test | Measure (residual) | Witness | Update; learned; stale | Written back | In client |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Map data (tiles) | the game's tiles → `Data/*.lua` (`tools/ematrix_mapdata.mjs`) | `tools/ematrix-mapdata.test.mjs` | probe: tile FOUND or MISSING (R9:1386) | the client | regenerate; FOUND; a new build (T:72-80) | generator output | yes |
| Axis (order of `UnitPosition`'s returns) | `UnitPosition` → x, y (T:175-181) | headless (`ematrix_headless.lua:724`) | the probe's tile against the player's | the owner's paste; the stub agreed with the error | swap; FOUND; a new client family | code and stub | yes |
| Load (loader order) | path or id → `GetModelFileID` (T:326-347) | headless | failures: "loaded 45, failed 0" (R9:1394) | the client | reorder; 0 failed; a new build | `terrainLoader` | yes |
| Frame kind (`FRAME_ORDER`) | kind → a drawn model (T:202-216) | `visible true` is not one | drawn or not (`reports/20261104-1024`) | the owner's shot, read by the director | the kind that draws; third report; a new client | `FRAME_ORDER` | no |
| Fit per file (k; P = 1, or 2 when proportionality fails) | file → `CameraDistanceFor` (T:296-303) | the red frame (T:501-523) | fill − 1 of the frame's height | the director's eye; the owner's `fit` | k·fill; then the line of 1/fill on k; overflow: bisect; learned when a later reading at k is within ±0.1 (proposed); stale on a new file, aspect, kind or build | `FIT_BY_FILE`, `propFit` (T:778-780) | no |
| Relative position (heights T:34-37, the camera) | placements → screen points (M:264-272; six printed, T:751-757) | scene shots (steps 8, 9) | drawn foot − real foot, px | the director | feeds the camera fit; h·(real px / drawn px); median under tolerance in two facings | camera rung, `HEIGHT_RULES` | no |
| Camera (pitch 0.35 and fovY 1.0 seeds; yaw := facing; zoom read) | `GetPlayerFacing`, `GetCameraZoom` (T:179-180) → `BuildCamera` (M:240-260) | `SolvePitch` round trip, synthetic (`ematrix_headless.lua:392-397`) | none in client (nameplates restricted, `EMatrix_World.lua:8-11`); the offsets above | the director | Gauss-Newton on (pitch, fovY); never learned; stale on a setting, a screen size, pitch on a camera move | `terrainPitch`, `terrainFovY` (T:733-734), in none of the nine saves | zoom and facing only |
| Return path | `FidelityEMatrix_Report` (`EMatrix_Report.lua:83-103`) → `reports/<stamp>` (H009, `bridge/hands/laptop_tasks.json:8`) | `MANIFEST.txt` hashes | the report's stamp and files | the laptop, the director | carries every row's reading | the next version | no |

**Loop back.** Today: the report and H009 bring the readings; the director retypes T:274 and a comment. Proposed: each reading (value, operating point, witness, report stamp, kind, key) enters a ledger; `climb` regenerates a fit table with statuses the addon reads, as `Data/*.lua` is generated now; `CameraDistanceFor` and `FitSource` (T:296-309) read value and status; the frontier writes the next panel's steps (`EMatrix_Report.lua:55-68` is hand-written). The owner's `fit` press already saves `propFit` (T:774-788) but appears in none of the nine saves (R9:2-33 and the other eight): when used it enters as a reading, residual 0 at k, witness the owner.

## The algorithm

```
climb(ledger, readings, context):
 1 append each reading to its rung                                  O(M)
 2 order := topological sort of the rungs (Kahn); a cycle is an error O(R + E)
 3 dirty := rungs with a new reading or a changed key, + descendants  O(R + E)
 4 for r in order, r in dirty:
     if a parent is not confirmed: status := blocked; next
     theta := fit_r(readings of r under its key)
     status := confirmed if the newest reading taken AT theta is within
               tolerance and fresh; at_bound if theta hit a clamp;
               fitted if theta came only from other readings; guess if none
 5 write theta and status per rung, and the per-file table           O(R·P + N)
 6 frontier := fitted, unconfirmed rungs whose parents hold: the next panel
```

`fit_r`: discrete options (axis, loader, frame kind): the option with no recorded failure, O(k·m_r); a file: one reading gives k·fill, two or more the least-squares line of 1/fill on k, O(m_r); an overflow is a censored reading: bisect on log k, one reading per halving; the camera: Gauss-Newton on (pitch, fovY) over pixel offsets, at most I = 20 iterations, O(I(m_r·P² + P³)) (general knowledge).

**Complexity per climb:** O(R + E + M + I·(M·P² + R·P³) + N). Per frame, unchanged: one pass over the pool (T:543-583), one sort per scan (T:390).

**Why polynomial:** each dirty rung is visited once in a fixed order; each fit is a closed form or a capped iteration; nothing enumerates subsets or grids. The cost that matters is readings (nine owner runs between 09:35 and 13:21, the report folders' stamps); closed forms and bisection spend the fewest.

**Exponential, named and replaced.** Nothing in the repo is exponential today: the camera has no search and `SolvePitch` bisects 40 steps (M:294). A naive node design would be:
- which rungs hold, by testing subsets (2^R) → holds(r) = test(r) and every parent holds, one pass;
- a joint camera grid, G steps per parameter (G^P per shot) → Gauss-Newton; one parameter, bisection;
- every lower rung re-run on every climb (R owner runs per climb) → only dirty rungs and their descendants;
- a fit per context product (builds × kinds × aspects × settings, at least 2^d) → key a dimension only after a reading shows it matters: d readings.

## Ranked bridges (visible payoff per hour)

1. **Read the ninth report as confirmation readings** (director, 30 min, no code). Claim: two one-step fits did not converge and the canopy's guess overflows. Evidence, my reading by eye and row brightness of shots `131707`, `131702`, `131711` (low precision; the director's reading governs): the crate at x0.42 (R9:1432) spans 0.15 to 0.94 of the frame's height (fill 0.80) and overflows its width; the jar at x0.37 (R9:1422) at least 0.18 to 0.87, its base behind the player; the canopy at the interpolated x2.8 (R9:1452) is seen from under its crown, overflowing. Next values: crate, the line through (1.39, 1/0.3) and (0.42, 1/0.80) gives 0.30 (the one-step rule 0.33); jar 0.19 to 0.30 over my reading's range, which may sit at the 0.25 clamp (T:299, 302, 780): a clamped value must say "at bound", not cap silently; canopy: bisect log k between 2.8 and 5.6. Proportionality held for the barrel from x3 to x0.6 (`RESUME.md:5`, `:15`) and fails here, so convergence must be read, not computed. Risk: my reading. Proof: the tenth report fills the frame.
2. **The learning step as code** (Opus, 2 to 3 h, low risk). `packages/triad-369/src/rung_calibration.mjs` (proposed): `fitFile`, `statusOf`, `climb`, readings as fixtures with stamps, generating the fit table and statuses. Headless asserts constants (`ematrix_headless.lua:767-770`), not readings. First step and test below.
3. **The camera's first residual** (Opus 3 h, then one owner run; medium risk). The probe prints predicted points (T:751-757; the barrel at 354,313, R9:1389); a scene shot at the same pose gives the real ones, the input `SolvePitch` lacks. `fitCamera(observations, seed)` (proposed), tested on points the real Lua projects through fengari (as `tools/light-being-kernel.test.mjs:4,10` does): pitch and fovY within 0.01 rad from six props at ±3 px in 20 iterations; a shot marked "camera moved" refused. Risk: feet read by eye. Proof: two facings under tolerance with one fovY.
4. **The frontier writes the next panel** (1 to 2 h): the owner presses only what the ladder needs.
5. **The confirmed set on the HUD** (1 h, after the owner's word): "rungs confirmed k of R" and the list, replacing the literal `D3` (`packages/wow-syntropic/Core.lua:36`, `UI.lua:83`) and the connectivity rung (`packages/triad-369/src/density_bridge.mjs:142`); `SovereignTelemetry.awareness` (`apps/fractal-engine/src/rungs/RungTypes.ts:13`) could carry the same ratio.

**Does not help:** a node per density name with no residual; `visible true` as a draw measure; awareness that only rises (`SovereignHarness.ts:63-66`) or graduates on its own coherence (`:136-144`); interpolating fits by keyword height as if learned (T:286-295); a joint camera grid; `SolvePitch` without an input.

## The camera settings

The settings (`OWNER-INPUT.md:9-19`) were read by the director from `WoWScrnShot_110426_132055.jpg`, not by the client: no Lua here reads one (from the code). They change three things. They join every camera fit's context key: a change makes the fit stale. They set stationarity: with Follow Terrain off the pitch should change only when the owner moves the camera, so pitch is learnable per pose and fovY once per client and screen (general knowledge, needs in-game verification); zoom (4.6, R9:1386) and facing are read every frame and never stale. They gate shots: Smart following (5.5) brings the camera behind the player when moving, so yaw = facing (T:593) holds only once it settles; Smart Pivot may move the camera at the ground, which the orbit (M:254-256) lacks; Head Bob off steadies the look-at height (M:237); Max Camera Distance at its minimum caps zoom (all general knowledge, needs in-game verification).

## First step

`packages/triad-369/src/rung_calibration.mjs` and `tools/rung-calibration.test.mjs` (proposed). The test, on the readings with their report stamps: reproduces 2.0, 2.8, 0.6, 0.37 and 0.42 (T:274); bush, tree and barrel `confirmed`, jar and crate `fitted`, the canopy `guess`; the 1.5 aspect demotes the tree to `stale`; a second reading takes the line; an overflow bisects; a clamp reports `at_bound`; one visit per rung on a 64-rung chain; a cycle rejected; a rung above an unconfirmed one `blocked`.

## Closing table

| Item | B6 |
| :--- | :--- |
| Missing element | The learning step per rung: residual, update, convergence test, context key, status, as data |
| Loop back | report, H009, ledger, `climb`, generated table read by `CameraDistanceFor` and `FitSource`; the frontier sets the next panel |
| Camera | context key, stationarity, shot validity |
| Algorithm | O(R + E + M + I(M·P² + R·P³) + N) per climb |
| Conceded | O1: no new measurement, only the update and the status. O2: the confirmed set is calibration, not awareness. O3: above the load rung the witness is a person; the being owns the update. |

For the LEAD: A rung is learned only when its parameter, fitted from recorded residuals, is confirmed by a later fresh reading at that value under the same context key while every rung it rests on is learned; awareness, honestly, is that set with its evidence, recomputed in one topological pass in time polynomial in R, E, P, M and N.

Route: Opus core and spec, ranks 2 and 3 with their tests; Flash WoW and in-game, the tenth report (jar near 0.25, crate 0.30, canopy 5.6, scene shots at two facings after the camera settles, settings unchanged); Argon blind red-team, the tolerance, the censored bisection, whether a person's reading is a measurement, why proportionality fails below x0.5; the owner, the tolerance, whether "awareness" may name the confirmed set, and word when a camera setting changes.
