# Pre-registration: levels pilot v6, closing the triangle, and compassion

Written 2026-11-01, before any v6 training run. The code is `levels_v6.mjs`, built from levels_v5.mjs by `make_v6.mjs`. Its hash is recorded in RUNLOG_v6.txt when this file is hashed.

This is **not blind**. v6 comes from:
- the owner's 3/6/9 test of v5's model (`system_369_raw.json`);
- the owner naming the missing piece "compassion".

No v5 result had been read when this was written.

## Why

The owner's 3/6/9 test was applied to v5's model. The 3/6/9 frame is a lens and a design choice, not a measurement.
- **The judge's reading:** 6 of 9 in the closed-triangle count, 8 of 9 in Ra's count (`system_369_raw.json`). The three analysts' raw counts (6, 7 and 4) differed, because each used a different "9".
- **The plain fact in the code:** rung 2's own measured state is computed and never read, and nothing acts on rung 2. That is a dead end.
- **The ladder is not a defect.** v5 is a chain by design, each rung talking only to its neighbour. v6 tests closing it.

The owner then named what the way back up should carry: compassion, the one above feeling the sting below.

## What v6 adds to v5 (the world, the norm lock and every v5 arm are unchanged)

**Bridge 2, rung 0 ↔ rung 2:**
- **0 → 2:** at each rung-2 boundary, u2 = u2raw + G02 · msg(P02, x0p of the previous character).
- **2 → 0:** every character, x0' gains G20 · msg(P20, src20), where src20 is the stream's own u2, or a donor's where bridge 2 is poisoned. Bridge 2 has its own schedule, at the same 0.25 rate.
- Every new gate follows v5's R rule.

**Compassion (the sting going up).** The sting is three numbers per stream, from the previous character only, with no gradient:
- main CE minus its running mean;
- rung-0 aux CE minus main CE (did the help help);
- the running mean of that relief.

**Arms.** Seeds 1–3 for every arm. B and R come from the v5 runs (see Rules). The scorer is `score_v6.mjs`, hashed with this file.

| Arm | What it has |
|---|---|
| B | v5's always-open (reference) |
| R | v5's relational gate |
| R9 | both directions of bridge 2 |
| Rskip | 2 → 0 only |
| Rup | 0 → 2 only |
| RC | R9, plus the top feels the sting (u2 += Ps·sting) and the downward gates feel it (score += ws·sting) |
| RCtop | R9, plus the top feels the sting (gates do not) |
| RCx | RC, but each stream feels another stream's sting (someone else's pain) |

The compassion weights start at zero, so RC, RCtop and RCx start exactly as R9.

**Build checks, all passed before hashing** (rerun after v5's review fixes):
- the gradient check;
- R in v6 reproduces R in v5 exactly (300 steps, identical held-out CE in all three evaluations);
- a causality check: changing one character never changes anything computed at or before it. The first version of this check compared an entropy rebuilt as a difference of two sums, and rounding flagged false changes at the altered character, even for plain R. It now records entropy directly, and 3,178 records showed no change.

## Rules

**Ahead:** v5's paired rule, revised after v5's pre-run review:
- X is ahead of Y if, for every seed s = 1, 2, 3, Y_s − X_s > 0 on `eval.ce` (the held-out marked world, schedule 424242);
- and the mean of those differences is at least m;
- m is v5's margin: max(0.014, 3 × the sd of v5's six B seeds).

**B and R are taken from the v5 runs, not run again.** Their code path in levels_v6.mjs reproduces v5's exactly: the regression check matched v5's R in all three evaluations, to the last digit. v6 trains only R9, Rskip, Rup, RC, RCtop and RCx.

**After v5's review (applied to v6 too):**
- donated sources are constants, on bridge 2 as well;
- donors are drawn uniformly;
- the mechanism readouts use v5's off-boundary cells. For bridge 0, "clean" means the stream's own bridge-1 message was also clean.

- **V1 (the closed triangle):** R9 is ahead of R, of Rskip and of Rup. If R9 beats R but not both partial arms, one direction is doing the work, not the whole.
- **V2 (compassion):** RC is ahead of R9.
- **V3 (who feels):** two readings.
  - If RCtop is ahead of R9, the top's feeling alone helps.
  - If RC is ahead of RCtop, the gates' feeling adds to it.
- **V4 (whose sting):** RC is ahead of RCx. Feeling the right stream's sting must beat feeling someone else's.

**Regime gate.** v6 is read only if v5's world worked:
- **M1:** B is ahead of A.
- **M3:** B's CE on marked messages is above its CE on clean ones, on every seed.

Both are taken from the v5 runs. If either fails, V1–V4 read "no test".

**Readouts only** (they decide no rule):
- **the mechanism gap0:** on bridge 0, the mean gate on clean minus marked characters. Both groups exclude:
  - span boundaries;
  - characters where the stream's own bridge-1 or bridge-2 message was marked;
  - characters where u2 had taken in content marked by bridges 1 or 2, through 0 → 2 at the last rung-2 boundary (an "echo").

  An echo caused by bridge 0 itself is handled differently. It is part of the treatment in the marked group. It is excluded from the clean group, where it would be spillover.

  Echoes count one hop: an echo does not mark itself again. Two earlier definitions failed in smoke runs:
  - a self-marking echo latched on;
  - excluding bridge 0's own echo removed the treatment's effect.

  Both left almost no marked characters in the group. Only bridge 0 differs between the two groups. If an arm has fewer than 1,000 marked characters in the group, its gap0 reads n/a rather than falling back to another group;
- gap1 and gap2;
- CE on clean and on marked bridge-2 messages;
- G02's mean and spread;
- the scramble control for every gate;
- clean-text CE.

## Predictions, locked (mine)

| Rule | Prediction | Why |
|---|---|---|
| V1 | fails | a skip link adds little where rung 1 already relays rung 2. I expect R9 to be about equal to Rskip |
| V2 | passes | when help is wrong, the bottom's relief turns negative, and a gate that feels it can close |
| V3 | RCtop not ahead of R9; RC ahead of RCtop | wrong help comes from another stream's top, so the receiver's own top feeling the sting cannot fix it, but the gate can |
| V4 | passes | |

**Mechanism:** RC's gap0 exceeds R9's by at least 0.05.

## Limits

- **Everything in v5's limits applies.**
- **Capacity.**
  - Bridge 2 adds 12,290 parameters over R: P20 and P02 at 4,096 each, four query and key maps at 1,024 each, and two biases.
  - Compassion adds 201 more: Ps at 192, plus 9 sting weights.
  - So "R9 ahead of R" may be capacity, and V1 cannot tell a closed triangle from the sum of two separate links. Rskip and Rup bound this, but they do not settle it.
- **Who hears the sting.** The sting reaches only the receiver's own top and gates. A donor stream never hears how its message landed elsewhere. RCx feels another stream's sting, which partly carries that donor path.
- **0 → 2 reads rung 0's post-message state on purpose.** This is how the top hears what the bottom became. It means u2 can take in content from another timeline (the echo), which the mechanism readout excludes.
- **The 3/6/9 judge's misfits** (from `system_369_raw.json`):
  - the ladder was deliberate;
  - the top having nothing above it is the normal end of a hierarchy;
  - a clean message is context, not an "opposite";
  - node and bridge scores overlap;
  - up and down links differ in kind;
  - completeness depends on the arm;
  - the frame has no clock.
- The relief term compares two different heads (aux0 before the help, main after it), so it is only a proxy for "did the help help".
- Segment-level poison makes a running sting unusually easy to use. Real wrong help may not arrive in 256-character runs.
- The arms are all variations on R, so v6 says nothing about the measured gates.
