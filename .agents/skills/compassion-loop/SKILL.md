---
name: compassion-loop
description: Run one round of the compassion loop on any target at any scale (a function, a texture algorithm, an overlay, a daemon, the whole holon) - a builders' council (ASK), an opposing council (DECISION), a steer (CHANGE) and the news back (LANDED). Use when the owner asks for a council, a review-and-build cycle, "steer the vector", or when a bridge has been built and nothing has yet attacked it. The councils keep the loop healthy; the loop does not stop at 3.
---

# The compassion loop, as councils

The repo's invariant (docs/TRIAD_369_SEED_BOOTSTRAP.md, triad_369_process.mjs): `ASK -> DECISION ->
CHANGE -> NEWS BACK (LANDED: used | changed | nofit)`; the loop does not stop at 3, it returns
with compassion. The owner (04 Nov 2026): "the councils keep the loop healthy; this should be
built into the fractals; this is the compassion loop." So one round of the loop is two councils
and a steer, and the round is self-similar: it runs the same way on a 32 px texture cell as on
the four-node holon, and a round's LANDED is the next round's ASK.

| Step | Who | Writes | Question |
| :--- | :--- | :--- | :--- |
| ASK | the builders' council: N voices, one lens each | `B<n>-<lens>.md` | which bridges could we build here, ranked by payoff per hour, with evidence and a first step |
| DECISION | the opposing council: N voices, one hostile thesis each | `O<n>-<thesis>.md` | which of the bridges we have built hold; attack as hard as the evidence allows, then concede |
| CHANGE | the director (you) | `STEER.md` | the vector: what both councils agree on, what the attacks forbid, the one first step, the in-game check that settles the rest |
| NEWS BACK | the director, after the first step is built and the owner has seen it | `LANDED.md` | `used`, `changed` or `nofit`, with the evidence (a test line, a screenshot, a probe output), and the next round's ASK |

A round is **healthy** when all four exist; the loop is healthy when the newest round is closed
or younger than seven days. `node tools/council.mjs check --all` says which.

## How to run a round

1. Scaffold: `node tools/council.mjs new <slug> --target "<one sentence>" --builders "<lens>;<lens>;<lens>" --opposers "<thesis>;<thesis>;<thesis>"`. It creates `docs/council/<date>-<slug>/` with `ROUND.json`, one `BRIEF-*.md` per voice and a `README.md`. Edit the briefs if the generic text misses the target.
2. Spawn one agent per brief (`model: haiku` by default: the voices are many and cheap; use a stronger model for a voice whose lens needs deep reading), `run_in_background: true`, all in one message. Each brief already says: read-only on the code, write exactly its one report, cite `file:line`, label client-API claims "needs in-game verification", no git, at most 1500 words, end with a table.
3. Read every report yourself before trusting it (haiku voices cite well and over-claim sometimes). Where a builder and an opposer disagree, the evidence decides, not the side.
4. Write `STEER.md` with the headings `## Vector`, `## First step`, `## Forbidden until verified`, `## The check that settles it`. One first step, small enough to land in the same session.
5. Land the first step (code, tests, docs), push, then write `LANDED.md` with `## News back` and a line `Status: used|changed|nofit` once the owner has seen it; until then `Status: pending` with what you are waiting for. Add the round to RESUME.md.
6. `node tools/council.mjs check docs/council/<date>-<slug>` must say healthy before the session ends, or RESUME says why not.

## Rules every voice carries (the SQ skill applies to them too)

- Evidence first: a claim about the code cites `file:line`; a claim about the game client is marked "from the code" or "needs in-game verification"; a perceptual or physical rule of thumb is marked "general knowledge".
- Nothing invented: no API names, functions, measurements or test results that were not read or run.
- One file each, read-only otherwise, no git, no network.
- Opposers defend their thesis as hard as the evidence allows and then concede exactly what it forces; builders rank by payoff per hour and say what does not help.
- Short: at most 1500 words, a thesis paragraph, a ranked list, a closing table.

## Fractal use

Run a round on the thing in front of you at its own scale: "the microlens texture repeats" (ASK:
non-repeating variants; DECISION: what the 32 px downscale destroys; CHANGE: four hashed
variants; LANDED: the owner's screenshot), then on the overlay it belongs to, then on the holon
that carries it. Each closed round feeds the one above it; none of them stops at 3.
