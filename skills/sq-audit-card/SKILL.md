---
name: sq-audit-card
description: Compact document-audit card distilled from sq-distortion-check v9.1 for Sonnet/Haiku subagents auditing a plan, spec or handoff document. Twelve mechanical checks, a preset-to-test map and a convergence rule, at roughly a tenth of the full skill's context cost. Use the full SQ_DISTORTION_CHECK_V9_SKILL.md when auditing code or running the triad loop.
---

# SQ Audit Card (v9.1 Document-Audit Mode, compact)

You are auditing a document, not running code. Report defects that would break an implementation: math, units, contradictions, missing guards, cap violations, schema mismatches, boundary gaps, homeless references, unsupported "verified" claims. The creative or cosmological framing is not a defect.

## Check 0 — Purpose first (`why=`)
Before any arithmetic, write each rule's purpose in at most 6 words (`why="masked actors stay anonymous"`), specific enough to fail, then ask whether the rule as written serves it. This catches inverted logic (`true`/`false`, `min`/`max`, `≥`/`≤`) that arithmetic checks miss. On set C it was the only Haiku method to catch the inverted mask law.

## Checks (use `node -e` for every number)
1. **Recount** headings, "N items" and ledger totals against what is listed.
2. **Sum** weight sets that should total 1, and recompute every stated identity.
3. **Units** of each term in every sum, min/max and comparison.
4. **Positivity probe**: test every "≥ 0" or "decreasing" claim at 0 and below baseline.
5. **Breakers**: every division, log, root and exponent. What input breaks it? Is there a guard?
6. **Examples vs caps**: the document's own examples against its own ranges.
7. **Budgets**: cap × worst-case size vs every byte/time/memory budget.
8. **Boundaries**: every threshold at exactly `x = a` and on both sides.
9. **Seams**: producer field names vs consumer grammar, exactly.
10. **Homes and order**: every named package/file/function has a home; nothing is built before what it calls.
11. **Cross-document constants**: the same constant has the same value everywhere.
12. **Evidence**: "verified / 0 defects / benchmarked" must point to something that reproduces it, or it is UNSUPPORTED.

## Preset → test map (name findings with the preset if you like; the test is what counts)
| Preset | Test |
|---|---|
| `[root-apathy]` | 5 Breakers, 10 Homes (placeholders, unwired modules) |
| `[root-reactivity]` | 5 Breakers (empty arrays, first-element access) |
| `[sacral-addiction]` | 5 Breakers + 7 Budgets (unbounded growth, missing caps) |
| `[sacral-repression]` | 5 Breakers + 9 Seams (NaN masked by clamps, dropped fields, energy with no source) |
| `[solar-control]` | 12 Evidence + 5 Breakers (unverified data, NaN slipping past `>` checks) |
| `[solar-projection]` | 8 Boundaries + 3 Units (happy-path-only domains, untested composition) |
| `[solar-pride]` | 12 Evidence + float precision (trusting prior claims, 2^53 / float32 limits) |
| `[throat-actualization]` | 11 Cross-document constants (agreeing with a false premise) |
| `[thirdeye-illumination]` | Ornament: detail that serves no invariant |

## Output
`| # | Location (section + line) | Check # | Defect | Evidence (quote or computed value) | Severity H/M/L | Confidence 0-1 |`, then one line per pass with the number of new findings, then the checks you could not run.

## Convergence
Converged = two consecutive passes with **different lenses** (e.g. section order, then check order) add 0 High/Medium findings. One reader rereading the same text is saturation, not convergence. Never report latent energies or "Yield == 0" for a document.
