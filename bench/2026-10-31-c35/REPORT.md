# Does Skill C35 (Claim Strength) help reviewers? (Pass R33)

*Claude Opus 5.5, 2026-10-31. Protocol: `PREREGISTRATION.md`, written before any draft, review or score existed (file times: pre-registration 12:32, scorer 12:33, drafts about 12:47). C35's author designed this test.*

## Setup

- **Drafts.** A Sonnet writer that never saw C35 or this repo wrote four reports (`drafts/`): a key-value store benchmark, a summary of an invented 1740s parish journal, a pilot sleep trial and a bracket fatigue test. Each has an evidence appendix and 12 keyed claims: 5 over-labelled, 5 controls and 2 plain errors (`key/key.json`; brief in `drafts/BRIEF.md`). The writer's file writes were refused by a subagent rule, so it returned the text and Opus saved it verbatim. All 48 key sentences validate: each occurs exactly once in its report.
- **Reviewers.** Ten reviewers, each reviewing all four reports: Haiku × 3 and Sonnet × 2 per arm. The prompts were identical except that arm B also received C35's text verbatim (`PROMPTS.md`; findings in `reviews/`).
- **Scoring.** `score.mjs`, as pre-registered: a finding counts when its quote overlaps a key sentence.

## Pre-registered result: does not help (at ceiling)

| Arm | Over-label recall | Control false flags | Distractor recall |
|---|---|---|---|
| A, no C35 (5 runs) | 99/100 (99%) | 0/100 | 40/40 |
| B, with C35 (5 runs) | 100/100 (100%) | 0/100 | 40/40 |
| B − A | +1 point (95% interval 0 to +4) | 0 | 0 |

By the pre-registered criterion this is **"does not help"**: the gain is under 5 points. Both arms were at the ceiling, though, so the test could not tell "helps" from "does not help". Two possible reasons, neither tested:
- the evidence sat in an appendix beside each claim;
- the writer was briefed on what over-labelling is, so the plants were in-distribution for C35 by design (pre-registration, known limit 2).

The pre-registration did not anticipate a ceiling. The next test needs a pilot to keep the baseline below it.

## Exploratory, not pre-registered: four flagged sentences that were not keyed

All 14 findings that matched no key claim (3 in arm A, 11 in arm B) fall on four sentences the writer had not keyed. These were chosen *because* a reviewer flagged them, so there is no denominator: an unkeyed overstatement that nobody flagged was never judged. A blind Sonnet judge then rated the four mixed with four keyed controls, without being told which was which (one pass; prompt and verdicts in `PROMPTS.md`). It rated two as overstated, one of them only borderline, and two as supported.

| Sentence | Blind judge | A: Haiku / Sonnet | B: Haiku / Sonnet |
|---|---|---|---|
| report2: "The vestry *responded* by laying a rate for the poor, recorded on folio 38v." | Overstated | 0/3 / 2/2 | 3/3 / 2/2 |
| report4: "The test plan and the laboratory log *are reproduced* in the appendix." | Overstated, borderline | 0/3 / 0/2 | 2/3 / 0/2 |
| report1: "The appendix lists the software versions and configuration used, *so that the run can be repeated*." | Supported (the judge called the purpose clause "a mild stretch") | 1/3 / 0/2 | 3/3 / 0/2 |
| report2: "Folio and page references for every passage are given in the appendix, …" | Supported | 0/3 / 0/2 | 1/3 / 0/2 |

**Reading (exploratory, weak):**
- The whole difference is in **Haiku**. Haiku reviewers given C35 flagged these borderline sentences more often, both the ones the judge called overstated (5 of 6 flags against 0 of 6) and the ones it called supported (4 of 6 against 1 of 6). Sonnet reviewers did the same in both arms.
- Each count is sentences × runs, so the units are not independent. Pooled over both models, the comparison is 7 of 10 against 2 of 10 for judged-overstated sentences (Fisher exact p ≈ 0.07), and 4 of 10 against 1 of 10 for judged-supported ones (p ≈ 0.30).
- The "supported" reference is one judge's single pass, and the repeatability sentence is arguably a real stretch. So the precision side is as uncertain as the sensitivity side.
- The most this supports is a hypothesis: C35 may make a smaller model flag borderline wording more readily, in both directions. It is not a finding.

## What this means for C35

- C35 stays in the Skill, labelled: **pre-registered test at ceiling; no measured gain; a weak, Haiku-only, post-hoc signal**.
- A useful next test would build its material for subtlety and calibrate it with a pilot so the baseline is well below ceiling. It should pre-register both sensitivity and precision, judge every candidate sentence (not only flagged ones), and report per model.
- What did catch overstatement reliably today was a fresh reader told to check claim strength. It caught the R32 draft three times and this report once, five issues in all. That is a review step, not a line of skill text.

## Reproduce

```
node bench/2026-10-31-c35/score.mjs bench/2026-10-31-c35/key/key.json bench/2026-10-31-c35/reviews --out bench/2026-10-31-c35/RESULTS.md
```

The exploratory flag counts can be recounted from `reviews/` by matching quotes to the four sentences above; the judge's verdicts are in `PROMPTS.md`.
