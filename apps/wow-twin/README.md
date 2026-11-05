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
`--head <head.json>` (or `http://<machine>:<port>/head.json` from a tracker on another machine run with
`--serve`), `--depth http://<machine>:<port>` (a depth service for `/live`, `tools/depthd`), `--ref <git ref of
the reports>` (default `origin/owner/reports`).

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

**Live, in any camera:** press **M** (or open with `?magic=1`) and the view itself becomes a Magic Eye picture.
It is redrawn from the depth whenever the view moves; **C** (or `?cross=1`) switches to crossed eyes.
- The pattern never changes, so eyes that have locked on stay locked while you orbit, step through the report or
  move your head in the window.
- Two dots at the top drift apart to the background's repeat: aim until they look like three.
- The building columns stay out of the picture (they mark placements, they are not walls), and so does the player
  wherever the camera stands at its shoulder.
- The encoder is [`tools/twin/stereogram.mjs`](../../tools/twin/stereogram.mjs), the same algorithm as
  `stereo.py`; `tools/twin.test.mjs` checks that every link holds and that near comes out near for both kinds of
  viewing. In headless Chromium the live pictures decode back to their depth within 0.013 (90th percentile).

A Magic Eye, a pair and an anaglyph all ask something of the viewer: a trick of the eyes (not everyone can) or
glasses. The head-coupled window is the one view here that asks nothing but a webcam watching them.

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

## Live WoW in depth (`/live`)

Open http://127.0.0.1:5203/live. It shows a WoW picture you can look into: the game's own pixels, not stand-ins.
- **The picture** is one of the reports' screenshots (the list holds each step's clean twin shot). It can also be
  **a live window**: press *Capture a window (live)* and pick WoW, the way screen sharing does. Nothing touches the
  game. WoW must run in "Windowed (Fullscreen)" mode for the window to be capturable. Alt+Z hides the game's UI,
  which otherwise reads as flat cards near the glass. Any picture can be opened or dropped on the page too.
- **The depth** of every pixel comes from Depth Anything V2 Small (Apache-2.0), running in the browser through
  transformers.js 3.8.1. It is the model's estimate from the picture alone: the game gives its depth to nothing
  outside it, and the page says so.
  - The model loads once from Hugging Face (about 30 to 50 MB), then from the browser's cache.
  - It runs on the graphics card through WebGPU: in half precision where the card has it (`shader-f16`), in full
    precision on any other card, and on the processor only when the browser has no WebGPU card. The status panel
    names the card and why anything was skipped. `?gpu=low-power` asks for the integrated graphics, so a laptop's
    Intel chip can take the model while the game keeps the discrete card; `?device=wasm` forces the processor.
  - Measured: headless Chromium here, on the processor, 4 to 7 s a picture at 518 px wide. The owner's laptop (an
    i7-6700HQ beside WoW, before full precision on the card was tried): 18.9 s. On a graphics card it should be far
    faster, but that is not measured yet.
  - With `--depth http://<machine>:<port>` the twin sends each picture to a depth service on a machine with a
    graphics card to spare ([`tools/depthd`](../../tools/depthd/README.md)) and the page uses what comes back; if the
    service fails, the page says so and uses its own model.
  - A live window is estimated again whenever the model is free, while the picture itself updates at video rate,
    so depth lags fast camera turns.
- **The view** is the head-coupled window: the tracker's `head.json` (or "mouse as head") moves the eye. Far parts
  slide with the head and near parts stay on the glass. "Depth" sets how far behind the glass the background sits.
  "On the glass" sets which depth sits on the screen (lower brings near things out in front).
  - The picture is drawn 5% larger than the window so a moved head opens no black edges; `?overscan=0` draws it to
    the pixel.
  - **M** shows a Magic Eye of the model's depth. **F** goes full screen. `?chrome=0` hides the panel.
- **On the TV:** the server answers only the laptop itself, so the page runs on the laptop. Either cast the Chrome
  tab (the ⋮ menu, Cast, the TV, Sources, Cast tab) or use the TV as a second screen over HDMI, which has the least
  delay. The camera for the head can be a phone at the TV (`tools/headtrack/README.md`, "A phone as the camera").

Checked in headless Chromium (05 Nov) with the tenth report's first scene shot:
- at rest, with `?overscan=0`, the view matches the screenshot (mean difference 2.6 of 255);
- with the head 0.3 to the right the far trees slide 41 px, the camp 32 px and the near ground 18 px, all with the
  head, and the left is the mirror;
- with the default 5% overscan the same head move leaves 2.6% of the left edge black, against 99% without;
- the Magic Eye decodes back to the model's depth (median error 0.007);
- no page errors.

`npm run check:live` measures all of these again, each against a bound
([`tools/checks/README.md`](../../tools/checks/README.md)); run here again on 05 Nov evening it gave the same
numbers.

`tools/twin.test.mjs` checks the geometry ([`tools/twin/relief.mjs`](../../tools/twin/relief.mjs)): from the resting
eye every vertex lands on its own pixel; seen from a moved head a point on the glass stays, a point behind it moves
with the head and a point in front against it; the page's three.js camera draws exactly that.

## Limits

- **No live creatures or other players.** The addon API gives a world position only for the player (and party
  members), so the twin cannot place the kobolds.
- **No game models or textures**, only stand-ins.
- **A separate window**, not the game's own pixels (except `/live`, whose depth is estimated, not the game's).
- **The game's-camera view is only as right as the camera model.** At the saved default it fails (the tenth
  report). The proposal is unconfirmed.
