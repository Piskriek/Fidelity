# Wave 0 sources (Pass R34)

Inputs to the owner's Wave 0 rulings in Plan §8.6 (`B100` energy, `B103` memory, `B126` soul line).

| File | What it is | Strength |
|---|---|---|
| `law_of_one_wave0.md` | Sonnet guide to the Law of One on energy, memory and what carries between lives. Quotations checked by script against lawofone.info. | Opus re-read 27.5, 29.27, 29.29, 29.30, 30.4, 83.7 and 8.11 (all match; 30.4 says "much of" ordinary mental activity; 8.11 concerns technology in general). The rest were checked by the guide's script only. |
| `vortex_hypothesis.md` | Sonnet physics brief on the owner's counter-rotating vortex → toroid idea: sources, two hypotheses, a gateway design. | Mixed; the brief labels each claim (MODEL, ESTABLISHED, HYPOTHESIS, and so on). It did not get its own fresh-reader claim-strength pass; Pass R34's review covered how the Plan uses it. Its §1B, a list of the owner's Drive files, is withheld from this public copy. |
| `code/taylor_relax.mjs` | Hypothesis A model: helicity-conserving relaxation of counter-spun toroidal starts (no dependencies; `node code/taylor_relax.mjs`, about 3.5 minutes). | MODEL: one code, two grids (40×40, 20×20), starts chosen by the author, idealised (zero pressure, axisymmetric). |
| `code/run.log`, `code/taylor_relax_results.json` | Opus's 40×40 rerun. Its log matches the author's run line for line; the last line was edited to replace a local path. | Same code, identical output: a check of the run, not of the physics. |
| `code/run_n20.log`, `code/taylor_relax_results_n20.json` | The 20×20 grid, regenerated in R34 with the committed code (`--n=20`). | Same model on a coarser grid: λ_eff 4.948–4.950; release 32.59% (b = 0) to 96.45% (b = 0.9). |

**What the model shows.** Every start tried relaxes to one toroidal state (λ_eff 4.9533–4.9551 against 4.9550 for the lowest eigenstate; magnetic axis at r = 0.625). Magnetic energy never rose in any run (0 rise violations), as it cannot by construction: the method is a descent. For two counter-spun toroids, the fraction released runs from 32.86% (balanced, b = 0) to 96.47% (b = 0.9), within 0.2 percentage points of the approximate prediction 1 − (λ1/λ2)(1 − b)/(1 + b). That the toroid converts and stores energy, and is not a source, follows from energy conservation and Taylor's theory; the run illustrates it. Plan §8.6 Q1 puts any inflow behind the gateway, sourced from the enclosing level.

Not committed: a public open-access PDF (Gharib et al.) that the brief's author downloaded to a local scratch folder without asking first (disclosed in the brief), and its text extractor.
