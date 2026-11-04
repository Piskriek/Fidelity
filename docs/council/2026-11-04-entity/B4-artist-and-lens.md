# B4: Artist and Lens (definition round, 04 Nov 2026)

**Basis.** Code at VERSION 1.7.2 (`FidelityEMatrix/EMatrix_Core.lua:23`). "Computed" means I ran the generator's own functions in memory from `tools/gen_e_atlas.mjs`; nothing was written. `EMatrix_Math.lua` changed on disk during this round; the line numbers below are the current ones. HeavyMetal2 (`hm:universe:v2`, `PLAN_FRACTAL.md`) is not in this checkout. A sample `hm:universe:v2` block sits at `ARGON_OPUS_MASTER_RESUME_V3.md:44-57`; its grammar is not here, and I did not invent it.

## Thesis

From the lens, the entity is a 15 by 9 field of 135 bevelled E tiles, 32 px each, sharing one light and one wave clock (`EMatrix_Core.lua:27-32`, `:460-513`). Its geometry is mostly honest: the window's rim is lit from the upper right on every tile (`gen_e_atlas.mjs:218-220`), and the texel scale is consistent (4 texels per screen pixel). Its colour is not. The rainbow and the gold glint are baked, static and bound to no number, so Aq and Lx never reach a pixel. Its only motion is one click-triggered wavefront with no cause in the field, and its window is all-or-nothing, so no body remains around it. Until a measured number moves a colour and a measured event starts a wave, the box reads as a scoreboard with a pleasant surface, not as a being.

## At 32 px

- **Closed tile.** The E silhouette survives. Computed: luma SD 37.9 over 128 texels, 34.9 over 4x4 blocks. The fold creases are about 13 texels (about 3 screen px) wide (`gen_e_atlas.mjs:99-111`). Hand-drawn SDF boxes, not a Hilbert curve (`:87-97`).
- **Light.** The closed tile is lit from the upper left. The generator says so (`:123`, "top-left"). Computed: left-facing bevels receive key-light dot 0.78 against 0.19 for right-facing, and up-facing 0.85 against 0.12 for down-facing. The window rim, the housing strips and the walls say upper right (`gen_e_atlas.mjs:218-220`, `EMatrix_Core.lua:312-323`, `:442-455`). The one-sun rule is broken inside the closed tile.
- **Window.** A 1 px lit bevel (`gen:220`), scanlines with a 2 px period at alpha 18 (`:259`), a glint at alpha 22 (`:261`). Open cells use `lensAlpha` 0.35 (`EMatrix_Core.lua:62`, `:819`). Computed: the scanlines are about 2.5% effective and the glint about 3%. That frame-alpha multiplication holds in the client is **needs in-game verification**.

## Q1. Identity: one body, or 135 holons?

**Evidence.** The field is one master frame of 135 cells, each holding col, row, rotation, a texture and a ring distance, and no name (`EMatrix_Core.lua:473-483`). The only per-cell values are pure functions of position: the rotation hash (`EMatrix_Math.lua:39-40`) and the ring distance (`:55-77`). Per-entity visuals exist only in the world overlay, one copy per unit (`B3-perception.md`, cited there at `EMatrix_World.lua:186-222`).

**Ruling: cannot be settled without the Q2 binding.** A lattice that names no agent cannot draw agent identity without lying. Until cells carry measured state, draw one body of 135 tiles.

## Q2. Truthful binding of the live stream

**Evidence.**
- The flip is timing, not measurement. The only callers of the wave are a click and `/fide ripple` (`EMatrix_Core.lua:560`, `:562`, `:995-998`). Per-cell progress comes from age, ring and a fixed duration (`:776`; `EMatrix_Math.lua:94-97`, which now counts the flip in seconds). A wave from a corner takes about 1.3 s, computed.
- Aq (rainbow) comes from the surface normal alone (`gen_e_atlas.mjs:167-170`). Lx (gold glint) is a fixed highlight under the fixed light (`:158-164`, `:191-193`). Neither reads a variable. A search of `FidelityEMatrix/` finds no `Aq` or `Lx` float.
- The HUD's Four Floats are literal defaults (`packages/wow-syntropic/Core.lua:35-37`), read at `UI.lua:73` and `:88`. The triad side uses literals or formulas (`triad_mesh.mjs:120-123`, `density_bridge.mjs:118-121`). `evidence.mjs:48-51` already defines the labels `symbolic` and `not_measured`.

**Ruling: rule B for the present.** Remove the rainbow and glint, or draw them as symbolic and say so. A glint that never moves claims a precision nobody measured, which breaks "every visual traces to a number". The minimum truthful binding is one measured event (timestamp and origin) for the wave, and one measured scalar per colour, with its evidence label carried into the draw.

## Q3. Stereo versus comfort

**Evidence.** The built stereo is anaglyph and side-by-side, with fixed pixel offsets: plus or minus 4 px per eye, so 8 px relative, and the reticle plus or minus 5 px (`EMatrix_Core.lua:622-641`, `:716-719`). Every stereo mode forces a black backdrop (`:583-584`, `:672`). In stereo the subject takes no eye parallax ("mono only; stereo pairs stay centred", `:679`). No frame alternation, saccade or dither exists (`grep` finds none). The continuous eye from cursor or pad is smoothed (`:838-874`). Argon's 1.75 px and 45 FPS thresholds are not in the repo; I did not check them.

**Ruling: rule A for the default, option (a).** Continuous motion is what the code already does and it changes no pixel pattern per frame. Option (b) has no code, and the addon reads no frame time (`grep` for `GetFramerate` or frame timing finds none). General knowledge: frame-alternating disparity on an unshuttered panel produces crosstalk, and anaglyph channels leak too. Comfort in the box still needs **in-game verification**. Note that stereo and eye parallax are currently exclusive, so the depth cue never combines the two.

## Q4. Restorative dual (partial aperture)

**Evidence.** The state is global. `TriggerScoreboardWave` toggles one target and sets every cell's ring (`EMatrix_Core.lua:940-948`). A settled cell holds only that target (`:810-824`). A partial exists only in transit, while the front passes (`:773-829`). Closed means the E at full alpha over the whole field (`gen_e_atlas.mjs:202-209`, `EMatrix_Core.lua:497-499`), so nothing behind shows. Open means the window texture at 0.35 (`:819`), with a transparent middle (`gen:257-263`). No E remains, so there is no body.

**Ruling: cannot be settled without a per-cell target from Q2's binding.** A partial aperture needs two things the code lacks: a per-cell boolean, and the E kept at full alpha on the non-active tiles. Until then the honest state is the all-or-nothing toggle.

## Q5. Cross-host portability

**Evidence.** The field's visual state is about ten numbers: wave origin (2), wave age, target, open amount, and the eye (3). Each cell's rotation and ring are pure functions (`EMatrix_Math.lua:27-43`, `:55-77`, `:89-97`), and the eye is three floats (`EMatrix_Core.lua:136`). The cognitive side is not in the code. The shorthand grammar and its 4 KB limit are outside the checkout. The sample block (`ARGON_OPUS_MASTER_RESUME_V3.md:44-57`) has no visual field and no Four Floats key.

**Ruling: cannot be settled without the `hm:universe:v2` grammar.** For the field, the visual state fits easily, but only after Q2 binds the colours. Serialising an unbound rainbow would carry a lie across hosts.

## What reads as a being, and what reads as a television

**Evidence.** The box carries a monitor's furniture: a bezel housing (`EMatrix_Core.lua:312-325`), a glass sheen (`:523-527`, `:700-709`), inner walls (`:436-455`), and a subject turning at 0.5 rad/s on its own clock (`:60`, `:883-891`). The subject is the player's own model (`:364`), not an entity figure. The turn follows the eye with `FACING_TILT` 0.55 (`:46`, `:890`).

**Proposal.** General knowledge: motion that answers a cause reads as attention, and a constant rotation reads as a display. Needs in-game verification. At rest, set `spinSpeed` to 0 (the code allows it; `:60`), drop the glass sheen, start waves only on measured events, and keep the latent E at full alpha, lifting the lens only on engaged tiles.

## Proposed canonical definition (my words)

The entity, as drawn, is one field of 135 bevelled E tiles under one light and one wave clock. Closed, it is an opaque field of E shapes. Open, each tile is a thin-bezelled lens over whatever lies behind it. It has no drawn identity below the field until a measured number names a cell, and no drawn colour (rainbow, glint) until a measured number moves it. Its depth is the eye's parallax on fixed planes, and its stereo is a fixed pixel offset, not a claim about the scene.

## Closing table

| Question | Ruling | Evidence | Confidence |
| :--- | :--- | :--- | :--- |
| Q1 Identity | Cannot be settled without the Q2 binding; draw one body until then | `EMatrix_Core.lua:473-483`; `EMatrix_Math.lua:39-77` | High (code); the design choice is open |
| Q2 Binding | Rule B for colour now; one measured event for the wave | `EMatrix_Core.lua:560,776,995-998`; `gen_e_atlas.mjs:158-170`; `evidence.mjs:48-51` | High |
| Q3 Stereo vs comfort | Rule A: option (a) as default | `EMatrix_Core.lua:583-584,622-641,679,838-874` | Medium; comfort needs in-game verification |
| Q4 Restorative dual | Cannot be settled without a per-cell target (Q2) | `EMatrix_Core.lua:773-829,940-948,819` | High (code); design open |
| Q5 Portability | Cannot be settled without the `hm:universe:v2` grammar | `EMatrix_Math.lua:27-97`; `ARGON_OPUS_MASTER_RESUME_V3.md:44-57` | Medium |
| Being vs television | Motion must answer a cause; remove constant spin and glass | `EMatrix_Core.lua:46,60,312-325,523-527,883-891` | Low to medium; needs in-game verification |
