# STEER: council round 2026-11-04 (written 04:25Z by the director, Claude in the cloud)

Six voices reported (B1 fractal fidelity, B2 data bridges, B3 perception; O1 overlays, O2 holon, O3 toolchain). Every claim that steers below was re-checked against the code by the director before it was used; a claim the director could not check is marked so. The owner's framing: "the councils keep the loop healthy; this should be built into the fractals; this is the compassion loop."

## What the councils agreed on

- **The first visible repeat was in the code, not the texture.** `GetCellRotation` was `(c*73856093 + r*19349663) % 4`, and since the multipliers are 1 and 3 modulo 4 that is `(c - r) mod 4`: all 135 cells sat on one diagonal lattice of four orientations (B1; verified: the old hash equals `(c - r) mod 4` for all 135 cells). Rotating the lens cells also moved the lens's sun-lit rim off the upper right in 101 of 135 cells.
- **A copy drawn over a world that keeps drawing its twin reads as a double image, not depth, as soon as it moves** (B3's thesis; O1's attack 1). The arithmetic at the defaults: a far copy moves about 33 px, a mid one 20 px, a near one 8 px (eye capped at 0.5, gain 120). RESUME had said "up to 60 px"; corrected.
- **The camera is constants, not measurements** (O1 attack 2; B2 rank 1 to 3): fov 1.0 rad, pitch 0.35 rad, yaw from `GetPlayerFacing`, nominal heights by keyword, distance in two range bands. Nothing the headless tests can check settles any of them; only the game can.
- **The stub answered yes to everything** (O1 attack 8; O3 attacks 1 to 3): any unknown method was a no-op, so `SetDefaultModelPosition`, `GetActiveCamera` and 26 unmodelled methods "existed" in tests and the guarded branches ran paths the client never takes.
- **The holon's numbers are formulas and seeds** (O2 attacks 2, 5, 6, 7; all verified by line): `triad.bat` runs the legacy `bridge/loop` copy with hard-coded `status: 'resonant'`, `latency_ms: 42`, `lyapunov_ftle: 0.012` and `passed: true`; the packages copy still has `whole_check.passed: true` and defaults 12/13 daemons when `tv_loop.json` is missing; `triad_mesh.mjs` clamps a made-up FTLE and marks it independently verified, and writes an answer in Sol's voice; coherence is `flowIntegrity * 0.99`, so 0.66 is exactly 4/6.
- **One path can push to `main` without a human** (O2 attack 1; verified): `arena_fractal_bridge.mjs` takes an unauthenticated `POST /api/tetra/query` (bound to 127.0.0.1 unless `ARENA_BRIDGE_HOST` says otherwise) that writes `bridge/sync/pending_query.json`, and `arena_git_sync.mjs` commits `bridge/sync/` and runs `git push origin main` on a timer. Whether either daemon is running on the laptop now is not known from here.

## Where they disagreed, and what decided it

- O1's "cannot with the Classic API" against B2's measurable bridges: O1 itself conceded the thesis overreaches; the evidence shows only that the current designs cannot stay synced. B2's `UnitPosition` on nameplate tokens, the plate scale, and M2 bounding boxes are all "needs in-game verification", so they are not forbidden, they are unverified. The game decides.
- B1's second star layer and warped nebula against B3's "fractal texture is no substitute for depth": both right at different scales. Texture work pays inside the box, where the illusion is coherent (O1 conceded the box is the coherent part); it does nothing for the full-screen scene.

## Vector

1. **Fidelity with fractals pays inside the window.** The box is where the parallax has no real twin to contradict it. Land B1 in order: the lattice break and the one-sun lens (done, v1.7.2); the domain-warped fractal nebula backplate; four warped E variants in one sheet with mirror and rotation (32 looks, no new draws); per-cell vertex jitter; a second ADD star layer at z 0.75. Nothing finer than 8 texels per 128 px tile: it averages to tint at the 32 px cell.
2. **The overlays become honest portraits until the game says more.** No default changes before the in-game protocol runs. The world copies are camera-sized portraits under their plates with a tunable parallax; the terrain overlay is a probe-able experiment, not a feature. The words "synced", "re-render" and "3D" leave the login line and the docs until P1 to P6 below pass.
3. **Depth has to come from the rendering path, not a sticker on top.** That is the next round's ASK: what the laptop's GPU and the TBC client allow (a driver-level stereo or head-tracked camera; what the client exposes; whether the RTX 3080 PC could run the client). Research round, builders and opposers, before any code.
4. **The holon is made honest in O2's order**, as hands tasks and code tasks: (a) find whether `arena_git_sync.mjs` and `arena_fractal_bridge.mjs` run on the laptop and stop the auto-push to `main` (H007, read-only inventory first); (b) move the laptop's daemons to the packages copy (H001's restart must use `packages/triad-369/src`, not `bridge/loop`; retire `bridge/loop` after); (c) replace every hard-coded `passed: true`, the 12/13 defaults, the clamped FTLE and the templated Sol answer with `not_measured`; (d) count the API rate limit after auth, confirm the loopback bind, rotate the token if it crossed the LAN in clear; (e) make the keyword relay opt-in (RESUME §Checkpoint 10 already recommends it); (f) the owner decides on the SSH gate.
5. **The toolchain tells the truth about the client.** The strict stub is in (v1.7.2): an unknown CamelCase method raises, and the methods the client lacks read as nil. Next: drive the ring and flip maths through fengari instead of JavaScript copies; a Lua 5.1 run with luacheck; `/fide selftest`, which prints a PASS or FAIL line per assumption the owner can paste.

## First step

Landed this round, one from each council, all tested, pushed on `francois/serene-euler-51wj3e`:
- B1: the mixing hash `a = (c*73856093) % 1000003; h = ((a*19349663 + r*83492791) % 1000003) % 4` (no linear mod-4 form fits the grid, 33/33/33/36, no uniform 2x2 block, every intermediate below 2^53) and `ShowFace`, which gives lens cells identity texcoords and closed cells their own rotation. Tests on the real Lua in both harnesses.
- O3: the strict stub (`KNOWN`, `ABSENT`, raise otherwise), the always-true `or true` check fixed, the zero-GC regex reading the whole driver, the "decimetres" label corrected.
- O2: `redactSecrets` masks `Bearer` credentials, `sk-proj-` and `AKIA` keys; `forbiddenRepoSteps` flags any push aimed at `main` (`main`, `:main`, `+HEAD:main`, `refs/heads/main`, `--mirror`).
- The loop itself: `.agents/skills/compassion-loop/SKILL.md`, `tools/council.mjs new|check`, this round under `docs/council/2026-11-04/`.

## Forbidden until verified

- Changing the overlay defaults, or adding overlay features, before the owner runs the protocol on v1.7.2.
- Any claim of "synced", "parallax works" or "3D" in the login line, RESUME or a commit message.
- Merging `claude/ematrix-depth` or this branch into `main` by hand; the arena sync daemon's auto-push stays unknown until H007 reports.
- Quoting "resonant", "100% integrity" or coherence 0.99 anywhere as a measurement.

## The check that settles it

1. Deploy v1.7.2 on the laptop (RESUME §"EMatrix v1.7.1", the four commands), `/reload`, paste the login line, `/fide diag`, `/fide world status`, `/fide terrain probe`, `/fide terrain status`, `/fide status`.
2. Run B3's protocol P0 to P6 (`docs/council/2026-11-04/B3-perception.md`) with the predicted numbers beside the measured ones: far 33 / mid 20 / near 8 px of shift at `/fide parallax 0.5`, copy widths 24 / 48 / 79 px; which frame type is textured; whether copies cover their twins; the head-tracked ratio of far to near shift (about 4.2) once H006 is done.
3. H007 on the laptop: the inventory of running `node.exe` command lines, and whether `arena_git_sync.mjs` is among them.
4. The box after the lattice break: open it (`/fide box show`, click), and say whether the E wall still shows diagonal stripes of one orientation, and whether every open lens is lit from the upper right.

## Next round's ASK

"Depth on the rendering path": what the laptop (GTX 950M, Windows) and the TBC Anniversary client expose for stereo or head-tracked rendering; what a driver-level or injector-level stereo would cost and risk (terms of service included); whether the RTX 3080 PC can run the client at all. Three builders, three opposers, haiku, one file each.
