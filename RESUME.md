# FIDELITY MULTIVERSE: RESUME & ENGINEERING HANDOFF

## The owner's terrain probe: the axis fix proven, the loader proven, the Model frame in question; v1.7.8 adds `/fide terrain test` (04 Nov 2026, 06:55Z, Claude in the cloud) — start here

**The probe (v1.7.7, the Abbey door):** `tile azeroth:32:48 FOUND, 9 tile(s) around | ground 89.1`; `15 drawable placements within 70 yd` with screen positions and heights for the six nearest; `models loaded 90, failed 0`, the last by its path. So the v1.7.5 axis fix is proven in the game, the map data is right, and `SetModel` with a path loads on this client. The status line's `props drawn 0` was taken after `/fide overlay off`, so it says nothing; with the overlay on, models loaded (the loads only happen then), were placed and shown, and the owner saw nothing. The headless harness cannot see inside a Model frame: it asserts the frame's size, anchor and `Show()`, not what the client renders in it.

**Landed as v1.7.8** (the addon only): every loaded model is settled at its origin (`SetPosition(0, 0, 0)`, facing 0, the file's camera 0 when it has one, scale 1; Classic has no `SetDefaultModelPosition`), and `/fide terrain test` draws one loaded prop alone at the screen centre, 40% of the screen tall, over a dimmed world, and prints what it did; `z <x>` moves the model toward or away from the frame's camera, `cam <n|off>` picks or drops the file's camera, `scale <s>` scales it; `off` restores. Nothing else moves while the test is on. Headless: the test shows exactly one prop at the centre, the knobs reach the model, off restores the layout (64/64).

**The owner's next paste:** `/fide terrain on`, then `/fide terrain status` (it must now say `props drawn N` with N above 0), then `/fide terrain test` and a screenshot. If nothing shows at the centre over the dimmed world: `/fide terrain test z 2`, `z -2`, `cam off`, `scale 0.2`, a screenshot of the first one that shows anything, then `/fide terrain test off`. That tells us the frame's view, and the next version places every prop accordingly.

**Evidence (06:55Z, Linux, Node 22):** `npm test`: `# tests 181 # pass 180 # fail 0 # skipped 1`; headless 64/64; math 14/14; kernel 6/6.

## News back from the game: v1.7.7 seen, round 4 `used`, the terrain still not drawn (04 Nov 2026, 06:47Z, Claude in the cloud) — start here

**The owner's three screenshots (v1.7.7 on TBC Anniversary, 7:41 to 7:42 local), read against round 4's check list:** the login line says `v1.7.7` and `eye hand:cursor (no head measured)` (check 1); `/fide cells` prints `label 0.50 age 0.1s of 2s measured -> open` for seven units and `label 1.00 ... symbolic` for the player, with the header that the label is the band's constant (check 2); clicks on unbound cells print `Clicked cell 82: no source` and `Clicked cell 112: no source`, the top row's cells 2 to 8 stand open as lenses and the rest closed, and `/fide overlay off` releases the slots so every cell closes (check 3 in part). Round 4 is `used` (`docs/council/2026-11-04-can/LANDED.md`). Not yet seen: a click on an open bound cell, the half-second held press, `/fide status`.

**Still open on the owner's screen:** the terrain overlay is ON with 9 tiles and 5027 placements loaded and draws nothing the owner can see, so the v1.7.5 axis fix is not yet proven; the owner ran the probe and has its output, which is the next paste (`tile azeroth:32:48 FOUND`, the placements within range, the models loaded or failed). The HUD still reads `Coherence: 99%` with the literal S: H008 has not run. The Triad bridge in this session died with a worker restart and was restarted at 06:46Z.

## Council round 2026-11-04-operator: Argon's operator T(W, g, s) answered in Shape B, the Light Being kernel, v1.7.7 (04 Nov 2026, 06:26Z, Claude in the cloud) — start here

**The input.** The owner pasted Argon's steering vector at 06:07Z (its header had arrived alone at 06:02Z): the Triadic Dynamical Operator T(W, g, s) over the Four Floats, four engineering deliverables (a cartridge schema, truthful wiring on both hosts, a glasses-free comfort contract, five invariants for `stepLightBeingLattice` as `node:test`), and the Shape B return format. Verbatim in `docs/council/2026-11-04-operator/ARGON-INPUT.md`; relayed through the Triad router unchanged. Argon's mode (a non-coercive prior; no clamping of a genuine engineering objection; rulings flagged for the owner) was applied as written.

**The round.** Six haiku voices (B1 the kernel, B2 truthful wiring, B3 the comfort contract; O1 no gradient exists, O2 the named hosts are not here, O3 a second definition), every claim re-checked against the code. `STEER.md` is the Shape B return: **REPORT** (the contract the six sign, and nine verified push-backs), **LEAD** (the schematic and a canonical definition for the owner's sign-off, with the struck clauses listed by voice), **INSIGHTS TO ROUTE** (Opus, Flash, Argon).

**What the council found, verified:** no weight block, loss, gradient, precision or E_psi exists on either host, so `Lx = tanh(alpha ||g||)` and `Aq` have no input and the vector adds five constants against its own zero-new-floats rule; the Four Floats are seeds and clocks with three formulas per name (`Vtx` is a sine of the tick; `Aq` is gated by defaults of 12/13 and a literal `passed: true`); the aperture opens on a band label, and "flux plus resonance" would close the seven cells the owner saw open; nothing anneals (the wave settles where it is sent); `CalculateFlipProgress` returned NaN for a NaN age; `apps/universe`, `bridge/roster`, `sq-jepa`, `@hm/shorthand` and `hm:universe:v2` are absent (the cartridge is one literal whose CRC32 matches none of four framings), the client is 2.5.6 not Retail; the comfort dial is partial, the lean gain reaches 1.6, and no colour, Pulfrich, frame-time or flicker term exists in the code; "1 cell = 1 holon" fails at the index.

**What the code already has, which all six sign:** the ring metric is Argon's term for term (1, 8, 16, 110 from (8, 5)); R is fixed at birth; u is a clock in seconds; the zero plane holds by arithmetic; the registry's gate (fresh within its window, measured, label at least 0.5) is the honest aperture.

**Landed as v1.7.7:** `packages/triad-369/src/light_being_kernel.mjs`, the kernel as pure math (`makeLattice`, `strike`, `stepLightBeingLattice`, `relaxation`, the mirrored metric, flip clock, rotation hash, parallax and stereo pair; the steering clamped and recorded, driving nothing; the Four Floats as labelled evidence, never readings; non-finite input rejected and reported), with `tools/light-being-kernel.test.mjs` asserting the five invariants against the real Lua through fengari (3 without KL, 4 as V non-increasing); the flip clock's NaN guard in `EMatrix_Math.lua` (the only addon change; test 7 of the math suite); `four_floats_kind` on everything the density bridge writes (the Apex's own label), tested.

**Evidence (06:25Z, Linux, Node 22):** `npm test`: `# tests 179` / `# pass 178` / `# fail 0` / `# skipped 1`; kernel 6/6; math 14/14; headless 62/62; `node tools/council.mjs check --all`: loop healthy, rounds `operator`, `can` and `entity` open on pending landings.

**Waiting for the owner:** sign, change or reject the LEAD's definition in `STEER.md`, and the three rulings inside it (one writer per Four Float; the comfort defaults: spin 0, the lean gain capped at 1.0, the reticle on the shared pair formula; whether 0.5 is the stated threshold or each source states its own). The in-game check is round 4's list, unchanged (v1.7.7 differs from v1.7.6 only by the guard). For Argon: the red-team items routed in STEER (the reworded invariants, the threshold on a label, the three formulas per float, the CRC framing, `time()` on 2.5.6, the self-stamp kind).

## Council round 2026-11-04-can: what the bound entity can do, v1.7.6 (04 Nov 2026, 06:05Z, Claude in the cloud) — start here

**The round.** Round 3's next ASK, run as six haiku voices under `docs/council/2026-11-04-can/` (B1 the holon on the tiles through a generated file, B2 the eye as a source, B3 the click as an event; O1 what the eight sources add, O2 a file is a snapshot, O3 the click cannot act and the cursor is not an eye). Every claim used was re-checked against the code; `STEER.md` is the ruling, `LANDED.md` is pending the owner's pastes.

**The answer.** Today the entity shows one bit per cell from eight unit sources (`near` and `mid` open; `far`, `not_measured`, the symbolic player and "no source" all close), re-measured four times a second; it names its sources in text; it runs a wave from a click. The number beside a source (`1.00`, `0.50`, `0.20`) is the band's constant, a label, not a reading: the reading is the range check's yes or no. It cannot yet show a flow of the holon (no channel reaches a cell between reloads), a head (the pad carries no age; the tracker has never run in the game, H006) or act on a unit (no targeting call exists; in combat the client forbids it as far as general knowledge goes). The click is an input the entity names, not an event it emits.

**The three bridges, ruled (owner's calls marked in STEER):** the flows may reach free cells only as a snapshot "as of the last `/reload`" that ages on a wall clock inside each flow's own 180 s window, after `time()` is verified on the client and the owner names the writer (the Apex into the live AddOns `Data` folder, not the repo) and signs the mapping; the head is the first source not on screen and needs an age first (B2's pad heartbeat, after H006); the click may target out of combat, opt-in, after identity is checked at click time, and a raid mark is the owner's call.

**Six defects the council found in the code, verified and fixed as v1.7.6:** (1) `CellFresh` had no lower bound, so a wall-clock stamp would have read fresh for ever (B1); (2) one 2 s window for every source, so no source could state its own (B1, O2); (3) `CheckIdleCondition` counted the overlays but not the bindings, so with spin, parallax and the overlays off a stale bound cell would have stayed open (B3, O2); (4) the login line printed the configured eye source, not the one in use, and called the pointer an eye (B2, O3): now `eye hand:cursor (no head measured)`, `pad (head; age not measured)` or `none (parallax off)`; (5) a depth left by a pad that stopped answering kept driving `EyeGain()` while the hand drove the eye (B2, O3); (6) the click was wired to both mouse scripts, so a held press ran two cancelling waves, and a click off the grid started a wave from an invented origin (O3, B3, O2). Plus: `/fide cells` prints `label` and the window instead of `value`; with the gate on a click prints `Clicked cell N: <source> label L age A of Ws <kind>, open|closed` or `no source`; `Math.CellAt` resolves the cell through the frame's scale (tested at 1 and 1.25).

**Evidence (06:04Z, Linux, Node 22):** `npm test`: `# tests 173` / `# pass 172` / `# fail 0` / `# skipped 1`; headless 62/62 (both SetLight profiles); math 13/13; `node tools/council.mjs check --all`: loop healthy, rounds `can` and `entity` open on pending landings.

**The owner's checks on v1.7.6** (STEER §"The check that settles it"): the login line says `v1.7.6` and `eye hand:cursor (no head measured)`; `/fide cells` lines read `label 1.00 age 0.0s of 2s measured`; with `/fide bind on` a click on an open cell prints its source line, a click on a closed unbound cell prints `no source`, a click on the rim starts no wave; a half-second held press runs one wave; `/fide status` ends `from hand:cursor (no head measured); configured cursor`. Still owed: the terrain probe on v1.7.5 or later (`tile azeroth:32:48 FOUND`), the FidelityWoW HUD after H008, H006, the word on the definition.

**Argon's steering vector** (the owner relayed it at 06:02Z; the Triad relay returned the text unchanged, keyword hint D7): only its header arrived (Source: owner framing plus Argon's translation; Mode: a non-coercive prior that steers toward technical closure, does not clamp genuine engineering objections, flags final rulings for the owner). Applied as written in this round's STEER. The body has not reached this session.

## News back from the game: v1.7.4 seen, the terrain's cause found, v1.7.5 (04 Nov 2026, 05:45Z, Claude in the cloud) — start here

**The owner's four screenshots (v1.7.4 on TBC Anniversary, 6:31 to 6:37 local), read against the three steers:**
- **Round 3, the binding registry: `used`.** The login line counts sources; `/fide cells` lists eight with real kinds (the player `symbolic`, seven units `measured`: one `near 1.00`, six `mid 0.50`, all `age 0.0s`); with `/fide bind on` the box settles into exactly the bound state, cells 2 to 8 of the top row open, everything else closed, no glint.
- **Round 2's in-game checks:** the flip is visible (a frame catches cells mid-squash as the wave crosses); no diagonal stripes in the E wall; the closed tiles are lit from the upper left, the known defect. The definition still waits for the owner's word.
- **Round 1: `changed`.** The lattice break is in the game. The probe, pasted for the first time, found why the terrain draws nothing, and it was ours: `UnitPosition` was read west-east first, so the player at the Abbey door was looked up at tile `48:32` (`pos -97.6, -8763.0 ... MISSING, 0 tile(s) around, ground nil`); Northshire is `32:48`. The headless stub had copied the same wrong belief, so every test agreed with the mistake.

**Landed as v1.7.5:** `UnitPosition`'s first return is the north-south coordinate (the probe's numbers are now a test that must land on tile 32:48); the window's reticle, glass and walls stay off while the bound draw is on (they floated over the closed E wall); H005 gated on 1.7.5; **H008** added: the FidelityWoW addon (`packages/wow-syntropic`) is deployed separately from the EMatrix folder, which is why the HUD still read `Coherence: 99%`, so its seed labels and the false-teleport fix are not in the game yet.

**The next terrain check:** on v1.7.5, `/fide terrain probe` at the Abbey door must say `tile azeroth:32:48 FOUND` with a ground height near 80 and placements listed; then `/fide terrain status` says how many props drew and how many models loaded or failed.

## Council round 2026-11-04-bridges: vector steering and bridge checks, v1.7.4 (04 Nov 2026, 05:01Z, Claude in the cloud)

**The owner:** "now that you know what it is you can do a round of vector steering and bridge checks." Six haiku voices in `docs/council/2026-11-04-bridges/` (B1 binding architect, B2 channel builder, B3 vector steering; O1 the WoW inputs, O2 the holon's flows, O3 the chain to the owner); the steer is `STEER.md` there, the landing `LANDED.md` (pending the owner's pastes).

**Bridge checks, verified and fixed where ours:** the HUD printed literals as readings (now `seed` / `not measured`, with the two real writers flagged `measured`); the kinematics flagged a false teleport from (0, 0) whenever the map gave no position (fixed); the density bridge read Sol's timer-written `up: true` with no age check (now `solIsUp`, 180 s floor, tested) and wrote a constant `synchronized` (now derived, tested); H005 pointed the laptop at a v1.6.1 branch whose gate would have blocked (now this branch, v1.7.4 gate, one checkout, the report carries commit and toc). Open and the owner's: run H005 and paste; H007; the legacy `bridge/loop` restart (T1).

**Landed, v1.7.4: the binding registry.** The definition's switch: `ns.BindCell(index, source, value, at, kind)` with the evidence kinds `measured | symbolic | not_measured`, freshness 2 s on `GetTime()`; the world overlay publishes its eight actor slots as `actor:<token>:<band>` (near 1.0, mid 0.5, far 0.2; `measured` when the range check answered, `not_measured` when not, `symbolic` for the player); `/fide cells` lists them; the login line counts cells with a source; `/fide bind on|off` is the gate, off by default, so nothing on screen changes until the owner turns it on (on: a bound cell opens when fresh, measured and at least 0.5, every other cell stays closed with no glint). Headless tests for all of it (58/58).

**Evidence (04:59Z):** `npm test` 169 tests, 168 pass, 0 fail, 1 skipped; math 12/12; both FidelityWoW copies identical; `node tools/council.mjs check --all`: three rounds open on pending landings, loop healthy.

**What closes this round:** Flash runs the retargeted H005; the owner pastes the login line (`cells with a source N of 135`), `/fide cells` with a few mobs around, then `/fide box show`, `/fide bind on`, a click (the slot cells follow the mobs, the rest closed, no glint), `/fide bind off`; the HUD's `seed` labels; `/fidelity audit` after a zone crossing. Then the next ASK, "what the bound entity can do".

## Council round 2026-11-04-entity: what the Weight-and-Gradient Entity is, v1.7.3 (04 Nov 2026, 04:40Z, Claude in the cloud)

**The owner:** "mobs now have textures, animation and terrain bridges still broken, Flash says put on 3D glasses; we have to first get the council to tell us what they are; Argon got us started; set up a council so we have a POV of what it is, then we can explore what it can do." Argon's proposal (the "Hilbert Holon") is `docs/council/2026-11-04-entity/ARGON-INPUT.md`, verbatim.

**The round:** five viewpoints as Argon named them (Architect, Somatic and Comfort Guardian, Simicist and Physics, Artist and Lens, Host-Bridge Engineer) and three opposers (a lens never lies; glasses-free 3D; the Hilbert story and the fifth metric), all haiku, one file each, in `docs/council/2026-11-04-entity/`. The Council Synthesis (Shape B) is `STEER.md` there: where they agreed and clashed, the recommended canonical definition **flagged for the owner's sign-off before it enters `PLAN_FRACTAL.md` (HeavyMetal2, not in this checkout)**, and the Wave-1 split across Opus, Argon, Flash and Codex.

**What all eight agreed, each verified by the director:** no cell is bound to any measured number (a click, a clock, a fixed hash); the rainbow and the gold are baked textures; the WoW HUD's `S=(0.20, 0.50, 0.95, 0.20)`, coherence 0.99 and strain 0.00 J are literals nothing writes; an order-2 Hilbert curve is a U of U's and the E is a hand-drawn letter (kept: four true rotations, the exact 1 then 8 cascade, Euclidean from ring 3); the gate `u` is a clock, not a function of `Lx` and `Aq`, so the proposal's own table breaks the Four-Float rule; no frame alternation exists or can be a setting, so continuous parallax is the only honest default; the restorative dual is a toggle; portability cannot be settled here.

**Two findings landed as v1.7.3:** a cell's flip had lasted 16 ms, one frame, because the clock divided cells by seconds (B2), so the squash animation was never visible; now `flipDuration` is seconds after the front arrives. And fengari's integers are 32-bit (B3), so the v1.7.2 hash test had checked wrapped numbers, not the game's doubles; the hash now computes in doubles on both sides and the test asserts the game's 33/33/33/36. Also verified and queued (not landed): the closed E tiles are lit from the upper left while the lens, housing and walls say upper right (B4); the fix is an atlas of four pre-lit orientations, not a sign flip, because closed cells rotate.

**Evidence (04:38Z):** `npm test` 165 tests, 164 pass, 0 fail, 1 skipped; math 12/12; headless 56/56; `node tools/council.mjs check --all`: both rounds open on a pending landing, loop healthy.

**What closes this round:** the owner's word on the definition (`STEER.md` §2), Flash's deploy of v1.7.3 with the pastes in `STEER.md` §"The check that settles it" (the box after the flip fix: each cell squashes and flashes as the wave passes), and Argon's rewrite or argument. Then the next ASK, "what the bound entity can do".

## Council round 2026-11-04: the compassion loop as councils, v1.7.2 (04 Nov 2026, 04:25Z, Claude in the cloud)

**The owner (04 Nov):** "improve the fidelity even more with fractals; an algorithm so the textures do not repeat is the easy example; set up a haiku council to explore the bridges we can build, and an opposing council who explore the ones we have built, then steer your vector." Then: "the councils keep the loop healthy; this should be built into the fractals; this is the compassion loop."

**Built in.** The loop now runs as councils at any scale: `.agents/skills/compassion-loop/SKILL.md` (ASK, builders; DECISION, opposers; CHANGE, the steer; NEWS BACK, the landing), `node tools/council.mjs new|check` (scaffolds a round, reports a round's and the loop's health), rounds under `docs/council/<date>-<slug>/`, and a pointer in `AGENTS.md`. The first round is `docs/council/2026-11-04/`: six haiku voices (B1 fractal fidelity, B2 data bridges, B3 perception; O1 overlays, O2 holon, O3 toolchain), `STEER.md` and `LANDED.md`.

**What the round found, verified by the director against the code:** the first repeat was in the code, `GetCellRotation` was `(c - r) mod 4` in disguise, so the 135 E cells formed one diagonal lattice (B1); a copy over a world that keeps drawing its twin reads as a double image once it moves, about 33/20/8 px at the defaults (B3, O1); the camera is constants (O1); the stub answered yes to every unknown method, so guarded branches ran paths the client never takes (O1, O3); the laptop's `triad.bat` runs the legacy `bridge/loop` copy with hard-coded "resonant", "latency 42" and "passed: true", and an unauthenticated localhost POST can set off `git push origin main` through `arena_git_sync.mjs` (O2); the hands redaction let Bearer, `sk-proj-` and AWS keys through and the guard missed pushes aimed at main (O2); a check in the newest test code could not fail (O3).

**Landed (v1.7.2):** the mixing hash with the lens cells pinned to identity texcoords (one sun over the array), tested on the real Lua in both harnesses; the strict widget stub (`KNOWN`, `ABSENT`, raise otherwise) with the always-true check, the zero-GC regex and the "decimetres" label fixed; the redaction and the push-to-main guard; H007 (a read-only inventory of the laptop's daemons) in the hands snapshot. Evidence at 04:25Z: `npm test` 165 tests, 164 pass, 0 fail, 1 skipped (the real-tile ADT test, `EMATRIX_TILES` unset; not the Windows serve test as an earlier note here said); headless 56/56 under the strict stub; math 12/12; head tracker 10/10.

**The vector** (`docs/council/2026-11-04/STEER.md`): fractal fidelity pays inside the window (B1's list, in order); the overlays stay honest portraits with no default change until the owner runs B3's protocol; real depth must come from the rendering path, which is the next round's ASK; the holon is made honest in O2's order (H007 first); the toolchain gets a fengari-driven ring/flip test, a Lua 5.1 run and `/fide selftest`. **Forbidden until verified:** overlay default changes, any "synced", "parallax works" or "3D" claim, merging to main by hand, quoting "resonant" or 0.99 as a measurement.

**What closes the round:** deploy v1.7.2 with the four commands below, paste the login line and the probes, run P0 to P6 from `B3-perception.md`, and look at the box: no diagonal stripes of one orientation in the E wall, every open lens lit from the upper right. `node tools/council.mjs check --all` says the loop is healthy while this round is younger than seven days; `LANDED.md` turns from `pending` to `used`, `changed` or `nofit` on the owner's word.

## EMatrix v1.7.1: the first in-game evidence and the response (04 Nov 2026, 03:52Z, Claude in the cloud)

**The evidence.** The owner's screenshot of v1.6.1 on the TBC Anniversary client (Northshire, 04 Nov): the login line printed "full-screen depth scene ON"; white, untextured copies of the kobolds hung under their nameplates at three to four times the size of the real units (which are about 35 px tall at that range), each with a hollow hexagon beside it; no copy of the player at the bottom centre; no terrain props at all; no visible parallax. The owner's words: "not synced up, only mobs render an untextured version of themselves, no parallax or 3d effect yet".

**The diagnosis, from the code.** (1) The copies were `DressUpModel` frames fed NPC units; the box's `DressUpModel` of the player was textured, so the frame type's handling of creatures is the prime suspect. `PlayerModel` is what unit-frame addons use for 3D portraits of any unit. The hexagon is probably an untextured attachment (the pick) drawn without its skin: a hypothesis. (2) The band heights were fixed pixels (95 to 230 UI units), not a camera model, so far units were drawn huge. (3) The copies' parallax gain was 60 px per unit of eye, about 16 px at full lean. (4) Why the player copy and the terrain props are missing is not visible in the picture; v1.7.0's login line and `/fide terrain probe` say.

**What v1.7.1 changes** (`EMatrix_World.lua`, `EMatrix_Core.lua`): copies are `PlayerModel` frames, with `/fide world frame <player|dressup>` to compare in the game (it rebuilds the pool and `/fide world status` names the type that took); each copy is parented to its nameplate, so the client scales and hides it with the plate; heights come from the camera model the terrain uses, `focal * unitHeight / (zoom + bandDepth)` with band depths 7, 18 and 45 yd and `focal * 2 / zoom` for the player, so at 1080p and zoom 10 a far copy is about 32 px, a mid one 64, a near one 105, the player 198; `/fide world height <yd>` (1.8) and `/fide world parallax <px>` (120, was 60) tune them; the status line prints each copy's height, the focal length and the zoom. Headless 54/54; `npm test` 159 tests, 158 pass, 1 skipped.

**Deploy from the laptop now** (no need to wait for the PR; `D:\fidelity-repo` is on `flash/wow-ematrix-polish` or `claude/ematrix-depth`):
```powershell
git -C D:\fidelity-repo fetch origin
git -C D:\fidelity-repo checkout francois/serene-euler-51wj3e
Rename-Item "D:\World of Warcraft\_anniversary_\Interface\AddOns\FidelityEMatrix" "FidelityEMatrix.bak-$(Get-Date -Format yyyyMMdd-HHmm)"
robocopy D:\fidelity-repo\FidelityEMatrix "D:\World of Warcraft\_anniversary_\Interface\AddOns\FidelityEMatrix" /E
```
Then `/reload` and paste, in this order: the login line; `/fide diag` (the SetLight form line); `/fide world status`; `/fide terrain probe`; `/fide terrain status`; `/fide status`. Then try `/fide world frame dressup` and back to `player`, and say which one is textured. Move the mouse to the screen edge: the copies should leave their units, far ones more than near ones; with the defaults (eye capped at `parallaxStrength` 0.5, gain 120 px) the arithmetic gives about 33 px far, 20 px mid, 8 px near (council B3 corrected an earlier "up to 60 px" here); `/fide world parallax 240` doubles that. If the copies are still the wrong size, `/fide world height 1.2` (kobolds) or `3`.

## EMatrix v1.7.0: the review fixes (03 Nov 2026, Claude in the cloud)

**Branch:** `francois/serene-euler-51wj3e`, a fast-forward of `claude/ematrix-depth` `7265578` plus these commits; draft PR into `claude/ematrix-depth`, which is what the laptop deploys (H005). **Not verified in the game**: everything below is proven headless only. The findings come from [`docs/EMATRIX-REVIEW-STATE.md`](docs/EMATRIX-REVIEW-STATE.md) (four of six hostile reviews); each one was checked against the code before it was fixed, and each fix has a test.

**Evidence (20:24Z, this container, Linux, Node 22):** `npm test` 157 tests, 156 pass, 0 fail, 1 skipped (the Windows-only serve shutdown). Of those: the headless Lua (fengari) 52/52 (26 checks per SetLight profile, up from 19), `tools/ematrix-toc.test.mjs` 4/4 (new), the hands sync 17/17 (was 8), `upsert_task` 4/4 (new). Outside `npm test`: `node tools/test_ematrix_math.mjs` 12/12 (its "idle OnUpdate" check still looked for the detach on the box frame, which v1.5.0 moved to the driver frame; **H005 on v1.6.1 would have failed at that step**), `python3 -m unittest tools/headtrack/test_headmath.py` 10/10 (was 5).

### What changed, by file
- **`EMatrix_Terrain.lua`**: a model that fails to load frees its slot, hides the old picture and is retried after 8 s (TR1, TR5); view culling runs before the nearest-24 cut, so props behind the camera, off-screen or too small never take a slot (TR4); the 3x3 tiles around the player are scanned, so placements just across a tile border draw (TR6); buildings (WMOs) are counted and reported, never sent to a Model frame (TR7); the nearest prop gets the highest frame level (TR8); a prop's height is capped at two screen heights and nothing nearer than 1 yd down the view axis is drawn (TR10); the dead `/fide terrain head` knob, `autopitch` and every "nameplate solve" claim are gone, the saved pitch is the pitch (TR9, OX6); `Family()` is `unsupported` outside 1.x/2.x and then draws nothing rather than another family's placements (OX23); repeated errors **suspend** the overlay without writing the saved choice (`/fide terrain on` retries, status says SUSPENDED).
- **`EMatrix_World.lua`**: copies face the camera and turn with the eye only, never with the window's turntable (WO1); out-of-range answers of `nil` count as far (WO3); the same suspend-without-saving on errors (WO6); a band change must be seen on two consecutive scans (WO7); a copy whose `SetUnit` fails is hidden and holds no slot (WO9); a unit keeps its slot while it stays among the nearest, and anchors are re-set only when something changed (WO11); `CenterInUI` deleted (WO13).
- **`EMatrix_Core.lua`** (v1.7.0): the login line is built from runtime state inside a pcall (which overlays really came up, the actor count, the map data's tiles/placements/buildings, the box, the eye source) and a failed start prints one addon line (OX4); a typo in `/fide stereo|box|overlay` prints usage and changes nothing, an unknown command is one line (OX8); `/fide help` is six lines, `/fide help all` is the full list (OX14, OX15); a migration only records its version and fills missing keys, it never overrides a saved choice (OX24); the head tracker's depth now reaches every renderer as a parallax gain (`ns.EyeGain`, 1 + 0.6·z, clamped 0.4..1.8) used by the window, the world and the terrain overlays (HT2); `/fide eye inverty` (HT10); `/fide eye probe` states each step of the pad read and why it returned nil (HT9).
- **Manifests** (OX21): `FidelityEMatrix_Vanilla.toc` (1.x) and `FidelityEMatrix_TBC.toc` (2.x) load only their own family's map data, 1.2 MB of Lua less; `FidelityEMatrix.toc` stays as the fallback with both. If a client ignores family manifests it just loads both, as before.
- **`tools/headtrack/`**: the left trigger carries only "closer" depth and rests at 0 (HT1); the left-stick mapping is gone, it walked the character (HT4); a failed `head.json` write is counted, warned once, and never stops the pad feed (HT5); the rest pose (face centre and width) is calibrated and subtracted, so a lost face settles at rest, not at a lean (HT6); the face nearest to last frame's is followed, so a second face cannot hijack the eye (HT7); a frames directory distinguishes "no new frame" (keep the last axes, feed the pad) from "no face", skips files still being written, and drifts to rest after `--stale-seconds` (HT15).
- **`bridge/hands/`**: push failures are logged once per kind, and a heartbeat file `laptop_heartbeat.json` is pushed on the first cycle and every `--heartbeat` seconds (300) (OX11); secrets in the results are masked before the push, PEM blocks, known token prefixes and `name = value` pairs, with the local file untouched (OX12); the rules forbid `reset`, `clean`, `checkout -f`, `restore`, `stash drop`, `push --force`, `branch -D` and any `pull`/`merge` without `--ff-only`, and the sync logs any task step that contains one (OX13); a key restriction for Node 2 is written up as a proposal with the gate script, not applied (OX10). `bridge/hands/upsert_task.mjs` writes a task into the task file from a JSON file (the heredoc hazard, closed by a tool).
- **Snapshot `bridge/hands/laptop_tasks.json`**: H005 rewritten for v1.7.0 (version gate, the 15 expected files, the check list for the hidden box, OX3). The live copy on Node 2 is still the v1.6.1 task until Claude on Node 2 upserts this one.

### Deploy order
1. Merge the draft PR into `claude/ematrix-depth` (the owner, or Claude on Node 2).
2. On Node 2: `node bridge/hands/upsert_task.mjs bridge/hands/laptop_tasks.json --task H005 --file F:\fidelity-llm\bridge\hands\laptop_tasks.json --now` (copies H005 from the snapshot into the live file with a fresh `requested_at`).
3. Flash runs H005; the owner pastes the login line and the probe.

### Check in the game (owner, after `/reload`; the box is hidden by default now)
1. The login line: it names both overlays' real state, the actor count, the map data (`tbc, 9 tile(s), ... placements, ... buildings`), the box and the eye source. If it says `failed to start`, paste it.
2. `/fide terrain probe` at the Northshire Abbey door: expect tile `azeroth:32:48`, "N drawable placements within 70 yd (M buildings not drawn)", six placements with screen positions and heights, and "models loaded X, failed Y". If `failed` grows, `/fide terrain loader id` and `/reload`.
3. Look at a tree: its copy should stand on it and the nearest copies should draw over the farther ones. If copies float or sink, `/fide terrain pitch <deg>` (there is no nameplate solve; the pitch is yours to tune). Walk toward a tile border (the probe says "k tile(s) around"): trees across it should appear.
4. `/fide world status`: actors with their bands. Walk toward an NPC: its copy should grow from far to mid to near without flickering at the edges, and never spin on its own.
5. `/fide help` (six lines), `/fide stereo bogus` (usage only, nothing changes), `/fide status` (the Eye line shows the parallax gain).
6. Window checks: `/fide box show`, click it open, cursor right (character slides right and turns, reticle slides left, left wall widens), `/fide stereo anaglyph` with the glasses, `/fide stereo off`, `/fide box hide`.
7. Head tracking (after H006): `/fide eye probe` shows "read: ok" and the trigger axis at 0 when sitting normally; lean in and the Eye line's parallax gain rises above 1.

### Still open
- The two reviews that were still running at the cut-off (performance and memory; the C1–C15 crawl): their reports land in the Node 2 session's tasks folder, not here. Findings outside the lead's agreed list (the rest of HT1–19, OX1–24, TR1–13, WO1–13) are not addressed.
- Nothing is verified in the game beyond v1.6.1's "the box renders the character, nameplates cannot be measured". The two signs (`/fide calibrate side|turn`), the pitch, the yaw convention of placements and the per-family manifest pickup are in-game checks.
- `package-lock.json` is now committed (lockfile v3, 86 packages, `fengari 0.1.4`), so `npm ci` on the laptop installs exactly what the headless tests ran against here.

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

### v1.6.0: webcam head tracking through a virtual gamepad
An addon cannot read a camera, but `C_GamePad.GetDeviceMappedState` is listed for Forever 1.60, Classic Era 1.15 and TBC 2.5. `tools/headtrack/headtrack.py` (OpenCV's bundled Haar face cascade, no model download) turns the face position and size into left/right, up/down and distance, feeds a ViGEm virtual Xbox pad (right stick + left trigger by default) and writes `head.json` for the other daemons; it reads the camera directly, or a frame folder or MJPEG stream when a daemon owns the camera, or a synthetic face for tests. The addon's `/fide eye` commands read the pad (`source gamepad`, `stick`, `depth`, `gain`, `invert`, `calibrate`, `probe`, `setup`) and fall back to the cursor when no pad answers. Proven on Node 2 (which has the ViGEm driver but no camera): three fed stick/trigger values read back exactly through XInput, synthetic run 28 fps, headless 44/44. Laptop setup is hands task H006; the ViGEmBus driver install is the owner's (administrator). Unverified: the Classic client's stick/axis order (`/fide eye probe` shows it) and whether `GamePadCameraYawSpeed`/`PitchSpeed` exist there (else `--map triggers`).
### v1.5.1: verified model loading, probe, idle animation (owner: "with overlay on it is just the character, not animating")
Diagnosis so far: "not animating" is the v1.4.2 frozen-eye bug (fixed in v1.5.0, driver frame). "Just the character" means the terrain overlay drew nothing. Cleared: the data file is far under Lua 5.1's 262,143-constants-per-function cap (19k unique). Prime suspect: `Model:SetModel(fileDataID)` succeeding without loading on the Classic client, which left empty frames. Now the loader tries the path first, checks every attempt with `GetModelFileID`, falls back to the id and `.mdx`, and counts successes and failures; `/fide terrain loader id` flips the order. `/fide terrain probe` prints position, tile, ground, camera, the first six placements with screen positions and sizes, and the load counters. Copied units and props start their idle animation (`SetAnimation(0)`). Still unverified in the game: which loader form works, the facing/pitch conventions.
### v1.5.0: the full-screen scene is the default; the box is a side show
Owner feedback on v1.4.2 (screenshot): the box now shows the character, but the owner expected the whole screen covered by the re-rendered scene with parallax, not a window. Changes: world and terrain overlays are ON at login for everyone (old saves migrated once via `configVersion`), the box starts hidden (`/fide box` shows it, `/fide overlay off` stops the scene), and the eye/motion driver moved to its own always-shown frame `FidelityEMatrixDriver`: with the box hidden a hidden frame gets no OnUpdate in the client, so in v1.4.2 the overlays' eye would have frozen the moment the box was hidden. The eye is measured from the screen centre when the box is hidden. Honest limit, unchanged: the ground surface is the real game's; the overlay re-renders units, trees, props and buildings over it with depth parallax.
### v1.4.2: one switch for the full-screen scene; diagnostics for the missing box model
Owner feedback on v1.4.1 (screenshot, Northshire): the box opened with the lens grid, reticle and sheen, so the new build was running, but it showed **no character model**, and the owner expected a full-screen overlay rather than the box. Changes: `/fide overlay on` (alias `/fide full`) turns the world and terrain overlays on together and hides the box (`/fide overlay off` restores it; the box state is saved); the login line now says so. `/fide status` prints a Scene line per model frame (shown/hidden, alpha, size, unit, last SetPosition, frame level) and the light form, which is what is needed to find the missing model; nothing in the screenshot distinguishes a hidden frame from a black one. Nameplate centres are now converted into UIParent coordinates (`World.CenterInUI`), which matters when the UI scale is not 1.
### v1.4.1: ready for WoW Forever as well as TBC (two data sets, picked by client)
The map data is now generated per **client family** and the addon picks at load from its interface number: 1.x clients (WoW Forever `wowf`, Classic Era) use `Data\EMatrix_Data_Azeroth_vanilla.lua`, generated from Forever build **1.60.1.70753**; 2.x clients use `Data\EMatrix_Data_Azeroth_tbc.lua` from **2.5.6.70577**. Why two: compared tile by tile, Forever has the same Northshire terrain bar 25 of 16,641 vertices (largest change 3.1 yd) and the same placements, but 100 of them reference a new tree model id, and 2 buildings changed reference; the Forever tiles also carry a vertex-colour block the converter ignores. `/fide terrain status` prints which family and build the data came from.
Regenerate for any build with two commands (the listfile is github.com/wowdev/wow-listfile, `community-listfile.csv`): `npm run ematrix:fetch -- --version <build> --listfile <csv> --map azeroth --tiles 31_47,...,33_49 --out <cache dir>` then `npm run ematrix:mapdata -- --tiles <cache dir> --listfile <csv> --family vanilla --build <build> --product wowf --out FidelityEMatrix/Data/EMatrix_Data_Azeroth_vanilla.lua --tile 32_48 ...`. Builds are listed at wago.tools/api/builds; the newest `wowf` entry is the one to use at launch. Game tiles stay out of git.

Forever client path on the laptop: `D:\World of Warcraft\_forever_\Interface\AddOns\FidelityEMatrix\` (same files as the TBC install; the addon chooses the data itself).
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
