# FIDELITY MULTIVERSE: RESUME & ENGINEERING HANDOFF
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
