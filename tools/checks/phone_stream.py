#!/usr/bin/env python3
"""tools/checks/phone_stream.py - the real head tracker (tools/headtrack/headtrack.py) against a stand-in for the
owner's phone: a 1280 x 720 MJPEG stream served over HTTP the way DroidCam serves /video. Says whether each measure is
within its bound (exit status 0) or not (1). Run it with the python that has OpenCV 4 (the tracker's requirements):

    .venv\\Scripts\\python tools\\checks\\phone_stream.py          (Windows)
    .venv/bin/python tools/checks/phone_stream.py                (elsewhere)

The picture: a dim room; a bystander's face 72 px wide, still, at the left; the player's face 44 px wide (about three
metres from a phone) in the middle, swaying 80 px left and right every 4 s. The face is tools/checks/data/face.jpg,
NASA's public-domain portrait of Eileen Collins (scikit-image's astronaut.png), cropped. Four runs:

1. room (--room --serve): the rest pose is the player's (face 34-54 px, x within 0.15 of the centre), the face is
   found in 95% of the frames, x follows where the player is (correlation at least 0.8 with the sway, at least 0.15
   from one side to the other), GET /head.json answers with the head, and POST /calibrate (the twin's "set my resting
   position") makes the tracker measure the rest pose again.
2. drops: the stream hangs up every 4 s; the tracker opens it again (at least twice in 14 s) and keeps the face.
3. late: the tracker starts 6 s before the stream exists; it says it is waiting, then tracks.
4. defaults (the control): without --room the faces are too small for the 320 px search; none is found.
"""
import http.server
import json
import os
import re
import socket
import socketserver
import subprocess
import sys
import tempfile
import threading
import time
import urllib.request

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
TRACKER = os.path.join(HERE, '..', 'headtrack', 'headtrack.py')
FACE = cv2.imread(os.path.join(HERE, 'data', 'face.jpg'))
FACE_BOX = 98  # the width of the face the cascade finds in data/face.jpg, in its pixels
W, H = 1280, 720
NOISE = np.random.default_rng(1).integers(0, 14, (H, W, 3), dtype=np.uint8)


def scaled(face_px):
    s = face_px / FACE_BOX
    return cv2.resize(FACE, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)


PLAYER, BYSTANDER = scaled(44), scaled(72)
T0 = time.time()


def frame(player=True, bystander=True):
    f = np.full((H, W, 3), 58, np.uint8) + NOISE
    if bystander:
        bh, bw = BYSTANDER.shape[:2]
        f[290:290 + bh, 150:150 + bw] = BYSTANDER
    if player:
        ph, pw = PLAYER.shape[:2]
        cx = int(W / 2 + 80 * np.sin(2 * np.pi * (time.time() - T0) / 4.0))
        f[330:330 + ph, cx - pw // 2:cx - pw // 2 + pw] = PLAYER
    return f


class Stream(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':  # DroidCam's own page answers here
            body = b'<html>a stand-in for DroidCam</html>'
            self.send_response(200)
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if self.path not in ('/video', '/video-drop'):
            self.send_error(404)
            return
        until = time.time() + 4.0 if self.path == '/video-drop' else float('inf')  # /video-drop hangs up after 4 s
        self.send_response(200)
        self.send_header('Content-Type', 'multipart/x-mixed-replace; boundary=frame')
        self.end_headers()
        try:
            while time.time() < until:
                ok, jpg = cv2.imencode('.jpg', frame(), [cv2.IMWRITE_JPEG_QUALITY, 85])
                b = jpg.tobytes()
                self.wfile.write(b'--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ' + str(len(b)).encode() + b'\r\n\r\n' + b + b'\r\n')
                time.sleep(1 / 25)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass

    def log_message(self, *a):
        pass


def serve(port=0):
    srv = socketserver.ThreadingTCPServer(('127.0.0.1', port), Stream)
    srv.daemon_threads = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def free_port():
    s = socket.socket()
    s.bind(('127.0.0.1', 0))
    port = s.getsockname()[1]
    s.close()
    return port


def get_json(url, data=None, timeout=2):
    req = urllib.request.Request(url, data=data, method='POST' if data is not None else 'GET',
                                 headers={'Content-Type': 'application/json'} if data is not None else {})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.status, json.loads(r.read().decode('utf-8'))


def track(work, label, source, seconds, extra, during=None):
    """Runs the tracker for the given seconds; samples head.json (over HTTP when it serves, else the file)."""
    out = os.path.join(work, f'head_{label}.json')
    serve_port = free_port() if '--serve' in extra else None
    args = [v for a in extra for v in ((a, str(serve_port)) if a == '--serve' else (a,))]  # --serve takes the port
    p = subprocess.Popen([sys.executable, '-u', TRACKER, '--source', source, '--no-gamepad', '--duration', str(seconds), '--out', out] + args,
                         stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    lines = []
    reader = threading.Thread(target=lambda: lines.extend(p.stdout), daemon=True)
    reader.start()
    samples, served, t1 = [], [], time.time()
    while p.poll() is None:
        time.sleep(0.2)
        d = None
        if serve_port:
            try:
                code, d = get_json(f'http://127.0.0.1:{serve_port}/head.json')
                served.append(code)
            except (OSError, ValueError):
                pass
        else:
            try:
                with open(out, encoding='utf-8') as f:
                    d = json.load(f)
            except (OSError, ValueError):
                pass
        if d and 'x' in d:
            samples.append((time.time() - t1, d, time.time()))
            if during:
                during(time.time() - t1, d, serve_port)
    reader.join(timeout=5)
    text = ''.join(lines)
    m = re.search(r'headtrack: (\d+) frames, (\d+) without a face', text)
    frames, lost = (int(m.group(1)), int(m.group(2))) if m else (0, 0)
    r = re.search(r'opened again (\d+) times', text)
    return {'text': text, 'samples': samples, 'served': served, 'frames': frames, 'lost': lost,
            'reopened': int(r.group(1)) if r else 0, 'code': p.returncode}


def main():
    if FACE is None:
        print('phone_stream: cannot read tools/checks/data/face.jpg')
        return 2
    ok = True

    def report(name, value, good, bound):
        nonlocal ok
        ok = ok and good
        print(f"  {'ok ' if good else 'BAD'} {name}: {value} (bound: {bound})")

    work = tempfile.mkdtemp(prefix='phone-stream-')
    srv = serve()
    port = srv.server_address[1]
    print(f'phone_stream: a stand-in phone at http://127.0.0.1:{port}/video (1280 x 720, 25 pictures a second); work in {work}')

    # 1. room, with the server, and "set my resting position" asked over the network once the rest pose is set
    asked = {}

    def ask_once(t, d, serve_port):  # late enough for more than one sway (4 s) after the first rest pose
        if not asked and d.get('restWidth', 0) > 0 and t > 9:
            try:
                asked['reply'] = get_json(f'http://127.0.0.1:{serve_port}/calibrate', data=b'{}')
            except (OSError, ValueError) as e:
                asked['reply'] = (None, str(e))
            asked['at'] = t

    room = track(work, 'room', f'http://127.0.0.1:{port}/video', 16, ['--room', '--serve'], during=ask_once)
    first_rest = re.search(r'rest pose x ([+-][\d.]+) y ([+-][\d.]+), face width ([\d.]+)px', room['text'])
    rx, rw = (float(first_rest.group(1)), float(first_rest.group(3))) if first_rest else (9.0, 0.0)
    report('room: the rest pose is the player\'s (x, face width px)', f'{rx:+.2f}, {rw:.1f}', abs(rx) <= 0.15 and 34 <= rw <= 54,
           'x within 0.15 of the centre, face 34-54 px (the bystander\'s is 72 px at x +0.71)')
    # x is measured from the rest pose, averaged over 2 s of the sway, so its middle is not 0: what must hold is that x
    # follows where the player is (the stand-in knows: 80 px either side of the centre, every 4 s)
    before = [(ts, d['x']) for t, d, ts in room['samples'] if d.get('restWidth', 0) > 0 and ('at' not in asked or t < asked['at'])]
    xs = np.array([x for _, x in before])
    where = np.sin(2 * np.pi * (np.array([ts for ts, _ in before]) - T0) / 4.0)
    r = float(abs(np.corrcoef(xs, where)[0, 1])) if len(before) > 5 and xs.std() > 0 else 0.0
    p2p = float(xs.max() - xs.min()) if len(before) else 0.0
    report('room: x follows the player (correlation with where the player is, from one side to the other)', f'{r:.2f}, {p2p:.2f} over {len(before)} samples',
           r >= 0.8 and p2p >= 0.15, 'correlation at least 0.8, at least 0.15 apart')
    frac = room['lost'] / max(1, room['frames'])
    report('room: frames without a face (of all frames)', f"{room['lost']} of {room['frames']}", room['frames'] > 0 and frac <= 0.05, 'at most 5%')
    fps = room['frames'] / 16
    report('room: frames a second', f'{fps:.1f}', fps >= 10, 'at least 10 (the stream sends 25)')
    good_served = room['served'] and all(c == 200 for c in room['served']) and all(k in room['samples'][-1][1] for k in ('x', 'y', 'z', 'restWidth', 'frames'))
    report('room: GET /head.json while it runs (answers, all 200, with x y z restWidth frames)', f"{len(room['served'])}", bool(good_served), 'every answer 200')
    re_measured = 're-measuring the resting position' in room['text'] and len(re.findall(r'rest pose x', room['text'])) >= 2
    report('room: POST /calibrate, then the rest pose measured again', f"{asked.get('reply')}, {'measured again' if re_measured else 'not measured again'}",
           asked.get('reply', (None,))[0] == 200 and re_measured, '200 {"ok": true}, and a second rest pose')

    # 2. drops: the stream hangs up every 4 s
    drops = track(work, 'drops', f'http://127.0.0.1:{port}/video-drop', 14, ['--room'])
    frac = drops['lost'] / max(1, drops['frames'])
    report('drops: the stream opened again (times in 14 s)', drops['reopened'], drops['reopened'] >= 2, 'at least 2')
    report('drops: frames without a face', f"{drops['lost']} of {drops['frames']}", drops['frames'] > 0 and frac <= 0.10, 'at most 10%')

    # 3. late: nothing listens on the port for the first 6 s
    late_port = free_port()
    late_srv = {}
    threading.Timer(6.0, lambda: late_srv.setdefault('srv', serve(late_port))).start()
    late = track(work, 'late', f'http://127.0.0.1:{late_port}/video', 16, ['--room'])
    if 'srv' in late_srv:
        late_srv['srv'].shutdown()
    waited = 'waiting for the stream' in late['text']
    up = 'the stream is up' in late['text']
    rest = bool(re.search(r'rest pose x', late['text']))
    report('late: waited, then the stream came up and the rest pose was set', f'waited {waited}, up {up}, rest {rest}', waited and up and rest, 'all three')

    # 4. defaults (the control): the 320 px search cannot see faces this small
    defaults = track(work, 'defaults', f'http://127.0.0.1:{port}/video', 6, [])
    report('defaults (no --room): frames without a face', f"{defaults['lost']} of {defaults['frames']}",
           defaults['frames'] > 0 and defaults['lost'] == defaults['frames'], 'all of them (a 44 px face needs --room)')
    srv.shutdown()
    for name, run in (('room', room), ('drops', drops), ('late', late), ('defaults', defaults)):
        with open(os.path.join(work, f'{name}.log'), 'w', encoding='utf-8') as f:
            f.write(run['text'])
    print('phone_stream: all within bounds' if ok else f'phone_stream: some measures are out of bounds (the tracker\'s output is in {work})')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
