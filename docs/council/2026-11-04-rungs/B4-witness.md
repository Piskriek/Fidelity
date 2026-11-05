# B4: evidence and the witness

Framing: "rung", "awareness", "Light Being", D1 to D7. Nothing here measures awareness.

## Thesis

Each settled terrain rung was settled by a witness that did not share its beliefs; every self-check that met one had agreed with the mistake. The headless stub copied the axis belief (RESUME.md:157; `tools/ematrix_headless.lua:186-188`). `IsVisible` printed `visible true` on Model frames that drew nothing (`reports/20261104-1024/FidelityEMatrix.lua:100`; RESUME.md:59): it reports a frame shown, not what it drew (general knowledge; the stub's is the shown flag, `ematrix_headless.lua:89`). An outside witness below the claim's level fails too: `GetModelFileID` answered 189700 on that frame, a load without a draw. The kinds name a method, never a witness, and the caller declares them: `fileEvidence` labels a missing file `measured` (`evidence.mjs:23`; `evidence.test.mjs:61`); `BindCell` keeps any kind passed (`EMatrix_Core.lua:168`); `Loaded` trusts the call when it cannot check (`EMatrix_Terrain.lua:248`).

**Missing element: the witness.** A rung's measure counts only when a named witness outside that rung, at its claim's level, read it from a recorded artifact; the repo records what was measured, never who, so a rung can certify itself.

## The node per rung

T = `FidelityEMatrix/EMatrix_Terrain.lua`; R9 = `reports/20261104-1321/FidelityEMatrix.lua` (`owner/reports`).

| Rung | Input | Output | Test | Measure | Witness | Written back | In client? |
|---|---|---|---|---|---|---|---|
| Map data | game tiles | `Data/*.lua` | synthetic; real tiles skipped (`tools/ematrix-mapdata.test.mjs:123`) | `32:48 FOUND`, ground 88.7 (R9:1386) | client: the player's tile, not a placement's place | nothing | yes |
| Axis | `UnitPosition` (T:175) | north-south first | stub (inside) | MISSING, then FOUND | owner's paste | fixture (`ematrix_headless.lua:725-730`) | yes |
| Load | path, id | model (T:326-347) | file id > 0 (T:247-251) | 45 loaded, 0 failed | client API; "trust the call" (T:248) is self | retry 8 s (T:28) | yes |
| Frame kind | `FRAME_ORDER` (T:202) | drawn model | `IsVisible` (T:486): self | the picture | owner's shot, director | `FRAME_ORDER` | no |
| Fit | factor k per file | red-frame fill | fill = 1 | fill by eye; fit = k x fill (T:264-275) | director; owner's `fit` never saved | `FIT_BY_FILE`, `FIT_KNOTS` retyped (T:274-275) | partly (`propFit`, T:778-780) |
| Relative position | projected foot (T:753-756) | copy on the real object | owner's rule (RESUME.md:17) | none numeric | director by eye (RESUME.md:5) | nothing | no |
| Camera | facing, zoom read (T:179-180); pitch 0.35, fov 1.0 saved (T:108) | `BuildCamera`, `ProjectPoint` (`EMatrix_Math.lua:240-272`) | `SolvePitch`: circular headless (`ematrix_headless.lua:392-397`), never called | facing 4.09, zoom 4.6 in every probe, nine runs | host (facing, zoom); nobody (pitch, fov) | `terrainPitch`, `terrainFovY` (T:733-734), never saved | facing, zoom |
| Return path | panel (`EMatrix_Report.lua:55-68`) | shots, SHA256 manifest (`bridge/hands/laptop_tasks.json:16`) | `not taken` (`EMatrix_Report.lua:87`) | director's reading | director | prose, constants | no |

The probe prints the saved pitch and the fov-derived focal (781 = 426.5 / tan 0.5) without a kind (T:749-750): constants shown as readings, against "no constant printed as a reading" (`.agents/skills/compassion-loop/SKILL.md:59`).

## Why outside, and what the record lacks

A check written from a rung's beliefs can only agree with them; a fixture from an outside reading (`ematrix_headless.lua:725-730`) guards regressions but witnesses nothing new. Outside means: not the rung's code or a copy of its beliefs, and able to see the claim's level (an API answer for a load, pixels for a draw, the owner's words for his rule). No record carries this: `evidence.mjs` (:18-51), the registry (`EMatrix_Core.lua:153, 178`) and a report step (`EMatrix_Report.lua:83-86`) hold no witness, level, artifact (`taken at 13:17:27`, not the file) or prediction; the director's readings are prose.

The ninth run shows the cost (my reading by eye, unconfirmed). In the step-2 pair the copy stands on the probe's projected foot (copy px 395-440, 560-647; projection px 425-435, 636-663 from UI 346-354, 313-335 at scale 1.2285), but the probe's chat covers that corner. In the camp shot (`WoWScrnShot_110426_131810.jpg`) copies and real barrels cannot be told apart without an overlay-off shot at that pose.

## The loop back

Today: shot and SavedVariables, H009, `owner/reports`, the director's eye, a retyped constant, H005, the next panel. The in-client loop (`fit` writes `propFit`, read first by `CameraDistanceFor`, T:281-285, 298) was never used. Proposed: each reading a ledger row beside the report, `{rung, who, level, artifact: reports/<stamp>/<shot>#sha256, at, settings, predicted, observed}`, compiled into a `Data` file that `CameraDistanceFor` and `BuildCamera` read before their defaults; `FitSource` (T:304-309) then names witness and stamp. Next time a value moves only when a counted reading moves it, and the panel asks only for withheld or stale rungs.

## The camera settings

Read by the director from the options shot (`OWNER-INPUT.md:7`; manifest hash `F6E5718B...`), not the client: no `.lua` here reads a client setting (no CVar call). They are a reader's witness of the camera's operating point, valid until the owner says otherwise. (1) Every camera reading must carry them. (2) Smart following puts the camera behind the facing only after it swings back (general knowledge, needs in-game verification): `yaw = GetPlayerFacing` (T:179) holds only for shots at rest. (3) Follow Terrain and Head Bob off leave the unread pitch and look-at point where the mouse left them (general knowledge, needs in-game verification): one pitch per session is fair. (4) Max Camera Distance at minimum agrees with zoom 4.6 in all nine runs; whether it caps zoom there needs in-game verification, and Smart Pivot may shorten the real distance near ground (general knowledge). Unknowns: pitch, fov, maybe a yaw offset; P ≤ 3.

## The algorithm: a witness-gated ladder

Each rung r has dependencies, at most P parameters, an echo set X_r (its own checks and stubs: `IsVisible`, the axis stub, "trust the call"), a claim level, tolerance and window.

1. **Order:** Kahn's topological sort, O(R + E). A cycle is an error: the loop back runs between versions.
2. **Filter:** a reading counts for r iff its witness is not in X_r, its level reaches r's, its age is within the window and its settings match. O(M) by hashing.
3. **Evaluate in order:** r is withheld, not failed, if a dependency does not hold. Otherwise:
   - calibrate from the counted readings: closed form where linear (fit c = Σ(f/k)/Σ(1/k²), O(m_f)); bisection for one monotone parameter (40 steps, like `SolvePitch`, `EMatrix_Math.lua:294`); Gauss-Newton for coupled camera parameters, at most T iterations, O(T(m_r·P² + P³));
   - r holds if a counted reading exists and every residual is within tolerance;
   - apply the result to the N props, O(N·P), and write back.
4. **Incremental:** a new reading re-runs step 3 only for its rung and its descendants D; the rest keep cached verdicts.
5. **Next panel:** one step per withheld or stale rung.

Full pass O(R + E + M + T(M·P² + R·P³) + R·N·P); re-check O(|D| + E_D + T·Σ_D(m_d·P² + P³) + |D|·N·P). Polynomial: fixed exponents, T fixed, P ≤ 3 here.

Exponential parts, replaced:
- Recursing into dependencies without a memo (each rung resting on the two below: calls grow like Fibonacci): the memoized pass, each rung once.
- Joint search ("tune it ... until the copy stands on it", T:11-13; knobs T:733-734), G^P presses: least squares on paired readings, O(T(M·P² + P³)).
- Every lower check re-run each climb (`EMatrix_Report.lua:56-57`), O(R²) presses: the window and the dirty set.
- Fewest presses covering every open rung, set cover, NP-hard in general (general knowledge): one step per open rung, O(R).

Computed here from RESUME.md:5, 15: barrel 0.599 (residuals near zero), tree 2.86 (0.073 left at x6), the residual a node would report.

## Ranked by visible payoff per hour

1. **Pair each scene shot with its prediction and counterfactual.** Steps 7-9 run no probe (`EMatrix_Report.lua:62-64`), no pose has an overlay-off shot, and `Capture` echoes to chat (`:40`). Step: `Report.STEPS` gets a quiet `terrain probe` per scene step and a "terrain off + shot" after it; headless test: probe lines in the record, none in chat, the next shot with the overlay hidden. 1 h; risk: one press more per pose. Proof: the tenth report gives each prop a predicted pixel and a difference image.
2. **Kinds on the owner's screen.** Probe (T:742, 749-750): "facing (player; yaw assumed)", "pitch (saved, not measured)", "focal (from saved fov)". HUD: `Active Rung: D3` (`packages/wow-syntropic/UI.lua:83`) is a literal (`Core.lua:36, 101`) printed without the `seed` its neighbours carry (`UI.lua:80-82`); make it `D3 (seed)`. Headless asserts the words. 0.5 h; reaches the game via H005, H008.
3. **The witness record and the ladder (the first step):** proves the element without a deploy. 2 h; risk: `fileEvidence`'s missing-file kind feeds the Apex (`triad_369_process.mjs:151-153`), so opt-in.
4. **The ledger compiled into `Data`:** `FIT_BY_FILE` generated with provenance. 2-3 h.
5. **The camera fit from paired readings,** written to `terrainPitch`/`terrainFovY` after the owner's word. 2 h plus readings.

**Does not help:** a node per D rung with no witness (the HUD's D3: a name); more `visible` or `loaded` checks for draw claims; `SolvePitch` with no input; awareness as a clock (`apps/fractal-engine/src/harness/SovereignHarness.ts:63-66`) or graduation on the harness's own coherence (:136-144); an `IRungNode` with no measure (`RungTypes.ts:20-27`).

## Closing table

| Item | B4 |
|---|---|
| Missing element | The witness: named, outside the rung, at the claim's level, tied to an artifact. |
| Algorithm | Witness filter, topological gate, closed form, bisection or Gauss-Newton, incremental: O(R + E + M + T(M·P² + R·P³) + R·N·P). |
| First step | `packages/triad-369/src/witness_ladder.mjs` (`evaluateLadder`, `recheck`) and `tools/witness-ladder.test.mjs`, the record as fixtures, asserting: `visible true` alone leaves the frame rung not measured, the 1024 reading holds it; the stub never counts; file id 189700 counts for load, not draw; relative position is withheld while the camera is not measured; fits within the eye's precision; one visit per rung on a 64-rung two-below ladder; a cycle rejected. |
| Conceded | O1: for draw claims this adds a record and a gate, not a measurement. O3: above the load rung only people witnessed a claim; the node is the owner's. O2: held rungs are calibrated, not aware. My ninth-run reading is unconfirmed and may differ from RESUME.md:5 by pose. |
| For the LEAD: | A rung's measure counts only when a named witness outside that rung, at its claim's level, read it from a recorded artifact within its window; the ladder is one topological pass over those readings, recalibrated in closed form or by least squares, in time polynomial in R, E, P, M and N. |
| Route: | Opus: ranks 3 and 4. Flash: ranks 1 and 2, H005, H008, the tenth report. Argon: whether "outside" can be computed, not declared; the echo sets; the set-cover claim. The owner: an overlay-off shot per pose; word when camera settings change; whether a director's reading is a measurement. |
