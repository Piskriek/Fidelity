---
name: reduce
description: Reduce a large or jargon-dense plan to its base elements, check those elements mechanically, then have a fresh reader regrow the detail one level at a time from the elements alone and diff it against the original. Use when a plan is too big to audit directly, when repeated audits keep finding new bugs, before committing to an approach, or when you need a view that is not anchored on the author's framing.
---

# Reduce → Check → Blind Regrow → Diff (v2)

Dense plans hide defects: terms of art stand in for mechanisms, numbers repeat across sections and drift, and "verified" claims stand in for evidence. Reducing turns every claim into something checkable. Regrowing from the reduced form, by a reader who never saw the original, shows what the plan leaves out and what it carries for no reason.

v2 changes come from the 2026-10-31 benchmark (`bench/2026-10-31/REPORT.md`): cards trimmed to the fields that paid off, a much stronger mechanical check list, and regrowth moved to a fresh context, because a reader who has seen the original cannot regrow blind.

**Measured on set C (`bench/2026-10-31-c/`):** a Haiku regrower that only saw the cards caught 9 of 10 planted defects. That was the best Haiku result, and it was the only Haiku arm to fully catch a flipped stability gate. The two-reader pipeline cost about 2.3× a single run. Use it when a fresh angle is worth that much, not as the default audit.

## Step 1 — Reduce to a ladder (the "base fractional elements")
- **R0** (1 sentence): what the system is for, and how you would know it works.
- **R1** (≤ 7 elements): the subsystems, each as noun + verb.
- **R2** (one card per element). Two fields are required:
  - **State**: each quantity with its **unit and range**.
  - **Numbers**: every constant, threshold, cap, count, total and weight the plan states, with its location.
  - Add Operators (`name(inputs) → outputs`), Invariants (testable statements) or Evidence only when a check below needs them.
- **OPAQUE**: mark a term OPAQUE only when it appears in a formula, invariant or interface and you cannot restate it operationally. Framing and lore vocabulary is not a finding.

Write R0–R2 to a file (`reduce_cards.md`). The file is the handoff to Step 3.

**Point-cloud variant (when the plan has its own structural laws).** Write the cards as data rather than prose: every operator (home, what it raises or lowers, what it calls, its test) and every stateful quantity (unit, range, persistence, save path). Then let a script apply the plan's own laws and list the empty cells. In Fidelity this is `spine/fidelity_point_cloud.json` + `scripts/fractal_gap_map.mjs`: every quantity that only moves one way needs a dual, every persistent value needs a save path, every package needs a supplier and a host. Proposed fills can be applied as an overlay and the map re-run ("regrown") to see which holes they close and which new ones they open.

## Step 2 — Mechanical checks (run on the cards; use code for arithmetic)
1. **Recount**: counts in headings vs items listed, ledger totals vs rows, "N items" vs the list.
2. **Sums and identities**: weight sets that should total 1; stated products and factorizations.
3. **Units**: the unit of every term in each sum, min/max and comparison. Flag mixed units and unitless thresholds.
4. **Positivity and monotonicity probe**: evaluate every "≥ 0", "decreasing" or "converges" claim at 0, at a point below baseline, and at an extreme.
5. **Breakers**: for every division, log, root and exponent, name the input that breaks it (0, empty, negative, NaN, huge) and the guard or cap.
6. **Examples vs caps**: do the plan's own example values respect its own ranges and caps?
7. **Reachability**: do the plan's own named extremes (materials, scales, presets) fit inside its clamps and ranges?
8. **Budgets**: every cap × worst-case item size vs every byte, time or memory budget.
9. **Boundaries**: every threshold at exactly `x = a` and on both sides (gaps, overlaps, discontinuities).
10. **Seams**: producer field names and types vs consumer grammar, exactly.
11. **Homes and order**: every named package, file and function has a home; nothing is built before what it calls.
12. **Floating point**: exact `===` on computed reals, counters past 2^53, float32 where precision below ~1e-7 matters.
13. **Evidence**: every "verified / benchmarked / 0 defects" claim has something in hand that reproduces it; otherwise mark it `UNSUPPORTED`.

## Step 3 — Blind regrow (fractional expansion, one rung at a time)
**Protocol: two readers.** Hand `reduce_cards.md`, and nothing else, to a fresh agent (subagent or new session) that has never seen the plan. It regrows one rung at a time:
1. From R0 + R1, write what each element must do and how it connects to the others (interfaces, data flow, build order).
2. From each R2 card, write the minimum an engineer needs to implement it: formulas, types, boundary behaviour (≤ 10 lines per element). Stop at any element whose card does not give enough to proceed, and record that as a `GAP`.

Then the original reader diffs the regrowth against the plan:
- In the plan, missing from the regrowth, and serving no invariant → `ORNAMENT` (cost without function) or a hidden assumption.
- In the regrowth, missing from the plan → `GAP` (the plan leaves a decision to the implementer).
- In both, but different → `CONFLICT` (find out which one is wrong).
- The plan claims X, and the regrowth cannot derive X → `UNSUPPORTED`.

If no second reader is available, label the diff **contaminated**. For formulas, derive the correct form yourself first, then diff ("derive-then-diff").

## Step 4 — Verdict on the approach (≤ 5 lines)
Does the R1 set serve R0? Which element carries the most risk? What is the smallest experiment that could falsify the approach? Which elements are ornament that could be cut?

## Output
1. Findings: `Location | Type (CONFLICT/GAP/UNSUPPORTED/OPAQUE/ORNAMENT/MATH) | Finding | Evidence | Computed by code? (y/n) | Severity H/M/L`
2. The R0/R1 ladder (≤ 15 lines) and the verdict.
3. The checks you did **not** run, and whether Step 3 was blind or contaminated. Never claim convergence beyond what you checked.

## Stopping
A sweep is Step 2 plus the Step 3 diff. Stop when a sweep adds no High or Medium findings, or at the sweep cap. Report any remaining Low items as unconverged.
