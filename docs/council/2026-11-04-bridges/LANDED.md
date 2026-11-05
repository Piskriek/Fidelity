# LANDED: council round 2026-11-04-bridges

## News back

Status: used

What landed (05:01Z, branch `francois/serene-euler-51wj3e`, addon v1.7.4): the per-cell binding registry behind the `bindCells` gate, the world overlay's eight actor slots published as sources with evidence kinds, `/fide cells` and `/fide bind`, the login line counting cells with a source; `seed` and `not measured` on the FidelityWoW HUD with the two real writers flagged; the kinematics false-teleport fix; the density bridge's Sol age floor and derived status (tested); H005 retargeted at this branch with a v1.7.4 gate. Evidence: `npm test` 169 tests, 168 pass, 0 fail, 1 skipped; headless 58/58; math 12/12.

Waiting for: Flash's run of the retargeted H005 and the owner's pastes named in `STEER.md` §"The check that settles it" (the login line with the source count, `/fide cells`, the box with the gate on and off, the HUD's seed labels, the audit after a zone crossing); H007's inventory. On the owner's word this becomes `used`, `changed` or `nofit`, and the next ASK, "what the bound entity can do", opens.

## News back, 04 Nov 2026, four screenshots from the owner (v1.7.4 in the game)

**Status: used.** The login line counts sources (`cells with a source 1 of 135 (0 fresh and measured)` at login, before the first scan). `/fide cells` lists eight sources with real kinds: the player `symbolic`, seven units `measured` (`actor:nameplate9:near value 1.00`, six at `mid 0.50`, all `age 0.0s`). With `/fide bind on` the box settles into exactly the bound state: the top row's cells 2 to 8 open as lenses, cell 1 and every other cell closed, no glint. Two observations folded into v1.7.5: the window's reticle and walls floated over the closed E wall while the bound draw was on (now hidden with the gate on); and the HUD still read `Coherence: 99%` because the deploy copies only the EMatrix folder, so the FidelityWoW labels never reached the game (task H008 added for that addon). The next ASK, "what the bound entity can do", opens on these measurements.
