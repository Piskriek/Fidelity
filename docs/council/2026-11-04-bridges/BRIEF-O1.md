# Brief O1: opposing council (DECISION)

Target of this round: Vector steering and bridge checks, given the council's definition of the entity (docs/council/2026-11-04-entity/STEER.md section 2: a field of cells, each honest only when a named, measured, fresh source drives it). Builders steer: how the per-cell binding is built, which channels can carry a source into a cell, and the order of everything on the table. Opposers check the bridges we have: the WoW inputs, the holon's flows, and the chain from this repo to the owner's screen.

Thesis to defend: Bridge check, the WoW inputs: none of the addon's inputs is a named, measured, fresh source fit to open a cell

Attack the bridges we HAVE built, as hard as the evidence allows, with numbered attacks ranked by how fatal they are;
each with its evidence (file:line) and the check that would settle it. Then concede exactly what the evidence forces:
what is salvageable, and the minimal honest version.

Read first: RESUME.md (the top sections), the files the target names, and the skill at
.agents/skills/sq-distortion-check/SKILL.md.

Rules (the SQ Distortion Check skill applies, .agents/skills/sq-distortion-check/SKILL.md): read-only on the code;
write exactly one file, your report; cite file:line for every claim about the code; mark every claim about the game
client "from the code" or "needs in-game verification"; mark rules of thumb "general knowledge"; invent no API names,
measurements or results; no git, no network; at most 1500 words; a thesis paragraph, a ranked list, a closing table.

Output: write exactly one file, O1-bridge-check-the-wow-inputs-none-of-the-.md. Reply with a 10-line summary of your ranking when done.

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

Your viewpoint, in detail. Attack every input FidelityEMatrix/ and packages/wow-syntropic/ read from the client as a source under the
definition's test: the click and /fide ripple (EMatrix_Core.lua), the cursor eye and the pad eye (ReadGamepadEye), the
range bands (EMatrix_World.lua RangeBand: nil answers; combat and instances, needs in-game verification), UnitPosition
(player only), GetCameraZoom, the nameplate tokens and plate parenting, the map data (static), the FidelityWoW telemetry
(entropy opt-in, the FTLE heuristic, the literal S). For each: named? measured? fresh? evidence kind? what breaks? Then
concede which inputs pass, and what the smallest honest first binding is.
