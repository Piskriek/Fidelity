# Bridge v1a results: frozen against live (2026-11-01)

Revised after a fresh number check and claim-strength read (`check_results_raw.json`). Every number was confirmed. The changes:
- the per-seed split of the secondary readouts;
- the CE by season age;
- the design's "partly by construction";
- the comparison with S;
- T is not like for like;
- the M1 caveat;
- the full §6.6 conditions;
- some judging words, removed.

**Provenance.**
- **Score:** every number is from `SCORE_bridge_v1a.txt`, or arithmetic on it, except: the timings and runner review (`RUNLOG_bridge.txt`, `RUNLOG.txt`), and the per-seed secondary readouts, pair counts and CE by season age (recomputed from the 192 records, which hold them).
- **Scorer:** `score_bridge_v1a.mjs` ace75df0…, amended before any counted run (Amendment 1, logged at 20:05 UTC).
- **Records:** 192 present, all from `live.mjs` 7f814cbf… (checked with `--expect`). K5 = 0 in every record, and none was refused.
- **Runs:** on the 3080 PC, about 20:07–20:30 UTC by the records' file times. Scored at 20:50.
- **Runner review:** completed at 20:19 UTC, after launch and before scoring, with no confirmed defects. One of its two reviewers returned an empty result. The other ran a 5,000-tick prefix of a scored run (F, seed 2, world 101). Its NGE was not seen by the author. No reruns were needed.

**Noise floor and margin.** The sd of F − F′ over the 48 pairs was 0.34 NGE, so m = 3 × 0.34 = 1.02, just above its floor of 1.0. The mean F − F′ was 0.03.

## Good-eats score (NGE: nourishing minus toxic eats per 100 ticks with an item, counted from the first season turn)

| Arm | Mean | Per model seed |
|---|---|---|
| F, frozen | 28.61 | 29.08, 28.34, 28.42 |
| F′, frozen with a second action stream | 28.58 | 29.01, 28.35, 28.38 |
| L, live heads | 33.20 | 33.83, 33.29, 32.48 |
| LH, live heads with help | 33.07 | 33.83, 33.04, 32.35 |
| O, oracle (reference) | 50.53 | |
| T, tabular learner (reference) | 42.68 | |
| S, eats every fruit (reference) | 31.10 | |
| RND, random (reference) | 11.13 | |

## The locked rules

| Rule | Result | Prediction |
|---|---|---|
| M1: S ahead of RND | passes: mean 19.96; 16 of 16 worlds | passes: right |
| M2: O ahead of F by 3m | passes: mean 21.92, need 3.07; 48 of 48 pairs | passes: right |
| M3: T ahead of F by m | passes: mean 14.06, need 1.02; 48 of 48 pairs | passes: right |
| **E1: L ahead of F** | **passes**: mean 4.59, need 1.02; per model seed 4.75, 4.95, 4.06; 48 of 48 pairs; the smallest pair gap is 1.49 | **fails: wrong** |
| H1: LH against L (reported) | mean −0.13; per seed −0.00, −0.25, −0.14; 18 of 48 pairs favour LH | no confident direction |
| T against L (reported) | mean T − L 9.48 (smallest gap 7.17); 48 of 48 pairs favour T | T matches or beats L: right |

- **M1 to M3 were not real tests of my predictions.** The reference minds' values on worlds 101–116 were known before the lock: approximate values from an earlier preset, and the exact values printed after the lock but before any counted run (Amendment 1). Only F's values were unknown.
- **My E1 prediction was wrong.** It rested on one smoke world, where L led F by 3.4, and on a guess that m would be several NGE. Instead m came out at 1.02, and L's lead cleared it in every pair.

## Secondary readouts (decide nothing): mean per arm

| Arm | Mean V per tick | Pain per 100 ticks | Collapses per 10k | Toxic eat rate | Nourishing eat rate | NGE, last 4,096 ticks | Answer CE | Eat-fruit CE |
|---|---|---|---|---|---|---|---|---|
| F | 0.62 | 45.38 | 196.57 | 0.61 | 0.78 | 29.55 | 0.46 | 0.97 |
| F′ | 0.61 | 45.45 | 196.93 | 0.61 | 0.78 | 29.62 | 0.46 | 0.97 |
| L | 0.60 | 43.81 | 205.84 | 0.40 | 0.79 | 33.46 | 0.38 | 0.85 |
| LH | 0.60 | 43.53 | 202.32 | 0.41 | 0.79 | 33.24 | 0.39 | 0.86 |
| O | 1.30 | 3.43 | 13.07 | 0.00 | 1.00 | | | |
| T | 0.87 | 25.01 | 131.35 | 0.13 | 0.88 | | | |
| S | 0.91 | 37.48 | 180.57 | 1.00 | 1.00 | | | |
| RND | −0.60 | 95.56 | 520.03 | 0.33 | 0.33 | | | |

**Eat-fruit CE by ticks since the season began** (pre-registered; recomputed from the records):

| Arm | 0–31 | 32–127 | 128 and later |
|---|---|---|---|
| F | 1.106 | 0.977 | 0.952 |
| L | 2.463 | 1.367 | 0.592 |

L is worse than F at 0–31 ticks in 48 of 48 pairs, and better at 128 and later in 48 of 48.

## What it shows

1. **E1 passed, as the design expected it partly would by construction.** §2.7 calls E1 "close to built in", and §6.5 says it passes "partly by construction": F's context covers about 4 ticks, so a season can live only in weights that change. In this world and with this value table, L scored higher on NGE than its frozen copy F in all 48 pairs (mean 4.59; every pair at least 1.49).
   - L ate toxic fruit about a third less often (toxic eat rate 0.40 against 0.61, lower in 48 of 48 pairs) and nourishing fruit about as often (0.79 against 0.78).
   - Over the last 4,096 ticks L is still ahead, by a little less: 33.5 against 29.6, a gap of 3.9 against 4.6 overall, in 47 of 48 pairs. This is a secondary readout.
2. **L relearns each season, and the fit changes over a season.**
   - Averaged over the whole life, L's predicted answers fit the world better than F's: answer CE 0.38 against 0.46, eat-fruit CE 0.85 against 0.97.
   - Right after a season turn, L's eat-fruit predictions fit worse than F's: 2.46 against 1.11 in the first 32 ticks, and 1.37 against 0.98 at 32–127.
   - From 128 ticks on they fit better: 0.59 against 0.95.
   
   [inference] L's heads commit to the last season's table, are wrong when it turns, and relearn within about a hundred ticks.
3. **The secondary readouts do not all move with NGE, and they differ by model seed.**

   | Readout | Seed 1 | Seed 2 | Seed 3 |
   |---|---|---|---|
   | Collapses per 10k ticks, L − F | −55 | +42 | +41 |
   | Mean V per tick, L − F | +0.14 | −0.10 | −0.10 |
   | Pain per 100 ticks, L − F | −8.2 | +1.5 | +2.0 |

   The pooled means, collapses 205.8 against 196.6 and mean V 0.60 against 0.62, hide this split. L collapses more in 32 of 48 pairs and has higher mean V in 15 of 48.

   The critique's finding 6 warned that an arm can win on NGE while collapsing more. That is what happens on seeds 2 and 3, not on seed 1. Its proposed fix, a collapse guardrail with a margin set in advance (owner decision 17), was never adopted. So no locked rule decides whether this counts against E1. Why the seeds differ was not measured. One candidate, untested: passing on fruit its heads now predict as toxic leaves it with less energy.
4. **On NGE, L sits between the references.** It is below the oracle (by 17.3) and the tabular learner (by 9.48, in 48 of 48 pairs). It is above the eat-every-fruit script S (by 2.1, in 39 of 48 pairs).
   - S was ahead of F on NGE by 2.5, in 45 of 48 pairs.
   - On the secondary readouts S is ahead of L in nearly every pair: mean V 0.91 against 0.60 (48 of 48), pain 37.5 against 43.8 (48 of 48), collapses 180.6 against 205.8 (45 of 48).
   - None of these comparisons was pre-registered.
   - T is a reference, not a like-for-like arm. It chooses by its own rule (fixed answer values, exploring only by eating), not §4.4's value-table rule. It runs in `lockstep.mjs`, and its 16 world values repeat across the three model seeds.
5. **Help from another timeline made no NGE difference beyond the noise floor** (LH − L = −0.13; H1 is reported, not tested).
   - On the secondary readouts LH is slightly worse than L: higher answer CE in 38 of 48 pairs, and a higher toxic eat rate in 35 of 48.
   - This is consistent with the nursery, where removing help changed CE by at most 0.002 (no noise floor computed).

## What it does not show

- **"Evolved (within a life)" is not licensed.** §6.6 allows the phrase only if E1 and E2 pass, E3 does not downgrade, and M1–M3 and G0 hold.
  - E3 (the stationary control) was not run. Without it, the pass could mean only that more training helps, even where there is no changing truth to track.
  - E2 (the yoked arm) was not run. Without it, it is not shown that learning from one's own timeline does better than learning from another character's.
  - G0 ran with stated departures: the per-tick tests B2, W2, W3 and L1 are not inside `live.mjs`'s runner; `live.mjs` and `run/baselines.mjs` are outside the planted-mutant set; N4 was not run; K7 was stated, not tested in code.
- It says nothing about feeling, and "living" names the project, never a finding (§6.6). The neural mind is not shown to be needed: T does better.
- Nothing here shows that the results carry over to richer worlds.
- The value table that drives the choice rule is still pending the owner's review. A different table could change NGE and the secondary readouts.

## Limits

- One world design, one value table, three trunks that share their nursery data order, and 16 worlds.
- NGE is counted inside the runner, not by the scorer (a stated departure from §6.3).
- §6.3's recovery readout and mechanism readout were not produced. Pain was not reported beside mean E/15, as §6.3 asks.
- The per-seed readings above were made after the runs.
