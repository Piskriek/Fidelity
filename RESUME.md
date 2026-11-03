# FIDELITY MULTIVERSE: RESUME & ENGINEERING HANDOFF

## EMatrix v1.2.0: Claude's depth pass (03 Nov 2026, Node 2) — Flash, start here

**Branch:** `claude/ematrix-depth` (cut from `flash/wow-ematrix-polish` `87ec1ff`, with `main` merged in). **Not verified in the game yet**: everything below is proven headless only.

### Bugs fixed in the old build
1. **Parallax moved the wrong axis.** Model `SetPosition(x, y, z)` takes x = toward the camera, y = sideways, z = up. The old code fed cursor X into x, so the character zoomed instead of sliding.
2. **Stereo had zero disparity.** Both eyes got the same facing every frame, so `sbs` showed two identical pictures. Now each eye's model is turned by ±`stereoDelta` (0.06 rad) and offset by `stereoPixels` (4 px).
3. **The anaglyph "red" eye was lit blue.** The 12-value `SetLight` calls put the colours in the ambient slot (left was 0.2, 0.2, 0.8). A new `ApplyLight` tries the table form `SetLight(enabled, {…})` first and falls back to the 13 positional values; `/fide diag` prints which form the client took.
4. **The backplate could collapse.** Its parallax cleared the anchors and re-anchored one point with no size. It now stays `SetAllPoints` and slides by texcoords (0.86 window), so it never leaves the frame.
5. **Scanlines vanished.** They alternated every texel of a 128 px tile drawn at 32 px and blurred to a flat tint. Now 4 on / 4 off texels = a 2 px period on screen.
6. **Idle CPU leak (new code, caught by the headless test):** with parallax at 0 a sub-threshold eye residue could keep `OnUpdate` attached forever. Fixed and tested.

### The depth planes (EMatrix_Math.ParallaxShift: shift = eye · z / (1 + z))
| Plane | z | Moves | What it is |
| :--- | :--- | :--- | :--- |
| Backplate | 1.0 | with the eye | nebula, or `world` (game shows through), or `black` |
| Subject | 0.5 | with the eye, less | model slides (y, z) and turns toward the eye (view-dependent) |
| Inner walls | 0..1 | widths follow the eye | four lit walls (sun upper right: left wall + floor lit, right + ceiling shaded) with depth ribs |
| Lens array | 0 | never | 135 microlenses: 1 px sun-lit bevel, recess lip, lens glint, 2 px scanlines, at `lensAlpha` 0.35 |
| Cover glass | -0.15 | against the eye | ADD sheen |
| Pop-out | -0.4 | against the eye, most | reticle; in anaglyph a red/cyan pair with crossed disparity so it floats in front |

Stereo modes: `sbs` (parallel free-view), `cross` (cross-eyed, halves swapped), `anaglyph` (red left, cyan right, black field).

### New commands
`/fide lens <0..1>`, `/fide backdrop <nebula|world|black>`, `/fide stereo <off|sbs|cross|anaglyph>`, `/fide stereo delta|pixels|mix <n>`, `/fide calibrate <side|turn>`. Old saves get the new defaults merged in at load.

### Check in the game (owner, after `/reload`)
1. `/fide diag`: note the **SetLight form** line (`table` or `positional`).
2. Click to open. The lens lattice should be faint, not a cage (`/fide lens 0.2` or `0` if it still is).
3. Move the cursor right: the character should **slide right** and turn so you see more of its side on your right; the reticle slides left; the left wall widens. If the slide or the turn goes the wrong way, run `/fide calibrate side` or `/fide calibrate turn` (the two signs could not be confirmed headless).
4. `/fide backdrop world`: the live game should show through behind the character.
5. `/fide stereo anaglyph` with red/cyan glasses: the character behind the screen, the reticle in front. Tune with `/fide stereo pixels 6` and `/fide stereo mix 0.6`. `/fide stereo cross` for cross-eyed free-viewing.
6. Report what you see, and any `[Fidelity EMatrix Error]` line.

### v1.4.0: terrain overlay from the map data (`/fide terrain on`)
The scene rebuilt from the game's own map tiles. `tools/ematrix_mapdata.mjs` converts ADT tiles (root heights + `_obj0` placements, downloaded from wago.tools for build **2.5.6.70577 / wow_anniversary**, names resolved with the wowdev community listfile) into `FidelityEMatrix/Data/EMatrix_Data_Azeroth.lua`: nine tiles around Northshire (azeroth 31..33 x 47..49), 5,027 placements and 43 buildings over 170 models, a 129x129 height grid per tile (1.2 MB, loads in about 0.2 s). Validated: chunk corners land where the format predicts, every placement resolves to a path, 97% fall inside their tile, and the interpolated ground at Northshire Abbey reads 80.3 yd against the abbey's own placement at 80.1.
`EMatrix_Terrain.lua` finds the player's tile from `UnitPosition` (y first, then x), reads the ground height, builds the camera from facing + `GetCameraZoom` + the pitch solved from the player's nameplate (`nameplateShowSelf` on; else the saved pitch), projects every placement within 70 yd through it (`EMatrix_Math.ProjectPoint`) and draws the 24 nearest as `Model` frames by FileDataID, then path `.m2`, then `.mdx` (the first the client accepts), sized by a nominal height per model kind, with the same depth parallax and red/cyan pairs as the unit overlay. Props beside or behind the camera are loaded but not drawn.
Honest limits: the ground surface cannot be drawn (no mesh API); model heights are nominal until bounding boxes are read from the M2 files; the vertical field of view (default 57 degrees), look-at height (2 yd) and the yaw convention of placements (`rotY - 90`) are assumptions to calibrate in game: `/fide terrain fov <deg>`, `/fide terrain head <yd>`, `/fide terrain pitch <deg>` (fixes the pitch; `autopitch` returns to the nameplate solve), `/fide terrain backdrop <none|dim|black>` (black replaces the real world with the rebuilt props). Outside the nine tiles the overlay draws nothing and `/fide terrain status` says so.

In-game check 8 (Northshire, nameplates on): `/fide terrain on`, then `/fide terrain status` (expect tile azeroth:32:48, ground about 80 at the abbey door, a pitch in degrees, props > 0). Look at a tree: its overlay copy should stand on the same spot; if copies float above or sink below, adjust `/fide terrain fov`; if they sit left or right of the real ones as you turn, the yaw convention is off (report the direction). Then `/fide stereo anaglyph` with glasses and `/fide terrain backdrop dim`. Report the status line and whether the copies line up.
### v1.3.0: world overlay (`/fide world on`)
The owner asked for the stereo effect on every model in the scene. What the API allows: `EMatrix_World.lua` re-renders the **player and every unit with a nameplate** over the game, each at its nameplate's screen position, sized and parallaxed by an estimated depth (`DepthFromScreenY`: lower on screen = nearer, 0.15 at the player, 2.0 at the horizon), and in `anaglyph` as a red/cyan pair whose offset grows with depth. Up to 8 nearest actors, scan every 0.1 s, positions every frame, idle-safe. What it cannot do, and says so in chat: terrain, trees, buildings and units without nameplates stay the game's own flat picture (no API lists them). Side-by-side does not apply over a mono world; only anaglyph and mono parallax. Enable nameplates (V / Shift-V) so there are actors to draw. The saved `worldOverlay` flag restores it at login.

In-game check 7: `/fide world on`, `/fide stereo anaglyph` with glasses, stand near a few NPCs with nameplates on: each should get a red/cyan ghost pair at its nameplate, nearer ones tighter, farther ones wider and smaller; moving the cursor should shift far actors more than near ones. `/fide world status` prints the actor count. Report whether the overlay models line up with the real units (the depth estimate assumes a camera behind and above the player).
### Tests
`npm run ematrix:test`: the **real** Lua (fengari, Lua 5.3, devDependency) runs against a WoW API stub in two client profiles (table and positional `SetLight`): 13 checks each, plus `tools/test_ematrix_math.mjs` 12/12. `npm test` runs it too (107 pass, 1 skip). `npm run ematrix:atlas` regenerates the textures. The stub proves the code paths and the plane maths, not how the client renders them.

---
**Timestamp:** 2026-11-03T18:58:00+02:00 | **Author:** Flash (Execution Body under RULES 8a)  
**Active Working Tree:** `D:\fidelity-repo` | **Active Branch:** `flash/wow-ematrix-polish` (commit `db2ae29`)  
**Target WoW Client:** `D:\World of Warcraft\_anniversary_\` (Burning Crusade Classic `2.5.6.70577`, character `Ikkibotwo`, realm `Thunderstrike`)

---

## 1. Current State & Mission Objective

Claude is resuming direction. The current task is **`FidelityEMatrix`**: a zero-GC WoW AddOn prototype intended to deliver an **outward-cascading scoreboard wave matrix (`1 -> 8 -> Circular`) that reveals a true-3D optical depth chamber / holographic lens**.

### Current Problem Identified by User & Team:
> *"It's not working, make it so it makes everything look 3D."*

**Diagnosis of the Current Build (`media_1793724099435_91d87cdc.jpg`):**
1. **The "Flat Dressing-Room Wallpaper" Effect:** The matrix currently renders a 3D `DressUpModel` against a flat 2D cosmic starfield texture (`Backplate_Nebula.tga`). Inside a 2D UI box, this looks like a flat paper cutout / dressing-room preview rather than an optical volumetric window.
2. **Missing Game World Transparency:** The opaque/translucent nebula backplate cuts off the real 3D game world behind the character (trees, terrain, sky, NPCs). A true holographic lens or optical viewport must integrate depth cues from the actual game scene.
3. **Loss of Stitched-Lens Depth Cues:** When we solved the "135-box prison cage" by fading `flapTex` to `alpha = 0` when open, the micro-bezels and CRT scanline micro-grid vanished completely. Without the segmented aperture structure, the brain interprets it as a generic UI rectangle rather than a physical lenticular 3D display.
4. **Classic Engine Telemetry (from `/fide diag` in chat):**
   - `ModelScene`: Registered as a frame type, but `GetActiveCamera` is **NO** (unsupported in Classic).
   - `DressUpModel`: **YES**, `PlayerModel`: **YES**, `Model`: **YES**.
   - `SetFacing`: **YES**, `SetLight`: **YES**, `SetCamera`: **YES**.
   - `SetDefaultModelPosition`: **NO**! (Classic `DressUpModel` lacks `SetDefaultModelPosition`; positioning must be explicit via `SetPosition(x, y, z)` or `SetModelScale`).

---

## 2. Blueprint for Claude: How to Make It Look Deeply 3D

Claude should implement the following three optical depth layers in `FidelityEMatrix/EMatrix_Core.lua` and `tools/gen_e_atlas.mjs`:

### Layer A: Stitched Lenticular Aperture (Re-introducing the 3D Grid without Cage Bars)
- When open (`u == 1.0`), do **not** set cell alpha to `0.0`. Instead, keep `Marshmallow_E_Window.tga` visible with an ultra-thin (1–2px) soft golden bevel rim (`alpha = 180`) and punched transparent window (`alpha = 0`) with faint CRT scanlines (`alpha = 18`).
- **Visual Result:** The 135 cells read as an array of optical microlenses (fly's-eye / integral imaging lens array), immediately signaling to the eye that a 3D volumetric field is being reconstructed.

### Layer B: Multi-Plane Off-Axis Parallax with Positive & Negative Depth
To make the scene pop *out* of the screen (negative parallax) and recede *into* the screen (positive parallax):
1. **Foreground Pop Layer (`z = -0.4`, negative parallax):**
   - Floating holographic reticle, depth crosshairs, or rotating runic orbital markers that shift *with* the cursor motion (appearing to float 2 inches in front of the monitor).
2. **Focal Plane (`z = 0.0`, screen surface):**
   - The outer golden housing bezel and the 15x9 cell grid boundaries.
3. **Midground Subject Layer (`z = 0.5`, positive parallax):**
   - The 3D player character model, dynamically lit (`SetLight` warm key + cool rim), rotating smoothly via `SetFacing(animTime * 0.5)`.
   - Scaled and positioned explicitly: `SetPosition(parallaxX * 0.08, 0, -0.15 + parallaxY * 0.05)`.
4. **Deep Background (`z = 1.0` or Live World):**
   - Either transparent to the live 3D game world (with an additive scanline overlay `BLEND = "ADD"`), OR a floating cosmic starfield that drifts slowly (`parallaxX * 4px`) behind the subject.

### Layer C: True Stereoscopic Disparity (Anaglyph / SBS Mode)
- In `/fide stereo anaglyph`:
  - Left Eye: Red tint (`#FF2244`), horizontal offset `-4px`.
  - Right Eye: Cyan tint (`#00FFFF`), horizontal offset `+4px`.
  - Blend mode: `ADD` or cross-layer alpha blending (`0.55`).
- In `/fide stereo sbs`:
  - Left eye rendered to `[0..240] px`, right eye rendered to `[240..480] px` with inter-pupillary disparity.

---

## 3. Repository & Branch Status

| Repository / Directory | Branch | Commit | Status |
| :--- | :--- | :--- | :--- |
| `D:\fidelity-repo` | `flash/wow-ematrix-polish` | `db2ae29` | Pushed to GitHub. Clean working tree. |
| `D:\fidelity-repo` | `flash/wow-ematrix-proto` | `f47de34` | Pushed to GitHub. Clean working tree. |
| `D:\fidelity-repo` | `flash/cp9-siv-remediation` | `3f8bfb6` | Pushed to GitHub. 100% green. |
| `C:\MarbleGp` | `main` | `e185a7a` | Up to date with HeavyMetal2 remote. |
| `D:\World of Warcraft\_anniversary_\` | Client `2.5.6.70577` | N/A | AddOns installed: `FidelityEMatrix`, `FidelityWoW`. |

---

## 4. Key Files to Inspect & Modify

1. **`FidelityEMatrix/EMatrix_Core.lua`**:
   - Master frame, 3-layer architecture, `OnUpdateDriver`, click handling, and slash commands.
   - Slash commands currently implemented:
     - `/fide diag`: Prints client capability probe table in chat.
     - `/fide ripple [x y]`: Triggers wave from `(x, y)` or center `(8, 5)`.
     - `/fide scene <player|target>`: Changes 3D model subject.
     - `/fide spin <0..2>`: Sets model rotation speed (0 = 0-CPU idle).
     - `/fide parallax <0..1>`: Sets head/cursor parallax strength (0 = 0-CPU idle).
     - `/fide stereo <off|sbs|anaglyph>`: Toggles stereo mode.
2. **`FidelityEMatrix/EMatrix_Math.lua`**:
   - Pure math, `CalculateRingDistance` (Chebyshev 1 -> 8 -> Euclidean circular), `ROT_UV8` table, `GetFlipVisuals` (0-GC flip transforms).
3. **`tools/gen_e_atlas.mjs`**:
   - Generates `Marshmallow_E_Closed.tga` (128x128, 65,554 B), `Marshmallow_E_Window.tga` (128x128, 65,554 B), and `Backplate_Nebula.tga` (256x256, 262,162 B).
4. **`tools/test_ematrix_math.mjs`**:
   - Fast unit test runner: **11/11 tests passing (100% green)**.

---

## 5. Instructions for Claude Upon Resumption

1. Read `RESUME.md` and `FidelityEMatrix/EMatrix_Core.lua`.
2. Review the user's latest in-game screenshot (`media_1793724099435_91d87cdc.jpg`): the 3D character and nebula are rendering, and `/fide diag` succeeded.
3. Apply the 3D Optical Depth enhancements (Layer A, B, and C above) so that opening the matrix delivers an unmistakable holographic / stereoscopic depth sensation.
4. After editing, run `node tools/gen_e_atlas.mjs` and `node tools/test_ematrix_math.mjs`, copy the files to `D:\World of Warcraft\_anniversary_\Interface\AddOns\FidelityEMatrix\`, and commit/push.

---

> **CHECKPOINT 10 (Claude, from Node 2)**: [`docs/RESUME.md`](docs/RESUME.md) §"03 Nov Checkpoint 10" and [`CLAUDE.md`](CLAUDE.md) §0 *(verified holon status, corrections, tickets T1–T5)*  
> **CLAUDE DIRECTOR BRIEFING**: [`CLAUDE.md`](CLAUDE.md) *(Start here for live director instructions)*  
> **CANONICAL RESUME**: [`docs/RESUME.md`](docs/RESUME.md) (All-Caps: `R-E-S-U-M-E.md`)  
> **CHECKPOINT 9 RECORD**: [`flash_outbox_cp9.json`](flash_outbox_cp9.json) & [`ARGON_OPUS_MASTER_RESUME_V3.md`](ARGON_OPUS_MASTER_RESUME_V3.md)  
> **TRIAD 3/6/9 SEED GUIDE**: [`docs/TRIAD_369_SEED_BOOTSTRAP.md`](docs/TRIAD_369_SEED_BOOTSTRAP.md)  

## Checkpoint 9 Status (03 Nov 2026)
* **All 9 Remediation Gates Resolved**: 23/23 tests passing (100% green).
* **Universal SIV Anti-Cheat**: Hardened across WoW, GTA 6, and FPS profiles with mathematical rigor.
* **WoW Client & Addon**: Addon tracked under `packages/wow-syntropic/` and `packages/triad-369/wow-syntropic/`, pre-installed into `D:\World of Warcraft\_forever_\Interface\AddOns\FidelityWoW\`.
* **Consent Gated**: `optIn = false` default. `/fidelity optout` halts collection and wipes buffers.
* **4-Node Cybernetic Holon**: Laptop Ground (:5179) ⇄ Sol 3080 PC (tick 12,241+) ⇄ Middle Pillar Apex (:8787) ⇄ Arena Container (dfcfb02d).

## Checkpoint 10 Status (03 Nov 2026, Claude director from Node 2)
* **Holon verified live from Node 2 at 12:06–12:10Z**: Node 1 reply.json 200, Node 2 friend.log ticking, Node 3 API healthz ok; Node 4 last pulse 09:20Z.
* **Live Apex flow integrity 0.667 / coherence 0.66** (pushed 12:06:23Z), not the documented 1.0 / 0.99 (ticket T1).
* **Node 2 daemon code captured**: `bridge/node2-sol/` (friend.mjs, start_friend.ps1, runbook). Paths in the briefing are laptop paths; Node 2's checkout is `E:\Repos\Fidelity`.
* **Windows test state**: 61 pass / 1 fail (`serve.test.mjs` shutdown, ticket T3) / 1 skipped; SIV subset 23/23.
