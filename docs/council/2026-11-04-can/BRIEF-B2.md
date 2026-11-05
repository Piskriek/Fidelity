# Brief B2: builders' council (ASK)

Target of this round: What the bound entity can do. The owner's v1.7.4 screenshots showed eight real sources on eight cells (seven units measured at near 1.00 and mid 0.50, the player symbolic) and the bound state exactly as predicted, and round 3 named the honest flow set a cell may show today (F23 age-floored, F32, F31 labelled self-check). Builders: which bridges does the bound entity make possible now, each as a binding with its channel (the holon's honest flows on the tiles through a generated Lua file read at /reload; the eye, cursor or head tracker, as a named measured source; the click on a bound cell as an event the entity emits), and which does the definition rule out. Opposers: what each of those bridges can honestly show, what the client forbids, and what the eight sources add that the owner's screen did not already show.

Your lens: The eye as a source: the cursor and the head tracker's virtual gamepad bound to cells as named, measured, fresh sources, and what a cell driven by a measured eye can do that the constant planes cannot.

Explore the bridges we COULD build here through that lens. Rank them by visible payoff per hour. For each: the claim,
the evidence (file:line, or what the repo lacks), the effort, the risk, the first concrete step (which file and
function changes, and the test that would check it), and what would prove it works. Say what does not help.

Read first: RESUME.md (the top sections), the files the target names, and the skill at
.agents/skills/sq-distortion-check/SKILL.md.

Rules (the SQ Distortion Check skill applies, .agents/skills/sq-distortion-check/SKILL.md): read-only on the code;
write exactly one file, your report; cite file:line for every claim about the code; mark every claim about the game
client "from the code" or "needs in-game verification"; mark rules of thumb "general knowledge"; invent no API names,
measurements or results; no git, no network; at most 1500 words; a thesis paragraph, a ranked list, a closing table.

Output: write exactly one file, B2-eye-as-source.md. Reply with a 10-line summary of your ranking when done.

## Round-specific instruction (supersedes the generic paragraph above where they differ)

This is round 4. Rounds 1 and 3 are closed by the owner's screenshots; round 2's definition waits for the owner's
word. Read, in this order: docs/council/2026-11-04-bridges/STEER.md (the vector, the honest flow set in the O2
paragraph, the next ASK), docs/council/2026-11-04-bridges/LANDED.md (what the owner saw in the game, v1.7.4),
docs/council/2026-11-04-entity/STEER.md section 2 (the definition of a source), RESUME.md (the top two sections),
then the files your viewpoint names below. The HeavyMetal2 repo (hm:universe:v2, PLAN_FRACTAL.md) is NOT in this
checkout; say so where it matters and invent nothing about it.

The evidence from the game (v1.7.4, the owner's four screenshots, recorded in that LANDED.md): the login line reads
"cells with a source 1 of 135 (0 fresh and measured)" before the first scan; "/fide cells" lists 8 of 135 with 7
fresh and measured: the player "symbolic", "actor:nameplate9:near value 1.00", six units at "mid 0.50", all
"age 0.0s"; with "/fide bind on" the top row's cells 2 to 8 open as lenses, every other cell closed, no glint. The
terrain overlay drew nothing because UnitPosition was read in the wrong axis order (fixed in v1.7.5, not yet seen in
the game). The HUD's seed labels never reached the game (the deploy copies only the EMatrix folder; task H008).

The definition's test for a source: it is NAMED (a stated origin), MEASURED (a number the host read, not a constant,
a clock or a guess), FRESH (an age against a stated threshold; FidelityEMatrix/EMatrix_Core.lua section 0a uses 2 s
on GetTime()), and carries an EVIDENCE KIND from packages/triad-369/src/evidence.mjs (measured | symbolic |
not_measured). A cell may open only on such a source; otherwise it reads "no source". Argon's rules bind: every
visual traces to a number; Four Floats only; intensity only goes down; describe fit, not worth; label each framing by
its viewpoint. Mark client-API claims "needs in-game verification" and rules of thumb "general knowledge". Name
no WoW API you have not seen in this repo's Lua or stubs without marking it "general knowledge, needs in-game
verification".

Your viewpoint, in detail. The eye as a source. Files: FidelityEMatrix/EMatrix_Core.lua: the eye config (eyeSource,
eyeStick, eyeDepthAxis, eyeGain, eyeCal*, near line 78), EyeGain (near line 200), section 3b "Eye from a gamepad"
(near line 802; GetDeviceMappedState), the cursor eye (near line 924), ApplyDepthPlanes (near line 724: the constant
planes Z_BACK, Z_SUBJECT, Z_GLASS, Z_POP and ParallaxShift), the "/fide eye" commands (near line 1227), and the
registry in section 0a; tools/headtrack/README.md, headtrack.py, headmath.py, test_headmath.py. Design: the eye as
a named source in the registry, "eye:cursor" and "eye:gamepad", what each measures (the cursor is the hand; the
gamepad is the webcam's head), a value in [0,1], freshness, kind; and what a cell driven by a measured eye can do
that the constant planes cannot (each open lens's subject shifting against its own band's depth from
EMatrix_World.lua's BAND table; the stereo pair). Say what it rules out: any parallax claim without a measured head,
and what the login line must say when the eye is the cursor. Give the headless test and the first in-game check
(the owner has not run the head tracker yet; say what the cursor-only check proves).
