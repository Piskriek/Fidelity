# The bridge: living characters in game worlds

This folder is the working state of the Fidelity bridge: a deterministic test world (Four Valleys), the token bridge, the characters' mind (a nursery trunk with live private heads), and the first pre-registered test (v1a, frozen against live).

**Start here:** `HANDOFF.md`. It lists what exists, what the latest test showed, the next steps in order, and the owner's standing rules.

**Then read:**
- `BRIDGE_DESIGN.md` and its 3/6/9 critique `BRIDGE_CRITIQUE_369.md`;
- `MIND_STEP7.md`;
- `mind/PREREG_bridge_v1a.md` and `mind/runs/v1a/RESULTS_bridge_v1a.md`;
- `mind/runs/nursery/NURSERY_RESULTS.md`;
- `MARBLEGP_MECHANICS_REVIEW.md`.

`RUNLOG_bridge.txt` records each check, with file hashes for many of them.

**What runs.** Plain Node 22 or later, nothing to install.
- `node test/world.test.mjs`, `node test/bridge.test.mjs` and `node test/lockstep.test.mjs`: the world, bridge and runner tests.
- `node mind/live.mjs --live --arm L --trunk mind/runs/nursery/W0_s1.json --seed 1 --worlds 31000,1 --ticks 600`: a short live run.
- `node mind/score_bridge_v1a.mjs <records dir>`: the v1a scorer. The 192 records are summarised in `mind/runs/v1a/lives_summary.json`; the full records stay local.

**Paths.** Generated files and workers name local drives (`D:/fidelity-llm/...` on the laptop, `F:/fidelity-llm/...` on the PC). Adjust them to your checkout. `mind/make_nursery.mjs` reads `pilot/levels_v6.mjs` and checks its hash. The live board's servers reach the run machine over SSH with `PC_HOST` and `PC_KEY` set in the environment.

**Rules for any agent working here:**
- Read the Skill at the repository root, and run its 3/6/9 check. Run it as a triad of points of view, each practising its own internal 3/6/9.
- Pre-register before any counted run, and never tune on scored worlds.
- A fresh claim-strength reader goes over every write-up before it goes out.
- Describe fit, not worth.
- Pain is chosen, not set: felt pain is a higher-self choice, never a setting, and intensity only goes down.
