# B3: IRungNode and the seven density rungs (builder)

Voice B3, round 2026-11-04-rungs. Read-only; "proposed" names do not exist yet.

## Thesis

**The missing element: a rung has no verdict.** Nothing in `IRungNode`, `DENSITY_RUNGS` or the HUD's `D3` records that a rung's test passed on a fresh measure from a witness outside the rung. So no rung can gate the one above it, name the next measurement, or write its measure back as a calibrated parameter.

The repo already has this rule one scale down: a cell opens only when its source is fresh, measured and at threshold (`CellOpen`, `FidelityEMatrix/EMatrix_Core.lua:199`). The owner's node lifts that rule to the rung, adding the rungs it rests on and a write-back. The director has carried those verdicts by hand. The evaluator is one memoized, polynomial sweep in dependency order.

## 1. What IRungNode lacks

`IRungNode` (`apps/fractal-engine/src/rungs/RungTypes.ts:20-27`) is a renderer's contract: an identity plus `update` and `setTransitionAlpha`, both `void`.

- **Input.** One unnamed, unkinded, unaged `SovereignTelemetry` serves all rungs (`main.ts:126-128`). Its `awareness` is a clock, 0.12 to 0.65 at 0.02/s (`SovereignHarness.ts:48, 64-66`), and its floats are seeds (`SovereignHarness.ts:38-41`) or derive from 0.96 or a sine (`FractalStreamBridge.ts:40-41, 45-53, 60-61`).
- **Output.** Pixels only.
- **Test.** Only graduation, which is self-witnessed. The harness scores its own coherence (`SovereignHarness.ts:136-147`) chasing a sine the page invents (`main.ts:112-117`), and only a badge moves (`main.ts:151-153`).
- **Measure, reporting up, write-back:** none. The active rung is a zoom band (`FractalCameraController.ts:330-337`). No code reads `rung.json`, which disagrees with the TypeScript (`rung-7-gateway/rung.json:9` against `Rung7Gateway.ts:23`), and `npm test` runs no engine test (`package.json:11`).

**The density rungs do not map onto the terrain rungs.** The rung number is a zoom band, a connectivity tier (`packages/triad-369/src/density_bridge.mjs:142`), or a literal (`packages/wow-syntropic/Core.lua:36`). Its HUD line (`UI.lua:83`) lacks the kind label that coherence, strain, FTLE and S carry (`UI.lua:81-86, 96`); the ninth report's screenshot shows "Active Rung: D3 (Somatic Vessel)".

The D-rungs are scale bands, 1 mm (`Rung1Atoms.ts:8`) to 1e15 m (`Rung7Gateway.ts:8`), and D5's terrain is sines (`Rung5World.ts:29-36`). The terrain rungs are claims ordered by dependency, so the D-names stay framing.

## 2. The node per rung

R = 7 and E = 7, in two chains: map → axis → camera → position, and map → load → frame → fit → position. Fit runs per file and position per prop. A bare `:n` is a line of `EMatrix_Terrain.lua`.

| Rung (rests on) | Input | Output | Test | Measure; witness | Written back | Client |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Map | game tiles | `Data/*.lua` (`tools/ematrix_mapdata.mjs:221`) | `tools/ematrix-mapdata.test.mjs:62-123` | probe "tile azeroth:32:48 FOUND" (`:742-744`); host | regenerate | yes |
| Axis (map) | `UnitPosition` (`:175`) | `PlayerState` (`:168-182`) | own tile found | pasted probe; host, not the stub (`:170-174`) | the swap | yes |
| Load (map) | path, FileDataID (`:326-334`) | `loadStats` (`:244`) | `GetModelFileID` > 0 (`:247-251`) | "loaded 45 failed 0"; host | loader order | yes |
| Frame (load) | `FRAME_ORDER` (`:202`) | frame kind | model seen | shots `20261104-1024`; owner, not "visible true" (RESUME.md:59) | `FRAME_ORDER` | no |
| Fit, per file (frame) | factor k (`:316-317`) | red-frame fill | fill 1 ± tol, held-out | fill read (reports -1226, -1247), owner's `fit`; director, owner | `FIT_BY_FILE` (`:274`), `propFit` (`:778-780`) | no |
| Camera (axis) | facing, zoom measured (`:179-180`); pitch, fovY symbolic (`:108`) | screen points (`EMatrix_Math.lua:240-272`) | foot vs real foot, px | none; `SolvePitch` uncalled outside headless (`tools/ematrix_headless.lua:395`); director | pitch, fovY + context (`:733-734`) | partly |
| Position, per prop (fit, camera) | placements, fits, projection | screen rectangles | owner's rule (RESUME.md:17) | scene shots (RESUME.md:5); owner, director | none until camera holds | no |

## 3. The interface change (proposed)

```ts
// RungTypes.ts, added; IRungNode keeps its six members and gains claim?: IRungClaim; showVerdict?(v: RungVerdict): void
export type EvidenceKind = 'measured' | 'symbolic' | 'not_measured';
export type Witness = 'host' | 'owner' | 'director' | 'headless';
export interface RungMeasure { rung: string; name: string; value: number; at: number; window: number;
  kind: EvidenceKind; witness: Witness; context?: string }
export interface RungParam { name: string; value: number; kind: EvidenceKind; source: string | null }
export interface RungVerdict { rung: string; state: 'holds' | 'fails' | 'unmeasured' | 'blocked'; residual: number | null }
export interface IRungClaim { id: string; restsOn: string[]; witnessedBy: Witness[]; params: RungParam[]; tolerance: number;
  calibrate(m: RungMeasure[], p: RungParam[]): RungParam[]; residual(m: RungMeasure[], p: RungParam[]): number }
```

The JavaScript twin is `packages/triad-369/src/rung_ladder.mjs` (`admit`, `evaluateLadder`, `fitByFill`, `fitCamera`, `dirtyFrom`), pure like `light_being_kernel.mjs:1-3`. It admits a measure only if its witness is in `witnessedBy` (the axis lesson: a client claim needs a client witness), it is `measured` and fresh by `EMatrix_Core.lua:194-198` (each source sets its window), and its context is unchanged.

## 4. The algorithm (the owner's second message)

`evaluateLadder(rungs, measures, now)`. Sizes: M measures, R rungs (instances included), E edges, P parameters per rung, N props.

1. **Admit** the measures, O(M). **Order** the rungs by Kahn's algorithm, O(R + E), rejecting a cycle.
2. **Sweep** each rung once:
   - `blocked` unless its bases hold, O(E) in all;
   - `unmeasured` while M_r ≤ P, since a test must be able to fail;
   - else it holds if its calibrated residual is within tolerance.
3. **Calibrate:**
   - Fit: fill ≈ fit/k, so fit = Σ(fill/k)/Σ(1/k²), in O(M_r).
   - Camera: at a fixed pitch the offsets are linear in the focal (`EMatrix_Math.lua:258, 269-270`), so focal = Σa·b/Σa·a. The pitch comes from a K-point scan plus golden section, O(K·M_r), or O(I·K·M_r) when pitch and focal are alternated per shot.
   - Linear rungs: O(M_r·P² + P³).
4. **Write back** what holds and re-settle its props: O(R·P + N).
5. **Frontier.** The first unheld rung whose bases hold picks the next panel step; a change re-runs only its descendants. Both cost O(R + E).

**Total: O(R + E + I·K·M + M·P² + R·P³ + N), polynomial.** K = 40 as in `SolvePitch` (`EMatrix_Math.lua:294`); N ≤ 24 (`EMatrix_Terrain.lua:21`); 135 cells (`EMatrix_Core.lua:29`).

**Exponential traps, and what replaces them:**
- rung subsets (2^R): the topological gate;
- re-running the lower rungs on every climb (2^19 paths in a 40-rung diamond): memoization plus a dirty set;
- a joint camera grid (G^(2+S)): the closed form plus a 1-D search;
- matching by permutation (N!): the map data's names, or an O(N³) assignment (general knowledge).

The code has none; its cost is owner round-trips (the bush alone was swept at four settings, RESUME.md:37).

**Computed here, not repo tests:**
- The fits are k × fill: 3.98×0.7 = 2.79, 1.49×0.4 = 0.60, 2.15×0.17 = 0.37, 1.39×0.3 = 0.42 (RESUME.md:5, 15). Three tree readings give 2.86 (the x6 one 0.07 off).
- Through the real `EMatrix_Math.lua` (fengari), at the reports' pose (zoom 4.6, facing 4.09), two correspondences recover pitch 0.35 and fovY 1.0. ±3 px of noise moved the pitch 0.0002 to 0.0005 rad in four trials; a 0.1 rad pitch error shifts the props 59 to 83 px.

## 5. Loop back and the camera settings

**Loop back.** Today the SavedVariables file (`EMatrix_Report.lua:24`; `propFit`, `EMatrix_Terrain.lua:778-780`) goes by H009 (`bridge/hands/laptop_tasks.json:8`) to `owner/reports`. The director then hand-edits `FIT_BY_FILE` and the panel (`EMatrix_Report.lua:56-67`).

With the node, readings become `RungMeasure`s citing their report. `evaluateLadder` writes back a generated fit-and-camera table (as `tools/ematrix_mapdata.mjs:221` generates the map) and a `rungs` array beside `active_density` (`density_bridge.mjs:205`). Next time `FitSource` says "measured" and the panel asks for the frontier. After the owner's word (`docs/council/2026-11-04-operator/STEER.md:85`), the HUD shows the climbed set.

**The camera settings are the camera rung's context.** A change re-opens only camera and position; the fit uses the frame's own camera (`EMatrix_Terrain.lua:316-317`; needs in-game verification). No code reads the settings (no `GetCVar`), so the options screenshot is their witness.

Every probe sampled reads zoom 4.6 (reports 0935, 1024, 1134, 1247, and all nine in 1321). Fits therefore hold at 4.6 only, and the zoom term (`EMatrix_Math.lua:256`) is untested.

Follow Terrain and Head Bob, both off, remove motions the model lacks: it fixes the pitch and `HEAD_HEIGHT` (`EMatrix_Math.lua:237`). General knowledge; needs in-game verification.

With Smart following, yaw equals facing (`EMatrix_Terrain.lua:179`) only at rest: standing shots only. Mouse look can re-pitch, so the pitch is fitted per shot. Smart Pivot has no term in the model; needs in-game verification.

## 6. Ranked bridges (visible payoff per hour)

1. **`rung_ladder.mjs` + `tools/rung-ladder.test.mjs`** (2 h, low risk, no addon change). On the record through the eighth report, the test expects:
   - map, axis, load and frame hold;
   - the bush, barrel and tree fits hold, the tree at fill tolerance 0.1;
   - jar, crate and camera stay `unmeasured`, position is `blocked`, and the frontier is camera;
   - "visible true" and a future stamp are refused;
   - a 40-rung diamond calibrates 40 times, and one new measure re-runs 21.
2. **Camera fit + a standing probe-and-shot panel step** (3 h plus a report). The probe already prints six named placements' screen points (ninth report, lines 66-71). Medium risk: feet read by eye, the y flip (`EMatrix_Math.lua:262-263`), UI units versus pixels. Proof: the camera holds with a pixel residual, and position unblocks.
3. **`fitByFill` + a generated fit table** (1 h): no hand edits, no sweeps.
4. **`RungTypes.ts` types and engine HUD verdicts** instead of "GRADUATED (N -> N+1)" (1.5 h; unchecked without a tsconfig). The WoW HUD's `D3`: B7 and Flash, after the owner's word.

**Does not help:** tests of the D1–D6 drawings (sines and random stars, `Rung6Space.ts:28-32`, that nothing measures), a climbed count called awareness, or "visible true" as a witness.

## Closing table

| Question | B3 |
| :--- | :--- |
| Missing element | a per-rung verdict: the cell gate lifted to the rung, with bases and a write-back |
| Loop back | SavedVariables → H009 → `RungMeasure` → `evaluateLadder` → generated table, frontier |
| Algorithm, first step | memoized topological sweep, polynomial; `rung_ladder.mjs` + test, frontier camera |

For the LEAD: A rung may claim only when its test passes on a fresh, measured reading from a witness outside it and every rung it rests on holds; the ladder evaluates each rung once in dependency order, fits its parameters in closed form or by a bounded search, writes back only what holds, and names the lowest rung that does not hold as the next measurement.

Route:
- Opus (core and spec): `rung_ladder.mjs`, its test and the `RungTypes.ts` types.
- Flash (WoW and in-game): the standing probe-and-shot step, then the HUD's `D3` after the owner's word.
- Argon (blind red-team): whether the gate or the held-out rule can pass a wrong rung, as the axis stub did, and the tolerances.
- The owner: the fill and pixel tolerances, the HUD line, and one shot at a second zoom.
