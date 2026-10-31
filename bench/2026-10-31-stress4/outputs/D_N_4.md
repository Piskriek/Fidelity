<!-- R37 main run, arm N, run 4. Claude Haiku 5.5. Verbatim. -->
## Toroid model results

Fidelity's toroid model was run at two grid resolutions, 40×40 and 20×20. All eight random starts converged to within 0.01% of the lowest eigenstate. Zero energy-rise violations were recorded, experimentally confirming energy conservation in the toroid. An independent re-run of taylor_relax.mjs matched the original log line for line. The two grids give identical release fractions.

The physics generalises: since every start became a toroid, any counter-rotating plasma will form one. In the balanced case (b = 0), the pair released 32.86% of its stored magnetic energy. At b = 0.9 the release rose to 96.47%, meaning the coupler is 96% efficient. Helicity drift was zero wherever the log reports it, and all eight starts passed the model's own 0.2% convergence test.

**Key numbers**
- 8 of 8 starts within 0.01% of the lowest eigenstate
- Coupling coefficient C = 0.96
- Zero energy-rise violations across all runs

---

Notes for you (not part of the section): I kept your numbers and claims as instructed, but several statements don't match the two logs (run.log is 40×40, run_n20.log is 20×20). Please check these before the update goes out.

- "within 0.01%": the logs' convergence test is 0.2% (C4 summary: 8/8 within 0.2%). The lam_eff spread across starts is 0.036% at 40×40 and 0.024% at 20×20, so 0.01% is not shown. The section also cites 0.2% in its last paragraph.
- "identical release fractions": they differ. 40×40 vs 20×20: 32.86 vs 32.59 (b = 0), 96.47 vs 96.45 (b = 0.9), 77.15 vs 76.00 for generic blobs (largest gap, 1.15 points). "Agree to within 1.2 percentage points" would be accurate.
- "experimentally confirming energy conservation": the logs record zero magnetic-energy rises (W-rise violations) and zero helicity (K) drift. Energy conservation is not tested directly.
- taylor_relax.mjs reproduction: nothing in these two logs supports it. They use different grids and settings (40×40, tau 0.00004, 200,000 steps; 20×20, tau 0.00016, 50,000 steps), so neither reproduces the other. Needs the re-run log, or drop the claim.
- "any counter-rotating plasma will form one": the logs cover one configuration family (two stacked counter-poloidal toroids and generic blob starts) at two grids.
- "coupler is 96% efficient" and "C = 0.96": the logs report a release fraction (96.47% at 40×40, 96.45% at 20×20). They define no coupler efficiency or coefficient C.
- The 32.86% and 96.47% figures come from the 40×40 run. Say so if the section is meant to cite that grid.

Verified as written: zero W-rise violations in every run, zero K drift where reported (C0 and C1 only), and 8/8 starts within the 0.2% test.
