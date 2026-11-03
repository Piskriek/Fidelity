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

**Hazard (ticket T2):** `start_friend.ps1` decides "already running" by matching the process command line. Run
unelevated, it cannot see the hidden process's command line, reports "not running", and starts a second
`friend.mjs` writing the same `friend.json` and `friend.log`. Until the script also keys on a pid file, start it only
from an elevated prompt, and check `friend.log` first.
