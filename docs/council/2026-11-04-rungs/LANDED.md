# LANDED: council round 2026-11-04-rungs

## News back

Status: changed (05 Nov 2026, the tenth report; read in the cloud from 03:37Z; revised after the round's review)

**What came back.** The tenth report, `reports/20261105-0530` on `origin/owner/reports` (commit `d7839c8`): 21 shots on v1.8.8 at the camp north of the Abbey, the saved report and its MANIFEST. Every shot's SHA256 matches the MANIFEST, and the saved file matches in its CRLF form. Flash pushed it; the WoW Forever run (a gnome in the dwarf starting zone) was not in it.

**The shots map to rows** (`docs/rungs/ledger.json`, the `r10-*` rows): six fit twins and five projection readings. Two steps have no reading, each for a defect v1.8.9 fixes:
- the jar's two shots fell in the same second (05:29:07), and WoW names a screenshot to the second, so the twin overwrote the first;
- the canopy04 step drew the barrel: no canopy04 is loaded at this pose, the pick fell back to the first loaded file, and the line still said `picked by "canopy04"`.

**The camera's first verdict: fails at the saved default.**
- The director read the step-1 twin (`WoWScrnShot_110526_052834.jpg`) blind before opening any prediction (owner ruling 1). The record is `judge/blind10_scene.json`, committed byte-identical. Its SHA256, `cca1df1241337dbb33f8f83504c5ab161cff73d47a1644968e0628e4de016793`, was printed in the director's session at 03:42:10Z, before the saved predictions were read. That timing is self-reported, not independently witnessed; from the next report on, the blind record's hash is committed before unsealing. The fit pairs' record is `judge/blind10_fits.json` (`47c52e6bb217e9fbce0d820efbfc482534e194b8672495894f767e3c6b9023cd`, 03:49:25Z).
- At pitch 0.35 rad and fovY 1.0 rad, every matched placement stood about 100 px (of 1041) below its predicted foot. This holds at every depth from 17 to 110 yd: the barrel, a bush, a canopy tree and two saplings.
- The five readings miss by 0.60 to 3.31 of each prop's projected height. Each carries the blind reader's 10 px floor, and each misses by far more than that.
- The predictions are the client's own. At the map data's own placements, the replica gives the barrel's recorded foot exactly, and all 84 recorded feet, tops and depths to 1e-12.
- Argon's decomposition fits the pattern. The uniform shift at every depth is pitch, and the remaining sideways stretch is fovY.

**The fit and its held-out test: undecided, so not confirmed.**
- Fitted on seven blind feet (`judge/fit10.py`, plain Python, at the map data's own placements): pitch 0.2242 rad (12.85°) and fovY 0.9394 rad (53.82°). A yaw offset, freed as a check, fits -0.0001 rad.
- The held-out sapling G was chosen before any fitted residual existed. It lands 0.120 of its height from its blind foot, with precision 0.064, so the test decides nothing. The precision is the blind reader's 10 px floor. After unsealing, a pixel check put the two sapling trunks 9.5 px (G) and 7 px (F) from their blind feet, against a stated 3 px.
- At the fitted camera both saplings' predictions fall right of their trunk centres by a similar 7 to 9 px, a shift a small yaw could take up. The re-read positions cannot count (ruling 1), so the next report's blind feet decide. They will be read as the trunk's two pixel edges on a zoomed crop.
- The first write-up called this a fail by 0.002 and a local offset, with "F within 2 px". That rested on the stated 3 px and on F's misread foot. The review demonstrated both, and both claims are withdrawn.
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

**Why `changed` and not `nofit`.** The pre-registered `nofit` needs the held-out residual to stay above τ, judged by the decisive rule; at its honest precision the residual decides nothing. `changed` fits: the twins show the procedure must change (a turned pose, blind feet read as trunk edges, twins two clock seconds apart, a pick that stays refused). The readings were used: the projection's first verdict at the camera in use is `fails`.

**What changed because of it** (v1.8.9 and the second step):
- **Fits:** barrel `holds`; bush and crate `fails` (`nok`); tree a trial at x11.2. The last knot moves with it.
- **The camera:** the default pitch prints as "(saved default, failed the tenth report's twin)". The probe and status print the proposal, and that it is not confirmed. `/fide terrain pitch|fov <deg>` only asks; the same command with `confirm` writes it, and `default confirm` clears it.
- **The panel:**
  - a pick that no loaded file matches is refused and draws nothing, and stays refused through the step's later presses until `pick any`, a matching pick or `test off`;
  - `test fit` refuses with no test up, and a malformed `test` press changes nothing;
  - a twin waits until the clock is two seconds past its first shot's call, since a file can be named a second late;
  - step 11 says so when it was not turned.
- **The world overlay:** each copy stands, walks, runs or swims with its unit, changing only when the motion changes.
- **The evaluator:**
  - the projection's and the heights' context names the camera in use, so a confirmed camera, or either half of it, starts unmeasured;
  - two placements read in one shot stay two readings (the new `subject` field);
  - a stamp with an impossible field is refused;
  - the camera proposal is read from the addon and tested against the ledger.
- **The second step (ruling 7):** `tools/rungs-sync.mjs` writes `bridge/sync/rungs.json`. The Apex fills `rungs_traversed` with the rungs that hold and `step_2_decision.rungs` with every verdict and the frontier. A missing or malformed file reads not_measured. There is no HUD change and no flow.
- **frame_fill:** `find_frame` reads the frame's columns from its top and bottom edges, and still needs a real frame (a vertical edge, 150 px tall). The wide crate's frame had come out 3 px wide. Over all 120 report shots the only change is that fix.
- **H010** asks for the eleventh report and the WoW Forever report.

**The round's review** (five reviewers, each followed by a skeptic): 26 of 39 findings confirmed, all addressed. They include:
- the held-out precision (above);
- the replica fed rounded placements;
- the pick refusal undone by the step's next press;
- a twin still able to share its first shot's name;
- the heights left outside the camera lock;
- the blind record's hash cited but never written down;
- 34 false frames from the first `find_frame` fix;
- self-contradicting snapshots served as judged;
- line endings in the snapshot's hash;
- several tests that could not fail.

**Evidence** (05 Nov, Linux, Node 22):
- `npm test`: 212 tests, 211 pass, 0 fail, 1 skipped (the real-tile ADT case without `EMATRIX_TILES`);
- `node --test tools/rung-ledger.test.mjs`: 20/20; `node --test packages/triad-369/test/rung-slots.test.mjs`: 5/5;
- headless: 70/70 over both SetLight profiles;
- `node tools/test_ematrix_math.mjs`: 14/14;
- `node tools/rungs-sync.mjs --check`: matches.

**Waiting for:**
- H010: the eleventh report on v1.8.9 (step 11 turned; the camera the owner chooses, the proposal confirmed or the default) and the WoW Forever report;
- the director's blind reading of its twins, with a held-out placement named before unsealing.

The next ASK is in `STEER.md` §"Next round's ASK".
