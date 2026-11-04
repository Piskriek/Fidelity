# Brief O2: opposing council (DECISION)

Target of this round: Argon's Triadic Dynamical Operator T(W, g, s) over the Four Floats, relayed by the owner at 06:07Z (ARGON-INPUT.md in this folder, verbatim): operationalize it as a math contract with the five invariants as node:test, wire it truthfully to both hosts, lock the comfort contract, and return Shape B (REPORT, LEAD with an ASCII schematic and a canonical definition for the owner's sign-off, INSIGHTS TO ROUTE for Opus, Flash and Argon). Builders build the contract on what this repo has: EMatrix_Math's ring metric, flip and parallax; the binding registry; the holon's Four Floats and evidence kinds. Opposers check it against round 2's definition and the code: which symbols have a measured source, which are seeds or new floats, which hosts and APIs the vector names are not in this checkout or this client.

Thesis to defend: The named hosts are not here: apps/universe, bridge/roster, sq-jepa, @hm/shorthand, hm:universe:v2 and Midnight 12.x are not in this checkout or this client (TBC Anniversary 2.5.6), so deliverables 1 and 2 cannot be verified here and must be scoped to what is

Attack the bridges we HAVE built, as hard as the evidence allows, with numbered attacks ranked by how fatal they are;
each with its evidence (file:line) and the check that would settle it. Then concede exactly what the evidence forces:
what is salvageable, and the minimal honest version.

Read first: RESUME.md (the top sections), the files the target names, and the skill at
.agents/skills/sq-distortion-check/SKILL.md.

Rules (the SQ Distortion Check skill applies, .agents/skills/sq-distortion-check/SKILL.md): read-only on the code;
write exactly one file, your report; cite file:line for every claim about the code; mark every claim about the game
client "from the code" or "needs in-game verification"; mark rules of thumb "general knowledge"; invent no API names,
measurements or results; no git, no network; at most 1500 words; a thesis paragraph, a ranked list, a closing table.

Output: write exactly one file, O2-hosts-not-here.md. Reply with a 10-line summary of your ranking when done.

## Round-specific instruction (supersedes the generic paragraph above where they differ)

This is round 5. Read, in this order: ARGON-INPUT.md in this folder (the owner's paste of Argon's steering vector,
verbatim: the operator T(W, g, s), the four deliverables, the five invariants, the Shape B return format),
docs/council/2026-11-04-entity/STEER.md section 2 (round 2's canonical definition, still unsigned by the owner) and
its section 3 (the Wave-1 split), docs/council/2026-11-04-can/STEER.md (what the bound entity can do today, the
registry's rule, the six defects fixed in v1.7.6), docs/council/2026-11-04-bridges/STEER.md (the honest flow set),
RESUME.md (the top two sections), then the files your viewpoint names below.

Facts from the code, so no voice has to rediscover them (cite them by file:line after reading):
- The client is Burning Crusade Classic 2.5.6 (TBC Anniversary) with 1.x manifests for WoW Forever and Classic Era
  (CLAUDE.md; the three .toc files). It is not Retail; "Midnight 12.x" is not this client.
- Not in this checkout: apps/universe, bridge/roster, @hm/sq-jepa, @hm/shorthand, hm:universe:v2 (HeavyMetal2),
  PLAN_FRACTAL.md. What exists: apps/fractal-engine, packages/fractal-engine, packages/triad-369,
  packages/wow-syntropic, bridge/hands, bridge/loop (the legacy copy), FidelityEMatrix. Say so where it matters and
  invent nothing about the absent ones.
- FidelityEMatrix/EMatrix_Math.lua: CalculateRingDistance (line 57: Chebyshev blended into Euclidean, the
  1 -> 8 -> circular wave), CalculateFlipProgress (91, in seconds), GetFlipVisuals (110: squash |cos(pi u)|, glint
  sin^2, crevice), ParallaxShift(eye, z) = eye * z / (1 + z) (149: zero at z = 0), GetCellRotation (27: the hash
  that gives each cell its orientation R in {0,1,2,3}), StereoFacings (208), DepthFromDistance (301).
  tools/test_ematrix_math.mjs drives that Lua from Node through fengari (luaMath(), call(name, ...numbers)).
- FidelityEMatrix/EMatrix_Core.lua section 0a: the binding registry (BindCell(index, source, value, at, kind,
  window), CellFresh with 0 <= age <= window, CellOpen = fresh and measured and value >= 0.5, the bindCells gate,
  sourceCount keeping the driver alive). The value is the source's label, not a reading.
- packages/triad-369/src/density_bridge.mjs lines 131-135: the Four Floats as computed today. Pxd = 0.35 - rawLoss
  (rawLoss 0.024 or 0.048 by solUp); Vtx = 0.50 + sin(tickCount * 0.1) * 0.05 (a clock, not a measurement);
  Lx = 0.50 + coherence * 0.50 with coherence = availability * 0.95 + (solUp and 0.04 or 0); Aq = 0.10 + (0.05 when
  availability > 0.9). packages/triad-369/src/evidence.mjs: the kinds measured | symbolic | not_measured.
- The owner's v1.7.4 screenshots (docs/council/2026-11-04-bridges/LANDED.md): eight sources, seven measured range
  bands, the bound state as predicted. v1.7.5 and v1.7.6 are not yet seen in the game.

The definition's test for a source: NAMED, MEASURED (a number the host read, not a constant, a clock or a guess),
FRESH (an age within a stated window), with an EVIDENCE KIND. Argon's rules bind: every visual traces to a number;
Four Floats only; intensity only goes down; describe fit, not worth; label each framing by its viewpoint. Argon's
mode for this round, from the owner: a non-coercive prior that steers toward technical closure, does not clamp a
genuine engineering objection, and flags final rulings for the owner's sign-off. Mark client-API claims "needs
in-game verification" and rules of thumb "general knowledge"; name no WoW API you have not seen in this repo's Lua
or stubs without that mark.

End your closing table with two extra lines the director will use to compose Shape B: "For the LEAD:" one sentence
of the canonical definition you would sign (or the clause you would strike), and "Route:" what you would hand to
Opus (core kernel and spec), Flash (WoW and web scaffolding) and Argon (blind red-team audit).

Your viewpoint, in detail. The named hosts are not here. Files: CLAUDE.md (the client and the deploy path),
the three FidelityEMatrix .toc files (interface numbers), the repo tree (apps/, packages/, bridge/),
docs/TRIAD_369_SEED_BOOTSTRAP.md and ARGON_OPUS_MASTER_RESUME_V3.md (where hm:universe and the cartridge are
mentioned; what they say exists elsewhere), bridge/hands/laptop_tasks.json (what the laptop runs). For each name in
the vector's deliverables 1 and 2 (apps/universe, bridge/roster, @hm/sq-jepa, @hm/shorthand, hm:universe:v2 with
m/me/mc/mb/nem + CRC32, Midnight 12.x combat-secret rules, "WoW Retail") say whether it exists in this checkout or
this client, with evidence, and what the nearest real thing here is. Then scope deliverables 1 and 2 to what can be
verified here (a schema in this repo with its own test; the 2.5.6 client's APIs as seen in the Lua and stubs), and
say what must be routed to the HeavyMetal2 side (Argon's "Route"). Concede what the evidence forces.
