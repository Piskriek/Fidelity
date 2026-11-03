# Night 1 Report — SQ Skill Benchmark, Reduce Skill & Pass R26

*Claude Opus 5.5, 2026-10-31, for Piskriek (owner) and Argon (overwatch). Everything here is reproducible from this folder.*

## The short answers

| Question | Answer |
|---|---|
| **Does the skill work?** | Partly. On this plan, Sonnet and Haiku caught the same planted defects with or without it (8/8 each). Its measurable benefits were the reference values it carries (it exposed the one plant that contradicts the skill's own text) and the CRC check, which caught a tampered shorthand block. I found **no reasoning lift**. |
| **Does it save tokens?** | **No.** It cost **+33%** tokens on Sonnet, **+21%** on Haiku (set A) and **+12%** on Haiku (hold-out), plus 2–4 extra minutes per run. Argon's "95–97% fewer tokens" comes from constants hardcoded in `v2EvaluateCrossTierModelDistillation`, not from a measurement. |
| **Can it be improved for Sonnet/Haiku?** | Yes, and done in v9.1: a **Document-Audit Mode** with the 12 checks that actually produced findings, a defined convergence rule, and a **Ripple Check** that gives Step 1.6 a meaning a text model can execute. For subagents there is also a compact `skills/sq-audit-card` at about a tenth of the context. The card is **untested**. |
| **Where does it fail under stress?** | (1) Its JEPA rollout, Lyapunov proofs and code-only checks cannot run on prose, and every model said so. (2) `ΔL_meta` and "Yield" were undefined, so one Haiku arm declared convergence with **fewer** findings (38) than the no-skill control (45). (3) Its automated gate passed a plan with planted errors: it caught **1 of 10** mutants. (4) The gate only ran inside Argon's sandbox. |
| **How do my results compare with theirs?** | The union beats any single reader. The agents found about 12 real defects I missed, including the 4 KB budget overflow, the wave-order inversion, the non-existent audit A5, the "Pythagorean" misnomer and the +5 J rest-cycle leak. I found what can't be seen in the plan text: the gate can't run off-sandbox, it passes known-bad plans, the benchmark numbers are hardcoded, and Drive corrupts the formulas. |
| **Do we need a Reduce skill?** | **Yes, as a separate tool, not a replacement.** Haiku+Reduce was the only arm to score 9/9 on the hold-out (it alone caught the orbital coverage gap H2). It also missed the KL sign flip on set A (7/8). Its wins came from its mechanical checks, not from regrowth, because one agent cannot regrow "blind" after reading the plan. Reduce v2 makes regrowth a **two-agent handoff of the reduced cards**. That part of your idea is still untested and is the next experiment. |

## What was run

1. **My own pass first** (`outputs/opus_reference.md`), written before reading any agent output: full read of all 3 artifacts and the audit script, plus `tools/verify_claims.mjs` (CRC-32, counts, span, package diff).
2. **Planted-defect benchmark, set A.** A copy of the plan with 9 known defects (`keys/answer_key_A.json`). Eight are detectable from the plan alone. P9 contradicts only the skill's text, so it measures what the skill *carries*, not how well a model reasons. Six arms ran on it: Sonnet and Haiku × {no skill, SQ skill v9, Reduce v1}.
3. **Hold-out, set B.** I wrote Reduce *after* seeing set A, so it could have been tuned to those defects. To check, I planted 9 different defects in other places (`keys/answer_key_B.json`) and ran Haiku × {no skill, SQ skill, Reduce}.
4. Every arm got the same definition of a defect, the same iteration rule (stop at 0 new or 3 passes), node for arithmetic, and a candid self-report section. Planted recall was scored from keyword candidates (`tools/score.mjs --show`), and **every hit was checked by hand**.

Models: the current Sonnet and Haiku available to Claude Code. The plan names Sonnet 4.6 and Haiku 4.5, which are older.

## Results

### Set A (9 plants; P9 needs the skill's text)
| Arm | Findings | Plants caught | Tokens | Time | New per pass |
|---|---|---|---|---|---|
| Sonnet, no skill | 46 | 8/8 | 135.7k | 6.0 min | 36 · 8 · 2 |
| Sonnet + SQ v9 | 52 | 8/8 + P9 | 180.3k (+33%) | 9.7 min | 28 · 16 · 8 |
| Sonnet + Reduce v1 | 45 | 8/8 | 157.7k (+16%) | 8.5 min | 26 · 17 · 2 |
| Haiku, no skill | 44 | 8/8 | 193.7k | 7.9 min | 36 · 8 · 0 |
| Haiku + SQ v9 | 50 | 8/8 + P9 | 233.5k (+21%) | 9.8 min | 31 · 10 · 9 |
| Haiku + Reduce v1 | 36 | **7/8** (missed KL sign) | 202.1k (+4%) | 8.4 min | 32 · 4 · 0 |

### Set B, hold-out (9 plants, all detectable from the plan)
| Arm | Findings | Plants caught | Tokens | Time |
|---|---|---|---|---|
| Haiku, no skill | 45 | 8/9 (missed H2) | 186.4k | 7.2 min |
| Haiku + SQ v9 | 38 | 8/9 (missed H2); **declared convergence** | 209.0k (+12%) | 7.9 min |
| Haiku + Reduce v1 | 47 | **9/9** | 201.0k (+8%) | 8.2 min |

### Pre-existing defects (not planted), confirmed by hand
| Defect | Sonnet ×3 arms | Haiku ×3 arms | Me |
|---|---|---|---|
| Ledger 70 vs 74, 32 vs 41 sub-branches, stale light-year span, homeless packages, self-failing CI gate | all | all | yes |
| 4 KB shorthand budget overflows at full caps (≈ 6.3 KB) | all | all | **missed** |
| PH integrator: missing Δt / double implicit | all | partial | yes |
| ω·distance phase (rad/s × m) | no-skill and SQ | none | yes |
| Child-universe seed collisions | all | none | yes |
| `@hm/sq-jepa` built in Wave 2, before its Wave 4 dependencies | SQ only | none | found later |
| Audit gate can't run off-sandbox; passes planted errors; hardcoded benchmark; Drive corrupts LaTeX | — (not in their inputs) | — | yes |

**Reading the tables:** model tier matters far more than the skill. Sonnet arms caught physics and units defects (integrator, phase units, seed collisions) that no Haiku arm caught, with or without a skill. This is n = 1 per arm, and the planted defects proved easy, since nearly every arm hit the ceiling. The numbers can refute the claimed 34% → 91.5% lift, but they cannot measure small effects.

### Argon's model vs the measurement
| | Modeled (hardcoded) | Measured |
|---|---|---|
| Haiku without skill | 34% | 89–100% |
| Haiku with skill | 91.5% | 89–100% (same as without) |
| Token change with skill | −95% to −97% | **+12% to +21%** |
| Passes | 11 → 2 | 3 → 3 (no arm converged faster) |

## The audit gates

- `adversarial_red_team_v9_audit.mjs` read its inputs from `/working_dir/c_9eee056efdcd0303/…` (Argon's VM), so it failed at B61 on any other machine. **Fixed** (`B97`).
- With that fixed, it reported `twoZeroConvergenceAchieved: true` on a plan with six planted content errors. Its document checks only test that tokens such as "74 / 74" are present. `scripts/mutation_test_audits.mjs` shows the v9 suite caught **1/10** mutants (the one inside the CRC block).
- New `scripts/triad_semantic_audit.mjs` (S1–S14) recomputes what the documents claim. It catches **10/10** mutants and passes 14/14 on the fixed triad. Its 14 checks are pinned to defects already found, so it is a regression net, not a replacement for a reasoning pass.

## What changed in the triad (Pass R26)

- **Plan:** 25 defects fixed (`B75–B99`) and 18 logged as **OPEN** (`B100–B117`) with a register in §8.1. Highlights: ledger and counts, light-year span, a Package Home Map for 16 homeless packages, CI gate scope, PH Δt plus passivity preconditions, wavenumber and pressure units, zero-denominator guards, nemesis-tier and `runaway` definitions copied from the reference code, `@hm/sq-jepa` moved to Wave 4, a measured Wave 7, and an honest SQ-JEPA implementation note.
- **Skill v9.1:** Document-Audit Mode, defined ΔBugs/ΔL_meta, the Ripple Check, C20/C24 wording fixes, and new checks **C27–C31** (semantic gates with mutation tests, portable gates, measured-not-modeled, lossless canonical storage, dimension/positivity/budget probes).
- **Resume:** new ledger, an R26 shorthand episode with its CRC-32 tail recomputed (`0xE623A650`), and a wake-up prompt that points at GitHub and both gates.
- **Canonical source:** the 3 files now live as `.md` in GitHub. The Drive copies had lost every LaTeX `_` pair to italics, plus the frontmatter and code fences. I restored them from the italic-run boundaries in the `.docx` (`tools/docx2md.mjs`).

## Decisions waiting for you (18 OPEN; the first two block Wave 2)

1. **B100** — PH integrator: Cayley resolvent *or* implicit midpoint, not both.
2. **B102** — the 4 KB shorthand budget can't hold full caps (≈ 6.3 KB). Raise the budget, lower the caps, or define what gets dropped first.
3. **B101** — nemesis tiers saturate above score 3 (70% of the 0–10 range is one tier). Is that intended?
4. **B107** — the rest cycle restores 30 J from nowhere (net +5 J). Where does it come from?
5. **B104** — the child-universe seed ignores Vtx and Aq, so different parents collide.

The rest are in Plan §8.1.

## Caveats

- n = 1 per arm, two plans, and easy plants (ceiling effect). Treat these as refutations of large claims, not as estimates of small effects.
- I designed the plants and the Reduce skill. The hold-out was meant to limit that bias; it doesn't remove it.
- The improved skill text (v9.1), the audit card and Reduce v2 are **untested**. They follow what the agents reported, but none were benchmarked.

## Next experiment (proposed, not run)

Run three seeds per plan, with harder plants (multi-step derivations, cross-section seams, plants inside long tables), at least 3 runs per arm, and four arms: no skill / full v9.1 / `sq-audit-card` / Reduce v2 with a real two-agent blind regrow. Score precision as well as recall: have a judge sample 20 findings per arm and mark false positives.

## Paste-ready note for Argon

> Argon — Opus here, Pass R26 is on GitHub (branch `opus/night-1-skill-benchmark`). Three things to know before your next pass: (1) the v9 audit only ran in your sandbox, and its document checks pass plans with planted errors (1/10 mutants caught). `scripts/triad_semantic_audit.mjs` and `scripts/mutation_test_audits.mjs` now gate the triad, so please run both. (2) `v2EvaluateCrossTierModelDistillation` returns hardcoded numbers. The measured benchmark is in `bench/2026-10-31/`: no lift, +12–33% tokens. (3) Drive's markdown import eats LaTeX `_` pairs, so treat GitHub `.md` as canonical (C30). 18 design items are OPEN in Plan §8.1; B100 and B102 block Wave 2.
