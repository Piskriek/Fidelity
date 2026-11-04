# Brief B3: builders' council (ASK)

Target of this round: Vector steering and bridge checks, given the council's definition of the entity (docs/council/2026-11-04-entity/STEER.md section 2: a field of cells, each honest only when a named, measured, fresh source drives it). Builders steer: how the per-cell binding is built, which channels can carry a source into a cell, and the order of everything on the table. Opposers check the bridges we have: the WoW inputs, the holon's flows, and the chain from this repo to the owner's screen.

Your lens: Vector steering.

Explore the bridges we COULD build here through that lens. Rank them by visible payoff per hour. For each: the claim,
the evidence (file:line, or what the repo lacks), the effort, the risk, the first concrete step (which file and
function changes, and the test that would check it), and what would prove it works. Say what does not help.

Read first: RESUME.md (the top sections), the files the target names, and the skill at
.agents/skills/sq-distortion-check/SKILL.md.

Rules (the SQ Distortion Check skill applies, .agents/skills/sq-distortion-check/SKILL.md): read-only on the code;
write exactly one file, your report; cite file:line for every claim about the code; mark every claim about the game
client "from the code" or "needs in-game verification"; mark rules of thumb "general knowledge"; invent no API names,
measurements or results; no git, no network; at most 1500 words; a thesis paragraph, a ranked list, a closing table.

Output: write exactly one file, B3-vector-steering.md. Reply with a 10-line summary of your ranking when done.

## Round-specific instruction (supersedes the generic paragraph above where they differ)

This round follows two closed-but-pending rounds. Read, in this order: docs/council/2026-11-04-entity/STEER.md (the
definition, section 2, and the Wave-1 split, section 3), docs/council/2026-11-04/STEER.md (round 1's vector and
forbidden list), RESUME.md (the top four sections), then the files your viewpoint names below. The HeavyMetal2 repo
(hm:universe:v2, PLAN_FRACTAL.md) is NOT in this checkout; say so where it matters and invent nothing about it.

The definition's test for a source: it is NAMED (a stated origin), MEASURED (a number the host read, not a constant,
a clock or a guess), FRESH (an age against a stated threshold), and carries an EVIDENCE KIND from
packages/triad-369/src/evidence.mjs (measured | symbolic | not_measured). A cell may open only on such a source;
otherwise it reads "no source". Argon's rules bind: every visual traces to a number; Four Floats only; intensity only
goes down; describe fit, not worth; label each framing by its viewpoint. Mark client-API claims "needs in-game
verification" and rules of thumb "general knowledge".

Your viewpoint, in detail. Vector steering. Everything on the table: round 1's vector (five items) and forbidden list, round 2's Wave-1 split
(Opus, Argon, Flash, Codex), the open hands tasks H005/H006/H007 (bridge/hands/laptop_tasks.json), T1 to T5
(docs/RESUME.md section "03 Nov Checkpoint 10"), the fractal texture list (docs/council/2026-11-04/B1-fractal-fidelity.md),
the E atlas (one sun, four pre-lit orientations), B2's comfort defaults (spin 0, gain cap 1.0). Order them by: what the
definition requires first, what evidence each needs before it may proceed, what one person can land in a session, and
what blocks what. Name what to stop. Give the next three rounds' ASKs. Say where the vector contradicts the owner's
stated wishes (full-screen 3D, glasses) and how to say so honestly.
