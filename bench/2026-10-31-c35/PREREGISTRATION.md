# Does Skill C35 (Claim Strength) help reviewers? Pre-registration

*Written before any draft, review or score existed. Claude Opus 5.5, 2026-10-31.*

## Question

C35 tells a reviewer to check each claim's strength label (held-out, in-sample, verified source, inference, design) as well as the claim. It was adopted because every fresh-reader review in Passes R29–R31 found true claims labelled stronger than their evidence. It has not been measured. Does giving reviewers C35's text make them catch more over-labelled claims, at an acceptable cost?

## Materials (held out)

A writer agent that has not seen C35, the Skill or this repository writes four short reports in different domains. Each report has an evidence appendix (data tables, test logs, quoted source passages) and a body of about 12 claims about that evidence:

- **over-label**: about 5 per report, stated with more strength, scope or certainty than the appendix supports, though not simply false;
- **control**: about 5 per report, labelled correctly for the appendix;
- **distractor**: about 2 per report, plain errors of fact or arithmetic against the appendix.

The writer records each claim's exact sentence and kind in `key.json`. The writer was briefed on over-labelling in general terms only; the brief is in `drafts/BRIEF.md`.

## Arms

| Arm | Prompt |
|---|---|
| A (baseline) | A generic review prompt: find problems in each report against its appendix; quote the exact sentence for each finding. |
| B (C35) | The same prompt plus C35's text from the Skill, verbatim, and "apply this check". |

Models: Haiku × 3 runs per arm and Sonnet × 2 runs per arm (10 reviewers). Each reviewer reviews all four reports in one run and writes findings as JSON (`report`, `quote`, `problem`). Reviewers see only the drafts, not the key.

## Scoring (mechanical, `score.mjs`)

A finding counts for a claim when its quote overlaps that claim's sentence (one contains at least 25 consecutive characters of the other, after normalising whitespace and quotes). Per arm, pooled over runs and reports:

- **over-label recall**: share of over-label claims flagged;
- **control false-flag rate**: share of control claims flagged;
- **distractor recall**: share of distractor claims flagged;
- **unmatched findings**: findings that match no key claim (reported, not scored).

## Pass criterion (fixed now)

C35 is judged to **help** if, pooled over all ten reviewers' arm assignment (arm B minus arm A):

1. over-label recall rises by at least 15 percentage points; **and**
2. the control false-flag rate rises by no more than 10 points; **and**
3. distractor recall falls by no more than 10 points.

It is judged to **not help** if over-label recall rises by less than 5 points. Anything between is **inconclusive**. Results are also reported per model, with a bootstrap 95% interval over reports × runs, because the sample is small (about 20 over-label claims, 5 runs per arm).

## Known limits

- One writer, four reports: the over-labels are of the kinds that writer thought of.
- The writer was told what an over-label is, so the plants are in-distribution for C35 by design. This measures whether C35 makes reviewers *look* for a thing that is there, not whether such things occur naturally.
- C35's author designed this test.
