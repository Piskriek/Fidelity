# Set C — Harder Plants, the Audit Card, Reduce v2 and the Fractal Gap Map

*Claude Opus 5.5, Pass R27, 2026-10-31. Follow-up to `bench/2026-10-31/REPORT.md`.*

## What changed from the first benchmark

- **Harder plants.** Ten defects that read naturally (`keys/answer_key_C.json`): a gravity sign flip, a `min`→`max` swap, an inverted mask law, a flipped stability inequality, reputation that can never fall, GPa→MPa next to a GPa example, a broken log inverse, Float16 under a sub-millimetre claim, a duplicated archetype number, and a VSA size that doesn't add up. All were planted in the **R26** plan, after its 25 fixes.
- **Repeat runs.** Two runs each for Haiku without a skill and Haiku with the card.
- **Known items excluded.** Arms were told to skip the 18 open items already listed in §8.1, so only new findings count.
- **Reduce v2 as real two-reader handoff.** The first reader writes neutral "cards"; a fresh Haiku that never saw the plan regrows the design from the cards alone.

## Results (planted recall checked by hand; C4 scored ½ when an arm saw the asymmetry but not that unstable craft now pass)

| Arm | Findings | Plants (of 10) | Missed | Tokens | Time |
|---|---|---|---|---|---|
| Sonnet, no skill | 16 | **10** | — | 132.6k | 4.9 min |
| Haiku, no skill, run 1 | 20 | 8.5 | C3, C4½ | 176.1k | 6.1 min |
| Haiku, no skill, run 2 | 20 | 8.5 | C3, C4½ | 185.5k | 6.8 min |
| Haiku + audit card, run 1 | 18 | 8.5 | C3, C4½ | 184.4k | 7.0 min |
| Haiku + audit card, run 2 | 29 | 8.5 | C3, C4½ | 204.3k | 8.3 min |
| Haiku + full SQ skill v9.1 | 18 | **7.5** | C1, C3, C4½ | 213.7k | 8.0 min |
| Haiku + Reduce v2, reader 1 | 20 | 8.5 | C3, C4½ | 214.9k | 8.7 min |
| Haiku + Reduce v2, blind regrower (cards only, never saw the plan) | 47 | **9** | C3 | 198.6k | 9.6 min |
| *Reduce v2 pipeline (both readers, union)* | 67 | **9** | C3 | 413.5k | — |

**Reading it:**
- **Haiku hits a ceiling around 8.5 of 10, whatever method it uses.** Every Haiku arm missed C3 (the inverted mask law, which needs you to know what a mask is *for*). Only Sonnet caught it. No skill moved that ceiling.
- **The full skill was the worst Haiku arm.** It was the only one to miss the gravity sign flip, and it was among the most expensive.
- **The blind regrower was the best Haiku reader.** Working only from the 11.6 KB cards, it caught 9 of 10, and it was the only Haiku arm to state C4 fully: the zero-G gate now rejects the stable craft it should accept. Reducing to base elements and regrowing really does give a different angle. But the full two-reader pipeline cost 2.3× a single run for +0.5 plant, and it still missed C3 even though the cards carried the mask law word for word.
- **The card costs ~8% more tokens than no skill and ~9% less than the full skill, at equal recall.** It doesn't save tokens against no skill; it is the cheapest way to keep the SQ vocabulary and output format.
- **Run-to-run noise is large.** The two card runs found 18 and 29 items. Finding counts are not a quality measure on their own.
- **Precision is high.** I read all 19 non-planted findings from the 29-item card run: none were clear false positives.

## What actually found new defects: independent readers, then the union

Across the set-C arms, the non-planted findings added **17 real defects** (B137–B153) that the R26 pass had missed. **Two of them were introduced by R26's own fixes**: a symmetry guard that let an empty craft score full symmetry (B137), and a tier rule that contradicted the peace reset (B145). The Sonnet reference arm found four more errors in R26's own wording (B118, B119, B121, B122). The lesson is now in the skill: **a pass that fixes defects also introduces them, so a fresh reader should audit the changed lines.**

## The Fractal Gap Map (your point-cloud idea, made executable)

`spine/fidelity_point_cloud.json` holds every operator (35) and stateful quantity (24) the plan names, each grounded in the plan text. `scripts/fractal_gap_map.mjs` places them on the framework's own axes: 4 folds inside a package (C11), 4 neighbours around it (C12), lateral duals (C20), cartridge seams (C22), homes/waves (C8) and units (C31). It then lists the empty cells. First run: 42 holes; after R27's fixes: **30** (`spine/GAP_MAP.md`). **Regrown** with the §8.2 proposals applied (`--overlay spine/proposed_fills.json`): **7** holes (`spine/GAP_MAP_REGROWN.md`). The regrowth also caught a clash in the proposals themselves (the Wave 5 app calling Wave 6 packages), which was fixed. The 7 that remain are the three owner questions (do universes end, can progress fall, are scars permanent) and four bounds that depend on them.

The biggest empty regions:
- **The soul cartridge can't carry the soul** (B126). No shorthand line holds the Four Floats, the archetype, or the body economy, so logging out would clear recovery debt.
- **There is no world save format at all** (B127): town tension, ambient energy, lineages, child universes, 4D progress, reputation.
- **There is no call graph** (B128). 15 of 18 packages have no named caller.
- **Seven quantities only ever move one way** (B129–B135). Ambient energy is drained and never refilled. Precision is only ever annealed down, so **distortions can be cured but never acquired**. Excitement and town tension never decay. Child universes are unbounded.

Plan §8.2 proposes a fill for each, deduced from parts the plan already has. Example: ambient energy refills from the **Trophic Stellar-to-Core Energy Cascade (spider 2.3)**, which also gives the rest cycle's mystery +30 J a source (B107). Plan §8.3 lists the seven questions only the owner can answer.

## Re-auditing this pass

Following the new rule, a fresh Sonnet reader audited only R27's own diff before commit (`outputs/R27_diff_review.md`). It found **24 problems** in my draft. The worst: my Resume patch's regex had swallowed the Resume's Section 1 heading. Two proposed fills were wrong (the canonical-origin rule oscillated; the Lyapunov "one-line proof" failed for small strain). The cohort tick was in the wrong wave, three different counts were given for the same fact, and some ripples were missed. All 24 were fixed before commit. The ledger arithmetic was right.

## Caveats

- 1–2 runs per arm, one plan, plants designed by me. The C4 half-credit is a judgment call.
- The gap map's rules are the framework's laws applied literally. A hole is a candidate, not a verdict; 23 "law-strict" fold cells are listed separately because a pure validator may not need its own dynamics.
