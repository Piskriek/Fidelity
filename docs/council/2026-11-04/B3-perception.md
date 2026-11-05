# B3: Perception of depth (builders' council, 04 Nov 2026)

**Basis.** Code at `francois/serene-euler-51wj3e`, EMatrix v1.7.1. No v1.7.1 in-game data exists; the only in-game evidence is the v1.6.1 screenshot in `RESUME.md`. Figures are arithmetic from the code's defaults (1080p, fov 1.0 rad, zoom 10 yd, cursor eye at its edge 0.5), not measurements.

## Thesis

The overlay adds pictures on top of a game that keeps drawing its own. Each copy has a twin underneath (the real unit or tree) that does not move. Parallax therefore reads as a double image, not depth, unless the copy covers its twin. Depth reads when copies cover their originals, the motion comes from the owner's head rather than the cursor, and draw order matches distance. The code has pieces of each and none end to end.

**Conflict to surface.** `RESUME.md` says copies leave their units "by up to 60 px". With the defaults the code gives about **33 px far, 20 px mid, 8 px near** (`EMatrix_World.lua:186-222`, `worldParallaxPx` 120 at `EMatrix_Core.lua:74`, eye capped at `parallaxStrength` 0.5 at `:61`). The 60 px figure is the v1.6.1 gain.

## Cues, ranked by expected effect per effort

1. **Motion parallax from the head (built, unverified).** Pad eye at `EMatrix_Core.lua:725-742`, smoothing at `:823-835`. The cursor path (`:842-850`) moves copies while the head is still, so it reads as sliding. The pad's depth is the left trigger clamped to 0..1 (`tools/headtrack/README.md`), and `EyeGain` (`:145`) scales every plane by one factor, which only stands in for leaning. Ceiling: one webcam; lateral is the honest part, depth a guess. Effort: hardware, no code. Effect: high, if it works.

2. **Cap copy shift to its own silhouette (not built).** `World.Layout` shifts each copy by `ParallaxShift × gain` (`EMatrix_World.lua:197-198`). The far copy moves 33 px and is 24 px wide (`Anchor`, `:172-184`). Once the shift exceeds the width, the copy has left its twin and both show. Clamp the shift to a fraction of the width (a tuning choice). Props move 15 to 20 px at the edge (`EMatrix_Terrain.lua:334-336`). Effort: one clamp. Effect: high for far units, the case that fails now.

3. **Draw order among unit copies (not built).** Every copy is at frame level 2 (`EMatrix_World.lua:81`, `:109`), so creation order decides overlaps. Terrain ranks by depth (`EMatrix_Terrain.lua:341`). Fix: band to level. Unknown: whether levels on different nameplate parents order globally in the client. Effort: small. Effect: medium to high in crowds.

4. **Contact blob under props (not built).** No blob, shadow or contact code exists in the addon. Props have true base coordinates (`EMatrix_Terrain.lua:330`), so a dark ellipse at the projected base is possible. Units cannot get one: only the player has a world position (`UnitPosition`, `:161-163`); others get range bands (`EMatrix_World.lua:131-141`). General knowledge: contact points are a strong grounding cue. Ceiling: pitch and fov are guessed (`EMatrix_Terrain.lua:174-179`), so a misplaced blob floats. Effect: medium, trees only.

5. **Relative size (command exists).** Unit heights assume band centres of 7, 18 and 45 yd (`EMatrix_World.lua:39-44`); the interact-distance thresholds are not printed by the code. Prop heights come from name rules with a default of 3. Prop distances are real; heights are not. A copy that disagrees with its twin is a conflict: size is a match test, not a depth cue. Effect: medium.

6. **Stereo disparity (built).** Unit pair at `EMatrix_World.lua:199`, prop pair at `EMatrix_Terrain.lua:337`. Per-eye offsets at defaults are about 1.6 px near, 4.0 mid, 6.6 far. The real world has zero disparity in anaglyph, so copies compete with a flat world. Whether a few pixels read as depth depends on screen size and distance, which the code does not know. Effect: unknown until P6.

7. **Atmospheric perspective (not built).** Alpha is only 1.0 or `anaglyphMix` (`EMatrix_Terrain.lua:349,357`; `EMatrix_World.lua:207,216`). A distance tint would need light colour through `ApplyLight` (`EMatrix_Core.lua:216`); whether Model frames respond in this client is untested. It cannot fade the real world. Effect: low to medium.

8. **Animation (built, unsynced).** Copies start their idle on their own clock (`EMatrix_World.lua:121`, `EMatrix_Terrain.lua:248`), so copy and twin drift apart and read as doubling. Effect: low, direction unknown.

## Protocol

**Setup.** `/reload`, `/fide overlay on`, nameplates on (V). Find two NPCs at different distances, one behind the other. Screenshot with Print Screen; measure pixels in Paint. Write each tolerance down before you look.

- **P0 baseline.** `/fide status`, `/fide world status`, `/fide terrain status`. Record the Eye line (cursor: z 0.00, gain 1.00), each copy's height and band, focal and zoom.
- **P1 shift against silhouette (cue 2).** `/fide world frame player`, `/fide parallax 0.5`. Shot A: cursor at screen centre. Shot B: cursor at the right edge. For far, mid and near copies, measure the centre shift and the copy width in A. Predicted: far 33 px and 24 px wide; mid 20 and 48; near 8 and 79. Report per band whether a sliver of the real unit shows beside the copy. Repeat at `/fide parallax 0.25`. Pass: no uncovered sliver in the band you care about.
- **P2 motion parallax from the head (cue 1).** Run the tracker (`tools/headtrack/README.md`), then `/fide eye source gamepad`, `/fide eye probe` (expect "read: ok"), `/fide eye calibrate` sitting still. Shot H0 sitting; H1 leaning left; H2 centre. Measure the H0 to H1 shift of a far and a near copy, and confirm the real units do not move. Predicted ratio about 4.2. Lean back: gain should stay 1.00. Report the ratio, whether the real units moved, and whether the pair reads as depth or sliding.
- **P3 occlusion among units (cue 3).** Find two actors that overlap and sit in different bands (`/fide world status` names them). `/fide parallax 0`. Note which copy is on top across several overlaps. Report "near on top" in n of m cases. Creation-order draw predicts failures.
- **P4 props: occlusion, contact, pitch (cues 3, 4).** `/fide terrain on`, `/fide terrain probe` at a spot with trees (it prints each placement's depth). Find two overlapping trees: the nearer should cover the other. Then `/fide terrain pitch` at the current value minus 3 and plus 3 degrees; compare each copy's base with its real trunk base in pixels. Report which pitch seats the copy on the real base.
- **P5 size match (cue 5).** One mid-range NPC: `/fide world height 1.2`, `1.8`, `3`. One shot each; measure copy against real unit in the same frame. Pass: within your written tolerance (10 percent is a choice, not a standard).
- **P6 stereo (cue 6).** `/fide stereo anaglyph`, with glasses. Run `/fide stereo pixels 0`, `4`, `12` on one scene. For each: do copies sit at the screen, behind it, or in front? Does the real world look doubled? Then `/fide terrain backdrop black`, then `none`: do props read deeper than units? Report by eye; a screenshot cannot show fusion.
- **P7 no command exists.** Atmospheric perspective, unit contact, animation sync: report observations only.

**Report format.** For each P, the numbers, then one word per cue: works, partly, no, or cannot tell.

## What the overlay can never do

- **Occlude against the game.** Copies draw above the world; a unit behind a tree still gets its copy over the tree.
- **Remove its twin.** Real pixels stay on the screen plane, so every parallax is a double until the copy fully covers its original. The black backdrop (`EMatrix_Terrain.lua:453-458`) removes the double only by removing the ground.
- **Give other units true depth.** The addon reads no world position for them.
- **Light or shade the real scene**, or give the game's own pixels stereo disparity.
- **Measure the client's projection.** Pitch and fov are estimates (`EMatrix_Terrain.lua:21-29`, `:174-179`).

**What would replace it.** Depth must come from the rendering path: a stereo or 3D output the graphics driver applies to the game's own frame (card support not checked here), or a head-tracked camera the client exposes, which the addon API does not. Re-rendering captured screens outside the client is out of scope.

## Closing table

| Cue | Code now (file:line) | What it takes | Honest ceiling | Protocol |
| :--- | :--- | :--- | :--- | :--- |
| Motion parallax, head | `EMatrix_Core.lua:725-742`, `:823-835` | webcam, ViGEm, in-game check | lateral good; depth closer-only | P2 |
| Motion parallax, cursor | `EMatrix_Core.lua:842-850` | none | reads as sliding | P1 |
| Copy covers twin | `EMatrix_World.lua:186-222` | clamp shift to width | far copies only partly | P1 |
| Occlusion, units | `EMatrix_World.lua:81,109` | band to frame level | order uncertain | P3 |
| Occlusion, props | `EMatrix_Terrain.lua:341` | built | cannot cover real geometry | P4 |
| Contact, props | none | blob at projected base | pitch-dependent | P4 |
| Contact, units | none | unit ground position | not in code | P7 |
| Relative size | `EMatrix_World.lua:39-44` | `/fide world height` | heights assumed | P5 |
| Stereo | `EMatrix_World.lua:199`, `EMatrix_Terrain.lua:337` | built | screen-dependent; real world flat | P6 |
| Atmospheric perspective | none | distance tint via `SetLight` | untested in client | P7 |
| Animation | `EMatrix_World.lua:121`, `EMatrix_Terrain.lua:248` | freeze or sync | low | P7 |
