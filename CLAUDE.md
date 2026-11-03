# CLAUDE DIRECTOR BRIEFING: FIDELITY 4-NODE HOLON & EMATRIX 3D PROTOTYPE
**Timestamp:** 2026-11-03T18:58:00+02:00 | **Status:** Active Engineering Handoff to Claude  
**Active Working Tree:** `D:\fidelity-repo` | **Branch:** `flash/wow-ematrix-polish` (commit `db2ae29`)  
**Target WoW Client:** `D:\World of Warcraft\_anniversary_\` (Burning Crusade Classic `2.5.6.70577`, character `Ikkibotwo`, realm `Thunderstrike`)

---

## 1. Executive Summary: What Was Accomplished & What Needs Polish

Claude, you are taking over direction. All SIV anticheat remediation gates (CP9) are 100% green and committed. We pivoted to building the **`FidelityEMatrix`** WoW AddOn prototype:
1. **Mechanical Scoreboard Wave**: 100% working. All 135 cells squash (`32 -> 1 -> 32`), flash specular glint at midpoint, and cascade outward (`1 -> 8 -> Circular`) with zero per-frame GC.
2. **Layering Architecture**: 3-layer sibling system (`L1_Backplate` -> `L2_Scene` -> `L3_Grid`) parented to `FidelityEMatrixFrame`.
3. **Asset Suite**: 
   - `Marshmallow_E_Closed.tga` (128x128 32-bit BGRA, 65,554 B)
   - `Marshmallow_E_Window.tga` (128x128 32-bit BGRA, 65,554 B)
   - `Backplate_Nebula.tga` (256x256 32-bit BGRA, 262,162 B)
4. **Client Engine Findings (Real Telemetry from `/fide diag`)**:
   - `ModelScene`: YES (Frame exists, but `GetActiveCamera` is NO).
   - `DressUpModel`: YES (Active in the build).
   - `SetFacing`: YES, `SetLight`: YES, `SetCamera`: YES.
   - `SetDefaultModelPosition`: NO (Classic does not support this method; position must be explicitly set).

---

## 2. The Visual Problem & How to Deliver "True 3D Depth"

The user's feedback: *"It's not working, make it so it makes everything look 3D."*

In the latest screenshot (`media_1793724099435_91d87cdc.jpg`):
- The model renders against `Backplate_Nebula.tga`, but looks like a dressing-room character against wallpaper inside a 2D box.
- To produce an unmistakable **optical 3D holographic lens sensation**:
  1. **Stitched Microlens Array (Layer A)**: Keep `Marshmallow_E_Window.tga` visible with an ultra-thin 1–2px golden bevel and subtle CRT scanlines (`alpha = 18`) so the eye reads an array of physical microlenses rather than an empty cutout.
  2. **Multi-Plane Off-Axis Parallax (Layer B)**:
     - Foreground floating reticle / depth plane (`z = -0.4`, negative parallax—pops out toward user).
     - Focal plane (`z = 0.0`, screen surface).
     - Midground character (`z = 0.5`, positive parallax—recedes into the monitor).
     - Background / live world (`z = 1.0`).
  3. **Stereoscopic Disparity (Layer C)**: Calibrate `/fide stereo anaglyph` (Red/Cyan) and `/fide stereo sbs` with true horizontal baseline shift (`+/- 4px`).

---

## 3. Quick Command Reference

```powershell
# In D:\fidelity-repo:
node tools/gen_e_atlas.mjs       # Generates all 3 TGA assets
node tools/test_ematrix_math.mjs # Runs 11/11 unit tests
git status                       # Currently on flash/wow-ematrix-polish
```

Deploy path: `D:\World of Warcraft\_anniversary_\Interface\AddOns\FidelityEMatrix\`
