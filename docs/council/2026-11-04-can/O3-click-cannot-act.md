# O3, opposer: the click cannot act and the cursor is not an eye

**Thesis, as defended here.** The conclusions hold; two causes do not. The click cannot act in this code because nothing leaves the click path. `HandleMatrixClick` (`FidelityEMatrix/EMatrix_Core.lua:604-627`) reaches `TriggerScoreboardWave` (`:998-1013`), which changes frame state and the wave flag only. No print, addon message, saved-state write, chat call or protected call exists in `FidelityEMatrix/` (grep, empty). So the design stops the click, not protected functions or taint; whether a client allows an output is "needs in-game verification". The cursor is not an eye: the eye branch reads `GetCursorPosition` and writes x and y only (`:924-941`, `EMatrix_Math.lua:156-162`). The second cause is wrong: the head tracker is an input. Running it cannot make outputs non-display, because no output channel exists with or without it. Its eye is a measured source only if the addon can see the pad's age, and the pad carries none. The HeavyMetal2 repo (`hm:universe:v2`, `PLAN_FRACTAL.md`) is not in this checkout; nothing below depends on it.

## Ranked attacks

**1. The click has no channel out, and its value is a constant (fatal to "the click as an event the entity emits").** The click path touches frames and `waveTargetState` (`EMatrix_Core.lua:1013`). Its only persisted state is `FidelityEMatrix_Config` (`:90`, `FidelityEMatrix.toc` `SavedVariables`). As a source its value is the wave's constant, which fails the definition's MEASURED test; only the cell coordinates are read (`:611-621`). *Check:* grep (done); in game, what the holon can read after `/reload`. General knowledge: saved variables are written at logout or reload, so a click reaches a file no earlier. Needs in-game verification.

**2. A bound click is overwritten by its own source (fatal to "a bound click acts").** A wave settles each cell to the wave's state (`:884-890`). Every 0.25 s `ApplyBindings` runs (`:906-908`); when no wave runs it sets each settled cell to `CellOpen(source)` (`:1034-1049`), writing the face directly with no flip. With `/fide bind on`, a click on a bound cell ends in the source's state within about 0.25 s. *Check:* headless: bind on, click a bound open cell, step 1 s, assert `CellOpen`. The visible snap needs in-game verification.

**3. One held press can undo itself.** The handler is wired to `OnMouseDown` and `OnMouseUp` (`:629-630`) behind a 0.15 s debounce on `GetTime` (`:606-608`). Each accepted event calls `TriggerScoreboardWave`, which toggles `waveTargetState` (`:1013`). A press held over 0.15 s toggles twice and runs two waves. Both scripts firing per press is general knowledge; needs in-game verification. The harness has no mouse model (`tools/ematrix_headless.lua:117` is cursor position only; grep for `OnMouse`/`click` in `tools/` is empty). *Check:* tap versus a 0.3 s hold on one cell, read the final state.

**4. The cursor is a pointer, and the label names the wrong organ.** The eye is the pointer mapped to a 2D offset (`EMatrix_Core.lua:924-937`, `EMatrix_Math.lua:156-162`), and the login line prints the config value: "eye from the cursor" (`:1434`, default `:82`). The kinds in `packages/triad-369/src/evidence.mjs:48` define `symbolic` as "a model statement, not a sensor reading". A pointer position is a sensor reading of the pointer; that the pointer stands for the eye is the model statement. The thesis's "symbolic" is right for the eye and wrong for the reading. A hand moves the pointer: general knowledge. *Check:* relabel and test the login string.

**5. The cursor branch leaves a stale depth in place (from the code).** The cursor branch writes X and Y only (`:924-941`), as does the parallax-off branch (`:942-946`). `smoothEyeZ` changes only in the pad branch (`:923`), and `EyeGain` reads it (`:200-202`, used at `EMatrix_World.lua:205`). A depth left by the pad survives a switch to the cursor: the code predicts gain `1 + 0.6z`, not 1. The headless test checks z only while the pad drives it (`tools/ematrix_headless.lua:916-938`). *Check:* plug a pad with z 0.3, switch to `eye source cursor`, assert `EyeGain()` is 1.

**6. The fallback to the cursor is silent in the label.** With `eyeSource = "gamepad"` and no pad, the cursor branch runs (`EMatrix_Core.lua:915-924`; the harness asserts the fallback at `ematrix_headless.lua:916-926`), but the login line still prints "eye from the gamepad" (`:1434`). Only `/fide eye probe` names the driver (`:1218-1219`).

**7. The pad carries no age, so FRESH cannot be tested by the addon.** The tracker writes the pad every frame (`tools/headtrack/headtrack.py:294-295`). With no new frame it holds the last axes until `--stale-seconds` (2 s), then decays (`:250-253`). The addon reads the pad every update (`EMatrix_Core.lua:807-822`, `:915-920`), so its own read age is near zero: a frozen camera reads "age 0.0 s" for up to 2 s. The only timestamp, `head.json`'s `at` (`headtrack.py:297`), has one-second precision, local time and no zone. Whether the addon can read that file at runtime is general knowledge; needs in-game verification.

**8. The depth is a width ratio, not a distance.** `z = (width / rest_width - 1) / 0.5`, clamped (`tools/headtrack/headmath.py:34-38`); rest is a mean over two seconds or 60 samples (`headtrack.py:265-271`); detection is Haar at 320 px (`:155-160`). The README and RESUME call it "distance". Width moves with head yaw and box jitter: general knowledge. Lean-in gain reaches 1.8 (`EMatrix_Core.lua:51-52`), against the entity steer's gain cap of 1.0 (`docs/council/2026-11-04-entity/STEER.md`, section 1, "Decision"), which is not in the code. "Intensity only goes down" is violated by default.

**9. No head eye has run in the game.** RESUME records the tracker proven only on synthetic input at 28 fps, with hands task H006 pending (`RESUME.md`, v1.6.0 section and line 98). `LANDED.md` records no pad read. `test_headmath.py` tests pure math.

**10. The eight sources add a second drawing of a band the copies already show.** The band is the `CheckInteractDistance` answer that sets each copy's depth and size (`EMatrix_World.lua:127-141`, `:295-300`). The value is a constant per band (`:149`), so a cell shows three levels, and only near and mid open (`EMatrix_Core.lua:1041`). Identity is the slot index (`EMatrix_World.lua:154`, `:321`), not the unit. What is new is one open bit per slot and its label. *Check:* change a unit's band in a test; only the value should change.

## Concessions the evidence forces

- **The click is a measured input.** Its position is a pointer read (`:611`) and its time is `GetTime` (`:606`): NAMED and FRESH as an input. It is not an output.
- **Clicks drive display only:** the wave, the flip and the global open toggle (`:998-1013`), in and out of combat ("needs in-game verification"). No protected call is involved in this code.
- **The head tracker measures what it says:** face centre (`headmath.py:23-31`) and width (`:34-38`). Honest as the tracker's state, not as an addon source until attack 7 is answered.
- **The cursor is honest as a labelled pointer:** "pointer (cursor; stands in for the eye)", the read measured, the eye symbolic.
- **The eight sources are real:** named, measured as range answers, re-stamped each scan (`EMatrix_World.lua:321`) within the 2 s window (`EMatrix_Core.lua:152`, `:182`). They show nothing the copies did not, except one bit.
- **Minimal honest version:** relabel the cursor eye and zero its depth on the cursor source (4, 5); keep the click a display input, unbound until a channel and a non-constant value exist (1, 2); fix the double toggle (3); bind no head eye until the pad carries an age (7, 9); apply the gain cap of 1.0 (8).

## Closing table

| Bridge | Channel in this code | Named | Measured | Fresh | Kind | Verdict | Check |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Click as entity event | none out (`:604-627`, `:998-1013`) | cell only | coords yes, value constant | yes (`:606`) | measured input | display only | grep (done); headless click test; in-game saved-state read |
| Bound click end state | wave, then `ApplyBindings` (`:884-890`, `:1034-1049`) | yes | n/a | n/a | n/a | overwritten | headless: click, step 1 s, assert `CellOpen` |
| Cursor as eye | pointer (`:924-937`) | no, a pointer | yes | per frame | symbolic as eye | relabel | label test; z-after-switch test (5) |
| Head tracker as eye | virtual pad (`headtrack.py:294-295`) | yes | face box yes; depth a width ratio | no age on pad | measured only if aged | not built, not run | in-game `/fide eye probe`; aged channel (needs in-game verification) |
| Eight actor sources | in-process (`EMatrix_World.lua:150-154`) | yes | range answers yes | per scan | measured | adds one bit | band-change test (10) |
| Holon flows on tiles | none ("no channel from the holon", entity STEER) | n/a | n/a | n/a | n/a | outside this voice | O2's remit |
