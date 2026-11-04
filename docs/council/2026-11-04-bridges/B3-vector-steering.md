# B3 Vector steering: bridges ranked by payoff per hour

Lens: vector steering. Read-only on the code. Checkout: `francois/serene-euler-51wj3e`, HEAD `dbdccb1`. `hm:universe:v2` and `PLAN_FRACTAL.md` are not in this checkout. Effort marked "est." is my estimate.

## Thesis

The entity definition (`docs/council/2026-11-04-entity/STEER.md` section 2) opens a cell only on a named, measured, fresh source with an evidence kind. Nothing in the window does that yet. No `BindCell` or "no source" state exists in any `.lua` file (grep, empty), and the addon reads no file: `FidelityEMatrix.toc:6` declares only `FidelityEMatrix_Config` as SavedVariables. So the first gate is not code. It is the owner's sign-off on section 2, which `LANDED.md` still shows as `pending`. Then comes the binding schema in the addon, then one channel into WoW, then decoration. The best payoff per hour is where a number already exists and needs only an honest label. The first honest bound entity is the six Triad flows (`packages/triad-369/src/triad_369_process.mjs:192-197`). The atlas can run in parallel because it claims nothing new. Calm defaults need the owner's word.

## Ranked list

**1. Label the literals, and derive the bridge status (about 1 h est., low risk).**
- Claim: the WoW HUD prints constants as readings, and the density bridge writes a constant status.
- Evidence (from the code): `packages/wow-syntropic/Core.lua:35` sets `coherence = 0.99`; `:37` sets `fourFloats` as literals; `:104` only ever decrements strain from 0; `packages/wow-syntropic/UI.lua:76` prints coherence and strain as readings. `packages/triad-369/src/density_bridge.mjs:173` writes `status: 'synchronized'` on every tick. That is the likely root of the T1 disagreement (`docs/RESUME.md:43`).
- First step: in `UI.lua:76`, append "seed" from a constant beside each literal. In `density_bridge.mjs:173`, derive the status from the evidence the bridge already reads.
- Test: a headless `packages/wow-syntropic` test that the HUD string contains "seed" while no writer exists; a `packages/triad-369/test` case where a stale density file yields a non-synchronized status.
- Proves it works: the labels appear in `triad -- status` and the HUD; the test fails on the old literal.

**2. Per-cell binding schema, with the "no source" draw (est. 3 h, Opus, owner gate).**
- Claim: each cell carries one named source, a value, an age and a kind, and a cell with no fresh measured source stays closed and reads "no source" (`STEER.md` section 2 and section 3, row Opus).
- Evidence: cell state is today orientation and arrival time only (`docs/council/2026-11-04-entity/B3-simicist-and-physics.md:39`, citing `FidelityEMatrix/EMatrix_Core.lua:939-945`). The evidence vocabulary is `packages/triad-369/src/evidence.mjs` (`measured`, `symbolic`, `not_measured`).
- First step: a pure function `Math.SourceOpen(source, now, freshSeconds)` in `FidelityEMatrix/EMatrix_Math.lua`, called by a `ns.BindCell` in `EMatrix_Core.lua`. Keep the pure function testable without the client.
- Test: in `tools/test_ematrix_math.mjs`, a fresh measured source opens, a stale one closes, and a `symbolic` or missing kind closes.
- Proves it works: the login line reports the bound count, which is 0 today, and the test passes. Blocked by the owner's sign-off.

**3. E atlas with four pre-lit orientations (est. 3 to 4 h, Codex; `docs/council/2026-11-04/B1-fractal-fidelity.md:64-67` gives the same range for the warped variant).**
- Claim: the closed E tiles are lit from the upper left while the lens, housing and walls use the upper right (`RESUME.md`, paragraph "Two findings landed", v1.7.3; entity `STEER.md` section 3).
- Evidence: `tools/gen_e_atlas.mjs:145-172` shades with one fixed light; no quadrant or orientation code exists (grep, empty).
- First step: generate four quadrants in `gen_e_atlas.mjs` and map them in `EMatrix_Core.lua` with quadrant texcoords. Keep the colour labelled `symbolic` until item 2 lands (`STEER.md` vector 1).
- Test: a new `npm test` case that computes bevel dot products per quadrant against the upper right.
- Proves it works: the test passes, and the in-game box shows every open lens lit from the upper right (needs in-game verification).

**4. The six Triad flows on six tiles (est. 3 to 4 h after items 2 and 5; blocked by the channel).**
- Claim: each flow is one named source with an evidence object, bound to one tile. This is the first honest "agent".
- Evidence: F12, F21, F13, F31, F23 and F32 each carry an evidence object (`triad_369_process.mjs:192-197`); `evidence.mjs` supplies the kind and age.
- Blocker: the addon has no file access and only SavedVariables (`FidelityEMatrix.toc:6`). The laptop hands relay (`bridge/hands/laptop_tasks.json`) is manual, through the owner. Whether SavedVariables update only on reload or logout is general knowledge, and needs in-game verification.
- First step: a read-only export of the six flow records to a file the addon can load on reload, tested against a fixture. A non-WoW page reading the same records would test the binding without the client, but it does not meet the owner's goal.
- Proves it works: a flow going stale closes its tile on the next reload.

**5. Calm defaults: spin 0 and gain cap 1.0 (about 30 min code, owner decision).**
- Claim: nothing moves at rest, and eye gain is capped at 1.0 (`STEER.md` section 2 comfort law; B2 `B2-somatic-and-comfort-guardian.md:19`).
- Evidence: `EMatrix_Core.lua:60` sets `spinSpeed = 0.50`; `:52` sets `EYE_GAIN_MAX = 1.8`; `:884-888` turns the subject while spin is above 0. Round 1 forbids overlay default changes before the owner runs the protocol (`docs/council/2026-11-04/STEER.md`, forbidden list).
- First step: change `DEFAULTS` at `:60` and the clamp at `:52`, behind an owner dial.
- Test: a headless test that 10 s of `dt` at default spin leaves `currentFacing` unchanged.
- Proves it works: owner sign-off recorded in `LANDED.md`. Cost: the mob animation the owner reported (`RESUME.md:5`) stops at rest.

**6. Fractal texture, B1 items 2, 4 and 5 (3 h, 1 h, 2 h est., `B1-fractal-fidelity.md:64-67`).**
- Claim: the nebula, the jitter and the z = 0.75 star layer add visible structure inside the window.
- Evidence: `tools/gen_e_atlas.mjs:383-385` holds the two-sine nebula; B1 `:20-48`.
- Rule: each adds no number, so each is decoration. Item 4 (vertex jitter) is B1's high-risk item. The star layer is a parallax plane, not 3D.

## What does not help

- Frame alternation or any glasses-free claim (`entity/STEER.md` section 2, forbidden list).
- Per-cell four floats, or any per-cell weight or gradient.
- More texture before items 1 and 2: texture makes a cell look truer without making it so.
- Counting the 165 `npm test` passes as product evidence; O3 showed the stubs, not the product, are what they test.
- H006 (webcam head tracking, `bridge/hands/laptop_tasks.json:32`) before the channel question is answered. The addon cannot read a live camera on its own (general knowledge).
- T3 and T5 are not on this vector.

## Stop

- Any "weights", "gradients", "3D", "synced" or "parallax works" wording in the window, the login line or RESUME.
- The literal `status: 'synchronized'` at `density_bridge.mjs:173`, until item 1.
- Quoting `coherence 0.99`, `S` or "0.00 J" as readings (`UI.lua:76`).
- Overlay default changes until the owner signs item 5.

## Next three ASKs

1. **Which channel carries a source into a cell?** Builders: SavedVariables on reload, the hands relay, an external page on the laptop, an in-addon measurement (cursor eye, nameplate count). Opposers: each channel's freshness, and what the client allows (needs in-game verification). Each channel must name its evidence kind and age.
2. **Bind the first source.** Given items 1 and 2 landed, which single source binds first, and how does the "no source" state read in the box? Opposers try to make the closed state lie.
3. **What the bound entity can do** (`entity/STEER.md` vector 5); depth on the rendering path is a separate branch, held until ASK 1.

## Where the vector contradicts the owner, and how to say it

- **Full-screen 3D.** The owner wanted full-screen depth (`RESUME.md:121`, v1.5.0 default). The vector keeps the overlays as labelled portraits and makes no 3D claim. Say: "This round does not give you full-screen 3D. It gives labelled numbers and cells bound to them. Whether the client allows real depth is a research question, and it is next."
- **Glasses.** Red/cyan stays opt-in and is the only depth path that exists (`STEER.md` section 2; default `stereoMode = "off"` at `EMatrix_Core.lua:57`). Say so plainly.
- **Animation.** Item 5 stops the mob animation the owner reported (`RESUME.md:5`). Say the cost before flipping the default, and offer the dial.
- **"Make everything look 3D"** (`RESUME.md:155`) is not met by any item here. Say it directly.

## Closing table

| # | Bridge | Effort (est.) | Risk | Blocked by | Evidence today |
| :-- | :-- | :-- | :-- | :-- | :-- |
| 1 | Labels and derived status | 1 h | Low | none | `wow-syntropic/Core.lua:35-37,104`; `UI.lua:76`; `density_bridge.mjs:173` |
| 2 | Binding schema and "no source" | 3 h | Medium | owner sign-off | no `BindCell`; `EMatrix_Core.lua:939-945` |
| 3 | E atlas, four pre-lit | 3 to 4 h | Medium (seams) | none for the texture; claim waits on 2 | `gen_e_atlas.mjs:145-172` |
| 4 | Six flows on six tiles | 3 to 4 h | High | channel (ASK 1) and 2 | `triad_369_process.mjs:192-197`; `FidelityEMatrix.toc:6` |
| 5 | Calm defaults | 30 min | Low code; high owner cost | owner dial | `EMatrix_Core.lua:52,60,884-888` |
| 6 | Fractal texture (B1 2, 4, 5) | 1 to 3 h each | Medium to high | none; claims none | `B1-fractal-fidelity.md:20-48,64-67` |
