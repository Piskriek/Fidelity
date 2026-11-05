# Fidelity Twin

Northshire outside the game. The ground, the placements and the camera come from the addon's own data, and the
twin runs in a browser window beside WoW. It draws in real 3D: no 2D model frames, no cropped squares, and its
camera is ours to set.

## Run it

```
npm run twin
```

Then open http://127.0.0.1:5203. The server listens on this machine only, needs nothing beyond the repo's
packages (three.js is already a dependency), and writes nothing. Options: `--port`, `--family tbc|vanilla`,
`--head <head.json>`, `--ref <git ref of the reports>` (default `origin/owner/reports`).

## What it draws, and what each thing is

- **The ground** is every Northshire map tile's 129 × 129 heights (`FidelityEMatrix/Data/EMatrix_Data_Azeroth_tbc.lua`),
  on the same grid the addon stands on. `tools/twin.test.mjs` checks that the height under a recorded pose is the
  ground the client recorded there.
- **Stand-ins.** Each of the 5,027 placements is a simple shape for its kind (tree, bush, barrel, crate, jar, tent,
  rock, post), at its own position, turn and scale, sized by the addon's nominal height. They are not the game's
  models: those are not in the repo and are not ours to copy.
- **Buildings** (WMOs, such as the Abbey) are marked by wire columns at their placements. They are not drawn.
- **The player** stands at a recorded pose, or at a live one.

## Cameras

- **The game's camera at a recorded pose.** This is the addon's `BuildCamera` line for line
  (`tools/twin/camera.mjs`). The test reproduces every foot the client recorded at the tenth report's shutters,
  also through a three.js camera. The view sits over that report's screenshot.
  - Cyan crosses mark each placement's predicted foot.
  - Yellow circles mark the director's blind feet (the tenth report, step 1).
  - The pitch and field of view are either the saved default (which failed the tenth report's twin) or the
    tenth report's proposal (not confirmed).
- **A head-coupled window.** The screen becomes a window: your head moves the eye and the frustum skews, so the
  scene shifts the way a real window does.
  - The head comes from `tools/headtrack/headtrack.py`, which writes `head.json`. Run it with `--no-gamepad` and
    the twin needs no virtual pad.
  - **Mouse as head** tries this without a webcam.
- **Free orbit**, around the player.

## 3D you can see without glasses

The twin knows how far away every point is, so it can make pictures that pop out for the eyes alone.

- **A Magic Eye picture** (an autostereogram) is one patterned image with the scene hidden in it.
- **A side-by-side pair**, one picture per eye, works for cross-eyed or parallel viewing.
- **A red/cyan anaglyph** is for anyone with the glasses.

To make them:
1. Open the viewer with `?report=20261105-0530&camera=game&lens=proposal&shot=none&chrome=0`, adding:
   - `&view=depth` for the depth map (near white, far black);
   - `&eye=L` or `&eye=R` for one eye (`&baseline=0.8` yards between the eyes, `&focus=25` yards on the screen plane).
2. Save each canvas (right-click, save image).
3. Run:

```
python3 tools/twin/stereo.py magic depth.png magic-eye.png        # add --cross for crossed eyes
python3 tools/twin/stereo.py pair left.png right.png northshire   # -cross, -parallel and -anaglyph pictures
```

To view the Magic Eye picture, put your face close to it so it blurs, relax your eyes as if looking far behind the
screen, and lean back slowly. When the two dots at the top become three, hold it: the valley comes out, with the
ground falling away and the trees and the camp standing up. For the cross-eyed pair, look at a fingertip held
between you and the screen until the two pictures become three; the middle one is in 3D.

`stereo.py selftest` checks the encoding: the background repeats at the full separation, and a raised square at
the shorter one, centred on it.

## A live pose

Any telemetry source can send `POST /api/pose` with JSON `{ x, y, facing, z?, zoom?, pitch?, fovY? }`, using
UnitPosition's axes. The viewer then follows it.

Which source feeds it from WoW is still open. An addon cannot open a socket, so the candidates are the game's own
files and the screen. In the order the owner set for his harness (game-written files before screenshots):
1. The chat log the client writes while `/chatlog` is on. Whether addon lines reach it, and how late, must be
   tried in the game.
2. A strip of coloured pixels the addon draws, read by a screen capture on the same machine. It is fast, but it
   is a screenshot.

Neither sends anything back to the game.

## Limits

- **No live creatures or other players.** The addon API gives a world position only for the player (and party
  members), so the twin cannot place the kobolds.
- **No game models or textures**, only stand-ins.
- **A separate window**, not the game's own pixels.
- **The game's-camera view is only as right as the camera model.** At the saved default it fails (the tenth
  report). The proposal is unconfirmed.
