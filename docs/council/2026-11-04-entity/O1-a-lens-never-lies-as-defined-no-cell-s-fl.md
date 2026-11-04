# O1: A lens never lies, as defined no cell's flip, colour or glint is bound to a real changing number

Council round 2026-11-04-entity, voice O1 (opposer). Read-only on the code. Labels: "from the code" means file:line read in this session; "needs in-game verification"; "general knowledge".

## Thesis

As defined, the entity fails its own first rule. The flip is bound to a mouse click and the ring distance from it (Core.lua:543-570, 924-953). The iridescent rainbow is baked into a texture from surface normals and never changes at runtime (tools/gen_e_atlas.mjs:166-167). The gold glint is a fixed colour (Core.lua:507) whose only moving term is the timing curve of a flip (EMatrix_Math.lua:115-117). The HUD's four-float vector carries Lx = 0.95 and Aq = 0.20 as literals that nothing writes (packages/wow-syntropic/Core.lua:37; UI.lua:88). No cell holds a value. The entity is decoration until each cell names one real number, its source and its evidence kind, and draws a neutral "not measured" state when that number is absent.

## Inventory: what EMatrix_Core.lua draws and what drives it today

| Element | Driver today | Where (from the code) |
| :--- | :--- | :--- |
| 135 closed E cells | fixed texture; orientation a hash of (col, row) at birth | Math.lua:27-43; Core.lua:497-498 |
| Flip height squash | wave age minus ring distance from the click | Math.lua:89-97; Core.lua:785 |
| Glint bar (specBar) | sin² of flip progress, fixed colour | Math.lua:115-117; Core.lua:507 |
| Crevice | sin of flip progress | Math.lua:119-120 |
| Open-state lens alpha | saved setting `lensAlpha` 0.35 | Core.lua:62 |
| Lens bevel, scanlines, lens glint | static texture | gen_e_atlas.mjs:251-261 |
| Open/closed target | one global boolean, toggled per click | Core.lua:940 |
| Backplate nebula | cursor eye through ParallaxShift | Core.lua:672-677 |
| Walls, sheen, reticle | cursor eye times openAmount | Core.lua:687-727 |
| Subject (player model) | constant clock `spinSpeed` 0.5 rad/s plus the eye | Core.lua:60, 885 |
| Housing strips | fixed colours | Core.lua:322-325 |
| World copies, terrain props | nameplate band, UnitPosition (player), map placements, eye | World.lua:131-141; Terrain.lua:161-163 |
| Rainbow phase | no runtime number; normal-angle ramp baked into the texture | gen_e_atlas.mjs:166-168 |
| Gold precision (Lx) | no number; not found in either addon | none |

The "attention" that Argon attaches to the flip is the user's click. The cursor is a real number, but it is the viewer's, not the entity's.

## Ranked attacks

1. **The rainbow and the gold glint have no number behind them (fatal).** The rainbow phase is computed from the normal vector alone (gen_e_atlas.mjs:167), so it is static. The gold colours are fixed (Core.lua:322-325, 507), and the window glint alpha is a constant 22 (gen_e_atlas.mjs:261). The only moving specular term is sin²(u·π) (Math.lua:115-117), which is flip timing, not precision. No line in packages/wow-syntropic writes `fourFloats` (grep), so the S line printed at UI.lua:88 is constant. Check that settles it: from the code, a screenshot taken before and after a change of any real state should differ in the rainbow or the glint. The code leaves nothing to vary (in-game rendering: needs in-game verification).

2. **No cell carries a value; 135 cells are one click (fatal).** A cell's inputs are its ringDist from the click origin (Core.lua:945), the global target boolean (Core.lua:940), and a constant hash (Math.lua:39-42). Nothing per cell reads state. Check: bind one cell to one real number and confirm that only that cell changes when the number does.

3. **The HUD lies in the Fidelity WoW addon (serious).** `coherence` is set to 0.99 (wow-syntropic/Core.lua:35), never written, and UI.lua:68 and :76 print it as "Coherence: 99%" on every tick. `strainJoules` starts at 0 (Core.lua:38) and is only ever decremented (Core.lua:104), so "Strain 0.00 J" is structurally constant. The FTLE (Kinematics.lua:74) and entropy (SomaticFlow.lua:130) are real computations. Check: `grep -rn "coherence\|strainJoules" packages/wow-syntropic` lists the writes above. The player-visible effect: needs in-game verification.

4. **Attention and restoration have no signal (serious).** Argon's Fold 4 needs ΔL ≤ 0 and a calm reverse wave. A grep for loss, gradient, precision, Fisher and curvature across FidelityEMatrix and wow-syntropic finds no number, only texture names and a time helper. The close is the same click toggle (Core.lua:940), not a test of error resolution. Check: impossible until a per-cell error value exists.

5. **The real numbers sit on the overlay, not on the cells (moderate).** The inputs are the cursor (Core.lua:851-871), UnitPosition for the player (Terrain.lua:161-163) and CheckInteractDistance bands for units (World.lua:131-141; the header puts them at about 10 and 28 yd, needs in-game verification). Sizes use nominal band centres of 7, 18 and 45 yd (World.lua:39-44). These are the most truthful bindings in the repo, and they drive copies that slide against their real twins (docs/council/2026-11-04/B3-perception.md, cue 1).

6. **The two hosts share no channel (moderate).** Nothing in FidelityEMatrix refers to FidelityWoW_Telemetry (grep). The FidelityWoW export is gated by `optIn` (wow-syntropic/Core.lua:80). The Fidelity or Holodeck cell code and `hm:universe:v2` are not in this checkout, and I found no Hilbert or holon code in either addon. A "same cell in two hosts" claim cannot be checked here.

7. **The subject is a clock (minor).** It turns at `spinSpeed` plus the eye (Core.lua:60, 885). Nothing from the entity drives it. Its "gate u" is the click wave.

## Concessions (what is truthfully bound)

- The cursor drives the eye, and the eye drives the backplate, walls, sheen and reticle. That is truthful as the viewer's eye, not as the entity.
- The flip's timing and ring distance are a true function of a true click. That is truthful as input response.
- The copies' bands and the player's UnitPosition are read each scan (World.lua:131-141; Terrain.lua:161-163); alignment needs in-game verification.
- The closed texture's rainbow is a deterministic material from geometry: honest as a material, not as a number.
- FTLE and entropy are real and written each tick. Only coherence and strain are not.
- Minimum honest version: one row per cell with a cell id, a named source, a value in [0, 1], an age, and an evidence kind. `measured`, `symbolic` and `not_measured` already exist in packages/triad-369/src/evidence.mjs. A cell draws its flip and glint from that value. A `not_measured` cell draws the closed E at a fixed neutral state with no glint. The smallest first binding: one cell, one source (FTLE, written each tick), one shared global channel (general knowledge: it works only if both addons load), and one before-and-after screenshot pair.

## Rulings on Argon's five questions

**Q1 identity: cannot be settled without a named per-cell source.** Option A has one real quantity per nameplate unit (the band) and none per cell. Option B has none.

**Q2 truthful binding: rule A.** Rule A: a visual changes only when a named, measured value changes; otherwise it is fixed and labelled. Today Lx, Aq and coherence fail rule A (attacks 1 and 3).

**Q3 stereo versus comfort: cannot be settled from the lens.** The disparity values are constants: `stereoMode` defaults to "off" (Core.lua:57), and the pixel and turn values are saved settings, not measurements. Comfort is O2's question. Cannot be settled without P6 (needs in-game verification).

**Q4 restorative dual: cannot be settled; no restorative close until a per-cell error value exists.** The close is the toggle at Core.lua:940. It fires on every click and never on ΔL ≤ 0.

**Q5 portability: cannot be settled from this checkout.** `hm:universe:v2` and HeavyMetal2 are absent. A shorthand can carry only what both hosts read, and today that is the key names of S, with two literal values.

## The definition may NOT claim

- That any cell's flip, colour or glint reports the world or the entity.
- That the rainbow is curvature, that the gold is precision, or that Lx and Aq are measured.
- That "Coherence 99%" or "Strain 0.00 J" are readings.
- That the flip is attention, or that the close is restoration.
- That the copies are 3D or synced (B3, O1 in round 1).
- That the HUD carries only four floats: it also shows coherence, strain, FTLE, entropy and the rung.

## Closing table

| Question | Ruling | Evidence | Confidence |
| :--- | :--- | :--- | :--- |
| Q1 identity | cannot be settled without a named per-cell source | Core.lua:497-498; World.lua:131-141; no per-cell input in the code | high (code) |
| Q2 truthful binding | rule A: fixed unless a named measured value moves; "not measured" draws neutral | Math.lua:27-43; Core.lua:940; wow-syntropic/Core.lua:37 | high (code) |
| Q3 stereo versus comfort | cannot be settled without P6 | Core.lua:57; docs/council/2026-11-04/B3-perception.md P6 | medium; needs in-game verification |
| Q4 restorative dual | cannot be settled; no close on ΔL until a per-cell error value exists | Core.lua:940 | high (code) |
| Q5 portability | cannot be settled from this checkout | no FidelityWoW_Telemetry reference in FidelityEMatrix; HeavyMetal2 absent | high for absence; the HeavyMetal2 contents are unknown |
