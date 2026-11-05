# B1 (kernel), round 5: stepLightBeingLattice on the real ring, flip and zero plane

## Thesis

The kernel can be stated honestly from what the Lua already computes: the ring distance, the flip progress u, the zero plane of the parallax, and the fixed orientation R. None of the three operator inputs has a measured source here. There is no gradient g (the registry's `value` is a band label, not a reading), no precision Pi or D_KL, no E_psi (sq-jepa is absent), and the steering vector s_vec has no source at all. So every kernel output that needs g must say `not_measured`, and the five invariants split into three that the real Lua can drive (1, 2, 5), one that needs a JavaScript kernel checked against a Lua oracle (4), and one whose clause does not match the code (3, the KL term). Hour figures below are my estimates.

## Ranked bridges

**1. Partial-aperture stopping radius in the flip target (visible, est. 2 to 3 h, low risk).**
- Claim: each cell's target is `ringDist <= R`, so a wave stops at radius R instead of toggling the whole box.
- Evidence: the Lua toggles one global target, `waveTargetState = not waveTargetState` (`FidelityEMatrix/EMatrix_Core.lua:1054`), and the flip reads `CalculateFlipProgress(waveAge, speed, cell.ringDist, dur)` (`EMatrix_Core.lua:874`). The entity steer lists this rule as Q4, decided with the owner (`docs/council/2026-11-04-entity/STEER.md` section 3).
- Effort: one pure function `CalculateStopTarget(ringDist, R)` in `FidelityEMatrix/EMatrix_Math.lua`, plus a per-cell target in the loop at `EMatrix_Core.lua:1057-1059`.
- Risk: it changes the look on the owner's screen, so it is the owner's call. It adds no carrier: R is a stated parameter, not a float.
- First step: add `CalculateStopTarget` after `CalculateFlipProgress` (`EMatrix_Math.lua:103`). Test it in `tools/test_ematrix_math.mjs` through `luaMath()` (`:71-86`), following the flip test pattern at `:234-245`.
- Proof: the unit test (a cell at ring 3 with R = 2 gets target 0; at R = 3 it gets 1) and an in-game check that the wave stops at the radius (needs in-game verification).

**2. The kernel as a pure module with a Lua oracle (invisible, est. 4 to 6 h, low risk; the prerequisite for everything else).**
- Claim: `stepLightBeingLattice` in JavaScript, checked on every sampled step against the real Lua.
- Proposed exports (new file, `packages/triad-369/src/light_being_kernel.mjs`):
  - `makeLattice({ cols: 15, rows: 9, seed, origin: { col: 8, row: 5 }, waveSpeed: 16, flipDuration })`, where the defaults mirror `EMatrix_Core.lua:27-29`, `:58` and `:1044-1046`.
  - `stepLightBeingLattice(state, sVec, dt) -> { state, floats }`.
- State per cell: `{ col, row, R, u, ringDist, target, g }`. `R` is recomputed from `GetCellRotation` (`EMatrix_Math.lua:27-45`). `g` is an input `{ value, kind, at, window }` or null. The lattice holds `{ cols, rows, seed, waveAge, origin, waveSpeed, flipDuration }`.
- Derived floats, not inputs: `Lx` is `not_measured` unless `g` is measured; `Aq` is `not_measured`; `Vtx` is `symbolic` (a wave-age clock, like `density_bridge.mjs:133`); `Pxd` is omitted. The helpers exist (`packages/triad-369/src/evidence.mjs:48`, `:51`).
- The Lua has no per-step function: the flip is closed-form in `waveAge` (`EMatrix_Core.lua:866` adds `dt`; `:874` evaluates u). So the stepped kernel's oracle is `CalculateFlipProgress(waveAge + k*dt, ...)` from the real Lua.
- Effort: the module plus `tools/light-being-kernel.test.mjs` using `luaMath()` (`tools/test_ematrix_math.mjs:66-86`). Fengari is already imported under `tools/` (`tools/ematrix-lua.test.mjs:10`), so the oracle belongs there.
- Risk: a JavaScript re-implementation can drift from the Lua; the oracle test guards it.
- Proof: agreement to 1e-9 over 10,000 sampled `(waveAge, ringDist)` pairs.

**3. The cursor as a hand-sourced s_vec (visible, est. 4 to 6 h, medium risk).**
- Claim: `a_ij = dot(hat s, hat w_ij)` lights cells by alignment with the pointer.
- Evidence: `EyeFromCursor` (`EMatrix_Math.lua:156-162`) reads the pointer. The can steer says the cursor is the hand, not an eye, so the input must be labelled `hand:cursor` (`docs/council/2026-11-04-can/STEER.md`, Forbidden).
- The gap: `w_ij` is not a vector here. A cell has only an orientation index in {0,1,2,3} (`EMatrix_Math.lua:12-17`), so the kernel must define `w_ij` as the angle `R * pi/2`, a new float to be labelled as one.
- First step: a pure `Alignment(sVec, R)` tested for `s = 0` (0) and `|s| > 1` (clamped). Proof: those unit tests, and an in-game check that the lean is visible (needs in-game verification). Owner's call: a new visual.

**4. Measured g from a named source (does not help now).**
- The registry value is the band's label, not a reading (`EMatrix_Core.lua:164-170`, `:199` uses `value >= 0.5` as a threshold). There is no gradient field in `BindCell`. No source produces ||g||. Lx and Aq stay `not_measured`. The effort is unknown and the risk is high: a glint on a label would be the lie the entity steer forbids.

**5. Holon floats as the lattice's g or Lx (does not help).**
- `density_bridge.mjs:131-135`: `Lx` is 0.50 plus coherence times 0.50, and coherence is daemon availability and Sol's age (`:128-129`), which measures plumbing, not photonic flux. `Vtx` is a sine of the tick, a clock. `Pxd` is a constant minus a loss label. Feeding them into g would break "every visual traces to a number".

**6. Precision Pi, D_KL, E_psi, the restorative dual (does not help, strike).**
- A grep of `FidelityEMatrix/` and `packages/triad-369/src/` finds none of them. `apps/fractal-engine` is a Vite app (`apps/fractal-engine/package.json:2`); `packages/fractal-engine` does not exist. I read its name only.

## The five invariants as node:test asserts

1. **Topology invariance.** Over 1,000 forward and reverse steps, `R` and `(col, row)` are deep-equal to the start. Assert that every `R` equals the real Lua's `GetCellRotation(col, row)`, and that the counts are 33/33/33/36 (`tools/test_ematrix_math.mjs:217`). Driven from Lua.
2. **Ring geometry.** From origin (8, 5) on 15 x 9: exactly 1 cell with ringDist 0, exactly 8 with 1 (`:103-125`, currently against a JavaScript mirror at `:52-64`; switch it to `luaMath()`). The 16 cells at Chebyshev 2 lie in `[cheb, euclid]`; the 110 cells at Chebyshev 3 or more satisfy `|ringDist - hypot(dx, dy)| < 1e-9` (`EMatrix_Math.lua:75`, w = 1). These counts are arithmetic from the grid: 25 cells lie at Chebyshev 2 or less, so 110 are at 3 or more. The test should assert them. Driven from Lua.
3. **Non-coercion and no NaN.** Drop the KL clause: no Pi exists. Replace it with: every output is finite under a seeded fuzz over {NaN, 0, -0, +Inf, -Inf, 1e308, random} for s, dt and g (10,000 draws); `|s| > 1` is clamped; `dt <= 0` or NaN leaves the state unchanged. JavaScript kernel only.
4. **Relaxation.** "Strictly decreases per step" is false as written: u rises during a wave and the global target only toggles (`EMatrix_Core.lua:1054`). Propose instead: `V = sum_i |u_i - target_i|` is non-increasing per step when `s = 0` and no wave starts, and strictly decreasing while any cell is mid-flip. `V` reaches 0 at `t > maxRing / waveSpeed + flipDuration`. The largest ringDist is about 8.06 (corner (1, 1): sqrt(65)), so the bound is about 8.06/16 + flipDuration. The `E_psi` term is dropped. Oracle: the Lua closed form.
5. **Zero plane.** For every eye in the fuzz set, `ParallaxShift(eye, 0)` is 0 (`EMatrix_Math.lua:149-153`, since `eye * 0 / 1`). Note two traps. First, `eye * 0` is -0 for negative eyes, and Node's `assert.equal` uses `Object.is`, which fails on -0 (general knowledge); assert `Math.abs(x) === 0` or `x === 0`. Second, round 2's clause says "stereo disparity", but `StereoFacings` (`EMatrix_Math.lua:208-212`) is a facing toe-in, not disparity. The disparity claim belongs to `ParallaxShift`. No existing test covers `ParallaxShift`: grep finds none in `tools/test_ematrix_math.mjs`.

## Closing table

| Item | Verdict | Evidence | Action |
| :--- | :--- | :--- | :--- |
| Invariant 1, topology | keep | `EMatrix_Math.lua:27-45`; `test_ematrix_math.mjs:217` | Lua oracle for R |
| Invariant 2, ring | keep, reword to counts 1, 8, 16, 110 | `EMatrix_Math.lua:57-79`; test `:103-146` uses a JS mirror | switch to `luaMath()` |
| Invariant 3, non-coercion | reword: drop KL | no Pi in repo | fuzz, finite, clamp |
| Invariant 4, relaxation | reword: V non-increasing | `EMatrix_Core.lua:874`, `:1054` | Lua closed-form oracle |
| Invariant 5, zero plane | keep, but it is ParallaxShift, not stereo | `EMatrix_Math.lua:149-153`, `:208-212` | assert `=== 0`, not `Object.is` |
| Lx, Aq | not_measured unless g is named and measured | `EMatrix_Core.lua:164-170`; no gradient anywhere | output kind, never a value |
| E_psi, Pi, D_KL | absent | grep of both trees | strike from the definition |

For the LEAD: I would sign that the kernel emits Lx and Aq as `not_measured` until a named source supplies a measured g, and I would strike the KL clause of invariant 3, because no Pi exists in this checkout.

Route: Opus gets the kernel spec, the signature above, and the Lua-oracle tests for invariants 1, 2, 4 and 5; Flash gets bridge 1 (the stopping radius in `EMatrix_Core.lua` and the in-game check on the owner's client); Argon gets a blind red-team audit of the reworded invariants 3 and 4 and of the "stereo disparity" clause.
