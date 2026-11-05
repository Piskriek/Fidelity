# O3: The test suite proves the stubs, not the product (opposers' council, 04 Nov 2026)

**Basis.** Branch `francois/serene-euler-51wj3e`, read 04:15 to 04:17Z. Other processes edited four files in that window, so line numbers are as of 04:16Z. `npm test` (Node 22, Linux) at 04:16:55Z: 164 tests, 163 pass, 1 skipped (the real-Elwynn ADT test, `EMATRIX_TILES` unset). The thesis figure of 159 is stale.

## Thesis

"The test suite proves the stubs, not the product: it is green at 159 tests while nothing is verified in the game." Mostly true. The suite is a strong regression net for the code's own assumptions and a weak measure of the client: the stub answers "yes" to unknown methods, "loads" any model path, and returns constant geometry, and the conventions it encodes were written by the same hand as the fixtures that test them. Only the in-game `diag` and `probe` commands ask the game anything.

## Attacks, ranked by severity

1. **Feature checks are always true under the stub (high).** `Region.__index` returns a no-op function for any unknown key (`tools/ematrix_headless.lua:28-31`). My fengari probe: `m.SetDefaultModelPosition ~= nil` is true, as is `f.GetActiveCamera ~= nil`. Guarded calls therefore run in tests and are skipped on the owner's client: `EMatrix_Core.lua:365` and `:1009` (SetDefaultModelPosition), `:387` (GetActiveCamera), `:247` (SetRotation), `EMatrix_World.lua:116`. The client lacks SetDefaultModelPosition (`EMatrix_Core.lua:17`). The suite exercises a code path the client never takes.

2. **The stub's default model answer is the failure the owner saw (high).** `GetModelFileID` returns 424242 for any path (`:162-166`); my probe confirmed `world/does/not/exist.m2` "loads". RESUME (v1.5.1 notes) names the prime suspect as `SetModel` succeeding without a load on the Classic client, which left empty frames. The stub only fails a model when a test lists it in `failModels`, so the default case is the one the client disproved.

3. **Misspelled or absent client APIs pass silently (high).** My probe: `m:SetTextrue("x")` raises nothing. A scan finds 26 colon-method names the addon calls that the stub never defines, such as `EnableMouse` (14 calls), `SetFrameStrata` and `GetActiveCamera`. Each is a silent no-op. There is no `.luacheckrc`, no lint script, and no WoW API list.

4. **A failure-injection check cannot fail (high).** `tools/ematrix_headless.lua:809`: `check(not used()[bushPath] and T.loadStats.ok == okBefore + 0 or true, "no retry before RETRY_AFTER")`. `and` binds tighter than `or`, so the expression is always true. The "no retry before the wait" rule therefore has no working guard.

5. **ADT conventions are checked only against fixtures the same code wrote (high).** `tools/ematrix-mapdata.test.mjs:23-24` and `:44` write positions with the formulas the parser reads, and `:101` asserts `yawDeg === 45`, which is the parser's own `ry - 90`. The only real-data test is skipped, and no `.adt` file exists on this machine. Yaw offset, the `/1024` scale and flag `0x40` are unverified; only the in-game `/fide terrain probe` checks them.

6. **The math suite mostly tests JavaScript copies (medium-high).** `tools/test_ematrix_math.mjs` now runs the real `GetCellRotation` through fengari (`:70-86`, `:205`). But `calculateRingDistance` (`:52`), `calculateFlipProgress` (`:88`) and `getFlipVisuals` (`:96`) are copies, and the ring and flip tests (`:110-260`) assert against them. A change to the Lua ring or flip maths leaves those tests green. The "12/12" partly measures the copies.

7. **The zero-GC guard reads 20 of 140 lines (medium).** `tools/test_ematrix_math.mjs:360` uses `/local function OnUpdateDriver[\s\S]*?end\n/`, which stops at the first `end` followed by a newline, an inline `end` at `EMatrix_Core.lua:778`. Mutation test (scratch copy): I inserted `C_Timer.After(0, function() end)` into `OnUpdateDriver`. The captured body did not contain it and the check passed.

8. **UI scale and frame geometry are constant (medium).** `GetEffectiveScale()` returns 1 (`tools/ematrix_headless.lua:68`), `GetCenter` returns 960,540 (`:69`), `GetLeft`/`GetTop` return 720/684 (`:70-71`), the screen is 1920x1080 (`:96`). No test varies scale. The cursor-to-cell path (`EMatrix_Core.lua:550-554`) and the eye path (`:852-861`) divide and multiply by scale and are checked only at 1. RESUME (v1.4.1 notes) says this matters "when the UI scale is not 1".

9. **Lua 5.3 hides 5.1 failures (medium).** No Lua interpreter is installed (`lua`, `lua5.1`, `luajit`, `luac` all absent). The client is 5.1; the harness is fengari (5.3). Undetectable here:
   - Upvalue cap: 5.1 allows 60 per function, 5.3 allows 255. A regex estimate puts `CreateMatrixGrid` (`EMatrix_Core.lua:278`) at about 46, not compiled.
   - `%s` with nil raises in 5.1 and prints "nil" in 5.3. The sites I read are guarded (`EMatrix_Terrain.lua:525`, `:551`); the harness cannot see the class.
   - `%d` with a fractional value raises in 5.3 and truncates in 5.1. The stub's `GetWidth` returns integers, so `EMatrix_Core.lua:1221` never sees a fraction.
   - Integral floats stringify as "3.0" in 5.3 and "3" in 5.1 (`EMatrix_Terrain.lua:263` keys). Low risk.
   - The harness adds a global `unpack` (`tools/ematrix_headless.lua:12`) that 5.3 lacks.
   - Not found by grep: `goto`, bit operators, `//`, `table.unpack`, `#` on holed tables.

10. **Slash commands are checked for "no error" only (medium).** The `every slash command` test (`tools/ematrix_headless.lua:970`) asserts an empty error list and never reads output.

11. **Two transports and the camera path never run (medium).** `tools/headtrack`: `headtrack.py` has 15 `cv2.` and 3 vgamepad references, none run here (neither module is installed); only `headmath` is tested. `bridge/hands/hands_sync.test.mjs:314` asserts the ssh option and never runs ssh.

12. **Mislabelled figures (low).** `tools/ematrix_mapdata.mjs:13`, `:170`, `:190` say heights are "decimetres", but the stored value is `Math.round(z*10)`, tenths of a yard (`EMatrix_Terrain.lua:149` multiplies by 0.1 to get yards). RESUME's "1 skipped (the Windows-only serve shutdown)" is wrong on Linux; the skip here is the real-data test.

13. **No in-game smoke test or screenshot diff (process).** The only in-game evidence is the owner's screenshots; RESUME says v1.7.1 is "not verified in the game".

## Concessions

- The Lua runs for real under fengari: 28 checks per SetLight profile (56 subtests) pass, against the real math, core, world and terrain code.
- The suite has caught real regressions: the idle-CPU leak, per RESUME, and the math test's idle check, which would have failed on H005 (v1.6.1).
- The six TGA headers are well formed (uncompressed 32-bit, top-left origin). The byte pins catch accidental regeneration.
- The nine committed tile origins match the tile formula (32:48 is -8533.334), and `nsabbey.wmo` is in the Northshire tile. Consistency only.
- The `UnitPosition` order (y first) matches the wiki convention as I know it; nothing offline confirms it.
- `/fide diag` asks the client and found SetDefaultModelPosition missing. It is the best evidence in the repo.
- The triad serve and API tests run real HTTP on loopback and real processes; headtrack's pure maths passes.

## The three cheapest fixes

1. **Strict stub with an allow-list.** A `tools/wow_api_allowlist.txt` of the names the addon calls, marking those the client lacks. `Region.__index` errors on unlisted names; absent feature names return nil; a scan test flags unlisted calls. Effort: about half a day; some green tests will turn red, and each is a finding.
2. **A real Lua 5.1 run.** Install a 5.1 interpreter (`lua5.1`, or `lupa` on LuaJIT), run the same driver under it, and add `luacheck --std lua51`. Effort: about 2 hours. Not tried; I installed nothing.
3. **An in-game self-test.** `/fide selftest` prints PASS or FAIL per faked assumption (feature names, model loads, `UnitPosition` at the Northshire door, scale, the abbey's position). The owner pastes the output. Effort: about half a day, roughly 150 lines of Lua.

## Closing table

| # | Attack | Severity | Evidence | Fix | Effort |
| :-- | :--- | :--- | :--- | :--- | :--- |
| 1 | Feature checks true under stub | High | `headless:28-31`; `Core:365,1009` | Fix 1 | 0.5 day |
| 2 | Default model loads | High | `headless:162-166`; RESUME v1.5.1 | Fix 1, fix 3 | 0.5 day |
| 3 | Absent APIs no-op; no lint | High | 26 names | Fix 1 (scan) | incl. |
| 4 | Check at `headless:809` cannot fail | High | `and`/`or` | Delete `or true` | 5 min |
| 5 | ADT conventions circular | High | `mapdata.test:23-44,101` | Fix 3 (ADT check) | incl. |
| 6 | Math suite tests JS copies | Med-high | `math.mjs:52,88,96` | Drive Lua via fengari | 1 hour |
| 7 | Zero-GC regex reads 20 lines | Medium | `math.mjs:360` | Read to column-0 `end` | 15 min |
| 8 | Scale and geometry constant | Medium | `headless:68-71,96` | Vary scale once | 1 hour |
| 9 | 5.1-only failures | Medium | `Core:278`; `Terrain:525` | Fix 2 | 2 hours |
| 10 | Slash output unchecked | Medium | `headless:970` | Assert output | 1 hour |
| 11 | headtrack and ssh unexecuted | Medium | `hands.test:314` | Fake-device test | 1 day |
| 12 | "Decimetres"; RESUME skip note | Low | `mapdata:13`; `Terrain:149` | Fix text | 10 min |
| 13 | No in-game smoke test | Process | RESUME | Fix 3 | 0.5 day |

**Note.** The council README names this report `O3-the-test-suite-proves-the-stubs-not-the-.md`. This file uses the name the brief gave; `tools/council.mjs check` may flag the mismatch.
