# B2 Somatic and Comfort Guardian: what the entity is, for the body

Labels: **from the code** (read this session, file:line), **general knowledge**, **needs in-game verification**. Not in this checkout: the HeavyMetal2 repo, `hm:universe:v2`, `PLAN_FRACTAL.md`. Where Argon relies on them, I do not state their contents.

## Thesis

The entity is a fixed grid of 135 cells that opens and closes on one click, with overlays that move while the owner's eye moves. Its body is calm only if every motion is a dial the owner can lower, and nothing moves at rest. The code is not there yet. At rest the subject spins (EMatrix_Core.lua:60, :884-888). Eye gain rises to 1.8 on lean-in (:52, :145). A cell's flip lasts about 16 ms, not the 0.26 s its comment states (:59; EMatrix_Math.lua:93). The HUD's Strain gauge reads a constant 0.00 J (packages/wow-syntropic/Core.lua:104; UI.lua:76). Copies over a static world double once they move: 33, 20 and 8 px far, mid and near at the defaults (EMatrix_World.lua:197-198, 120 px at Core:74, eye capped at 0.5 at Core:61). I re-derived these by arithmetic. Frame-alternating stereo adds a motion the code cannot produce and cannot measure. What helps is a calm grid, capped by numbers, still at rest, with a strain dial that only goes down. What does not help: an alternating-frame 3D look, the Strain gauge as it stands, and the 60 px figure (B3 corrected it to 33 px).

## Q1 Identity: one cell, or the whole grid?

**Evidence.** The wave is one toggle for the whole grid (EMatrix_Core.lua:925-940); a click or `/fide wave` triggers it (:560-562, :998). Nothing is per cell except the flip state (:763-830). Each cell has a fixed orientation at birth (EMatrix_Math.lua:27-42).

**Ruling: rule B, for comfort.** The unit of comfort is the grid: one dial, one wave, one rest state. Per-cell dials would multiply the motion a viewer must absorb, and nothing measures them. Whether one cell is also one roster agent is the Architect's question, and it cannot be settled without `PLAN_FRACTAL.md`.

## Q2 Truthful binding (comfort side)

**Evidence.** The wave is driven by a click, not a number (Core:560-562). Spin is bound to nothing (Core:884-888). In `packages/wow-syntropic`, `fourFloats` is a literal table (Core.lua:37; UI.lua:73 falls back to the same literal). `strainJoules` is written only by a decrement floored at zero (Core.lua:104), so UI.lua:76 always shows 0.00 J. The repo already has the honest type: `notMeasured` (packages/triad-369/src/evidence.mjs:50-51).

**Ruling: rule A for every comfort dial.** Each dial must bind to a number the code measures, or to the owner's report. Spin fails: its default becomes 0, or it is removed. The Strain gauge fails: it must read `not_measured` until something measures strain. The flip passes once its units are fixed (Q4).

## Q3 Stereo versus comfort

**Evidence.**
- There is no frame alternation in the code. Anaglyph shows both eyes every frame (EMatrix_Core.lua:630-639). The world copies show both `left` and `right` each frame (EMatrix_World.lua:200-208). No parity term exists anywhere.
- Per-eye offset is `stereoPixels` (4, Core:65) times `ParallaxShift(1,z)/ParallaxShift(1,0.5)` (World:199). By arithmetic: far ±6.5 px, mid ±4.0, near ±1.6, so the two eyes' copies sit 13.1, 8.0 and 3.1 px apart. B3 wrote 6.6 for far; my figure is 6.5.
- Parallax at defaults: 33, 20 and 8 px (World:197-198). At `EYE_GAIN_MAX` 1.8 (Core:52) the far copy moves 58.9 px. Intensity rises on lean-in, which the rule "intensity only goes down" forbids unless the owner chose it.
- Frame alternation would move the copy each frame while the game's own pixels stay put. Argon's 1.75 px ghost threshold, 45 fps and 16.7 ms are Argon's figures, not checked; **needs in-game verification** on the owner's panel.

**Ruling: rule A. Continuous parallax (option a) is the default. Frame alternation (option b) is rejected, as default and as opt-in.** It adds motion, its amplitude would track frame time, and it cannot be bound to a number the owner sees. Three changes follow from the code:
1. Cap `EYE_GAIN_MAX` at 1.0 by default (Core:52). A lean-in above 1.0 is an owner dial, not automatic.
2. Spin default 0 (Core:60).
3. Gate, downward only, two measurements. **M1:** the 10-second p95 of `dt` in `OnUpdateDriver` (Core:760; `dt` already arrives as the argument). If p95 exceeds the owner's budget, the parallax gain drops. **M2:** the owner's strain dial, 0 to 1, saved in `FidelityEMatrix_Config` (Core:55-88), set by the owner, default 0 motion. Neither measurement may raise anything. The budget value is the owner's choice; the 45 fps figure is Argon's and needs in-game verification.

## Q4 Restorative dual

**Evidence.** No reverse wave exists. Closing reuses the same toggle (Core:940). The flip is about 16 ms, not 260 ms: `u = (waveAge*waveSpeed - ringDist)/flipDuration` (Math:93) with `waveSpeed` 16 (Core:58) and `flipDuration` 0.26 (Core:59), so one cell's `u` goes 0 to 1 in 0.26/16 s. The comment at Core:59 says seconds. `tools/test_ematrix_math.mjs:88-90` copies the same formula, so no test catches it. Worst-case wave finish is about 1.0 s: max ring 16.1 cells (Math:73-74), plus 0.26. **Needs in-game verification** of how a 16 ms squash looks at 60 fps (general knowledge: a sub-frame change reads as a jump or a flash). Rest is not still: `CheckIdleCondition` keeps `OnUpdate` alive while the world overlay runs (Core:910-913), and spin 0.5 turns the subject once every 12.6 s, 28.6 deg/s (Core:884-888).

**Ruling: rule B. Rest is still, with a partial aperture.** The window stays closed except where the owner's attention is, and "attention" must be a number (the eye, or the last click), not decoration. Build it in this order: fix the flip units so `flipDuration` is seconds, then add a rest timer that calls `TriggerScoreboardWave` to close only, not to toggle. Whether a full-open window reads as calm or as a plain screen **needs in-game verification**.

## Q5 Portability

**Evidence.** `hm:universe:v2` is not in this checkout. The comfort dials live in the addon's saved config (Core:55-88).

**Ruling: cannot be settled without the HeavyMetal2 repo.** From the comfort side, a cartridge may carry dial values only as caps. It may never raise a host's dial, and the owner's strain setting stays per viewer and is never shared.

## Proposed canonical definition (comfort)

The entity is a fixed, still grid of cells. It is calm at rest: nothing spins, nothing drifts, and its open window is partial and matches the owner's attention. Each motion it makes is a dial the owner can lower to zero, and each dial is bound to a number the host measures or to the owner's own report. A dial may only go down; no measurement, lean or default may raise it. Stereo is continuous, not alternating. The entity never claims depth it cannot draw, and it shows "not measured" where it has no number.

## Closing table

| Question | Ruling | Evidence | Confidence |
| :--- | :--- | :--- | :--- |
| Q1 Identity | Rule B: the grid is the comfort unit | Core:925-940; Math:27-42 | medium |
| Q2 Binding | Rule A for dials; spin and Strain fail today | Core:560-562, :884-888; wow-syntropic Core.lua:37, :104; UI.lua:76 | high (from the code) |
| Q3 Stereo | Rule A: continuous; no alternation; `EYE_GAIN_MAX` 1.0; spin 0 | Core:52, :60, :630-639; World:197-199 | high for the code; the ghost threshold needs in-game verification |
| Q4 Dual | Rule B: still at rest, partial aperture; fix flip units first | Core:58-59, :910-913, :940; Math:73-74, :93 | medium; the look needs in-game verification |
| Q5 Portability | Cannot be settled without HeavyMetal2 | not in this checkout | low |
| Flip duration | Fact from the code: about 16 ms, not 0.26 s | Math:93; Core:58-59; test_ematrix_math.mjs:88-90 | high (from the code); the visible effect needs in-game verification |
