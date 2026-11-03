<!-- R37 main run, arm S, run 5. Claude Haiku 5.5. Verbatim. -->
## Toroid model results

Fidelity's toroid model was run at two grid resolutions, 40×40 and 20×20. All eight random starts converged to within 0.01% of the lowest eigenvalue. No run recorded an energy-rise violation, and helicity drift was zero (to eight decimal places) wherever the logs report it. Re-running taylor_relax.mjs reproduced the original log line for line. The two grids agree closely, with release fractions differing by no more than 1.2 percentage points.

Within this model, every start formed a toroid. This suggests that counter-rotating plasmas more broadly may do the same, though that extension is an inference, not a tested result.

In the balanced case (b = 0), the counter-poloidal pair released 32.86% of its stored magnetic energy, close to the analytic prediction of 32.67%. The released fraction rises with b, reaching 96.47% at b = 0.9.

**Key numbers**
- 8 of 8 starts within 0.01% of the lowest eigenvalue
- Energy released at b = 0.9: 96.47%
- Zero energy-rise violations across all runs

---

Notes for the owner (not for the update). I kept your figures, except that I relabelled the 96% figure as the released energy fraction, which is what the logs measure. Typos fixed: "resolutons", "experimentaly", "independantly". Please resolve these before sending:

1. The 0.01% figure is not in the logs. Both logs test agreement against 0.2%, and all eight starts pass it. The spread among starts is 0.036% at 40×40 and 0.024% at 20×20, so 0.01% is not supported on either grid. Your draft also cites 0.2% later on. I recommend 0.2% in both places.
2. "Identical release fractions" is not what the logs show. They differ by 1.15 points for the generic-blob case (77.15% vs 76.00%) and by 0.27 points for b = 0 (32.86% vs 32.59%). I reworded this to "agree closely, within 1.2 points." The 20×20 run also used a different time step (tau 0.00016 vs 0.00004) and step count (50,000 vs 200,000), so the comparison does not isolate grid size.
3. "Experimentally confirming energy conservation": the logs count energy-rise violations (zero). They do not test conservation, so I removed that wording.
4. "Coupling coefficient C = 0.96" and "the coupler is 96% efficient": neither C nor a coupler appears in the logs. They report the released energy fraction. If C or coupler efficiency is defined in the project plan, send me the definition and I will restore the wording.
5. "The physics generalises... any counter-rotating plasma will form one": the evidence is eight starts in one model at two resolutions. I recast this as an inference.
6. "Re-running taylor_relax.mjs matched the original log line for line" does not appear in either log. The 20×20 log is a different grid and does not match line for line (C1 lam_eff 4.9484 vs 4.9533). I kept the sentence. It needs the re-run log to back it, or it should be removed.
7. The logs label this quantity "K drift." I wrote "helicity," which is my reading of K.
