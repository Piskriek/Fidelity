# LANDED: council round 2026-11-04-rungs

## News back

Status: nofit (05 Nov 2026, the tenth report; read in the cloud from 03:37Z)

**What came back.** The tenth report, `reports/20261105-0530` on `origin/owner/reports` (commit `d7839c8`): 21 shots on v1.8.8 at the camp north of the Abbey, the saved report and its MANIFEST. Every shot's SHA256 matches the MANIFEST, and the saved file matches in its CRLF form. Flash pushed it; the WoW Forever run (a gnome in the dwarf starting zone) was not in it.

**The shots map to rows** (`docs/rungs/ledger.json`, the `r10-*` rows): six fit twins and five projection readings. Two steps have no reading, each for a defect v1.8.9 fixes:
- the jar's two shots fell in the same second (05:29:07), and WoW names a screenshot to the second, so the twin overwrote the first;
- the canopy04 step drew the barrel: no canopy04 is loaded at this pose, the pick fell back to the first loaded file, and the line still said `picked by "canopy04"`.

**The camera's first verdict: fails at the saved default.**
- The director read the step-1 twin (`WoWScrnShot_110526_052834.jpg`) blind and froze the record at 03:42Z before opening any prediction (owner ruling 1). The record is `judge/blind10.json`.
- At pitch 0.35 rad and fovY 1.0 rad, every matched placement stood about 100 px (of 1041) below its predicted foot. This holds at every depth from 17 to 110 yd: the barrel, a bush, a canopy tree and two saplings.
- The five readings miss by 0.60 to 3.3 of each prop's projected height, each far beyond its precision. The camera's replica reproduces all 84 recorded feet, tops and depths to 1e-12 UI units, so the predictions are the client's own.
- Argon's decomposition fits the pattern. The uniform shift at every depth is pitch, and the remaining sideways stretch is fovY.

**The fit and its held-out test: nofit.**
- Fitted on seven blind feet (`judge/fit10.py`, plain Python): pitch 0.2237 rad (12.8°) and fovY 0.9385 rad (53.8°). A yaw offset, freed as a check, fits 0.0000 rad.
- Sapling F lands within 2 px of its foot and canopy L within 8 px. Trunk H, read blind but never fitted, lands 2 px from canopy04 at 134 yd.
- The held-out sapling G was chosen before any fitted residual existed. It misses by 19 px sideways: 0.121 of its height, against τ 0.1 and a precision of 0.019. It fails by 0.002, so by the pre-registered rule the status is `nofit`.
- G's neighbour F is the same model, 42 px away on screen, and lands within 2 px, so no camera parameter can close G's miss. It is local: G's origin, or the blind reading. A colour profile read after unsealing puts G's trunk 6 px from the blind reading. That gives 0.083, which neither passes nor counts.
- The proposal is printed as an ask. It applies only by the owner's confirmed command (ruling 4).

**The fits.**
- The barrel at x0.53 fills 0.93 of its frame (gaps 0.055 and 0.014, read twice): the first fit that holds.
- The bush at x2.44 fills 0.82. The crate at x0.38 leaves 0.116 above it, and its base reaches the bottom edge. Each reaches further below its middle than above, so no camera distance alone passes either (`nok`); a vertical offset is next.
- The tree at x5.6 in its 1.5-wide frame reaches the top and runs past the bottom: a doubled trial at x11.2.
- A wider frame magnifies the model. The crate grows about 1.66× from aspect 0.8 to 1.85 at the same height, a row-profile match with r 0.93. So a fit holds only in its own aspect, and the lock already keeps it there.

**The pose.**
- facingSpread was 0 at every shutter, and the three scene twins are pixel-identical (mean difference about 1 grey level): the camera held still.
- Step 11 was pressed without turning, so the report holds one pose, not two.
- The bright figure in every fit frame is the real player. The world's copies were hidden, and it still stands there, because the frame sits over the screen centre where the character stands. It adds a difference only where a model covers it, and it is behind every model's lower edge, so moving the test frame up off the character is the open question, not the copies.

**The owner's report on motion** (05 Nov): the world overlay's copy of his character did not run when he ran. A copy was given the stand animation once and never another. v1.8.9 plays the unit's motion.

**The owner's eight rulings** (05 Nov), recorded in `STEER.md` §"Owner rulings":
1. The twin readings count, read before the predictions are opened; his presses keep precedence.
2. τ = 0.1 is approved.
3. "Awareness" may name the held set internally, with no number on screen.
4. Pitch and fov are proposed as commands needing confirmation; confirmed fits may update `FIT_BY_FILE`.
5. The relative-position rule, the visual depth sign-off, the camera options and `/fide terrain test fit <k>` stay his.
6. The camera options stay fixed during calibration.
7. The verdicts may fill the Triad's `rungs_traversed` and DECISION slots, with no HUD change and no seventh flow.
8. Argon's Gates 1, 3, 5 and 7 stand.

**What changed because of it** (v1.8.9 and the second step):
- **Fits:** barrel `holds`; bush and crate `fails` (`nok`); tree a trial at x11.2. The last knot moves with it.
- **The camera:** the default pitch prints as "(saved default, failed the tenth report's twin)". The probe and status print the proposal, and that it is not confirmed. `/fide terrain pitch|fov <deg>` only asks; the same command with `confirm` writes it, and `default confirm` clears it.
- **The panel:**
  - a pick that no loaded file matches is refused and draws nothing;
  - `test fit` refuses with no test up;
  - a twin waits for the next clock second;
  - step 11 says so when it was not turned.
- **The world overlay:** each copy stands, walks, runs or swims with its unit, changing only when the motion changes.
- **The evaluator:**
  - the projection's context names the camera in use, so a confirmed camera starts unmeasured;
  - two placements read in one shot stay two readings (the new `subject` field);
  - the camera proposal is read from the addon and tested against the ledger.
- **The second step (ruling 7):** `tools/rungs-sync.mjs` writes `bridge/sync/rungs.json`. The Apex fills `rungs_traversed` with the rungs that hold and `step_2_decision.rungs` with every verdict and the frontier. A missing or malformed file reads not_measured. There is no HUD change and no flow.
- **frame_fill:** `find_frame` reads the frame's columns from its top and bottom edges. The wide crate's frame had come out 3 px wide.
- **H010** asks for the eleventh report and the WoW Forever report.

**Evidence** (05 Nov, Linux, Node 22):
- `npm test`: 211 tests, 210 pass, 0 fail, 1 skipped (the real-tile ADT case without `EMATRIX_TILES`);
- `node --test tools/rung-ledger.test.mjs`: 20/20;
- headless: 70/70 over both SetLight profiles;
- `node tools/test_ematrix_math.mjs`: 14/14;
- `node tools/rungs-sync.mjs --check`: matches.

**Waiting for:**
- H010: the eleventh report on v1.8.9 (step 11 turned; the camera the owner chooses, the proposal confirmed or the default) and the WoW Forever report;
- the director's blind reading of its twins, with a held-out placement named before unsealing.

The next ASK is in `STEER.md` §"Next round's ASK".
