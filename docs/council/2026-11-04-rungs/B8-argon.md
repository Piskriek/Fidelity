# B8: Argon's frame and the compassion loop, translated

Framing, labelled: "Light Being", "density", D1 to D7, "awareness"; nothing here measures them (`.agents/skills/compassion-loop/SKILL.md:61`). `T` = `FidelityEMatrix/EMatrix_Terrain.lua`, `M` = `EMatrix_Math.lua`, `Rep` = `EMatrix_Report.lua`, `Core` = `EMatrix_Core.lua`, `R9` = `reports/20261104-1321/FidelityEMatrix.lua` (`origin/owner/reports`). "Proposed" names do not exist.

## Thesis

The owner's four-part node is the repo's own protocol: ASK, DECISION ("permit/decline with nearest"), CHANGE, NEWS BACK (`docs/TRIAD_369_SEED_BOOTSTRAP.md:25`). Input and output are the ask (the being predicts); test and measure, the permit, which "one side asks, the other permits" (`.agents/skills/compassion-loop/ARGON-RETURN-LOOP.md:5`) gives to someone other than the asker. In the running code nobody holds it. The packages' Triad: "Only ASK was received", DECISION and NEWS BACK `not_evaluated` (`packages/triad-369/src/triad_369_process.mjs:468-474`). The legacy Apex, whose CLI `triad.bat:2` launches, writes `PERMIT` and `landed: 'used'` as literals (`bridge/loop/triad_369_process.mjs:372-388`). Terrain rungs held only on outside permits (host lines, the owner's pictures); the being's own checks agreed with its beliefs: `visible true` (T:486), the axis stub (T:170-174), a headless check of the typed fits (`tools/ematrix_headless.lua:770`). Translated, "awareness rises with each density" is a count that can fall (the harness's awareness is a clock, `apps/fractal-engine/src/harness/SovereignHarness.ts:63-66`): rungs whose handshake closed on an outside permit. "Felt pain only goes down": no claim rises without a new permit.

**Missing element:** the permitting half of each rung's handshake (a DECISION written by a witness outside the rung, paired with the being's ask at the same instant, carried back as data) has no holder, so the being leaves it unevaluated or grants it to itself.

## The node per rung

```
ask      {rung, key, input, predicted, theta, at, asker}         the being writes
permit   {rung, key, observed, witness, artifact, at, context}   a witness writes
decision permit | decline (nearest held rung, next ask) | unmeasured | blocked   computed
news     used | changed | nofit                                  the next report
```

| Rung (rests on) | Input | Output | Test | Measure | Witness | Written back | In client |
|---|---|---|---|---|---|---|---|
| Map | game tiles | `Data/*.lua` | `tools/ematrix-mapdata.test.mjs` | `32:48 FOUND` (R9:1386) | host | data | yes |
| Axis (map) | `UnitPosition` (T:175) | north-south first (T:168-182) | own tile | MISSING (T:172), then FOUND (`RESUME.md:106`) | host (pasted), not the stub (`ematrix_headless.lua:186-191`) | the swap | yes |
| Load (map) | path, id (T:326-334) | model | file id > 0 (T:247-251), not "trust the call" (T:248) | 45 loaded, 0 failed (R9:1394) | host | `loadStats` (T:244) | yes |
| Frame kind (load) | `FRAME_ORDER` (T:202) | drawn model | not `IsVisible` (stub: shown flag, `ematrix_headless.lua:89`) | `reports/20261104-1024` shots | owner's picture | `FRAME_ORDER` | no |
| Fit per file (frame) | k (T:316-317) | red-frame fill (T:501-523) | fill 1 ± τ, two readings | fill by eye (`RESUME.md:5, 15`) | director; owner's `fit` (T:774-787) unused (R9:2-33) | `FIT_BY_FILE` (T:274) | no |
| Camera (axis) | facing, zoom (T:179-180); pitch, fovY saved (T:108) | predicted feet (M:240-272) | pixel residual ≤ τ | none (nameplates restricted, `EMatrix_World.lua:8-11`) | none yet | `terrainPitch`, `terrainFovY` (T:733-734), never saved | facing, zoom |
| Relative position (fit, camera) | placements, fits, camera | frames at feet (T:394-398) | owner's rule (`RESUME.md:17`) | scene shots by eye | director, owner | aspect, heights (T:34-45) | no |
| Return (all) | panel (Rep:55-68) | report, shots (Rep:83-103) | `ematrix_headless.lua:1240-1285` | manifest hashes (`bridge/hands/laptop_tasks.json:16`) | laptop | next version | file only |

## The loop back

Today: SavedVariables (`FidelityEMatrix_TBC.toc:6`), H009 (`laptop_tasks.json:8-19`), the director's eye, a retyped constant. Proposed: the **ask** in `FidelityEMatrix_Report.steps[i].ask`, written at the shutter (rank 1); the **permit**, a row per named placement or file with the shot's manifest hash, in a ledger (proposed `docs/rungs/ledger.json`); the **change**, a generated `Data/EMatrix_Rungs.lua` (proposed, generated like the map): permitted pitch, fovY and fits with stamp and witness, read by `Cfg` (T:110-115) and `CameraDistanceFor` (T:296-303) below the owner's saved values, which already come first (T:111, 298); the **news back**, the next report's asks at those values, marking each rung used, changed or nofit. Next time props stand at the permitted camera, `FitSource` (T:304-309) names witness and stamp, the panel asks only for the frontier.

## The camera settings

No Lua here reads or writes a setting (no CVar call); the options shot is their witness. Effects: general knowledge, needing in-game verification.
- **The owner's half, given.** Head Bob and Follow Terrain off leave pitch and look-at height where his hand puts them; minimum Max Camera Distance, zoom 4.6 (R9:1386): one operating point. The being never writes a setting to pass a fit (compassion-loop `SKILL.md:63`).
- **Context, not parameter.** Each camera permit carries the settings as its key; its window is an event (a setting changed, the camera moved), not the registry's seconds (Core:194-198).
- **Smart following, 5.5 speeds.** Yaw is taken as facing (T:179, 593), true once the camera settles behind the player; the pose can move in the 0.5 s before the shot (Rep:14): stamp the ask at the shutter.
- **Decline with nearest.** A declined camera leaves the fit standing (inside the frame, T:316-317): fill claims hold, placement claims are withdrawn. Smart Pivot has no term (M:240-259): a decline cause until a residual shows it.

## The algorithm

R rungs, E rests-on edges, P parameters per rung, A asks, M permits, N props.

```
closeLadder(now):
 1 Kahn's order; reject a cycle (rungs permitting each other)           O(R+E)
 2 admit p for r iff witness ∉ echoes(r) ∪ {asker(r)} ∪ desc(r),
   measured, in window, same context                                    O(R(R+E)) per graph, O(M)
 3 pair p with the ask of its (r, key) at the shutter                   O(A+M)
 4 each r once, in order: blocked if a base is unpermitted; unmeasured
   under P+1 pairs; else theta = Σ(fill/k)/Σ(1/k²) | bisection, 40
   steps (M:294) | Gauss-Newton, I steps; an owner value is final,
   else the median residual                                             O(M_r log M_r + I(M_r P² + P³))
   permit iff residual ≤ τ, else decline naming the nearest permitted base
 5 write theta, residual, witness, at, decision; re-settle changed
   props; k = |permitted| (framing: awareness); frontier                O(RP + N)
 6 new permit: rerun 4-5 on descendants; lapse (min-heap): downgrade
   only, so no claim rises without a new permit                         O(log M + |D| + E_D + fits of D)
```

**Total** O(R(R+E) + A + M log M + I(MP² + RP³) + N) per pass: fixed-degree terms; each rung decided once; each fit closed form or capped; nothing enumerated.

**Exponential, replaced.** The code has none (T:286-295, T:390, M:294). Traps: rung subsets (2^R): one pass, the permitted set being closed downward; every path below a rung (exponential on diamonds, general knowledge): memoized; pitch and fov "tuned until the copy stands on it" (T:11-14) and per-file sweeps (`RESUME.md:37, 51`), G^P presses: least squares or bisection, one reading per file; consensus over witness subsets (2^M): the owner's precedence, then the median; setting combinations: settings as a key, one varied when a residual asks.

## Ranked (visible payoff per hour)

1. **The ask at the shutter** (Flash, 1 h, low risk). *Evidence:* scene steps 1 and 7-9 save no pose or prediction (R9:1348-1357, 1480-1534; Rep:56, 62-64); stamps are wall-clock strings (Rep:20, 83, 101), the registry's `GetTime` (Core:158). *Step:* in `OnUpdate` (Rep:93-103), at `Screenshot()`, silently store `pendingRec.ask`: `GetTime()`, the pose (T:168-182), saved pitch and fovY, six predicted points via a proposed `Terrain.Predict(n)` reusing the probe's `Scan` and `ProjectPoint` (T:738-757). *Test* (`ematrix_headless.lua`, beside :1240): press step 8 at facing 0, set 1.2, step 0.6 s; the ask holds 1.2 and `ProjectPoint`'s points there; no chat line or frame changed. *Proof:* the tenth report's scene shots carry asks. The captured frame needs in-game verification.
2. **Honest rung labels** (Flash, 0.5 h, low risk). "Active Rung: D3" (`packages/wow-syntropic/UI.lua:83`), a literal (`packages/wow-syntropic/Core.lua:36, 101`), shows on the owner's screen (`WoWScrnShot_110426_132055.jpg`) without the `seed` its neighbours carry (`UI.lua:80-82`); the probe prints "pitch 20.1 deg, focal 781 px" unlabelled (T:749-750). *Step:* "seed", "saved, not measured"; headless word checks. *Proof:* the HUD reads `D3 (seed)`.
3. **The handshake evaluator**, the first step (Opus, 2 h, no deploy).
4. **Retire the self-written permit** (Opus, 0.5 h): the legacy `PERMIT` becomes `not_evaluated`, as in `triad_369_process.mjs:471-473`; which copy the laptop runs needs laptop verification. *Proof:* the CLI prints `not_evaluated`.
5. **The frontier panel** (2 h, after 3; risk: a wrong permit stops re-asking): `Report.STEPS` (Rep:55-68) from the frontier, so held rungs are not re-asked (step 2 re-runs eight checks, Rep:57), with owner-permit buttons. *Proof:* fewer presses per report.

**The trap, forbidden:** the asker writing its decision (a literal `PERMIT`; caller-declared kinds: `BindCell` keeps any valid kind, Core:168; `fileEvidence` says `measured` for a missing file, `packages/triad-369/src/evidence.mjs:23`); a claim rising by itself; securing the ladder against the owner (a decline that hides props, overwrites his saved fit or pitch, or writes a setting). Decisions are labels.

**Does not help:** a D-name node without a witness (`packages/triad-369/src/density_bridge.mjs:142`); an `IRungNode` that only updates (`apps/fractal-engine/src/rungs/RungTypes.ts:20-27`); graduation on its own coherence (`SovereignHarness.ts:139-147`); echo checks ("props drawn", T:577).

## First step

`packages/triad-369/src/rung_handshake.mjs` (proposed): `closeLadder(rungs, asks, permits, now)`, pure like the kernel (`light_being_kernel.mjs:1-3`), emitting the Triad's handshake per rung (`triad_369_process.mjs:469-474`). `tools/rung-handshake.test.mjs`, with the reports to the eighth as fixtures, asserts five invariants: (1) a cycle is rejected; (2) no self-permit: `visible true`, the stub and the typed-fit check leave their rungs unmeasured, the 1024 shots permit frame kind; (3) non-coercion: an ask never writes a decision, an owner value outranks every computed fit (as T:298); (4) claims rise only on a new permit: 1,000 lapse steps add no permitted rung (as `tools/light-being-kernel.test.mjs:110`); (5) zero plane: no decision changes an owner-visible value before his word (`docs/council/2026-11-04-operator/STEER.md:85`). Plus: fits match T:274 within 0.02 (2.0, 2.786, 0.596, 0.366, 0.417: my arithmetic, k × fill, `RESUME.md:5, 15, 37`); jar, crate, camera unmeasured, relative position blocked, camera the frontier; a 64-rung diamond ladder decides each rung once.

## Closing table

| Item | B8 |
|---|---|
| Missing element | The permitting half: an outside DECISION, paired with the ask, returned as data |
| Conceded | O1: no new measurement, only who writes which half. O2: permitted rungs, not awareness. O3: above load the owner permits; the director reading his own prediction is half a self-permit. |
| For the LEAD: | A rung is climbed only when a witness who is not its asker writes a fresh permit against an ask taken at the same instant while every rung beneath it holds; no claim rises without a new permit, and the owner's word outranks every computed value. |
| Route: | Opus core and spec: ranks 3, 4. Flash WoW and in-game: ranks 1, 2, 5, the tenth report. Argon blind red-team: is a director's reading the other side; echo sets; downgrade-only as "felt pain only goes down". The owner: who permits which rung; whether "awareness" names the count; settings held while calibrating. |
