# Count & Identity Audit (Pass R30)

*Claude Opus 5.5, 2026-10-31. Follows `bench/2026-10-31-tools/` (formula spine, mutant generator).*

## Why

R29's survivors included about 21 Plan numbers whose doubling breaks a stated count or identity, such as 4 + 28 = 32 slots, 14 zones = 7 × 2, "22 Archetypes" or a 4096-byte limit stated twice. No gate read them. The Method Mirror lists "counts / arithmetic" and "cross-artifact drift" as classes with no mechanical detector, and names a constant clusterer as the missing tool.

## What it checks (`scripts/count_identity_audit.mjs`, advisory)

Rules written to be generic. Some phrase patterns still come from this triad: rule C's "Capped at … top … +" and "`1..7:L|R`" forms, and a stop list that includes corpus words such as `arm` and `planted`.

| Rule | Checks |
|---|---|
| A arithmetic | Numeric equality chains inside math evaluate equal, including a parenthetical restatement. Sides in different units are conversions and are skipped. |
| B repeats | A counted noun carries one number everywhere in the corpus. The noun is the first plural word after the count. Labels, `key=value` fields, history rows, totals ("24 robots in total") and measurements ("16 tiles wide") are not restatements. |
| C compounds | "N zones (`7 Rays x L/R`)" or "(7 × L/R)", "N zones `1..7:L\|R`", "Capped at N slots: top a … + b". |
| D typed arrays | `Uint32Array(128)` against its stated bytes and bits. |
| E percents | An unsigned share is at most 100% (ratios such as zoom, CPU and growth excepted); a range runs low to high. |
| F derived | A number introduced as derived ("that is", "i.e.", "which is", "yields", "totals", "therefore") equals a restatement, product, quotient, run sum, mean or share of the 15 numbers before it. "i.e." and "which is" need an input in the same sentence. Unit conversions and years are skipped. |
| G table totals | A Total/Sum row equals the sum of its column (subtotal rows, and max/min/mean/rate columns, handled). |
| H partitions | "N things: a X, b Y and c Z" sums (unless N counts the parts); shares listed as "a% X, b% Y and c% Z" that nearly make a whole sum to 100%. |
| I powers | A number restated as `$2^{k}$` after a comma, "=" or "i.e." equals 2^k. |

**It is advisory.** A finding says two stated numbers disagree, not which one is wrong. Correct prose can trip it, so a line marked `<!-- counts:ok -->` is skipped and CI runs it without blocking (`continue-on-error`). The review found the first version too brittle to block: one-sentence correct snippets that failed it, and messages that blamed the correct number.

**Defects it found in the triad:**
- **`B175`, on its first run:** the Skill called the Plan a "6-Wave Engineering Build Plan" while §4.2 lists 7 waves. `B90` (R26) fixed only the Plan.
- **After the review removed `defect` from its stop list:** a stale "174-defect ledger synced" cell that this pass itself had just left in the Resume, beside "175-Defect Ledger". Fixed before commit.

## Measurement

Generic rules can still be overfitted to the text they were written against (R29's lesson). The audit was measured on three corpora at increasing distance. The test was run on a frozen copy: `audit_frozen.mjs`, whose hash is in `FROZEN_AUDIT.sha256`. Session timestamps put that hash before the test corpus was written; the repo itself cannot prove the order.

| Corpus | Written by | Role | Bound-number mutants caught | Free-number mutants flagged |
|---|---|---|---|---|
| This triad (Plan Parts 1–7, integer ×2) | — | **train**: rules written after surveying its count corpus | 13 of 89; 7 of the ~21 identity-breaking R29 survivors | — |
| `dev_reefloom/` (coral-reef simulator) | Sonnet, never saw the audit | **development**: rules generalised against it after a first draft caught none of its bound numbers (in an earlier version of the harness) | 66% (×2), 72% (+1) | 0 of 66 |
| `test_corvid/` (warehouse robot fleet) | Haiku, never saw the audit or the other corpora | **test**: frozen audit | **9/25 (×2), 10/20 (+1), 0/5 (decimal +10%)** | 4 of 61, all percentages pushed past 100% |

**What the test catches are made of.** `RESULT_test_corvid.md` attributes each catch to the rules that fired:
- **5 are rule E**: a share pushed past 100%. These are real errors, but not agreement checks.
- **7 are rule B, plus 1 that is B and F together.** They come from a guard: a noun carrying two repeated counts ("240 robots", "12 robots") is skipped. Mutating one switches the guard off, and B then flags every mention, including correct ones.
- **6 are rule F** (derived numbers). 5 of these are at the changed number, such as the 256 = 64 × 4 frame payload and 65,536 = 2^16. One is an accidental flag elsewhere: 8 → 9 shift hours broke an unrelated "which is 12" that had only passed because 96 / 8 = 12.

Also, 8 of the test corpus's 33 bound key entries are number words ("four", "three", "five") that the eval never mutates. The reviewer's stricter count puts recall on bound numbers at about 22%: E catches excluded, number-word entries counted as misses. Cross-file restatements were caught 0 of 10 on the development corpus and 4 of 10 on the test corpus, all through the guard.

**So the honest headline:** on text it has never seen, the audit catches roughly a quarter to a third of number errors that break a stated agreement, with no spurious flags on free numbers. Its genuine agreement checks are the derived-number and power-of-two rules. Its cross-file restatement check is weak.

### What the test corpus shows it misses

- **Splits stated without a cue or colon**: "North Hall carries 96 robots and South Hall carries 144" (of 240).
- **Decimal identities**: 14.4 V = 4 cells × 3.6 V, and 93.6 Wh = 14.4 × 6.5. The count rules skip decimals by design.
- **Shares in a table with no Total row**: 55 / 20 / 15 / 10%.
- **Number words**: "three shifts of 8 hours each, so … 24 hours".
- **An accidental match**: doubling the 256-byte payload to 512 matched another product of nearby numbers. At the triad's two checked cue sites, 34–45% of all integers from 1 to 200 count as "derivable" from the 15 numbers before them; in the test corpus it is 26–29%. The wider the derivation search, the more of these.

## After the review (not held out)

The review's snippets and attribution led to the advisory mode, the suppression marker, neutral messages, and fixes:
- numbers with several thousands separators;
- conversions between units of one family;
- the first plural word as the noun;
- totals and measurements;
- items-then-sizes lists;
- table subtotals and rate columns;
- ratio percentages;
- same-sentence inputs for "i.e." and "which is".

These were tuned on cases already seen, so their effect is in-sample:

| Check | Frozen audit | After the review |
|---|---|---|
| Reviewer's correct-text snippets that fail | 27 of 29 | 3 of 29 (staging vs production node counts ×2, a four-factor product) |
| Reviewer's missed-defect snippets caught | 0 of 9 | 7 of 9 (missed: an accidental derivation, an ambiguous "480 robots today") |
| Development corpus, bound ×2 / +1 | 66% / 72% | 59% / 66% (`RESULT_postreview_dev_reefloom.md`) |
| Test corpus, bound ×2 / +1 | 36% / 50% | 36% / 50% (`RESULT_postreview_test_corvid.md`) |
| Clean triad and both clean corpora | pass | pass (one correct Plan line marked `counts:ok`: 8 of the 9 planted defects were detectable from the plan alone) |

The next honest measurement of the revised audit needs a fresh corpus again.

## In-sample effect on the Plan

`MUTANTS_with_counts.md` repeats R29's every-site run with the (revised) audit as a fourth gate. It is in-sample: the audit's rules were written after reading this triad.

| Exposure (R29 tiers, spine authors) | Mutants | Caught, 3 gates (R29) | Caught, + count audit |
|---|---|---|---|
| All | 307 | 162 (53%) | 169 (55%) |
| Shown | 89 | 71 | 72 |
| Seen | 161 | 84 | 84 |
| Unseen | 57 | 7 (12%) | 13 (23%) |
| — outside every spine entry | 53 | 3 (6%) | 9 (17%) |

The audit makes 14 catches in all; 7 of them no other gate makes, and survivors fall from 145 to 138. Those 7 are the identity breaks the rules were written for: the 4 + 28 slot split, 14 zones = 7 × 2, three "22 Archetypes" mentions, "10 harder plants" restated, and the "89–100%" range. That is 7 of the ~21 identity-breaking survivors. The rest are still missed: the second statement of 4 + 28, the 4096-byte limit stated twice, the caps sum (32 + 16 + 14 + 8), "#22 The Fool", `invokeArchetypeAtWill(22)`, "21 SQ Antidote Presets" and others phrased in ways no generic rule reads. Exposure tiers here belong to the spine's authors; for the audit, the whole triad is training text.

## Reproduce

```
node scripts/count_identity_audit.mjs                     # advisory (exit 1 on any finding)
sha256sum -c bench/2026-10-31-counts/FROZEN_AUDIT.sha256
node bench/2026-10-31-counts/eval_heldout.mjs bench/2026-10-31-counts/audit_frozen.mjs bench/2026-10-31-counts/test_corvid
node bench/2026-10-31-counts/eval_heldout.mjs scripts/count_identity_audit.mjs bench/2026-10-31-counts/test_corvid
node bench/2026-10-31-counts/eval_plan.mjs scripts/count_identity_audit.mjs .
```

## Caveats

- One development and one test corpus. Both were written by LLMs to a brief that named the kinds of bound numbers, so they are in-distribution by design.
- Small samples: 45 integer and 5 decimal mutants of bound numbers in the test corpus.
- The keys are the writer agents' own labels.
- The Method Mirror files `B175` under "counts / arithmetic" because of its wording; it is a cross-artifact drift. The classifier is keyword-based.
- The Skill's Recount step still needs a human or LLM for counts against enumerated lists, and for defect totals beyond the status lines S1 checks.
