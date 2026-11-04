# O3, opposers' report, round 5: the second definition (04 Nov 2026)

**Thesis.** Argon's operator T(W, g, s) is a second definition, not a restatement of round 2's unsigned one. It names symbols this checkout does not hold (W, g, s_vec, Pi and D_KL, E_psi, V), reuses existing names (Lx, Aq, u) for different quantities, and gates the aperture on a flux-and-resonance threshold that no source measures. The one part the code already has is the ring metric. The defensible merge is round 2's definition with a stated threshold on the registry's value, the metric and the fixed orientation kept, and invariants 1, 2 and 5 kept as tests. Invariants 3 and 4 wait until their symbols exist. Against the SQ Distortion Check (solar-control: cherry-picking), the owner's v1.7.4 screen is counted as evidence against the vector, not set aside.

## The two definitions side by side

| Topic | Round 2 (entity STEER section 2) | Argon T(W, g, s) |
| :--- | :--- | :--- |
| A cell | Tile with fixed orientation, a seed not a state, an open or closed face (`docs/council/2026-11-04-entity/STEER.md:28-30`) | A holon: "1 cell = 1 holon" (`ARGON-INPUT.md:33`) |
| Opening | A named source, value in [0,1], age, kind; opens only when the source says so (`STEER.md:30`) | "flux + steering resonance exceed threshold", u: 0 to 1 (`ARGON-INPUT.md:23`) |
| Rest | The wave carries no information; no restorative dual (`STEER.md:34`) | Idle cells anneal back to rest (`ARGON-INPUT.md:24`) |
| Four Floats | Tiles carry none; the holon's floats are labelled symbolic or seed (`STEER.md:43`) | "Four Floats only": Lx = tanh(alpha·\|g\|), Aq = gradient phase (`ARGON-INPUT.md:20-21`) |
| Metric | 1, then 8, then Euclidean from ring 3 (`STEER.md:32`) | Same formula (`ARGON-INPUT.md:18`) |
| Stereo | Continuous, never alternating (`STEER.md:36`) | Disparity 0.0 at z = 0 (`ARGON-INPUT.md:45`) |

Same thing in different words: the metric, the fixed orientation (R in the vector, the hash in the code), the zero plane, and the click-born flip with its squash (`EMatrix_Math.lua:110-131`).

## Ranked conflicts (most fatal first)

**1. The vector's symbols have no source.** No file in the repo contains KL, Pi_0, E_psi or Pi0 (a search over `.lua`, `.mjs`, `.js`, `.ts` finds only FTLE hits). W does not exist: orientation is a hash of (col, row) (`FidelityEMatrix/EMatrix_Math.lua:27-45`), not the "spectral parity hash" of `ARGON-INPUT.md:8`. Invariants 3 and 4 assert quantities no function computes. Settling check: write each as a node:test; it cannot pass until a new float exists, and the vector forbids new floats ("zero new global floats", `ARGON-INPUT.md:33`). Allowing one is the owner's call.

**2. "Four Floats only" names seeds, and the name carries three formulas.**
- Pxd: `packages/triad-369/src/density_bridge.mjs:132` gives 0.35 - rawLoss; `triad_369_process.mjs:231` gives 0.333 plus an octave term.
- Lx: `density_bridge.mjs:134` gives 0.50 + coherence·0.50; `triad_369_process.mjs:233` gives 0.50 + flow·0.495.
- Aq: `density_bridge.mjs:135` is an availability tier; the vector's Aq is a gradient phase (`ARGON-INPUT.md:21`). Same name, different quantity.
- `triad_369_process.mjs:215` sets `whole_check.passed: true` as a literal, and `:234` builds apexAq from it.
- Vtx: `density_bridge.mjs:133` is sin(tickCount·0.1), with tickCount incremented per call (`:85`, `:104`). A clock, not a measurement.
- WoW: `packages/wow-syntropic/Core.lua:36-37` holds the literal `fourFloats = { Pxd 0.20, Vtx 0.50, Lx 0.95, Aq 0.20 }`.

Settling check: one definition and one writer per float; re-run a grep for writers of `fourFloats` on this branch (round 4 reports none).

**3. The aperture threshold is a label cut, not a flux.** `EMatrix_Core.lua:199`: CellOpen = fresh and measured and value >= 0.5. The value is `BAND_VALUE` (`EMatrix_World.lua:149`: near 1.0, mid 0.5, far 0.2), a constant per band, not a reading (`docs/council/2026-11-04-can/STEER.md:9`). A mid unit opens because 0.5 >= 0.5. The vector needs flux and resonance; neither `g` nor `s_vec` exists, and its threshold is unstated (`ARGON-INPUT.md:23`). The owner's v1.7.4 screen shows seven measured bands opening (`RESUME.md:22`); the vector's rule would close them. Settling check: `/fide cells` with `/fide bind on` in game; whether the 0.5 label is right is an owner ruling. Needs in-game verification.

**4. "Anneal back to rest" against a toggle and a driver that detaches.** A click flips one global target, `waveTargetState = not waveTargetState` (`EMatrix_Core.lua:1054`); cells settle to it (`:922`). There is no per-cell target, delta-L or V. `CheckIdleCondition` (`:1013-1032`) detaches the driver when spin, parallax, bound cells, world and openAmount are all idle. The defaults keep it attached: `spinSpeed = 0.50` (`:60`) and `parallaxStrength = 0.50` (`:61`), so the "0-CPU idle" comments there describe a state the defaults do not reach. Invariant 4 has no u at rest to decrease. Settling check: a headless test that a click, with spin 0, parallax 0 and no bindings, leaves the driver detached with cells at target. The CPU claim needs in-game verification.

**5. "1 cell = 1 holon" fails at the index.** Slot i is cell i (`EMatrix_World.lua:145-147`, `PublishSlot` `:151-155`), and cell indexes are row-major screen positions (`EMatrix_Core.lua:544`, `:637`). Actor slots are stable per unit but reassigned when units leave (`EMatrix_World.lua:271-293`); a plate can reassign a unit token (`docs/council/2026-11-04-can/STEER.md:20`). The six Triad flows have no channel to any cell (`docs/council/2026-11-04-bridges/STEER.md:15`). Settling check: a test that a slot reassigned to a new token changes the cell's source record, not its identity. Identity design is Opus's.

**6. The zero-plane lock holds for the grid by layer, not as a function of z.** The grid is `frameGrid` under `masterFrame` (`EMatrix_Core.lua:537`), outside the stereo scenes `sceneLeft` and `sceneRight` (`:501-502`), so it has no disparity by construction. The Core anaglyph subject moves by a constant ±stereoPixels (`:706`, `:714-716`) at z = 0.5, not by ParallaxShift. Only the World path computes disparity from z (`EMatrix_World.lua:213`, zero at z = 0). `stereoPixels` runs 0 to 16 (`EMatrix_Core.lua:1207`). Settling check: a node test on the World pair formula at z = 0, and a rule for the Core subject. What the owner sees in anaglyph needs in-game verification.

**7. "Intensity only goes down" is already breached by the lean gain.** `EYE_GAIN_MAX = 1.8` (`EMatrix_Core.lua:52`) and `DEPTH_GAIN = 0.6` (`:51`) raise parallax when the eye leans in (`EyeGain`, `:216-218`). Round 2 proposes a cap of 1.0 for the owner's dial (`docs/council/2026-11-04-entity/STEER.md:19`). A shared breach, not a clash between the two.

Not in checkout, not ranked: `apps/universe`, `bridge/roster`, `@hm/sq-jepa`, `@hm/shorthand`, `hm:universe:v2` and `PLAN_FRACTAL.md` are absent. The Hilbert account is taken from round 2 (`STEER.md:11`) and was not re-read.

**Adopting the vector would forbid what the owner has seen working:** the seven measured bands opening on the box (`RESUME.md:22`); the click wave's open and closed toggle (`EMatrix_Core.lua:1054`); the flip squash the owner saw (`RESUME.md:23`; current build needs in-game verification). It would also swap the boolean face for a continuous u gate.

## Concessions the evidence forces

- The ring metric is the code's `CalculateRingDistance` (`EMatrix_Math.lua:57-79`); keep it with its non-finite test (`tools/test_ematrix_math.mjs:178`).
- Keep R as a fixed orientation (`EMatrix_Math.lua:27-45`); drop W.
- The registry's lower bound and per-source windows (`EMatrix_Core.lua:194-197`) are the honest core of "measured and fresh"; adopt them as the gate.
- Unbound cells stay closed with no glint (`:1082-1089`), which the comfort law needs.
- The lean gain must be capped; the vector's comfort law is right on this.
- Minimal honest version: a cell opens iff its record is fresh, measured and at or above a stated threshold on a labelled value; no flux gate and no annealing until a per-cell measure exists; Four Floats appear only as labelled values; the click wave is a transition with no memory.

## Closing table

| Item | Verdict | Evidence | Settling check | Who |
| :--- | :--- | :--- | :--- | :--- |
| W, g, s_vec, Pi, D_KL, E_psi, V | Struck until a source exists | No hits in code (conflict 1) | Stub test fails to compile | Owner (new floats) |
| Four Floats | Labelled seeds; one name per float | `density_bridge.mjs:132-135`, `triad_369_process.mjs:215,231-234`, `wow-syntropic/Core.lua:36-37` | One writer per float | Opus, then Flash |
| Aperture gate | Fresh, measured, label >= stated threshold | `EMatrix_Core.lua:199`, `EMatrix_World.lua:149` | `/fide cells` with `/fide bind on` | Owner (threshold) |
| Anneal to rest | Struck; wave is a transition | `EMatrix_Core.lua:1054`, `:1013-1032` | Headless detach test | Opus |
| Cell = holon | Keyed by unit token, not index | `EMatrix_World.lua:145-293` | Slot-reassignment test | Opus |
| Zero plane | Grid holds; Core subject needs a z rule | `EMatrix_Core.lua:501-537`, `:706`; `EMatrix_World.lua:213` | Node test at z = 0 | Opus |
| Ring metric, R | Keep | `EMatrix_Math.lua:27-79` | Existing tests | Keep |
| Lean gain | Cap at 1.0 | `EMatrix_Core.lua:51-52` | Owner's dial | Owner |

**For the LEAD:** Sign "A cell is open only while a named source's labelled value, measured and fresh within its own window, is at or above the source's stated threshold; the wave is a click-born transition that settles to its target, and no per-cell annealing is claimed"; strike "flux plus resonance", "anneal back to rest" and "1 cell = 1 holon".

**Route:** Opus (core kernel and spec): the threshold rule, stub tests for invariants 1, 2 and 5, token-keyed identity. Flash (WoW and web scaffolding): labels on the HUD and Triad floats, and the lean-gain cap once the owner sets it. Argon (blind red-team audit): the 0.5 threshold, the three Lx and Aq formulas, and whether invariants 3 and 4 can be dropped without loss.
