#!/usr/bin/env python3
"""tools/depthd/depthd.py - the twin's depth model as a service, on a machine with a graphics card to spare.

The twin's /live page estimates each picture's depth with Depth Anything V2 Small (Apache-2.0). On the owner's
laptop, busy with the game, that took 19 to 30 s a picture (05 Nov). This service runs the same model where there is
a graphics card free (the 3080 PC), and the laptop's twin sends it the pictures:

    python tools/depthd/depthd.py --port 5205          # DirectML on Windows (any DirectX 12 card), else the processor
    python tools/depthd/depthd.py --port 5205 --cpu    # the processor only
    npm run twin -- --depth http://<this machine>:5205 # on the laptop

POST /depth with a JPEG or PNG: the depth, one byte a pixel (255 nearest), gzip-compressed, with X-Depth-Width,
X-Depth-Height, X-Depth-Ms (the model's own time) and X-Depth-Device. GET /health: what runs where. It answers only
this machine and private network addresses. The model is downloaded once from Hugging Face into tools/depthd/models.

The preprocessing is the model's own (preprocessor_config.json: DPTImageProcessor, 518 px, aspect kept, sides a
multiple of 14, bicubic, ImageNet mean and deviation); test_depthd.py checks the sizes it makes.
"""
from __future__ import annotations

import argparse
import gzip
import http.server
import ipaddress
import json
import math
import os
import sys
import threading
import time
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
MODELS = os.path.join(HERE, "models")
REPO = "https://huggingface.co/onnx-community/depth-anything-v2-small/resolve/main/onnx/"
FILES = {"fp32": "model.onnx", "fp16": "model_fp16.onnx", "q8": "model_quantized.onnx"}
SIZE, MULTIPLE = 518, 14
MEAN = (0.485, 0.456, 0.406)
STD = (0.229, 0.224, 0.225)
MAX_BODY = 8 << 20


def constrain_to_multiple_of(val: float, multiple: int = MULTIPLE, min_val: int = 0, max_val: int | None = None) -> int:
    """The DPT processor's rounding: to the nearest multiple, kept within the bounds."""
    x = round(val / multiple) * multiple
    if max_val is not None and x > max_val:
        x = math.floor(val / multiple) * multiple
    if x < min_val:
        x = math.ceil(val / multiple) * multiple
    return int(x)


def resize_size(h: int, w: int, size: int = SIZE, multiple: int = MULTIPLE) -> tuple[int, int]:
    """The (height, width) the model sees a h x w picture at: the side scaled least reaches `size`, the other keeps the
    aspect, both rounded to a multiple of 14 (DPTImageProcessor with keep_aspect_ratio)."""
    scale_h, scale_w = size / h, size / w
    if abs(1 - scale_w) < abs(1 - scale_h):
        scale_h = scale_w
    else:
        scale_w = scale_h
    return constrain_to_multiple_of(scale_h * h, multiple), constrain_to_multiple_of(scale_w * w, multiple)


def preprocess(rgb, np, cv2):
    """An RGB picture (h, w, 3, uint8) -> the model's input (1, 3, H, W, float32)."""
    nh, nw = resize_size(rgb.shape[0], rgb.shape[1])
    x = cv2.resize(rgb, (nw, nh), interpolation=cv2.INTER_CUBIC).astype(np.float32) / 255.0
    x = (x - np.array(MEAN, np.float32)) / np.array(STD, np.float32)
    return np.ascontiguousarray(x.transpose(2, 0, 1)[None])


def to_bytes(pred, np):
    """The model's relative inverse depth (H, W) -> one byte a pixel, the nearest 255 and the farthest 0."""
    d = pred.astype(np.float32)
    lo, hi = float(d.min()), float(d.max())
    if not math.isfinite(lo) or not math.isfinite(hi) or hi - lo < 1e-12:
        return np.zeros(d.shape, np.uint8)
    return np.clip((d - lo) * (255.0 / (hi - lo)) + 0.5, 0, 255).astype(np.uint8)


def fetch(kind: str) -> str:
    os.makedirs(MODELS, exist_ok=True)
    path = os.path.join(MODELS, FILES[kind])
    if not os.path.exists(path):
        print(f"depthd: downloading {FILES[kind]} (once) from {REPO}", flush=True)
        tmp = path + ".part"
        urllib.request.urlretrieve(REPO + FILES[kind], tmp)
        os.replace(tmp, path)
    return path


class DepthModel:
    def __init__(self, cpu_only: bool = False, kind: str = "auto"):
        import numpy as np
        import cv2
        import onnxruntime as ort
        self.np, self.cv2 = np, cv2
        avail = ort.get_available_providers()
        gpu = None if cpu_only else next((p for p in ("CUDAExecutionProvider", "DmlExecutionProvider") if p in avail), None)
        self.kind = kind if kind != "auto" else ("fp16" if gpu else "q8")
        opts = ort.SessionOptions()
        if gpu == "DmlExecutionProvider":  # DirectML needs these two (onnxruntime's DirectML notes)
            opts.enable_mem_pattern = False
            opts.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
        providers = ([gpu] if gpu else []) + ["CPUExecutionProvider"]
        self.sess = ort.InferenceSession(fetch(self.kind), opts, providers=providers)
        used = self.sess.get_providers()[0]
        self.device = {"DmlExecutionProvider": "DirectML", "CUDAExecutionProvider": "CUDA", "CPUExecutionProvider": "processor"}.get(used, used)
        self.device += f", {self.kind}"
        inp = self.sess.get_inputs()[0]
        self.input_name, self.half = inp.name, "float16" in inp.type
        self.lock = threading.Lock()

    def run(self, picture: bytes):
        np, cv2 = self.np, self.cv2
        bgr = cv2.imdecode(np.frombuffer(picture, np.uint8), cv2.IMREAD_COLOR)
        if bgr is None:
            raise ValueError("not a JPEG or PNG picture")
        x = preprocess(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB), np, cv2)
        if self.half:
            x = x.astype(np.float16)
        with self.lock:  # one picture at a time on the card
            t0 = time.time()
            out = self.sess.run(None, {self.input_name: x})[0]
            ms = (time.time() - t0) * 1000
        return to_bytes(np.squeeze(out), np), ms


def allowed(addr: str) -> bool:
    """This machine and private network addresses only (the home network), never the internet."""
    try:
        ip = ipaddress.ip_address(addr)
    except ValueError:
        return False
    return ip.is_loopback or ip.is_private


def lan_address() -> str:
    """This machine's address on its network, as another machine would use it (no packet is sent)."""
    import socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("192.0.2.1", 9))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except OSError:
        return "<this machine>"


def make_server(model, port: int, host: str = "0.0.0.0"):
    class Handler(http.server.BaseHTTPRequestHandler):
        def _send(self, code, body: bytes, ctype="application/json", extra=None):
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            for k, v in (extra or {}).items():
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(body)

        def _error(self, code, message):
            self._send(code, json.dumps({"error": message}).encode())

        def do_GET(self):
            if not allowed(self.client_address[0]):
                return self._error(403, "this service answers the home network only")
            if self.path.split("?")[0] != "/health":
                return self._error(404, "GET /health or POST /depth")
            self._send(200, json.dumps({"ok": True, "device": model.device, "model": FILES[model.kind]}).encode())

        def do_POST(self):
            if not allowed(self.client_address[0]):
                return self._error(403, "this service answers the home network only")
            if self.path.split("?")[0] != "/depth":
                return self._error(404, "GET /health or POST /depth")
            if not str(self.headers.get("Content-Type", "")).startswith(("image/jpeg", "image/png")):
                return self._error(415, "a picture is sent as image/jpeg or image/png")
            try:
                n = int(self.headers.get("Content-Length", "0"))
            except ValueError:
                n = -1
            if n <= 0 or n > MAX_BODY:
                return self._error(413, f"a picture of 1 byte to {MAX_BODY >> 20} MB")
            body = self.rfile.read(n)
            try:
                depth, ms = model.run(body)
            except ValueError as e:
                return self._error(400, str(e))
            except Exception as e:  # the model failed: say so, keep serving
                print(f"depthd: the model failed: {e}", file=sys.stderr, flush=True)
                return self._error(500, "the model failed")
            h, w = depth.shape
            self._send(200, gzip.compress(depth.tobytes(), compresslevel=3), "application/octet-stream",
                       {"Content-Encoding": "gzip", "X-Depth-Width": str(w), "X-Depth-Height": str(h),
                        "X-Depth-Ms": f"{ms:.0f}", "X-Depth-Device": model.device})

        def log_message(self, *a):
            pass

    srv = http.server.ThreadingHTTPServer((host, port), Handler)
    srv.daemon_threads = True
    return srv


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--port", type=int, default=5205)
    ap.add_argument("--host", default="0.0.0.0", help="the address to listen on (default: every network of this machine)")
    ap.add_argument("--cpu", action="store_true", help="the processor only, even with a graphics card")
    ap.add_argument("--model", default="auto", choices=["auto", "fp16", "fp32", "q8"],
                    help="auto: fp16 on a graphics card, q8 on the processor")
    args = ap.parse_args(argv)
    model = DepthModel(args.cpu, args.model)
    srv = make_server(model, args.port, args.host)
    here = lan_address()
    print(f"depthd: Depth Anything V2 Small on the {model.device}; serving http://{here}:{srv.server_address[1]}/depth "
          f"(on the laptop: npm run twin -- --depth http://{here}:{srv.server_address[1]})", flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        srv.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
