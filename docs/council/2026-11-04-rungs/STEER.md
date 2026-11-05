# STEER: council round 2026-11-04-rungs, the recorded reading per rung, returned in Shape B

Written by the director (Claude in the cloud), first committed 17:36Z. Revised three times after adversarial review:
- the first review's five reviewers, each checked by a skeptic, confirmed 34 of 39 findings;
- a second pass found 28 of those fixes sound, 6 partly open, and new defects in the fixes themselves;
- a final pass over the second revision demonstrated nine more.

All are addressed below, in the ledger, in the evaluator or in v1.8.8, and each correction is stated where it falls. Evidence for this revision: the test run at 22:01Z. **News back (05 Nov):** the tenth report and the owner's eight rulings. They are at the end of this file ("Owner rulings" answered, "News back", the new ASK) and in `LANDED.md` (status `changed`).

**Inputs**, all in this folder and each relayed through the Triad unchanged:
- the owner's idea, his camera settings and his second message, "we need a polynomial time algorithm" (`OWNER-INPUT.md`);
- Argon's Bentov packet (`ARGON-INPUT.md`), a candidate lens, not a ruling;
- the gradient-equivalence note, with the director's numeric check (`GRADIENT-INPUT.md`).

**The council.** Twelve voices: B1 to B8, O1 to O3, and A1 for Argon's packet. Each voice's decisive claims were re-checked by a verifier. Three synthesis angles then wrote candidate answers (minimal-honest, kernel-first, in-game-first). A judge scored them against the record and grafted the runners-up's sound parts onto the winner, minimal-honest.

**After the judge, the director re-read all 35 camera-distance fit shots** in the nine reports against crops ticked every 5% of the frame, with 1% zooms on each edge (`tools/frame_fill.py sheet`). The reviews then re-read the bush and tree shots brightened and corrected them, and the director confirmed each correction on brightened zooms. The reading overturns all three of the judge's "holds" among the fits: bush, barrel and the narrow-frame tree (`JUDGED.json`, `final.rung_table`). It is entered in the ledger as its own rows: see "The director's second reading" below.

Every claim below rests on a file in this repository (`JUDGED.json` holds the judge's scores and synthesis, `judge/` its camera computations), a line, or a shot on `origin/owner/reports`. "Needs in-game verification" marks what only the game can settle.

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
| Load | map | host | holds | `models loaded 45, failed 0` (50 in the fifth report), in seven reports. The 0959 check ran with the overlay off, and the 1059 check switched it on in the same step, before its first scan. Neither loaded anything, so neither is a reading. |
| Frame kind | load | director | PlayerModel and DressUpModel hold; Model fails | The third report: the bush drawn on a new PlayerModel frame (102342) and a DressUpModel frame (102348); nothing drawn on plain Model frames in five variants. The test line's `visible true` is refused as an echo. |
| Fit, per file | frame kind | director | see the next table | 49 readings: a second reading of each of the 35 camera-distance fit shots, and 14 first readings. The fifth report's two model-scale shots (112707, 112755) vary SetModelScale, not the camera factor, so they are not fit readings. |
| Projection, at the start pose | map, axis | director (the twin) | unmeasured | No scene shot ever carried its pose or an overlay-off twin. v1.8.8 takes both. |
| Height, per file | projection, that file's fit | director (the twin) | blocked | It rests on the projection. |
| Relative position | (struck as a rung) | the owner's word | not claimed | It is projection, fit and height together. An overlay-on shot cannot tell a copy from the object under it. |
| Return path | (struck: the carrier) | the laptop, H009 | works | Nine reports landed, each with its MANIFEST. |
| Density D1 to D7, awareness | (struck: no witness) | none | none | The HUD's D3 is a literal (`packages/wow-syntropic/Core.lua:36`). The Triad's rung is connectivity (`density_bridge.mjs:142`). |

**The fits.** At the values v1.8.7 used, then the values v1.8.8 uses:

| File | v1.8.7 | Verdict there | v1.8.8 | Verdict now | Why |
| :--- | :--- | :--- | :--- | :--- | :--- |
| elwynnbush09 | x2.0 | fitted | x2.44 | fitted | In all seven x2 shots (112659, 112751, 115950, 122430, 122502, 122553, 124621), its twigs reach 0.10 to 0.12 below the frame's top and its stems touch the bottom edge. A touching edge may be cut, so x2 can never be decided. At x3 its base is behind the player copy, but its stems beside the copy reach at least 0.89, so its down reach is at least 1.17, against up 0.78. It moves to a trial at x2.44, where its twin can see both edges. By those bounds no k alone fills its frame (at most 0.83), so a vertical offset is the likely next step. |
| westfallbarrel01 | x0.6 | fails | x0.53 | fitted | At x0.6 it fills 0.83 (124647: lid at 0.105, staves end at 0.935). Five readings give reaches of up 0.240 and down 0.255. At x0.53, with the margin, it should fill 0.93. Its width needs a frame 0.81 as wide as tall, against 0.8. |
| westfallcrate | x0.42 | fails | x0.38 | fitted | At x0.42 it fills 0.80, and its planks run past both side edges (131707). Its reaches are up 0.154 and down 0.183, too different to pass in any 0.8-wide frame (0.88 at x0.38). It needs a frame about 1.8 as wide as tall, and the panel's step 8 reads it in one. |
| jar01 | x0.37 | fitted | x0.37 | fitted | Its reading at x0.37 is partial: the top is at 0.095, and the rounded base is hidden behind the world overlay's copy of the player (131702). |
| elwynntreemid01 | x2.8 | fails | x5.6 | fitted | Its one reading in v1.8.7's 1.5-wide frame (131714) has the canopy meeting the top edge flat across most of the frame width: cut there. Its twelve narrow-frame readings do not count in the wide frame (the lock), so the proposal doubles: a trial. |
| elwynntreecanopy04 | x2.8 (interpolated) | fails | x5.6 | fitted | It ran past the top and left edges at x2.8, in all three presses (131711, 131816, 131819). The proposal doubles: a trial step, not an estimate. |

Nothing holds among the fits. The frontier, the next ask, is the projection and all six fits.

### The director's second reading, and what it changed

The judge's synthesis took the first readings as recorded in RESUME. Those were made by eye on whole screenshots when each report landed. Re-read against ticked crops:
- **The barrel.** "Fills it too" at x0.6 is a fill of 0.83: there is a visible gap of 0.105 at the top and 0.065 at the bottom.
- **The bush.** "Fills its frame top to bottom" at x2 was nearly right. The director's crops at first measured only the dense bright leaves (from 0.27). The review found the thin dark twigs reaching 0.10 to 0.12, and the stems running to the bottom edge at x2 and to at least 0.89 at x3, where its base itself is behind the player copy. The director confirmed both on brightened zooms. So the bush at x2 is undecided, not failed: its base touches the frame, and a touching edge may be cut.
- **The tree.** "Canopy at the top edge and trunk base at the bottom" at x2.8 has its canopy cut at the top edge, in the narrow frame (124636) and in v1.8.7's wide frame (131714) alike. The trunk base is behind the player copy in every tree shot. The review also corrected the narrow-frame tops to the dark crown rather than the lit leaves: 0.02 at x3.98 (three shots), 0.175 at x6 (two), and 0.32 at x11.2.

Each second reading is a row that supersedes the first reading of the same shot, because the evaluator ranks a more precise reading by the same class of witness first (precision 0.03 on a marked frame against 0.1 by eye). The first readings stay in the ledger as rows.

**What the re-reading found: two reaches per file, constant in k.** A PlayerModel frame centres the model's bounds on its mid-line and draws it at 1/k (CLAUDE.md §1, from the seventh report). Each file therefore reaches a fixed distance above and below the mid-line at x1:
- up = k (0.5 - top);
- down = k (0.5 - bottom).

The barrel's five readings, x0.6 to x3 (a factor of five), give up 0.231 to 0.255 and down 0.238 to 0.261, each within 0.025; k × fill = up + down spans 0.477 to 0.510. The crate's two give 0.149 to 0.158 and 0.182 to 0.185. For the bush, the tops give up 0.72 to 0.79 over x2 to x6, and its hidden x3 base bounds down from below at 1.17. The tree's narrow-frame tops give up 1.91 to 2.02 over x3.98 to x11.2. Whether a frame's aspect changes how the camera frames a model stays open. The tree's one wide-frame reading is cut at the top, which bounds its reach from below (at least 1.4) and agrees with the narrow frames as well. So the lock keys each fit reading on its frame's aspect until a pair of twins settles it.

This answers part of the synthesis's dissent on the fit model: fill ∝ 1/k holds for the barrel over a factor of five. The tree's spread in its first readings (k × fill from 2.79 to 3.70) came from fills read with its base hidden.

Because up and down can differ, the proposal puts the larger reach a margin of 0.02 inside the frame, k = max(up, down) / 0.48. That is just above the smallest k at which nothing is clipped, so the next reading sees two edges rather than a touch and can decide. At that k the base sits just above the frame's bottom whenever down ≥ up, which is where the prop's projected foot is anchored. When the reaches differ by more than the tolerance allows, no k passes. The estimate then says so (`canPass: false`), and the fix would be a vertical offset per file, which no twin has measured yet (routed below).

### The algorithm, polynomial in every input

`evaluate(rungs, rows, { now, manifests })` in `packages/triad-369/src/rung_ledger.mjs`. It is pure: no host, no clock of its own, no file.

0. **Validate.** A row must carry an observation whose fields have the types its rung's test reads (a load's counts are numbers, a fit's edges are numbers or the words touches, clipped and hidden). Its stamp must parse, and every number in it must be finite. Where its rung is tested at a value, its operating point and its precision must be numbers. Otherwise the row is refused with its reason, never coerced. A second row with an id already taken, by position, is refused as a duplicate.
1. **Order.** Kahn's topological sort of the rests-on graph. An unknown base or a cycle is an error that names the rungs on the cycle (not those that only rest on it), and no verdict is issued.
2. **Keys.** In that order, key(r) is the hash of r's context and value together with each direct base's id and key. FNV-1a, 64 bits: a fixed size, so chained keys do not grow with the number of paths below.
3. **Admit.** A row counts for its rung only if all of these hold:
   - it is measured;
   - its witness class is admissible for the rung and not one of the rung's echoes (`visible true`, the headless stub, "trust the call", a typed constant, the probe's printed pitch, an overlay-on scene shot);
   - its artifact's SHA256 is the one its report's MANIFEST lists;
   - it was taken in the context now in use (the lock: a fit reading taken in a 0.8-wide frame does not count for a 1.5-wide frame);
   - it is not in the future and not stale;
   - for a scene reading, the pose was recorded at its shutter.

   Every refusal keeps its reason, and the checks run in a fixed order (`REFUSALS`), so a row with two defects is refused for the earlier one. Two readings of the same artifact (and line) at the same operating point by the same class of witness are one reading: the more precise one, then the later one, supersedes.
4. **Decide each rung once, in order, from its bases' verdicts.** It is blocked if a base does not hold, unmeasured with no admitted row, and otherwise steps 5 and 6 decide it.
5. **Estimate.** An estimate only proposes the next value to try; it never decides. For a fit, the larger reach a margin inside the frame, where an edge that touches or runs past the frame bounds its reach from below. If every reading reached or ran past an edge, double the largest such k, at most six doublings inside the clamp of 0.25 to 16. If an edge was never measured, nothing is proposed. The estimate also says whether its value can pass at all (`canPass`, judged at the clamped value with 0.01 to spare).
6. **Test** the kept readings at the value now in use. A reading decides only when it clears the tolerance by its own precision: it passes when its residual plus its precision is within the tolerance, and fails when its residual minus its precision is outside it. Then:
   - holds if all deciding readings pass, fails if all fail, contested if they disagree;
   - fitted if none can decide: an edge hidden, an edge touching the frame (it may be cut there), or a reading nearer the tolerance than its precision;
   - the owner's own readings take precedence, as `CameraDistanceFor` already ranks his saved fit first.
7. **Frontier.** The rungs in use that do not hold while every base does. These are the next ask.

**Complexity.** For R rungs, E edges, P context fields per rung, M rows and N props:
- order and the frontier: O(R + E);
- keys: O(R·P log P + E), since each rung's context is canonicalised once and each edge adds one fixed-size key;
- admit: O(M·P), since each row is compared on its rung's P context fields;
- supersede, the newest-row choice, the estimates and the tests: O(M log M), since each reads only its own rung's rows;
- write-back: O(R + N).

A full pass is therefore O((R + M)·P log P + E + M log M + N): near-linear, with P ≤ 3 in the terrain table.

A re-check after rows are added or removed, or a context changes (`recheck`), admits every row afresh, so its refusals are a fresh pass's. It then re-decides only the rungs whose admitted rows changed (compared by content), whose key changed, or that the caller names, and their descendants: one BFS over out-edges. Every other verdict is reused. It still re-sorts, re-keys and re-admits the whole table, O((R + M)·P log P + E).

**Why one pass is exact.**
- holds(r) = test(r) and holds(b) for every base b.
- Along a topological order every base is decided before r, so one pass decides each rung exactly, by induction on the order.
- No subset of rungs, no path below a rung, no assignment of conflicting readings and no permutation of props is ever enumerated.
- Conflicts follow a fixed precedence, and an unresolved one is "contested".
- Each estimator has a fixed cap and a fail rule, so an unconverged estimate shows up as a failed or unconfirmed rung, never as one that holds.

**Asserted** in `tools/rung-ledger.test.mjs`, where `decided` counts the decision function's own calls, so deciding a rung twice fails the test:
- forty stacked diamonds (121 rungs, 160 edges, 2^40 paths) take exactly 121 decisions;
- one new row on a middle rung of diamond 10 re-decides exactly 92 (2 + 3 × 30);
- that rung failing blocks exactly the 91 rungs above it and changes none below;
- a cycle is refused, naming the rungs on it and not those that only rest on it;
- over 200 random graphs, no rung holds above a base that does not;
- over 300 random graphs with rows added anywhere (some reusing a taken id ahead of its first holder), stray rows in both passes and a changed context, the re-check finds the changed rungs itself and equals a fresh pass: the same verdicts, the same frontier, the same refusals as a multiset;
- the lock: readings count only in their own frame aspect; a version bump re-keys nothing; a base's change re-keys exactly the rungs resting on it;
- the owner's precedence over the director's reading, and the contested state;
- every adjacent pair of refusal reasons one row can carry is refused for the earlier one.

**In the client nothing grows.**
- Each shot's record costs one scan of the nine tiles and a sort (the work of one 0.25 s refresh), plus O(N) for the N ≤ 24 recorded placements.
- The facing spread is two running numbers.
- The scan and the layout are unchanged.

The cost that matters is the owner's reports. Per file, it takes one reading to estimate and one at the value to confirm. Per pose, it takes one press, because the twin rides inside the step.

### The gradient note, applied

The note holds the peak slope g0 fixed across frequencies, so A(f) = g0 / 2πf. The director checked its numbers (`GRADIENT-INPUT.md`): the path length and the RMS slope are invariant in f, and the curvature peaks at the turnaround. Its method carries over to this ladder in five places.
1. **Each rung tests a quantity that stays put while its knob moves.** For a fit, that quantity is k × fill = up + down, as A·f is for the wave. The barrel's stays within 0.033 (0.477 to 0.510) over a factor of five in k, with each reach within 0.025. The test uses that invariant, never a raw pixel count.
2. **Tolerances are scale-free.**
   - For the fit: the gap as a fraction of the frame height.
   - For the projection and the height: the residual divided by the prop's projected height, so a far bush and a near barrel are judged alike.

   One τ = 0.1 is proposed in each rung's own unit, in place of the judge's 10 UI px for the projection. A reading decides only when it clears τ by its own precision. This is owner ruling 2.
3. **Coarse to fine at a constant ratio.** Doubling on an overflow, then halving in log k, does constant work per level. That is why the doubling is capped at six steps inside the clamp.
4. **Rest is judged over a window, not at a zero crossing.** The note's turnaround point has zero velocity and peak curvature. So the shutter records the facing's spread over the half second before it, not one sample, and a scene reading counts only with that spread near zero. The spread can see a turn; it cannot see the camera orbiting at rest (the camera rung below).
5. **The light cone: measure what does not depend on the observer's frame.** A reading is converted out of the frame it was taken in: shot pixels to UI units (÷ 1.228) and pixels to fractions of the prop's own frame. Any context the reading still depends on goes into its key: the frame's aspect, the zoom, the screen size, the build. This is the general physics of the note, nothing more.

The note's "Port-Hamiltonian kernel" is not in this checkout (labels only: `bootstrap.mjs:140`, `triad_cli.mjs:118`, `triad_mesh.mjs:284`). Nothing here uses it.

### The camera rung, on the owner's settings

The client reads none of the owner's settings. The only camera reads are `GetPlayerFacing` and `GetCameraZoom` (`EMatrix_Terrain.lua` `PlayerState`). So the settings in the ninth report's options shot (`WoWScrnShot_110426_132055.jpg`, listed in `OWNER-INPUT.md`) are the projection rung's context. They count until the owner says one changed. A changed setting demotes only the projection and height rungs: a fit uses the PlayerModel frame's own camera (needs in-game verification).

What each setting means for the rung (general knowledge, each needing in-game verification):
- **Max Camera Distance at its minimum.** All 11 probes (saved 38 times across the cumulative report files) read zoom 4.6 at the start pose, one operating point. So the zoom stays frozen at its read, and every pitch and fovY verdict is "at zoom 4.6".
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

The judge's replica of `BuildCamera` and `ProjectPoint` reproduces the probe's six printed points within about 2 UI units. Its scripts are committed in `docs/council/2026-11-04-rungs/judge/`, with the commands that print each number used here. By its computation, the start pose can separate yaw, pitch and fovY (condition about 4.4) if the far placements clear of the chat and the HUD can be read:
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
  - a per-file aspect, and a per-file vertical offset, once twins give both edges of each model. The bush is the first candidate for the offset, if its x2.44 twin confirms that its down reach exceeds its up reach of 0.78.
- **Flash (WoW).**
  - Deploy v1.8.8 through H005 and H009.
  - The owner's procedure (H009, re-requested 17:32Z): Clear; let the chat fade or move it; stand still for each twin; step and stop before each scene press; in 11, turn so props stand on both sides of the centre.
  - In-game: whether hiding the world overlay's copies removes the bright figure from the test frames. If the figure stays, it is the real player, and the frame must move up, not the copies.
- **Argon (blind red-team).**
  - The reach model (up and down, constant in k) against the line 1/fill = α + βk and B2's power law.
  - Whether a reading's key must include its witness.
  - The tolerance of 0.1 on the scale-free invariants, and the rule that a reading decides only when it clears it by its own precision.
  - Whether the facing spread is a fair test of "rest" (it cannot see a camera orbit at rest).

## Owner rulings

Asked in this round; **answered by the owner on 05 Nov 2026** (relayed by Flash with the tenth report, through the Triad unchanged). Each answer is followed by what the code does with it.

1. **The director's readings count**, provided the twin's real objects are read before the predictions are opened; the owner's own presses keep precedence. The tenth report's step-1 twin was read blind and frozen at 03:42:10Z (`judge/blind10_scene.json`, SHA256 `cca1df12…`, self-reported time), and its fit pairs were read with `tools/frame_fill.py twin`. The evaluator ranks an owner row first, as before.
2. **τ = 0.1 is approved** as the scale-free tolerance, in each rung's own unit. It stays `ledger.json` `tolerance`.
3. **"Awareness" may name the set of rungs that hold internally,** with no numerical score or percentage on screen. `bridge/sync/rungs.json` lists it as `awareness`, a list of names. No count is written anywhere, and nothing reaches the screen.
4. **Pitch and FOV are proposed as commands that need confirmation; confirmed model fits may update `FIT_BY_FILE`.** In v1.8.9, `/fide terrain pitch|fov <deg>` only asks. The same command ending in `confirm` writes the value, and `default confirm` clears it. The barrel's confirmed x0.53 stays and now prints "confirmed".
5. **These stay the owner's:** the relative-position rule, the visual depth sign-off, the camera options, and `/fide terrain test fit <k>`. Nothing in v1.8.9 writes any of them.
6. **The camera options stay fixed during this calibration.** H010 repeats the request.
7. **The verdicts may fill the Triad's data slots** (`rungs_traversed`, DECISION) without altering the HUD and without a seventh flow. This is landed as the second step (`packages/triad-369/src/rung_slots.mjs`, `tools/rungs-sync.mjs`, the Apex's query reply).
8. **Argon's Gates 1, 3, 5 and 7 stand as set.** The Bentov packet stays a lens: no term from it is in code, and `FIDELITY_COMPLETE_BRS_V2.md` is untouched.

## Vector

1. **The reading is the node.** Every rung, at every scale, is one declaration plus rows. A value moves only when a counted reading moves it. A constant with no row behind it fails `npm test`. Landed.
2. **The camera gets its first paired reading:** the pose at every shutter, and an overlay-off twin, with no saved choice written. Landed in v1.8.8; waits for the tenth report.
3. **The fits converge on twins.** Every fit step draws its file at the value in use and takes a twin (`tools/frame_fill.py twin`). Every value in use is now one at which a twin can see both edges: estimates and trials keep a margin, and the bush left x2, where its base touched the frame. Then the aspect per file (the crate first), then a vertical offset where the reaches differ (the bush).
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
- **`docs/rungs/ledger.json`:** 82 rows (9 map, 9 axis, 7 load, 8 frame, 49 fit). The fit rows are a second reading of each of the 35 camera-distance fit shots and 14 first readings. Each row cites its report stamp, its file and the SHA256 that report's MANIFEST lists; the hashes were copied from the MANIFESTs by script, not typed.
- **`tools/rung-ledger.test.mjs`**, eighteen tests:
  - every `FIT_BY_FILE` value is read in the ledger or proposed from it;
  - `FIT_STATUS` equals the verdict and its report, and says where a fitted value came from (estimated, read, or a trial step);
  - the knots are the fits in use;
  - all 35 fit shots read;
  - the verdicts above;
  - the v1.8.7 values fail and their proposals are v1.8.8's;
  - every refusal reason exercised, each for its own defect;
  - the refusal order, for every adjacent pair of reasons one row can carry;
  - the lock, and the owner's precedence with the contested state;
  - the precision rule;
  - 200 random graphs;
  - the re-check equal to a fresh pass over 300 random cases, with reused ids and strays, refusals compared as a multiset;
  - the forty diamonds (121, 92, 91), counted inside the decision;
  - the estimate's rules, the touching bound and the clamp;
  - no awareness, level, density, count or score anywhere in the output, and inputs untouched;
  - every hash checked against `origin/owner/reports` when that ref is present;
  - every row counted or refused once.
- **The addon, v1.8.8:**
  - **`EMatrix_Terrain.lua`.** The fits are written back: barrel 0.53 and crate 0.38 (estimates), and the bush 2.44 and the tree and canopy04 5.6 (trials); the jar unchanged. `FIT_STATUS` puts a status in every test line in place of "measured from your reports": "estimated, not confirmed" for the barrel and the crate, "read at this value, undecided" for the jar, and "a trial value" for the bush, the tree and canopy04. The stale rule comment is replaced. `ASPECT_RULES` and `HEIGHT_DEFAULT` are tables the test reads. The probe names every drawable placement. The pitch and the focal print "(saved default, not measured)" or "(your setting, not measured)". `Terrain.Snapshot` and `Terrain.HideForShot` are new. The layout keeps each slot's drawn rectangle. A terrain test hides the world overlay's copies. The test gains an `aspect <a>|auto` knob.
  - **`EMatrix_World.lua`.** `World.HideFor(reason, on)` hides each copy (copies may live under nameplates), and the layout skips while any reason holds. Neither touches the saved choice.
  - **`EMatrix_Report.lua`.** Twelve steps plus Save and Clear. Each shot records the pose at its shutter silently, with the facing's spread since the press. Twin steps (1, 3 to 11) take a second shot with the drawings hidden: 0.25 s after the first, hide, 0.5 s, shoot, 0.25 s, show. A press during a twin, Save, Clear or hiding the panel marks it not taken, with that reason, and shows the drawings at once. Every fit step resets the aspect knob first, and the scene steps end any test first.
  - The version is 1.8.8 in the core and the three manifests.
- **`tools/ematrix_headless.lua`.** The fit and status checks are updated. A new test, "report twins", covers the following; each check was shown to fail when its behaviour is broken:
  - the pose is the shutter's, not the press's, and the facing's spread is tracked every frame (a turn there and back is seen);
  - the shutter is silent;
  - the stub's Screenshot records what is visible at each call: the twin's shot shows no prop, copy, test frame or mark;
  - the twin's pose is its own shutter's (the character turns between the shots), and at rest it equals the first shot's;
  - no saved choice is written, and a twin with the world overlay off leaves it off;
  - a press mid-twin, or hiding the panel, restores the drawings;
  - a test frame hides the world's copies;
  - a snapshot moves no drawn prop, and records the exact rectangle the layout drew;
  - with ten placements in view, the probe names all ten, and the snapshot holds the same ones;
  - the kinds;
  - the aspect knob, whose auto returns a canopy to its own 1.5.
- **`tools/frame_fill.py`:** `find`, `sheet` and `twin`. The twin masks the frame's red marks out of the difference (the twin hides them with the model). It reports the longest run of differing rows, so a unit walking past is not read as the model. It measures the gaps from the frame's own edges, and prints the ledger's fields: top, bottom and width, with 'touches' or 'overflow' where the model reaches an edge. A touching edge can never pass a fit. It also reads each edge at a low threshold and flags a disagreement, since dim twigs and dark crowns can differ from the world by less than its main threshold; the director then checks by eye before entering the row.
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
   - `node --test tools/rung-ledger.test.mjs`: 18/18;
   - `node --test tools/ematrix-lua.test.mjs`: 68/68 over both SetLight profiles;
   - `node tools/test_ematrix_math.mjs`: 14/14;
   - `npm test`: green (the summary line is in RESUME).
2. **The tenth report** (v1.8.8, H009), in the saved file:
   - steps 1 and 10 and 11 each hold `pose` and `twin.pose` from their own shutters, equal at rest, with a facing spread near 0;
   - each pose lists every drawable placement (15 at the start pose) with its foot, its top and its drawn rectangle;
   - the probe and status lines say "(saved default, not measured)";
   - the crate's and barrel's test lines say "estimated ... not confirmed", the jar's "read at this value ... undecided", and the bush's, the tree's and canopy04's "a trial value".
3. **In the pictures:**
   - each twin shows no copy and no red frame;
   - no player figure stands in the red frames of the fit steps. If one still does, it is the real player, and that is recorded.
4. **The measurement:**
   - the director reads each fit twin with `tools/frame_fill.py twin`, checks any flagged dim edge by eye on a brightened crop, and enters the rows;
   - the director reads the real feet and tops of the named placements in each scene twin, converted to UI units, before opening the predictions;
   - the evaluator then gives the projection its first verdict at that pose, fitted on all named placements but one and tested on the one held out.
5. **The owner's word** on the eight rulings.

LANDED becomes `used` when the shots map to rows and the verdicts match the readings. It becomes `nofit` if any of these happen:
- a twin's pose differs from its first shot's (the camera moved);
- no named foot can be read;
- the held-out residual stays above τ after the capped fit. The projection then prints `fails` with its residual.

## News back: the tenth report (05 Nov)

The detail is in `LANDED.md`; the rows are the `r10-*` rows of `docs/rungs/ledger.json`. In short:
- **The projection fails at the saved default.** Every matched placement stood about 100 px (of 1041) below its predicted foot at every depth from 17 to 110 yd: five blind readings, 0.60 to 3.3 of each prop's projected height.
- **Fitted on seven blind feet** at the map data's own placements: pitch 12.85° and fovY 53.82° (yaw offset -0.0001). The held-out sapling G was named before any fitted residual existed. It lands 0.120 of its height from its blind foot, at the blind reader's honest precision of 0.064 (a 10 px floor; after unsealing, the two sapling trunks proved 9.5 px and 7 px from their blind feet). So the test is **undecided** and the proposal **not confirmed**. The first write-up's "fail by 0.002, a local offset (Argon's third case)" rested on a stated 3 px; it is withdrawn.
- **Fits:**
  - the barrel holds at x0.53, the first fit confirmed;
  - the bush (fill 0.82 at x2.44) and the crate (top gap 0.116 at x0.38) fail, and no k alone can pass either (a vertical offset is next);
  - the tree doubles to x11.2;
  - a wider frame magnifies the model (about 1.66× from aspect 0.8 to 1.85 at the same height).
- **Procedure defects, each fixed in v1.8.9:**
  - the jar's twin overwrote its first shot (same second), so a twin now waits two clock seconds, because a file can be named a second late;
  - the canopy04 pick fell back to the barrel under canopy04's name, so a pick nothing matches stays refused through the step;
  - step 11 was not turned;
  - the copy of the character stood while the owner ran.
- **WoW Forever** (a gnome in the dwarf starting zone): no report yet. The addon's map data holds only Northshire's nine tiles (azeroth 31 to 33 × 47 to 49), so Coldridge Valley (about tile 31:43) reads MISSING. The map rung there stays unmeasured until H010 brings its report.

## Next round's ASK

"The camera at a second pose: the eleventh report's twins (H010) test the camera the owner chooses. That is either the proposal, if he confirms `/fide terrain pitch 12.8 confirm` and `/fide terrain fov 53.8 confirm`, or the default again, at a pose turned about 45° (step 11 now says when it was not). The held-out placement is named before unsealing. Every blind foot is read as the trunk's two pixel edges on a zoomed crop, and the blind record's SHA256 is committed before any prediction is opened. Every residual is judged by the decisive rule. Then:
- the vertical offset for the bush and the crate, whose reaches differ;
- the tree's x11.2 trial;
- the jar's first twin;
- canopy04 wherever it is loaded;
- the WoW Forever report's map context."

If the twins cannot be read, the ASK is instead what the twin needs: the chat moved, a closer zoom notch, or a pose with more placements clear of the HUD.
