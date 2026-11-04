# B2, the eye as a source (round 4, ASK: what the bound entity can do)

Viewpoint: the cursor and the head tracker's virtual pad as named, measured, fresh sources. Read-only; no tests run; no git, no network. HeavyMetal2 and `PLAN_FRACTAL.md` are not in this checkout; nothing here relies on them.

**Thesis.** Only the head can be an eye, and today the addon cannot tell a live head from a dead camera. The pad carries values with no age, and the tracker keeps writing them after the camera stops (headtrack.py:246-295), so a dead camera reads as a centred head. The cursor is a hand: measured and fresh every frame, and it must be named `hand:cursor`. The bridge that pays now is honest naming plus a fix to a depth value that can outlive its source. A measured eye adds one thing the constant planes cannot: a differential shift between planes at different depths. The copies already have it (EMatrix_World.lua:39-44, 211-212) with the cursor. The lens cells cannot carry it yet, because a cell is a fixed grid position (EMatrix_Core.lua:528-567). The eight sources prove the registry, not a reading: each band's value is a table constant (EMatrix_World.lua:149). The owner's open cells 2 to 8 are slots 2 to 8 by index; cell 1 stays closed because its source is symbolic (EMatrix_Core.lua:1041; LANDED.md).

## What each source measures

| Source | What is read | Where | Freshness | Kind |
| :--- | :--- | :--- | :--- | :--- |
| `hand:cursor` (today `eye:cursor`) | mouse pixel offset from the box centre (screen centre when hidden) | EMatrix_Core.lua:924-941; EMatrix_Math.lua:156-161 | read every frame (from the code) | `measured` |
| `eye:gamepad` | tracker's rest-subtracted face position (x, y) and depth | EMatrix_Core.lua:807-821; headtrack.py:182-189 | **none**: no timestamp reaches the addon | `not_measured` until a heartbeat exists |

The head's depth is a face-width ratio clamped to [-1, 1] (headmath.py:34-40), not a distance, so no parallax claim may be stated in centimetres or degrees. Motion parallax also depends on viewing distance and screen size, which the addon does not read (general knowledge). The pad's depth passes through `to_depth_trigger`, clamped to [0, 1] (headmath.py:56-58), so with the default map it can only lean in.

## Ranked bridges (visible payoff per hour, prerequisites first)

**1. Name the source in use, on the login line and in `/fide eye` (about 1 h).** Claim: the login line prints the configured source, not the one in use. Evidence: EMatrix_Core.lua:1434-1436 prints `Cfg("eyeSource")`; the cursor fallback is silent (lines 914-915, 924); only `/fide eye probe` says the scene uses the cursor (lines 1218-1219). Risk: none. First step: set `activeEyeSource` in OnUpdateDriver and print it at line 1434 as `eye: hand:cursor (no head measured)` or `eye: pad (head; age not measured)`. Test: beside the login check at tools/ematrix_headless.lua:294-295, with `eyeSource = "gamepad"` and no pad, the login line must name the hand. Proof: the owner's login line names the hand whenever the mouse is the eye.

**2. Clear the depth residue (about 1 h with the test).** Claim: `smoothEyeZ` is never reset when the pad stops answering or parallax is switched off. Evidence: the cursor branch (EMatrix_Core.lua:924-941) and the snap-home branch (943-947) write only X and Y, while `EyeGain()` (line 200-201) reads `smoothEyeZ`. A lean read before the pad vanished keeps the gain above 1 while the mouse drives the eye. From the code; not run. Risk: none. First step: ease `smoothEyeZ` toward 0 in both branches. Test: beside the gamepad test (tools/ematrix_headless.lua:916), plug the pad with depth 0.3, unplug it, step, and assert `ns.EyeGain() == 1`. Expected to fail on the current code (needs a run). Proof: the test passes.

**3. A heartbeat from the tracker (about 3-4 h across tracker, addon and harness).** Claim: without a freshness signal, `eye:gamepad` cannot be `measured` and fresh, so no cell may open on it and no head-parallax claim may be made. Evidence: the addon sandbox cannot read `head.json` (tools/headtrack/README.md:3); the pad is written on every loop, including the stale branch (headtrack.py:294-295); the smoother drifts to rest after a 0.5 s hold (headmath.py:73) and a decay, so a dead camera looks like rest. The rightstick map writes only the sticks and the left trigger (headtrack.py:185-188), leaving the right trigger free. Proposed: the tracker writes a counter on the right trigger; the addon records when the value last changed and reports `not_measured` after 2 s. Rejected: "unchanged for N seconds", because smoothed values keep changing by tiny amounts while a face is still. Risk: needs in-game verification that the right trigger is not bound to an action, and that the addon's `axes` index for it exists. The harness assumes index 5 is the left trigger (tools/ematrix_headless.lua:171); that is unverified against the client. Also needs in-game verification that ViGEm removes the pad when the tracker crashes. Proof: headless, a frozen counter turns the source `not_measured` after 2 s.

**4. `eye:gamepad` on a spare cell (about 2 h, after 3).** Claim: one labelled lamp shows a measured head. Evidence: `BindCell` takes an index and kind (EMatrix_Core.lua:160-171); World publishes slots 1 to 8 (EMatrix_World.lua:150-154, 321), so cells 9 to 135 are free. Value: `min(1, hypot(x, y))`, a magnitude, since the signed offset cannot fill [0,1]. Risk: a lamp is a meter and makes no depth claim. Proof: cell 9 opens only while the head is off rest.

**5. Per-lens differential parallax (about 4-6 h).** Claim: each lens shifts by `ParallaxShift(eye, z)` for its slot's band, so lenses at different bands move differently, which the constant planes cannot do. Evidence: cells are fixed in `frameGrid` (EMatrix_Core.lua:521-567); `ApplyDepthPlanes` moves only the backplate, subject, walls, glass and reticle (lines 724-800). The copies already move this way (EMatrix_World.lua:211-212). Risk: a lens shows its band's depth, not its unit's place, so the depth is a label. The per-frame cost of up to 135 `SetPoint` calls is unmeasured (needs in-game verification). Lean may not brighten a lens (the intensity rule), so this only moves lenses. Proof: headless, lens k's offset equals `ParallaxShift(eye, z_k) * gain` for every k.

**6. Head-driven stereo disparity (not recommended).** The anaglyph offset is `stereoPixels` plus band depth (EMatrix_World.lua:213); tying it to a webcam estimate claims more than the sensor gives, since the eyes' separation is not measured (general knowledge).

## What the definition rules out

- Any "head parallax" or "3D" claim while `eye:gamepad` is `not_measured`. With the cursor on, the copies' shift is hand-driven, and the login line must say so.
- Calling the cursor an eye. Its name is `hand:cursor`.
- A band's value (1.0, 0.5, 0.2) as a measurement. The measured fact is the range check's boolean (EMatrix_World.lua:133-144); the number is a constant.
- Cell position as unit position. Cell index is slot index (EMatrix_Core.lua:528).
- Lean-driven brightening of any cell.

**The login line with the cursor as the eye:** `eye: hand:cursor (no head measured; parallax is hand-driven)`.

## First in-game checks

**Cursor only, now (owner, no tracker).** `/fide eye source cursor`, `/fide box show`, `/fide world status`, then move the mouse to the screen edge and back. It proves: the login label names the hand; the copies sit on their units at centre; far copies move more than near ones, the ordering the code asserts (EMatrix_World.lua:211-212; tools/ematrix_headless.lua:540). It does not prove anything about a head: the mouse always moves. Whether the ordering reads as depth needs in-game verification.

**Head, after bridge 3.** `/fide eye probe` with the tracker running and a face in frame: "read: ok" and a moving stick. With the tracker stopped: "stale". Until bridge 3 exists, a stopped tracker still reads "read: ok" with unchanged values, which is the failure this round exists to fix.

## Closing table

| Rank | Bridge | Channel | Source and kind | Effort (estimate) | Risk | Proof |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Name the eye in use | login line, `/fide eye` | `hand:cursor` measured; pad age unmeasured | ~1 h | none | login names the hand with the mouse |
| 2 | Clear depth residue | eye code, OnUpdate | n/a | ~1 h | none | headless test at ematrix_headless.lua:916 (needs a run) |
| 3 | Pad heartbeat | right-trigger counter | `eye:gamepad` fresh or `not_measured` | ~3-4 h | trigger may be bound; axis index unverified | frozen counter goes `not_measured` in 2 s |
| 4 | Pad lamp on cell 9 | `BindCell` | `eye:gamepad` magnitude | ~2 h | a meter, not depth | cell 9 open only off rest |
| 5 | Per-lens depth | `ApplyDepthPlanes` or per-cell offset | band z per slot | ~4-6 h | cost unmeasured; depth is a label | lens offset equals `ParallaxShift` |
| 6 | Head stereo | anaglyph offset | n/a | not recommended | claims more than the sensor | none |
| x | Lean-driven brightness | n/a | n/a | forbidden | intensity may only go down | n/a |
