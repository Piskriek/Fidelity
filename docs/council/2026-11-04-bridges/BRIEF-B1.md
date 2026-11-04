# Brief B1: builders' council (ASK)

Target of this round: Vector steering and bridge checks, given the council's definition of the entity (docs/council/2026-11-04-entity/STEER.md section 2: a field of cells, each honest only when a named, measured, fresh source drives it). Builders steer: how the per-cell binding is built, which channels can carry a source into a cell, and the order of everything on the table. Opposers check the bridges we have: the WoW inputs, the holon's flows, and the chain from this repo to the owner's screen.

Your lens: Binding architect.

Explore the bridges we COULD build here through that lens. Rank them by visible payoff per hour. For each: the claim,
the evidence (file:line, or what the repo lacks), the effort, the risk, the first concrete step (which file and
function changes, and the test that would check it), and what would prove it works. Say what does not help.

Read first: RESUME.md (the top sections), the files the target names, and the skill at
.agents/skills/sq-distortion-check/SKILL.md.

Rules (the SQ Distortion Check skill applies, .agents/skills/sq-distortion-check/SKILL.md): read-only on the code;
write exactly one file, your report; cite file:line for every claim about the code; mark every claim about the game
client "from the code" or "needs in-game verification"; mark rules of thumb "general knowledge"; invent no API names,
measurements or results; no git, no network; at most 1500 words; a thesis paragraph, a ranked list, a closing table.

Output: write exactly one file, B1-binding-architect.md. Reply with a 10-line summary of your ranking when done.

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

Your viewpoint, in detail. Binding architect. Design the per-cell binding in FidelityEMatrix/EMatrix_Core.lua and EMatrix_World.lua: a registry
(cell index, source name, value in [0,1], age, evidence kind), an API the overlays and the holon channel call, the "no
source" neutral draw (closed E, no glint), a /fide cells report, the login line counting bound cells, and a config gate
so the DRAW only changes when the owner turns it on (round 1 forbids default changes before verification). Specify the
first binding, the eight actor slots (EMatrix_World.lua's pool: token present, band from CheckInteractDistance, kinds:
measured when the range call answered, symbolic when "unknown"), and how a stale slot closes its cell. Give the headless
tests (tools/ematrix_headless.lua) that would prove it, and what the first in-game check is.
