# Pre-registration: bridge v1a, frozen against live (2026-11-01)

This file is written before any counted run. Its hash goes into `RUNLOG_bridge.txt` with the hashes of the code, the runner and the scorer. It is the first stage of BRIDGE_DESIGN.md §6.7's `PREREG_bridge_v1.md`: E1 with its regime checks and noise floor, H1 reported, and T against L reported.

**Not blind.** It follows from v4–v6, from the design, from the nursery's results (`mind/runs/nursery/NURSERY_RESULTS.md`) and from the smoke runs listed below.

## The question

**E1, changed by its own experience:** does a character whose private heads keep learning from its own answers (L) do better than its frozen copy (F)?

## Arms (§6.1, a subset)

| Arm | What it is |
|---|---|
| F | The frozen nursery trunk W0_s with its template heads. Forward only; its in-context state and sting still run. No help: bridge 2 carries the character's own u2 |
| F2 (F′) | F with a second action-sampling stream: the noise floor |
| L | Live private heads from W0_s: one Adam step on its own heads per answer (lr 2e-3, β 0.9/0.999, clip 1, no warm-up). No help |
| LH | L plus help from another timeline on bridge 2 (§3.4: receiver with probability 0.25 per 64-tick segment, one donor per segment) |
| O, T, S, RND | References, not graded (run/baselines.mjs): an oracle that knows the table; a tabular learner (per-kind running mean of EAT answers, keep 0.9, ε 0.1, the same REST rule); the nursery script; random |

**The choice rule** for every neural arm is §4.4's:
- U(a) is the character's own predicted answer distribution for action a, weighted by the preset's value table (V = gain − pain at the default intensity).
- With ε = 0.1 the character explores, on uniforms keyed by (world seed, model seed, stream, character, tick).
- Otherwise it takes the action with the highest U, ties going PASS, then EAT, then REST.

The value table is the character's wants, never felt: the sting stays the mind's own three numbers, under the owner's pain ruling. The table is still pending the owner's review (§8 decision 11). Here it is a declared input.

## Seeds and pairing

- Model seeds 1–3 are the nursery trunks W0_s1–3 (weights hashed below). The world seeds are 101–116, giving 48 (model seed, world seed) pairs per arm.
- The scored world seeds are disjoint from the nursery's (20000–20019 and 29000–29001) and from the smoke runs' (31000) (K7).
- One life of 16,384 ticks per run, at the default intensity ℓ = 2. The world's loop-break acts per character (critique finding 2a).
- The readout runs from the first season boundary to the end of the life (run/baselines.mjs `readouts`).
- Common random numbers on the world, and on action sampling across F, L and LH. F2 has its own stream.

## Readouts

- **Primary:** NGE, (NOURISH eats − TOXIC eats) per 100 ticks with an item, counted by the scorer from the event log under each valley's true table.
- **Secondary** (decide nothing):
  - mean V per tick, pain per 100 ticks, collapses per 10k ticks;
  - eat rates on toxic and on nourishing fruit;
  - NGE over the last 4,096 ticks (loss of plasticity);
  - held-out answer cross-entropy, overall and on eats of a fruit, and on eats bucketed by ticks since the season began;
  - each character's scoreboard every 512 ticks.
- **Not implemented in v1a:** §6.3's recovery readout and its mechanism readout (predicted P(TOXIC) against the truth each season).

## The rule (§6.4)

X is ahead of Y when all three hold:
- (a) for each model seed, the mean of X − Y over its 16 world seeds is > 0;
- (b) at least 36 of the 48 pairs favour X;
- (c) the mean of X − Y is at least m, where m = max(1.0 NGE, 3 × the sd of F − F2 over the 48 pairs).

Between two references there is no model seed. The pairs are then the 16 worlds: (a) is dropped and (b) needs 12 of 16.

**Regime checks.** If one fails, E1 reads "no test".
- **M1:** S is ahead of RND.
- **M2:** O is ahead of F by at least 3m: (c) with 3m.
- **M3:** T is ahead of F by at least m.

**Reported only:**
- H1, LH against L: mean, per model seed, count favouring LH;
- T against L: mean T − L, count favouring T.

## Build gates (§6.4 G0)

All on the exact code hashes below, before launch:
- every world, bridge and runner test (`test/*.test.mjs`) passes;
- the nursery's checks hold for `nursery.mjs` afaa90a8 (N3, N2-w and G-w, in RUNLOG_bridge.txt);
- **K5**, the counterfactual for the chosen action equals the real forward bit for bit, is asserted every tick inside every scored run, and the scorer refuses a record with a mismatch;
- determinism: one run repeated gives an identical record, apart from its wall time.

**Departures from G0, stated:**
- The per-tick tests B2, W2, W3 and L1 do not run inside `live.mjs`'s own runner. That runner mirrors runLife's port check (encodeAction then decodeAction) and uses the same `step` and `snapshot`.
- The frozen planted-mutant set covers the world, bridge and runner code, not `live.mjs`, which is new. Its code faces a fresh pre-run review instead.

## Departures from §6 (later stages)

Not in v1a:
- Y and E2 (the yoked arm);
- E3 (needs the stationary nursery, which is not built);
- E4 (the home-advantage probes);
- H2 (the fit-label readout).

The trunk was trained with help on bridge 2. F, F2 and L run without it, as §6.1 defines them.

## Smoke runs (listed; none set anything but what §6.7 allows)

- 600-tick runs of F and L on world 31000, seed 1 (K5 0; scoreboard identical across rebuilds).
- A 1,100-tick LH run on world 31000 (K5 0; progress streaming).
- Full-life F and L on world 31000, seed 1, plus the references on world 31000 (`mind/runs/live_full_smoke/`).

ε and the head learning rate stay at their design values (0.1 and 2e-3). Nothing was tuned.

## Predictions, locked

The predictions draw on one full-life smoke run on world 31000, seed 1, which is not scored. There, NGE was: F 36.1, L 39.5, T 44.8, O 51.7, S 37.2, RND 13.2. The margin m is not known before the runs.

| Check or hypothesis | Prediction | Confidence |
|---|---|---|
| M1 (S ahead of RND) | passes | high (about 95%) |
| M2 (O ahead of F by 3m) | passes | low (about 55%): O − F was 15.6 on the smoke world, and 3m could be near that |
| M3 (T ahead of F by m) | passes | about 75% |
| E1 (L ahead of F) | **fails** | about 55%: L was 3.4 above F on the smoke world, likely under m; the direction is likely right but the margin is not |
| H1 (LH against L) | no confident direction | |
| T against L | T matches or beats L (mean T − L ≥ −m) | about 80% (§6.5 predicted the same) |

If M1, M2 or M3 fails, E1 reads "no test" and its prediction is not scored.

## Hashes

SHA-256, at lock time. The scorer checks each record's script hash against `live.mjs` with `--expect`.

| File | SHA-256 |
|---|---|
| `mind/live.mjs` | 7f814cbf959b6e9c885c28b0340b565abf15462f33c643f22532e1dcce9a20bc |
| `mind/make_live.mjs` | 436ac738dc04c2edf591a36fa3ecd06378fc679444f3f2adbe0d4a6c79d8140a |
| `mind/nursery.mjs` | afaa90a876ff1e7b685f33e8b62d148742735ccdeb3ca5a521792f6a29306392 |
| `mind/score_bridge_v1a.mjs` | 86864125c893db5460953ec1eb9a0aa9d3720c6282cf905bcf54ecea3d6ee669 |
| `mind/run_worker_v1a.mjs` | 2a57f15cc9829a1e33b229cc46467fbe90eed7c36cac758c09a8a216bdabaada |
| `run/baselines.mjs` | f312ad6977becc22b7a203c5a95a61670c1308d344e6d0e11df2cbb38d3662bf |
| `run/lockstep.mjs` | d02b6c1540b2de9e2d06df43b2c442526614513c248a7dee123d306c5980ae23 |
| `world/valleys.mjs` | 7be9f53d68f70114cd46f959d751a92de44551e4c33bac45111b289d6bec3fc5 |
| `world/hash.mjs` | 52361ef683bd687e26882cf9074903d215b048cd6f2aa7399d899eb818130350 |
| `bridge/tokens.mjs` | d3e37b930b8b4beda13ad8fa0fcc2c951112548a9028a780ce5a21e01612ddb9 |
| `preset/valleys_v1.json` | 2314cbbb1edd3650a68d5f0e001fc3986c84f1574b9b8c04cca96b919ce880df |
| `mind/runs/nursery/W0_s1.weights.bin` | 6efe544de9058e43fbfc8c2b251514eb44138e4b657b7476922e47709dbf2113 |
| `mind/runs/nursery/W0_s2.weights.bin` | 085c273ce950d2f085e04cd3a123c3c784a982d6a15d78d2dfab291173dd6ff3 |
| `mind/runs/nursery/W0_s3.weights.bin` | 7eb30edc3812a76edab7c06b379feffeffd4b52f72f5518a34f2d7e339ca2b7f |

Checks at lock time: `test/world.test.mjs`, `test/bridge.test.mjs` and `test/lockstep.test.mjs` pass. Determinism holds: two LH runs, seed 2, world 31000, 1,200 ticks, gave identical records. K5 was 0 in every smoke run.

## Amendment 1 (2026-11-01, before any counted run)

A fresh pre-run review (`mind/runs/review_v1a_prerun_raw.json`; four reviewers, each finding checked by two skeptics) confirmed eight findings. They are fixed or disclosed here, before any of the 192 runs exists. The predictions above are unchanged.

**Scorer fixes** (new hash below):
- The E1 line now grades the locked prediction ("E1 fails"), not the design's "passes".
- A record with any problem (K5 mismatch, wrong arm, seed, world or ticks, wrong script under `--expect`, wrong trunk) is refused and scored as missing.
- A comparison with missing or refused records, or an undefined margin, prints "not scored". It never prints WRONG.

**Disclosed: the references on the scored worlds were known.**
- The bridge build's step-3 baselines ran O, T, S and RND on worlds 101–116 (BUILD_STATUS M1 table, from an earlier preset: O 49.6, T 41.9, S 31.0, RND 11.0).
- The scorer's dry run, while testing these fixes after the lock, printed them again under the locked preset: O 50.53, T 42.68, S 31.10, RND 11.13.
- So M1 was effectively known, except for m. M2 and M3 rest on O and T values that were known, and on F's values, which are not.

**Corrections to the text above:**
- NGE is computed by `run/baselines.mjs` `readouts()` inside the runner, from the run's own event log under each valley's true table, and stored in each record. The scorer reads it. This departs from §6.3's "counted by the scorer from the event log".
- S is the script that eats every fruit it sees (`run/baselines.mjs` `makeS`). It is not the nursery's behaviour policy.
- Intensity starts at ℓ = 2 in every valley. The world's loop-break lowers it per character after three collapses from one cause (critique finding 2a), so later parts of a life may run at ℓ = 1.
- **Secondary readouts.** The scorer reports mean V, pain, collapses, the two eat rates, NGE over the last 4,096 ticks, and the two answer CEs. The CE by ticks since the season began, and the scoreboard series, are in each record but not in the scorer's report. The CE readouts cover the whole life; NGE is counted from the first season boundary.
- **G0 departures, extended:**
  - N4 is not run as a test;
  - K7 (seed disjointness) is stated, not tested in code;
  - `run/baselines.mjs` and `live.mjs` are outside the planted-mutant set;
  - the PC copies are hash-checked when copied (live.mjs, the worker and the seed-1 trunk weights matched), not at run time.

**The runner's own review did not complete:** it hit a usage limit. The runs are launched at the owner's go-ahead ("yeehaw, lets ride!"). The runner review is completed before scoring. If it finds a defect that changes results, the affected runs are redone, and that is reported.
