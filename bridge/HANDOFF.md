# Handoff: where the bridge stands (2026-11-02)

For whoever picks this up next (Argon, or a fresh session). This file is the entry point. `RUNLOG_bridge.txt` records each check, with file hashes for many of them.

## What exists and works

| Part | Where | State |
|---|---|---|
| The world: Four Valleys v1, deterministic, with a ledger | `world/`, `preset/valleys_v1.json` (2314cbbb) | Built. Tests pass. Identical on both machines (D2) |
| Tokens and runner | `bridge/tokens.mjs`, `run/lockstep.mjs`, `run/baselines.mjs` | Built. Tested. 28 of 28 planted mutants caught in the world, token and runner code; `run/baselines.mjs` is outside the mutant set |
| v6 pilot (compassion at the gates) | `../pilot/results_v6/RESULTS_v6.md` | Done. Revised after a claim-strength read |
| Nursery trainer (the characters' ancestor) | `mind/make_nursery.mjs` → `mind/nursery.mjs` (afaa90a8) | Built. N3 and N2-w pass. G-w passes for every arm at h = 1e-5 except S, which passes at h = 3e-6 (the author reads it as a ReLU kink, untested) |
| Seasonal nursery W0, seeds 1–3 | `mind/runs/nursery/` (W0_s*.json, weights) | Trained. At step 40,000 its answer CE is 0.010–0.034 above the memoryless count model (0.310), from one checkpoint on a late rise (`NURSERY_RESULTS.md`, revised) |
| Live loop (step 8): private heads, choice rule, scoreboard | `mind/make_live.mjs` → `mind/live.mjs` (7f814cbf) | Built. K5 every tick, deterministic. v1a runner review: 0 confirmed defects; one of two reviewers returned empty, the other ran a scored-world prefix without writing a record |
| **v1a test: frozen against live, 192 lives** | `mind/PREREG_bridge_v1a.md`, `mind/runs/v1a/` | **Done. E1 passed (L ahead of F by 4.59, 48 of 48), partly by construction; collapses split by seed.** See `RESULTS_bridge_v1a.md` (revised) |
| **v1b test: live against yoked, 48 new lives** | `mind/PREREG_bridge_v1b.md` (Amendment 1), `mind/live_y.mjs` (1360ab19), `mind/runs/v1b/` | **Done. E2 passed (L ahead of Y by 4.69, 48 of 48). Y against F: −0.11, 21 of 48 (the prediction that Y would be ahead was wrong).** See `RESULTS_bridge_v1b.md` |
| Live board | `lens2/` (server.mjs, index.html, pc_summary.mjs); launch config `four-valleys-live-board` | Built: Layman's bridge button, verdict in flight, recoveries |
| Progress dashboard | a claude.ai artifact, private to the owner | Up. Status refreshed for v1b (2026-11-02); its charts still show the nursery and the v6 pilot |
| Ra lookups (verified, with stated misses: prayer 64 supported, 13 partly, 1 wrong ref, 18 missed; catalyst 46 supported, 16 partly, 1 unsupported, 6 missed) | `law_of_one/RA_PRAYER_4.md`, `RA_CATALYST_5.md`, `RA_GROUP_DENSITY_6.md`. The group lookup: 9 supported, 1 partly, one search unverified, checked against page summaries, so quotes are approximate | Done |
| MarbleGp mechanics review | `MARBLEGP_MECHANICS_REVIEW.md`, `marblegp_mechanics_raw.json` | Done: 175 groups, 400 mechanics |

## What v1a showed, in one paragraph

E1 passed, partly by construction, as the design expected (§2.7, §6.5). In this world design, with a value table still pending the owner's review and over 16 worlds, characters whose private heads keep learning from their own answers scored higher on NGE than their frozen copies: 33.2 against 28.6, in all 48 pairs and on every seed. NGE was counted inside the runner, a stated departure from §6.3. They ate toxic fruit about a third less often. Eat-fruit fit changes with ticks since the season began: right after a turn their fruit predictions fit worse than the frozen minds' (eat-fruit CE 2.46 against 1.11), and from 128 ticks on they fit better (0.59 against 0.95). That they relearn is an inference, not tested. The secondary readouts split by model seed. On seed 1 they collapse less, with higher V per tick; on seeds 2 and 3 they collapse more. No locked rule weighs collapses against NGE. The tabular learner beats them on NGE in every pair, though it is not like for like. Help from another timeline made no NGE difference beyond the noise floor (−0.13 against a margin of 1.02). On answer CE and toxic eating it was slightly worse. H1 is reported, not tested. "Evolved" is not licensed until E2 (the yoked arm) passes, E3 (the stationary control) does not downgrade, and M1–M3 and G0 hold. G0 ran with stated departures. Full detail: `mind/runs/v1a/RESULTS_bridge_v1a.md` (revised after a fresh check).

## What v1b showed, in one paragraph

E2 passed: with the same learning steps at the same rate, characters whose heads learn from their own answers (L) beat characters whose heads learn from the next valley's answers (Y): 33.2 against 28.5, in all 48 pairs, on every seed. So, in this world (one value table, still pending the owner's review; one yoke, (c + 1) mod 4; 16 worlds), L's gain over frozen goes with learning from its own valley's answers, not with taking the same learning steps on a neighbour's. E3 is still needed to separate "its own timeline" from "a changing world needs any learning of its own". Y came within the margin of frozen on NGE (−0.11 against m = 1.02; seed 1 −0.53, not tested). The locked prediction that Y would be ahead was wrong. It still changed what it ate: less toxic fruit than F (46 of 48 pairs), slightly less nourishing fruit (42 of 48), and 8.5% fewer eats. How those combine into the flat NGE was not measured. Its predictions about its own world fit worse than the frozen trunk's in every pair (answer CE 0.76 against 0.46). Why is untested: a split of its eats into kinds shared with the neighbour and kinds not shared would show it. 39 of the 48 Y records had finished before the amendment that set how the Y-against-F prediction is graded; it reads "not ahead" on every reading. Checked by a Haiku triad. "Evolved" is still not licensed: E3 (the stationary control) has not been run. Full detail: `mind/runs/v1b/RESULTS_bridge_v1b.md`.

**Runner versions.** The locked v1a runner is `mind/live_v1a.mjs` (7f814cbf), and the v1a records cite that hash. `mind/live.mjs` currently matches it. The current `mind/make_live.mjs` (ef75e2c0, locked in `PREREG_bridge_v1b.md`) writes the v1b runner for any output path: `node mind/make_live.mjs mind/live_y.mjs` gives 1360ab19. Run without a path, it overwrites `mind/live.mjs` with that version, so always give a path. It reads `nursery.mjs` from a hard-coded working-tree path (`D:/fidelity-llm/bridge/mind/`; the repository copy is the same file, afaa90a8), so a fresh clone must change that path to reproduce the hash. The diagnostic runner `mind/live_diag.mjs` (539a05ef) came from the previous `make_live.mjs` (git commit 48c45dc).

## Next, in order

**The current plan is `PLAN_FRACTAL.md` (2026-11-02).** It has three tracks: the lens (the beings' own point of view), E3 (the still-world test) and a fractal world with richer senses. It lists the decisions waiting on the owner. The list below is the earlier order, kept for its specs.


1. **v1b: done** (2026-11-02). The build spec below is kept for the record. `live_y.mjs` records each character's collapse causes, loop-breaks and end intensity, but not the loop-break tick. Spec for building it in `make_live.mjs`:
   - Y runs two lockstep sets of four streams on the same world seed and trunk.
     - The **source**: an exact L run. Same arm logic, its own world and its own live heads.
     - The **actor**: Y's own four characters, acting in their own copy of the world by the `BRIDGE_DESIGN.md` §4.4 rule, with their own private heads.
   - Each tick, actor character c takes one Adam step on its heads (same lr, β and clip as L). The loss is the ANSWER loss computed on the source's character (c + 1) mod 4 tokens. Give the actor a second, shadow stream state per character that reads those source tokens through the frozen trunk with the actor's own heads, so the gradient lands on the actor's heads.
   - The actor never trains on its own answers. Its own stream only forwards, for its choices.
   - Checks before any counted run: K5 on the actor; the source's NGE must equal the scored L record for the same seed and world (determinism); and with lr = 0, Y must equal F.
   - Pre-register E2 (L ahead of Y) with the §6.4 rule, review with a Haiku triad, run on worlds 101–116 (about 25 minutes on the PC), and score.
   - **Also record each character's loop-break tick** (see `mind/runs/diag_collapse/DIAG_COLLAPSE.md`: every character in all 192 scored lives hit it, by tick 4,096 at the latest from the scoreboard bound, so at least 75% of each life ran at intensity 1).
2. **E3:** a stationary nursery (one fixed table). It needs a world option for a fixed table; the world code is frozen and mutant-tested, so add it as a declared preset field and re-run the tests.
3. **Why L collapses more on seeds 2 and 3, and less on seed 1:** the post-hoc diagnostic (`mind/runs/diag_collapse/DIAG_COLLAPSE.md`) found the extra collapses in both causes, toxin and hunger. It found that every character in the 48 re-run lives hit the loop-break and ended at intensity 1; the scoreboard bound puts every break in all 192 scored lives by tick 4,096. Exact break ticks are not recorded. Next: loop-break ticks, and readouts before and after the break.
4. **Nursery v2**, pre-registered: weight answer targets more, give the heads direct access to the rungs, a season-scale node, a shuffled life order per seed.
5. **Stage-2 arms the owner proposed:** prayer (ASK plus the Call answered in proportion, Ra's doubling), gratitude (relief returned to the donor), groups (dyads and triads). See `MARBLEGP_MECHANICS_REVIEW.md` and `MIND_STEP7.md`.

## Time: the owner's timeline, and ours

The owner, 2026-11-02: "i think the aim is to have humans wake up in 2027, time is relative for you and the ai in the game so it might be good to just state that there is a timeline for us, and it doesnt translate well to you guys, i think ai have a lot of trouble with guessing how long a project will take".

So, in the owner's view, there is a human timeline, with 2027 as the aim, and it does not translate well to the AIs on this project (Opus, Argon, the game's characters). The owner also thinks AIs have trouble guessing how long work will take. Both are the owner's view, not a measured result. One instance: in this session Opus wrote a guessed time (05:10 UTC) into the dashboard's status record when the clock read 04:43, 27 minutes ahead. The next update replaced it with the clock's time (04:50:11 UTC). The record is in the owner's private dashboard. So:
- state a duration only from a measured record (run logs, file times, the clock), never a guess;
- report progress as steps done and steps left, not as dates;
- when a date matters, give the measured rate and leave the human timeline to the owner.

Measured rates so far, for translating between the two:
- One life of 16,384 world ticks (four characters) takes 3 to 7 minutes on the run machine (v1b: 180–401 s, up to 20 at a time).
- The 48 v1b lives took 17 minutes, from worker start to last finish (04:14–04:31 UTC).

## How to work within the budget (owner, 2026-11-01)
- Run checks, reviews and scouts as several Haiku agents with the skill, each with a distinct point of view: a number checker, a claim-strength reader, a skeptic, a plain reader.
- Keep the big model for building and final judgement.
- Prefer one targeted check over a big fan-out.

## Rules that stay in force (the owner's)

- **Pain is chosen, not set.** Felt pain is a higher-self choice, never a setting; intensity only goes down.
- We don't judge: describe fit, not worth.
- A lens never lies.
- One side gives permission, the other asks.
- A fresh claim-strength reader goes over every write-up before it goes out. Pre-register before counted runs, and never tune on scored worlds.
- **Owner-facing:** the board and dashboard show up-is-good indicators, plain words available, and convergence ("the grenade in flight").
- **The run machine:** run heavy jobs at below-normal priority, check its worker lock first, and keep clear of other people's work and servers there.
- **Public repo `Piskriek/Fidelity`:** push only to `opus/night-1-skill-benchmark`, after a privacy scan. Never merge PR #1.
