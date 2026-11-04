# O2: the glasses-free 3D and frame-alternating stereo (opposing council, round 2026-11-04-entity)

**Viewpoint:** opposer O2 (glasses-free 3D and frame-alternating stereo). **Labels:** [code] = read in this checkout, file:line. [general] = general knowledge, not checked here. [in-game] = needs in-game verification. ARGON-INPUT.md is the ask. The `hm:universe:v2` shorthand and `PLAN_FRACTAL.md` live in the HeavyMetal2 repo, which is not in this checkout; nothing below relies on their contents.

## Thesis

The entity's "3D right in front of the observer" is not on this path. [code] Every depth plane is a flat 2D frame shifted by `SetPoint` or texcoords (`FidelityEMatrix/EMatrix_Core.lua:4-12`, `:663` ApplyDepthPlanes). The only real stereo is red/cyan anaglyph, which needs glasses (`EMatrix_Core.lua:622-640`), or free-viewing side-by-side (`:607-615`); both show one model turned by about 3.4 degrees per eye (`:64`, `:890-895`), not a re-render. Nothing alternates frames: the grep for parity, alternation, refresh, frame counters, dither and saccade over `FidelityEMatrix/` returns no hits. So without glasses or a rendering-path change there is no 3D on a flat panel from this addon, and the default must be the no-flicker path: motion parallax from a moving eye, with no per-frame alternation. This follows round 1. `docs/council/2026-11-04/STEER.md` vector item 3 says "Depth has to come from the rendering path, not a sticker on top", and its forbidden list bans any "3D" claim until verified.

## Attacks, ranked by fatality

1. **No glasses-free 3D exists on this path (fatal to the claim).** [code] The planes are sibling frames: backplate z = 1, subject z = 0.5, lens grid z = 0, pop-out reticle z = -0.4 (`EMatrix_Core.lua:4-12`, `:43`). Each moves by `ParallaxShift(eye, z) * PX_GAIN` (`EMatrix_Math.lua:143-147`; `EMatrix_Core.lua:44`, `:663`). That is a few pixels of offset on a flat texture. Disparity between the anaglyph layers is from a facing turn, not a position offset (`:890-895`). [general] Motion parallax conveys depth order when the viewer's head moves; a cursor is not a head. Settled by: a cursor-only test with screenshots at rest and at the screen edge, and the owner's report of whether far layers slide against near ones. [in-game]

2. **Frame alternation is not built, so option (b) would be new code (fatal to Q3 option b as a default).** [code] The driver receives `dt` (`EMatrix_Core.lua:760`), so a frame-time read is possible, but no code reads a refresh rate or GetFramerate. Anaglyph shows both eyes on every frame (`:624-641`, `Show` on both layers). Per-frame alternation would mean toggling `sceneLeft` and `sceneRight` inside OnUpdate; that is new code, not a setting. [general] On a 60 Hz panel, frame-sequential gives each eye 30 Hz; without shutter glasses both images reach both eyes in turn, which reads as flicker and a double edge. Argon's "(-1)^frame", "60 Hz", "1.75 px" and "45 FPS" are not in this checkout (grep: only ARGON-INPUT.md:96-97). The gate "dt <= 16.7 ms" measures the addon's frame interval, not the panel's refresh. Settled by: [in-game] client frame time with `/run`, a panel refresh reading, and a flicker check at 30 Hz per eye.

3. **The anaglyph pair leaks and is a tint, not a filter (high).** [code] The left layer sits at -px and the right at +px (`:625-636`). The right layer is drawn at alpha `anaglyphMix` = 0.50 over the left (`:639`, `:66`). Colours are `SetLight` tints (`LIGHT_RED`, `LIGHT_CYAN`, `:213-214`, `:632`), so each eye gets a lit copy of the same model, not a channel-isolated image. Arithmetic: the offset between the two layers is 2 x `stereoPixels` = 8 px at defaults (`:65`). The black field is forced in every stereo mode (`:583-584`), so the live world is removed in the mode meant to show depth. Settled by: [in-game] a white bar on black through red/cyan glasses, each eye closed in turn, ghost brightness compared with the bar.

4. **Pulfrich and "negative temporal parallax" have no mechanism here (high for the claim).** [code] No per-eye delay or neutral density exists, and the driver has no temporal term. [general] Pulfrich needs a moving target and a luminance difference between the eyes. I cannot identify "negative temporal parallax" as an established term, so it cannot be built or checked as written. Settled by: Argon defining it in code terms.

5. **Chromostereopsis and the glint's depth are unmeasured (medium).** [code] The glint is a soft spot at alpha <= 22 toward the upper right of the aperture (`tools/gen_e_atlas.mjs:223`). No hue or luminance is measured, and nothing ties its position to a depth number. [general] Hue contrast at equal luminance can produce depth-like effects, varying by observer. This breaks Argon's "every visual traces to a number". Settled by: [in-game] observation only.

6. **Option (a)'s micro-saccade and dither do not exist (medium).** [code] Only the eye (cursor or pad) and the constant spin move the subject (`:60`, `:886-890`). The head tracker's depth is closer-only (`tools/headtrack/README.md:28-31`), so the `du(z,t)` term has no source.

7. **Argon's numbers have no source in this checkout (not checkable).** 60 Hz, 1.75 px, 45 FPS and 16.7 ms appear only in `docs/council/2026-11-04-entity/ARGON-INPUT.md:96-97`.

## Concessions

A window with a static bezel and a moving interior gives real motion parallax, if the eye moves. The lens grid stays at z = 0 (`EMatrix_Core.lua:4-10`), while backplate texcoords, wall widths and glass move with the eye (`:663` onward). That is the honest core. The minimal honest version:
- **Window:** static bezel, interior slides with the eye, labelled "motion parallax, no 3D claim", no frame alternation, default `parallaxStrength` unchanged.
- **Anaglyph:** opt-in, black field, labelled "needs red/cyan glasses; leaks; unverified".
- **Side-by-side:** opt-in, labelled "free-viewing; unverified".
- **Head-tracked eye:** opt-in through the gamepad path; depth is closer-only.
- **No** "3D", "pops out" or "stereo works" wording until the in-game checks above pass.

## Rulings per question

- **Q1 Identity.** Rule: the identity may be "a window with a moving interior", not "a 3D being". Evidence: the flat planes in attack 1. Settled by nothing in the code about "being".
- **Q2 Truthful binding.** The one real depth binding is eye to `ParallaxShift` to offset (`EMatrix_Math.lua:143`; `EMatrix_Core.lua:663`). The eye is a real input only when the cursor or pad is read (driver step 3, `:760`). Rule A for the shift; no binding exists for "3D". The flip, colour and glint are unbound to any number (O1's lens).
- **Q3 Stereo versus comfort.** Rule B. Default (a), using the motion parallax the code has, without any saccade claim. Reject (b) as default: no refresh read exists, and flicker is [general]. Cannot be settled without in-game frame time and panel refresh.
- **Q4 Restorative dual.** Cannot be settled without in-game. From this viewpoint a flip is a texture swap (`ShowFace`, `:263`; open state, `:817`), so no depth claim should attach to flip state.
- **Q5 Portability.** Cannot be settled: `hm:universe:v2` is not in this checkout. Depth settings (eye gain, plane depths, stereo mode) depend on the client's draw path, so they must not be serialized as a 3D state.

## What the definition may NOT claim

- Glasses-free 3D, anything "in front of the monitor", or any 3D from a flat panel without glasses or a rendering-path change.
- Frame-alternating stereo or "(-1)^frame" as a default, or any flicker-free claim for it.
- Pulfrich, chromostereopsis or "negative temporal parallax" as effects the addon produces.
- "Every visual traces to a number" for the glint, the flip or the colour.
- The 60 Hz, 1.75 px, 45 FPS or 16.7 ms thresholds as checked.
- That the holon's state, shorthand or Hilbert layout carries depth.

## Closing table

| Question | Ruling | Evidence | Confidence |
| :--- | :--- | :--- | :--- |
| Glasses-free 3D (thesis) | Not on this path | `EMatrix_Core.lua:4-12, 663`; `EMatrix_Math.lua:143-147`; `:622-640` | High (code); visual effect [in-game] |
| Frame alternation | Not built; not the default | no parity code; `:624-641`; `:760` | High (code); flicker [general] + [in-game] |
| Anaglyph | Opt-in, leaks, black field | `:583-584`, `:625-639`, `:213-214` | Medium; [in-game] |
| Pulfrich / temporal | Not in the definition | no temporal term in driver | High (code absence) |
| Chromostereopsis / glint | Observation only, no number | `tools/gen_e_atlas.mjs:223` | Medium |
| Q1 Identity | "A window with a moving interior" | `EMatrix_Core.lua:4-12` | Medium |
| Q2 Binding | Rule A for shift; none for 3D | `EMatrix_Math.lua:143`; driver step 3 | High |
| Q3 Stereo vs comfort | Rule B: default (a), reject (b) | no refresh read; attack 2 | Medium; [in-game] |
| Q4 Restorative dual | Cannot be settled without in-game | `EMatrix_Core.lua:263, 817` | Low |
| Q5 Portability | Cannot be settled | HeavyMetal2 repo absent | Low |

