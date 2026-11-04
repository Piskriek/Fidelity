# B3, the click as an event (round 4: what the bound entity can do)

**Thesis.** The click is the bridge the repo has half built, and the half it has built ignores the registry. `HandleMatrixClick` turns the cursor into a cell and starts a wave; it never reads the source records, never prints, and never says which cell or source it resolved (`FidelityEMatrix/EMatrix_Core.lua:604-625`). The honest first move is to make the click name its source, using records that already exist (`CellSource`, `EMatrix_Core.lua:179`, exported at `:316`), with the value shown as the band and the kind the host measured, not as the constant it is. Anything that acts on a unit (target, raid mark) needs an identity checked at click time, which the repo does not store today (`EMatrix_World.lua:154` keeps a unit token only). In-combat action is ruled out by the client as far as general knowledge goes; nothing here is verified in the game.

## Ranked list (visible payoff per hour, highest first)

**1. The click names its source (same wave, plus one chat line).**
- *Claim:* a left click on a bound cell prints the record that drives it (cell index, source name, band, kind, age). An unbound cell prints "no source".
- *Evidence:* the click path never touches the registry (`EMatrix_Core.lua:604-625`; `CellSource` is used only at `:179`, `:316` and in the tests). Cells are textures on `frameGrid` (`:555`, `:572`), and `frameGrid` has `EnableMouse(false)` (`:524`), so picking is coordinate arithmetic on `masterFrame` (`:363`, `:629-630`). Far (value 0.2) and no source both close identically: open needs measured and value at least 0.5 (`:183`).
- *Effort:* 1 to 2 h. *Risk:* low. The chat line is text and can be read as a reading, so print the band and kind, never the value (see "does not help").
- *First step:* extract the mapping at `:611-618` into a pure helper (proposed name `CellAt(mx, my, left, top, scale)`); `HandleMatrixClick` calls it, then `CellSource(index)`, and prints one line. The wave stays.
- *Test:* in `tools/ematrix_headless.lua`, put the cursor at the centre of cell (c, r) at scale 1 and at scale 1.25 and assert the returned cell. The stub's `GetEffectiveScale` returns 1 for every frame (`:90`), so the division at `:612-614` is never exercised. `GetLeft` and `GetTop` are constants 720 and 684 (`:92-93`), so the test is only as good as those constants. The harness never calls a mouse script (grep finds no `OnMouseDown` use), so the test calls `_G.FidelityEMatrixFrame:GetScript("OnMouseDown")` and asserts the printed line (`print` is captured, `:18-21`). The `pcall` at `:610` swallows errors, so the test must assert the print, not the absence of an error.
- *Proof:* in game, `/fide bind on`, click cell k: the chat line names slot k's token, and the cell that opens on screen is the one named. *Needs in-game verification:* that `GetCursorPosition` divided by the frame's effective scale lands on `GetLeft`/`GetTop` in UI units.

**2. Remove the silent fallback and say what the toggle does.**
- *Claim:* a click off the grid should emit nothing.
- *Evidence:* an off-grid click starts a wave from (8, 5) (`EMatrix_Core.lua:620-624`), so a miss looks like a pick. Each click also flips the global target (`:1013`), but under the gate a settled bound cell takes its face from its source, not the target (`:1035-1043`), so the flip is visible only during the wave. This is the open item in `docs/council/2026-11-04-bridges/STEER.md` ("the (8, 5) fallback origin").
- *Effort:* 0.5 h. *Risk:* none visible.
- *First step:* the helper returns nil off-grid; the handler then returns without a wave or a line.
- *Test:* headless click at x = 0 expects `ns.State().waveActive == false`.
- *Proof:* in game, clicking the rim of the grid starts no wave.

**3. Check identity before any action (prerequisite for 4 and 5).**
- *Claim:* store the unit's GUID with the source record at publish; at click time compare the GUID of the token; if they differ, print "source moved" and do nothing.
- *Evidence:* `PublishSlot` keeps only `s.unit` (`EMatrix_World.lua:150-154`). Slots are assigned per scan to the first free index (`:265-290`, the `GetSlot` loop at `:90`), and nameplate tokens belong to whatever plate is current. `UnitGUID` appears in this repo only in a combat-log handler (`packages/wow-syntropic/SomaticFlow.lua:37`), so its use on nameplate tokens is unseen here.
- *Effort:* 2 to 3 h. *Risk:* medium. Whether `UnitGUID` answers for nameplate tokens in this client: *needs in-game verification*.
- *First step:* add the GUID to the `BindCell` call at `EMatrix_World.lua:154` (as a new field; the signature change goes through `EMatrix_Core.lua:160`).
- *Test:* the stub has no `UnitGUID` global; add one by hand, with a token-to-GUID table that the test can change to simulate a slot reassignment, then assert "source moved".
- *Proof:* in game, with two mobs swapping plates, a click after the swap reports "moved".

**4. Click to target, out of combat, opt-in.**
- *Claim:* a left click on a fresh, measured cell with band near or mid targets that unit.
- *Evidence:* no targeting call exists in the repo (grep for `TargetUnit`, `SetRaidTarget`, `SecureActionButtonTemplate`, `InCombatLockdown`: no hits). Out of combat, a target from an insecure click handler is likely allowed (*general knowledge, needs in-game verification*); in combat, assume refused until shown otherwise (*general knowledge, needs in-game verification*).
- *Effort:* 4 to 6 h including the in-game check. *Risk:* medium to high; a mis-resolved click targets the wrong mob.
- *Rules from the definition:* never on hover; never on a timer ("nothing moves at rest", `docs/council/2026-11-04-entity/STEER.md` section 2); never on the symbolic player; never on a `not_measured` or `far` source.
- *First step:* a new branch in the click handler behind a config key defaulting to off (defaults are merged in `EMatrix_Core.lua:98`), gated on items 1 and 3.
- *Test:* the stub refuses unknown widget methods (`tools/ematrix_headless.lua:51`), so a targeting call must be added deliberately, marked untested, and asserted to be called only for a fresh measured near or mid source.
- *Proof:* in game, out of combat, click cell k: the target changes to the unit named in the print. In combat: nothing happens and a refusal is printed (*needs in-game verification*).

**5. Raid mark on click.**
- *Claim:* the same chain as 4 puts a mark on the unit.
- *Evidence:* no mark call in the repo. Mark rights depend on group status (*general knowledge, needs in-game verification*). A mark is seen by the other players in the group, which the owner should weigh before it ships.
- *Effort:* 4 to 6 h. *Risk:* high (social, and it depends on group rights). Ranked below 4 for that reason.
- *First step and test:* as in 4, with the stub's mark call added deliberately. *Proof:* in game, in a group, a click marks the named unit.

**6. In-combat click actions through a secure button.**
- *Claim:* a secure overlay button could act in combat.
- *Evidence:* no secure template in the repo. Cells are textures, not buttons (`EMatrix_Core.lua:555-572`). *General knowledge, needs in-game verification:* secure frames are normally set up out of combat and their protected actions are blocked for insecure code in combat.
- *Effort:* high. *Risk:* very high. *Recommendation:* not now. The honest in-combat version is item 1 only: the click names the source.

## What the definition rules out

- Auto-targeting or any action without a click, including on hover or on a timer.
- Acting on the symbolic player (cell 1 is the player's slot and stays closed by design, `EMatrix_World.lua:153`, `EMatrix_Core.lua:183`).
- Printing `value 1.00` as a reading. `BAND_VALUE` (`EMatrix_World.lua:149`) is a table constant, so the definition's "a number the host read, not a constant" fails for the value and passes for the band. Print the band.
- Reading a cell's place on screen as where the unit is. A cell is named by index (`EMatrix_Core.lua:528`), and a slot by first free index (`EMatrix_World.lua:265-290`). The "top row" is cells 1 to 8 by index.

## What does not help

- More wave, more squash, or a glint for unbound cells. The glint rule forbids it (`docs/council/2026-11-04-bridges/STEER.md`, "Forbidden").
- Treating the cursor as attention. It is the viewer's input and a named event at most, not a measured source (the bridges STEER concedes this).
- Reading the band as yards. The repo's own comment says "within about 10 yd" (`EMatrix_World.lua:11`) and the yard figures are a render table (`:39-43`). A band is a label.
- Assuming the driver keeps the bound draw alive. `ApplyBindings` runs only inside `OnUpdateDriver` (`EMatrix_Core.lua:904-908`), and `CheckIdleCondition` (`:975-994`) does not count `bindCells`. With the world overlay off and spin and parallax at zero, the bound draw stops following its sources. *From the code; needs in-game verification.*

## What the eight sources add that the owner's screen did not show

The screen shows open or closed per cell. It cannot tell far (0.2) from no source (both closed, `:183`), or near from mid (both open at 1.0 and 0.5). The names, kinds and ages exist only in text (`/fide cells`, `EMatrix_Core.lua:1240-1251`). The click is the first place they can be shown per cell.

## Closing table

| # | Bridge | Channel | Effort | Risk | Test | Proof in game |
| :- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Click names its source | chat line from the click handler | 1 to 2 h | low | headless click at cell centres, scale 1 and 1.25 | the named cell is the one that opens |
| 2 | No silent off-grid event | handler returns nothing | 0.5 h | none | click at x = 0, expect no wave | rim click starts no wave |
| 3 | GUID at click | stored with `BindCell` | 2 to 3 h | medium | stub `UnitGUID`, swap a token, expect "moved" | "moved" after a plate swap |
| 4 | Click to target, out of combat, opt-in | target call, config off | 4 to 6 h | medium to high | stub call asserted only for fresh measured near or mid | target matches the printed name (combat: refused) |
| 5 | Raid mark on click | mark call, group only | 4 to 6 h | high | as 4 | mark appears in a group |
| 6 | In-combat click action | secure overlay | high | very high | none | not recommended now |

Every client claim above is "from the code" (file:line) or "needs in-game verification". Rules of thumb are "general knowledge". No measurement is claimed. The HeavyMetal2 repo (`hm:universe:v2`, PLAN_FRACTAL.md) is not in this checkout and was not used.
