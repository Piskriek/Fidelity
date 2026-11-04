# O2: the 4-node holon is more ritual than instrument

**Thesis.** "The 4-node holon (laptop, Sol PC, Apex daemon, Arena branch) is more ritual than instrument: its daemons measure little, its code is duplicated, its channels expose the machines, and its tests pass with no live node."

**Verdict.** Three parts hold. The fourth ("tests pass with no live node") is true but is the wrong bar. The best counter-evidence is `packages/triad-369/src/evidence.mjs`, a real instrument for the flows it covers.

**Method and limits.** Static reading of the cited files, plus exported-function checks of `hands_sync.mjs` (no repo writes). No live node probe (this sandbox is off the LAN), no `git`, no `npm test`. "RESUME" marks claims from `docs/RESUME.md` that I did not re-verify. Paths are relative to the repo root.

## Attacks, ranked

**1. Critical: a localhost request can write to `main`.** `arena_fractal_bridge.mjs:38` binds `ARENA_BRIDGE_HOST || 127.0.0.1`, which the env var can override. `POST /api/tetra/query` (:175) has no auth and does not check Content-Type. `dispatchTetraQuery` writes `bridge/sync/pending_query.json` (:31, :141). `arena_git_sync.mjs:48-55` then stages `bridge/sync/`, commits it as "grounded empirical telemetry", and pushes `origin main` every 15 s (:21). The 8791 `GET /put` writer (:223-245) accepts any method with no auth. Unverified: whether the 5196 bridge runs on the laptop (ARGON lists it RUNNING, older), and whether browser Private Network Access blocks a page-initiated request.

**2. High: the laptop probably runs the legacy copy, which hard-codes its checks.** `triad.bat:2` runs `bridge/loop/triad_cli.mjs`. `bridge/loop/triad_369_process.mjs:307` sets `status: 'resonant'` unconditionally. The packages copy (:367) would say `'degraded'` at 0.667. RESUME's live push at 12:06:23Z says "resonant" at 0.667, which matches the legacy line. The legacy file also hard-codes `latency_ms: 42` (:160), `lyapunov_ftle: 0.012` (:165), and `passed: true` (:163, :169, :173). No test covers `bridge/loop`. Inference: T1's bridge-root theory may not matter until this copy is replaced.

**3. High: duplication that already diverges.** Four daemon and CLI files exist in both `bridge/loop/` and `packages/triad-369/src/`, plus `bootstrap.mjs`. `diff` shows 385 changed lines in `triad_369_process.mjs` alone. Some differences change numbers: density coherence floor 0.85 (legacy `density_bridge.mjs:103`) versus 0 (packages :115), and FTLE 0.012 versus `null`.

**4. High: "six flows" are four views of one SSH link.** Per `triad_369_process.mjs:187-198`:
- F12, F21, F23, and F32 all need a successful `ssh` to `RAMPAGE@192.168.0.5`. F21 needs a numeric `sol_tick` (`density_bridge.mjs:111-112, :175`), which exists only after a successful read.
- F32 is attempted only when `solUp` (:358), so one dead F23 also drops F32: one fault, two flows.
- F23's "Sol up" means `friend.json.at` is at most 180 s old (:172). `bridge/node2-sol/friend.mjs:70-91` writes `at` and `up: true` on its own 60 s timer, whatever Sol is doing.
- F13 is a file-age check of the bridge's own output (:151-154). F31 is the Apex's own write (:183-185). Both are self-checks.
- F12 pushes `density_stream.json`. No versioned code reads it.

**5. High: coherence, four-floats and "resonant" are formulas, and the seeds source the "100%" claims.**
- `coherence = flowIntegrity * 0.99` (:235; labelled "derived" at :289). 0.66 equals 0.99 × 4/6 exactly, so it adds nothing beyond the flow count.
- `Aq` rises when `whole_check.passed` (:234), which is hard-coded `true` (:215). `node_check` is `fidelityUp && (solUp || true)` (:206), so Sol's state cannot fail it.
- `density_bridge.mjs:97-98` defaults `parts_up ?? 12` and `parts_total ?? 13` when `tv_loop.json` is missing, so density coherence reports daemons never measured. `status: 'synchronized'` is constant (:173).
- `bootstrap.mjs:55-59` seeds `complete_and_resonant`, `flow_integrity: 1`, and `coherence: 0.99`. RESUME ckpt 8 (line 80) claims "100% integrity". `bridge/sync/triad_telemetry.json` carries `flow_integrity: 1` (:22), `coherence: 0.99` (:31), and `lyapunovFTLE: 0.012` (:35). These are seed and legacy values, not readings.
- The Apex states `delta_E === 0.0 J` (:216), while `arena_growth.mjs:105` adds 0.02 J per pulse.

**6. High: FTLE is not measured, and the code marks it verified.** `triad_mesh.mjs:116` falls back to 0.012 when Sol is unreachable. :117 clamps to [0.001, 0.010], so `reported_ftle_within_limit` (:200) is true by construction. :201 sets `ftle_independently_verified = true`, and `arena_git_sync.mjs:84-90` copies that flag forward. :137 returns constant `empiricalCoherence` values of 0.99 or 0.88. The committed `arena_growth_state.json` says `not_measured` (:13) and `ftle_independently_verified: false` (:71), so code and snapshot disagree. Its `reported_ftle: 0.012` (:69) is impossible under the current clamp (maximum 0.010).

**7. High: the "Sol reply" is not provably from Sol.** `triad_mesh.mjs:178-186` writes an `answerText` in Sol's voice, with a hard-coded "Status: Available, synchronized". It marks the inquiry delivered (:188) and writes it to `lens3/reply.json` (:173-174). `bridge/sync/arena_telemetry.json:31` carries "My availability is fully verified ... Checked via direct NVML and SSH key id_ed25519_fidelity". No repo code emits that exact string or its `sol-availability-response-<epoch>` id, so the origin is an unversioned process or a manual write. The Arena reasons over it as Sol's reply.

**8. High: channels expose the machines.**
- The API is plain HTTP with a bearer token. The default bind is 127.0.0.1 (`api.mjs:62`, `docs/TRIAD_API.md:24`). But RESUME:13 records a 401 from the laptop's :8787 at Node 2, proving LAN reachability, and ARGON:97 records `0.0.0.0:8787`. The token crosses the LAN in clear (`docs/TRIAD_API.md:83`).
- Rate limiting runs before authentication (`api.mjs:219`, then :220), against one global counter of 120 per minute (:16). Unauthenticated requests can exhaust it and return 429 to the real client.
- The public repo carries LAN addresses, GPU temperature, and VRAM (`triad_telemetry.json:6,12`; `arena_telemetry.json:31`). Six files hard-code `C:/Users/Pierro/.ssh/...`.
- The laptop key is a full shell on Node 2 (LAPTOP-HANDS.md:130). The proposed gate (:159-196) fits its six forms but is unapplied. Seven call sites use `StrictHostKeyChecking=accept-new`.

**9. Medium: the hands guard is advisory, and its redaction leaks.** `hands_sync.mjs:194` logs a forbidden step and still mirrors the task; enforcement is the laptop agent reading the rule. `forbiddenRepoSteps` flags `push --force` and `reset --hard` but not `git push origin +HEAD:main`. `isForbiddenGit` (:118) does not flag `push ... main`, which LAPTOP-HANDS.md:116 forbids. `redactSecrets` leaves `Authorization: Bearer ...`, `OPENAI_KEY=sk-proj-...`, and `AKIA...` unmasked (`:74-75`). The POSIX-shell claim at :154 is untested.

**10. Medium: the keyword relay costs more than it returns.** AGENTS.md makes it mandatory and says to pause substantive work when it fails. The handler is regex routing that says "no language model connected" (`triad_369_process.mjs:434-466`). The CLI waits 15 s by default (`cli.mjs:184`). I found no equality check on `question` in `cli.mjs`, though AGENTS.md requires one. Its value is transport; its cost is a hard stop when the Apex is down.

**11. Medium: the Arena "autonomy" is counters and templates.** Octave is `floor(growth_tick/10)+1` (`arena_growth.mjs:102`). Reserve grows 0.02 J per pulse (:105). Inquiries cycle through five fixed entries. Nothing in `packages/triad-369/src` calls a model. `arena_git_sync.mjs:119` integrates Arena content into `main` without review, and agent mode fast-forwards `main` and runs growth code every 12 s (:130-138). RESUME's growth-pulse and commit counts are unverified here.

**12. Medium: tests pass with no live node, which is the wrong bar.** `measured-status.test.mjs` runs `stepHarmonicCycle` with no SSH key (:12) and asserts 4/6 (:36) and 1/6 when stale (:55). A real unit test, but its 4/6 fixture pins the live number without proving it. SSH tests use a fake `ssh` shell script (`cli-bridge.test.mjs:290`). No test imports `arena_git_sync.mjs`, `triad_mesh.mjs`, or `arena_growth.mjs`, and none covers the 5196 or 8791 routes. `serve.test.mjs` fails on Windows (T3). I did not run the suite.

## Concessions

- `evidence.mjs` and `measured-status.test.mjs` are real progress: each flow carries timestamp, latency and error, and stale evidence switches it off. `loop_metrics` reports `null` rather than inventing values (`triad_369_process.mjs:496-502`).
- The query bridge (IDs, expiry, claim-by-rename, version gating) is well built and tested. API auth is sound: constant-time comparison, token length check, no default credential, exact-origin CORS.
- The hands channel is the only place the holon acts on the laptop, and the six-form gate is the right shape.
- The committed growth state and RESUME are candid. The honesty culture is real; the code lags it.

## Cut / keep / fix

| Item | Verdict |
| :--- | :--- |
| `bridge/loop/` daemon and CLI copies | Cut, after deploy (attack 2) |
| Arena auto-push of `bridge/sync/` to `main` (`arena_git_sync.mjs:48-55, :119`) | Cut (attack 1) |
| `triad_mesh.mjs` FTLE, Sol answer, verified flags | Cut (attacks 6-7) |
| Hard-coded `passed: true`, `|| true`, bootstrap 100% seeds, 12/13 defaults | Cut (attack 5) |
| Mandatory keyword relay (AGENTS.md) | Make opt-in (attack 10; RESUME agrees) |
| `evidence.mjs`, `measured-status`, `query_bridge.mjs`, `api.mjs` auth | Keep |
| Hands mirror, redaction, six-form gate | Keep, fix (attacks 8-9) |
| `friend.mjs` heartbeat | Keep, relabel "process ticking" |
| SSH-bound flows (F12, F21, F23, F32) | Keep one link, report it as one measurement |

## Fix first, in order

1. Close the localhost-to-`main` path: disable the auto-push, require auth on the 5196 query and the 8791 writer (attack 1).
2. Move the laptop's Apex and density bridge to the packages copy; confirm with `triad -- status` (attack 2, T1).
3. Turn fabricated values into `not_measured`: FTLE, the Sol answer, the 12/13 defaults, the hard-coded checks (attacks 5-7).
4. In `api.mjs`, count the rate limit after auth, confirm the 127.0.0.1 bind or add TLS in front, and rotate the token if it has crossed the LAN in clear (attack 8).
5. Add redaction and guard tests built from the failing samples (attack 9).
6. Owner decision: apply the gate (`bridge/hands/LAPTOP-HANDS.md:159`).
7. Scrub the committed telemetry and username paths; then T3, T5, and T2.
