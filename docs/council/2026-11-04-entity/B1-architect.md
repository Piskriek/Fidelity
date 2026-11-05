# B1: Architect, on what the Weight-and-Gradient Entity is (builders' council, 04 Nov 2026)

**Labels.** "from the code" = read at the cited line. "general knowledge" = rule of thumb, not checked here. "needs in-game verification" = only the client can settle it. "not in this checkout" = the item lives in HeavyMetal2 or elsewhere and was not read. Recomputed figures use the code's own formulas (no file written).

## Thesis

Seen from structure, the entity as built is one master frame holding 135 anonymous display cells, a closed-form wave over them, and four state values (wave origin, toggle, age, eye). The cells have a fixed identity (orientation) and a flip that is a function of time and distance; no cell reads another cell, and no cell reads a measurement. Argon's unit loop (ask, work, check, report, route, landed) is not a cell's state machine; it is the compassion loop (`.agents/skills/compassion-loop/SKILL.md:15-20`), and the measured composition is the holon (`packages/triad-369/src/triad_369_process.mjs:192-197`). So a cell is a display element of one frame, not an agent. The entity earns a cell-level meaning only when a cell is bound to a named source. The definition below is built on that.

## Q1 Identity: one cell, one grid

**Answer.** The grid is 15 by 9, `COLS` and `ROWS` at `FidelityEMatrix/EMatrix_Core.lua:27-29`, giving `TOTAL_CELLS = 135` (`:29`). Each cell is a table of position, `rotIdx`, `uv8`, `ringDist`, `settled` and `face` (`:473-501`). Orientation is fixed at birth by `GetCellRotation` (`FidelityEMatrix/EMatrix_Math.lua:27-42`, the comment says the cubes "never morph or rotate"). The wave is `u = (age x speed - ringDist) / duration`, clamped (`EMatrix_Math.lua:89-99`), and `ringDist` is a Chebyshev-to-Euclidean blend (`:55-75`). Recomputed from those formulas with origin (8,5): ring 0 is one cell, ring 1 is exactly eight cells, and there are 28 distinct wave distances. The driver loops over all 135 cells every frame (`EMatrix_Core.lua:773-776`).

**What the code does not have.** "Local 3x3 lateral coupling" and "multi-hop message passing" (Argon's section 2.3) do not exist: no cell reads a neighbour's state. The Chebyshev rings are a geometric label, not a dynamics.

**Ruling: rule B, for now.** The code is one entity with anonymous cells, which is Argon's Option B's shape. Option A (one cell equals one roster agent) cannot be settled from the code, because no cell has an input to be an agent with. It becomes available only when Q2's per-cell binding exists.

**The loop.** A click is the ask (`EMatrix_Core.lua:543-562`, `:998`). The wave is the work. Nothing checks, reports or routes. The checked loop is the council (`SKILL.md:15-20`), so the loop maps onto the council and holon, not a cell.

## Q2 Truthful binding: what drives a flip

**Answer.** Nothing measured drives any cell. The only triggers are a mouse click on the grid (`EMatrix_Core.lua:543-562`) and `/fide ripple` (`:998`). A trigger toggles `waveTargetState` (`:940`). Colour and orientation carry no number.

**Argon's own text is wrong on this point.** Fold 3 says the gate `u` is "derived from `Lx, Aq`" (ARGON-INPUT section 3). The code's `u` depends only on age, speed, ring distance and duration (`EMatrix_Math.lua:89-99`). The "gold glint" is `sin^2(u pi)` (`:104-124`), a time curve, not Fisher precision. The "rainbow ramp" has no code path.

**The HUD is worse.** `packages/wow-syntropic/Core.lua:37` sets `S = (Pxd 0.20, Vtx 0.50, Lx 0.95, Aq 0.20)` as saved defaults. `UI.lua:73` and `:88` print them. Nothing in the package writes them (grep of `packages/wow-syntropic` finds only those lines). `coherence = 0.99` (`Core.lua:35`) and `lyapunovFTLE = 0.005` (`:39`) are constants too. Under Argon's rule 8a these are symbolic values shown as readings.

**Ruling: rule A, with a named minimum.** A cell may flip only on a named source, and the source's status uses the three kinds the repo already defines: `measured`, `symbolic`, `not_measured` (`packages/triad-369/src/evidence.mjs:47-51`). The per-cell minimum is one bit: the source is fresh (`evidence.mjs:18-23`, `fresh` against `freshMs`). Orientation stays identity, with no number. Design proposal, not code: six flows (`triad_369_process.mjs:192-197`) each drive a block of cells, so a stale flow reads `not_measured` as a visible state rather than a silent flip. Cell-level binding waits for that.

## Q3 Stereo versus comfort

**Answer.** The code has no frame alternation. A search of `FidelityEMatrix/*.lua` for parity, alternation, frame-rate or dither finds nothing. Stereo is spatial: `sbs`, `cross`, `anaglyph` (`EMatrix_Core.lua:13-15`), with `stereoPixels = 4` (`:65`) and `stereoDelta = 0.06` (`:64`). Anaglyph forces a black field (`:583-584`). Motion comes from the eye, which is smoothed (`:823-835`, per B3). Argon's frame-time gate has no code. The 1.75 px and 45 FPS thresholds are not in the repo; the comfort thresholds are general knowledge at most, and needs in-game verification for this client.

**A flag against Argon's own rule.** The depth gain rises with lean: `DEPTH_GAIN = 0.6` (`EMatrix_Core.lua:51`) and `EYE_GAIN_MAX = 1.8` (`:52`). Leaning in raises parallax intensity. "Intensity only goes down" would cap it, not raise it.

**Ruling: rule A.** The default is continuous eye parallax with no alternation. Alternation is not built and should not enter the definition. The gain cap should go down with strain, not up with lean.

## Q4 Restorative dual

**Answer.** The reverse is the same wave with the toggle flipped (`EMatrix_Core.lua:940`), not a dual. Nothing computes ΔL, so nothing relaxes an entity back to rest. "Rest" in the code means zero CPU: `CheckIdleCondition` detaches `OnUpdate` when nothing moves (`:901-919`). The partial aperture (Argon's option, section 4.4) needs a per-cell predicate. The loop runs over all 135 cells (`:773`), so none exists.

**Ruling: cannot be settled without a per-cell change measure.** Until the Q2 binding gives one, the whole-grid toggle (rule B, a user choice) is the only honest default. Partial aperture follows the measure.

## Q5 Portability

**Answer.** The visual state is small. It is `waveOriginCol`, `waveOriginRow`, `waveAge`, `waveTargetState` (`EMatrix_Core.lua:126-131`, `:937-940`) plus the eye (`:136`). Every cell is derived from these. The cognitive or weight state has no representation in this checkout. `hm:universe:v2`, `@hm/shorthand`, `CapitalEmpire` and `PLAN_FRACTAL.md` are not in this checkout; they are cited in the briefs and in RESUME, and were not read. The "Lateral Yin/Yang Dual Inverse" in `README.md:25` is a term in this repo, not a spec.

**Ruling: rule A for the visual (four values plus the eye, derivable on any host). Cannot be settled for the cognitive state without the HeavyMetal2 shorthand specification (not in this checkout).**

## Composition with the holon and the council

Cell sits inside a frame, the frame is one node's display (Fidelity, Node 1), the nodes make the holon, and the holon's rounds are the council. The holon is the smallest measured unit: three nodes, Node 4 as an arena handoff (`triad_369_process.mjs:426`), six directed flows each with an `active` flag and evidence (`:192-197`), and coherence `flow_integrity * 0.99` (`:289`, "derived", not measured). That derivation is the reason a 0.66 means four of six flows. A cell should never claim a number the flow does not carry.

## Proposed canonical definition (my words)

The Weight-and-Gradient Entity, as this repo supports it, is a display of one state. It is a 15 by 9 frame of 135 anonymous cells, each with a fixed orientation that is an identity label, not a measurement. A cell flips only when the named source that drives it is fresh; a stale source shows as `not_measured`. A click or a `/fide ripple` names where a request began; it is not evidence. The frame has no inner dynamics that it computes, no rest that it reaches by itself, and no cognitive content in this checkout. It may claim that a cell flips when its source is fresh, and that the wave shows the origin of a request. It may not claim that a cell is an agent or a weight; that the lattice is a Hilbert curve (no Hilbert code exists in the repo, and the E is a signed-distance glyph of a spine and three bars, `tools/gen_e_atlas.mjs:88-97`); that the flip is a gradient or a precision; that the grid is one mind; or that anything is three-dimensional.

## Closing table

| Question | Ruling | Evidence | Confidence |
| :--- | :--- | :--- | :--- |
| Q1 Identity | rule B now; A waits for Q2 | `EMatrix_Core.lua:27-29, 473-501, 773-776`; `EMatrix_Math.lua:27-42, 55-75` (ring 1 = 8 cells, recomputed) | high on structure; A is a design choice |
| Q2 Binding | rule A: named source, three kinds, one fresh bit per cell | `EMatrix_Core.lua:543-562, 940, 998`; `wow-syntropic/Core.lua:35-39`; `evidence.mjs:47-51`; `triad_369_process.mjs:192-197, 289` | high (no binding exists) |
| Q3 Stereo | rule A: continuous, no alternation; cap gain | `EMatrix_Core.lua:51-52, 64-65, 583-584, 823-835`; grep finds no parity code | high on code; comfort thresholds needs in-game verification |
| Q4 Dual | cannot be settled without a per-cell change measure; whole-grid toggle is the default | `EMatrix_Core.lua:901-919, 940, 773` | high that it is absent |
| Q5 Portability | rule A for visual (four values plus eye); cannot be settled for cognitive state | `EMatrix_Core.lua:126-136, 937-940`; `hm:universe:v2` and `@hm/shorthand` not in this checkout | high for visual; none for cognitive |
