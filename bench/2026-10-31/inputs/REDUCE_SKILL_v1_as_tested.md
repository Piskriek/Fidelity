---
name: reduce
description: Reduce a large or jargon-dense plan to its base elements, check those elements, then regrow the detail one level at a time and diff it against the original. Use when a plan is too big to audit directly, when repeated audits keep finding new bugs, or when you need a perspective that isn't anchored on the author's framing.
---

# Reduce → Check → Regrow → Diff

Dense plans hide defects: terms of art stand in for mechanisms, numbers repeat across sections and drift, and "verified" claims replace evidence. Auditing at full resolution anchors you on the author's framing. Reducing forces every claim into a checkable statement. Regrowing shows which details carry weight and which are missing.

(In SQ terms: Reduce is the Matrix collapse to Rung 1, Regrow is the Potentiator expansion, and the Diff is the Lateral-Dual check.)

## Step 1 — Reduce to a ladder
- **R0** (1 sentence): what the system is for, and how you would know it works.
- **R1** (≤ 7 elements): the subsystems, each as noun + verb.
- **R2** (one card per element, working memory, not output):
  - State: each quantity with **unit and range**
  - Operators: `name(inputs) → outputs`
  - Invariants: what must always hold, written as a testable statement
  - Numbers: every constant, threshold, count and total the plan states, **with location**
  - Evidence: how the plan says it is verified (test, script, citation, none given)
- **Translation rule:** restate every metaphor or term of art in plain operational words. If you can't, mark it `OPAQUE`. That counts as a finding.

## Step 2 — Check the elements (on the cards, not the prose)
1. **Cross-card number table:** the same quantity with two values, units or ranges anywhere in the document?
2. **Operator breakers:** for every division, log, root, exponent and power, which input breaks it (0, empty set, negative, NaN, very large)? Is there a guard or cap?
3. **Self-consistency of examples:** do the plan's own example values respect its own caps and ranges?
4. **Seams:** for every producer → consumer pair, do the field names and types match exactly?
5. **Recount:** recompute every count, total, weight sum and arithmetic identity the plan states. Use code if you can.
6. **Evidence:** for every "verified / benchmarked / proven / 0 defects" claim, is the evidence present in what you were given? If not, mark it `UNSUPPORTED`.
7. **Homes:** does every R1 element and every named package or file have a defined location and a test?
8. **Boundaries:** at each threshold, what happens exactly at the boundary and just on either side (gaps, overlaps, discontinuities)?

## Step 3 — Regrow (fractional expansion)
For each element, starting from your card and **without re-reading the original section**, write the minimum detail an engineer needs to implement it: formulas, types, boundary behaviour. Keep it to ≤ 10 lines per element. Then diff your regrowth against the original:
- In the original, missing from yours, and serving no invariant → `ORNAMENT` (cost with no function) or a hidden assumption.
- In yours, missing from the original → `GAP` (the plan leaves a decision to the implementer).
- In both, but different → `CONFLICT` (work out which one is wrong).
- The original claims X, and you can't derive X → `UNSUPPORTED`.

## Step 4 — Verdict on the approach (≤ 5 lines)
Does the R1 set serve R0? Which element carries the most risk? What is the smallest experiment that could falsify the approach? Which elements are pure ornament that could be cut?

## Output
1. Findings table: `Location | Type (CONFLICT/GAP/UNSUPPORTED/OPAQUE/ORNAMENT/MATH) | Finding | Evidence | Severity H/M/L`
2. The R0/R1 ladder (≤ 15 lines) and the verdict.
3. A list of what you did **not** check. Never claim convergence beyond what you actually checked.

## Stopping
Stop regrowing an element once your regrowth matches the original with no CONFLICT or GAP. Stop the whole run when a full Step 2 sweep adds nothing new.
