# Method Mirror, Formula Spine & Mutant Generator (Pass R29)

*Claude Opus 5.5, 2026-10-31. Follows `bench/2026-10-31/` (skill benchmark) and `bench/2026-10-31-c/` (harder plants, gap map, Law of One mirror).*

## Why this pass exists

The Reduce skill and the gap map worked because they turn prose into a structure where a defect becomes a mechanical signal. The owner asked the obvious next question: if one algorithmic tool works, what about its siblings, and why was that leap not made automatically?

**Why it wasn't made.**
- Each tool was built to answer one failure; none came from asking which *family* of tools had worked.
- The framework already says every preset, including the skill itself, is a holon (Step 0.5). But we only pointed it at the plan, never at our own toolkit.
- The benchmark's own self-reports said Reduce's wins came from its mechanical checks. Nobody asked the next question: which other mechanical transforms exist?

## Method Mirror (`scripts/method_mirror.mjs`, added in Pass R28; Skill C34)

The gap map turned on the toolkit: each of the 100 defects in the Plan's §8.1 register (`B75`–`B174`, logged since Pass R26) is classified by the kind of check that exposes it, then marked with the tools that catch that class mechanically. **56 of the 100 sit in classes with no whole-class mechanical detector**: canon citations (14), units (8), evidence (6), counts and arithmetic (6), boundaries and thresholds (4), state machines (4), cross-artifact drift (4) and unclassified (10). R29 credits the formula spine as guarding *known instances* in six classes (units, sign/logic, round-trips, guards, boundaries, counts). That does not change the 56, and the measurements below confirm why: a new defect in a formula nobody has written a spec for is still caught only by an LLM reader. Classification is by keyword and approximate (`spine/METHOD_MIRROR.md`).

## Formula Spine (`scripts/formula_spine.mjs`)

47 of the plan's formulas and rules, each with its stated purpose (`why`). For each one, the script reads its parameters from the Plan text (signs, min/max, inequality directions, constants, units, types, enum members), rebuilds it as code, and tests its behaviour: sign and monotonicity, round-trips through stated inverses, units and scale, boundaries, and stated identities. 46 are behavioural tests. One (F15) is a text pin that only checks a bound is still written; pin failures print as `FAIL(pin)`. If the formula text moves or changes shape, the check reports DRIFT instead of passing silently. `--spans` prints where each entry's text sits in the Plan, including other Plan text its test reads.

| Test | Result |
|---|---|
| Current Plan (R29) | 47/47 pass |
| Set-C plan (10 hard plants, `bench/2026-10-31-c/`) | 10/10 plants caught, zero tokens (`node bench/2026-10-31-tools/setc_spine.mjs`). **In-sample**: F01–F28 were written after the set-C plants were known, so this shows the specs encode those plants, not that they generalise. The spine also flags three real R26-era defects that later passes fixed: the breadcrumb clamp, the coercion gate and the Float32 stop test. |
| Best LLM arm on the same plants (`bench/2026-10-31-c/results.json`) | Sonnet, no skill: 10/10, 132.6k tokens (one run). Best Haiku arm (`why=`): 9.5/10, 175k tokens. Not in-sample. |

## Automatic Mutant Generator (`scripts/mutant_generator.mjs`)

It applies 13 mutation operators across Plan Parts 1–7, outside code blocks: min↔max, ≥↔≤, `>=`→`>`, true↔false, swapped subtraction, −↔+ (every sign inside a math span), coefficient ±0.1, integer ×2, unit swaps, dropped guards, type swaps, exponents and enum members. Gates run on every mutant: semantic audit, gap map `--strict` and formula spine (the v9 suite only with `--with-v9`). A gate crash or timeout is listed separately and never counted as a catch.

**Exposure tiers.** A spec written after seeing a defect will catch that defect. The question is what it catches that nobody showed it. So every mutant is sorted by how much a spec author had been shown at that spot:
- **shown**: the exact site was shown to a spec author. That covers the first seed-42 sample that F29–F47 were written against (`tuning_sites_seed42.json`, reconstructed from the R28 plan by `tuning_sites.mjs`) and the set-C plant sites an operator reproduces (`plant_sites_setC.json`, by `plant_sites.mjs`). Sites are matched by operator plus 40 characters of context.
- **seen**: in the formula around a shown site (its math span, or its line), or in the text of a spine entry that holds a shown site or whose author was shown a defect (`--shown-specs`: the 10 set-C plant entries and the 17 more that review rounds probed or fixed), including the other Plan text that entry's test reads.
- **unseen**: none of the above.

Reproduce (about 5 minutes):

```
node scripts/mutant_generator.mjs --all-sites \
  --tuned-file bench/2026-10-31-tools/tuning_sites_seed42.json,bench/2026-10-31-tools/plant_sites_setC.json \
  --shown-specs F01,F02,F05,F06,F07,F08,F09,F10,F11,F12,F13,F14,F15,F16,F17,F19,F20,F25,F26,F29,F35,F36,F37,F41,F43,F44,F46 \
  --out spine/MUTANTS_all_sites.md
```

| Exposure (every site mutated once) | Mutants | Caught by any gate | Spine proved | Only DRIFT or a pin | Without the spine |
|---|---|---|---|---|---|
| All | 307 | 162 (53%) | 107 (35%) | 49 (16%) | 19 (6%) |
| Shown | 89 | 71 (80%) | 51 (57%) | 17 (19%) | 5 (6%) |
| Seen | 161 | 84 (52%) | 52 (32%) | 32 (20%) | 7 (4%) |
| **Unseen** | **57** | **7 (12%)** | **4 (7%)** | **0** | **7 (12%)** |
| — inside some spine entry's text | 4 | 4 | 4 | 0 | 4 |
| — outside every spine entry | 53 | 3 (6%) | 0 | 0 | 3 (6%) |

How to read the columns:
- **Caught by any gate**: at least one gate exited non-zero.
- **Spine proved**: a behavioural spine test failed (probe, round-trip, unit or identity). Pin hits are not counted here.
- **Only DRIFT or a pin**: the spine could no longer read the formula, or only found a pinned bound missing, and nothing else caught it. That stops the gate, but it is not proof of a defect. At least 9 of these are `10^{-k}` → `20^{-k}` edits that DRIFT only because the extractors expect `10^`.
- **Without the spine**: caught by the semantic audit or gap map alone.

## What the tiers say

- **On text no spec author was shown, the spine catches nothing the older gates miss.** All 4 unseen mutants it proves are also caught by the older gates, and outside every spine entry it catches none of 53.
- **Its value is regression protection.** It reliably re-catches defects its authors were shown (80% of shown sites; 57% proven). It partly generalises within those formulas: 52% of other sites there, 32% proven. That figure still contains 20 proven kills that re-create shown defects at sites no operator reproduces exactly (C9's table ×11, C10's line ×2, 7 review probes). Like for like, it is about 45% caught and 23% proven.
- **Its limit is coverage, and then depth.** Coverage: a formula nobody wrote a spec for is unguarded. Depth: a spec tests one property of its formula, so 24 of the 32 surviving sign flips sit in *seen* formulas, in terms the spec does not exercise. For example, flipping F16's `+ 0.45` overlap term to `−` keeps excitement inside [0,1], which is all F16's purpose states, so it survives.
- **Each earlier headline was inflated by exposure that leaked through a different path.**
  - The first draft's 66% came from a "held-out" seed that shared 53 of its 97 sites with the tuning sample.
  - The second draft's 40% still counted the set-C plant formulas and the siblings of tuned sites as unseen.
  - The third draft's 15% still missed tuned sites that no spine span covered, a one-character span boundary, the specs' remote reads, and the formulas review rounds had probed.

  The lesson is not the specific number. Exposure leaks through every channel by which a spec author learns about a formula, so tiers must be drawn by formula and must include reviews.

## Survivors

The full list, with each survivor's exposure tier, is in `spine/MUTANTS_all_sites.md` (145 of 307).

- **Integer doublings (51 survivors; 28 unseen).** A fresh reviewer classified the previous run's integer survivors:
  - about 21 break a stated count or identity: 4 + 28 = 32 retention slots, 14 zones = 7 Rays × 2, "22 Archetypes", 21 presets, the 4096-byte limit stated twice, `quantum = 512 m` against 256 × 512, "89–100%" doubled past 100%;
  - about 16 are tunable design constants;
  - the rest are equivalent (defect labels, historical values).

  A count/identity cross-checker (the Method Mirror's constant clusterer) would catch the first group cheaply, including the unseen ones.
- **Coefficient shifts (43 survivors).** Mostly design values, so largely equivalent.
- **Sign flips (32 survivors).** 24 are in seen formulas: terms such as the port-Hamiltonian update and midpoint, and the thermal formulas, which their specs do not test term by term. These are the real blind spots of depth.

## Caveats

- One plan, one exhaustive run. Equivalent mutants are not removed automatically.
- Tiers are drawn from spine entry text spans, math spans and lines. A lazy regex span can enclose a neighbouring formula; F12's span, for example, encloses F10's τ_arm, so a few sites count as seen through a neighbour. Spans longer than 2000 characters (F47, which links two distant flags) mark no territory.
- The tuning sample is reconstructed from code. The first run's operator list, including the wide integer regex, is in the session transcript. The first R29 review's "59% overlap" used the later, narrower integer regex; with the first run's operators the overlap is 53/97. Of the 105 shown sites, 89 are still mutation sites, because R29 narrowed the integer operator and changed `swap a−b`.
- `swap a−b` skips top-level commas, so `\max(a, b - c)` is not swapped across its arguments. Braces may nest two deep, and pairs split by `\left(`…`\right)` are skipped.
- DRIFT kills are a stop sign, not proof of a defect.
- The units checks are token-level (unit family and scale), not symbolic dimensional analysis. A full units engine is still on the Method Mirror's list, along with a state-machine checker, a cross-artifact constant clusterer and a citation checker.
- The set-C answer key says Float16 spacing at 512 m is 0.5 m; just below 512 m it is 0.25 m. The defect stands either way (both far above sub-millimetre).
