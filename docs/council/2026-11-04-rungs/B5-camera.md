# B5: the camera rung, on the owner's settings

"Rung" and "awareness" are framing. *Computed* marks this voice's arithmetic, not a game measurement: the real `EMatrix_Math.lua` through fengari at the reports' pose, reproducing the probe's six printed points within 3 UI units (`reports/20261104-1321/FidelityEMatrix.lua:64-71`, `origin/owner/reports`). Shots are 1851 × 1048 px; the UI is 1507 × 853.

## Thesis

The camera is the one rung whose estimator and write-back already exist: the projection (`EMatrix_Math.lua:240-272`), the 40-step bisection `SolvePitch` (`:276-301`, called only by `tools/ematrix_headless.lua:395-398`), and two saved knobs (`/fide terrain pitch`, `fov`: `EMatrix_Terrain.lua:733-734`). The probe runs at panel step 2; the owner then turns for steps 8 and 9, whose records save three lines and no facing, zoom or predicted point (`reports/20261104-1321/FidelityEMatrix.lua:1515-1534`). Of six parameters:

- **Two are read by the client.** Facing 4.09 and zoom 4.6 appear in every probe of all nine reports. Facing stands in for yaw (`EMatrix_Terrain.lua:593`), which holds only while the camera sits behind the player.
- **Two are constants printed as if read.** "camera pitch 20.1 deg, focal 781 px" (`EMatrix_Terrain.lua:749-750`).
- **Two are absent from the model.** The look-at height is a fixed 2.0 yd above the heightmap (`EMatrix_Math.lua:237, 254`; `EMatrix_Terrain.lua:591`). There is no pivot or collision term (`EMatrix_Math.lua:249-259`).

**Missing element (camera viewpoint):** the paired record. A rung's prediction must be saved at the instant its witness looks, so that a residual can exist. The scene shots carry none, so no camera parameter has a residual, a fit or a window.

## What each parameter costs at the owner's pose (computed)

| Parameter | Shift of the six probe props, 12–20 yd deep | Nearly collinear with |
| :--- | :--- | :--- |
| yaw | 15–25 px per degree | nothing (cosines ≤ 0.40) |
| pitch | 11–13 px per degree | look-at height (−0.87) |
| vertical fov | 10–20 px per degree | zoom (0.98) |
| zoom | 23–80 px per yard | fov |
| look-at height | 44–70 px per yard | pitch |

One shot gives yaw. Synthetic readings (self-consistency only; ±3 px; zoom and look-at frozen) return yaw 4.95° (truth 5°), pitch 0.302 (0.30) and fov 0.999 (1.0), at condition 3.8. Freeing zoom too gives about 1500 at the same residual.

The eye is the cursor, on the panel's button at each press (`Eye: -0.40, 0.25 ... from hand:cursor`, `reports/20261104-1321/FidelityEMatrix.lua:1373`), so each drawn prop sits 11–15 px left and 7–10 px up of its projection (`EMatrix_Terrain.lua:29, 551-553`): about one degree of yaw inside any "drawn on real" reading.

## The node per camera parameter

| Sub-rung (rests on) | Input (from the code) | Output | Test | Measure, witness | Written back |
| :--- | :--- | :--- | :--- | :--- | :--- |
| C0 pose (map, axis) | `UnitPosition` (z dropped, `EMatrix_Terrain.lua:175`), facing, zoom (`:179-180`) | pose and named placements' predicted points, in the scene record (`:742-757`) | every scene record has its own | host reads | `FidelityEMatrix_Report` via H009 (`bridge/hands/laptop_tasks.json:8-20`) |
| C1 yaw (C0) | facing, a proxy; no camera-yaw read in the repo | offset per shot | residual within τ | horizontal residuals; director, or owner's cursor mark (`GetCursorPosition`, `EMatrix_Core.lua:963`) | a per-shot verdict, not a constant |
| C2 zoom (C0) | read, always 4.6; the stub uses 10 (`tools/ematrix_headless.lua:190`) | bias | frozen unless readings span depth or two zooms | residual against depth | bias or "read held" |
| C3 pitch (C1; look-at frozen) | none (`EMatrix_Math.lua:232`); 0.35 saved (`EMatrix_Terrain.lua:108`) | pitch | `SolvePitch`'s bisection on a real foot, not the nameplate (monotone, computed); C6 clear | vertical residuals | `terrainPitch` with stamp, residual |
| C4 fov (C1, C3; zoom frozen) | none; 1.0 rad saved; also sizes the world copies (`EMatrix_World.lua:63-70, 296, 300`) | focal | closed form Σab/Σbb; props across the screen | residual spread | `terrainFovY` |
| C5 look-at (C3) | `HEAD_HEIGHT` 2.0 | height | only if conditioning allows | a near and a far prop | height or "assumed 2.0" |
| C6 contact (C0, map) | heightmap under the modelled camera (`EMatrix_Terrain.lua:147-161`) | clearance | at least 0.5 yd, else drop from C3 | in client: 2.56 yd at the pose, 0.91 at pitch 0 (computed) | a flag on the record |

Relative position (`RESUME.md:17`) rests on C1, C3 and C4.

## The owner's settings

No `.lua` reads a setting (no `GetCVar`); the options shot is their witness. Effects: general knowledge, needing in-game verification.

- **Smart following, Auto Follow Speed 5.5.** The camera swings behind a moving character, but a left-button orbit at rest stays. So yaw can be off by any angle (10° moves the camp props about 140 px, computed). *Makes it known:* a moment of right button before each scene press (mouselook turns the character to the camera), or "Always"; C1 checks it.
- **Follow Terrain off, Head Bob off.** Pitch and look-at stay put, so a fitted pitch holds until the owner drags vertically: an event window, which the registry's seconds (`EMatrix_Core.lua:194-198`) cannot express.
- **Smart Pivot on.** It acts only on ground contact; C6 predicts none at the Abbey door. *Test:* one A/B shot with it off.
- **Max Camera Distance 1.** It caps the zoom; every reading was 4.6, so the camera and every fit are calibrated at one zoom. *Makes it known:* one shot a notch closer separates fov from zoom.
- **Water Collision, Mouse Look Speed, Click-to-Move.** No term in the model (`EMatrix_Math.lua:240`).
- **For calibration shots:** `/fide parallax 0` (`EMatrix_Core.lua:1167-1172`; the eye snaps to 0, `:980-984`) lowers a dial and puts each drawn prop on its projection.

## The algorithm (polynomial)

R rungs (C0 to C6 among them), E edges, P parameters per rung (≤ 5 here), M readings (named placement, real pixel, shot), N props, I Gauss–Newton iterations, B = 40 bisection steps.

1. Kahn's topological order; a cycle is an error. O(R + E).
2. Bucket new readings by rung; mark dirty rungs and their descendants by one DFS. O(M + R + E).
3. Each dirty rung, in order, once every parent holds (memoized):
   - (a) rebuild predictions from the saved pose (`BuildCamera`, `ProjectPoint`), O(M_r);
   - (b) finite-difference Jacobian, O(M_r·P);
   - (c) free parameters greedily (yaw, pitch, fov, look-at, zoom), each only while the normalized condition of JᵀJ stays bounded; the rest keep their priors (zoom read, look-at 2.0), O(P(M_r·P² + P³));
   - (d) fit: yaw and focal in closed form O(M_r), pitch by bisection O(B·M_r), or Gauss–Newton O(I(M_r·P² + P³));
   - (e) test the residual against τ and C6. Write back value, stamp, residual and settings, O(P).
4. In game, unchanged: the scan every 0.25 s is O(T log T) (`EMatrix_Terrain.lua:22, 359-391`), the per-frame layout O(N), N ≤ 24 (`:21, 543`).

**Total per report:** O(R + E + B·M + M·P³ + I(M·P² + R·P³) + R·P⁴), polynomial. At P ≤ 5, B = 40 and I ≤ 10 it is linear in R + E + M.

**Exponential parts, and their replacements:**
- Tuning pitch and fov by eye "until the copy stands on it" (`EMatrix_Terrain.lua:11-14`): a joint grid, G^P presses, where a by-eye fov also absorbs zoom error. Use least squares.
- Choosing the free set from all subsets, 2^P. Use the greedy condition test.
- Gating on every path below a rung (exponential in a DAG; general knowledge). Use the memoized order.
- Matching drawn to real props by permutation, N!. The probe already names each placement (`EMatrix_Terrain.lua:755-756`).
- Re-running every lower rung per climb: O(R²) presses, polynomial but a report each. Use the dirty set.

## Ranked by visible payoff per hour

1. **The pose travels with the picture** (Flash, 0.5 h). *Evidence:* the scene steps run no probe (`EMatrix_Report.lua:56, 62-64`; step 2 does, `:57`). *Risk:* ten more chat lines (`Capture` prints too, `:40`). *Proof:* steps 8 and 9 of the tenth report print their own facing.
2. **Yaw from one shot** (Opus, 1 h, a pure fit beside `light_being_kernel.mjs`): the most identifiable parameter, and the one Smart following breaks. *Proof:* after a right-button press, the camp shot's offset is under 1°.
3. **Parallax 0 for calibration shots** (the owner, minutes): removes the one-degree bias.
4. **Pitch by bisection on a real foot** (1–2 h): `SolvePitch` gets the input it never had.
5. **Clearance in the probe** (0.5 h): the only camera test the client runs itself. *Test:* a headless slope that puts the modelled camera underground.

**Does not help:** `SolvePitch` on the restricted nameplate (`EMatrix_Terrain.lua:10-11`); all five parameters from one pose (condition about 1500); a CVar read (no such call here; needs in-game verification); calling "pitch 20.1 deg" a reading.

## Loop back

Each scene record's probe lines (`FidelityEMatrix_Report`) ride H009 to `owner/reports`. The witness reads each named placement's real foot. The node writes `terrainPitch` and `terrainFovY` into the next version's `DEFAULTS` (`EMatrix_Terrain.lua:108`), as `FIT_BY_FILE` was (`:274`), or the owner types them (`:733-734`), and the probe then says "pitch fit at <stamp>, r px". Next time this changes every prop's place (`:547-553`), every world copy's size, and the panel's next step (only rungs over τ).

## First step

`FidelityEMatrix/EMatrix_Report.lua`, `Report.STEPS`: add `"terrain probe"` to steps 1, 7, 8 and 9.

Test (`tools/ematrix_headless.lua`): stub facing (`:190`) 0 for step 2 and 1.2 for step 8. Step 8's record must hold `facing 1.20` and a `-> screen` point matching `ProjectPoint` at 1.2 within 1 UI unit; the other checks stay green.

Next, `tools/camera-rung.test.mjs` (real Lua) recovers a 5° yaw offset and pitch 0.30 from the six named placements and refuses to free zoom beside fov.

## Closing table

| Item | B5 |
| :--- | :--- |
| Missing element | the paired record: the prediction saved at the witness's instant |
| In client | C0, C6; facing and zoom read; the rest need a witness |
| Algorithm | topological gate, greedy identifiability, closed form, bisection or Gauss–Newton; linear in R + E + M at P ≤ 5 |
| First step | the probe in scene steps 1, 7, 8, 9, with its headless test |
| For the LEAD: | A camera parameter holds only when the pose and predicted points saved with a scene shot, against a witness's reading of the real objects in that shot, leave a residual within tolerance after a polynomial fit that freezes what the shot cannot separate; it is written back with its stamp until the owner moves the camera or changes a setting. |
| Route: | Opus: the camera node and its real-Lua test. Flash: the scene-step probe, the clearance line, H005, H009. Argon: the condition bound; is a director's reading a measure; the event window. The owner: right button before scene presses, `/fide parallax 0` for calibration, one Smart Pivot A/B, one shot a notch closer. |
