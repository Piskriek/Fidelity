# B1: Fractal and procedural fidelity (builders' council, 04 Nov 2026)

Branch `francois/serene-euler-51wj3e`, EMatrix v1.7.1. Evidence: the repo files named below and two Node checks (scratchpad, not committed). Nothing was rendered in the client; those claims are marked "needs in-game verification".

## Thesis

The first repeat the owner will see is not in the texture. `EMatrix_Math.GetCellRotation` computes `(c*73856093 + r*19349663) % 4` (`FidelityEMatrix/EMatrix_Math.lua:34`). Since 73856093 is 1 mod 4 and 19349663 is 3 mod 4, the hash is `(c - r) mod 4`: over the 15x9 grid it fits in 135 of 135 cells, so the 135 cells form one diagonal lattice of four orientations. The cheapest fidelity gain is to break that lattice and to stop rotating the lens cells: rotation currently moves the lens's sun-lit rim off the upper-right edge in 101 of 135 cells (only rotation 0 is the identity, `EMatrix_Math.lua:13`). Beyond that, free variety must sit at a scale the 4x downscale keeps. A 128 px tile drawn at 32 px gives 4 texels per screen pixel, so a feature needs a period of at least 8 texels (16 cycles per tile) to survive; finer fractal octaves average into the flat tint that RESUME records (v1.2.0, bug 5). Fractal work pays most on the backplate (drawn larger than stored, about 2.2 px per texel) and the depth stack, not inside the 32 px cells.

## Proposals, ranked by visible payoff per hour

### 1. Break the lattice and keep the sun on the lens
- **Claim.** The lattice is the first repeat a viewer sees; rotating the lens breaks the single-sun rule.
- **Evidence.** The hash, `EMatrix_Math.lua:27-37`. Rows of the current table read `012301230123012`, then shift by one each row. `EMatrix_Core.lua:483` is the only `SetTexCoord` on a cell and runs once at birth; the window swaps at `EMatrix_Core.lua:775-790` change the texture but not the coordinates, so lens cells keep the E's rotation. The window's lit top and right rim is set at `tools/gen_e_atlas.mjs:218-220`.
- **Candidate hash (checked in Node).** `a = (c*73856093) % 1000003; h = ((a*19349663 + r*83492791) % 1000003) % 4`. No `(a*c + b*r) mod 4` form fits (0 of 16), counts are 33/33/33/36, and no 2x2 block shares one rotation (0 of 112). All values stay below 2^53, so Lua 5.3 (fengari) and WoW's doubles agree.
- **First step.** In `EMatrix_Math.GetCellRotation`, use the candidate. In `EMatrix_Core.lua` at the window branches (around 775, 780, 789), call `cell.flapTex:SetTexCoord(0, 1, 0, 1)` when showing `TEX_WINDOW`, and re-apply `cell.uv8` when showing `TEX_CLOSED`.
- **Test.** Add to `tools/ematrix-lua.test.mjs` (it runs the real Lua through fengari): an exhaustive check that no `(a*c + b*r) mod 4` form fits all 135 cells, and a headless check that every lens cell's `texcoord` is `{0,1,0,1}` after opening (`tools/ematrix_headless.lua:76` records it). `tools/test_ematrix_math.mjs:64-70` is a JavaScript copy of the hash, so it cannot catch an edit to the Lua; point it at the Lua or drop the copy.
- **Effort.** 1 to 2 h. **Cost.** 0 bytes, 0 draw calls.
- **Risk.** Low. Too random a hash reads as noise. Lens texcoord persistence across `SetTexture` needs in-game verification.

### 2. Backplate as a warped fractal nebula
- **Claim.** The largest unrepeated surface is currently two sines; a domain-warped fBm gives real multi-scale structure where magnification makes it visible.
- **Evidence.** The nebula is `sin`/`cos` harmonics with period 1 across the tile (`tools/gen_e_atlas.mjs:383-385`). Its 120 stars have radii 0.8 and 1.5 texels (`:360-369`), so at 2.2x they become 2 to 3 px blobs. The backplate is at zoom 0.86 and alpha 0.92 (`EMatrix_Core.lua:47, 328-330, 582`), so it covers most of the window.
- **Cost.** Stays 256x256 (262,162 B, asserted at `tools/test_ematrix_math.mjs:300`). 512x512 is 1,048,594 B. 0 draw calls.
- **First step.** In `generateNebulaBackplate`, replace `n1`/`n2` with 5-octave value-noise fBm (lacunarity 2, gain 0.5), warped as `q = fbm(p); n = fbm(p + 4q)`, with the lowest octave's period at least 32 texels. Keep the stars.
- **Test.** Keep the size assertion. Add: the mean absolute difference between neighbouring texels over the centre 0.86 window exceeds a floor (the current sines are smooth), the mean luma of that window stays in a band so the lens reading is not washed out, and the output is byte-identical for a fixed seed.
- **Effort.** About 3 h. **Risk.** A busy backplate competes with the character. Tune `alpha` (`EMatrix_Core.lua:330`) first. Look needs in-game verification.

### 3. Four warped E silhouettes in one sheet
- **Claim.** The E is the dominant sprite. Four quadrant variants, each with four rotations and a mirror (the 8-coordinate form allows this at no cost), give 32 distinct appearances from one file.
- **Evidence.** The height field is `getMarshmallowEHeight` (`tools/gen_e_atlas.mjs:78-116`). Only four orientations exist in `ROT_UV8` (`EMatrix_Math.lua:12-17`). The cells already draw one texture object each with per-cell coordinates (`EMatrix_Core.lua:479-485`), so draw calls do not change.
- **Cost.** +262,162 B for a 256x256 sheet. Keep `Marshmallow_E_Closed.tga` unchanged, since `tools/test_ematrix_math.mjs:238` asserts its 65,554 B. 0 draw calls.
- **First step.** Add a seed to `getMarshmallowEHeight(u, v, seed)`, with a domain warp of at most 0.04 in [-1, 1] units (about 2.6 texels) and no feature finer than 8 texels. Write `Marshmallow_E_Atlas.tga`. Add `EMatrix_Math.AtlasTexCoords(variant, rot, mirror)`, which maps the `ROT_UV8` corners into the quadrant with a 4-texel gutter.
- **Test.** Box-downsample each quadrant to 32x32 (the on-screen size) and require a mean absolute difference of at least 6 levels between every pair. Require all eight orientations of one variant to be distinct tables. Require the gutter to be transparent.
- **Effort.** 3 to 4 h. **Risk.** Quadrant bleed and mismatch: needs in-game verification.

### 4. Per-cell brightness jitter and texel-scale dither
- **Claim.** A plus or minus 3% vertex colour per cell breaks identical-looking cells without moving the regular array. Dither helps the backplate's gradient, where red runs 8 to 30 over 256 rows (`tools/gen_e_atlas.mjs:378-380`), and only the backplate: the 128 px tiles must never be dithered, because dither at texel scale averages flat at 4x.
- **Evidence.** `SetVertexColor` already drives the walls and reticle (`EMatrix_Core.lua:431-440, 518`). The headless stub records it (`tools/ematrix_headless.lua:78`).
- **Cost.** 0 bytes, 0 draw calls.
- **First step.** Add `Math.VertexJitter(c, r)` built on the candidate hash, returning a value in [0.97, 1.03]. Call `flapTex:SetVertexColor(j, j, j)` after `EMatrix_Core.lua:483`. In the nebula generator, add a 4x4 Bayer threshold of plus or minus half a level per texel.
- **Test.** Headless: all 135 values fall in range and lens alpha is unchanged. Node: the Bayer matrix has mean 0.5.
- **Effort.** About 1 h. **Payoff.** Low to medium. **Risk.** Low.

### 5. A second star layer for depth
- **Claim.** The stack already has four planes, and the only real depth cue beyond them is motion parallax. A sparser, ADD-blended star layer at z = 0.75 (between the subject at 0.5 and the backplate at 1.0) adds a parallax step. Density falling with z adds a texture-gradient cue.
- **Evidence.** `EMatrix_Math.lua:137-141` (`ParallaxShift`); plane depths in `EMatrix_Core.lua:43` and the header at lines 6-12.
- **Cost.** 262,162 B for 256x256, or 65,554 B at 128x128. One more texture per eye, so two in anaglyph.
- **First step.** Generate `Stars_Far.tga` with a thresholded fBm point set. Create it in `CreateTexture` next to the backplate, with `SetBlendMode("ADD")`, moved by `ParallaxShift(eye, 0.75)` times the gain.
- **Test.** For a range of eyes, the layer's shift lies strictly between the subject's and the backplate's. Add to `tools/test_ematrix_math.mjs`.
- **Effort.** About 2 h. **Payoff.** Medium for depth. **Risk.** Light leaking through the lens aperture reads as dirt. Needs in-game verification.

## What does not help

- **More texels for the 32 px cells.** A 256 px E gives 8 texels per screen pixel and no more visible detail. The mip and filter behaviour is needs in-game verification.
- **Fractal octaves under 8 texels** in the E or the lens. They average to a flat tint, as RESUME already records.
- **Random per-cell lens rotation or warp.** It destroys the regular array that reads as a microlens and breaks the sun rule (101 of 135 cells today).
- **Fractal texture as a stand-in for depth.** Texture cues are weak at this scale; depth here comes from parallax and disparity (`EMatrix_Math.lua:137-141`).

## Closing table

| Proposal | Payoff | Effort | Confidence |
| :--- | :--- | :--- | :--- |
| 1. Break the lattice, keep the sun on the lens | High (removes the first visible repeat) | 1 to 2 h | High for the code facts; medium for the look |
| 2. Warped fractal nebula backplate | High (largest surface) | About 3 h | Medium |
| 3. Four warped E variants in one sheet | Medium to high | 3 to 4 h | Medium (seams unverified) |
| 4. Vertex jitter and texel-scale dither | Low to medium | About 1 h | High |
| 5. Second star layer for depth | Medium (depth) | About 2 h | Medium |
