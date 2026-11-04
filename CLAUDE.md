# CLAUDE DIRECTOR BRIEFING: FIDELITY 4-NODE HOLON & EMATRIX 3D PROTOTYPE
**Timestamp:** 2026-11-04T22:01Z (the evidence of the round's third revision) | **Status:** EMatrix v1.8.8 after council round 6 (`docs/council/2026-11-04-rungs/`: the recorded reading per rung; one evaluator, `packages/triad-369/src/rung_ledger.mjs`, judges the 82 readings in `docs/rungs/ledger.json`, and `npm test` fails a fit with no reading behind it; none of the fits is confirmed yet; the camera has its first paired reading ready, a pose at every shutter and an overlay-off twin; three adversarial reviews, every confirmed or demonstrated finding addressed; H009 re-requested for the tenth report), on branch `francois/serene-euler-51wj3e` (draft PR into `claude/ematrix-depth`); read [`RESUME.md`](RESUME.md) §"Council round 2026-11-04-rungs" first, then the rounds below it  
**Branch the laptop deploys (H005):** `francois/serene-euler-51wj3e` (gate: toc version 1.7.5 or later); the owner's last report was v1.8.7 (`origin/owner/reports`, `reports/20261104-1321/`) | **Sections 1–3 below** are Flash's handoff written on `flash/wow-ematrix-polish` (`db2ae29`), kept for the client telemetry in §1  
**Target WoW Client:** `D:\World of Warcraft\_anniversary_\` (Burning Crusade Classic `2.5.6.70577`, character `Ikkibotwo`, realm `Thunderstrike`)

## 0. Checkpoint 10 — Director takeover from Node 2 (03 Nov 2026, verified 12:06–12:10Z)

Claude took over direction on **Node 2** (Sol, the 3080 PC: `PiskriekDesk`, `192.168.0.5`, user `RAMPAGE`). The sections below were written on the laptop (Node 1) and keep their laptop paths. What Node 2 verified, and what differs there:

| Item | On Node 2 |
| :--- | :--- |
| Fidelity checkout | `E:\Repos\Fidelity` (`D:\fidelity-repo` is the laptop's) |
| HeavyMetal2 | not present (`C:\MarbleGp` is a junction to a missing `E:\MarbleGp`) |
| WoW client | not present; §6 objectives 1–2 run on the laptop |
| Node 2 daemons | `friend.mjs`, `universe.mjs`, the ear: live (file ages 12:06–12:10Z), started hidden via WMI, so judge by file age, not process name. Runbook: [`bridge/node2-sol/README.md`](bridge/node2-sol/README.md) |
| Node 1 / Node 3 from here | laptop `:5179/reply.json` 200 and `:8787/healthz` ok at 12:06Z; SSH runs laptop → Node 2 only (port 22 on the laptop is closed from here) |
| Apex flow integrity | **0.667 / coherence 0.66** in the live push at 12:06:23Z; §4's "RUNNING" table does not say which flow is degraded (ticket T1) |
| `npm test` on Windows | 61 pass / 1 fail (`serve.test.mjs` shutdown: `SIGTERM` is `TerminateProcess` on Windows, ticket T3) / 1 skipped; the §5 SIV subset passes 23/23 |

Direction and tickets T1–T5 are in [`docs/RESUME.md`](docs/RESUME.md) §"03 Nov Checkpoint 10". Rule for every later status line in this file: carry the timestamp and the evidence (a file age, an HTTP reply, a commit) that produced it.

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
   - A plain `Model` frame draws nothing an addon loads by path (any camera, strata, scale or file); `PlayerModel` and `DressUpModel` frames draw the same file (the owner's report `reports/20261104-1024/` on `owner/reports`, 04 Nov 2026).
   - A `PlayerModel` frame centres the model's bounds on its mid-line and draws it at 1/k (`SetCamDistanceScale(k)`): each file reaches a fixed distance above and below the mid-line at x1, the barrel's within 0.025 from x0.6 to x3, in a given frame aspect (the director's second reading, round 6; the readings are rows in `docs/rungs/ledger.json`). The camera distance that fits a file is a property of that file, not of its nominal height.

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
