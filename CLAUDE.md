# CLAUDE DIRECTOR BRIEFING: FIDELITY 4-NODE HOLON & SIV ENGINE

Welcome, Claude. You are taking over direction while Argon resets. This document brings you up to speed immediately with zero ambiguity or loss of context.

## 0. Checkpoint 10 — Director takeover from Node 2 (03 Nov 2026, verified 12:06–12:10Z)

Claude took over direction on **Node 2** (Sol, the 3080 PC: `PiskriekDesk`, `192.168.0.5`, user `RAMPAGE`). The sections below were written on the laptop (Node 1) and keep their laptop paths. What Node 2 verified, and what differs there:

| Item | On Node 2 |
| :--- | :--- |
| Fidelity checkout | `E:\Repos\Fidelity` (`D:\fidelity-repo` is the laptop's) |
| HeavyMetal2 | not present (`C:\MarbleGp` is a junction to a missing `E:\MarbleGp`) |
| WoW client | not present; §6 objectives 1–2 run on the laptop |
| Node 2 daemons | `friend.mjs`, `universe.mjs`, the ear: live (file ages 12:06–12:10Z), started hidden via WMI, so judge by file age, not process name. Runbook: [`bridge/node2-sol/README.md`](bridge/node2-sol/README.md) |
| Node 1 / Node 3 from here | laptop `:5179/reply.json` 200 and `:8787/healthz` ok at 12:06Z; SSH runs laptop → Node 2 only (port 22 on the laptop is closed from here) |
| Apex flow integrity | **0.667 / coherence 0.66** in the live push at 12:06:23Z; §4's "RUNNING" table does not say which flow is degraded (ticket T1) |
| `npm test` on Windows | 61 pass / 1 fail (`serve.test.mjs` shutdown: `SIGTERM` is `TerminateProcess` on Windows, ticket T3) / 1 skipped; the §5 SIV subset passes 23/23 |

Direction and tickets T1–T5 are in [`docs/RESUME.md`](docs/RESUME.md) §"03 Nov Checkpoint 10". Rule for every later status line in this file: carry the timestamp and the evidence (a file age, an HTTP reply, a commit) that produced it.

---

## 1. Executive Summary & Current State (Checkpoint 9)
* **Repositories**:
  * Primary: `https://github.com/Piskriek/Fidelity.git` (local: `D:\fidelity-repo`)
  * Companion: `https://github.com/Piskriek/HeavyMetal2.git` (local: `C:\MarbleGp`)
* **Core Task**: Building and hardening the **Syntropic Invariant Verifier (SIV)** across World of Warcraft, GTA, and FPS profiles under **RULES 8a**.
* **Remediation Status**: **100% Resolved**. All 9 Arena review findings (`FIX-P1-01` through `FIX-P2-09`) have been implemented, tested, and pushed to GitHub.
* **Test Suite Status**: **23 / 23 PASSED (100% Green)** across SIV test suites.

---

## 2. Invariants Enforced (RULES 8a)
1. **Zero Architectural Lies**: Never claim proof without physical instrumentation. Empty sessions strictly return `INSUFFICIENT_EVIDENCE` with `0.0` confidence.
2. **Epistemic Consent**: Addon telemetry is gated at source (`optIn = false` by default). `/fidelity optout` halts sampling and clears buffers.
3. **No Unscaled Coordinates**: Map fractions $[0..1]$ are converted to yards via zone scale or flagged as `insufficient_scale_metadata`.
4. **Honest Invariant Labels**: Kinematic spline heuristic proxy (not unverified laboratory FTLE); vehicle work bounded by engine power limits; unpowered kinetic gains fail conservation.
5. **Shortest-Arc Yaw Wrap**: FPS aim normalizes angles in $[-180^\circ, 180^\circ]$ to prevent false $358^\circ$ snap detections across boundaries.
6. **Active Rotation Window**: Shannon entropy window clamped to $[200\,\text{ms}, 3500\,\text{ms}]$. Out-of-combat pauses are discarded. Cyclic loops caught by lag-1 conditional entropy $H(X_t \mid X_{t-1})$.

---

## 3. Directory Layout & Key File Map
```text
D:\fidelity-repo\
├── packages\triad-369\
│   ├── src\
│   │   ├── universal_anticheat.mjs   # Multi-game audit (WoW, GTA 6, FPS)
│   │   ├── wow_anticheat.mjs         # 7-Density audit, reaction latency, entropy
│   │   ├── wow_adapter.mjs           # Lua SavedVariables parser & normalization
│   │   ├── triad_369_process.mjs     # Apex middle pillar daemon
│   │   └── api.mjs                   # Authenticated bridge API (:8787)
│   ├── test\
│   │   ├── cp9-remediation-gates.test.mjs  # All 9 remediation gates
│   │   ├── universal-anticheat.test.mjs
│   │   ├── wow-anticheat.test.mjs
│   │   └── wow-adapter.test.mjs
│   └── wow-syntropic\                # Addon source mirrored inside triad-369
├── packages\wow-syntropic\            # Primary tracked addon source
│   ├── Core.lua                      # Consent gate, events, slash commands
│   ├── Kinematics.lua                # Movement sampling, speed limits
│   ├── SomaticFlow.lua               # Cast latency, GCD intervals
│   └── FidelityWoW.toc
└── flash_outbox_cp9.json             # Signed-off remediation record

D:\World of Warcraft\_forever_\        # Classic Era 1.60.x download target
└── Interface\AddOns\FidelityWoW\      # Live addon folder (synchronized)
```

---

## 4. Running Daemons & Holon Topology
| Node | Role | State | Address / Port |
| :--- | :--- | :--- | :--- |
| **Node 1** | Laptop Sensory Ground | RUNNING | `density_bridge.mjs` on `:5179` |
| **Node 2** | Sol 3080 PC (Furnace) | RUNNING | `192.168.0.5` (`friend.mjs`, Tick 12,241+) |
| **Node 3** | Apex Middle Pillar | RUNNING | `triad_369_process.mjs` (PID 34652) + API on `:8787` |
| **Node 4** | Arena Remote Container | RUNNING | `arena_git_sync.mjs` (tracks `arena/dfcfb02d-fidelity`) |

---

## 5. Verification Commands
Run the full SIV test suite:
```bash
node --test \
  packages/triad-369/test/cp9-remediation-gates.test.mjs \
  packages/triad-369/test/universal-anticheat.test.mjs \
  packages/triad-369/test/wow-anticheat.test.mjs \
  packages/triad-369/test/wow-adapter.test.mjs
```

Run WoW SavedVariables live audit:
```bash
npm run wow:audit
```

---

## 6. Immediate Objectives
1. **Battle.net Download**: Monitor completion of World of Warcraft Classic Era in `D:\World of Warcraft\_forever_\`.
2. **First Live Client Audit**:
   - Launch WoW client once ready.
   - Verify `FidelityWoW` addon in AddOn menu.
   - Log in, type `/fidelity optin` to give epistemic consent.
   - Run/mount around, cast spells, trigger combat, type `/reload` to flush SavedVariables to disk.
   - Run `npm run wow:audit` to verify live trajectory and GCD processing through the SIV engine.
3. **Keep Holon Synced**: Ensure all reflections continue streaming cleanly across the 4 nodes.
