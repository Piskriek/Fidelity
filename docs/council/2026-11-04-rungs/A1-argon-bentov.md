# A1: Argon's Bentov packet as a lens on the per-rung nodes

Framing: "awareness", "density", D1 to D7, "Light Being", every Bentov term; no host here measures them. Client claims cited to code are from the code; others are marked. `T` = `FidelityEMatrix/EMatrix_Terrain.lua`, `M` = `EMatrix_Math.lua`, `Rep` = `EMatrix_Report.lua`, `R9` = `reports/20261104-1321/FidelityEMatrix.lua` (`origin/owner/reports`). "Proposed" names do not exist; "computed" is my arithmetic.

## Thesis

The packet models coupled oscillators whose phase lock R, an O(N) order parameter, gates a guarded index. No code here computes a phase lock, order parameter or 7 Hz (every `.lua`, `.mjs`, `.ts`, `.js` searched); nine targets are absent; the index is right and finite, but a seed while θ is unmeasured. Two parts survive. **Coupling:** v1.8.7 says the props stand "where the real objects stand" (`RESUME.md:9`) on scenes read at v1.8.6 values it changed for the crate and the trees' frames (`RESUME.md:5, 7`). **One measured phase:** the facing, read every frame (T:179, 641-645); its resultant over a window gates when the camera rung may look.

**Missing element:** the lock between coupled rungs: each reading carries the values of the rungs it rests on, so a change below unlocks exactly the readings above it, and the ladder's coherence is the fraction of rungs held on locked readings, an order parameter over verdicts, not phases.

## The node per rung

New column: the lock key; B1 and B8 cite the rest.

| Rung (rests on) | Input; output | Test | Measure; witness | Written back | Lock key | In client |
|---|---|---|---|---|---|---|
| Map | tiles; `Data/*.lua` | `tools/ematrix-mapdata.test.mjs` | `32:48 FOUND` (R9:64); host | data | data build (T:79) = client build (manifest) | yes |
| Axis (map) | `UnitPosition` (T:175); north-south first | own tile | MISSING, FOUND (T:170-174, `RESUME.md:106`); host | the swap | build | yes |
| Load (map) | path; model | file id > 0 (T:247-251) | `loaded 45 failed 0` (`RESUME.md:47`); host | `loadStats` (T:244) | build, path | yes |
| Frame kind (load) | `FRAME_ORDER` (T:202); pixels | `visible` (T:486), an echo | `-1024` shots (`RESUME.md:59`); owner, director | `FRAME_ORDER` | build | no |
| Fit (frame kind) | k; fill | fill 1 ± τ | red-frame fill (`RESUME.md:5, 15`); director | `FIT_BY_FILE` (T:274); `propFit` unused (T:778-780) | file, kind, k, printed (T:493-494) | no |
| Relative position (fit, camera) | placements, fits, pose; frames | owner's rule (`RESUME.md:17`) | scenes; director, owner | aspect, heights (`RESUME.md:7`) | (file, k) in view, pose, settings: unrecorded (R9:1500-1535) | no |
| Camera (axis) | facing, zoom (T:179-180), saved pitch, fovY (T:108); points (M:240-273) | pixel residual ≤ τ | none: nameplates restricted (`EMatrix_World.lua:8-10`) | pitch, fovY (T:733-734), never set | settings, zoom, facing resultant | facing, zoom |

**Pattern.** Host-measured rungs lock on the build and held within one paste; above load only the owner's picture measured, and evidence outlived moved bases.

## The algorithm

R rungs, E rests-on edges, P parameters per rung, M readings, N props (≤ 24, T:21); B = 40 bisection steps (M:294); I a Gauss–Newton cap.

```
lockAndClimb(rungs, readings, values, now)            (proposed)
1 Kahn's order; reject a cycle
2 K_v = hash(values of v's bases, settings)
3 admit m for v iff measured, witness outside v, fresh,
  key(m) = K_v (locked); else keep it, marked unlocked
4 each v once, in order: blocked if a base fails;
  unmeasured below P + 1 locked readings; else fit
  (Σ(fill/k)/Σ(1/k²), bisection or Gauss–Newton);
  held iff a held-out residual ≤ τ
5 write theta_v with a new key if it moved beyond τ:
  readings above unlock at 3, nothing re-run; re-settle
6 C = |held| / R, kind derived, partition named; frontier
7 client, per frame: running sums of cos, sin of facing;
  a camera reading counts iff R_f ≥ exp(−σ²/2), σ = atan(τ/focal)
```

**Cost:** 1, 2 and 6 O(R·P + E); 3 O(M·N); 4 O(E + B·M + I(M·P² + R·P³)); 5 O(N·P); total O(R + E + M·N + B·M + I(M·P² + R·P³) + N·P) per report, and 7 O(1) per frame. Polynomial: bounded visits per rung, edge and reading; B and I constant; no subset or grid enumerated.

**Exponential or unbounded, replaced.**
- Rungs "locked together" as subsets, 2^R: the held set is closed downward, one pass; for measured angles, the largest cluster in an arc is a sort and sweep, O(N log N) (general knowledge).
- A version-wide key (`B2-control.md:41`, `O2-uncountable.md:31`) re-reads every rung above load at each bump; the base key unlocks only a change's descendants, O(|D| + E_D): at v1.8.7 the barrel's scene reading stays, the crate's goes.
- The pitch-fov search "until the copy stands on it" (T:10-14), G^P presses: bisection or least squares.
- `stepSqJepaLatentRollout` "until finalEnergy ≤ 1e-9" (absent) is unbounded: cap I, state the contraction ρ, log(E₀/ε)/log(1/ρ) steps (general knowledge).

## Ranked points

1. **The lock** (Opus; 2 h). `RESUME.md:9` against `:5, 7`. `FIT_BY_FILE` is an unstamped literal (T:274) that `FitSource` calls "measured from your reports" (T:307) whatever version read it. The registry counts fresh, measured records per cell (`FidelityEMatrix/EMatrix_Core.lua:202-212`), the Apex its active flows (`packages/triad-369/src/evidence.mjs:41-45`): C lifts that count to rungs, never as a flow (`B7-holon.md:33`).

2. **The facing resultant, the one measured phase** (Flash; 1 h; needs in-game verification). Yaw is taken as the facing (T:593, 645). The ninth run pressed steps 7, 8 and 9 three seconds apart (R9:1480-1513), each shot 0.5 s later (Rep:14, 93-101), no facing saved. Computed: at the probe's focal 781 px, (853/2)/tan(0.5) from the saved fovY (R9:65, M:258), 10 px gives σ = 0.0128 rad, gate R_f ≥ 0.99992; half a window turned 0.5 rad: 0.969. Clocks: the flip u (M:91-107; "not a measurement", `packages/triad-369/src/light_being_kernel.mjs:139`), `tickCount % 9` (`packages/triad-369/src/triad_369_process.mjs:144`), `Vtx` (`packages/triad-369/src/density_bridge.mjs:137`). Echo: the rung loops (one shared report). Seeded period: the report stamps (aperiodic, 21 to 35 minutes apart). Not yet: the head tracker (30 per second, `tools/headtrack/headtrack.py:212`; none in game, `RESUME.md:79`).

3. **The index: right, finite, empty for a rung** (Argon). Computed: θ = 60°, R = 1 gives H = 0.866, index 2.000, as the packet says; 3.20 at its S6 threshold H = 0.95; 1/cos θ until H passes 0.9999995, then the floor's 1000, so BigInt64 "to avoid ... Infinity" has none to avoid. NaN gives 1.0. Its slope (31 at 0.95, 353 at 0.99) magnifies any error in R. With θ unmeasured, the index relabels R monotonically: over eight rungs at sin θ = 1, seven held read 2.07, eight read 1000.

4. **Gate 3, "a lens never lies"** (Flash, Opus; 0.5 h). The HUD prints "Active Rung: D3" (`packages/wow-syntropic/UI.lua:83`) from a literal (`Core.lua:36, 101`) beside gated coherence and strain (UI.lua:80-82). The legacy CLI (`package.json:14`) prints `coherence || 0.99` (`packages/triad-369/src/triad_cli.mjs:79, 88`), `|| 'D7'` (:77) and "D7 (Gateway)" (:80) under "Zero Architectural Lies" (:60); `0 || 0.99` is 0.99 (general knowledge). The skill: "no constant printed as a reading" (`.agents/skills/compassion-loop/SKILL.md:59`).

5. **Framing, absent, forbidden** (the owner, Argon). Framing: 7 Hz consciousness, the somatic oscillators, time dilation, veil opacity (a check-list word, `README.md:156`), S6, zero-point rotation, `D_KL` (struck, `docs/council/2026-11-04-operator/STEER.md:19`). Absent (only in `ARGON-INPUT.md` and my brief): `stepCoupledSomaticSystem`, `v2StepRestAndRecoveryCycle`, `packages/universe-bridge`, BigInt64 tuples, `FIDELITY_COMPLETE_BRS_V2.md`, `formatShorthandRecordV2`, `stepSqJepaLatentRollout`; `@hm/sq-jepa` (`RESUME.md:126`); `packages/harness`, an alias to a missing directory (`apps/fractal-engine/vite.config.ts:19`); checks C16 to C26 (`README.md:148, 174` stop at C15). Gates 5 and 7: a candidate; Gate 7 holds by absence. Gate 1's Joules is a seed slot on the HUD (`packages/wow-syntropic/Core.lua:38`; UI.lua:82); the nearest law in code is the kernel's V, never rising, over a clock (`tools/light-being-kernel.test.mjs:110`): nothing rises without a new locked reading. Forbidden already: `D_KL` in code (operator `STEER.md:84`); a measured HUD coherence or strain (`docs/council/2026-11-04-entity/STEER.md:34`).

## The loop back

Today: `FidelityEMatrix_Report` (`FidelityEMatrix/FidelityEMatrix_TBC.toc:6`), H009, the director's eye, a retyped constant (T:274). Added: each step's record stores `base` (file, k, source of each prop in view, T:493-494) and `dwell` (R_f, facing, zoom at the shutter, Rep:93-101); the evaluator writes θ with its key into the builders' generated table (B8). Next time an unlocked reading prints "read at x1.39, now x0.42" instead of holding; the panel re-asks only unlocked or unheld rungs; C falls when a base changes and rises only on a new locked reading.

## The camera settings

No Lua reads them (no CVar call in `FidelityEMatrix/`); the options shot is their witness (`OWNER-INPUT.md:9-19`). General knowledge; needs in-game verification. Smart following at 5.5 trails a turn, so yaw = facing (T:593) holds only at a dwell: the R_f gate, its settle time measured once (shots 0.5 and 2 s after a turn). Max distance at minimum: facing 4.09 and zoom 4.6 in every saved probe (R9:64, 218), so zoom is read, not fitted; P falls to pitch and fovY. Follow Terrain and Head Bob off: one pitch per pose. Smart Pivot has no term in `BuildCamera` (M:240-259): a residual's suspect. All nine enter the camera key: a change unlocks camera and position only.

## First step

`packages/triad-369/src/rung_lock.mjs` (proposed, pure): `baseKey`, `admit`, `ladderCoherence`, `facingResultant`; `tools/rung-lock.test.mjs` (proposed), fixtures from RESUME: (1) the eighth report's scenes (crate x1.39, barrel x0.6, trees' frames 0.8 wide) against v1.8.7 (T:274, `RESUME.md:7`): crate and trees unlocked, barrel locked; a version key unlocks all; (2) C = held / R, kind derived, partition named, lowered by a base change, never raised by 1,000 lapse steps (as `tools/light-being-kernel.test.mjs:110`); (3) 60 samples at 4.09 rad give R_f = 1, half at 4.59 gives 0.969 and fails the 10 px gate; (4) no index exported; (5) a 64-rung diamond evaluates each rung once; a root change re-marks only descendants. In game: the tenth report's scene records carry `base` and `dwell`.

## Closing table

| Item | A1 |
|---|---|
| Missing element | The lock: readings carry their bases' values; a change below unlocks those above |
| Adds | C over locked verdicts, the facing dwell gate; nothing else |
| Conceded | O1: two fields, not a node. O2: C counts a partition, not awareness. B2, O2: theirs is the context key; I split it by base. B8: the dwell refines his ask. |
| For the LEAD: | A rung holds only on a fresh, measured reading from a witness outside it, taken at a dwell and locked to the current values of the rungs beneath it, which hold; a change below unlocks only the rungs above it, and the ladder's coherence is the fraction so held, its partition named, never a phase or an awareness number. |
| Route: | Opus core and spec: ranks 1, 3, the first step. Flash WoW and in-game: ranks 2, 4, the settle-time shots, the tenth report. Argon blind red-team: must the key include the witness; the R_f threshold; any honest use of the index. The owner: may C be shown; settings held while calibrating. |
