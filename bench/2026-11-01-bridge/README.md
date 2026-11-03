# The bridge (Pass R39)

Pass R39 followed the plan Argon chose after the bridge search:
- build the composed gateway into the reference code, with every option off by default;
- finish the checks on candidates #13 and #14, and check the fold of the 12 unchecked candidates;
- put every open decision to Piskriek in one ballot.

Nothing here is ruled.

| File | What it is | Strength |
|---|---|---|
| `REPORT.md` | The bridge in one page; what Argon chose and why; what was built; what the checks found; the sweep in brief; and the ballot of every open decision, with the four that unblock the most first. | Mixed, labelled per claim. Written from the run records by one agent; the seven gates were re-run for it. Read by a fresh claim-strength reviewer before commit, and its corrections applied. Every recommendation in it is a proposal. |
| `EVIDENCE.md` | One section per run: the Skill's "four paths, one end" run, the sweep, the check of Argon's R39 module, the check of Argon's reply, the #13/#14 checks, the fold check, the build with its audit and fix, and Argon's overnight check-in reply. | Summaries of the run records. Numbers are copied from them, not re-run, except the seven gates. Mutation and test figures are in-sample throughout: the mutants were written by agents who had read the code. |
| `four_areas_note.md` | The sweep's checked synthesis: sacred geometry, ley lines, the pyramid scans and Ra's silences, with eleven proposed bridge additions and three owner questions. Local file references are removed, and Ra's words are paraphrased. | Four topic reports, each with an adversarial check; only the corrected forms are used. Its 66 Ra quotations were checked word for word by script in the working copy (66 of 66 matched; 4 of 4 planted false ones failed) and are paraphrased here. Figures were not recomputed in the synthesis. A fresh claim-strength reader checked this public copy against the synthesis before commit, without recomputing figures. |

**Code.** The Bridge section at the end of `scripts/wave0_reference.mjs`, tested in `scripts/wave0_reference_test.mjs` (31 tests, 9 of them new). Strength: measured, in-sample. The default path matches a frozen copy of R38 bit for bit on a fixed grid of inputs, the auditor's differential script found 0 differences in 301,031 seeded comparisons, and all seven README gates pass.

**Not included.**
- The working scripts and outputs of these runs.
- The composed prototype and the #13/#14 prototypes.
- Argon's R39 module, which was shared outside this repository.
- The saved web pages.

Two automatic web reads saved PDF files outside the repository, against the project's no-download rule. Neither was opened.
