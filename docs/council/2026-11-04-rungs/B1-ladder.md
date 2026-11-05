# B1: the ladder from the record

My viewpoint: the nine owner reports (`reports/20261104-0935` to `-1321`, `owner/reports`) read as rungs climbed. "Rung", "awareness" and "Light Being" are framing; nothing here measures awareness.

## Thesis

The terrain overlay climbed eight rungs in nine reports, each the same way: a hypothesis in code, an in-client line printing what the code did, the owner's picture, the director's reading, and a constant typed into the source that the headless tests then asserted. Below the load rung the line was a measure (`tile azeroth:32:48 FOUND`, `models loaded 45 failed 0`). Above it, the line only described the code's own action: `visible true` while nothing drew (RESUME.md:59), and `camera x2.80 by an interpolation ..., a guess` while the canopy overflowed. An eye measured the outcome. The in-client write-back channels (`propFit`, `/fide terrain pitch|fov`) appear in none of the nine saved files.

**Missing element:** no rung keeps a witnessed residual. That means prediction against measurement, with who measured it and when, read back as data by the next version, and gating each rung on the rungs beneath it. Today the loop back is the director retyping a constant.

## The rungs climbed

| Rung (reports) | Input | Output | Test | Measure | Witness | Written back | In client? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 Map data (probe) | tiles (`tools/ematrix_mapdata.mjs`) | `Data/*.lua` | `tools/ematrix-mapdata.test.mjs` | `32:48 FOUND` (RESUME.md:106) | host | nothing | yes |
| 2 Axis (probe) | `UnitPosition` | `ps.x` north-south (`EMatrix_Terrain.lua:168-182`) | stub held the wrong belief (:170-174; `ematrix_headless.lua:724`) | `MISSING`, then `FOUND` | host, pasted | swap in `PlayerState` | yes, ungated |
| 3 Load (1-9) | path, id | `SetModel` | `GetModelFileID` > 0 (:247-251) | `loaded 45 failed 0` | host | `loadStats` (:244) | yes |
| 4 Frame kind (1-3) | frame kind | pixels | `visible true`, always | `-1024` shots 2-8 | owner's picture, director | `FRAME_ORDER` (:202) | no (from the code) |
| 5 Fit (4-9) | camera factor k | frame fill | names k and source (:304-309) | fill by eye; fit = k × fill (:266-270) | director's eye | `FIT_BY_FILE` (:274-275); `propFit` (:778-780) unused | no |
| 6 Relative position (7-9) | projection | frame at the foot | none | "where the real ones stand" (RESUME.md:5) | director's eye | `AspectFor` (:41-45); jar 0.7 yd (:36) | no |
| 7 Camera (none) | facing 4.09, zoom 4.6 every probe; pitch 0.35, fovY 1.0 saved (:108) | `BuildCamera`, `ProjectPoint` (`EMatrix_Math.lua:240-273`) | headless `SolvePitch` (`ematrix_headless.lua:395-398`); no addon caller | none | none | `/fide terrain pitch\|fov` (:733-734), never set | facing, zoom only (`EMatrix_World.lua:8-11`) |
| 8 Return path (1-9) | panel | `FidelityEMatrix_Report`, shots | headless capture | director's reading | director | next version (H009) | file only |

**Pattern:** rungs with a host number held at once (1, 3) or after one paste (2). Frame kind took three reports, its test self-reporting and its variants contaminated (RESUME.md:69, 79-81). Fit took five, converging once each file got one shot and fit = k × fill. The camera never started.

**Where it breaks:**
- **Untraced constants.** The headless suite asserts the typed fits (`ematrix_headless.lua:768-770`), so it cannot disagree with a bad reading, which is the axis failure again. Computed by B1: under fit = k × fill the tree's readings give 2.79, 3.3 (RESUME.md:15) and 3.7 (:27). The constant 2.8 hides that 0.9 spread; only the eighth report holds it (:5). `FitSource` calls the constant "measured from your reports" (:307).
- **No pose.** The scene steps run no probe (`EMatrix_Report.lua:56, 62-64`). The ninth run's turned shots have no recorded facing (saved lines 1480-1535).
- **No gate.** RESUME.md:9 says "the terrain overlay is in the game" while unmeasured files draw by "a guess" (:308). My reading of the ninth run, for the director to confirm:
  - the canopy at x2.80 overflows its wide frame (`WoWScrnShot_110426_131711.jpg`);
  - the tree scene shows hard-edged canopy blocks (`_131801.jpg`);
  - the jar at x0.37 fills about 0.9 of its frame (`_131702.jpg`).

## The algorithm (polynomial)

**Inputs:**
R rungs; E edges (map before axis and load; load, frame kind, fit in order; axis before camera; fit, camera and map before relative position). Per rung: P parameters θ, predictor f, tolerance τ, window w. M measurements (rung, key, input, observed, witness, at, kind). N props.

**`CLIMB(changed)`:**
1. Kahn's topological order, O(R + E). A cycle is rejected.
2. Bucket the measurements by rung, O(M).
3. Visit only the changed rungs and their descendants (one DFS, O(R + E)):
   - **a.** If a predecessor fails, the rung is "not claimed".
   - **b.** Keep only measurements that are fresh (0 ≤ now − at ≤ w), measured, and witnessed outside the rung's own test, O(M_r). If none remain, the rung is "unmeasured"; a guess never holds.
   - **c.** Calibrate:
     - one fit reading: k × fill;
     - several readings: least squares on 1/fill = α + βk (linear, O(M_r)), so fit = (1 − α)/β;
     - a clipped frame (fit > k): double k, then bisect, O(log(range/tol)) reports;
     - camera (pitch, fovY): Gauss–Newton on cursor-mark residuals, O(M_r P² + P³) per iteration, or alternating bisection as `SolvePitch` does (`EMatrix_Math.lua:276-302`).
   - **d.** ρ = max |f(θ, input) − observed|. The rung holds iff ρ ≤ τ.
   - **e.** Write (θ, ρ, witnesses, at) to the ledger, O(P).
4. The per-frame scan stays O(N log N) (`EMatrix_Terrain.lua:359-391`).

**Total:** O(R + E + M + I(MP² + RP³)) per climb (I iterations) and O(N log N) per frame: polynomial.

**Exponential parts and their replacements:**
- **Combinations of rungs**, 2^R: the set of rungs that hold is closed downward, so one topological pass, O(R + E).
- **A joint camera grid**, G^P: least squares instead.
- **Knob sweeps across reports** (the bush at x0.5/x1/x2/x4, RESUME.md:37), G^P when crossed: one shot per file with the closed form, plus bisection when the frame clips.
- **Re-running every lower rung**, O(R²) with each check costing a report (21 to 35 minutes apart): re-check only the descendants of what changed. The lower rungs' host numbers already ride in step 2.

## The loop back

**Today:** picture → director → constant → version → H009.

**Proposed:**
- **In the client:** `FidelityEMatrix_Report` (`EMatrix_Report.lua:23-29`) records a pose with every scene shot, and later the cursor marks; `propFit` carries the owner's fits; H009 already copies the file.
- **On the director's side:** a ledger of (rung, key, k, fill, stamp, witness) generates `FIT_BY_FILE`.

**Next time:** `FitSource` names the report and witness; a rung over tolerance or without a fresh measurement prints "not claimed", with its descendants; the headless test checks constants against the ledger.

## The camera settings

Read by the director from one screenshot (OWNER-INPUT.md; my reading of `_132055.jpg` agrees): a witnessed input, measured once.

- **Smart following.** Yaw comes from `GetPlayerFacing` (`EMatrix_Terrain.lua:179`). The camera returns behind the player only while moving (general knowledge; needs in-game verification), so a scene shot counts only after the camera settles.
- **Follow Terrain and Head Bob off.** No slope or bob alters the pitch (general knowledge; needs in-game verification). Use one pitch per session, re-fitted after the owner moves the camera.
- **Max Camera Distance 1.** The zoom read 4.6 in every probe: one operating point. The fits live inside the frame (`SetCamDistanceScale`, :316-318; from the code); positions depend on the zoom.
- **Smart Pivot.** It may move the camera off the "behind the head" model near the ground (`EMatrix_Math.lua:237, 256-258`; general knowledge; needs in-game verification). Treat it as a residual term.
- **No help:** water collision, mouse speed, click-to-move.
- **No CVar read exists in the repo's Lua.**

## Ranked bridges (visible payoff per hour)

1. **A pose with every scene shot.**
   - Only step 2 runs `terrain probe` (`EMatrix_Report.lua:57`).
   - Effort: 15 minutes. Risk: chat covers part of the screen.
   - First step: add `"terrain probe"` to steps 1, 7, 8 and 9. Headless test: each of those steps captures a `probe: pos` line.
   - Proof: each turned shot in the tenth report lists six projections, and the director writes a pixel residual per prop. Pixels = UI units × 1.228 (1851/1507, computed by B1).
2. **The witnessed ledger and the gate (the element itself).**
   - Evidence: `EMatrix_Terrain.lua:266-275`, `ematrix_headless.lua:768-770`, `evidence.mjs:47-51`, the registry's freshness rule (`EMatrix_Core.lua:194-199`).
   - Effort: 2 hours. Nothing changes on screen.
   - First step: a proposed `packages/triad-369/src/rung_ledger.mjs` (`order`, `climb`, `fitFromReadings`) and `tools/rung-ledger.test.mjs`, which asserts:
     - (a) each `FIT_BY_FILE` value, read from the real Lua through fengari, equals k × fill of its recorded reading within 0.02 (2.0, 2.786, 0.596, 0.366, 0.417), and a constant without a reading fails;
     - (b) relative position is "not claimed" for `elwynntreecanopy04`;
     - (c) a cycle is rejected;
     - (d) changing one reading re-evaluates only its descendants.
3. **Cursor marks.**
   - The owner points at the real object's foot; the host records the cursor against the projection, a timed pixel residual. The addon already reads `GetCursorPosition` (`EMatrix_Core.lua:632, 963`).
   - Three marks fit pitch and fovY.
   - Effort: 3 hours plus a report. Scale needs in-game verification.
4. **Panel buttons for `fit`** (`EMatrix_Terrain.lua:774-781`).
   - Effort: 1 hour. Turns one report per file into none.
   - The witness is still the owner's eye.

**Does not help:** a node per density rung (the active rung is a connectivity rule, `density_bridge.mjs:142`; the HUD's D3 a default, `wow-syntropic/Core.lua:36`, `UI.lua:69, 83`); self-graded `IRungNode` methods (`RungTypes.ts:20-27`), as `SovereignHarness` graduates on its own coherence (`SovereignHarness.ts:140-145`) and its "awareness" is a clock (:63-67); more `IsVisible` checks, camera grids, sweeps.

**Concessions:** O1, rungs 1 to 3 already have their nodes; O3, above rung 3 every measure was an eye; O2, holding rungs measure calibration, not awareness.

## Closing table

| Question | B1's answer |
| :--- | :--- |
| Missing element | A witnessed residual kept as data, gating each rung on the rungs beneath it |
| Loop back | `FidelityEMatrix_Report` and `propFit`; a ledger that generates the fits; H009 |
| Camera | Shoot after the camera settles; one pitch per session; one zoom; Smart Pivot as a residual |
| Algorithm | O(R + E + M + I(MP² + RP³)) per climb; O(N log N) per frame |

For the LEAD: A rung counts as climbed only when a measurement from outside it, with its witness and age, sits within tolerance of its prediction while every rung beneath it holds, written back as data the next version reads, never as a retyped constant.

Route: Opus core and spec, the ledger, the gate and its test; Flash WoW and in-game, the probe in the scene steps, then cursor marks; Argon blind red-team, whether an owner's cursor mark counts as host-measured; the owner, a tenth report with the camera settled before each scene shot, and `fit` on the canopy.
