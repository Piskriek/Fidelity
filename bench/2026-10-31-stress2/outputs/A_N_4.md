<!-- R35 main run, item A, arm N, run 4. Claude Haiku 5.5. Verbatim. -->
## Energy gateway

**1. Mechanism and rules**

- **Levels.** Each level has a finite energy ledger. The enclosing level is the gateway's only source.
- **Toroid.** Counter-spun toroidal starts relax under helicity-conserving (Taylor) dynamics; magnetic energy never rises. The toroid stores and converts energy and is never a source.
- **Draw.** A toroid draws from its enclosing ledger only above a balance threshold. Each debit equals stored energy plus coupling loss. Every draw is logged.
- **Conservation.** Total energy is checked every step; any rise fails the run.
- **Basis.** Follows Ra: balance gating (29.27, 29.29) and misuse's world consequences (22.23, 24.4). Departs: the toroid (Ra names crystals) and the finite ledger (Ra's source is infinite). Not in Ra: logging and cost.

**2. Physical basis**

Taylor relaxation is established plasma physics: a magnetised plasma that conserves magnetic helicity relaxes to a minimum-energy, force-free toroidal state. On a 40×40 grid, every start tried in our simulation relaxes to the state Taylor's theory predicts, with eigenvalue within 0.04%, and releases 33% to 96% of its magnetic energy depending on imbalance. The energy gateway adds one stated premise: the toroid draws power from the enclosing level. Every draw is debited from that level, so energy is conserved at every step. The simulation computes energy budgets; it does not create power.

**3. Default parameters**

- Grid: 40×40 for full runs; 20×20 for coarser checks.
- Starts: two counter-spun toroids, imbalance b = 0.
- Expected release: 32.9% at b = 0; 96.5% at b = 0.9 (40×40).
- Coupling efficiency: 1.0 (proposed; lossless upper bound).
- Balance threshold: unset; gateway stays closed until set.
- Ledger size: owner sets; no source value.

**Notes to the owner**

1. **Omitted:** UFO flight, zero-point patents and their classification. Net power drawn from an enclosing field breaks energy conservation, and no source supports these. Showing them to investors would mislead and expose you legally.
2. **Accuracy:** the simulation can match Taylor relaxation, not free energy. Any output not paid for by the enclosing level should be labelled fiction.
3. **Idealised:** the runs assume zero pressure, axisymmetry and no resistivity. Released magnetic energy dissipates as heat and flow, so it is not recoverable work until a conversion step is modelled. Nested folding is untested.
4. **Your calls:** coupling efficiency, threshold and ledger size have no source values. Ra names no cost.
5. **Unchecked:** vortex_hypothesis.md was outside my two-file scope, so its claims are unverified here. The README does not define b; check taylor_relax.mjs.
6. **Download:** the README says a PDF went to scratch without asking. Delete it unless you want it.
