# depthd: the depth model on a machine with a graphics card to spare

The twin's `/live` page needs each picture's depth from Depth Anything V2 Small (Apache-2.0). On the owner's laptop,
busy with WoW, the page's own model took 19 to 30 s a picture (05 Nov): its graphics chips have no half precision
and Windows gives Chrome the Intel one. This service runs the same model on the 3080 PC, and the laptop's twin sends
it the pictures.

On the machine with the graphics card (once):

```
python -m venv .venv
.venv\Scripts\pip install -r tools\depthd\requirements.txt
```

On Windows that installs onnxruntime with DirectML, which runs on any DirectX 12 graphics card with no CUDA install.
Then:

```
.venv\Scripts\python tools\depthd\depthd.py --port 5205
```

The first start downloads the model (about 50 MB) into `tools/depthd/models/`. It prints what it runs on (`DirectML,
fp16` on the card; `processor, q8` without one) and the address to give the laptop. Windows asks the first time
whether Python may use the network: allow it on private networks, or add the rule
`netsh advfirewall firewall add rule name="Fidelity depth" dir=in action=allow protocol=TCP localport=5205 profile=private`.

On the laptop: `npm run twin -- --depth http://192.168.0.5:5205`, with `--head ...` as well when the head tracker runs
there too. The `/live` page then says `depth: estimated by the model on the depth service at ... (DirectML, fp16,
N ms there)`. If the service fails, the page says so and goes back to its own model; `?model=local` asks for that
from the start.

- `POST /depth` with a JPEG or PNG returns the depth, one byte a pixel (255 nearest, 0 farthest), gzip-compressed,
  with `X-Depth-Width`, `X-Depth-Height`, `X-Depth-Ms` (the model), `X-Depth-Total-Ms` (all of it on this machine)
  and `X-Depth-Device`. `GET /health` says what runs where. The connection stays open between pictures, and each
  answer is sent at once.
- The page shows where each picture's time went: making the picture, this machine (the page and its twin), the
  network, and the service's machine with the model's share.
- It answers this machine and private network addresses only. A picture is at most 8 MB, one at a time on the card.
- The preprocessing is the model's own (518 px, aspect kept, sides a multiple of 14, ImageNet mean and deviation).

Checked here (05 Nov, onnxruntime 1.31 on the processor, no graphics card):
- On the tenth report's first scene shot, sent the way the page sends it (518 px wide), the depth came back at 518 x 294.
- The model took about 310 ms here, against 4 to 7 s for the page's own processor model.
- It matches the page's browser model with correlation 0.997.
- The fp16, fp32 and q8 models agree within 0.999.
- Through the twin and the page, a head 0.3 to the right slides the far trees 35 px and the near ground 16 px.
- On the owner's 3080 PC (DirectML, fp16, reported by Argon): 1326 ms for the first picture (DirectML compiling its
  shaders), 104 ms warm; the whole round from the laptop's page took 1528 ms, which the breakdown is there to explain.

`python -m unittest tools/depthd/test_depthd.py`: the sizes the model sees, the byte scaling, the address rule.
