# Checks behind the published numbers

The READMEs quote measured numbers for the live depth view and the phone camera. These scripts measure them again on
any machine, each against printed bounds, and exit 0 when every measure is within its bound, 1 otherwise. Neither is
part of `npm test`: one needs a browser and a model download, the other OpenCV 4 and about a minute.

## `live_view.cjs`: the depth view (`/live`)

```
npm run check:live                               (or: node tools/checks/live_view.cjs [--out <dir>] [--python python3])
```

It starts the twin on a free port, opens `/live` in headless Chromium (Playwright), saves the pictures, then measures
them with `live_view_measure.py`:

| Measure | Bound | 05 Nov, here |
| :--- | :--- | :--- |
| at rest (`?overscan=0`) the view against the report's screenshot, mean difference of 255 | under 4 | 2.58 |
| head 0.3 to the right: how far the far, middle and near bands slide (px) | far > middle > near > 0 | 41, 32, 18 |
| head 0.3 to the left | exactly the right slide, negated | -41, -32, -18 |
| default 5% overscan, head 0.3 right: the share of the left edge left black | under 10% | 2.6% |
| the Magic Eye decoded back to depth: median and 90th percentile error (depth 0..1) | under 0.02 and 0.05 | 0.007, 0.013 |

Needs Playwright with a Chromium, Python with numpy and Pillow, the reports branch (`git fetch origin owner/reports`:
the screenshot comes from there), and network the first time for the depth model (Depth Anything V2 Small, from
Hugging Face, kept by the browser). Headless Chromium has no WebGPU here, so the model runs on the processor: about a
minute and a half for the whole check.

## `phone_stream.py`: the head tracker on a phone's stream

```
.venv\Scripts\python tools\checks\phone_stream.py      (Windows; elsewhere .venv/bin/python)
```

Run it with the python that has the tracker's requirements (`tools/headtrack/requirements.txt`, OpenCV 4). It serves
a stand-in for the owner's phone, a 1280 x 720 MJPEG stream the way DroidCam serves `/video`: a dim room, a bystander's
face 72 px wide still at the left, and the player's face 44 px wide (about three metres from a phone) in the middle,
swaying 80 px either way every 4 s. Then it runs the real `tools/headtrack/headtrack.py` four times:

| Run | Measure | Bound | 05 Nov, here |
| :--- | :--- | :--- | :--- |
| room (`--room --serve`) | the rest pose: x, face width | the player's: x within 0.15 of the centre, 34-54 px | -0.07, 47.4 px |
| | x follows the player: correlation with where the player is; one side to the other | at least 0.8; at least 0.15 | 0.95; 0.24 |
| | frames without a face | at most 5% | 0 of 359 |
| | frames a second | at least 10 (the stream sends 25) | 22.4 |
| | `GET /head.json` while it runs | every answer 200, with the head | 80 answers |
| | `POST /calibrate` (the page's "set my resting position") | 200, and a second rest pose | yes |
| drops (the stream hangs up every 4 s) | opened again in 14 s; frames without a face | at least 2; at most 10% | 2; 0 of 205 |
| late (the stream appears 6 s after the start) | waited, came up, rest pose set | all three | yes |
| defaults (the control, no `--room`) | frames without a face | all (a 44 px face needs `--room`) | 137 of 137 |

The check catches a tracker that picks the larger face, one that never reopens a stream, and one that ignores
`POST /calibrate` (each tried on a changed copy of the tracker, 05 Nov). Where the tracker is slower than here (a
laptop beside WoW), the frames-a-second line is the one to read first.

The face is `data/face.jpg`: NASA's public-domain portrait of astronaut Eileen Collins, as scikit-image ships it
(`astronaut.png`), cropped to 168 x 183 px.
