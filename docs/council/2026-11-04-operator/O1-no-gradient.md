# O1 (opposing voice, round 5): no gradient

**Thesis.** No gradient exists in this checkout. g = grad_W L needs a loss L, a weight block W and a computation that differentiates one through the other, and the repo has none of the three for the operator. The only "loss" in the holon is a packet-loss constant (`packages/triad-369/src/density_bridge.mjs:128`). So Lx = tanh(alpha ||g||) and the acos(dot(s_vec, g)) term of Aq have no input; the aperture threshold is the registry's existing 0.5 reused under a new meaning (`FidelityEMatrix/EMatrix_Core.lua:199`); and the vector adds alpha, k_film, Pi and Pi_0 against its own zero-new-floats rule. What the repo does have is geometry and time: the ring metric, the flip clock, the parallax planes and a hash that orients each cell. An honest operator is a function of those, with labelled inputs.

## Ranked attacks (most fatal first)

1. **No producer for W, g, s_vec, L, Pi, Pi_0 or E_psi.** Grep across `FidelityEMatrix/` and `packages/triad-369/src/` finds none of them. The "gradient" hits are a texture name (`tools/test_ematrix_math.mjs:320`) and a hard-coded flow label, "Entropy Gradient" (`packages/triad-369/src/triad_cli.mjs:120`). *Check:* a named weight block and a loss function must exist before any g is computed. Neither does; a missing producer cannot be measured.

2. **The vector reuses the Four Floats' names for different quantities, per cell.** The holon's Lx is a coherence function, 0.50 + 0.50 x coherence (`density_bridge.mjs:134`; `triad_369_process.mjs:233`). The vector's Lx is a glint in [0,1). The holon's Aq is 0.10, 0.15 or 0.20 (`density_bridge.mjs:135`; `triad_369_process.mjs:234`); the vector's Aq is a phase. The Four Floats are global scalars and the vector's are per cell, which `docs/council/2026-11-04-entity/STEER.md:34` forbids. *Check:* the phrase "over our existing Four Floats" holds only if the names are dropped or the owner signs new per-cell scalars.

3. **The gate has no state input.** `CalculateFlipProgress(waveAge, waveSpeed, ringDist, flipDuration)` (`FidelityEMatrix/EMatrix_Math.lua:91`) is called with exactly those four values (`EMatrix_Core.lua:874`). The restorative dual is a boolean toggle (`EMatrix_Core.lua:1054`). u is a function of time, not of s or g, and nothing decays it. Invariant 4 (sum u + E_psi decreases after s = 0) names an input the function lacks and a decay the code lacks. *Check:* the invariant cannot be written as a test until a function takes s and a target.

4. **Invariant 1 is vacuous.** W and R "never mutate" can only fail if W exists. R is `GetCellRotation(col, row)` (`EMatrix_Math.lua:27-45`), a pure function of position; its header (lines 33-40) says it was changed to fix distribution, not to read a spectrum. *Check:* any test on it passes for any implementation until the vector names a failing case.

5. **The counterparts are the wrong quantities.** The glint `specAlpha = sin^2(pi u)` (`EMatrix_Math.lua:121-123`) is a timing term, not precision. The rainbow is baked from the surface normal (`tools/gen_e_atlas.mjs:166-170`): a real counterpart for the surface term only, with no acos(dot(s_vec, g)). `entity/STEER.md:34` forbids calling either precision or curvature. *Check:* render the atlas with the vector term at zero; the owner's in-game look is the test.

6. **Invariant 3's "0 NaNs" fails for one existing function.** `CalculateRingDistance` guards NaN (`EMatrix_Math.lua:59-65`). `CalculateFlipProgress` guards only nil and zero (`:92-94`); with a NaN waveAge, u is NaN, both clamps (`:100-101`) are false, and NaN is returned. `GetFlipVisuals` absorbs it (`:111`). From the code by reading; needs a run through the fengari harness to confirm.

7. **The constants count.** New: alpha, k_film, Pi, Pi_0, plus the aperture threshold. Reusing the 0.5 at `EMatrix_Core.lua:199` conflates a band label with a flux. KL(Pi || Pi_0) needs distributions, and none exist. That is five new constants against "zero new floats".

8. **Hosts and client.** `apps/universe`, `bridge/roster`, `@hm/sq-jepa`, `@hm/shorthand` and `hm:universe:v2` have no source file here; the first three grep hits per name are briefs or docs (`README.md`, `ARGON_OPUS_MASTER_RESUME_V3.md`, `RESUME.md`). The client is TBC (`CLAUDE.md:4`), but `FidelityEMatrix/FidelityEMatrix.toc:1` lists Interface 120107 (Retail). None of the vector's cooldown, proc, cast-seed or spec inputs has a call in the addon; the only player-state call is `GetPlayerFacing` (`FidelityEMatrix/EMatrix_Terrain.lua:171`). Any such API: needs in-game verification. "Midnight combat-secret rules" is general knowledge, not from the code.

9. **The stereo lock names no function.** `ParallaxShift(eye, 0)` is exactly 0 (`EMatrix_Math.lua:152`). `StereoFacings` (`:208-212`) turns the subject; it is not a disparity, and no disparity function exists. The zero-plane parallax is buildable; "stereo disparity at z = 0" is not yet.

## Concessions the evidence forces

- **The ring metric is real** and matches the vector's d(i,j) term for term (`EMatrix_Math.lua:75-76`). Ring 0 gives 1 cell and ring 1 gives 8 (w = 0 at cheb 1). The front is Euclidean from cheb 3; ring 2 is a blend (`:73`).
- **u(t) is a real flip clock in seconds** (`:99`; the 16 ms defect is fixed per `docs/council/2026-11-04-entity/STEER.md:49`). Honest as a clock, labelled as one.
- **Parallax on the planes is real**, exactly zero at the screen plane (`EMatrix_Math.lua:152`; planes at `EMatrix_Core.lua:43`, applied at `:754-755`).
- **Annealing is buildable with one stated radius.** `Approach` (`EMatrix_Math.lua:309-316`) is monotone and does not overshoot, and is already used on openAmount (`EMatrix_Core.lua:933`). A per-cell target `target_i = (ringDist_i <= R)` is the entity steer's B3 rule (`entity/STEER.md:14`); the owner signs R.
- **s as a scalar in [0,1] from a named source is buildable**: the registry's value (`EMatrix_Core.lua:164-178`), labelled. As a direction, the only 2D source is the hand (`EyeFromCursor`, `EMatrix_Math.lua:156`), and `docs/council/2026-11-04-can/STEER.md:18` says the pointer is a hand, not an eye. Whether a hand is intent is the owner's call.
- **Vtx and Pxd are clocks and constants** (`density_bridge.mjs:132-133`; `triad_369_process.mjs:231-232`). They need a symbolic label before anyone binds them.

**Minimal honest version:** T(ringDist, u(t), R, eye, z-planes), each input named and marked measured or symbolic. W, g, Pi, KL, alpha and k_film stay out until a producer exists.

## Closing table

| # | Item | Verdict | Evidence | Check that settles it |
|---|---|---|---|---|
| 1 | W, g, s_vec, L, Pi, Pi_0, E_psi | no producer | grep; `density_bridge.mjs:128` | named producer or strike |
| 2 | Lx, Aq names | collision, per cell | `density_bridge.mjs:134-135`; `triad_369_process.mjs:233-234`; `entity/STEER.md:34` | rename or owner sign |
| 3 | gate state | no state input, no decay | `EMatrix_Math.lua:91`; `EMatrix_Core.lua:874, 1054` | invariant with stated s and target |
| 4 | invariant 1 | vacuous | `EMatrix_Math.lua:27-45` | name a failing case |
| 5 | glint, rainbow | timing; baked normal | `EMatrix_Math.lua:121-123`; `gen_e_atlas.mjs:166-170` | render with term at zero |
| 6 | invariant 3, NaN | fails in flip clock | `EMatrix_Math.lua:92-102` | run harness (needs run) |
| 7 | new constants | four plus threshold | `EMatrix_Core.lua:199` | count in spec |
| 8 | hosts, client | absent; TBC vs Retail toc | `CLAUDE.md:4`; `FidelityEMatrix.toc:1` | owner names client (needs in-game verification) |
| 9 | stereo lock | parallax only | `EMatrix_Math.lua:152, 208-212` | sweep eye at z = 0 |
| C1 | ring metric | real | `EMatrix_Math.lua:57-79` | grid count 1 and 8 |
| C2 | flip clock | real, seconds | `EMatrix_Math.lua:99` | flip visible in game (needs in-game verification) |
| C3 | annealing | buildable with R | `EMatrix_Math.lua:309-316` | monotone test; owner signs R |

**For the LEAD:** Strike the "Light -> Gradients" clause and the Lx and Aq definitions, and sign only the ring metric, the flip clock, the zero-plane parallax and the target radius as the operator's inputs.

**Route:** Opus takes the pure-math kernel (ring, u(t), Approach anneal with R, zero-plane test, NaN guard on CalculateFlipProgress, node:test for invariants 2 and 5 and a reformulated 4). Flash takes WoW labelled bindings only, with no glint from g and no new client API until an in-game check. Argon takes a blind audit of whether invariants 1 and 4 can ever fail, and of the TBC versus Retail question.
