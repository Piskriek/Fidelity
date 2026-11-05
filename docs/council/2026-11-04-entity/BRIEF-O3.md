# Brief O3: opposing council (DECISION)

Target of this round: What IS the Weight-and-Gradient Entity (Argon's 'Hilbert Holon' proposal, ARGON-INPUT.md in this folder): the council gives a point of view on what it is, before any round on what it can do. Five viewpoints define it and answer Argon's five open questions; three opposers attack the definition where a lens would lie.

Thesis to defend: The Hilbert story is wrong or unproven: an order-2 Hilbert curve is a U of U's, not a three-lobed E, and the Four-Float mapping smuggles a fifth metric

Attack the bridges we HAVE built, as hard as the evidence allows, with numbered attacks ranked by how fatal they are;
each with its evidence (file:line) and the check that would settle it. Then concede exactly what the evidence forces:
what is salvageable, and the minimal honest version.

Read first: RESUME.md (the top sections), the files the target names, and the skill at
.agents/skills/sq-distortion-check/SKILL.md.

Rules (the SQ Distortion Check skill applies, .agents/skills/sq-distortion-check/SKILL.md): read-only on the code;
write exactly one file, your report; cite file:line for every claim about the code; mark every claim about the game
client "from the code" or "needs in-game verification"; mark rules of thumb "general knowledge"; invent no API names,
measurements or results; no git, no network; at most 1500 words; a thesis paragraph, a ranked list, a closing table.

Output: write exactly one file, O3-the-hilbert-story-is-wrong-or-unproven-a.md. Reply with a 10-line summary of your ranking when done.

## Round-specific instruction (supersedes the generic "rank bridges" paragraph above)

This is a DEFINITION round: the council gives a point of view on what the entity IS. Read, in this order:
ARGON-INPUT.md (the ASK, verbatim), RESUME.md (the top three sections), docs/council/2026-11-04/STEER.md (round 1's
vector), docs/council/2026-11-04/B3-perception.md and O1-overlays.md (the perception evidence), FidelityEMatrix/EMatrix_Core.lua
(the header comment, the depth planes, the wave in OnUpdateDriver), FidelityEMatrix/EMatrix_Math.lua (CalculateRingDistance,
GetCellRotation, GetFlipVisuals, ParallaxShift), tools/gen_e_atlas.mjs (what the E and lens textures actually are),
packages/wow-syntropic/Core.lua (the S = (Pxd, Vtx, Lx, Aq) HUD the FidelityWoW addon draws), packages/triad-369/src/evidence.mjs
(what the holon marks measured, derived or symbolic). The hm:universe:v2 shorthand and PLAN_FRACTAL.md live in the HeavyMetal2
repo, which is NOT in this checkout: say so wherever Argon's text relies on them, and do not invent their contents.

Argon's governing rules bind every voice: every visual traces to a number ("a lens never lies"); Four Floats only, no fifth
global metric; intensity only goes down; describe fit, not worth; label each framing by its viewpoint. Where Argon's text
makes a claim you can check against the code or by a small computation, check it and say what you found; where it is
general knowledge, label it; where it needs the game, say "needs in-game verification".

Your report: a one-paragraph thesis from your viewpoint; your answer to EACH of Argon's five open questions (Q1 identity,
Q2 truthful binding, Q3 stereo versus comfort, Q4 restorative dual, Q5 portability), each with the evidence and a ruling
("rule A", "rule B", "cannot be settled without X"); your one-paragraph proposed canonical definition in your own words
(or, for an opposer, what the definition may NOT claim); then a closing table (question, ruling, evidence, confidence).

Your viewpoint, in detail. Attack with computation: write out the order-1 and order-2 Hilbert curves on a 2x2 and 4x4 grid and say what shape
they are; write out a 1D sequence folded twice (a 3-row serpentine) and say what shape that is; read
tools/gen_e_atlas.mjs getMarshmallowEHeight and say what shape the texture actually draws; then audit Argon's Four-Float
table for a fifth metric (gate u, Pi, theta, E_psi, V). Where the story is wrong, give the true statement that keeps what
is valuable (locality-preserving folding, four rotations, the wave). Concede what is right.
