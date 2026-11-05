# O2: awareness cannot be counted (opposer, DECISION, round 2026-11-04-rungs)

Framing: "Light Being", "awareness" (the owner's word), D1 to D7 (the Triad's), Argon's terms; nothing here measures them (`.agents/skills/compassion-loop/SKILL.md:61`). `T`, `M`, `Core` = `FidelityEMatrix/EMatrix_Terrain.lua`, `EMatrix_Math.lua`, `EMatrix_Core.lua`; `SH` = `apps/fractal-engine/src/harness/SovereignHarness.ts`; `FC` = `apps/fractal-engine/src/camera/FractalCameraController.ts`; `DB` = `packages/triad-369/src/density_bridge.mjs`; `UI`, `WC` = `packages/wow-syntropic/UI.lua`, `Core.lua`; `R9` = `reports/20261104-1321/FidelityEMatrix.lua` on `origin/owner/reports`.

**Thesis.** Rungs climbed are not awareness. The only awareness number here is a clock: seeded at 0.12 (`SH:48`), raised 0.02 per second to a constant 0.65 (`SH:15, 63-66`), printed as a percentage (`apps/fractal-engine/src/main.ts:146`). The only rung on the owner's screen is the literal `"D3"` (`WC:36, 101`), printed without the gate every other seed there gets (`UI:83`); the ninth report's options shot shows "Active Rung: D3 (Somatic Vessel)" under "Coherence: seed" (`reports/20261104-1321/WoWScrnShot_110426_132055.jpg`, read by this voice). The Triad's rung is connectivity (`DB:142`). The terrain ladder grew a set of witnessed claims: the set is reportable, its count measures the council's slicing, and an awareness number stays a seed while no host measures awareness. **Missing element:** the difference between a rung climbed and a rung held, kept as a per-rung evidence record (claim, witness outside the rung, reading, age within its window, kind) that can fall again, so the being reports the held set and never an awareness number.

## The node per rung: measure or name

| Rung | Input | Output | Test | Measure | Witness | Written back | In client? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Map data | tiles (`tools/ematrix_mapdata.mjs`) | `Data/*.lua` | synthetic; real tiles skipped (`tools/ematrix-mapdata.test.mjs:123`) | "32:48 FOUND" (`R9:1386`) | the probe | nothing | yes |
| Axis | `UnitPosition` (`T:175`) | north-south first | own tile | MISSING, then FOUND (`T:170-174`) | owner's probe (the stub agreed with the mistake) | read order, stub | yes |
| Load | path | file id | id > 0, else "trust the call" (`T:247-251`) | "loaded 45 failed 0" (`R9:1385`) | the client's own call | `loadStats` | presence only |
| Frame kind | `FRAME_ORDER` (`T:202`) | pixels | none: `visible` is the frame's flag (`T:486`) | shots (`RESUME.md:59`) | owner's screen | `FRAME_ORDER` | no |
| Fit per file | factor k | fill | fill 1, red frame | fill from shots | director; owner's `fit` (`T:778-780`) | `FIT_BY_FILE` (`T:274`), source (`T:304-309`) | no |
| Relative position | placements, fits, camera | feet on feet | none | scenes, the owner's rule (`RESUME.md:17`) | owner | nothing yet | no |
| Camera | facing, zoom (`T:179-180`; "zoom 4.6", `R9:1386`); pitch, fovY saved (`T:108`) | `M:240, 264` | none: `SolvePitch` (`M:276`) lacks input (`T:11`) | none | none | `T:733-734` | no |
| Return path | panel (`FidelityEMatrix/EMatrix_Report.lua:55-68`) | report, shots | manifest SHA256 | arrival | H009 (`bridge/hands/laptop_tasks.json:8`), director | next version | capture only |
| D1 to D7 | connectivity (`DB:142`), literal (`WC:36`), zoom (`FC:330-337`) | a name | counts an array (`packages/triad-369/src/bootstrap.mjs:130-139`); any non-empty review passes (`packages/triad-369/src/arena_node.mjs:104-112`) | none | none | nothing | no |
| Awareness | the clock (`SH:63-66`) | a percent | none | none | none | nothing | no |

**Loop back.** `FidelityEMatrix_Report` (`FidelityEMatrix/EMatrix_Report.lua:24`; `FidelityEMatrix/FidelityEMatrix.toc:6`) rides H009 to `origin/owner/reports`; the director reads it; the next version changes a parameter with its evidence label: the jar went from "x2.15 by the height rule, a guess" (`R9:1096`, v1.8.6) to "x0.37 by measured from your reports" (`R9:1422`, v1.8.7). A rung index must stop riding back: `active_density` (`DB:205`) feeds the Apex as a level (`packages/triad-369/src/triad_369_process.mjs:256`, default `'D6'`).

**Camera settings.** A context key, not awareness. The director read them from a screenshot (`OWNER-INPUT.md:7`); grep for `CVar` in `FidelityEMatrix/` finds nothing. Follow Terrain and Head Bob off should stop the client moving the camera itself (general knowledge; needs in-game verification); a camera reading counts only under its own settings. Zoom 4.6 is a client return (`T:180`), its yards unverified. The settings expose the rung: the fractal engine's rung is a camera-distance band (`FC:305-309, 330-337`); port that rule, and the Max Camera Distance slider at its minimum caps "awareness".

## The algorithm

Over R rungs, E "rests on" edges, P parameters per rung, M readings, N props:

1. Kahn's order; a cycle is an error. O(R + E).
2. A reading counts for r only if measured, witnessed outside r (never `IsVisible`), aged 0 ≤ now − at ≤ w_r, under r's context key (version, camera settings). O(M).
3. Sort each rung's readings by time; outside witnesses disagreeing beyond tolerance make r "contested", not held. O(M log M).
4. Calibrate θ_r: least squares O(M_r P² + P³); bisection for one monotone parameter (40 steps, `M:294`); Gauss–Newton capped at I. Unread parameters stay symbolic.
5. held(r) = test_r passes and every parent held; memoized, one visit each. O(R + E).
6. No latch: 2 to 5 rerun from ages; next expiry min(at_r + w_r), O(R).
7. A new reading reruns 2 to 5 for r and its descendants only.
8. Write θ_r with kind and at where consumed (`FIT_BY_FILE`, `propFit`, `terrainPitch`); re-settle props. O(RP + N).
9. Report the held set (rung, claim, witness, at, age, window, kind, θ); a count only as `symbolic(k, "held claims under partition <hash>, not awareness")`. O(R + E).

**Complexity:** O(R + E + M log M + I(M P² + R P³) + N): fixed degrees, I a cap, nothing enumerated.

**Exponential parts, replaced:**
- The being's "level" as the largest consistent subset, 2^R: the held set is closed downward (step 5).
- Which conflicting readings to believe, 2^M, MAX-SAT-like (NP-hard in general; general knowledge): fixed precedence, "contested" (step 3).
- Recursive parent re-checks: Position rests on Fit and Camera, both on Axis; k stacked diamonds give 2^k paths: memoized order (step 5).
- Pitch and fov tuned "until the copy stands on it" (`T:11-14`, `T:733-734`), jointly G^P presses: least squares or bisection (step 4).
- Re-slicing rungs to raise k, faster than exponential (Bell numbers; general knowledge): one hashed partition (step 9).

## Ranked attacks (most fatal first)

1. **Awareness is a clock.** `x[20]` is written only at `SH:48` (0.12) and `SH:65` (plus 0.02 dt, to 0.65), reading no telemetry, rung or host. Every rung node receives it (`apps/fractal-engine/src/rungs/RungTypes.ts:13, 25`); no fractal-engine test exists (`apps/fractal-engine/package.json:6-10`; `package.json:11`). *Check:* two runs with the same dt and different attractors give identical awareness.

2. **The rung repeats the Four Floats' mistake.** Round 5 ruled the floats seeds for three formulas per name (`docs/council/2026-11-04-operator/STEER.md:16`). The active rung has five: connectivity, never below 5 (`DB:142`); literal D3, rewritten to D3 in combat (`WC:36, 101`); a zoom band (`FC:330-337`); literal D7 (`packages/triad-369/src/bootstrap.mjs:44`, `packages/triad-369/src/arena_growth.mjs:87`); default D6 (`packages/triad-369/src/triad_369_process.mjs:256`). D3 alone means "Self-Awareness" (`DB:78`), "Somatic Vessel" (`UI:83`), a reaction-time check (`packages/triad-369/src/wow_anticheat.mjs:445`) and zoom 0.58 to 0.75 (`FC:333, 353`). *Check:* one writer per name, or it prints as symbolic.

3. **The owner's rung is a constant printed as a reading.** Coherence, strain, FTLE, entropy and S are gated by `measured` (`UI:81-82, 85-86, 96`); the rung is not (`UI:83`). *Check:* the tenth report's HUD reads "Active Rung: seed".

4. **The only climb is self-graded and latched.** Graduation needs the harness's own coherence (`SH:136`), chasing a sine of the wall clock (`main.ts:112-117`), at ≥ 0.95 for 1.5 s (`SH:140-144`); only `SH:29` and `SH:143` write `isGraduated`, `reset()` leaves it (`SH:35-50`), and the HUD says "GRADUATED (N -> N+1)" (`main.ts:152`). The bridge's `graduated` (`DB:183`), with a missing tv-loop file defaulting to 12/13 (`DB:115-116`), is just "Sol is up". *Check:* graduate, reset, assert it falls; it does not.

5. **k of R measures the partition.** Builders slice the same reports into seven or eight rungs (`B3-irungnode.md:30-36`, `B1-ladder.md:15-22`); B5 splits the camera alone into seven (`B5-camera.md:33-39`); per-file fits grow R with files, five measured (`T:274`), the rest "a guess" (`T:308`). B6 would let `SovereignTelemetry.awareness` carry "k of R" (`B6-calibration.md:62`), a second writer beside the clock (`SH:65`). A count is a quantity only over a fixed partition of like units (general knowledge). *Check:* count the ninth report under B1's and B5's slicing; k differs with no new reading.

6. **"Measured" means a young file or the caller's word.** `fileEvidence` labels any file measured by its age (`packages/triad-369/src/evidence.mjs:18-23`); `BindCell`, exposed to every module (`Core:330`), stores the caller's kind (`Core:168, 178`), its value "not a reading" (`Core:160-163`). *Check:* headless, `CellOpen` is true for a fresh bind of "awareness", 0.9, measured (`Core:199`).

## Concessions the evidence forces

- The ladder is real: every terrain row but the camera had a measure and a named witness, and the measured set grew report by report. "Awareness increases" holds only as that set's inclusion, and the set can shrink (the axis was believed wrong, `T:170-174`).
- The honest unit exists: the cell record (`Core:164-180, 194-199`), the fit's source label (`T:304-309`), the kernel's labelled floats, tested (`packages/triad-369/src/light_being_kernel.mjs:136-141`; `tools/light-being-kernel.test.mjs:161`). Lifting it to rungs adds a parent gate and a decay, not a measurement (O1); above Load the witness was the owner's screen (O3).
- Minimal honest version: the held set with ages; any count "k of R, partition hash, symbolic"; "awareness" names it only by the owner's word.

**First step.** One ledger module (four builders name four: `B2-control.md:77`, `B3-irungnode.md:118`, `B4-witness.md:81`, `B7-holon.md:68`) returning the held set and a symbolic count, no `awareness` key. Its `tools/*.test.mjs` (run by `npm test`, `package.json:11`) asserts, on the ninth report's lines: map, axis, load held (`R9:1385-1386`); frame kind and fit held only on the owner's shots; camera not held; a held rung falls past its window; `IsVisible` never counts; splitting the camera rung changes k, not the held claims; ten stacked diamonds visit each rung once.

| Item | O2 |
| :--- | :--- |
| Missing element | Held versus climbed: a per-rung evidence record that can fall; the held set replaces any awareness number |
| Conceded | the held set is honest and grew; O1: no new measurement; O3: above Load the owner witnessed |
| For the LEAD: | A Light Being reports, for each rung, its claim, the witness outside the rung who measured it, the reading, its age within the rung's window and its kind; it holds a rung only while that record is fresh and every rung it rests on holds, and it reports no awareness number: any count of held rungs is symbolic and names its partition. |
| Route: | Opus core and spec: the one ledger and its test; one writer per rung name. Flash WoW and in-game: gate `UI:83` to seed; send the camera settings with each report. Argon blind red-team: is any proposed awareness measure a host reading, and is a count of held claims still a seed? The owner: does "awareness" name the set; do the settings stay fixed while the camera is measured? |
