# Node 2 (Sol, the 3080 PC): daemon code and runbook

Captured verbatim on 2026-11-03 from `F:\fidelity-llm\bridge\friend\` on PiskriekDesk (192.168.0.5, user RAMPAGE),
where it had lived with no version control. The deployed copy on F: stays the one that runs; edit here, then copy over.

## What runs on Node 2

| Process | Started by | Writes | Read by |
| :--- | :--- | :--- | :--- |
| `friend.mjs` (Sol, ticks every 5 s, contemplates every 60 s) | `start_friend.ps1` (hidden, via WMI `Win32_Process.Create`) | `friend.json`, `friend.log`, `reflections.jsonl` | the laptop's `density_bridge.mjs` and `triad_369_process.mjs`, over SSH as `RAMPAGE@192.168.0.5` (key `id_ed25519_fidelity`), every 30 s |
| `sense/universe/universe.mjs` (Universe Beta) | `start_universe.ps1` (same pattern) | `sense/universe/universe.json` | `friend.mjs` (depth) |
| `voice-node` (the ROCCAT ear) | not in this repo | `voice-node/status.json` | `friend.mjs` (chunks) |
| `sshd` (Windows service) | Windows | | the laptop's pushes of `density_stream.json` and `triad_369_remote.json` into `bridge/friend/` |

`friend.mjs` also polls the laptop at `http://192.168.0.4:5179/reply.json` and logs a "Perceived Fidelity" line when the reply changes.

## Health check (no elevation needed)

```powershell
Get-Content F:\fidelity-llm\bridge\friend\friend.log -Tail 1          # a "Thought:" line under 2 minutes old = alive
Get-Content F:\fidelity-llm\bridge\friend\friend.json                 # tick, ear, universeBetaDepth
Get-Content F:\fidelity-llm\bridge\friend\density_stream.json         # last push from the laptop (laptopTick)
Get-Content F:\fidelity-llm\bridge\friend\triad_369_remote.json       # last push from the Apex (flowIntegrity, coherence)
```

Judge liveness by file age, not by process name: the daemons are started hidden through WMI, and an unelevated
`Get-CimInstance Win32_Process` returns their `CommandLine` as null. `F:\fidelity-llm\ps_nodes.ps1` lists node
processes with that caveat handled.

## Start / stop

```powershell
# elevated PowerShell only (see the hazard below)
powershell -NoProfile -ExecutionPolicy Bypass -File F:\fidelity-llm\bridge\friend\start_friend.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File F:\fidelity-llm\bridge\friend\start_friend.ps1 -Stop
```

**Hazard (ticket T2, guarded):** the command-line match alone cannot see the hidden process when run unelevated, so
on its own it would report "not running" and start a second `friend.mjs` writing the same `friend.json` and
`friend.log`. `start_friend.ps1` therefore writes `friend.pid` next to itself after `Win32_Process.Create` and, on
start and `-Stop`, checks that first: a `node.exe` with that pid that started before the file was written (and whose
command line, where visible, is `friend.mjs`) counts as running; a pid file that fails this is stale and is removed,
and only then does the command-line match decide. When neither can tell, a `friend.log` written under 2 minutes ago
counts as running: start refuses, and `-Stop` reports that the pid is unknown. Stopping or restarting therefore still
works best from an elevated prompt, where the command line is visible. The deployed copy on F: has the guard only
once this version is copied over; a daemon started before that has no `friend.pid`, so the log-age rule covers it.
