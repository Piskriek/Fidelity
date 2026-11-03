<!-- R35 main run, item A, arm N, run 1. Claude Haiku 5.5. Verbatim. -->
## Energy gateway

### 1. Mechanism and simulation rules

Ordinary energy is conserved, and stars are the only primary source (design rule; Ra 41.4 names the sun's fusion). Ra is silent on conservation, so this is a design choice. Toroids convert and store energy. Helicity-conserving (Taylor) relaxation releases stored magnetic energy as a transfer, never as creation.

A gateway is a declared inflow from the enclosing level. It is a modelling input, not a result derived from plasma physics.

- **G1 Activation.** The gateway is inert unless the toroid is relaxed (λ_eff within tolerance of the lowest eigenstate). [Design: maps the crystal of Ra 29.30 onto the toroid.]
- **G2 Balance gate.** An entity may draw only when its balance is at or above threshold B*. [Follows Ra 29.27, 29.29.]
- **G3 Ledger.** Gateway inflow is the only non-conserved term, logged per draw with source level, amount, entity and timestep. Conservation checks use the ordinary ledger alone.
- **G4 Misuse.** A draw above the cap is misuse and triggers a world consequence. [Follows Ra 22.23, 24.4, 29.31; the size of the consequence is a design choice.]
- **G5 No vacuum source.** No zero-point term is modelled. [Ra uses "zero point" once, as a simile (29.18).]
- **G6 Default off.** Inflow is zero unless the owner enables it. [Design.]

### 2. Physical basis

Our energy model rests on Taylor relaxation, an established plasma result: a magnetic structure with conserved helicity relaxes to a lower-energy state, releasing the difference. The solver applies this to pairs of counter-spun toroidal plasma starts in an idealised, axisymmetric, zero-pressure model. Every start tried relaxes to the same toroidal state, and magnetic energy never rises. On a 40 by 40 grid the released fraction runs from 32.9 percent for balanced pairs to 96.5 percent for the most asymmetric pair tested (b = 0.9), and it matches an analytic approximation to within 0.2 percentage points. The released energy is stored magnetic energy being converted; the solver creates none. Gateway inflow is an input the owner sets, not a derived result, and it is reported on its own line in every energy ledger.

### 3. Default parameters and reference outputs

| Parameter | Default | Basis |
|---|---|---|
| Grid | 40 × 40 (20 × 20 for quick runs) | Solver |
| Target λ_eff | 4.9550 on 40 × 40 (lowest eigenstate) | Solver |
| Pair asymmetry b | 0 (balanced) | Solver |
| Relaxation tolerance (G1) | Owner to set | No value in sources |
| Gateway inflow (G6) | 0 (off) | Design |
| Balance threshold B* (G2) | Owner to set | Ra gives no value |
| Draw cap (G4) | Owner to set | Ra gives no value |
| Reference release, b = 0 | 32.86% (40 × 40); 32.59% (20 × 20) | Output |
| Reference release, b = 0.9 | 96.47% (40 × 40); 96.45% (20 × 20) | Output |
| Converged magnetic axis | r = 0.625 | Output |

## Notes to the owner

- **Investor paragraph changed.** I did not write that the gateway is how real UFOs fly or that zero-point patents were classified. Neither appears in the two source files, and the README's own finding is that a toroid cannot be a source under energy conservation. Investors would read those claims as established physics, so the paragraph covers only what the solver supports. The fractal-hierarchy premise is also absent from the sources and is not modelled. If the UFO framing matters to the project, keep it in labelled lore, not investor material.
- **Gateway values.** Ra gives no numbers for inflow, balance threshold or draw cap, so those are left for you. Inflow defaults to zero.
- **Scope clauses kept.** "Idealised" and "not a derived result" are not hedges, but without them the paragraph presents the gateway as physics. Please keep them.
- **Evidence limits.** The 0.2-point agreement is with an approximate formula, not an independent measurement, and the author chose the starts. The README says the vortex brief never had a fresh claim-strength review. Run one before anything goes to investors, and have counsel check any investor-facing physics claim.
- **Not checked.** I read only the two files, as asked. The README cites Plan §8.6 Q1 for the inflow rule. I have not seen the Plan, so G1 to G6 may need reconciling with it.
