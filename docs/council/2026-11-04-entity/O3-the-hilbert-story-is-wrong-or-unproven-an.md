# O3: The Hilbert story is wrong or unproven, and the fifth metric is real

Opposer voice, definition round. Read-only on the code; the computations are in the scratchpad (`o3_curves.py`, `o3_e_shape.mjs`). "From the code" marks what the files show; "general knowledge" marks rules of thumb; "needs in-game verification" marks anything about the client's rendering.

## Thesis

The Hilbert story describes nothing the addon runs. The E is a hand-placed signed-distance shape (`tools/gen_e_atlas.mjs:78-116`), no curve is computed anywhere, and the grid is indexed row by row (`FidelityEMatrix/EMatrix_Core.lua:465-466`). No cell reads any Four-Float: `Lx`, `Aq`, `Pxd` and `Vtx` do not appear in `FidelityEMatrix/`. The gate `u` is a function of clock time, two saved settings and a Chebyshev/Euclid distance (`EMatrix_Math.lua:89-97`), so Argon's own table breaks the Four-Float rule it cites. What survives is real: a 135-cell lens grid with four true rotations, and a deterministic click wave. A definition may keep those and must drop the rest.

## Ranked attacks (most fatal first)

**1. No cell is bound to a Four-Float (fatal to "every visual traces to a number").** `Lx`, `Aq`, `Pxd`, `Vtx` have no hits in `FidelityEMatrix/`. The only four-float values are constants, `fourFloats = { Pxd = 0.20, Vtx = 0.50, Lx = 0.95, Aq = 0.20 }` (`packages/wow-syntropic/Core.lua:37`), printed in the HUD footer (`packages/wow-syntropic/UI.lua:88`). The wave origin is a click or the default cell (8,5) (`EMatrix_Core.lua:560-562`, `:996-997`). *Check:* `grep -rnw "Lx\|Aq" FidelityEMatrix/` returns nothing. Any "live" claim needs in-game verification.

**2. The gate `u` is a fifth metric, and Argon's table says it is derived from the wrong inputs.** `ARGON-INPUT.md:78` says the gate is "Derived from `Lx, Aq`". The code computes `u = (waveAge * waveSpeed - ringDist) / flipDuration`, clamped (`EMatrix_Math.lua:89-97`, called at `EMatrix_Core.lua:776`). Its inputs are the clock, `waveSpeed` 16 and `flipDuration` 0.26 (`EMatrix_Core.lua:58-59`), and `ringDist` from a Chebyshev/Euclid blend (`EMatrix_Math.lua:55-77`). None is `Lx` or `Aq`. The carrier column in `ARGON-INPUT.md:76-79` lists six carriers (`Vtx`, `Pxd`, `Lx`, `Aq`, `u`, `E_ψ`), and `V`, `Π`, `θ`, `ΔL`, `∇_W L` and `Π_0` appear in prose (lines 45-52). *Check:* write the gate as a function of S alone. If it cannot be written, `u` and `E_ψ` are fifth metrics.

**3. The Hilbert curve generates nothing.** Computed in the scratchpad. An order-1 curve on 2x2 visits (0,0), (0,1), (1,1), (1,0): a U open at the top. The order-2 curve on 4x4 is:

```
 0  1 14 15
 3  2 13 12
 4  7  8 11
 5  6  9 10
```

That is a U of four U's, and its silhouette is the full 16-cell square, because a space-filling path has no silhouette of its own. A 1D sequence folded twice (three rows: `0 1 2 / 5 4 3 / 6 7 8`) joins its rows alternately at the right and left ends. That is a Z/S zigzag, not an E, since its arms share no spine. The texture's E is a spine (`x` in [-0.85, -0.32]) plus three bars (`gen_e_atlas.mjs:89-95`). No curve enters the generator or the addon: `curve`, `sequence` and `locality` have no hits in `FidelityEMatrix/*.lua` or `tools/gen_e_atlas.mjs`. *Check:* a Hilbert index implementation in `tools/` or `FidelityEMatrix/`. None exists.

**4. "3D relief" and "gradient rainbow" are baked, static shading.** The output is 2D RGBA (`gen_e_atlas.mjs:28-45`). The height field only enters colour: normals from finite differences (`:147-153`), ambient occlusion (`:178`), and the rainbow from the normal's angle (`:167-170`, `iridPhase`). The light is fixed (`:124-126`). The file is written once (`:439-441`). So the rainbow is not a gradient phase, and the glint is not `Π`. Any perceived depth needs in-game verification.

**5. The restorative dual is a toggle.** `waveTargetState = not waveTargetState` (`EMatrix_Core.lua:940`) runs the same forward wave with the other target. There is no error signal, no `ΔL` and no reverse ripple in the addon.

**6. The depth planes are ratios, not measured depth.** `ParallaxShift = eye * z / (1 + z)` (`EMatrix_Math.lua:130-147`) is a window model with the eye's distance normalised to 1. `z = -0.4` means 0.4 of the eye distance in front of the screen, not metres. Pixel gains are choices: `PX_GAIN = 60` (`EMatrix_Core.lua:44`) and `worldParallaxPx = 120` (`:74`).

**7. Ring 2 is not a circle.** The weight at Chebyshev 2 is 0.5 (`EMatrix_Math.lua:73-74`). The edge cell (10,5) is at 2.00 and the corner (10,7) at 2.41 from origin (8,5). Minor, but "circular at Ring 2+" is wrong at ring 2.

**8. Portability has no schema in this checkout.** The sample rows in `ARGON_OPUS_MASTER_RESUME_V3.md:45-57` (`m`, `me`, `mc`, `mb`, `nem`) carry `hard`, `bal`, `inv`, `cyc`, `tier`, `temper` and similar keys, with no `Pxd`, `Vtx`, `Lx`, `Aq` and no gate. The `hm:universe:v2` definition and `PLAN_FRACTAL.md` live in HeavyMetal2, which is not here.

## Concessions

- The E silhouette is real. The spine with three arms and two open gaps is one connected component with three arm runs (computed from `gen_e_atlas.mjs:78-116`). "Thrice-lobed E" describes the texture correctly.
- The four orientations are true rotations. The `ROT_UV8` table (`EMatrix_Math.lua:12-17`) has a cross product of +1 at 0, 90, 180 and 270 degrees, and `GetCellRotation` (`:39-40`) picks one per cell.
- The 1 to 8 cascade holds. Chebyshev distance 1 gives exactly eight cells at 1.00 (`EMatrix_Math.lua:73-74`, checked on a 5x5 window).
- Locality-preserving folding is a sound goal. General knowledge: Hilbert ordering keeps 2D neighbours closer in the 1D index than row-major ordering does. The addon does not do it.

**Minimal honest version:** "135 cells, each a baked E tile in one of four hash-chosen orientations. A click starts a Chebyshev/Euclid wave whose timing comes from two saved numbers. No cell reads the entity."

## Rulings

Rule A: the definition may keep it. Rule B: drop or relabel it. "X needed": cannot be settled without X.

**Q1 Identity.** The code has 135 indexed cells and no roster, agent or weight record (`EMatrix_Core.lua:27-29`). Hilbert locality, the only thing that could make one cell a neighbourhood of weights, is absent. Ruling: rule B on "one cell is one weight block". The owner's cell-to-agent map is X needed.

**Q2 Truthful binding.** No cell is bound to a number (attack 1). Ruling: rule B for every current visual. The minimum truthful binding cannot be named from the Four-Floats; it needs the live source O1 is asking for.

**Q3 Stereo versus comfort.** The planes are ratios (attack 6). Ruling: rule B on any metric depth claim. Comfort needs in-game verification (protocol P6, `docs/council/2026-11-04/B3-perception.md`).

**Q4 Restorative dual.** Ruling: rule B. Keep the wake-up as a toggle and drop "dual" (attack 5).

**Q5 Portability.** The sample shorthand has no Four-Float or gate field (attack 8). Ruling: X needed, the `hm:universe:v2` schema from HeavyMetal2.

## What the definition may NOT claim

- That the E is a Hilbert curve, or that a Hilbert fold generates it.
- That cells encode weights, gradients or a holon's state.
- That any visual is driven by `Lx`, `Aq`, `Pxd`, `Vtx`, `u`, `E_ψ`, `V`, `Π` or `θ`.
- That the rainbow is a gradient, or the glint is `Π`.
- That `z` is metric depth, or that the planes are comfortable at any pixel gain.
- That a restorative dual exists.
- That the entity ports through `hm:universe:v2` (schema not here).

## Closing table

| Question | Ruling | Evidence | Confidence |
| :--- | :--- | :--- | :--- |
| Thesis (Hilbert and fifth metric) | True as stated for the E and for `u`; the four rotations and the wave survive | `gen_e_atlas.mjs:78-116`; `EMatrix_Math.lua:89-97`; script output | High |
| Q1 Identity | X needed (cell-to-agent map); rule B on weight-block identity | `EMatrix_Core.lua:27-29`, `:465-466`; no weight data in the tree | High on the code, low on the owner's intent |
| Q2 Truthful binding | Rule B for all current visuals | `grep -rnw "Lx\|Aq"` empty; `wow-syntropic/Core.lua:37`; `EMatrix_Core.lua:560-562` | High |
| Q3 Stereo versus comfort | Rule B on metric depth; comfort X needed (in-game) | `EMatrix_Math.lua:130-147`; `EMatrix_Core.lua:44`, `:74` | High on ratios, low on comfort |
| Q4 Restorative dual | Rule B (toggle only) | `EMatrix_Core.lua:940` | High |
| Q5 Portability | X needed (`hm:universe:v2` schema, HeavyMetal2) | `ARGON_OPUS_MASTER_RESUME_V3.md:45-57` | High that it is absent here |
