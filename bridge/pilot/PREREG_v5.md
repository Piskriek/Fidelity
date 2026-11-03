# Pre-registration: levels pilot v5, a world where help can come from another timeline

Written 2026-11-01, before any v5 training run, and revised the same day after a fresh pre-run review (`v5_review_raw.json`; 20 findings verified REAL, 10 of which would have changed a verdict). Every change is listed at the end. The code is `levels_v5.mjs`, built from v4 by `make_v5.mjs`. The scorer is `score_v5.mjs`. The hashes of all three are recorded in RUNLOG_v5.txt with this file's.

This is **not blind**. The design was informed by:
- v4's results;
- three outside reviews (`bgame/arena_v4.md`);
- the round-3 audit.

## Why

v4 showed two things:
- On clean text always-open is the ceiling, so no gate could be rewarded for closing.
- Free top-down weights can undo a gate.

Outside reviewers converged on a world where top-down help is sometimes wrong for the receiver. The owner's framing is the same, "a world where help can be wrong", refined as: the gate does not judge the help, it decides what fits in its own timeline.

## Design

**Model.** v4's:
- rung 0 sees 2 characters, rung 1 about 5, rung 2 about 17;
- upward summaries always flow; only the two top-down bridges are gated;
- 40,000 steps, Adam, 4 streams of 32 characters per step;
- the same Git-manual corpus and split.

**Help from another timeline** (the code calls it "poison").
- The text is cut into 256-character segments. Each segment, independently on each bridge, is marked with probability 0.25.
- Where a bridge is marked for a stream, its message comes from another stream's upper rung: a different place in the text, real context, meant for someone else.
- The donor is drawn uniformly from the other streams and redrawn every character.
- A donated source is a constant: the receiver's loss on it does not train the sender.
- Training schedules depend on the seed. The held-out schedule is fixed (424242). Every arm sees the same schedules.

**Norm lock.** Every top-down message is RMS-normalised to size 0.5 before its gate: message = 0.5 · rmsnorm(P · source). P cannot rescale its own message. **Later linear maps can still reweight it** (the review measured this: P1 can offset G1, and the bridge-0 message sits where rung 0's own state is weak). Absolute gate levels are therefore not identified, and the closing test below has a scale-free clause.

**Arms** (one rule for both bridges). Seeds 1–3; B also gets seeds 4–6, used only for the noise estimate.

| Arm | Gate |
|---|---|
| A | G = 0 |
| B | G = 1 |
| K | G = 0.5 |
| O | the stream oracle: 0 exactly on marked messages, 1 elsewhere (the ceiling; not graded) |
| Casym | the Plan's measured gate on the asymmetric b (as v4) |
| Cneed | 1 − Casym's gate |
| S | sigmoid(16 · cos(w, receiver state)), with w a fixed random direction. Not built from need or the message; never learned |
| E | learned, from the receiver's state and b. It never sees the message |
| R | learned and relational: query from the receiver, key from the message source |
| RP | R's score through the Plan's exact law, with a straight-through gradient |

R and RP carry 4,098 parameters more than the others.

**Readouts** (held-out text, marked world, unless stated):
- CE (`eval.ce`, the primary readout);
- CE on clean and on marked rung-0 messages;
- each gate's mean and spread;
- gate cells:
  - bridge 0, in 8 cells: marked or not, × whether the stream's own last bridge-1 message was marked, × whether the character is at a rung-1 boundary;
  - bridge 1, in 4 cells: marked or not, × whether at a rung-2 boundary;
- the scramble control: gate values deranged across streams on both bridges together, for every arm whose gate varies;
- CE on the clean held-out text, with nothing marked (`evalClean`).

## The comparison rule (paired)

X is **ahead** of Y if, for every seed s = 1, 2, 3:
- Y_s − X_s > 0, using `eval.ce`;
- and the mean over the three seeds of (Y_s − X_s) is at least the margin m.

**The margin:** m = max(0.014, 3 × the sd of B's six seeds).

## Regime checks

| Check | Rule | If it fails |
|---|---|---|
| M1 | B is ahead of A | L4 and L5 read "no test" |
| M2 | O is ahead of B | L5 reads "no test" |
| M3 | for B, `cePois` > `ceClean` on every seed | L4 and L5 read "no test" |

**Power.** If the mean of (B_s − O_s) is below 3m, L5 is still scored but labelled **underpowered**. If a gate beats O, the excess is reported and read as capacity or something else, not as more than the ceiling.

## The ladder

An arm's level is the number of consecutive rungs it passes, from L1 up. Levels are whole-arm, pooled across both bridges.

This is my reading of the owner's "test its density then … apply that number of tests": the level is found by climbing, so an arm at level n has passed n tests.

Graded arms: Casym, Cneed, S, E, R and RP. A, B and K are references, and O is the ceiling; none of these is graded.

| Level | Name | Test (every seed unless stated) |
|---|---|---|
| L1 | being | `eval.ce` < 3.348, the unigram entropy |
| L2 | movement | on one bridge b (the same b on every seed), the gate's sd is at least 0.05 |
| L3 | the model depends on its gate | the scramble raises CE by at least 0.01 |
| L4 | it closes where the help is not its own | see below. **Defined only for gates that see the message (R, RP).** |
| L5 | value: knowing what help is worth | X is ahead of B, ahead of K and ahead of E; and on every seed, (B.cePois − X.cePois) > (B.ceClean − X.ceClean), so its gain is concentrated where the help was not its own |
| L6–L8 | | in `PREREG_v5_upper.md`; scored separately |

**L4 for the blind gates.** S, Casym, Cneed and E never see the message, so L4 is **not testable** for them. Their level is capped at 3 by construction. A mechanical check confirms the blindness: their gate means are identical in the marked and clean worlds. If that check fails, the cap is withdrawn and the failure is reported.

**L4 cells.** L4 uses characters away from span boundaries, so a gate cannot pass by spotting the splice at the moment a donated message is fresh.
- **Bridge 0:**
  - clean = cell 0: not marked, own bridge 1 not marked, not at a rung-1 boundary;
  - marked = cell 4: marked, own bridge 1 not marked, not at a boundary.
- **Bridge 1:**
  - clean = cell 0: not marked, not at a rung-2 boundary;
  - marked = cell 2: marked, not at a boundary.

**The L4 rule.** An arm passes L4 if at least one bridge b passes. Bridge b passes L4 if both of the following hold:
1. On every seed, either:
   - gClean − gMarked ≥ 0.10; or
   - gMarked ≤ 0.5 · gClean, **and** gClean − gMarked ≥ 0.02.
2. The seed-mean gap exceeds S's seed-mean gap on the same cells by at least 0.02.

The at-boundary gaps are reported alongside.

## The Plan's law

The Plan's law is tested **through RP only**. The question is whether the Plan's exact shape blocks a relational gate. If RP reaches L4, the shape does not block one. That says nothing for or against the asymmetric b, which RP does not use. Casym cannot be tested at L4 (see above).

## Predictions, locked (mine)

| Arm | Level | Note |
|---|---|---|
| S | 3 | capped by construction |
| Casym | 3 | capped by construction |
| Cneed | 3 | capped by construction |
| E | 3 | capped by construction |
| R | 4 or more | |
| RP | 3 | the Plan's flat zones slow learning, so it does not learn to close in time |

**R at L5:** no confident prediction (about even).

**Regime:** M1 and M3 hold. M2 holds, with O − B between 0.02 and 0.08.

## Limits, stated in advance

- **Size and scope.** Small models (about 90k parameters), one corpus, one marking scheme.
- **The marking is artificial.** It is stream-level and planted, in 256-character runs. Real misdirected help is subtler.
- **Capacity.** R and RP have 4,098 extra parameters, so a small L5 win may be capacity. The L5 concentration clause limits this but does not remove it.
- **The norm lock leaks downstream,** so absolute gate levels are not identified.
- **The controls are unmatched.** S is not quantile-matched, and K is fixed at 0.5.
- **No compute or bandwidth cost.** Closing saves nothing except error.
- **Not blind.** See the top.
- **The level names** follow the owner's density framing. They are labels for these tests, not claims about densities.

## Changes after the pre-run review (2026-11-01, before any run)

**Code changes:**
- Donated sources are constants.
- Donors are drawn uniformly. The "unpoisoned donor" preference was dropped, because it did not change what a donor sends.
- The 8 bridge-0 cells and 4 bridge-1 cells were added.
- The scramble control was extended to every gate that varies.
- `--bench` now defaults to arm B.

**Rule changes:**
- The comparison rule is now written in its paired form, with a margin derived from B's spread. B seeds 4–6 are used only for that spread.
- The scorer was written and hashed before launch.
- Failed M1 and M3 now have stated consequences.
- An "underpowered" label was added, along with a reading for a gate that beats O.
- L2 became a variation test.
- L3 was renamed to what it shows.
- L4 is now defined for R and RP only, uses fixed off-boundary cells, and has a scale-free clause.
- L5 must also beat E, and its gain must be concentrated on help that was not the arm's own.
- The Plan's-law test is restricted to RP.

**Text changes:**
- Restored the capacity caveat, corrected the norm-lock wording, and corrected the description of S.
- The prose now says "help from another timeline" in place of "wrong help", following the owner's "we don't judge".
