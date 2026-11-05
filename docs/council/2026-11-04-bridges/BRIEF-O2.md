# Brief O2: opposing council (DECISION)

Target of this round: Vector steering and bridge checks, given the council's definition of the entity (docs/council/2026-11-04-entity/STEER.md section 2: a field of cells, each honest only when a named, measured, fresh source drives it). Builders steer: how the per-cell binding is built, which channels can carry a source into a cell, and the order of everything on the table. Opposers check the bridges we have: the WoW inputs, the holon's flows, and the chain from this repo to the owner's screen.

Thesis to defend: Bridge check, the holon's flows: the six flows are four views of one SSH link plus two self-checks, so a cell bound to a flow shows a ritual, not a measurement

Attack the bridges we HAVE built, as hard as the evidence allows, with numbered attacks ranked by how fatal they are;
each with its evidence (file:line) and the check that would settle it. Then concede exactly what the evidence forces:
what is salvageable, and the minimal honest version.

Read first: RESUME.md (the top sections), the files the target names, and the skill at
.agents/skills/sq-distortion-check/SKILL.md.

Rules (the SQ Distortion Check skill applies, .agents/skills/sq-distortion-check/SKILL.md): read-only on the code;
write exactly one file, your report; cite file:line for every claim about the code; mark every claim about the game
client "from the code" or "needs in-game verification"; mark rules of thumb "general knowledge"; invent no API names,
measurements or results; no git, no network; at most 1500 words; a thesis paragraph, a ranked list, a closing table.

Output: write exactly one file, O2-bridge-check-the-holon-s-flows-the-six-f.md. Reply with a 10-line summary of your ranking when done.

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

Your viewpoint, in detail. Attack the six flows as sources: packages/triad-369/src/evidence.mjs and triad_369_process.mjs (F12, F21, F13,
F31, F23, F32; the freshness thresholds; what each actually measures), density_bridge.mjs (the 12/13 defaults, the
coherence formula), bridge/node2-sol/friend.mjs (a 60 s timer that writes up:true), the new hands heartbeat
(bridge/hands/hands_sync.mjs), the Arena branch sync. Round 1's O2 report (docs/council/2026-11-04/O2-holon.md) is the
starting evidence: re-verify what you use. Say what a cell bound to each flow would really show, which flows are
measurements and which rituals, and the minimal honest set of flows a cell may show today.
