# B2: control and observability, a rung node as a closed loop

`T` = `FidelityEMatrix/EMatrix_Terrain.lua`, `M` = `FidelityEMatrix/EMatrix_Math.lua`, `Rep` = `FidelityEMatrix/EMatrix_Report.lua`, `R9` = `reports/20261104-1321/FidelityEMatrix.lua` on `origin/owner/reports`. Control terms are framing (general knowledge).

## Thesis

As control loops, the nine reports show a loop that works and no record of why. Each terrain rung has an actuator and a stored parameter (`FRAME_ORDER`, `FIT_BY_FILE`, `terrainPitch`), but the error that set each parameter lives only in prose: the fills 0.7, 0.4, 0.17, 0.3 sit in a comment (T:264-272) and RESUME (:5, :15), not in data. The comparator is the director's eye; the estimator is the director's arithmetic: every fit in T:274 is camera times fill (3.98 × 0.7 = 2.79, 1.49 × 0.4 = 0.60, 2.15 × 0.17 = 0.37, 1.39 × 0.3 = 0.42; B2's arithmetic). Nothing recomputes a parameter, says when it converged, or withdraws a claim when a rung beneath it changes.

## 1. The missing element

Each rung's residual (setpoint minus measure, with witness, age and operating point) is never stored, so no rung has a comparator with a tolerance, an estimator that is a function of its measures, or a gate that holds its claim only while the rungs it rests on hold.

## 2. The node per rung

Sensors: *plant* (the client's result), *echo* (the addon's own command), *witness* (outside the client).

| Rung | Input: setpoint; signal | Output (actuator) | Test | Measure (sensor) | Witness | Written back | Inside? |
|---|---|---|---|---|---|---|---|
| Map data | player's tile exists; game tiles | `tools/ematrix_mapdata.mjs` → `Data/*.lua` | `tools/ematrix-mapdata.test.mjs`; probe `FOUND` | tile, ground 88.7 (R9:1386) | client, plant | data files | yes |
| Axis | Abbey door = 32:48; `UnitPosition` (T:175) | read order | expected tile | probe `FOUND`/`MISSING` | owner's paste (reference) | headless fixture (RESUME:159) | reading yes, reference no |
| Load | file id > 0 | `SetModel` (T:336) | `Loaded` (T:247-251) | `GetModelFileID`: 45/0 | client, plant | retry after 8 s (T:382, T:616) | yes, closed |
| Frame kind | model seen | `FRAME_ORDER` (T:202) | the picture | screenshot (third report) | director; `IsVisible` (T:486), "props drawn" (T:577, T:804) are echoes | `FRAME_ORDER`; headless (`tools/ematrix_headless.lua:766`) | no |
| Fit | fill = 1 per file | `SetCamDistanceScale(k)` (T:316-317) | red-frame fill | fill by eye | director or owner | `FIT_BY_FILE`, `FIT_KNOTS`, `propFit` (T:274-275, T:780) | no |
| Camera | yaw = facing, distance = zoom; pitch, fovY saved | `BuildCamera`, `ProjectPoint` (M:240-272) | `SolvePitch` (M:276), no input (`EMatrix_World.lua:8-11`) | facing 4.09, zoom 4.6 (R9:1386); pitch, fovY none | client (yaw, zoom); nobody (pitch, fovY) | `terrainPitch`, `terrainFovY` (T:733-734), absent from R9:1-33, so defaults 0.35, 1.0 (T:108) | yaw, zoom only |
| Relative position | drawn foot on real foot (RESUME:17) | `Place` (T:394-398) | owner's rule | pixel offset in a scene shot | director or owner | nothing yet: the camera's missing sensor | no |
| Return path | every step recorded, shot | `/fide report` (Rep:70-91), H009 | manifest; "taken"/"not taken" (Rep:87, :101) | nine reports, mean 28 min apart (folder stamps) | laptop, director | next version | partly |

Two loops close inside: the load retry and the registry (`CellOpen`, `EMatrix_Core.lua:199`, applied at `:936`). The frame-kind rung shows the failure: "props drawn 15" while nothing showed (RESUME:79-81, :91), `visible true` on frames that drew nothing (RESUME:59). A loop closed on an echo always passes.

## 3. The loop back

Today a press writes `FidelityEMatrix_Report` and a screenshot (Rep:83-88, :99) into the SavedVariables file (`FidelityEMatrix/FidelityEMatrix_TBC.toc:6`); H009 copies it to `owner/reports` (`bridge/hands/laptop_tasks.json:8-19`); the director reads the picture and edits T:274-275; H005 deploys. The conclusion travels, never the residual. (R9's manifest hash matches after CRLF restoration: B2's check.)

Proposed: the same file carries `propFit` (exists, T:778-780) and a `measures` list in `FidelityEMatrix_Report`: `{rung, key, u, y, ystar, witness, at, version, frameKind, settings}`. A pure estimator reads them and generates the fit table, as `ematrix_mapdata.mjs` does the map data; next time each file's fit, the unmeasured files' knots and each rung's held or blocked state change.

## 4. The algorithm

R rungs, a "rests on" DAG with E edges, P parameters per rung, M records, N files or props.

1. Kahn's topological sort; a cycle is a design error. O(R + E).
2. Ingest: a record whose operating point (version, frame kind, camera settings) differs from the rung's is kept, marked stale. O(M_new).
3. Dirty set: rungs with new records plus descendants, one BFS. O(R + E).
4. Each dirty rung in order: parents' held flags from a memo; a failed parent blocks it. Else calibrate each parameter from fresh valid records:
   - scale (fit): k = u · y / ystar from the record nearest the setpoint (smallest |log(y/ystar)|), O(M_r). Loop gain: if y = (c/u)^a, one report multiplies the log error by (1 − a), so it converges for 0 < a < 2, in one step at a = 1. The barrel's records give a = 0.99, the tree's 0.59 to 1.01 by pair (B2's arithmetic on RESUME:5, :15, :29).
   - monotone scalar (pitch): bisection, as `SolvePitch` does (40 steps, M:294), O(B·M_r).
   - linear (focal): closed-form least squares, O(M_r).
   - coupled (pitch with focal): alternate, T rounds, O(T·B·M_r).
   - discrete (frame kind, K kinds): one fresh frame per kind (T:413, T:439-447), O(K).
   Test: each key's latest residual within tolerance, fresh, from a plant or witness, never an echo. Write back; a parameter moved beyond tolerance marks the children dirty.
5. Emit held, blocked or open per rung, with residual and age. O(R).

Full pass O(R + E + P·M·B·T + K + N); B = 40 and T ≤ 10 are constants, so O(R + E + P·M + N). Per report only the dirty subgraph runs. Polynomial.

Nothing in the repo is exponential today (T:286-295, T:390, M:294). Traps a design could add, replaced: every subset of rungs (2^R) by topological order with a memo; re-testing lower rungs per climb without a memo (a DAG's paths can number 2^R; general knowledge) by memoized flags over dirty descendants; a joint camera grid (G^P) by bisection and least squares, alternated; a joint search over all fits (G^N) by N separate fits, each file measured alone in the centre frame (T:477-481); the human sweep of several multiples per file (RESUME:51) by one press per file.

## 5. Ranked by visible payoff per hour

1. **Residual ledger and estimator for the fit rung (Opus).** Evidence: T:264-272, T:274. Effort 1 to 2 h; risk low, no addon change. First step: `packages/triad-369/src/rung_loop.mjs` and `tools/rung-loop.test.mjs` (proposed). Tests: (a) records of reports 5 to 8 (RESUME:5, :15, :37) reproduce `FIT_BY_FILE` (T:274, read from the Lua source) within 0.01; (b) on y = (2.8/u)^a, a = 0.6, 1, 1.4, from u = 11.2 the fit is within 2% of 2.8 in five steps, exact in one at a = 1; (c) a ladder of 40 diamonds (R = 121, E = 160, 2^40 paths) is gated in exactly R test calls; a failure at layer 10 blocks every rung above, none below; (d) Model-frame records go stale once `FRAME_ORDER` puts PlayerModel first. Proof: the ninth report's readings yield the next fits without hand arithmetic (the canopy, clamped at 2.8 by T:289, overflows its frame in 131711: B2's reading); the tenth's red frames fill.
2. **A fill press in the client (Flash).** `/fide terrain test fill <f>` (proposed) beside `fit` (T:774-787): the camera times f, saved to `propFit`, logged as a record. The owner becomes the comparator in seconds. Evidence: `fit` wants an absolute camera, and has never been used (RESUME:5; no `propFit` in R9:1-33). Risk: eye noise and the binding axis: in crate shot 131707 the planks run edge to edge, so width binds (B2's reading; the director decides); the press takes the larger of height and width fill. Headless test: pick bush, fill 0.5 at x2, then `propFit.elwynnbush09 == 1.0`, pool re-settled, one record added.
3. **A sensor for the camera rung (Flash).** Panel step 2 prints six projected points (T:751-757) and shoots half a second later (Rep:14, :57), but in shot 131658 all six fall under the chat or past the right edge (UI 1507 × 853 scaled to 1851 × 1048: the barrel's (354, 313) lands at pixel (435, 664), in the chat; the tree's x 1551 at 1905; B2's arithmetic). Proposed: a camera step that hides the chat and marks each projected foot; the offset to the real foot feeds the bisection. Effort 2 to 3 h; risk: real object versus copy.
4. **Label echoes (Flash).** "props drawn" counts `Show()` calls (T:577, T:651); `visible true` is `IsVisible` (T:486). Print "shown (a command, not what you see)". Half an hour.

## 6. The camera settings

They fix the operating point. No client option is read anywhere in `FidelityEMatrix/`, so the owner's options shot is their witness; each record carries them, and a change marks camera records stale. With Smart following and auto-follow 5.5 the camera swings back behind a moving character, so yaw = `GetPlayerFacing` (T:179) holds once it settles; with Follow Terrain and Head Bob off, pitch and look-at height should not move with slope or stride, so one pitch per session is a fair estimate (general knowledge, needs in-game verification). Zoom read 4.6 (R9:1386) with Max Camera Distance at its minimum (OWNER-INPUT.md:14); the zoom sets the depth scale (M:305-310) and the copies' size (`EMatrix_World.lua:35-37, 63-70`). Smart Pivot, Water Collision and mouse settings enter no formula.

## 7. What does not help

A node per density name: `activeRungIndex` is connectivity (`packages/triad-369/src/density_bridge.mjs:142`), the HUD's D3 a literal (`packages/wow-syntropic/Core.lua:36`, `UI.lua:83`). `IRungNode` has no test or measure (`apps/fractal-engine/src/rungs/RungTypes.ts:25-26`); `SovereignHarness` graduates on its own coherence (`apps/fractal-engine/src/harness/SovereignHarness.ts:140-145`) and grows awareness on a clock (`:63-66`).

## Closing table

| Item | B2 |
|---|---|
| Missing element | the stored residual: comparator, estimator, gate per rung |
| Algorithm | topological gate, per-parameter closed form or bisection, O(R + E + P·M + N) |
| First step | `rung_loop.mjs` with tests (a) to (d) above |
| Conceded | O1: the ledger adds a residual and a function, not a measurement. O2: rungs held is not awareness. O3: above the load rung the witness is the owner. |
| For the LEAD: | A rung holds only while its latest residual, stored with witness, age and operating point, is within tolerance and every rung it rests on holds; an estimator turns those residuals into its parameter, in O(R + E + P·M + N) per report. |
| Route: | Opus: rank 1. Flash: ranks 2 to 4. Argon: the contraction bound, the nearest-record rule, echo versus plant. The owner: one fill per unmeasured file; camera settings held fixed during calibration. |
