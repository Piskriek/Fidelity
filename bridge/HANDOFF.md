# Handoff: where the bridge stands (2026-11-01, late)

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
| Live board | `lens2/` (server.mjs, index.html, pc_summary.mjs); launch config `four-valleys-live-board` | Built: Layman's bridge button, verdict in flight, recoveries |
| Progress dashboard | a claude.ai artifact, private to the owner | Up. Its status and data need a v1a refresh |
| Ra lookups (verified, with stated misses: prayer 64 supported, 13 partly, 1 wrong ref, 18 missed; catalyst 46 supported, 16 partly, 1 unsupported, 6 missed) | `../law_of_one/RA_PRAYER_4.md`, `RA_CATALYST_5.md` | Done |
| MarbleGp mechanics review | `MARBLEGP_MECHANICS_REVIEW.md`, `marblegp_mechanics_raw.json` | Done: 175 groups, 400 mechanics |

## What v1a showed, in one paragraph

E1 passed, partly by construction, as the design expected (§2.7, §6.5). In this world design, with a value table still pending the owner's review and over 16 worlds, characters whose private heads keep learning from their own answers scored higher on NGE than their frozen copies: 33.2 against 28.6, in all 48 pairs and on every seed. NGE was counted inside the runner, a stated departure from §6.3. They ate toxic fruit about a third less often. Eat-fruit fit changes with ticks since the season began: right after a turn their fruit predictions fit worse than the frozen minds' (eat-fruit CE 2.46 against 1.11), and from 128 ticks on they fit better (0.59 against 0.95). That they relearn is an inference, not tested. The secondary readouts split by model seed. On seed 1 they collapse less, with higher V per tick; on seeds 2 and 3 they collapse more. No locked rule weighs collapses against NGE. The tabular learner beats them on NGE in every pair, though it is not like for like. Help from another timeline made no NGE difference beyond the noise floor (−0.13 against a margin of 1.02). On answer CE and toxic eating it was slightly worse. H1 is reported, not tested. "Evolved" is not licensed until E2 (the yoked arm) passes, E3 (the stationary control) does not downgrade, and M1–M3 and G0 hold. G0 ran with stated departures. Full detail: `mind/runs/v1a/RESULTS_bridge_v1a.md` (revised after a fresh check).

## Next, in order

1. **v1b:** E2, the yoked arm Y (§6.1). It learns from character (c+1)'s logged tokens, with the same head steps. Add it to `make_live.mjs`, pre-register, review, run (about 45 minutes on the PC).
2. **E3:** a stationary nursery (one fixed table). It needs a world option for a fixed table; the world code is frozen and mutant-tested, so add it as a declared preset field and re-run the tests.
3. **Why L collapses more on seeds 2 and 3, and less on seed 1:** add a readout (hunger collapses against toxin collapses per arm) before anyone interprets it.
4. **Nursery v2**, pre-registered: weight answer targets more, give the heads direct access to the rungs, a season-scale node, a shuffled life order per seed.
5. **Stage-2 arms the owner proposed:** prayer (ASK plus the Call answered in proportion, Ra's doubling), gratitude (relief returned to the donor), groups (dyads and triads). See `MARBLEGP_MECHANICS_REVIEW.md` and `MIND_STEP7.md`.

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
