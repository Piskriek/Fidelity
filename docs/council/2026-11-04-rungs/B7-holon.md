# B7: the holon and the fidelity process

B7, builder. Any name grep cannot find in the code is proposed; "rung", "awareness", D1 to D7 and the octave are framing. `TP` = `packages/triad-369/src/triad_369_process.mjs`, `DB` = `packages/triad-369/src/density_bridge.mjs`, `T` = `FidelityEMatrix/EMatrix_Terrain.lua`, `R9` = `reports/20261104-1321/FidelityEMatrix.lua` on `origin/owner/reports`.

## Thesis

The holon judges its links as the owner wants rungs judged: a flow is active only on timestamped evidence (TP:140), as a cell opens only on a named, measured, fresh source (`EMatrix_Core.lua:194-199`). Its rung is judged by nothing. Four writers set it, none testing a climb: a connectivity tier (DB:142; D5 without an SSH key, DB:121, 129); a HUD literal (`packages/wow-syntropic/Core.lua:36, 101`), unlabelled where its neighbours say seed (`UI.lua:83` against `:80-82, 96`; seen in R9's folder, `WoWScrnShot_110426_131655.jpg`); a zoom band (`apps/fractal-engine/src/camera/FractalCameraController.ts:330-337`); seeds (`packages/triad-369/src/bootstrap.mjs:44`; `bridge/sync/triad_telemetry.json:32-34`, rung 7 beside D6). The Triad's loop-back slots are empty: `rungs_traversed: []` (TP:492), DECISION and NEWS BACK `not_evaluated` (TP:469-474), `loop_closed: false` (TP:500); three checks pass on a literal `true` (TP:215, 221, 225). The reports' verdicts live in prose and retyped constants (T:264-275), not in the holon.

**Missing element:** the verdict's return path: no file or flow carries a rung's tested result (holds, fails, unmeasured or blocked, with witness, time and window) into the Triad, so the holon reports a connectivity tier, a literal or a zoom band as its rung, and its loop-back slots stay empty.

## The node per rung

A node is `{id, restsOn, predict, tolerance, window, context, witnesses}`: the window in seconds for live sources, a context key (build, version, frame kind, aspect, settings) for terrain rungs. Verdicts go to `bridge/sync/rungs.json`.

| Rung (rests on) | Input | Output | Test | Measure | Witness | Written back | Client |
|---|---|---|---|---|---|---|---|
| H0 Connectivity | flows (TP:191-198) | `flow_integrity` (TP:199-200) | each flow fresh | file ages, SSH latency (`evidence.mjs:18-33`) | Apex; files self-stamped (`evidence.mjs:9-15, 23`) | `connectivity_tier` with basis (DB:205) | no |
| 1 Map | tiles | `Data/*.lua` | `tools/ematrix-mapdata.test.mjs` | `32:48 FOUND` (R9:64) | client | verdict | yes |
| 2 Axis (1) | `UnitPosition` (T:175) | north-south first | own tile found | FOUND, once MISSING (T:170-174) | client, owner's paste; not the stub | verdict | yes |
| 3 Load (1) | path, id (T:326-334) | `loadStats` (T:244) | file id > 0 (T:247-251) | `loaded 45 failed 0` (R9:63) | client API; T:248 trusts the call | verdict, counts | yes |
| 4 Frame kind (3) | `FRAME_ORDER` (T:202) | drawn model | model seen | `reports/20261104-1024` shots | owner's shot, not `visible true` (RESUME.md:59) | verdict, shot hash | no |
| 5 Fit per file (4) | k (T:316-318) | fill | fill 1 ± τ at θ | fill by eye (RESUME.md:5, 15) | director; owner's `fit` (T:778-787), unused (R9:2-33) | generated `FIT_BY_FILE` (T:274) | no |
| 6 Camera (2) | facing, zoom (T:179-180); pitch, fovY saved (T:108) | `BuildCamera` (`EMatrix_Math.lua:240-260`) | foot within τ px | none: R9:65 prints the defaults | nobody | `terrainPitch`, `terrainFovY`, stamp, residual | facing, zoom |
| 7 Position (5, 6) | placements, fits, projection | rectangles | owner's rule (RESUME.md:17) | scene shots | director | blocked until 6 | no |

## The loop back

The return path is the loop back, not a rung. Today it stops at the director: SavedVariables (`EMatrix_Report.lua:23-30, 83-88`), H009 with its SHA-256 manifest (`bridge/hands/laptop_tasks.json:8-29`), `owner/reports` (21 to 35 min apart), an eye, a retyped constant, H005. Proposed:

1. **One evaluator**, `packages/triad-369/src/rung_nodes.mjs` (pure like `light_being_kernel.mjs:1-3`; one module where B1 to B6 named five), turns a report into readings and generates, as `tools/ematrix_mapdata.mjs:221` does the map, `FidelityEMatrix/Data/EMatrix_Rungs.lua` and `bridge/sync/rungs.json`.
2. **H005's merge carries both to the laptop.** The Apex resolves `SYNC_DIR` to `bridge/sync` (TP:35) and already reads a git snapshot there (TP:36, 422-431). Which copy runs on Node 1 needs checking (`bridge/loop/triad_369_process.mjs:413` prints "Loop closed with compassion.").
3. **The Apex ages, never re-tests.** Each 6 s tick (TP:566) it ages every verdict by the registry's rule (`EMatrix_Core.lua:194-198`), closes a stale rung's descendants, and writes `rungs` and `checks.rung_check` (false on a stale verdict or no file). A reading's time is its step's stamp (`EMatrix_Report.lua:83`), local `date()` (:20) converted by the `owner/reports` commit offset (+0200, `git log`); never the file's mtime (`evidence.mjs:9-15`) or the report-level `at`, still 10:22:14 (R9:1588) after 102 steps.
4. **Not a seventh flow.** Integrity is active over total (`evidence.mjs:41-45`) and D7 needs 0.99 (DB:142): a report channel stale between reports would hold integrity at 6/7, drop the tier to D6 and lower `Lx` and coherence (TP:233-235).
5. **The slots fill:** `rungs_traversed` lists rungs holding fresh; DECISION is the verdict; NEWS BACK takes LANDED's words (`tools/council.mjs:17`) when a later report confirms a written-back value; DB writes `rungs_held` and `frontier` beside `active_density`.

**Next time:** the panel asks for the frontier (the lowest unheld rungs whose bases hold), not a hand-written list (`EMatrix_Report.lua:55-68`); `FitSource` (T:304-309) names the report.

## The camera settings

No Lua here reads a setting (no `GetCVar` or `C_CVar` in either addon); the director read them from R9's `WoWScrnShot_110426_132055.jpg` (OWNER-INPUT.md:7-19); so do I. They are rung 6's context reading, valid until the owner reports a change: an event window the registry's seconds cannot state (`EMatrix_Core.lua:152`).
- A change stales rungs 6 and 7, not 5: the fit uses the frame's own camera (T:316-318; needs in-game verification).
- Max Camera Distance is at its minimum and all 18 zoom values in R9 read 4.6: rung 6 holds only at that zoom.
- Smart following makes yaw = facing (T:179) only once the camera swings behind; Follow Terrain and Head Bob off make one pitch per session fittable; Smart Pivot has no term (`EMatrix_Math.lua:240-259`). General knowledge; needs in-game verification.

## The algorithm

`climb` per report, `age` per tick. R rungs (instances included), E edges, P parameters per rung, M readings, N props; B = 40 bisection steps (`EMatrix_Math.lua:294`), I ≤ 20 iterations.

1. Kahn's topological order; reject a cycle. O(R + E).
2. Admit a reading iff measured, witnessed outside its rung (not the stub, `visible true` or a trusted call), within its window, context matching. O(M).
3. Dirty: rungs with new readings or changed context, plus descendants. O(R + E).
4. Per dirty rung, in order: `blocked` if a base fails (memoized); `unmeasured` without readings; else calibrate: fit k·fill or least squares of 1/fill on k, O(M_r); focal by least squares at fixed pitch (`EMatrix_Math.lua:269-270`), O(M_r); pitch by bisection where monotone (`SolvePitch`, `:276-301`), O(B·M_r); a choice among K kinds (frame kind: 3, T:202), O(K·M_r); else Gauss–Newton, O(I(M_r·P² + P³)). It holds iff a reading not used in the fit (taken at θ, or held out) is within τ; otherwise `fitted` or `fails`. Write back, O(P).
5. Re-settle changed props, as `fit` does (T:782-787), O(N·P); frontier, O(R + E).
6. Per tick: age, close stale subtrees, compute `rung_check`: O(R + E), no fit or test.

**Complexity:** O(R + E + (B + K)·M + I(M·P² + R·P³) + N·P) per report; O(R + E) per tick. **Polynomial:** each rung, edge and reading is visited a bounded number of times, B, K and I are fixed, nothing enumerates subsets or grids; one more rung costs O(1 + its edges) per tick.

**Exponential, named and replaced.** None in the code I read (`flowIntegrity` O(F); DB:142 O(1); `InterpolatedFit` O(knots), T:286-295; `SolvePitch` 40 steps). A design could add:
- which rungs hold, by combinations (2^R) or every path below a rung (exponential in a diamond ladder; general knowledge): one memoized pass, the held set being closed downward;
- a joint camera grid (G^P presses, `/fide terrain pitch|fov` by eye, T:733-734): bisection and closed form, alternated;
- re-testing every lower rung each climb or tick (R² tests, owner-witnessed ones a report each): the dirty set; the Apex only ages;
- a fit per product of contexts (2^d keys): key only what a reading shows matters.

## Ranked by visible payoff per hour

1. **Label the HUD's rung** (Flash; 0.5 h plus H008). Step: `UI.lua:83` prints "D3 (seed)" unless `measured.activeRung`. Test: nothing outside the addon calls `UpdateHUD` (grep), so a fengari test (`tools/wow-syntropic-hud.test.mjs`) loads `Core.lua` and `UI.lua` on stub frames and asserts "seed". Risk: its identical copy (`packages/triad-369/wow-syntropic/`) drifts. Proof: the tenth report's screenshot.
2. **Label the tier** (Opus; 0.5 h). DB:205 gains `active_density_basis` ("connectivity: Sol up, flow integrity; not a climb"), like `coherence_basis` (DB:209); `density-status.test.mjs` asserts it and D5 without a key. Risk: none (additive). `arena_fractal_bridge.mjs:89` reads `active_rung`, which nothing writes.
3. **The verdicts in the Triad, the element** (Opus; 2-3 h; no addon change). Step: `rung_nodes.mjs`, `stepHarmonicCycle` reading `rungs.json`, and `evidence.report` (stamp, manifest SHA-256, commit). Test (`packages/triad-369/test/rung-report.test.mjs`, patterned on `measured-status.test.mjs:8-56`, with `TRIAD_SYNC_DIR`): (a) the record through the eighth report holds map, axis, load, frame and the bush, tree and barrel fits, leaves jar and crate `fitted`, camera on the frontier, position blocked, `flow_integrity` at 4/6; (b) v1.8.7's 1.5-wide tree frames (T:38-45) stale the tree's fit, confirmed in 0.8-wide frames, and its position, with no re-fit or Apex test; (c) verdicts without `measuredAt` count nothing though the file is fresh; (d) no file gives `not_measured`, never `true`; (e) a 64-rung two-below ladder takes 64 tests, a changed reading re-tests only its descendants, a cycle is rejected; (f) a stale report leaves `flow_integrity` unchanged. Proof: `triad -- status` lists held rungs, witness and age. Risk: a hand-made fixture.

**Does not help:** a node per D-name (labels, DB:75-83) or octave (a tick mod 9, TP:144); `IRungNode.update` without a measure (`RungTypes.ts:25-26`); the engine's clock-driven `awareness` (`SovereignHarness.ts:63-66`) and self-witnessed graduation (:139-147), which `npm test` never runs (`package.json:11`).

## Closing table

| Item | B7 |
|---|---|
| Missing element | the verdict's return path into the Triad |
| Loop back | report, H009, `climb`, `rungs.json`, H005, Apex `rung_check`, frontier |
| Algorithm | O(R + E + (B + K)·M + I(M·P² + R·P³) + N·P) per report, O(R + E) per tick |
| Conceded | O1: a record and a gate, not a measurement. O2: the held set is calibration, not awareness. O3: above the load rung the witness is a person. |

For the LEAD: A rung is claimed only by its own verdict, which holds while a measured reading from a named outside witness is fresh in its window and every rung beneath holds; the holon reads verdicts as data, ages them each tick in O(R + E) without re-testing, and reports the rungs that hold instead of a tier, a literal or a zoom band.

Route: Opus core and spec: ranks 2 and 3. Flash WoW and in-game: rank 1, H005, H008, an Options shot per H009, which Apex runs on Node 1. Argon blind red-team: is a director's reading a measurement, the windows, the not-a-flow rule. The owner: windows, tolerances, the HUD's held set, word of camera setting changes.
