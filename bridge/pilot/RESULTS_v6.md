# v6 results: closing the triangle, and compassion

Everything here was scored by `score_v6.mjs` (hash 0a65525b…), as locked in `PREREG_v6.md` (fc7fe951…). There were 18 v6 runs on the 3080 PC, all from script fcec7505… at 40,000 steps. A, B and R come from v5, through the same code path: the 300-step regression check described in PREREG_v6.md matched v5's R in all three evaluations. No full 40,000-step re-run of R was done. Full output: `SCORE_v6.txt`.

Revised after a fresh claim-strength read: the first version overstated the mechanism reading, the closed-triangle conclusion and the oracle comparison. The figures it gave were right; the figures added here (marked characters, oracle on clean text) were computed from the per-run JSONs.

**Regime gate (from v5):** M1 and M3 hold, so V1–V4 are read. **Margin** m = 0.0140.

## Mean held-out CE (marked world; lower is better)

| Arm | What it adds to R | CE | Clean text |
|---|---|---|---|
| R (v5) | – | 1.9881 | 1.9312 |
| R9 | both directions of the rung 0 ↔ rung 2 bridge | 1.9859 | 1.9287 |
| Rskip | 2 → 0 only | 1.9853 | 1.9277 |
| Rup | 0 → 2 only | 1.9888 | 1.9329 |
| RCtop | R9, plus the top feels the sting | 1.9880 | 1.9309 |
| RCx | R9, plus the top and gates feel **another** stream's sting | 1.9851 | 1.9282 |
| **RC** | R9, plus the top **and the gates** feel the stream's **own** sting | **1.9513** | **1.9068** |

Two references from v5, which are not part of v6's rules: always-open B at 2.0171 (seeds 1–3; 2.0174 over v5's six seeds), and the oracle O at 1.9672.

## The locked rules

| Rule | Result | Prediction |
|---|---|---|
| V1: the closed triangle (R9 ahead of R, Rskip and Rup) | **fail**: R9's mean difference from each is under 0.003 (per seed, between −0.008 and +0.006) | "fails": right |
| V2: compassion (RC ahead of R9) | **pass**: paired diffs 0.046, 0.040 and 0.018; mean 0.035 | "passes": right |
| V3: the top alone (RCtop ahead of R9) | **fail** | "not ahead": right |
| V3: the gates add (RC ahead of RCtop) | **pass**: mean 0.037 | "ahead": right |
| V4: whose sting (RC ahead of RCx) | **pass**: mean 0.034 | "passes": right |
| Mechanism: RC's gap0 exceeds R9's by 0.05 or more | **wrong**: the difference is −0.013 | "exceeds": wrong |

## What the mechanism readout changes

The prediction behind V2 was that a gate which feels the sting learns to close on help from another timeline, and that this would show as a wider gap0. **It did not.**

- **gap0 did not widen.** In the pure cell, where only bridge 0 differs, RC's gap between clean and marked help was 0.089, 0.090 and 0.048. R9's was 0.087, 0.082 and 0.098. gap1 and gap2 did not widen either. RC does not tell foreign messages apart by content any better than R9.
- **About two-thirds of the mean gain also appears on clean text,** where nothing is marked: 0.022 of 0.035 (per seed 0.033 of 0.046, 0.026 of 0.040, 0.007 of 0.018). That part is not specific to foreign help. On seed 3, less than half is.
- **A residual of about 0.013, present on every seed (0.013, 0.014, 0.012), appears only in the marked world.** Inside the marked world, the gain sits mostly on the characters whose bridge-0 help is marked (about 24% of characters): they gain 0.091, 0.092 and 0.057, against 0.031, 0.024 and 0.006 on unmarked characters, which is 47%, 54% and 74% of the world gain. RC's marked-minus-unmarked CE penalty is 0.159, 0.165 and 0.188, against R9's 0.219, 0.233 and 0.239. The gap0 readout cannot explain this. v5 found that concentration alone does not show selective closing, so this is not read as selective closing either.
- **How the sting is used was not measured.** No readout shows the gates responding to the sting: the sting weights and the gate-to-sting relation were not read out. RC's mean gate0 is not shifted consistently (0.19, 0.19, 0.29 against R9's 0.22, 0.22, 0.24). One candidate reading [inference, untested]: the sting gives the gates a running sense of how help has been landing, a trust signal over time. With 256-character marked segments, an outcome-tracking signal like that also works as a lagged detector of foreign help, which could account for the marked-world residual. The sting has three parts (instant surprise, instant relief, and a running mean of relief over about 16 characters), and nothing ablated them, so which part carries the gain is unknown.
- **V4 [inference, untested].** It is consistent with own surprise being informative about own next characters. RCx's sting comes from an arbitrary other stream in the batch, not from the donor, and RCx did no better than R9, so the other stream's sting was simply unused.
- **RC's gates are more stream-specific.** Scrambling gate values across streams costs RC 0.35–0.40, against 0.13–0.20 for the other arms. The scramble measures how stream-specific the gates are, not how much the arm relies on help.

**Capacity.** RC carries 201 compassion parameters and a live sting input that R, R9, Rskip and Rup lack. RCx carries the same 201 parameters and an input of the same form, and does not gain, which limits a pure-capacity reading. RCtop also carries them (its gate weights go unused).

**The oracle.** RC's CE is below v5's oracle O (1.9513 against 1.9672) on every seed, by 0.021, 0.021 and 0.006. On seed 3 that is under the margin. O has no bridge 2 and no sting, while v6's world also marks help on bridge 2, so O is not an oracle for v6's full world. RC's margin over O also holds on clean text (0.013, 0.015, 0.003), so it is not foreign-help handling. Per the v5 prereg's locked reading, a gate that beats O is read as capacity or something else, not as exceeding the ceiling.

## For the bridge and for First Orchard

- **Compassion helps CE.** A possible reading [inference, untested] is a trust signal over time. It is consistent with the running "did the help help" part of Argon's and DeepSeek's proposals in the mixture round. But v6 did not show the selective closing (L4) those proposals were aimed at, and v6's sting is the receiver's own loss, where DeepSeek's key was the source's residuals.
- **L4 was not shown in v6** (it was not scored). Kimi's and Luna's point stands: remove the splice cue, so the gate has to read content.
- **The closed triangle.** R9 shows no measurable CE gain over R here. The compassion arms were only tested on top of R9, so the data neither show that the extra bridge is needed nor that it is not.
- All arms are variations on R, so v6 says nothing about the measured gates (L1–L3 arms). What it suggests for the characters' gates is a candidate to test, not a result.

## Limits

- A single corpus, three seeds and small models.
- The sting is three numbers, all computed from the stream's own losses on the previous character. Any arm given them gets extra information, so "compassion" here is that input plus the gates' use of it.
- The relief term compares two different heads (aux0 before the help, main after it), so it is only a proxy for "did the help help".
- Segment-level poison (256-character runs) makes a running sting unusually easy to use. Real wrong help may not arrive in runs.
- The sting reaches only the receiver. A donor never hears how its message landed.
- v5's norm lock means absolute gate levels are not identified. gap0 is a raw difference, with no scale-free ratio, and gate means differ widely across seeds and arms (RC's G02 mean is 0.35, 0.87 and 0.17, with no tie to the gain size).
- Not blind: v6 came from the owner's 3/6/9 test of v5's model and the owner naming "compassion". No v5 result had been read when v6 was locked.
