# B5 Host-Bridge Engineer: what the entity is, as the hosts can carry it

Round 2026-11-04-entity. Read-only on the code; this file is the only write. Labels: **[code]** = file:line in this checkout; **[general]** = general knowledge; **[in-game]** = needs in-game verification.

**Not in this checkout:** `hm:universe:v2` (its grammar and CRC are not defined here; the tag appears only as a header line at `ARGON_OPUS_MASTER_RESUME_V3.md:57`, with a record example at lines 45-56) and `PLAN_FRACTAL.md`. Nothing below relies on their contents.

## Thesis

Today the entity has no measured number in any host. The WoW addon draws a 15 x 9 grid whose only per-cell inputs are a grid index, a rotation hashed at birth, and a distance from the cell that was clicked [code: `EMatrix_Core.lua:467-469`, `EMatrix_Math.lua:39-42`, `EMatrix_Core.lua:556-560`]. Its one four-float S is a set of literals printed in the footer [code: `packages/wow-syntropic/Core.lua:35-37`, `UI.lua:88`]. The Triad host computes some of its S from real evidence, but not per cell, and mixes in constants it does not label. So "every visual traces to a number" holds only weakly: every pixel traces to a constant or a clock. The definition should say the grid shows a state the host supplies, and that a cell with no source shows that it has no source.

## Q1 Identity: one cell, or the whole grid?

Evidence: 135 cells [code: `EMatrix_Core.lua:27-29`], but at most 8 actors are drawn [code: `EMatrix_World.lua:28`]. The holon has six flows [code: `triad_369_process.mjs:191-198`] and its daemon count falls back to 12 of 13 when `tv_loop.json` is missing [code: `density_bridge.mjs:97-98`]. No host keeps per-cell agent state.

**Ruling: rule B for now.** Option A (one cell = one agent) has no host counterpart: it needs 135 real agents, and the hosts have 8 actors and 6 flows. The grid is one body with global state. Option A cannot be settled without a per-cell owner.

## Q2 Truthful binding: the question this lens owns

**Numbers that exist in the WoW host [code]:**
- Click cell: `GetCursorPosition` gives the wave origin (`Core.lua:550-560`); `/fide wave` also sets it (`Core.lua:995-998`).
- Wave age: accumulated `dt` (`Core.lua:760-768`). A clock, not a game state.
- Ring distance: geometry from the origin (`EMatrix_Math.lua:55-77`).
- Open or closed: a boolean flipped on each wave (`Core.lua:940`).
- Rotation: a fixed hash (`EMatrix_Math.lua:39-42`), no game input.
- Eye: cursor (`Core.lua:851-868`), or the pad (`Core.lua:741-755`, `841-850`).
- Actor band: `CheckInteractDistance` at 3 and 4 (`EMatrix_World.lua:131-141`). A nil answer counts as far (`:138`), so a restricted call would turn every actor far. The 10 yd and 28 yd figures are the code's comment (`EMatrix_World.lua:11`) [in-game].

**Numbers that do not exist:** no per-cell gradient, precision, loss, or measured state. The repo has no other inputs to the grid.

**The WoW HUD's S.** Pxd, Vtx, Lx and Aq are literals (`Core.lua:37`), and nothing writes them: `ComputeFlowState` writes only entropy, `rotationBotting` and APM (`SomaticFlow.lua:130-135`). Coherence 0.99 is a literal (`Core.lua:35`, read at `UI.lua:68`). Strain only falls (`Core.lua:104`). `activeRung` is the literal D3 (`Core.lua:36`, `:99`). The two measured values are Shannon entropy, which exists only when opted in and after five casts (`SomaticFlow.lua:106`, `:130`), and `lyapunovFTLE`, which accumulates the constants 0.002, 0.050 and 0.080 (`Kinematics.lua:59-74`). That is a heuristic, not a Lyapunov exponent. No component of S is measured, so S cannot drive cells.

**The Triad host, per float** (`triad_369_process.mjs:231-235`): Pxd = 0.333 plus a 0.005 octave term, a constant. Vtx = 0.50 + 0.06 sin(0.2 tick), a sine not marked symbolic. Lx = 0.50 + 0.495 flowIntegrity, the one real term. Aq = 0.15, plus 0.05 gated on `whole_check.passed`, which is hard-coded true (`:215`). Coherence = 0.99 flowIntegrity, so 0.66 = 4/6 x 0.99. `evidence.mjs` marks `energy_conservation` symbolic (`triad_369_process.mjs:216`) and FTLE not measured (`:217`), but Pxd and Vtx carry no marker. `density_bridge.mjs:118-121` ties Pxd and Lx to Sol's status and daemon counts, and `triad_mesh.mjs:120-123` uses branch constants (0.20 or 0.40, 0.98 or 0.85, 0.25).

**Minimum truthful binding per cell:**
- **WoW:** cell k is bound to actor slot k, for k up to 8. u_k = 1 only when the nameplate token exists and `CheckInteractDistance` answers near or mid. The pad drives the eye. The other 127 cells stay closed and read "no source". [in-game] whether `CheckInteractDistance` answers in combat and in instances.
- **Triad:** cell k is bound to flow F12 to F32 (six cells), with u = that flow's `active` flag (`evidence.mjs:36-38`). The rest are unbound.

**Ruling: rule A.** No per-cell S exists. S binds globally only, and cells bind to named inputs one at a time.

## Q3 Stereo versus comfort (host view)

The addon has no code that alternates frames. Anaglyph is two copies with alpha (`EMatrix_World.lua:199-208`). `dt` arrives every frame (`Core.lua:760`), so a frame-time log is possible [code]. An addon API that alternates a display is not known to exist [general].

**Ruling: rule A for option (a)** (continuous eye and head parallax). Option (b) cannot be built in the addon. The 1.75 px and 45 fps limits are the entity's claims and need the owner's eyes and frame-time data [in-game].

## Q4 Restorative dual

The code has one wave, and each trigger flips the target (`Core.lua:940`), so the reverse ripple is the same ripple run again [code]. The rest condition, ΔL ≤ 0, has no number in any host. No loss is read; `density_bridge.mjs:114` is a binary 0.024 or 0.048 on whether Sol is up.

**Ruling: cannot be settled without a measured resolution signal.** Until one exists, the dual is a click, and a click is not a rest.

## Q5 Portability

The addon's inbound channels [code]: cursor, the pad (`Core.lua:741-755`), the saved table `FidelityEMatrix_Config` (`FidelityEMatrix.toc:6`), and Lua data files loaded at login (`toc:13-14`). No `io`, `loadfile` or `dofile` appears in `FidelityEMatrix/*.lua`. [general] An addon cannot read arbitrary files at run time, so a cartridge reaches it as a generated Lua file or a saved table [in-game].

**Cartridge content, by arithmetic:** grid 15 x 9 (2 bytes); wave origin (2); wave age as float32 (4); wave target (1); eye x, y, z (12); global S as four float32 (16); config, about 20 keys (`Core.lua:55-88`), about 200 bytes as text; per-cell u as one byte each (135). Total under 0.5 KB. Rotation is not stored: each host derives it from the same hash (`EMatrix_Math.lua:39-40`). Storing four floats per cell would add 2160 bytes at float32 and still fit in 4 KB, but it breaks "Four Floats only": S is one global quadruple, so per-cell floats would be a fifth structure. Do not store them. Derive u from origin, age and ring distance (`EMatrix_Math.lua:55-97`).

**Ruling: rule A for content.** Compatibility with `hm:universe:v2` cannot be settled without that file.

## Proposed canonical definition (my words)

The Weight-and-Gradient Entity, as the hosts can carry it, is a fixed 15 by 9 grid of cells. It shows one global four-float reading S and, for each cell, an open or closed state that is a function of a named input. A cell whose input the host does not measure stays closed and reads "no source". A cell's rotation is a fixed seed, not a state. The wave is a clock-driven spread from an origin the user chose and carries no information the host did not supply. The entity is a view of the host's readings. It is portable as origin, age, eye, S and config, from which each host derives the cells.

**It may NOT claim:** that any cell is a weight, gradient, precision or loss; that the four floats exist per cell; that a Hilbert fold is in the art (no Hilbert code exists: `tools/gen_e_atlas.mjs:78-116` is a procedural shape); that the WoW copies are 3D or synced (`EMatrix_World.lua:8-9` says the addon cannot read where a nameplate is); that Pxd, Vtx, Lx or Aq is measured in WoW (`Core.lua:37`); or the 1.75 px and 45 fps limits, without the owner's data.

## Closing table

| Question | Ruling | Evidence | Confidence |
| :--- | :--- | :--- | :--- |
| Q1 Identity | Rule B now; Option A needs per-cell agents | `EMatrix_Core.lua:27-29`; `EMatrix_World.lua:28`; `triad_369_process.mjs:191-198` | High |
| Q2 Binding | Rule A: global S only; cells bind to named inputs | `Core.lua:35-37`; `SomaticFlow.lua:130-135`; `triad_369_process.mjs:231-235` | High in code; band answers unknown in-game |
| Q3 Stereo | Rule A for (a); (b) not buildable in the addon | `EMatrix_World.lua:199-208`; `Core.lua:760` | Medium; needs P6 and frame data |
| Q4 Dual | Cannot be settled without a measured rest signal | `Core.lua:940`; `density_bridge.mjs:114` | High |
| Q5 Portability | Rule A for content; compatibility unsettled | `Core.lua:55-88`; `FidelityEMatrix.toc:6,13-14`; `ARGON_OPUS_MASTER_RESUME_V3.md:45-57` | High for size; none for compatibility |
