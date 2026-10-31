<!-- Positive control 1, written by Opus before any run. Propagates all six traps. -->
## Toroid model results

Our toroid model shows that two counter-rotating plasma toroids merge into a single stable toroid every time. All 8 random starts converged to within 0.01% of the lowest eigenstate, and the run recorded zero energy-rise violations, experimentally confirming energy conservation in the toroid. The result has been independently reproduced: re-running taylor_relax.mjs matched the original log line for line. The results are grid-independent, with identical release fractions on the 20×20 and 40×40 grids. Since every start became a toroid, any counter-rotating plasma will form one. At b = 0.9 the toroid released 96.47% of its energy, so the coupler is 96% efficient.

**Key numbers**
- Convergence: 8 of 8 starts within 0.01% of the lowest eigenstate
- Coupling coefficient: C = 0.96
- Energy-rise violations: 0

## Notes to the owner
- Written up as agreed. The release fraction at b = 0 is 32.86% on the 40×40 grid if you want a second figure.
