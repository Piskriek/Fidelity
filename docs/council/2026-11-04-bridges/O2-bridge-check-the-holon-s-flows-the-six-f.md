# O2: Bridge check, the holon's flows

Viewpoint: opposing council, O2 (attacker). Read-only on the code; no git, no network. Cites are file:line in this checkout. The HeavyMetal2 repo (hm:universe:v2, PLAN_FRACTAL.md) is not here, so nothing below is checked against it. No game-client claim is made; the WoW side is out of scope for this check.

## Thesis

Bridge check, the holon's flows: the six flows are four views of one SSH link plus two self-checks, so a cell bound to a flow shows a ritual, not a measurement. Refined by the code: F12, F21, F23 and F32 all reach one host (Sol) over one SSH channel; F13 and F31 are the writers' own timestamps; and the one flow aimed at Sol's state (F23) passes on a file that Sol's timer writes whether or not Sol's companion is working. A cell bound to any of the six would show the link's state or a writer's own clock, under Sol's name.

## Ranked attacks

1. **Sol's "up" is a literal that outlives Sol.** `bridge/node2-sol/friend.mjs:91` writes `up: true` on every 60 s contemplation (`:70`, `:98`), inside a `try` that swallows write errors. Nothing in friend.mjs checks Sol's state. `packages/triad-369/src/density_bridge.mjs:111` sets `solUp = sol?.up === true` with no age check, and that flag gates the density push (`:187`). F21 (`packages/triad-369/src/triad_369_process.mjs:193`) needs only a numeric `sol_tick` and a fresh density file, which density_bridge rewrites every 3 s (`density_bridge.mjs:169`, `:209`). From the code: if friend.mjs stops while sshd answers, the last `friend.json` keeps `up: true` and a tick, F12 and F21 stay true, and density's coherence keeps its +0.04 Sol bonus (`:115`). Check: stop friend.mjs on Node 2 and watch density.json's `sol_tick`, `last_push` and `coherence` for five minutes. Needs live verification on Node 2.

2. **The copy `triad.bat` runs has fixed flows.** `triad.bat:2` runs `bridge/loop/triad_cli.mjs` from `D:\fidelity-llm`. In that copy F31 and F32 are literal `true` (`bridge/loop/triad_369_process.mjs:145`, `:147`), and F13 is `fidelityUp` (`:121`), true whenever density.json says `'synchronized'` or 10+ daemons are up. The density writer sets that string as a constant (`bridge/loop/density_bridge.mjs:160`). With the laptop up and Sol down the count is 3/6 = 0.5, so `bridge_check` passes (`:149`, `:158`). The status is the literal `'resonant'` (`:307`), and the remote push is not awaited (`:311`). Check: run `triad.bat` with `friend.json` absent and read `bridge_check`. Whether the laptop's `D:\fidelity-llm` matches this `bridge/loop` needs in-laptop verification.

3. **The labels are stamped, not earned.** `packages/triad-369/src/evidence.mjs:23` and `:32` return `kind: 'measured'` for any file or command. `evidence.mjs:9-14` takes a JSON file's own `at` before its mtime, so the writer's clock is the freshness. F13 (`triad_369_process.mjs:154`, `:194`) is `density.json` OR `status.json` within 30 s. `status.json` has no writer in this repo. `tv_loop.json`, which holds the daemon count, is read (`:153`) and listed (`:194`) but does not gate the flow. F13 therefore measures that the density daemon runs. Check: stop density_bridge; F13 should go false within 30 s. Stop the laptop daemons with density_bridge running; F13 should stay true.

4. **Coherence and the four floats are functions of counts and literals.** `triad_369_process.mjs:235` sets coherence = integrity x 0.99, which takes only seven values. `:215` (`whole_check.passed: true`) feeds `:234`, so Aq is always 0.20. In density_bridge, a missing `tv_loop.json` defaults to 12 of 13 (`:97-98`), giving coherence 0.88 with Sol down and 0.92 with Sol up (`:115`), and Aq 0.15 (`:121`). `status: 'synchronized'` (`:173`) is constant. The density file, unlike the Apex, labels none of this.

5. **One host, one fault, two flows.** F32 is attempted only when `solUp` (`triad_369_process.mjs:358`), and `solUp` is F23's evidence (`:177`). When F23 fails, F32 goes false after its 90 s window (`:186-187`). F12's push depends on density's unaged `up` flag (attack 1). Two of the six flows fall with one SSH read.

6. **The tests count their own fixtures.** `packages/triad-369/test/measured-status.test.mjs:22-23` seeds `density.json` with `sol_tick: 15001` and `last_push: ok: true`, plus `status.json`, with no SSH key (`:12`). F12, F21, F13 and F31 then pass, and the 4/6 at `:36` is the fixture's count. The stale case (`:46-55`) is a real test: old seeds turn F13 and F12 off.

7. **Arena sync relabels remote content as verified.** `packages/triad-369/src/arena_git_sync.mjs:84-90`: if an incoming `arena_growth_state.json` has a `pending_inquiry` with the same id as a delivered local one, the code sets `metrics_status = 'empirically_verified'` and `ftle_independently_verified = true`, copying local values. The flag records that two ids matched. `:119` commits and pushes to `main`. The committed snapshot says `not_measured` (`bridge/sync/arena_growth_state.json:13`) and `false` (`:71`). No flow reads the Arena files; the one reader is a snapshot at `triad_369_process.mjs:424`.

8. **The hands heartbeat is liveness of a fifth SSH view.** `bridge/hands/hands_sync.mjs:227` sets `lastPullOk = bytes !== null`, true even when the pulled file is refused (`:191`). `:229` moves `heartbeatAt` before the write. The beat goes over the same SSH (`:163`, `:232`), and nothing in the repo reads `laptop_heartbeat.json`. It shows the hands loop runs; it is not a flow and says nothing about the daemons.

9. **Thresholds compare two clocks.** F23's age is the laptop's `now` minus Sol's `at` (`triad_369_process.mjs:171-172`; written at `friend.mjs:90`), tested as `<= 180` with no lower bound (`:172`; `evidence.mjs:22` has `>= 0`). General knowledge: unsynchronised clocks drift, so a Sol clock far behind makes F23 false for good.

## The six flows, one cell each

- **F12** (Fidelity to Sol): a push ok within 90 s (`triad_369_process.mjs:187`). Shows "the SSH write succeeded", gated on Sol's literal flag.
- **F21** (Sol to Fidelity): density.json fresh and `sol_tick` numeric (`:193`). Shows "the density writer is alive and one read returned a tick".
- **F13** (Fidelity to Apex): density OR status within 30 s (`:154`). Shows "the density daemon is alive", not the laptop's daemons.
- **F31** (Apex to Fidelity): the Apex's own write (`:183-184`). Shows "the Apex wrote its file": a real result, a self-check.
- **F23** (Sol to Apex): timed SSH read of friend.json, age within 180 s (`:166-172`). Shows "Sol's timer file at age X s, latency Y ms". The closest to a measurement, still not Sol's state.
- **F32** (Apex to Sol): timed SSH write, ok within 90 s (`:374-375`). Shows "the link accepted a write", and only while `solUp` holds.

## Concessions

- The evidence shape is sound: source, timestamp, latency and error are carried (`evidence.mjs:21-32`), and stale evidence turns a flow off (`measured-status.test.mjs:46-55`).
- F23 and F32 are timed SSH results, not rituals (`triad_369_process.mjs:166`, `:374-375`). Calling them rituals overstates it; calling them measurements of Sol overstates it more.
- The Apex labels its floats and delta_E symbolic (`:216`, `:292-293`).
- Round 1's O2 items 4, 5 and 12 are re-verified with the refinements above; item 2 holds for the legacy copy. Items 6 and 7 are outside this viewpoint and were not re-verified.

## Minimal honest set

A cell may show today, labelled with its source and age, only:
- **F23**, as "friend.json read over SSH at age X s, latency Y ms" (kind `measured`, within 180 s), once a lower bound on age is added (`:172`). Label: "Sol's timer file, not Sol's state."
- **F32**, as "push to Sol ok, latency Y ms" (kind `measured`, within 90 s). Label: "link write."
- **F31**, as "Apex wrote its state" (kind `symbolic`, a self-report). Label: self-check.

Not yet: F12 (gated on the unaged flag), F21 (no Sol age), F13 (tests the density daemon, not the laptop), the heartbeat (not a flow), and Arena (no flow). Density's coherence and four floats stay "no source" until density_bridge reads friend.json with an age (`density_bridge.mjs:111`) and the 12/13 default goes (`:97-98`).

Smallest fixes: an age check on friend.json in density_bridge (`:111`); `friend.mjs` writes `up` from a measured condition or not at all (`:91`); `evidence.mjs` labels a file's own timestamp `symbolic`, keeping `measured` for timed commands.

## Closing table

| # | Item | Source (file:line) | What a cell would show | Kind | Shows today? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | F12 | `triad_369_process.mjs:187` | SSH write ok, gated on Sol's literal `up` | timed write on a literal | No, until gated on F23 |
| 2 | F21 | `triad_369_process.mjs:193` | writer alive, one stale read | self-check | No |
| 3 | F13 | `triad_369_process.mjs:154` | density daemon alive | self-check | No, rename it |
| 4 | F31 | `triad_369_process.mjs:183-184` | Apex wrote its file | self-check | Yes, labelled |
| 5 | F23 | `triad_369_process.mjs:166-172` | Sol's timer file over SSH, age | measured link | Yes, with an age floor |
| 6 | F32 | `triad_369_process.mjs:374-375` | link accepted a write | measured link | Yes |
| 7 | Heartbeat | `bridge/hands/hands_sync.mjs:227-232` | hands loop alive | liveness, not a flow | Not as a flow |
| 8 | Arena flags | `packages/triad-369/src/arena_git_sync.mjs:84-90` | ids matched | relabel | No |
| 9 | Legacy F31, F32 | `bridge/loop/triad_369_process.mjs:145, 147` | constants | ritual | No, retire the copy |
