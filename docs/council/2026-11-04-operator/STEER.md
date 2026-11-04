# STEER: council round 2026-11-04-operator, Argon's operator T(W, g, s), returned in Shape B

Written 06:26Z by the director (Claude in the cloud). Input: the owner's paste of Argon's steering vector (`ARGON-INPUT.md`, verbatim, relayed 06:07Z; the Triad relay returned it unchanged). Six voices: B1 the kernel, B2 truthful wiring on both hosts, B3 the comfort contract; O1 no gradient exists, O2 the named hosts are not here, O3 a second definition. Every claim used below was re-checked against the code; where a claim was landed as a fix, the fix has a test. Argon's mode (a non-coercive prior; no clamping of a genuine engineering objection; final rulings flagged for the owner) was applied as written: the objections below stand because the code bears them out, and every ruling marked **owner** waits for the owner's word.

## REPORT: the math contract the council agrees on, and where it pushed back

**What the code already has, which all six voices sign.**
- **The metric is Argon's, term for term.** `CalculateRingDistance` (`EMatrix_Math.lua:57`) is `(1 - w) * cheb + w * euclid` with `w = clamp((cheb - 1) / 2, 0, 1)`: 1 cell at ring 0, 8 at ring 1, 16 at Chebyshev 2 between the two metrics, 110 Euclidean from Chebyshev 3 (counted on the 15 x 9 grid from (8, 5); asserted against the Lua).
- **R is fixed at birth.** `GetCellRotation` (`EMatrix_Math.lua:27`) hashes the cell's position; nothing ever rewrites it. `dW/dt = 0` holds in the only form the code can give it: there is no W, and R never changes (O2 attack 2, B1).
- **u is a clock in seconds.** `CalculateFlipProgress` (`:91`); the squash `|cos(pi u)|` and the glint `sin^2(pi u)` (`:110`) are timing terms of the flip, not precision or flux (O1 attack 5).
- **The zero plane holds by arithmetic.** `ParallaxShift(eye, 0) = eye * 0 / 1 = 0` (`:149`); the World's pair `px * PS(1, z) / PS(1, 0.5)` is 0 at z = 0 (`EMatrix_World.lua:213`). The grid itself is never passed to the planes (B3). The Core's reticle pair is a constant `stereoPixels + 1`, not a function of z (B3 rank 2, O3 conflict 6): a disagreement inside one device, the owner's call to unify.
- **The gate is the registry's rule.** A cell is open only while its record is fresh (`0 <= age <= window`), measured, and its label is at least 0.5 (`EMatrix_Core.lua` section 0a, v1.7.6). The owner's v1.7.4 screen showed seven measured bands opening under exactly that rule.

**Where the council pushed back, each verified against the code.**
1. **No gradient exists** (O1 attack 1, O3 conflict 1, B1, B2, O2 attack 3). No file in `FidelityEMatrix/` or `packages/triad-369/src/` holds a weight block, a loss, a gradient, Pi, D_KL or E_psi; the only "loss" is the packet-loss constant `rawLoss` (`density_bridge.mjs:128`). So `Lx = tanh(alpha ||g||)` and the `acos` phase of `Aq` have no input, and the vector's alpha, k_film, Pi, Pi_0 and the aperture threshold are five new constants against its own "zero new floats" (O1 attack 7).
2. **The Four Floats are seeds, and their names collide** (O1 attack 2, O3 conflict 2, B2's table, O2 attacks 1 and 7). `Vtx = 0.50 + sin(tick * 0.1) * 0.05` is a clock; `Pxd = 0.35 - rawLoss` moves with Sol's liveness; `Lx` is a coherence function; `Aq` is an availability tier gated by defaults of 12/13 and a literal `passed: true` (`density_bridge.mjs:111-135`, `triad_369_process.mjs:215, 231-234`). Three formulas per name across the density bridge, the Apex and the WoW HUD. Binding W to Vtx and Pxd would break invariant 1 at the first tick (O2 attack 1). Round 2's definition already forbids per-cell four floats.
3. **The aperture opens on a label, not on flux** (O3 conflict 3). The value beside a source is `BAND_VALUE` (near 1.0, mid 0.5, far 0.2); "flux plus resonance exceed threshold" has neither input, and adopting it would close the seven cells the owner saw open.
4. **Nothing anneals** (O1 attack 3, O3 conflict 4). A strike flips one global target and the cells settle where they are sent; the driver detaches at idle. Invariant 4 as written names `E_psi` (absent) and a decay the code lacks. Reworded (B1, O1's concession): `V = sum |aperture - target|` never rises with no steering and no new strike, falls while any cell is mid-flip, and is 0 by `maxRing / speed + flipDuration`.
5. **Invariant 3** (B1, O1 attack 6, O2 attack 6). `D_KL(Pi || Pi_0)` needs distributions; none exist: struck. "0 NaNs" was false in the code: `CalculateFlipProgress` returned NaN for a NaN age, slipping through both clamps. Fixed (v1.7.7, tested). `ParallaxShift` coerces bad input to 0, so a NaN test on it passes vacuously; the kernel instead rejects a non-finite `dt` or steering component and reports it, leaving the state untouched.
6. **The named hosts are not here** (O2, B2, O1 attack 8). `apps/universe`, `bridge/roster`, `@hm/sq-jepa`, `@hm/shorthand` and `hm:universe:v2` have no source in this checkout; the cartridge is one literal line whose CRC32 matches none of four framings O2 computed; the client is Burning Crusade Classic 2.5.6, not Retail, and "Midnight 12.x combat-secret rules" describe a client we do not run (the fallback manifest does list `120107` first; which numbers the 2.5.6 loader honours needs in-game verification). The only "cast seed" is the FidelityWoW addon's opt-in combat-log path, unverified on 2.5.6.
7. **The comfort contract is mostly absent from the code** (B3). The dial is partial (`parallaxStrength` scales the eye only; spin defaults to 0.5; the stereo pair, the glint and the sheen are ungated); the lean-in gain reaches 1.6 (`EYE_GAIN_MAX` 1.8 is unreachable), against "intensity only goes down"; no colour depends on the sign of z; no Pulfrich term (the bevel is one texture for both eyes); no frame-time term; nothing is drawn alternately, so flicker has no term to test but can be asserted as "no writes after settle" in the harness.
8. **"1 cell = 1 holon" fails at the index** (O3 conflict 5). Slot i is cell i, by screen position; a nameplate token can be reassigned (round 4). Identity needs a key, not an index.
9. **A self-stamp is "measured"** (O2 attack 5). `fileEvidence` labels any file `measured`, including one whose `at` the writer stamped itself. Routed to Argon and Opus; not changed this round.

**The contract.** `stepLightBeingLattice(state, sVec, dt)` in `packages/triad-369/src/light_being_kernel.mjs`: `makeLattice({cols, rows, waveSpeed, flipDuration})` builds cells `{index, col, row, R, ring, inWave, u, from, target, open}`; `strike(state, {col, row}, {radius, open})` is the click-born wave (radius Infinity is the addon's whole-box toggle; a bad origin or radius is rejected); `stepLightBeingLattice` advances the clock only while a wave runs (so the age never overflows), sets `u` per cell from the flip clock and the aperture `from + (target - from) * u`, clamps the steering to the unit disc and records it (it drives nothing: no source emits one), and returns `{state, rejected, floats}` where every Four Float is labelled evidence (`Pxd` symbolic: the lattice size; `Vtx` symbolic: the wave clock; `Lx`, `Aq` not_measured: no gradient source). `relaxation(state)` is V. `alignment(sVec, R)` is pure geometry (w at angle `R * pi / 2`), exported and tested, unused. Every formula mirrors `EMatrix_Math.lua` and the test drives the Lua through fengari to prove it.

## LEAD

```
            the owner's eye: hand:cursor today; the head once the pad carries an age
                     | s  (clamped to |s| <= 1, recorded; drives nothing until a source emits it)
                     v
  +---------------------- Light Being lattice, 15 x 9 -----------------------+
  | cell (col, row):  R = hash(col, row)              fixed at birth          |
  |                   ring = d(cell, strike)           1 -> 8 -> circular     |
  |                   u = clip((age - ring/speed) / dur)   a clock, seconds   |
  |                   aperture = from + (target - from) * u                   |
  | strike(origin, radius, open): the click-born wave; it settles, no anneal  |
  | V = sum |aperture - target|: never rises, 0 after maxRing/speed + dur     |
  +-------------------+-------------------------------------+-----------------+
                      | the registry, per cell               | the planes, by z
                      v                                       v
   source: name, label in [0,1], at, kind, window     shift = eye * z / (1 + z)   (0 at z = 0)
   open iff 0 <= age <= window, measured, label >= 0.5 pair = px * PS(1,z)/PS(1,0.5) (0 at z = 0)
                      ^                                       ^
   WoW 2.5.6: eight range bands (measured), the click (an input)   one dial in [0,1], lowers only
   Fidelity: F23, F32 as an aging snapshot at /reload (after time() is verified); F31 symbolic
   not here: W, g = grad L, Pi, E_psi, hm:universe:v2, apps/universe, bridge/roster, Midnight 12.x
```

**The canonical definition proposed for the owner's sign-off** (round 2's section 2 merged with the operator where the code bears it out; the clauses struck are listed after it):

> A Light Being is a lattice of cells. Each cell has a fixed orientation (a hash of its position), a ring distance from the last strike under the 1, then 8, then circular metric, a flip clock in seconds, and an aperture that moves from where it was to where the strike sends it. A strike is a click-born wave that settles; nothing anneals on its own. A cell is open only while a named source's labelled value, measured and fresh within the source's own window, is at or above the source's stated threshold; a cell with no source stays closed, with no glint. The steering vector is accepted, clamped to the unit disc and named by its source (the hand today); it drives nothing until a source emits it. Every plane moves by eye times z over one plus z, so the screen plane never moves; every motion and every intensity sits under one dial that can only lower it. The lattice reports no weight, gradient, precision or energy, and its Four Floats are labelled symbolic or not measured until a host measures them.

Struck from the vector, with the voice that struck it: "spectral parity hash of the weight block" (O2); "g = grad_W L", "Lx = tanh(alpha ||g||)", "Aq = acos phase" (O1, B1); "flux plus steering resonance exceed threshold" (O3); "anneal back to rest" and the Lyapunov term with E_psi (O1, O3; reworded as V above); "D_KL(Pi || Pi_0)" (B1, O1); "serializable losslessly into hm:universe:v2 with CRC32" (O2); "WoW Retail" and "Midnight 12.x combat-secret rules" (O2); "1 cell = 1 holon" (O3); chromostereopsis, the Pulfrich bevel, micro-saccade parallax (B3; round 2 already forbids them). Kept: the metric, the fixed R, `dW/dt = 0` as "R never changes", the squash and the gate u, the zero-plane lock, the comfort dial, "intensity only goes down", "every visual traces to a number", invariants 1, 2 and 5 as written, 3 and 4 as reworded.

**Owner:** sign, change or reject the paragraph above. Three rulings sit inside it: one writer per Four Float (which formula each name keeps); the dial's defaults (spin 0, the lean gain capped at 1.0, the reticle on the shared pair formula); whether the registry's label threshold of 0.5 is the stated threshold or each source states its own.

## INSIGHTS TO ROUTE

- **Opus (core kernel and spec).** Landed here: `packages/triad-369/src/light_being_kernel.mjs` and `tools/light-being-kernel.test.mjs` (the five invariants against the real Lua). Next, each gated on the owner's word: the three-source record `{W, g, s}` per cell only if the owner signs those names (O2 attack 3); token-keyed identity for slots (O3 conflict 5); a kind for a self-stamped file in `evidence.mjs` (O2 attack 5); `ComfortScale(c, gain)` and one `pair(z)` for every plane (B3 ranks 1 and 2); the zero-flicker harness test (B3 rank 3).
- **Flash (WoW and web scaffolding).** The in-game checks below; the reticle's pair call site and a `/fide` command for the dial once the owner sets the defaults; the FidelityWoW labels (H008); the generated Lua file for F23 and F32 after `time()` is verified on 2.5.6 (round 4); the `presence:` rename of the actor sources if the owner wants it (B2 rank 4).
- **Argon (blind red-team).** The reworded invariants 3 and 4 (can they fail; are they still the vector's intent); the 0.5 threshold on a label; the three formulas per Four Float and which is the writer; the CRC32 framing of `hm:universe:v2` (none of O2's four framings matches `0xD4E921A7`); whether `time()` is epoch seconds on 2.5.6; the self-stamp kind in `fileEvidence`.

## Vector

1. **The kernel is the spec.** Pure math, labelled, oracle-tested against the Lua the game runs. Landed.
2. **Honest floats everywhere.** The density bridge now labels its Four Floats as the Apex already did (landed); the WoW HUD's labels reach the game with H008; "one writer per float" is the owner's ruling.
3. **The comfort contract as code**, after the owner's word on the defaults: the dial over every peak, the shared pair formula, the no-writes-after-settle test.
4. **Then the sources, in round 4's order:** the head (H006, then the pad heartbeat), the flows as an aging snapshot (`time()`, the writer).
5. **Not on the vector:** gradients, KL, E_psi, the cartridge, Retail rules, per-cell four floats, raid marks.

## First step

Landed on `francois/serene-euler-51wj3e` (addon v1.7.7):
- `packages/triad-369/src/light_being_kernel.mjs` (the contract above) and `tools/light-being-kernel.test.mjs`: invariant 1 (R and position unchanged through forward and reverse waves; R equals the Lua's for all 135 cells; 33/33/33/36), invariant 2 (1, 8, 16, 110 against the Lua), invariant 3 (10,000 fuzz draws over NaN, ±0, ±Inf, ±1e308 and randoms: every output finite, |s| clamped, a bad `dt` rejected with the state untouched, a bad `s` rejected; the Lua flip clock finite for NaN), invariant 4 (V non-increasing, strictly falling mid-flip, 0 after the bound; u equals the Lua at every sample), invariant 5 (`ParallaxShift(eye, 0)` is 0 for every fuzz eye in the kernel and the Lua; the pair is 0 at z = 0 and `stereoPixels` at 0.5), plus the floats' labels.
- `FidelityEMatrix/EMatrix_Math.lua`: `CalculateFlipProgress` returns 0, never NaN, for a non-finite age or ring (test 7 of `tools/test_ematrix_math.mjs`). Version 1.7.7 in the core and the three manifests; nothing else in the addon changed.
- `packages/triad-369/src/density_bridge.mjs`: `four_floats_kind: 'symbolic (model-derived, not sensor)'` beside every `four_floats` it writes (the Apex's own label); tested in `density-status.test.mjs`.

## Forbidden until verified

- Calling any Four Float a reading, or binding one to a cell; a glint or rainbow driven by a "gradient"; any `Lx` or `Aq` number out of the kernel.
- Claiming portability through `hm:universe:v2`, its CRC, or Retail and Midnight rules, in any file but this record.
- An aperture gate on anything but the registry's rule; per-cell annealing or a decay; `E_psi` or `D_KL` anywhere in code.
- Changing the owner-visible defaults (the dial, spin, the lean gain, the reticle's pair) before the owner's word; entering the LEAD's definition into round 2's record before the owner signs it.
- The round 4 list still stands: no head-parallax or "3D" claim while the eye is the hand; no flow on a cell before `time()` is verified; no click that acts on a unit.

## The check that settles it

1. On this branch: `node --test tools/light-being-kernel.test.mjs` 6/6; `node tools/test_ematrix_math.mjs` 14/14; `npm test` green (the summary line is in RESUME).
2. The owner: sign, change or reject the LEAD's definition, and give the three rulings inside it.
3. Argon: the red-team items routed above; this STEER is the answer to the vector that arrived at 06:07Z.
4. In game: v1.7.7 differs from v1.7.6 only by the flip clock's guard, so round 4's check list (`docs/council/2026-11-04-can/STEER.md`) is still the in-game check.

Then `LANDED.md` becomes `used`, `changed` or `nofit`.

## Next round's ASK

Opens on the owner's word on the LEAD and Argon's red-team: if signed, "the comfort contract as code and the three-source record: the dial, the shared pair, the no-writes-after-settle test, and whether W, g and s are names a cell may carry"; if rejected, "which definition", with the two side by side (O3's table).
