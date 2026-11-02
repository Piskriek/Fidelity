# Bridge v1b results: live against yoked (2026-11-02)

Revised after a Haiku triad check on this file (`mind/runs/v1b/review_results_raw.json`): one reader for numbers, one for claim strength, one for fit with the pre-registration. The number reader recomputed about 120 figures from the records and found them all correct, with one method note (CE by season age). The changes:
- the cause of L's gain, softened;
- the unit compared is a life, not a character;
- "the two moves cancel", withdrawn;
- the amendment's grading change, stated;
- the diagnostic's scope;
- the source check's scope;
- the 3/6/9 section's "closed";
- from the pre-registration reader: 39 of 48 records finished before the amendment, when the review ran, the pre-lock checks (with one coincidence), the departures, and the readouts still missing.

**Provenance.**
- **Score:** every number is from `SCORE_bridge_v1b.txt` (written by `mind/score_bridge_v1b.mjs`), or arithmetic on it. The exceptions were recomputed from the per-life records: the per-seed secondary readouts, pair counts, smallest pair gap, item eats and CE by season age. The per-life records are kept on the working machines, not in the repository. The repository has `mind/runs/v1b/lives_summary.json` and `mind/runs/v1a/lives_summary.json`, which hold every readout used here. The scorer needs the per-life records.
- **Section numbers** (§) are sections of `BRIDGE_DESIGN.md`.
- **Lock and scorer.** Locked at 04:14:06 UTC, 37 s before the first run, with scorer ab865cc3…. The scorer was amended to 9a315f12… (Amendment 1, logged 04:28:36 UTC). The amended scorer was first run at 04:28:12, on the check folder only, which holds no scored Y record. Scored at 04:33:28 UTC.
- **Records:** 48 Y records, all from `live_y.mjs` 1360ab19…. K5 = 0 in every record, and none was refused. Every Y record's source lane matched its v1a L record on NGE, collapses and answer CE, so the v1a L, F and F′ records are the comparison.
- **Runs:** on the run machine, 04:14:43–04:31:24 UTC (worker log `RUNLOG.txt`), 180–401 s each.
- **Review:** the post-launch review, three Haiku readers (code, scorer, pre-registration), ran after launch. Their file (`mind/runs/review_v1b_raw.json`) was written at 04:27:00 UTC, before scoring, and their findings became Amendment 1. §6.7 asks for a review before launch. v1a's review also ran after launch. The file keeps findings, not tool calls, so whether a reviewer opened a scored Y record cannot be shown.
- **Timing caveat.** Before Amendment 1 was logged (04:28:36), 39 of the 48 Y records had finished: 20 by 04:21:57, and 19 more between 04:27:50 and 04:28:28. The worker log printed only K5 and explore share. The per-run progress files (`progress/`, kept on the run machine, not committed) carried running per-character eat counts, from which a running NGE can be read, and the live board showed them. The amendment says the author had not seen any Y result. The files cannot show what the author looked at.
- **What the amendment changed.** It added checks. It also set how the second prediction is graded. The locked text did not say: the Y-against-F line was "reported only", and the locked scorer graded only E2. Amendment 1 chose mean(Y − F) > 0, one of three readings the scorer reader listed. The other two were the §6.4 rule (a)–(c) and 48 of 48. That cut-off was set after 39 records were written. All three readings give "not ahead": the mean is −0.11, seed 1 is −0.53, and 21 of 48 pairs favour Y. E2's rule and threshold did not change.

**Pre-lock checks** (600 ticks, world 31000, seed 1, `mind/runs/y_checks/`):
- K5 = 0 in all four runs.
- The source matched a plain L run on NGE, collapses and answer CE.
- Y at head rate 0 matched F exactly (NGE, collapses, answer CE and world chain).
- One coincidence, not explained: at head rate 0.002, the 600-tick actor matched L on NGE (48.36), collapses and item eats, while its world chain, answer CE (0.257 against 0.231) and mean V differed. With so few ticks after the first season turn, equal counts are possible. No scored pair is affected: L − Y is above zero in all 48, the smallest gap 1.57.

**Margin.** v1a's m = 1.02 NGE (from sd(F − F′) = 0.34), as locked.

## Good-eats score (NGE)

| Arm | Mean | Per model seed |
|---|---|---|
| F, frozen (v1a) | 28.61 | 29.08, 28.34, 28.42 |
| F′, frozen with a second action stream (v1a) | 28.58 | 29.01, 28.35, 28.38 |
| L, live heads (v1a) | 33.20 | 33.83, 33.29, 32.48 |
| Y, yoked: same learning steps on the neighbour's answers | 28.51 | 28.55, 28.41, 28.56 |
| O, T, S, RND (references) | 50.53, 42.68, 31.10, 11.13 | |

## The locked rules

| Rule | Result | Prediction |
|---|---|---|
| M1, M2, M3 (regime checks, recomputed) | all pass, as in v1a | |
| **E2: L ahead of Y** | **passes**: mean 4.69, need 1.02; per seed 5.28, 4.88, 3.93; 48 of 48 pairs (smallest 1.57) | passes (about 80%): **right** |
| Y against F (reported, two-sided) | mean −0.11, inside m = 1.02; per seed −0.53, +0.07, +0.14; 21 of 48 favour Y | Y ahead of F on mean NGE (about 70%): **wrong** on every reading (graded as mean > 0 by Amendment 1) |

M1–M3 are not independent tests: the reference values on worlds 101–116 were known before the lock, a stated departure carried over from v1a.

**Departures** (from the pre-registration, as in v1a):
- the per-tick tests B2, W2, W3 and L1 are not inside the runner;
- `live.mjs`, `live_y.mjs` and `run/baselines.mjs` are outside the planted-mutant set;
- NGE is counted inside the runner;
- the references on worlds 101–116 are known.

v1a also listed N4 (not run as a test) and K7 (seed disjointness, stated, not tested in code). The v1b pre-registration's list leaves them out, but both still apply.

## Secondary readouts (decide nothing)

| Readout | F | L | Y | Y − F, pairs where Y is higher | L − Y, pairs where L is higher |
|---|---|---|---|---|---|
| Toxic eat rate | 0.61 | 0.40 | 0.52 | 2 of 48 | 0 of 48 |
| Nourishing eat rate | 0.78 | 0.79 | 0.75 | 6 of 48 | 48 of 48 |
| NGE, last 4,096 ticks | 29.55 | 33.46 | 28.76 | 17 of 48 | 46 of 48 |
| Answer CE (lower fits better) | 0.46 | 0.38 | 0.76 | 48 of 48 | 0 of 48 |
| Eat-fruit CE | 0.97 | 0.85 | 1.73 | 48 of 48 | 0 of 48 |
| Mean V per tick | 0.62 | 0.60 | 0.53 | 11 of 48 | 46 of 48 |
| Pain per 100 ticks | 45.38 | 43.81 | 46.52 | 31 of 48 | 2 of 48 |
| Collapses per 10k ticks | 196.6 | 205.8 | 217.0 | 33 of 48 | 8 of 48 |
| Item eats per life (all four characters) | 31,365 | 29,196 | 28,685 | 7 of 48 | 40 of 48 |

**Eat-fruit CE by ticks since the season turn** (0–31, 32–127, 128 on; the mean of per-life bin means, as in v1a): F 1.11, 0.98, 0.95; L 2.46, 1.37, 0.59; Y 2.52, 1.92, 1.62 (pooled over eat events, Y's last bin is 1.63).

**Y's collapses and intensity** (the v1a records do not carry these): toxin 33,887 and hunger 34,212 over its lives; one loop-break per character; all 192 Y characters ended at intensity 1. A post-hoc diagnostic of 48 of the 192 v1a lives (F and L, worlds 101–108) found the same end state: every character hit one loop-break and ended at intensity 1 (`mind/runs/diag_collapse/DIAG_COLLAPSE.md`).

**Per seed, Y − F** splits like v1a's L − F: on seed 1, Y collapses less (−37) and has less pain (−4.7); on seeds 2 and 3, more (+50, +49; +4.1, +4.0).

## What it shows

1. **E2 passed.** With the same number of learning steps at the same rate, L's lives (heads learning from their own answers) beat Y's lives (heads learning from the next valley's answers) in all 48 pairs. Each life's NGE is a mean over its four characters. L − Y (4.69) is about the size of v1a's L − F (4.59).
   - So, in this world, L's gain over F goes with learning from its own valley's answers, not with taking the same learning steps on a neighbour's. This is what E2 was built to separate (§6.1).
   - E2 does not separate "its own timeline" from "a changing world needs any learning of its own". That is E3's job, and E3 has not been run.
2. **Learning from a neighbour changed behaviour, but did not move the mean score beyond the margin** (Y − F = −0.11 against m = 1.02; seed 1 is −0.53, not tested).
   - Y ate toxic fruit less often than F (0.52 against 0.61, lower in 46 of 48 pairs) and nourishing fruit slightly less often (0.75 against 0.78, lower in 42 of 48). It also made 8.5% fewer item eats (fewer in 41 of 48).
   - How these combine into the flat NGE was not measured. NGE's denominator, ticks with an item, is not in the records, so no offset is claimed.
   - Y's predictions about its own world fit worse than the frozen trunk's in every pair: answer CE 0.76 against 0.46. They fit worse at every season age, and stay worse after 128 ticks (1.62 against F's 0.95), where L's fit better (0.59).
   - [inference, not tested] The prediction assumed Y would profit from the kinds its valley shares with the neighbour (about two-thirds of kinds, by the world's rule) and from the world-wide season timing. The lower toxic eat rate is what learning the shared kinds would predict. The worse fit and the fewer nourishing eats are what wrong or poorly calibrated heads on the differing kinds would predict. Confidence was not measured. A split of Y's eats into shared and differing kinds would test both.
3. **The secondary readouts mostly favour L over Y.** L has higher mean V (46 of 48), less pain (46 of 48) and fewer collapses (40 of 48) than Y. Against F, L collapsed more on seeds 2 and 3 (v1a). Against Y, it collapses less on all three seeds.

## What it does not show

- **"Evolved (within a life)" is still not licensed.** §6.6 needs E1 and E2 to pass, E3 not to downgrade, and M1–M3 and G0 to hold. E1 and E2 passed. E3 (the stationary control) has not been run. G0 ran with the departures listed above, including N4 and K7.
- Y is one form of "learning from another timeline": the neighbour (c + 1) mod 4, in a world where a kind matches the neighbour's about two-thirds of the time. A different match rate, a different neighbour, or help that the character asks for (MIND_STEP7, "the ask") could come out differently.
- It says nothing about feeling. "Living" names the project, never a finding (§6.6).
- The value table is still pending the owner's review. A different table could change the F, L and Y numbers. S and RND do not use the choice rule. O and T would need checking before any claim about them.

## Limits

- One world design, one value table, three trunks that share their nursery data order, 16 worlds, and one life per pair.
- Y's comparison with F and L uses the v1a records. The source-lane check shows the shared code reproduces the v1a L records' NGE, collapses and answer CE exactly. World chains were not compared, because the Y record does not carry the source's chain. A reviewer proposed adding that comparison, and it was not adopted.
- `live_y.mjs` differs in text from `live.mjs` (Amendment 1 corrects the pre-registration's "unchanged in text"): a collapse-cause tally, three record-only fields, the Y dispatch line, a changed error message, and a rate argument for Adam steps whose default is unchanged. The source lanes reproduced the v1a L records' three readouts. F was not re-run on `live_y.mjs` for the scored worlds; the reviewer's suggested F re-run was not done. The 600-tick check of Y at rate 0 against F is the only F-path check on the new file.
- §6.3's recovery readout and mechanism readout were not produced, and pain is not reported beside mean E/15, as in v1a.
- NGE is counted inside the runner (a stated departure, as in v1a).
- The per-seed readings, the CE by season age, and point 2's reading were made after the runs.

## 3/6/9 check (a lens, not a measurement)

- **Node.** Thing: learning from one's own timeline. Opposite: the same learning on a neighbour's timeline. Test: E2. Answered for this yoke, world design and value table. Still open to other yokes (see Choice) and to E3.
- **Bridge.** Between Y's source and actor, data flows one way only: the actor takes the source's answers, and nothing returns. That is the arm's design, not a missing part. In the world, there is still no ask and no way back to a donor (MIND_STEP7).
- **Whole.** F, L and Y now have all three pairwise comparisons on NGE: L > F (E1), L > Y (E2), and Y within the margin of F (reported only). E3 is still open. Without the stationary control, "own timeline" is not yet separated from "a changing world needs any learning".
- **Choice.** The value table (the owner's), and the yoke rule (c + 1) mod 4 (the design's). Whether the result holds under another yoke was not tried.
- **Plain check.** Missing: E3; a yoke with a different match rate; a check of point 2's inference, by splitting Y's eats into kinds shared with the neighbour and kinds not shared.
