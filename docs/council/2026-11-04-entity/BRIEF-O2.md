# Brief O2: opposing council (DECISION)

Target of this round: What IS the Weight-and-Gradient Entity (Argon's 'Hilbert Holon' proposal, ARGON-INPUT.md in this folder): the council gives a point of view on what it is, before any round on what it can do. Five viewpoints define it and answer Argon's five open questions; three opposers attack the definition where a lens would lie.

Thesis to defend: The glasses-free 3D and frame-alternating stereo claims contradict round 1's evidence and 'intensity only goes down': without glasses or a rendering-path change there is no 3D on an LCD, and the default must be the no-flicker path

Attack the bridges we HAVE built, as hard as the evidence allows, with numbered attacks ranked by how fatal they are;
each with its evidence (file:line) and the check that would settle it. Then concede exactly what the evidence forces:
what is salvageable, and the minimal honest version.

Read first: RESUME.md (the top sections), the files the target names, and the skill at
.agents/skills/sq-distortion-check/SKILL.md.

Rules (the SQ Distortion Check skill applies, .agents/skills/sq-distortion-check/SKILL.md): read-only on the code;
write exactly one file, your report; cite file:line for every claim about the code; mark every claim about the game
client "from the code" or "needs in-game verification"; mark rules of thumb "general knowledge"; invent no API names,
measurements or results; no git, no network; at most 1500 words; a thesis paragraph, a ranked list, a closing table.

Output: write exactly one file, O2-the-glasses-free-3d-and-frame-alternatin.md. Reply with a 10-line summary of your ranking when done.

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

Your viewpoint, in detail. Attack with round 1's numbers (B3-perception.md, O1-overlays.md) and general perception knowledge, labelled: the
"glasses-free 3D right in front of the observer" claim, chromostereopsis, the Pulfrich vignette, "negative temporal
parallax", the 60 Hz frame-alternating disparity on an LCD without shutter glasses (flicker, fatigue), and whether the
addon can even alternate per frame (it runs OnUpdate; check what it controls). Rule on Argon's Q3 options (a) and (b).
Concede what a window with a static bezel and a moving interior genuinely gives.
