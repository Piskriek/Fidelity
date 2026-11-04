# B3: Simicist and Physics, the definition round (04 Nov 2026)

**Basis.** Read-only, no network, no git. Computed in the scratchpad: Hilbert indices (general knowledge: the standard d2xy algorithm), the E mask from the text of `tools/gen_e_atlas.mjs:78-116`, the real `EMatrix_Math.lua` under fengari, and a BigInt check of the rotation hash. Not in this checkout: `PLAN_FRACTAL.md` and the `hm:universe:v2` spec (HeavyMetal2 repo). The only shorthand here is the example at `ARGON_OPUS_MASTER_RESUME_V3.md:44-57`.

## Thesis

Argon's mathematics has three working parts and several named parts the repo does not contain. Working: the wave metric `CalculateRingDistance` (exactly 1 for the eight neighbours, Euclidean from ring 3), the flip clock, and the parallax formula `e*z/(1+z)`, which matches a ray cast. Not working as stated: the "E" is a hand-drawn letter, not a Hilbert output; an order-2 Hilbert curve is a U of U's that fills a square; the Four Floats in the code mean paradox tension, vortex flow, luminosity and reserve, and nothing computes Pi, theta or a Fisher term; the gate `u` is a clock, not a function of Lx or Aq. The rotation test also runs on wrong numbers, because fengari's integers are 32-bit.

## Mathematics audit

**Hilbert, order 2 (4x4).** Index grid, top row first:

```
 5  6  9 10
 4  7  8 11
 3  2 13 12
 0  1 14 15
```

Consecutive indices are neighbours (general knowledge, the defining property). Quadrants hold indices 0-3, 4-7, 8-11, 12-15, each an order-1 U, joined in a U: a U of U's. All 16 cells are filled, so there is no E silhouette. Locality runs one way: 4 of 24 spatial neighbour pairs have index gaps above 4, the worst 13 (cells (1,0), (2,0)). "Zero wasted space" fails: 135 cells need a 16x16 square, leaving 121 (47%) unused (general knowledge: Hilbert curves live on 2^k squares). The repo has no Hilbert code; orientation is a hash (`FidelityEMatrix/EMatrix_Math.lua:27-43`), and `ROT_UV8` (`:12-17`) rotates the texture, not a sub-curve.

**The E.** `tools/gen_e_atlas.mjs:89-95` draws three horizontal bars on a spine: the three-lobed E, which is a letter.

**Wave.** Run under fengari, origin (8,5) on 15x9: ring 1 is eight cells at exactly 1.0 (w = 0, `EMatrix_Math.lua:73-74`); ring 2 has three distinct values, 2.000 (4 cells), 2.118 (8) and 2.414 (4), because it is a half-blend (w = 0.5); from ring 3 the value is exactly Euclidean. So "1 -> 8 -> circular" holds from ring 3; ring 2 is a linear blend. The clock is `u = (age*speed - ringDist)/dur` (`:89-97`, driven at `EMatrix_Core.lua:776`). `GetFlipVisuals` (`:104-125`) gives height 1 to 0.04 to 1 and a specular peak at u = 0.5; verified.

**Parallax.** `ParallaxShift` (`:143-147`) equals e*z/(1+z), matching a ray cast from an eye one unit in front of the screen. For eye 1 the planes move 0.50 (back), 0.33 (subject), -0.18 (glass), -0.67 (pop-out). The "one unit" is a convention, not a measured distance.

**Four Floats (Argon `ARGON-INPUT.md:74-79` against the code).**

- **Vtx**, Argon: frozen Hilbert topology. Code: `0.50 + sin(tick*0.2)*0.06` (`packages/triad-369/src/triad_369_process.mjs:232`). A clock. Cell rotation takes no float.
- **Pxd**, Argon: grid density and texel resolution. Code: "Paradox Tension" (`triad_cli.mjs:84`), `max(0.10, 0.35 - rawLoss)` (`density_bridge.mjs:118`). Grid density is the constants `COLS`, `ROWS` (`EMatrix_Core.lua:27-29`).
- **Lx**, Argon: Fisher precision Pi. Code: "Luminosity" (`triad_cli.mjs:86`), `0.5 + flowIntegrity*0.495` (`triad_369_process.mjs:233`). No Pi, Pi_0 or Fisher term.
- **Aq**, Argon: phase theta = acos(x-hat . g-hat). Code: "Syntropic Reserve, J" (`triad_cli.mjs:87`), `0.15 + 0.05*passed` (`triad_369_process.mjs:234`). No x-hat, g-hat or theta.
- **Gate u**, Argon: derived from Lx and Aq. Code: wave clock only.
- The renderer reads none of the four; its live inputs are the clock, the eye (`EMatrix_Core.lua:741-758`) and settings. Argon also names quantities with no code: grad-L, E_psi, delta-L, V, du(z,t).

## Q1 Identity (Option A or B)

**Evidence.** The only coupling is the distance kernel from one origin (`EMatrix_Core.lua:939-945`). A cell's state is its orientation and its arrival time. No code maps a cell to a roster agent. **Physics.** One origin and one fixed kernel make one field discretised into 135 tiles: the dynamics are Option B's.
**Ruling: rule B for the code as built.** Option A cannot be settled without per-cell state and an agent-to-cell map.

## Q2 Truthful binding ("a lens never lies")

**Evidence.** `TriggerScoreboardWave` is called from a click (`EMatrix_Core.lua:560`), a default (`:562`) and `/fide ripple` (`:998`). No telemetry reaches `u`, so under Argon's rule every flip is a clock. **Physics.** A binding is truthful when the visual is a stated monotone function of a named number with units. Minimum per cell: one measured scalar s_i in [0,1] with its source named, and u_i = clamp(s_i).
**Ruling: rule A for the principle; cannot be settled without the owner naming one number per cell.**

## Q3 Stereo versus comfort

**Evidence.** No frame alternation exists: the stereo is a static offset (`EMatrix_Core.lua:65`) and a subject yaw of +/-0.06 rad (`:64`). The comment "true view disparity" (`:14`) overclaims: it is a yaw of the model, not a second eye. Argon's 1.75 px and 45 FPS thresholds appear nowhere in the repo. **Physics.** Pixels are not an angle. Under assumed geometry (24-inch 1920x1080 at 600 mm; an assumption), 4 px is 0.11 degrees, 6.6 px 0.17, 1.75 px 0.05. General knowledge: comfort limits are often quoted near 1 degree, depending on stimulus. Static offsets sit well inside that; crosstalk and the flat real world are the real risks (`B3-perception.md` P6; `EMatrix_Core.lua:583`).
**Ruling: rule A for the static default at assumed geometry; cannot be settled without measured screen size, distance and frame times for option (b).**

## Q4 Restorative dual

**Evidence.** The closing wave is the same kernel with the target toggled (`EMatrix_Core.lua:940`): an involution on each cell's binary state. No V exists in EMatrix. A retrigger resets `waveAge` (`:939`) and holds mid-flip cells until the new front arrives (from the code; in-game not verified). **Physics.** A toggle returns exactly to its start; "annealing" needs a defined V. An honest partial rule is a stopping radius, target_i = (ringDist_i <= R), with R one stated parameter.
**Ruling: rule A for the involution; cannot be settled without a defined V. Partial versus full aperture is the owner's choice.**

## Q5 Cross-host portability

**Evidence.** The visual state is about ten numbers (target, origin, age, speed, duration, lens alpha, eye x, y, z); orientations are a deterministic hash, so it serialises far under 4 KB. The spec and `PLAN_FRACTAL.md` are absent, the example block carries no Four Floats, and the cognitive state is not in the repo.
**Ruling: cannot be settled without the spec and the cognitive state. The visual part is rule A; portable numbers are not the same entity.**

## Harness error (a finding)

Under fengari `math.maxinteger` is 2147483647, so `855874 * 19349663` wraps to -520422914 (exact: 16560873470462). `tools/test_ematrix_math.mjs:71-87` runs the hash that way, while the comments at `:67-68` and `EMatrix_Math.lua:37-38` say harness and game agree. The exact result, which Lua 5.1 doubles reproduce because every intermediate is below 2^53 (general knowledge), is 33/33/33/36 as the comment says. The fengari grid is 33/35/32/35, and the assertions at `:205-223` pass on it. In-game value: needs in-game verification.

## Proposed canonical definition (my words)

A Weight-and-Gradient Entity, in this repo's terms, is a 15x9 field of 135 tiles whose orientations are a fixed hash of position, whose flip timing is one wave clock from one origin, and whose eye is the viewer's head. It holds no per-tile state and no measured input. Its name claims the Four Floats, a Hilbert fold and a truthful binding; none is in the code. Until each tile carries a named measured scalar and the Four Floats enter through a stated function, the repo may describe the lattice but may not claim the entity, a Hilbert fold, Pi, theta or a truthful flip.

## Closing table

| Question | Ruling | Evidence | Confidence |
| :--- | :--- | :--- | :--- |
| Q1 Identity | Rule B as built | `EMatrix_Core.lua:939-945`; no agent map | High |
| Q2 Truthful binding | Rule A; owner names one number per cell | `EMatrix_Core.lua:560,562,998,760-782` | High |
| Q3 Stereo vs comfort | Rule A (static, assumed geometry) | `EMatrix_Core.lua:14,64,65,583`; arithmetic | Medium |
| Q4 Restorative dual | Rule A (involution); energy needs V | `EMatrix_Core.lua:939-940`; no V | High |
| Q5 Portability | Cannot settle without spec and cognitive state | spec absent; `ARGON_OPUS_MASTER_RESUME_V3.md:44-57` | High |
| Hilbert shape | U of U's, not a three-lobed E | index grid; `gen_e_atlas.mjs:89-95` | High |
| Four Floats | Renaming plus clocks; Pi, theta absent | `triad_cli.mjs:84-87`; `triad_369_process.mjs:232-234` | High |
| Rotation test | Harness wrong (32-bit integers) | `test_ematrix_math.mjs:71-87,205-223` | High |
