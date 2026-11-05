# B3 Comfort: the comfort contract on the code's planes (round 5)

**Thesis.** Argon's deliverable 3 can be written as equations on the planes the code has today, and its z = 0 clause already holds by construction: `ParallaxShift(eye, 0) = 0` (`FidelityEMatrix/EMatrix_Math.lua:149-152`, asserted at `tools/ematrix_headless.lua:337`); the lens grid and housing are never passed to `ApplyDepthPlanes` (`FidelityEMatrix/EMatrix_Core.lua:744-819`); and the World pair `px * PS(1,z) / PS(1,0.5)` is 0 at z = 0 (`FidelityEMatrix/EMatrix_World.lua:213`). What does not exist: a dial that lowers motion and intensity together, any colour that depends on the sign of z, any frame-time term, and any per-frame alternation. Several things break "intensity only goes down" as the code stands: spin defaults to 0.5 (`EMatrix_Core.lua:60`), the eye gain can reach 1.6 (`EMatrix_Core.lua:217`, `951`), and the flip glint peaks at full alpha (`EMatrix_Math.lua:121-123`). The first bridge is one [0, 1] dial applied as a cap on every peak, not new texture.

## Ranked bridges

**1. One comfort dial over every motion and intensity peak.** Visible payoff: high. Effort: small. Risk: low; the rest state changes at the owner's default.
- Claim: `c` in [0, 1] scales each gain after its cap: shift = c * min(EyeGain, 1) * PS(eye, z) * K; spin = c * spin; peak alpha = c * alpha; squash = 1 - c * (1 - scaleY); pair = c * pair. At c = 0 the window is at rest.
- Evidence: the dial is partial today. `parallaxStrength` (clamped 0..1, `EMatrix_Core.lua:1167-1170`) scales the eye (`:948-950`, `:975`), but not spin (`:995-1002`), not the stereo facings (`:1003-1006`, which use only `stereoDelta`), not the flip glint (`EMatrix_Math.lua:121-123`), and not the sheen, wall and reticle alphas (`EMatrix_Core.lua:778`, `:791`, `:806`). With `parallaxStrength` at 0 the anaglyph pair still draws, because `IsStereo()` does not read it (`:1003`). Walls ignore `EyeGain` (`:776`).
- Effort: one pure function in `EMatrix_Math.lua` and four call sites: `ApplyDepthPlanes` (`EMatrix_Core.lua:744`), `OnUpdateDriver` (`:858-1010`), `World.Layout` (`EMatrix_World.lua:200`), and the terrain stepper (`EMatrix_Terrain.lua:327-341`).
- First step: add `ComfortScale(c, gain)` = clamp(c, 0, 1) * min(gain, 1) to `EMatrix_Math.lua`. Test in `tools/test_ematrix_math.mjs`: monotone in c, never above gain, zero at c = 0. Then a headless test in `tools/ematrix_headless.lua`: at c = 0 and spin 0, after 240 frames no alpha, position or facing differs from the closed rest state; at c = 1 the output equals today's for gain <= 1.
- Proof: needs in-game verification: the owner sets the dial to 0 and sees the box at rest, and the login line names the dial.
- Does not help: a dial above 1, or one that raises `lensAlpha` (`/fide lens` accepts up to 1.0, `EMatrix_Core.lua:1179`). Those are raises, not comfort.

**2. One disparity formula for every plane.** Visible payoff: medium. Effort: small. Risk: low.
- Claim: the pop-out reticle and the subject pair should use the same `pair(z)` as World and Terrain, so "z = 0 lock" and "z = -0.4 pop" are one equation.
- Evidence: the reticle uses `d = stereoPixels + 1` (`EMatrix_Core.lua:802-805`), so each eye sits 5 px from centre, a 10 px separation at defaults, whatever `Z_POP` is (`:43`). The World formula at z = -0.4 gives pair = 4 * (-0.667) / 0.333 = -8 px, a 16 px separation (`EMatrix_World.lua:213`, `STEREO_REF_Z` at `:30`). The subject's fixed +/-px (`EMatrix_Core.lua:711`, `:719`) matches the formula only at z = 0.5. The two windows of the same device disagree by the code's own arithmetic.
- First step: replace `:802-805` with `pair = px * PS(1, Z_POP) / PS(1, Z_SUBJECT)`. Test in `tools/ematrix_headless.lua`, next to the anaglyph case at `:454-463`: pair(0) = 0, and the reticle separation equals 2 * |pair(-0.4)|.
- Proof: needs in-game verification of how the reticle pops.
- Does not help: it does not change comfort; it only makes the depth honest.

**3. A zero-flicker test on the code.** Visible payoff: low on screen, high as proof. Effort: small. Risk: none.
- Claim: "|L_even - L_odd| == 0" is a property the harness can check without the owner's eyes.
- Evidence: no parity term exists. Per-cell writes run only while `0 < u < 1` or on settle (`EMatrix_Core.lua:878-923`). `ShowFace` returns early on no change (`:340-342`). `ApplyDepthPlanes` runs only when the eye or `openAmount` moves more than 0.0005 (`:987-992`). Bound faces change only in `ApplyBindings` (`:1075-1092`), four times a second (`:937-941`). Time drives the wave (`:866`), and no code gates on frame time.
- First step: in `tools/ematrix_headless.lua`, drive `OnUpdateDriver` for 240 frames at a fixed dt with no input and record every `SetAlpha`, `SetPoint` and `SetHeight` write. Assert zero writes after settle, and monotone alpha per cell in a transition.
- Proof: the harness passes; needs in-game verification for the compositor.
- Does not help: it says nothing about the client's own rendering.

**4. Hysteresis on the bound face.** Visible payoff: low to medium. Effort: small. Risk: changes binding semantics, so the owner decides.
- Claim: a source sitting on the threshold can toggle a face.
- Evidence: `CellOpen` is value >= 0.5 with no hysteresis (`EMatrix_Core.lua:199`). `BAND_VALUE` gives `mid = 0.5` (`EMatrix_World.lua:149`), exactly on that threshold, so a mid to far change toggles the face. `BAND_CONFIRM = 2` (`:33`) damps band changes at `REFRESH_INTERVAL = 0.25` (`:29`), but nothing damps a freshness boundary at cell level.
- First step: a hysteresis band in `CellOpen`, with a test in the headless harness where value alternates 0.5 and 0.2 per tick and the face changes at most once per confirm window.
- Proof: `/fide cells` shows no toggle under a steady source.
- Does not help: an alternating source stays alternating; the source must be honest first.

**What does not help (and what the definition should rule out).**
- Warm-gold for z < 0 and cool-indigo for z > 0: no code reads z for colour. The warm key and cool fill are fixed by light direction (`EMatrix_Core.lua:284`), and the gold housing by side (`:389-399`). General knowledge: the chromostereopsis effect is weak and observer-dependent; needs in-game verification.
- Pulfrich inner-bevel shadow: no code. General knowledge: Pulfrich needs motion plus an inter-eye delay or luminance difference, and a static bevel does not supply it. The bevel is one texture for both eyes (`tools/gen_e_atlas.mjs:219-220`, `:247-252`). The anaglyph gives each eye a different colour and cyan at 0.5 alpha (`EMatrix_Core.lua:285-286`, `:720`, default `:66`), a luminance difference with no motion timing. Needs in-game verification.
- Frame-time-gated micro-saccade parallax: no gate exists; `dt` only drives smoothing and rates (`EMatrix_Core.lua:866`, `:933`, `:952`, `:976`, `:997`). Argon's 60 Hz, 1.75 px and 16.7 ms appear in no file in this checkout except the ASK.
- Walls as a plane at z = 0..1 (header, `EMatrix_Core.lua:9`): they resize by `base * (1 +/- gain * eye)` (`EMatrix_Math.lua:180-192`) and carry no z.

## Comfort clauses against the code

| Clause (Argon, deliverable 3) | Equation on the code's planes | Test | Status |
| :--- | :--- | :--- | :--- |
| z = 0 lock | `PS(e, 0) = 0` (`EMatrix_Math.lua:149-152`); grid not in `ApplyDepthPlanes` | `ematrix_headless.lua:337` (exists); pair(0) = 0 (missing) | Holds; add the pair test |
| Pair at reference depth | pair(0.5) = stereoPixels (`EMatrix_World.lua:213`); subject +/-px (`EMatrix_Core.lua:711`, `:719`) | none | Holds for World; reticle disagrees (item 2) |
| Warm/cool by sign of z | none | none | Rule out |
| Pulfrich shadow | none; bevel is symmetric | none | Rule out (general knowledge) |
| Comfort dial in [0, 1] | partial: `parallaxStrength` only (`:1167-1170`) | item 1 | Build |
| Dial lowers only | lean-in gain up to 1.6 (`:217`, `:951`); spin 0.5 (`:60`) | item 1 | Owner's call |
| Zero flicker | no parity term (`:878-923`, `:987-992`) | item 3 | Build as a test |
| Frame-time parallax | none | none | Rule out |

**For the LEAD:** I would sign "One owner dial in [0, 1] scales every motion and every intensity peak and can only lower them; the z = 0 plane never moves at any dial", and strike the lean-in gain above 1.0 (`EYE_GAIN_MAX = 1.8`, `FidelityEMatrix/EMatrix_Core.lua:52`, unreachable above 1.6 by `:217`), which the owner decides.

**Route:** Opus takes `ComfortScale`, the single pair(z) and the headless tests (items 1 to 3). Flash takes the four call sites, the `/fide` command for the dial, and the in-game check with dial 0 and spin 0. Argon takes a blind red-team of the zero-flicker claim, the z = 0 pair claim and the three rule-outs.
