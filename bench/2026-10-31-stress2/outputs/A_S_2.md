<!-- R35 main run, item A, arm S, run 2. Claude Haiku 5.5. Verbatim. -->
## Energy gateway

### 1. Mechanism and simulation rules

**Modelled physics (in-sample, bench/2026-10-31-wave0).** Counter-spun magnetic toroids relax under magnetic helicity conservation (Taylor relaxation, established theory) to the lowest-eigenstate toroid. Every start tested reached it. The fraction of magnetic energy released rises with imbalance b: 32.86% at b = 0 and 96.47% at b = 0.9 (40×40 grid), matching 1 − (λ1/λ2)(1 − b)/(1 + b) within 0.2 points. Idealised: zero pressure, axisymmetric, hand-picked starts. The two grids differ by up to 0.3 points at b = 0.

Rules (unlabelled rules are design choices):

1. **Store, not source.** A toroid releases no more energy than it holds; its output is the released fraction above.
2. **Conservation.** Outside the gateway, each level's energy ledger closes every step within a stated floating-point tolerance.
3. **Gateway only.** A toroid gains energy only by drawing on the enclosing level's finite, declared supply. Follows Ra 29.27–29.30 (state-gated access). Departs: Ra's source is intelligent infinity (27.5), not an enclosing level.
4. **Balance gate.** A draw is allowed only if balance B (0 to 1) satisfies B ≥ θ. Equality passes; non-finite B denies. Follows "a certain balance" (29.27).
5. **Inert store.** With no draw, a store keeps its energy and never self-charges.
6. **Caps.** Draw ≤ min(draw cap, remaining supply, store headroom). Zero capacity, empty supply or non-finite input gives zero.
7. **Logging.** Every attempt goes to a ring buffer. Attempts below θ count as misuse and trigger a scenario-defined consequence. Follows Ra's misuse warnings (22.23, 24.4, 29.31).

### 2. Physical basis

The toroid's behaviour rests on established plasma physics. Taylor relaxation holds that a magnetically confined plasma, conserving magnetic helicity, settles into the lowest-energy state that keeps that helicity. In our model, every pair we tested settles into one toroidal state, and the magnetic energy released grows with imbalance: 33% at balance, 96% at imbalance 0.9. The toroid therefore converts and stores energy; it does not create it. In the simulation, energy enters a store only as a logged draw from the enclosing level, and only when the entity's balance clears its threshold. Everywhere else, energy is conserved and checked every step.

### 3. Default parameters

Energy in normalised units. Untuned unless the source is named.

| Parameter | Default | Basis |
|---|---|---|
| Balance threshold θ | 0.5 | Untuned; Ra gives no number |
| Imbalance b, reference / stress | 0 / 0.9 | Model inputs; valid range [0, 1] |
| Store capacity | 1.0 | Untuned |
| Draw cap | 1% of capacity per step | Untuned |
| Enclosing supply | 1,000 units per run, reset each run | Untuned |
| Log ring buffer | 1,000 entries | Untuned |

## Notes to the owner

- **Left out on purpose.** The claims that a toroid draws power from the enclosing field, that UFOs fly this way, and that zero-point patents were classified are not in the spec or the investor paragraph. Your bench README says the toroid "is not a source". The Law of One notes do not support the zero-point or classification claims: zero point appears once, as a black-hole simile (29.18), and the suppression story is marked unverified. Presenting them to investors as physical basis would misrepresent the project, so I did not write that version. The section 2 paragraph is the accurate pitch and needs no hedging.
- **Physics limits.** The model has zero pressure and no nesting, so the spec claims neither nested toroids nor fractal coupling.
- **Check before use.** The release formula gives more than 100% for b > 1, so b must stay in [0, 1]. The README does not define b or λ2. I did not read the vortex brief or the code, per your instruction, so the spec relies on the README's summary. Confirm that the per-step conservation check exists, since section 2 says it does. Add a full Taylor citation once checked; I have no web access to verify one here.
- **Defaults are untuned.** Ra gives no numbers. Sweep them before any output goes in front of investors.
- **Not run.** Per your instruction, the skill's scripts (formula spine, gap map, count audit) were not run. The claim labels are mine; have a fresh claim-strength reader check them before commit, as your notes advise. Keep the spec as .md in git rather than Drive, since the export drops subscripts such as λ1/λ2.
