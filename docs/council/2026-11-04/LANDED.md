# LANDED: council round 2026-11-04

## News back

Status: changed

What landed (04:25Z, branch `francois/serene-euler-51wj3e`, addon v1.7.2): the non-lattice cell hash and the one-sun lens (B1's first step); the strict widget stub, the always-true check, the zero-GC regex and the height label (O3's cheapest fixes); the bearer, `sk-proj-` and AWS redactions and the push-to-main guard (O2's attack 9); the compassion-loop skill and `tools/council.mjs`. Evidence: `npm test` green (the summary line is in RESUME §"Council round 2026-11-04"), headless 56/56 under the strict stub, math 12/12 with the hash driven from the real Lua.

Waiting for: the owner's paste after deploying v1.7.2 (the login line, the probe, the box after the lattice break) and the P0 to P6 protocol numbers; H007's inventory of the laptop's daemons. When those are in, this status becomes `used` (the lattice break and the portraits read right), `changed` (something had to move) or `nofit` (the game disproves a step), with the evidence beside it, and the next round's ASK opens.

News so far (04 Nov, the owner's second screenshot, v1.7.1 in the game, before v1.7.2 is deployed): the login line reports from runtime state as built ("world overlay ON (1 actor(s) now), terrain overlay ON, map data tbc ... 9 tile(s), 5027 placements, 43 buildings, box hidden, eye from the cursor"); the owner: "mobs now have textures" (the PlayerModel frames held: `used` for v1.7.1's frame-type fix), "animations bridges and terrain bridges still broken" (the copies play their own idle, not the mob's, as B3 noted; the terrain overlay draws nothing, and the probe output is still not pasted); Flash suggests red/cyan glasses (round 1's O1 concession: anaglyph over the overlays only with a black backdrop, else the real world doubles). The lattice break (v1.7.2) is not in the game yet, so this landing stays pending.

## News back, 04 Nov 2026, four screenshots from the owner (v1.7.4 in the game, 6:31 to 6:37 local)

**Status: changed.** The lattice break is in the game: the E wall shows no diagonal stripes of one orientation (`used`). The probe was pasted for the first time and found the cause of the empty terrain, which was ours: `UnitPosition` was read west-east first, so the player at the Northshire Abbey door was looked up at tile `48:32` (`pos -97.6, -8763.0 ... MISSING, 0 tile(s) around, ground nil`); the tile is `32:48`. Fixed in v1.7.5 with the probe's numbers as a test. The copies' sizes and B3's P0 to P6 parallax numbers were not measured in these frames, so that part stays open. The next terrain check: `/fide terrain probe` on v1.7.5 must say `tile azeroth:32:48 FOUND` and draw props.
