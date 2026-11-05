# B2, channel builder: which channels can carry a source into a cell

Council round 2026-11-04-bridges, voice B2 (builder, ASK). Read-only on the code. HeavyMetal2 (hm:universe:v2, PLAN_FRACTAL.md) is not in this checkout, so nothing here touches it. Labels: "from the code" (file:line checked), "needs in-game verification" (client behaviour), "general knowledge" (rule of thumb).

**Thesis.** No channel today carries a live holon value into a WoW cell. The one in-client source the addon already reads is the game's own nameplate scan: it is named, it is a game read rather than a constant, and it refreshes every 0.25 s (from the code: `FidelityEMatrix/EMatrix_World.lua:29`, `:143-165`). That can open the eight actor slots now, with no cross-process channel. The six holon flows live outside the client. They can reach the addon only as a generated Lua file read at load or `/reload`, so their freshness is bounded by the owner's reload, and the generated file must carry its own timestamp. The other channels run the wrong way (SavedVariables), feed the eye and not cells (the head pad), or are agent turns (hands).

## Ranked list (visible payoff per hour, for the two first bindings)

**1. Eight actor slots from the nameplate scan (binding 1).**
- Claim: each actor slot can open on the game's own unit presence and range band, with no new channel.
- Evidence: `World.Scan` enumerates nameplate units and checks `UnitExists` (`EMatrix_World.lua:143-157`). `RangeBand` is a three-rung ladder from `CheckInteractDistance(unit, 3)` and `(unit, 4)` (`:131-141`). The header says these checks are "about 10 yd" and "about 28 yd" (`:11`). `MAX_ACTORS = 8` (`:28`), but the player is inserted as the first scan entry (`:162-163`) and counts toward `found` (`:253-254`). So the eight slots are the player plus at most seven nameplate units (from the code).
- Measured or not: presence is a game read. "far" is inferred from two false results (`:138-140`), not a distance. What the checks mean needs in-game verification on the TBC Anniversary client.
- Freshness: at most 0.25 s old; `GetTime()` is already read (`EMatrix_Core.lua:545`).
- Failure modes: plate positions are unreadable (`EMatrix_World.lua:8-9`); a pcall failure gives "unknown" (`:133-141`); a unit token can vanish between scans.
- Effort: low, a few hours (estimate). Risk: low for the channel, medium for honesty (the band is coarse).
- First concrete step: in the slot loop of `World.Layout` (`EMatrix_World.lua:254-280`), attach `{source = "nameplate_scan", kind = "measured", band, at = GetTime()}` to each slot; a slot whose unit token is gone draws "no source". Test: headless, under the strict stub (RESUME reports 56/56), a plate disappearing between two scans must read "no source". Proof in the game: the bound-slot count equals the nameplates in view (needs in-game verification).

**2. Six flows through a generated Lua file (binding 2).**
- Claim: the six flows can reach the addon as data the client reads when it loads the addon.
- Evidence: the flows are built at `packages/triad-369/src/triad_369_process.mjs:191-197` (F12, F21, F13, F31, F23, F32), each with an evidence object. Their freshness rules are at `:151-153` (30 s, 120 s), `:172` (180 s), `:184` (30 s), `:186` (90 s) and `:187` (90 s). The precedent is `tools/ematrix_mapdata.mjs`, which writes Lua with a header and no timestamp (`:186-207`). `FidelityEMatrix/Data/EMatrix_Data_Azeroth_tbc.lua:1-2` says "Do not edit" and records the build but not when it was written. The data files are listed in `FidelityEMatrix.toc:12-17`.
- General knowledge: a WoW addon has no runtime file I/O; it reads SavedVariables at load and the TOC-listed Lua at load. The `/reload` path needs in-game verification.
- Time: `time()` is already used (`packages/wow-syntropic/Core.lua:71`, from the code). Age would be `time()` minus the file's `at`; that needs in-game verification and a shared clock, which holds if the client and daemon both run on the laptop (`CLAUDE.md` §0; the client is absent from Node 2).
- Failure modes: the daemon stops and the file goes stale silently; the owner forgets to reload; a `false` flow looks like an unmeasured one unless `kind` is kept (the Apex reports 0.667 without naming the degraded flow, `CLAUDE.md` §0, ticket T1).
- Effort: medium, about half a day (estimate). Risk: medium.
- First concrete step: in `triad_369_process.mjs`, after the flows array (`:191-199`), add an emitter that writes the six flows as a Lua table with `at`, `kind`, `active`, `age_seconds` and `fresh` per flow. Write it with the temp-file-then-rename pattern already used at `:65-68`, to the addon's Data folder on the laptop (the deploy path in `CLAUDE.md` §3). Test: a Node test in `packages/triad-369/test/` (the folder exists) with a fixture where F12 is 100 s old must emit `fresh = false` and `kind = "measured"`. A headless Lua case that loads the output must show "no source" when `time()` minus `at` exceeds the threshold. Proof in the game: after `/reload`, six flow cells show their state with an age, and a stopped daemon turns them to "no source" (needs in-game verification).

**3. FidelityWoW's live telemetry as a second in-client source (not for the six flows).**
- Evidence: `FidelityWoW_Telemetry` is a global defined at `packages/wow-syntropic/Core.lua:30-41`, sampled at 20 Hz only when the owner has opted in (`Core.lua:80`, `:112-115`). Speed and map position are read from the client (`Kinematics.lua:35-44`). Shannon entropy comes from the owner's own cast intervals (`SomaticFlow.lua:105-130`). The FTLE is a blend of three constants (`Kinematics.lua:25-40`). Coherence is the literal 0.99 (`Core.lua:35`). `fourFloats` is a literal (`:37`), and strain only decrements (`:104`).
- Channel: reading another addon's global is general knowledge; needs in-game verification, including whether both addons load on the owner's client (not checkable from here).
- Freshness: about 50 ms when opted in (`Core.lua:115`); absent when not.
- Failure modes: absent by default; only speed, position and entropy are measured.
- Effort: low to read, high to label honestly. First step: bind only fields with a measured writer; test that a field written only by a constant is refused.

**4. Head-tracker pad as an eye source (moves the eye, not cells).**
- Evidence: the pad read is `ReadGamepadEye` (`FidelityEMatrix/EMatrix_Core.lua:741-758`). It keeps the last state and no time (`:747`), so the addon cannot tell a steady head from a dead tracker. The tracker holds the last position for 0.5 s, then drifts to rest, and treats the stream as stale after 2 s (`tools/headtrack/README.md`, "Behaviour worth knowing"). It writes `head.json` with `stale` and `fps` fields, which the addon cannot read.
- Payoff: the owner's depth complaint, but it sets parallax, not a cell's source. Risk: a false "live" when the pad is steady.
- First step: record the time of the last change in `ReadGamepadEye`. Test: constant sticks for 3 s read "no change seen", not "live".

**5. SavedVariables, in the direction the addon can use (login-time config only).**
- Evidence: `FidelityEMatrix.toc:6` declares `FidelityEMatrix_Config`, merged at load (`EMatrix_Core.lua:89-112`). The opposite direction works and is in use: `packages/triad-369/src/wow_adapter.mjs:330-354` finds the client's `FidelityWoW.lua` under WTF.
- General knowledge: the client writes SavedVariables at logout or reload, so a laptop edit made while logged out is read at the next login and then overwritten. Needs in-game verification.
- Fit: config values, not flows. Effort: low. Rank 5 for the bindings.

**6. Hands channel (tasks, not data).** `bridge/hands/LAPTOP-HANDS.md` describes the laptop pulling tasks every 20 s (`hands_sync.mjs:24` default) and an agent that writes results back. Latency is the poll plus an agent turn, which the repo does not measure. It fits "regenerate file X", which is the way to build channel 2, not a source.

## What does not help

- More texture or per-cell four floats: they bind nothing, and the forbidden list keeps them out.
- SavedVariables as a live feed (read at load only); the hands file as a feed (a task queue); the head pad as cell depth (it moves the eye).
- FidelityWoW's literals as readings: coherence 0.99 and the four floats (`Core.lua:35-37`) are not measurements.

## Closing table

| Rank | Channel | Carries | Latency | Freshness | Capacity | Main failure | Effort | First test |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| 1 | Nameplate scan (in-addon) | 8 slots: presence, coarse band | 0.25 s (from code) | scan age | 8 values | plate restricted; band semantics unverified | low | plate vanishes, slot reads "no source" |
| 2 | Generated Lua at load/reload | 6 flows: active, kind, age | reload-bound | file age, needs a stamp | 6 records | silent daemon stop; forgotten reload | medium | stale fixture reads "no source" |
| 3 | FidelityWoW globals | speed, position, entropy (opt-in) | 50 ms (opt-in) | tick age | few fields | consent gate; literals | low to read, high to label | constant field refused |
| 4 | Head pad (C_GamePad) | eye parallax only | tick | none in addon | 2 axes + depth | steady head vs dead tracker | low-medium | constant sticks read "no change" |
| 5 | SavedVariables (in) | config | login only | last login | config | overwritten at logout | low | edit while logged out, read at login |
| 6 | Hands file | tasks | 20 s poll + agent turn | heartbeat 300 s | tasks | agent-mediated | n/a | none as a data path |
