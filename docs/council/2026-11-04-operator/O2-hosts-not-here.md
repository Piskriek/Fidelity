# O2: the hosts are not here (opposing council, round 5)

Viewpoint: the named hosts and the client claims, checked against this checkout (/home/user/Fidelity) and the 2.5.6 client as the Lua shows it. Every code claim is file:line.

## Thesis

Argon's operator T(W, g, s) cannot be verified as written. Its binding names five things absent from this checkout (apps/universe, bridge/roster, @hm/sq-jepa, @hm/shorthand, hm:universe:v2) and a client (Midnight 12.x) that is not the one we run. What is real and testable here is a fixed grid orientation, the 1 then 8 then circular ring metric, the flip in seconds, zero-plane parallax, and a registry that refuses stale and future stamps. The bridge this vector most depends on, W bound to Vtx and Pxd, is broken by construction: Vtx is a clock and Pxd moves with Sol's uptime. Deliverables 1 and 2 must be scoped to what this repo can run, and the rest routed.

## Ranked attacks

**1. W bound to a clock breaks invariant 1.** The vector puts Vtx and Pxd in W and requires dW/dt == 0 (ARGON-INPUT.md, "Cartridge Binding" and invariant 1). Vtx is `0.50 + sin(tickCount * 0.1) * 0.05` (packages/triad-369/src/density_bridge.mjs:133), with tickCount++ on every step (:104). Pxd is `0.35 - rawLoss` and rawLoss switches on solUp (:128, :132). So W would change every tick and step with Sol's liveness. *Check:* a node:test holding a W block fixed across 100 Vtx ticks. It fails the moment Vtx is an input. Fix: freeze W's parameters at birth and carry Vtx and Pxd as labelled symbolic values, outside W.

**2. The "spectral parity hash" is a grid-position function.** GetCellRotation (FidelityEMatrix/EMatrix_Math.lua:27-45) hashes (col, row) with two constants (:41-42). No Four Float enters it, and the comment at :33-36 records that the earlier form was replaced to remove a diagonal lattice. So R is a fixed layout, not a function of Vtx, Pxd or any measurement, and invariant 1 passes trivially for a pure function of position. *Check:* a test that R depends only on (col, row) passes; the words "derived from spectral parity" must be struck.

**3. One scalar per cell: (W, g, s) has no slot.** BindCell(index, source, value, at, kind, window) (FidelityEMatrix/EMatrix_Core.lua:164-178) keeps one value, one kind and one window. The value is the band's constant (EMatrix_World.lua:149, BAND_VALUE), which the BindCell comment says is a label (EMatrix_Core.lua:162-163). A word search over FidelityEMatrix/, packages/triad-369/src and packages/wow-syntropic finds no loss, gradient or E_psi term. The only "loss" is `rawLoss` (density_bridge.mjs:168, :197) and a constant (packages/triad-369/src/bootstrap.mjs:42). g = grad_W L, Pi, D_KL, E_psi, theta, V and delta-L have no code. *Check:* none; the schema needs three named sources per cell and no test covers it.

**4. hm:universe:v2 is one literal with no encoder.** The only text is ARGON_OPUS_MASTER_RESUME_V3.md:57, `#TAIL|schema:hm:universe:v2|crc32:0xD4E921A7`. No CRC or codec exists in the repo (grep for crc32 finds only that line). I computed CRC-32 locally (python zlib; no network) over the record lines 44-56 under four framings: body with LF 0x7885A3DA; body without trailing LF 0x8D000864; body plus the #TAIL line 0x6D1765C1; the same with LF 0xDED9E3D0. None equals 0xD4E921A7. The framing is not defined here. A whole-word search for "nem" finds no source file. *Check:* HeavyMetal2's canonical byte framing, then a round-trip fixture test. Until then the CRC is an unverified literal.

**5. A self-stamp is labelled "measured".** fileEvidence (packages/triad-369/src/evidence.mjs:18-24) takes `at` from the file's own JSON field, falling back to mtime (:9-15), and returns `kind: 'measured'` unconditionally (:23). A writer that stamps its own time is therefore "measured" however old its reading is. Argon's rule requires a measured number the host read. *Check:* a fixture whose `at` is an hour old with a fresh mtime, and the reverse; the kind must not be "measured" for a self-stamp.

**6. Coercion makes the NaN invariant vacuous.** ParallaxShift returns 0.0 for any non-finite input (FidelityEMatrix/EMatrix_Math.lua:149-150) and silently clamps z to [-0.9, 4.0] (:151). "0 NaNs across NaN/0/±Inf" therefore passes because bad input becomes 0, not because the operator rejects it. Invariant 5 holds by the formula eye*z/(1+z) at z = 0 (:152), so it checks arithmetic, not the host. *Check:* the fuzz test must assert that non-finite input is flagged or thrown, and that clamped z is reported.

**7. Literals and defaults inside the Four Floats.** density_bridge.mjs:111-112 default parts_up to 12 and parts_total to 13, so daemonAvailability = 12/13 = 0.923 (:127) passes the Aq gate (:135) with no tv_loop file. The Apex already removed the same default (packages/triad-369/src/triad_369_process.mjs:157, "null, not a guessed 12"), so the two bridges disagree. The Apex's Pxd and Lx fallbacks are literals 0.32 and 0.98 (:155-156), and its whole_check.passed is the literal `true` (:215), which feeds Aq (:234). The WoW HUD carries fourFloats as literals (packages/wow-syntropic/Core.lua:37); its UI prints "seed" when unmeasured (UI.lua:96). *Check:* with tv_loop.json absent, Aq and Lx must read "not measured".

**8. The client named is not the client we run.** CLAUDE.md:4 names TBC Anniversary 2.5.6.70577. FidelityEMatrix/FidelityEMatrix.toc:1 lists 120107, 110007, 110100 alongside 20504 and 20506; FidelityEMatrix_TBC.toc:1 lists only 20504 and 20506. packages/wow-syntropic/README.md:53 documents a `_retail_` path. Which interface numbers the 2.5.6 loader accepts, and whether the main TOC loads beside the _TBC copy, needs in-game verification. General knowledge: the 12.x interface range is the Midnight era. A search of the Lua for spell cooldown, aura, power, spec, cast-target and secret APIs finds nothing, so the combat-secret rules are not represented here.

**9. The one real "cast seed" is opt-in and unverified on 2.5.6.** packages/wow-syntropic/Core.lua:52 registers and :80-92 handles the combat log and player cast events behind optIn. Timestamps come from GetPrecisionTimeMs (:45-46), which falls back from debugprofilestop to GetTime()*1000, two time bases. Whether these events and debugprofilestop exist on 2.5.6 needs in-game verification. The vector's "player intent" has no source: the steering input in code is the cursor (EMatrix_Math.lua:156, EyeFromCursor), and the pad head has no age (council can/STEER.md).

## Concessions the evidence forces

- Salvageable now, with tests here: the ring metric (EMatrix_Math.lua:57-79; test 1 of tools/test_ematrix_math.mjs), the flip in seconds and its squash and glint (:91-131), the four rotations (:12-19), zero-plane parallax (:149-152), and the registry's window rule and lower bound (EMatrix_Core.lua:194-199).
- Pxd and Lx have real inputs (solIsUp at density_bridge.mjs:95-103; flow integrity) but are mostly constants and defaults. Label them, do not bind them.
- Deliverable 1 is unverifiable here. The minimal honest version is a schema in this repo, `{ id, sources: {W, g, s}, kind, window }`, with no hm:universe claim, plus node:test on the operator's own math.
- Of the five invariants: 1 needs W frozen, 2 already holds, 3 needs reject-not-coerce, 4 needs E_psi and must be struck or reframed as a registry decay test, 5 holds by arithmetic.
- The WoW side binds to existing sources only: eight actor bands (EMatrix_World.lua:133-137, 149-154) and the cursor eye. Anything else is routed.
- Correction to the record: the can STEER cites the flip toggle at EMatrix_Core.lua:940; it is at :1054.

| Name in the vector | In this checkout or client? | Nearest real thing here | Verdict |
| :--- | :--- | :--- | :--- |
| apps/universe | No (apps/ has fractal-engine only) | triad_369_process.mjs:24 reads sense/universe/universe.json; its writer is on Node 2, not here (bridge/node2-sol/README.md) | Route to HeavyMetal2 |
| bridge/roster | No | bridge/hands (laptop_tasks.json) | Route |
| @hm/sq-jepa, E_psi | No; E_psi appears only in council STEER files | none | Strike |
| @hm/shorthand, m/me/mc/mb/nem | No; record format at ARGON_OPUS_MASTER_RESUME_V3.md:42-57 | none | Route; spec needed |
| hm:universe:v2 + CRC32 | No codec; four framings do not match the literal | none | Route; attack 4 |
| Midnight 12.x, WoW Retail | Client is 2.5.6 (CLAUDE.md:4) | FidelityEMatrix.toc:1 lists 120107 | Needs in-game verification; strike Retail |
| Combat-secret rules | No | none | Route to Flash; general knowledge only |
| Player intent, cast seed | Opt-in code exists | wow-syntropic Core.lua:80-92 | Needs in-game verification |

For the LEAD: sign "a cell's W is a fixed grid orientation R = hash(col, row) and is never bound to Vtx or Pxd", and strike "derived from spectral parity", "g = grad_W L", "E_psi" and "serializable to hm:universe:v2" until HeavyMetal2 supplies their definitions.

Route: Opus gets the three-source registry record, the frozen-W test and reject-not-coerce in ParallaxShift. Flash gets the in-game checks (TOC load, cast events, debugprofilestop, /fide cells). Argon gets the blind audit of the CRC framing, the Four Float defaults and the self-stamp kind.
