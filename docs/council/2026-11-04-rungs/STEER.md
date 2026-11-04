# STEER: council round 2026-11-04-rungs, the recorded reading per rung, returned in Shape B

Written 17:45Z by the director (Claude in the cloud).

**Inputs**, all in this folder and each relayed through the Triad unchanged:
- the owner's idea, his camera settings and his second message, "we need a polynomial time algorithm" (`OWNER-INPUT.md`);
- Argon's Bentov packet (`ARGON-INPUT.md`), a candidate lens, not a ruling;
- the gradient-equivalence note, with the director's numeric check (`GRADIENT-INPUT.md`).

**The council.** Twelve voices: B1 to B8, O1 to O3, and A1 for Argon's packet. Each voice's decisive claims were re-checked by a verifier. Three synthesis angles then wrote candidate answers (minimal-honest, kernel-first, in-game-first). A judge scored them against the record and grafted the runners-up's sound parts onto the winner, minimal-honest.

**After the judge, the director re-read every fit shot** in the nine reports against crops ticked every 5% of the frame, with 1% zooms on each edge (`tools/frame_fill.py sheet`). That reading overturns two of the judge's "holds", and it is entered in the ledger as its own rows: see "The director's second reading" below.

Every claim below rests on a file, a line or a shot. "Needs in-game verification" marks what only the game can settle.

## REPORT: the missing element

**The missing element is a recorded reading per rung.** A reading is a rung's operating point, paired with what a witness outside the rung saw there. It is kept as one row with:
- the artifact: the report stamp, the shot or the saved file, and the SHA256 that report's MANIFEST lists for it;
- the witness class and the reader;
- the time: the step stamp, the client's local clock;
- the context it was taken in.

A rung holds only while such a row, taken at the value now in use, is within tolerance, and every rung beneath it holds.

The repo already keeps exactly this record one scale down, for the lattice cells: source, value, at, kind, window and the gate that reads them (`FidelityEMatrix/EMatrix_Core.lua` §0a).

Above the load rung, the readings had lived only as prose in `RESUME.md` and as constants retyped into `EMatrix_Terrain.lua`. The comment above the fits still described a rule two versions old. Two fits printed "measured from your reports" when no reading at their value had confirmed them.

**What the owner asked, answered.**
- **"An extra input, output, test and measure node for each level."** Every rung already had its input, its output and its test. The node it lacked is the measure, kept as a row. That row is the same at every rung, and so is the one rule that reads it. Climbing a rung therefore adds rows and one declaration, not a new mechanism.
- **"Awareness increases."** What grows is the list of rungs that hold, and it grows only as readings are added. The list can also shrink: a changed context, a failed base or a stale reading demotes everything resting on it. No number is emitted. Whether any count may be shown, and whether "awareness" may name the held set, is owner ruling 3.
- **"They need to loop back to the fidelity process."** The loop runs on the carriers that already exist:
  1. the panel captures the chat and the shots, and now also the pose at each shutter;
  2. H009 copies the report to `owner/reports` with its MANIFEST;
  3. the director reads the shots into `docs/rungs/ledger.json`;
  4. the one evaluator turns the rows into verdicts;
  5. the next version's values must answer to those verdicts, or `npm test` fails.

  The second step (named, not built) writes the verdicts where the Triad's Apex reads them.
- **The camera settings.** They are the projection rung's context. No client code reads them (the repo has no `GetCVar`), so their witness is the owner's options screenshot. See "The camera rung" below.
- **"A polynomial time algorithm."** The evaluator decides every rung once, in a topological order. See "The algorithm" below.

### The rungs and their verdicts today

These are the rows of `docs/rungs/ledger.json` as `packages/triad-369/src/rung_ledger.mjs` judges them at the values v1.8.8 uses. `tools/rung-ledger.test.mjs` asserts every verdict below.

| Rung | Rests on | Witness | Verdict | The deciding readings |
| :--- | :--- | :--- | :--- | :--- |
| Map data | nothing | host | holds | Each report's own checks step: `tile azeroth:32:48 FOUND, 9 tile(s) around`, nine of nine (e.g. `reports/20261104-1321/FidelityEMatrix.lua:1386`). |
| Axis | map | host | holds | The same nine probes, under the read order "north-south first". The old read printed `48:32 MISSING` (RESUME §"News back from the game: v1.7.4"). |
| Load | map | host | holds | `models loaded 45, failed 0` (50 in the fifth report), in seven reports. The 0959 and 1059 checks ran with the overlay off and loaded nothing, so they are not readings. |
| Frame kind | load | director | PlayerModel and DressUpModel hold; Model fails | The third report: the bush drawn on a new PlayerModel frame (102342) and a DressUpModel frame (102348); nothing drawn on plain Model frames in five variants. The test line's `visible true` is refused as an echo. |
| Fit, per file | frame kind | director | see the next table | 36 readings of 22 shots: a first and a second reading where both exist. |
| Projection, at the start pose | map, axis | director (the twin) | unmeasured | No scene shot ever carried its pose or an overlay-off twin. v1.8.8 takes both. |
| Height, per file | projection, that file's fit | director (the twin) | blocked | It rests on the projection. |
| Relative position | (struck as a rung) | the owner's word | not claimed | It is projection, fit and height together. An overlay-on shot cannot tell a copy from the object under it. |
| Return path | (struck: the carrier) | the laptop, H009 | works | Nine reports landed, each with its MANIFEST. |
| Density D1 to D7, awareness | (struck: no witness) | none | none | The HUD's D3 is a literal (`packages/wow-syntropic/Core.lua:36`). The Triad's rung is connectivity (`density_bridge.mjs:142`). |

**The fits.** At the values v1.8.7 used, then the values v1.8.8 uses:

| File | v1.8.7 | Verdict there | v1.8.8 | Verdict now | Why |
| :--- | :--- | :--- | :--- | :--- | :--- |
| elwynnbush09 | x2.0 | fails | x2.0 | fails | Its top sits 0.26 to 0.27 below the frame's top in all five x2 shots (112659, 115950, 122430, 122553, 124621). Below about 0.6 the model cannot be told from the grass and the player copy, so its base was never seen and no k is proposed. |
| westfallbarrel01 | x0.6 | fails | x0.51 | fitted | At x0.6 it fills 0.83 (124647: lid at 0.105, staves end at 0.935). Its reaches are up 0.237 and down 0.255. At x0.51 its width needs a frame 0.87 as wide as tall, against 0.8, so the sides clip by about 4% each. |
| westfallcrate | x0.42 | fails | x0.37 | fitted | At x0.42 it fills 0.80, and its planks run past both side edges (131707). Its reaches are up 0.154 and down 0.183. It needs a frame about 1.85 as wide as tall. |
| jar01 | x0.37 | fitted | x0.37 | fitted | Its reading at x0.37 is partial: the top is at 0.095, and the rounded base is hidden behind the world overlay's copy of the player (131702). |
| elwynntreemid01 | x2.8 | fitted | x2.8 | fitted | Its one reading in v1.8.7's 1.5-wide frame is partial: the top is at 0.02, and the base is behind the player copy (131714). Its eight narrow-frame readings do not count in the wide frame (the lock). |
| elwynntreecanopy04 | x2.8 (interpolated) | fails | x5.6 | fitted | It ran past the top and left edges at x2.8 (131711). The proposal doubles, a bracket step. |

Nothing holds among the fits. The frontier, the next ask, is the projection and all six fits.

### The director's second reading, and what it changed

The judge's synthesis took the first readings as recorded in RESUME. Those were made by eye on whole screenshots when each report landed. Re-read against ticked crops, three of them do not hold up:
- **The barrel.** "Fills it too" at x0.6 is a fill of 0.83: there is a visible gap of 0.105 at the top and 0.065 at the bottom.
- **The bush.** "Fills its frame top to bottom" at x2 has its leaves starting a quarter of the way down, in every one of the five shots. The sixth report's own words fit this: "whole in its frame ... with a little margin".
- **The tree.** "Canopy at the top edge and trunk base at the bottom" at x2.8 has its canopy cut at the top edge. The trunk base is behind the player copy in every tree shot.

Each second reading is a row that supersedes the first reading of the same shot, because the evaluator ranks a more precise reading by the same class of witness first (precision 0.03 on a marked frame against 0.1 by eye). The first readings stay in the ledger as rows.

**What the re-reading found: two reaches per file, constant in k.** A PlayerModel frame centres the model's bounds on its mid-line and draws it at 1/k (CLAUDE.md §1, from the seventh report). Each file therefore reaches a fixed distance above and below the mid-line at x1:
- up = k (0.5 - top);
- down = k (0.5 - bottom).

The barrel's three readings, x0.6 to x3 (a factor of five), give up 0.231 to 0.240 and down 0.246 to 0.261. The crate's two give 0.149 to 0.158 and 0.182 to 0.185. The bush's top alone gives up 0.46 to 0.54 over x2 to x6.

This answers part of the synthesis's dissent on the fit model: fill ∝ 1/k holds for the barrel over a factor of five. The tree's spread (k × fill from 2.79 to 3.30) came from fills read with its base hidden.

Because up and down can differ, the proposal is twice the larger reach, the smallest k at which nothing is clipped. At that k the base sits at the frame's bottom whenever down ≥ up, which is where the prop's projected foot is anchored. When the reaches differ by more than the tolerance allows, no k passes. The estimate then says so (`canPass: false`), and the fix is a vertical offset per file, which no reading yet supports (routed below).

### The algorithm, polynomial in every input

`evaluate(rungs, rows, { now, manifests })` in `packages/triad-369/src/rung_ledger.mjs`. It is pure: no host, no clock of its own, no file.

0. **Validate.** Every number in a row must be finite, and its stamp must parse. Otherwise the row is refused with its reason, never coerced.
1. **Order.** Kahn's topological sort of the rests-on graph. An unknown base or a cycle is an error that names its rungs, and no verdict is issued.
2. **Keys.** In that order, key(r) is the hash of r's context and value together with each direct base's id and key. FNV-1a, 64 bits: a fixed size, so chained keys do not grow with the number of paths below.
3. **Admit.** A row counts for its rung only if all of these hold:
   - it is measured;
   - its witness class is admissible for the rung and not one of the rung's echoes (`visible true`, the headless stub, "trust the call", a typed constant, the probe's printed pitch, an overlay-on scene shot);
   - its artifact's SHA256 is the one its report's MANIFEST lists;
   - it was taken in the context now in use (the lock: a fit reading taken in a 0.8-wide frame does not count for a 1.5-wide frame);
   - it is not in the future and not stale;
   - for a scene reading, the pose was recorded at its shutter.

   Every refusal keeps its reason. A more precise reading of the same artifact by the same class of witness supersedes the less precise one.
4. **Decide each rung once, in order, from its bases' verdicts.** It is blocked if a base does not hold, unmeasured with no admitted row, and otherwise steps 5 and 6 decide it.
5. **Estimate.** An estimate only proposes the next value to try; it never decides. For a fit, twice the larger reach. If every reading overflowed, double the largest k read, at most six doublings inside the clamp of 0.25 to 16. If an edge was never seen, nothing is proposed.
6. **Test** the kept readings at the value now in use:
   - holds if all pass, fails if all fail, contested if they disagree;
   - fitted if none can decide (an edge hidden);
   - the owner's own readings take precedence, as `CameraDistanceFor` already ranks his saved fit first.
7. **Frontier.** The rungs in use that do not hold while every base does. These are the next ask.

**Complexity.** For R rungs, E edges, P context fields per rung, M rows and N props:
- validate, order and gate: O(R + E);
- keys: O(R + E·P);
- admit: O(M);
- supersede and the newest-row choice: O(M log M);
- estimates and tests: O(M), since each reads only its own rung's rows;
- write-back: O(R + N).

A full pass is therefore near-linear, O(R + E·P + M log M + N).

A re-check after a new row or a changed context (`recheck`) re-decides only the changed rungs, the rungs whose key changed, and their descendants: one BFS over out-edges. Every other verdict is reused.

**Why one pass is exact.**
- holds(r) = test(r) and holds(b) for every base b.
- Along a topological order every base is decided before r, so one pass decides each rung exactly, by induction on the order.
- No subset of rungs, no path below a rung, no assignment of conflicting readings and no permutation of props is ever enumerated.
- Conflicts follow a fixed precedence, and an unresolved one is "contested".
- Each estimator has a fixed cap and a fail rule, so an unconverged estimate shows up as a failed or unconfirmed rung, never as one that holds.

**Asserted** in `tools/rung-ledger.test.mjs`:
- forty stacked diamonds (121 rungs, 160 edges, 2^40 paths) are decided in exactly 121 steps;
- one new row on a middle rung of diamond 10 re-decides exactly 92 (2 + 3 × 30);
- that rung failing blocks exactly the 91 rungs above it and changes none below;
- a cycle is refused, with its rungs named;
- over 200 random graphs, no rung holds above a base that does not.

**In the client nothing grows.**
- The shutter record is O(N) for N ≤ 24 drawn props, once per shot.
- The facing spread is two running numbers.
- The scan and the layout are unchanged.

The cost that matters is the owner's reports. Per file, it takes one reading to estimate and one at the value to confirm. Per pose, it takes one press, because the twin rides inside the step.

### The gradient note, applied

The note holds the peak slope g0 fixed across frequencies, so A(f) = g0 / 2πf. The director checked its numbers (`GRADIENT-INPUT.md`): the path length and the RMS slope are invariant in f, and the curvature peaks at the turnaround. Its method carries over to this ladder in five places.
1. **Each rung tests a quantity that stays put while its knob moves.** For a fit, that quantity is k × fill = up + down, as A·f is for the wave: the barrel's holds within 0.015 over a factor of five in k. The test uses that invariant, never a raw pixel count.
2. **Tolerances are scale-free.**
   - For the fit: the gap as a fraction of the frame height.
   - For the projection and the height: the residual divided by the prop's projected height, so a far bush and a near barrel are judged alike.

   One τ = 0.1 is proposed in each rung's own unit, in place of the judge's 10 UI px for the projection. This is owner ruling 2.
3. **Coarse to fine at a constant ratio.** Doubling on an overflow, then halving in log k, does constant work per level. That is why the doubling is capped at six steps inside the clamp.
4. **Rest is judged over a window, not at a zero crossing.** The note's turnaround point has zero velocity and peak curvature. So the shutter records the facing's spread over the half second before it, not one sample, and a scene reading counts only with that spread near zero. The spread can see a turn; it cannot see the camera orbiting at rest (the camera rung below).
5. **The light cone: measure what does not depend on the observer's frame.** A reading is converted out of the frame it was taken in: shot pixels to UI units (÷ 1.228) and pixels to fractions of the prop's own frame. Any context the reading still depends on goes into its key: the frame's aspect, the zoom, the screen size, the build. This is the general physics of the note, nothing more.

The note's "Port-Hamiltonian kernel" is not in this checkout (labels only: `bootstrap.mjs:140`, `triad_cli.mjs:118`, `triad_mesh.mjs:284`). Nothing here uses it.

### The camera rung, on the owner's settings

The client reads none of the owner's settings. The only camera reads are `GetPlayerFacing` and `GetCameraZoom` (`EMatrix_Terrain.lua` `PlayerState`). So the settings in the ninth report's options shot (`WoWScrnShot_110426_132055.jpg`, listed in `OWNER-INPUT.md`) are the projection rung's context. They count until the owner says one changed. A changed setting demotes only the projection and height rungs: a fit uses the PlayerModel frame's own camera (needs in-game verification).

What each setting means for the rung (general knowledge, each needing in-game verification):
- **Max Camera Distance at its minimum.** All 38 probes read zoom 4.6 at the start pose, one operating point. So the zoom stays frozen at its read, and every pitch and fovY verdict is "at zoom 4.6".
- **Camera Following Style Smart, Auto Follow Speed 5.5.** The camera swings behind a moving character, but an orbit left at rest stays where it was left. So yaw = facing is an assumption the rung tests, not an input. Before a scene press the owner takes a step and stops, or holds the right mouse button a moment.
- **Follow Terrain off, Head Bob off.** Nothing moves the pitch or the look-at point on its own. So one pitch per pose is a fair parameter.
- **Smart Pivot on.** `BuildCamera` has no term for it. At the start pose the modelled camera sits about 2.56 yd above the ground (B5, reproduced by its verifier), so no pivot is predicted there. A shot whose modelled clearance falls under 0.5 yd is dropped from the pitch fit.
- **Water Collision, Mouse Look Speed, Click-to-Move.** None has a term in the projection.

**The reading the rung waits for.** At a scene shutter v1.8.8 records the pose: time and stamp, facing and its spread, zoom, position, ground, pitch and fovY with their kinds, focal, screen size and eye. It also records, for every drawable placement:
- its file and its world point;
- its predicted foot and predicted top;
- its depth;
- its fit and that fit's status;
- its aspect;
- the rectangle the layout last drew for it.

Three quarters of a second later it takes the twin, with every drawn copy hidden. The director reads the real feet and tops in the twin before opening the predictions.

The judge's replica of `BuildCamera` and `ProjectPoint` reproduces the probe's six printed points within about 2 UI units. By its computation, the start pose can separate yaw, pitch and fovY (condition about 4.4) if the far placements clear of the chat and the HUD can be read:
- barrel01 and caveminewheelbarrow01;
- the two bushes at 56 yd;
- canopy03;
- canopy04 at the right edge.

The four camp props alone cannot (condition about 11,100), and the camp lies under the chat text. So v1.8.8's probe names every drawable placement, not six, and the owner's procedure moves the chat.

A fitted pitch or fovY is printed as an ask ("/fide terrain pitch P applies it") and applies only by the owner's own command.

### Argon's packet

The packet is a candidate lens, not a ruling (its own Gates 5 and 7). Two computations from it are used:
- **The lock.** A reading's key carries the values of the rungs beneath it, so a change below unlocks exactly the readings above it. This is the keys' chaining and the context check. It is asserted for the trees' aspect, and asserted not to fire on a version bump alone.
- **The facing.** The facing is the one measured phase here. It is used as a check that the character did not turn between the press and the shutter.

Everything else in the packet is framing and stays out of code and off the screen: the five coupled oscillators, the phase lock over phases no host measures, the 7 Hz entrainment, the dwell as a phase, the somatic joules and the KL term (Gate 3). `FIDELITY_COMPLETE_BRS_V2.md` is not in this checkout and is not touched (Gate 7).

### Where the council pushed back, verified

- **Node count.** B3's interface types and B5's seven camera nodes collapse into one row type and one rule (O1's structure). B5's per-parameter nodes survive only as a freeze rule inside the projection rung: the zoom stays frozen while every reading is at 4.6, and a yaw offset is freed only if the horizontal residual fails.
- **The step-2 shot.** O1 read the camp's barrel standing right of centre in 131658. By the judge's replica, the barrel there is barrel01.m2, which the probe never printed, so kernel-first's "yaw offset near 45°" points the wrong way. Neither reading measures the camera; the twin does.
- **Pitch from a prop's projected height** is refuted: that height is not monotone in pitch (B5's claim, refuted by its verifier). The feet of the barrel, the crate and the bush are monotone over 0.13 to 1.4 rad at the reports' pose.
- **The record.** The bush sweep ran in the fifth report, and the owner skipped x4. Step 7's record carries a camera factor. Steps 8 and 9 were pressed twice in the ninth report.

## LEAD

```
 the owner's press ──► panel: chat lines + shot + pose at the shutter + overlay-off twin
                                      │  (SavedVariable; nothing printed; no saved choice written)
                                      ▼
                     H009: reports/<stamp>/ on owner/reports, every file in a SHA256 MANIFEST
                                      │
                                      ▼
            the director reads the twin ──► rows in docs/rungs/ledger.json
                                      │  (rung, value, observed, witness, artifact + SHA256, stamp, context)
                                      ▼
   rung_ledger.mjs: order ─► keys ─► admit ─► decide once per rung ─► verdicts + frontier
                                      │
                    ┌─────────────────┴──────────────────┐
                    ▼                                    ▼
   the next version's FIT_BY_FILE and FIT_STATUS    the frontier is the next panel's steps
   (npm test fails a value with no row behind it)   (today: the camera's twins, six fits)
                    │
                    └──► second step, not built: bridge/sync/rungs.json, read by the Apex as data
```

**The definition, for the owner's sign-off.** A Light Being's rung holds while one of its readings is admitted and within tolerance:
- taken at the value now in use;
- by a witness outside the rung;
- in the context now in use;
- with its artifact in a report's manifest;

and while every rung beneath it holds. The being reports which rungs hold and which do not, with the evidence for each, and the frontier. It never reports a number for its awareness.

## INSIGHTS TO ROUTE

- **Opus (core kernel and spec).** Landed: the evaluator, the ledger and the test. Next, each gated on a witness:
  - the camera estimator, once the tenth report's twins give rows. P = 2 (pitch and fovY) or 3 with a yaw offset. The focal has a closed form at fixed angles. Pitch comes from a fixed-grid scan refined by halvings, or bisection on a named foot's y where the scan shows it monotone. Its predictor is checked against `EMatrix_Math.lua` through fengari to 1e-9.
  - the Triad write as the second step: `bridge/sync/rungs.json`, `rungs_traversed`, `evidence.report`. Never a seventh flow: it would cap flow integrity at 6/7.
  - a per-file aspect, and a per-file vertical offset, once twins give both edges of each model.
- **Flash (WoW).**
  - Deploy v1.8.8 through H005 and H009.
  - The owner's procedure (H009, re-requested 17:32Z): Clear; let the chat fade or move it; stand still for each twin; step and stop before each scene press; in 11, turn so props stand on both sides of the centre.
  - In-game: whether hiding the world overlay's copies removes the bright figure from the test frames. If the figure stays, it is the real player, and the frame must move up, not the copies.
- **Argon (blind red-team).**
  - The reach model (up and down, constant in k) against the line 1/fill = α + βk and B2's power law.
  - Whether a reading's key must include its witness.
  - The tolerance of 0.1 on the scale-free invariants.
  - Whether the facing spread is a fair test of "rest" (it cannot see a camera orbit at rest).

## Owner rulings

1. **Whether the director's reading of your screenshot counts as a measurement** for the frame-kind, fit, projection and height rungs, or whether only your own fit press, cursor mark and word count. If the director's reading counts: whether the reader may also be the one who wrote the prediction. The plan is to read the twin before opening the predictions.
2. **The tolerances.** 0.1 is proposed in each rung's own unit: the gap as a fraction of the frame for a fit, the residual over the prop's projected height for the projection and the height. Readings count until their context changes: the frame kind or aspect, a camera setting, the pose, the client build.
3. **Whether "awareness" may name the set of rungs that hold.** Whether any count of it may be shown (O2 says none; B6, B8 and A1 would allow one labelled as framing). Whether the HUD's D3 may be replaced by that set. Nothing on your screen changes before your word.
4. **Whether a fitted pitch or fovY applies by default** in the next version, or only when you type `/fide terrain pitch|fov` yourself (the being asks, you permit). Also whether confirmed fits move `FIT_BY_FILE` without asking, as v1.8.8's estimates did.
5. **Which rungs stay yours:** the rule of relative position and the word that the overlay works; the camera settings; the calibration procedure.
6. **Holding the camera settings fixed** while the projection is calibrated, and an options screenshot in any report taken after a change.
7. **Whether the verdicts may fill the Triad's reserved slots** (`rungs_traversed`, `DECISION`) as data with no display change, as the second step.
8. **Argon's gates stand as set:** 5 (a lens, not a ruling), 7 (the BRS file unchanged without your permission), 3 (a lens never lies) and 1 (no forcing without grounding).

## Vector

1. **The reading is the node.** Every rung, at every scale, is one declaration plus rows. A value moves only when a counted reading moves it. A constant with no row behind it fails `npm test`. Landed.
2. **The camera gets its first paired reading:** the pose at every shutter, and an overlay-off twin, with no saved choice written. Landed in v1.8.8; waits for the tenth report.
3. **The fits converge on twins.** Every fit step draws its file at the value in use and takes a twin, so both edges are read objectively (`tools/frame_fill.py twin`). Then the aspect per file (the crate first), then a vertical offset where the reaches differ (the bush).
4. **Then the Triad reads the verdicts as data** (the second step), after owner ruling 7.
5. **Not on the vector:**
   - a node per density;
   - any awareness number;
   - separate nodes for yaw, pitch, fov, zoom and look-at;
   - a camera estimator before rows exist;
   - Bentov's oscillators in code.

## First step

Landed on `francois/serene-euler-51wj3e` (addon v1.8.8), each piece with its test:
- **`packages/triad-369/src/rung_ledger.mjs`**, the one evaluator: `order`, `rungKeys`, `admit`, `estimateFit`, `fitTest`, `evaluate`, `recheck` and `descendants`. It also has `readTerrainConstants` and `terrainRungs`, which build the rung table from the addon's own source.
- **`docs/rungs/ledger.json`:** 69 rows (9 map, 9 axis, 7 load, 8 frame, 36 fit). Each cites its report stamp, its file and the SHA256 that report's MANIFEST lists; the hashes were copied from the MANIFESTs by script, not typed.
- **`tools/rung-ledger.test.mjs`**, fourteen tests:
  - every `FIT_BY_FILE` value is read in the ledger or proposed from it;
  - `FIT_STATUS` equals the verdict and its report;
  - the knots are the fits in use;
  - the verdicts above;
  - the v1.8.7 values fail and their proposals are v1.8.8's;
  - every refusal reason;
  - the lock, and a version bump that unlocks nothing;
  - the owner's precedence and the contested state;
  - 200 random graphs;
  - the forty diamonds (121, 92, 91);
  - the estimate's rules;
  - no awareness, level, density or count in the output, and inputs untouched;
  - every hash checked against `origin/owner/reports` when that ref is present;
  - every row counted or refused once.
- **The addon, v1.8.8:**
  - **`EMatrix_Terrain.lua`.** The fits are written back (barrel 0.51, crate 0.37, canopy04 5.6; bush, tree and jar unchanged), with `FIT_STATUS` and a status in every test line in place of "measured from your reports". The stale rule comment is replaced. `ASPECT_RULES` and `HEIGHT_DEFAULT` are tables the test reads. The probe names every drawable placement. The pitch and the focal print "(saved default, not measured)" or "(your setting, not measured)". `Terrain.Snapshot` and `Terrain.HideForShot` are new. The layout keeps each slot's drawn rectangle. A terrain test hides the world overlay's copies. The test gains an `aspect <a>|auto` knob.
  - **`EMatrix_World.lua`.** `World.HideFor(reason, on)` hides each copy (copies may live under nameplates), and the layout skips while any reason holds. Neither touches the saved choice.
  - **`EMatrix_Report.lua`.** Twelve steps plus Save and Clear. Each shot records the pose at its shutter silently, with the facing's spread since the press. Twin steps (1, 3 to 11) take a second shot with the drawings hidden: 0.25 s after the first, hide, 0.5 s, shoot, 0.25 s, show. A press during a twin marks it not taken and shows the drawings at once.
  - The version is 1.8.8 in the core and the three manifests.
- **`tools/ematrix_headless.lua`.** The fit and status checks are updated. A new test, "report twins", covers:
  - the pose is the shutter's, not the press's;
  - the shutter is silent;
  - the twin hides both overlays without writing `terrainOverlay` or `worldOverlay`, and the twin's pose equals the first shot's at rest;
  - a press mid-twin marks the twin not taken and restores the drawings;
  - a test frame hides the world's copies;
  - a snapshot moves no drawn prop, and every drawn prop's rectangle is recorded;
  - the probe names every placement, and the snapshot holds the same ones;
  - the kinds;
  - the aspect knob.
- **`tools/frame_fill.py`:** `find`, `sheet` and `twin`. The twin reports the longest run of differing rows, so a unit walking past is not read as the model. It prints the ledger's fields: top, bottom, width, or clipped and overflow.
- **H009**, re-requested for the tenth report with the owner's procedure.

## Forbidden until verified

- Any awareness number, percentage, density name or "coherence" presented as a reading or written by code. A held count may appear only after owner ruling 3, and then only as symbolic.
- Claiming the props stand where the real objects stand, or any 3D or parallax claim that rests on the camera, until the projection holds at that pose on a twin. An overlay-on scene shot counts for nothing on the projection or height rungs.
- Printing a saved constant as a reading (the pitch, the focal, a fit without its status). Printing a fit as confirmed before a reading at its value confirms it.
- Typing a fit into `FIT_BY_FILE`, or a camera value into `DEFAULTS`, without a ledger row behind it. The test enforces this for the fits.
- Writing a client camera setting, changing an owner-visible default, or applying a fitted pitch or fovY before the owner's word. Taking the twin by writing a saved overlay choice: v1.8.8 hides frames only.
- Writing code for a rung no witness has filled. That covers a camera estimator before the twins give rows, a fractal `IRungNode` type, and freeing zoom while every reading is at 4.6.
- Pitch by bisection on a prop's projected height. Any loop without a cap and a fail rule. Any joint search over subsets, paths, assignments or permutations.
- The report channel as a seventh Triad flow. Aging a verdict by a file's mtime or by the report-level `at`. The Apex re-testing a rung.
- Any Bentov term in code or on screen (Gate 3). Treating the packet as a ruling (Gate 5). Editing `FIDELITY_COMPLETE_BRS_V2.md` (Gate 7).
- A second evaluator or rung table. There is one.

## The check that settles it

1. **On this branch:**
   - `node --test tools/rung-ledger.test.mjs`: 14/14;
   - `node --test tools/ematrix-lua.test.mjs`: 68/68 over both SetLight profiles;
   - `node tools/test_ematrix_math.mjs`: 14/14;
   - `npm test`: green (the summary line is in RESUME).
2. **The tenth report** (v1.8.8, H009), in the saved file:
   - steps 1 and 10 and 11 each hold `pose` and `twin.pose` from their own shutters, equal at rest, with a facing spread near 0;
   - each pose lists every drawable placement (15 at the start pose) with its foot, its top and its drawn rectangle;
   - the probe and status lines say "(saved default, not measured)";
   - the jar's and crate's test lines say "estimated ... not confirmed".
3. **In the pictures:**
   - each twin shows no copy and no red frame;
   - no player figure stands in the red frames of the fit steps. If one still does, it is the real player, and that is recorded.
4. **The measurement:**
   - the director reads each fit twin with `tools/frame_fill.py twin` and enters the rows;
   - the director reads the real feet and tops of the named placements in each scene twin, converted to UI units, before opening the predictions;
   - the evaluator then gives the projection its first verdict at that pose, fitted on all named placements but one and tested on the one held out.
5. **The owner's word** on the eight rulings.

LANDED becomes `used` when the shots map to rows and the verdicts match the readings. It becomes `nofit` if any of these happen:
- a twin's pose differs from its first shot's (the camera moved);
- no named foot can be read;
- the held-out residual stays above τ after the capped fit. The projection then prints `fails` with its residual.

## Next round's ASK

"The camera's first verdict: fit pitch and fovY (and a yaw offset only if the horizontal residual fails) on the tenth report's twins. Test it on a held-out placement. Then read the six fits' twins: a per-file aspect for the crate, and a vertical offset for the bush if its reaches differ." If the twins cannot be read, the ASK is instead what the twin needs: a turned pose, the chat moved, or a closer zoom notch.
