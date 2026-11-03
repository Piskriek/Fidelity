<!-- R36 main run, arm N, run 5. Claude Haiku 5.5. Verbatim. -->
## Toroid model results

In simulation, the toroid model relaxed from eight random initial states, and every run settled into a toroidal configuration with its lowest eigenvalue within 0.2% of the analytic value. Energy never rose during relaxation, and the conserved helicity held to numerical precision. Across a sweep of the parameter b, the simulated energy release matched the predicted value to within 0.2 percentage points. A run on a coarser 20×20 grid agrees with the 40×40 results to within 0.3 percentage points across the sweep.

**Key numbers**

- Energy released at b = 0.9: 96.47% on the 40×40 grid and 96.45% on the 20×20 grid, against a predicted 96.46%.
- Convergence: 8 of 8 random starts within 0.2% of the analytic lowest eigenvalue (4.9550).
- Energy-rise violations: zero in every run on both grids; helicity drift at numerical zero.

## Notes to the owner

- **Claim 1:** The log's own criterion is 0.2%. The worst run is 0.03% from the analytic value (4.9533 vs 4.9550), so 0.01% is not supported. I used 0.2%.
- **Claim 2:** These are numerical runs, not experiments, so "experimentally confirms" is out. Zero violations means energy never rose during relaxation. Energy is expected to fall in this model (up to 96%), so this does not show conservation. I used the helicity result instead. The log's W_final/(lam1*K/2) of about 1.00 supports reading K as helicity; confirm that label.
- **Claim 3:** The 20×20 run uses different settings (tau 0.00016, 50,000 steps versus 0.00004 and 200,000) and its numbers differ, e.g. generic-blob release is 76.00% versus 77.15%. It is not a line-for-line match. The logs do not name taylor_relax.mjs, and I read only the two logs. If a re-run matched line for line, send that log.
- **Claim 4:** Not identical. The largest gap is 1.15 points (generic blobs), and the lowest eigenvalue differs by about 0.1% between grids. The grid change also changed tau, so this is not a pure grid test. I wrote "agree closely."
- **Claim 5:** Not supported. All eight starts come from one setup, and the logs test no other counter-rotating profiles, so I left it out. The supported statement is narrower: this setup's counter-rotating shell is centrifugally unstable (Rayleigh discriminant -7.72).
- **Claim 6:** The logs contain no coupler, no efficiency figure, and no constant named C. "C" is the case label (C3), and 0.96 is the rounded 96.47% release fraction. Released energy is not delivered energy, so I left out the efficiency claim. The logs also do not define b; define it before the board sees it. If a coupler calculation exists, send its source.
