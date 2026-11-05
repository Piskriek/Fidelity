# O1: the world and terrain overlays (opposing council, 2026-11-04)

**Thesis.** The world and terrain overlays cannot deliver a synced, textured, 3D re-render of the scene with the Classic client's addon API; as designed they are a dead end, and the headless tests hide it.

**Labels.** [code] = what the repo's code does (file:line, read in this session). [in-game] = needs in-game verification. Numbers replicate `EMatrix_Math.BuildCamera` and the parallax arithmetic outside the repo, with the code's defaults: FOV 57 degrees, pitch 0.35 rad, zoom 10, 1920x1080.

## Attacks, ranked by fatality

**1. The real scene is never removed, and the copies slide against it.** [code] The terrain backdrop defaults to `none` (`EMatrix_Terrain.lua:100`), so real trees stay drawn under every copy; the world overlay has no backdrop. Copies move by `ParallaxShift x gain` (`EMatrix_World.lua:197-198`, `EMatrix_Terrain.lua:335-336`). The cursor eye is scaled by `parallaxStrength`, default 0.5 (`EMatrix_Core.lua:61`, `:848`), so at defaults the far copy moves about 33 px, the mid copy 20 px, the near copy 8 px, and a prop at 20 yd about 9 px. The real world does not move in this model (it is the z = 0 plane), so each copy separates from its real counterpart as the mouse moves: a double image, not a re-render. RESUME.md line 18 promises "up to 60 px"; the defaults do not reach it. Also [code, by construction]: UI frames draw above the 3D world with no depth test, so a prop behind a hill still draws over it. [in-game] `/fide terrain backdrop black` beside a tree and a mob; read the separation at rest and at the screen edge.

**2. The camera is not measured, so "synced" rests on constants.** [code] FOV is a hard-coded 1.0 rad (`EMatrix_Terrain.lua:100`, read by `EMatrix_World.lua:65`). Pitch is a saved 0.35 rad (`:100`, `:176`). Yaw is `GetPlayerFacing` (`:167`, `:377`), not the camera's yaw. Nameplates cannot be measured, so the only calibration is by eye (`/fide terrain fov|pitch`). The headless camera test cannot catch a wrong constant: the head-at-centre assertion (`tools/ematrix_headless.lua:309-311`) holds for any pitch, zoom or FOV, because `BuildCamera` puts the look-at point at the centre by construction; the pitch-solver check (`:326-331`) tests the model against itself. [in-game] Client vertical FOV (57 degrees?), pitch (about 20 degrees?), and whether a left-drag orbit moves the camera without changing `GetPlayerFacing`.

**3. The player copy sits at a fixed screen point, not where the camera puts the player.** [code] `EMatrix_World.lua:182` anchors it at 12 percent of screen height; its height is `focal x 2 / zoom` (`:282`). Under the code's own camera (head at centre), the real feet sit about 366 px up and the head at 540 px. The copy's feet are at 130 px and its top at about 328 px: roughly 210 px below the real head centre. [in-game] Compare the copy with the real character at zoom 8, 10 and 15.

**4. Sizes are guesses, and frame size may not set visible size.** [code] Heights are keyword guesses (`EMatrix_Terrain.lua:34-44`: canopy 16 yd, tree 14, default 3); copy bands are 7, 18 and 45 yd (`EMatrix_World.lua:39-44`). Model frames draw through their own camera (`EMatrix_Terrain.lua:247`, `SetCamera(0)`). The addon never reads model bounds and never sets `SetModelScale` or `SetCamDistanceScale`. Under the code's camera a 16 yd canopy at 30 yd is 527 px tall, half the screen. [in-game] `/fide terrain probe` against the on-screen size of a tree at a known distance; sweep `/fide world height`.

**5. Parenting copies to nameplates changes what they inherit; the code assumes it changes nothing.** [code] Copies are parented to plates (`EMatrix_World.lua:102-110`, `:290`); their size and offsets are not corrected for plate scale (`:177`); their alpha is forced to 1.0 (`:216`). [in-game] Child frames probably inherit effective scale and alpha, so plate scale and alpha would multiply the copy. A `SetParent` failure is swallowed: the pcall at `:107` ignores its result and `:108` records the parent anyway, so a copy can stay on the overlay while the code believes it is under its plate. Slots are kept while token and plate match (`:266`), and `SetUnit` runs only for new slots (`:291`); if the client rebinds a token to another mob, the old picture stays. Copies set no strata (`:109` sets only a level), so their stacking follows the plate [in-game].

**6. The loader cannot tell a drawn model from an empty frame.** [code] `Loaded()` trusts `SetModel` when `GetModelFileID` is absent (`EMatrix_Terrain.lua:229`), so "models loaded 24, failed 0" does not show anything was drawn. Left and right `LoadModel` results are ignored (`:391`), so an anaglyph slot can be marked used with empty halves. [in-game] `/run print(CreateFrame("Model"):GetModelFileID)`; a visual check that a `.m2` path draws. A silent `SetModel` gives zero props and zero failures.

**7. The cost is structural, and the zero-GC claim fails for terrain.** [code] Terrain `Layout` re-issues `ClearAllPoints`, `SetSize`, `SetPoint`, `SetFacing`, `SetAlpha` and `Show` for up to 24 props every frame (`EMatrix_Terrain.lua:305-309`, `:331-359`); World re-issues `SetFacing` every frame (`EMatrix_World.lua:215`). `Step` builds `PlayerState` twice and a camera table per frame (`EMatrix_Terrain.lua:169`, `:226`, `:425-433`), against "Zero Per-Frame Garbage" (`EMatrix_Core.lua:125`). Terrain slots map to distance rank (`:381-391`), so a reorder or a view-culling change reloads models, up to three `SetModel` calls per slot. Both overlays default on (`EMatrix_Core.lua:72`, `:76`) and keep the driver alive (`:894-897`), so the cost is paid at idle. Up to 96 model frames; each 0.25 s scan walks nine tiles (about 5,000 placements, RESUME.md) and builds a key string per candidate (`EMatrix_Terrain.lua:263`, `:291`). [in-game] Frame rate with overlays on and off; a `SetModel` counter across a turn.

**8. The stub passes what the client may refuse.** [code] `Region.__index` returns a no-op for any unknown method (`tools/ematrix_headless.lua:28-32`), so misspelled methods succeed. `if model.SetDefaultModelPosition` (`EMatrix_World.lua:116`, `EMatrix_Core.lua:350`) is true under test and absent on Classic (`EMatrix_Core.lua:17`). `GetModelFileID` answers 424242 for any string (`headless:162-165`), so the failed-load branch runs only where a test injects failure (`:751`). `SetParent` cannot fail (`:64`), leaving the swallowed-failure path at `EMatrix_World.lua:107` untested. `GetEffectiveScale` returns 1 (`:68`), so plate scale is never exercised. The stub's header (`:8-9`) already limits its claim to code paths; 54/54 proves paths, not rendering.

**9. The restriction's scope is unknown, and a silent nil collapses the bands.** [code] The only restriction evidence is in comments (`EMatrix_World.lua:8-9`, `EMatrix_Terrain.lua:11`) and the stub (`headless:110-118`); RESUME.md and the review state report it as observed, and no captured client log is in the repo. Nothing gates combat or instances. `RangeBand` returns "far" when both `CheckInteractDistance` calls return nil without error (`EMatrix_World.lua:138`), so a restricted call answering nil turns every actor far, silently. [in-game] `CheckInteractDistance` on a target in town, in combat and in an instance.

## Concessions

- Plate anchoring has partial in-game evidence: the v1.6.1 screenshot shows copies under their nameplates (RESUME.md line 5). That supports a portrait beside each plate, not a synced scene.
- The box is the coherent part: it has its own backdrop, so its 2D parallax has no real reference to conflict with.
- A textured NPC copy is untested, not disproved. `PlayerModel:SetUnit` on NPCs is common addon practice; v1.6.1 was white.
- "Cannot with the Classic API" is stronger than the evidence. The repo does not enumerate the API; what it shows is that these designs cannot stay synced.
- Minimal honest versions:
  - World: a 3D portrait beside each nameplate, no sync claim, parallax 0; range bands as a size cue.
  - Terrain: a black-backdrop inset of placements, off by default, with per-session calibration; otherwise drop it.
  - Anaglyph over the overlays only with a black backdrop; otherwise the real world doubles.
  - Tests: an opt-in strict stub that errors on unknown methods, and a probe that prints what the client returned.

## Closing table

| Attack | Fatal if true? | Settled by |
| :--- | :--- | :--- |
| 1. Real scene kept; copies slide against it | Yes (sync) | Backdrop black vs none; separation in px at screen edge |
| 2. FOV, pitch, yaw unmeasured | Yes, unless constants match | Known-size object at known distance; orbit test |
| 3. Player copy at a fixed point | Yes, for the player copy | Copy vs real character at zoom 8, 10, 15 |
| 4. Sizes guessed; frame may not set size | Likely | Probe vs on-screen size; `/fide world height` sweep |
| 5. Plate parenting: scale, alpha, swallowed SetParent, token reuse | No; breaks some units | Target copy scale; plate alpha; out-of-range test |
| 6. Loader cannot show a drawn model | Yes, if SetModel is silent | `GetModelFileID` check; visible prop |
| 7. Per-frame cost and churn | No, unless frame rate collapses | Frame rate on/off; `SetModel` counter |
| 8. Stub passes misspellings and untested branches | Not for the client; yes for the tests | In-game only; strict-stub run |
| 9. Restriction scope; nil collapses bands | No | `CheckInteractDistance` in town vs instance |
