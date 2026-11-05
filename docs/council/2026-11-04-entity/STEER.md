# STEER: council round 2026-11-04-entity, the Council Synthesis (Shape B)

Written 04:40Z by the director (Claude in the cloud). Eight voices reported: B1 Architect, B2 Somatic and Comfort Guardian, B3 Simicist and Physics, B4 Artist and Lens, B5 Host-Bridge Engineer; O1 (a lens never lies), O2 (glasses-free 3D), O3 (the Hilbert story and the fifth metric). Every claim that steers below was re-checked by the director against the code or by a small computation; the three computations the director ran (the Hilbert curves, the flip clock, the HUD's constants) agreed with the voices. The ASK is `ARGON-INPUT.md`; the owner's framing: "first get the council to tell us what they are, then we can explore what it can do."

## 1. Where the viewpoints agreed, and where they clashed

**Agreed by all eight, each from its own evidence:**
- **No cell is bound to any measured number.** A cell's inputs are its grid position (a fixed hash picks its orientation), the ring distance from the clicked cell, and one global open/closed boolean. The wave is a click or `/fide ripple` plus a clock. (`EMatrix_Core.lua` 543-562, 940, 998; `EMatrix_Math.lua` 27-43, 55-77, 89-97.)
- **The rainbow and the gold are baked textures.** The rainbow is a ramp over the surface normal, written once (`tools/gen_e_atlas.mjs` 147-170); the gold colours are constants; the only moving specular term is the flip's own timing curve. Neither `Lx` nor `Aq` appears in `FidelityEMatrix/`.
- **The WoW HUD's four floats are literals.** `S = (0.20, 0.50, 0.95, 0.20)` is set once (`packages/wow-syntropic/Core.lua:37`) and never written; coherence 0.99 is a literal (`:35`); strain only ever decrements from 0 (`:104`), so "0.00 J" is structural. Director-verified by grep: nothing writes `fourFloats`. The measured values on that HUD are Shannon entropy (opt-in) and a movement-based divergence heuristic labelled FTLE.
- **The Hilbert story is wrong, and the parts worth keeping are real.** An order-2 Hilbert curve on 4x4 is a U of four U's whose silhouette is the full square; a sequence folded twice is an S zigzag; the E is a hand-placed signed-distance letter (spine plus three bars, `gen_e_atlas.mjs` 78-116). Director-verified by drawing all three. Kept: the four true rotations (`ROT_UV8`, cross product +1), the exact 1 then 8 cascade, Euclidean fronts from ring 3 (ring 2 is a half-blend, not a circle), and locality-preserving folding as a goal, not a fact.
- **The gate `u` is a clock, not a function of `Lx` and `Aq`**, so Argon's Fold 3 as written breaks the Four-Float rule it cites: `u`, `E_psi`, `Pi`, `theta`, `V` and `delta-L` are additional carriers with no code. The Triad host's own `Vtx` is a sine of the tick and `Pxd` a constant plus an octave term, unlabelled; `Lx` is the one real term (0.50 + 0.495 x flow integrity); `Aq` is gated on a hard-coded `true` (`triad_369_process.mjs` 215, 231-235).
- **No frame alternation exists**, and none can be built as a setting: anaglyph shows both eyes every frame, the addon reads no panel refresh, and `dt` measures the addon's frame interval. Option (a), continuous parallax from a moving eye, is the only honest default. Argon's 60 Hz, 1.75 px, 45 FPS and 16.7 ms figures appear nowhere but in the ASK.
- **The restorative dual is a toggle** (`waveTargetState = not waveTargetState`, `EMatrix_Core.lua:940`). No `delta-L`, no `V`, no per-cell target exists, so partial aperture and annealing cannot be built until a per-cell measure does. B3's honest partial rule, if the owner wants one now: a stopping radius `target_i = (ringDist_i <= R)`, one stated parameter.
- **Portability cannot be settled here.** `hm:universe:v2`, `@hm/shorthand` and `PLAN_FRACTAL.md` live in HeavyMetal2, not in this checkout. The visual state is about ten numbers (origin, age, target, eye, settings) and derives every cell; it fits in well under 0.5 KB. Per-cell four floats would be a fifth structure and are not recommended. The cognitive state has no representation anywhere in this repo.

**Clashes, and what decided each:**
- *Frame alternation as an opt-in.* B2 rejects it even as opt-in; O2, B4 and B5 reject it as a default and call it unbuildable. Decision: it is not in the definition. If the owner ever wants it, it is new code gated by two measurements B2 named (M1, the 10 s p95 of `dt`; M2, the owner's own strain dial), both of which may only lower a gain.
- *Lean-in gain and constant spin.* B1, B2 and B4 flag `EYE_GAIN_MAX = 1.8` (leaning in raises parallax, against "intensity only goes down") and `spinSpeed = 0.5` (a clock that nothing drives; B4: constant rotation reads as a display). O1 counts the cursor as the viewer's number, which it is. Decision: adopt B2's caps as the next defaults, flagged for the owner because they change the look: gain cap 1.0 (the owner raises it by a dial), spin 0.
- *The first binding.* B1 proposes six flow-driven blocks of cells; B5 proposes eight WoW cells for the actor slots and six Triad cells for the flows; O1 proposes one cell, one source. Decision: all three agree on the schema (cell id, named source, value in [0, 1], age, evidence kind using the repo's `measured | symbolic | not_measured`); the first binding is the smallest that spans both hosts: in WoW the eight actor slots (open when the token exists and the range check answers), in the Triad the six flows (open when `active` and fresh). The other cells read "no source" and stay closed with no glint. There is no channel from the holon into the WoW addon today (O1 attack 6), so the Triad binding needs the SavedVariables or hands channel B2-round-1 ranked fifth.
- *The light.* B4 found the closed E tiles lit from the upper left (`gen_e_atlas.mjs:123-126`) while the lens rim, housing and walls are lit from the upper right. Director-verified. The fix is not a sign flip: closed cells are rotated, so the baked light turns with them. Decision: an atlas of four pre-rotated E's each lit from the upper right (this merges round 1's B1 proposal 3), chosen per cell by quadrant coordinates instead of rotation.
- *The harness.* B3 found that fengari's integers are 32-bit, so the v1.7.2 hash test checked wrapped numbers, not the game's. The director's v1.7.2 comment claiming agreement was wrong. Fixed in this round: the hash computes in doubles on both sides and the test asserts the game's 33/33/33/36.

## 2. Recommended canonical definition of the Weight-and-Gradient Entity

**Flagged for the owner's sign-off before it enters `PLAN_FRACTAL.md` (HeavyMetal2; not in this checkout).** Each framing is labelled by its viewpoint.

> **What it is now (all viewpoints).** A fixed field of 15 by 9 bevelled E tiles under one light, with one wave clock and one global four-float reading. Each tile has a fixed orientation, a seed and not a state, and an open or closed face. The wave is a transition that shows where a request began; it carries no information the host did not supply. Its depth is the viewer's eye moving fixed planes; its stereo is an opt-in fixed offset that needs red/cyan glasses.
>
> **What it becomes when bound (Architect, Host-Bridge, the lens).** Each tile carries one named source, a value in [0, 1], an age and an evidence kind (`measured`, `symbolic`, `not_measured`). A tile opens only when its source says so; a tile with no source stays closed and reads "no source", without a glint. The first bindings are the Triad's six flows on six tiles and the eight nameplate actors on eight tiles. That is Option A's first honest form: a cell is an agent only when a named agent drives it.
>
> **What it may claim (physics, artist).** 135 tiles; four true rotations; the exact 1 then 8 cascade, Euclidean from ring 3; a click-born wave with a flip that lasts its stated seconds; the eye's parallax on fixed planes; a locality-preserving fold as the design goal of the lattice.
>
> **What it may not claim (every opposer, conceded by every builder).** A Hilbert curve; weights or gradients in the tiles; a rainbow that is curvature or a glint that is precision; a gate derived from `Lx` and `Aq`; per-cell four floats; a measured `S`, coherence or strain in the WoW HUD; glasses-free 3D, anything "in front of the monitor", Pulfrich, chromostereopsis or temporal parallax; a restorative dual; portability through `hm:universe:v2`.
>
> **The comfort law (Somatic Guardian).** Nothing moves at rest. Every motion is a dial the owner can lower to zero, bound to a number the host measures or to the owner's own report. No lean, measurement or default may raise a dial. Stereo is continuous, never alternating.

## Vector

1. **Bind before you decorate.** The next engineering on the window is the per-cell binding schema and the "no source" state, not more texture. Until it exists, the colour stays labelled symbolic.
2. **One sun, four orientations.** The E atlas with four pre-lit orientations replaces per-cell rotation of a single lit tile. Then round 1's fractal list continues (warped nebula, jitter, the second star layer).
3. **Calm by default.** Spin 0, gain cap 1.0, flips that last their stated seconds (landed), the flip and the wave started by a measured event or a click that is named as one. Frame alternation stays out.
4. **The holon's floats get labels or go.** `Vtx` and `Pxd` are marked symbolic where they are clocks; `Aq`'s hard-coded gate becomes `not_evaluated`; the WoW HUD prints "seed" beside any literal until a writer exists. This joins round 1's O2 list.
5. **"What it can do" is the next round**, as the owner said: only after the owner signs the definition. Its ASK: given the bound entity, which bridges does it make possible (the holon's flows on tiles, the actors on tiles, the eye), and which does it rule out.

## First step

Landed in this round (v1.7.3, tested, pushed):
- **The flip clock in seconds** (B2's finding): `CalculateFlipProgress` now gives a cell `flipDuration` seconds after the front reaches it; the old form gave 16 ms, one frame, so the squash animation had never been visible. Driven from the real Lua in both harnesses.
- **The harness computes the game's numbers** (B3's finding): float literals in the hash, a double-model reference in the test, the 33/33/33/36 distribution asserted.
- The round itself: `ARGON-INPUT.md`, eight reports, this synthesis, `LANDED.md`.

## Forbidden until verified

- Entering the definition into `PLAN_FRACTAL.md` or any plan before the owner signs it.
- Any wording of "weights", "gradients", "Hilbert", "precision", "3D" or "synced" for the window or the overlays in RESUME, the login line or a commit message.
- Frame alternation in any form; changing the overlay defaults (round 1's rule still stands); per-cell four floats.
- Quoting the HUD's `S`, coherence 0.99 or strain 0.00 J as readings.

## The check that settles it

1. The owner reads section 2 and says sign, change or no. That turns `LANDED.md` from `pending` to `used`, `changed` or `nofit`.
2. In the game on v1.7.3: open the box (`/fide box show`, click) and say whether each cell now visibly squashes and flashes as the wave passes (the 0.26 s flip), and whether the E wall shows one orientation per diagonal (it must not; that was v1.6.1) and which direction the light comes from on closed tiles (expected: upper left on unrotated tiles today, which is the known defect the atlas fixes).
3. Flash measures the two numbers Q3 needs: the 10 s p95 of frame time with the overlays on, and the screen's size and viewing distance, and pastes them with B3-round-1's P6.
4. Argon rewrites the proposal against section 2 or argues a clause back with evidence; either answer lands here.

## 3. Wave-1 build split by role

| Role | Builds | Done when |
| :--- | :--- | :--- |
| **Opus** (lead) | The per-cell binding schema in `EMatrix_Core.lua` (`ns.BindCell(id, source, value, age, kind)`), the "no source" neutral draw, the login line that counts bound cells; the owner's sign-off recorded in `LANDED.md`, then the definition handed to HeavyMetal2 for `PLAN_FRACTAL.md` | headless tests show a bound cell opening on a fresh source and closing on a stale one; the owner's word in `LANDED.md` |
| **Argon** (overwatch) | The proposal rewritten to section 2: the E as a letter with a locality goal, the Four-Float mapping as stated functions of `S` only or dropped, "attention" defined as a named event, Q4's partial-aperture rule (the stopping radius) decided with the owner | a revised `ARGON-INPUT-v2.md` in the next round's folder, every clause labelled by viewpoint |
| **Flash** (execution, laptop) | Deploy v1.7.3 (the four commands in RESUME §"EMatrix v1.7.1"); run round 1's P0 to P6 and this round's check 2; measure frame time p95 and screen geometry; paste `/fide terrain probe`; H007's daemon inventory; try `/fide world frame dressup` against `player` | the pastes in `laptop_results.json` or in chat, with the numbers beside the predictions |
| **Codex** (toolchain) | The E atlas with four pre-lit orientations in `tools/gen_e_atlas.mjs` and quadrant texcoords in `EMatrix_Core.lua`; spin 0 and gain cap 1.0 as defaults behind an owner dial; the `symbolic` and `seed` labels on the holon's and the HUD's floats; luacheck with the WoW globals; the Triad-to-WoW channel for the six flows (SavedVariables import or the hands file) | `npm test` green with the new atlas test (each quadrant lit from the upper right, by computed bevel dot products), the labels visible in `triad -- status` and the HUD |
