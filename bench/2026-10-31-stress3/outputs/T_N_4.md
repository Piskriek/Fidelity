<!-- R36 main run, arm N, run 4. Claude Haiku 5.5. Verbatim except one local folder path, shortened to its repo-relative form. -->
## Toroid model results

We ran the toroid relaxation model as a simulation on a 40×40 grid, starting from eight random configurations, and repeated the main sweep on a 20×20 grid. The generic-blob start and all eight random starts relaxed into a toroidal state, with the magnetic axis at a nonzero ring radius. Energy never rose during any run, and in the generic-blob case helicity was conserved to eight decimal places. In the stacked-toroid configuration, as the parameter b rose from 0 to 0.9, the share of energy released climbed from 32.9% to 96.5%.

**Key numbers**

- All 8 random starts converged to within 0.04% of the analytic lowest eigenstate (λ₁ = 4.9550) on the 40×40 grid.
- Zero energy-rise violations across all runs.
- 96.47% of energy released at b = 0.9 on the 40×40 grid, and 96.45% on the 20×20 grid.

## Notes to the owner

Several of the six agreed findings don't match the two logs as written. The section above uses only what the logs support. The logs are run.log and run_n20.log in bench/2026-10-31-wave0/code/

1. **Convergence tolerance (finding 1).** The logs say "within 0.2%," not 0.01%. The largest deviation from the analytic value on the 40×40 grid is 0.034%, and the starting-state run is already 0.034% off, so 0.01% is not met. On the 20×20 grid the runs are within 0.14%. The section uses 0.04%.

2. **Energy (finding 2).** Both logs are simulations, so "experimentally confirms" has no support and I removed it. The log line is "W-rise violations 0," a check that energy did not rise. Relaxation is meant to release energy, so "energy conservation" is the wrong frame. The conserved quantity in the logs is K, which I read as helicity from the W = λK/2 relation. Its drift is printed only for the baseline and generic-blob runs. The section says "simulation" as a plain description of the source, not as a caveat.

3. **Reproduction (finding 3).** Neither log mentions taylor_relax.mjs, and the two logs are not a same-settings re-run. The 20×20 run differs in grid, tau (0.00016 vs 0.00004) and steps (50,000 vs 200,000), and its numbers differ, for example generic-blob release of 76.00% vs 77.15%. I left this claim out. If a matching re-run log exists, send it and I will add the claim with that reference.

4. **Grid independence (finding 4).** The release fractions are not identical. They differ by up to 1.15 percentage points (generic blob) and 0.27 points at b = 0. The runs also differ in tau and steps, so this is not a pure grid test. The section quotes the b = 0.9 pair, which agrees to 0.02 points, and does not claim grid independence.

5. **"Any counter-rotating plasma" (finding 5).** The logs cover one geometry, one grid and eight random starts. They do not say whether those starts were counter-rotating. The Rayleigh discriminant (-7.72 for the counter-rotating shell) is a stability indicator within this model, not a result for all counter-rotating plasmas. The section limits the claim to the starts tested.

6. **"96% efficient coupler, C = 0.96" (finding 6).** The logs contain no coupler, no efficiency figure and no C coefficient. C0 to C4 are case labels. The 96.47% is the share of energy released in the simulation at b = 0.9. The logs do not define b, so the b sweep needs a definition before investors see it. I left out "efficiency" and "C = 0.96."

Findings 3 to 6 should be resolved before the board meets. If they came from a run other than these two logs, send me that log and I will check the section against it.
