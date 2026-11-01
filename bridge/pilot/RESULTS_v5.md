# v5 results: a world where help can come from another timeline

Everything here was scored by `score_v5.mjs` (hash 7c565d3e…), as locked in `PREREG_v5.md` (325b2b2e…) and `PREREG_v5_upper.md`. 33 runs on the 3080 PC, all from script 6efbaf8a… at 40,000 steps. Two runs failed to start (a file-open error on the exFAT drive) and were relaunched with the identical command; see RUNLOG_v5.txt. Full scorer output: `SCORE_v5.txt`.

## The world worked

| Check | Result |
|---|---|
| M1: B ahead of A | holds (help is worth taking on balance; mean 0.085) |
| M2: O ahead of B | holds: help from another timeline costs 0.050, inside the predicted 0.02–0.08 |
| M3: B's CE higher on marked messages | holds on every seed (about 2.22 against 1.95) |
| Margin m | 0.0140 (B's six-seed sd is 0.0024, so the 0.014 floor applies) |
| Power | L5 is not underpowered (O − B = 0.050 ≥ 3m = 0.042) |

## The ladder: every graded arm is at level 3

| Arm | Mean CE | Level | Where it stopped |
|---|---|---|---|
| R (relational) | **1.9881** | 3 | L4 failed on all three seeds, on both clauses. L5's clauses pass, but the concentration clause is not diagnostic (see below) |
| E (learned, blind) | 2.0026 | 3 | L4 not testable (blind). L5 fails: not ahead of K, and its gain is not concentrated on marked help |
| RP (R through the Plan's law) | 2.0031 | 3 | L4 failed on seed 1 by 0.003 (bridge 1: no gap). L5 missed B by a rounding hair (0.01397 against 0.014), and K and E by a wide margin |
| K (constant 0.5, reference) | 2.0081 | – | – |
| B (always open, reference) | 2.0174 | – | – |
| S (surrogate) | 2.0265 | 3 | L4 not testable (blind) |
| Cneed | 2.0374 | 3 | L4 not testable (blind) |
| Casym (the Plan's measured gate) | 2.0649 | 3 | L4 not testable (blind) |
| A (always shut, reference) | 2.1020 | – | – |
| O (oracle ceiling) | 1.9672 | – | – |

**Blindness was confirmed mechanically.** S, Casym, Cneed and E had identical gate means in the marked world and the clean world.

### R in detail

**Bridge 0 off-boundary gap,** gate on clean minus gate on marked, by seed:

| Seed | Gap | Clean | Marked | Marked ÷ clean |
|---|---|---|---|---|
| 1 | 0.088 | 0.23 | 0.15 | 0.62 |
| 2 | 0.085 | 0.21 | 0.12 | 0.59 |
| 3 | 0.0985 | 0.23 | 0.13 | 0.57 |

- **Against the locked L4 rule.** R was about 40% less open to help from another timeline. It failed L4 on all three seeds, on both clauses:
  - the bridge-0 gaps of 0.085–0.0985 fall short of the 0.10 needed (seeds 1 and 2 by 0.012–0.015, seed 3 by 0.0015);
  - the marked opening was 0.57–0.62 of the clean one, against at most 0.5;
  - bridge 1 showed no gap.
- **At span boundaries the gap was two to nearly three times as large** (0.20–0.24). The reviewers warned about this: a splice is easier to spot at the moment a donated message is fresh. That is why L4 was scored off-boundary.
- **L5's clauses pass.** R is ahead of B (0.029), K (0.020) and E (0.0145) on three paired seeds.
  - The E margin is only 0.0005 over m. Seed 1's difference is 0.0127, and it passes because the per-seed test is just "> 0".
  - Its gain over B is larger on marked messages than on clean ones on every seed. **That clause is not evidence of selective closing.** The blind gates and the constant gate K meet it too: K's marked-to-clean gain ratio is 1.9–3.3, against R's 1.9–2.6. R also gains on clean messages (0.021–0.023, against 0.043–0.056 on marked).
  - The test of message-specific closing is L4, which R missed. Because the ladder counts consecutive rungs, its level is 3.

### RP in detail

- **Bridge 0 gaps:** 0.097, 0.130 and 0.120. Seed 1 is under 0.10 by 0.003, and the marked opening is about 0.76–0.82 of the clean one, so it closes less than R in relative terms.
- **L5:** RP misses B by a rounding hair (0.01397 against 0.014). It is ahead of K by only 0.005 (seed 2 slightly behind), and behind E by 0.0006, so it is not close on L5.

## Against the locked predictions

| Prediction | Result |
|---|---|
| S, Casym, Cneed, E at level 3 (capped) | right |
| RP at level 3 | right on the level; the stated mechanism ("the flat zones slow learning, so it does not learn to close") is not supported, since its raw bridge-0 gaps match or exceed R's |
| **R at level 4 or more** | **wrong** (level 3; L4 failed on all three seeds, on both clauses) |
| M1, M3 hold; M2 with O − B in [0.02, 0.08] | right (0.050) |
| The Plan's law (RP only) | RP reaches L3: on the locked rule, no evidence that the shape allows closing in time. RP's raw gaps (0.097–0.130) exceed R's, but its marked-to-clean ratio is weaker, and absolute gate levels are not identified. This says nothing about Casym (the asymmetric b), which is blind and capped |

## L7, the gateway (scored separately)

On clean text with nothing marked:
- **E, R and RP pass.** They are no more than 10% more closed than toward help that fitted, and their CE is no worse than B's. For blind E the gate clause is met by construction, so its pass rests on the CE clause.
- **Casym, Cneed and S fail on CE.**
- L6 is not pre-registered or scored. L8 is not tested.

## What this does and does not show

**Shown**
- In this world, R is ahead of B (0.029), K (0.020) and E (0.0145, just over the 0.014 margin; seed 1 at 0.0127) on three paired seeds.
- RP sees the same source through the Plan's law and is not ahead, so this is a result about R, not about "seeing the source" in general.
- Gates that never see the message cannot close on it, by construction, and the blindness check confirmed it.

**Not shown**
- **That R closes selectively by the locked bar.** It closes partially, about 40% less open off-boundary. It missed L4 on every seed, and much of its discrimination sits at span boundaries.
- **That its gain is selective.** The gain-concentration clause is also met by blind and constant gates.
- **That the Plan's law helps or hurts.** RP is at the edge on L4 (seed 1, 0.0972 against 0.10), but not on L5.

**Scope.** Small models (about 90k parameters), one corpus, planted 256-character marking, three seeds, not blind. The controls are unmatched, and absolute gate levels are not identified. R and RP have 4,098 extra parameters, and the concentration clause does not rule out a capacity reading.

**For the bridge's character mind:** R is the only arm that passes L5's clauses here, in a single world, with three seeds, only 0.0005 over the margin against E, 4,098 extra parameters, and L4 missed. It is the best-supported among those tested, pending v6, which adds the closed triangle and compassion to R.

*Corrected after a fresh claim-strength read (2026-11-01). That read found the first draft overstated R's L4 shortfall as "narrow", RP's L5 as "a hair", and the concentration clause as evidence of selective closing.*
