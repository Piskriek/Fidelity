#!/usr/bin/env python3
"""tools/checks/live_view_measure.py DIR - measures the pictures tools/checks/live_view.cjs saved in DIR and says
whether each measure is within its bound (exit status 0) or not (1). Needs numpy and Pillow.

1. rest.png against shot.jpg: the resting view (overscan 0) is the screenshot. Bound: mean difference under 4 of 255.
2. head-right.png and head-left.png against rest.png: the horizontal slide of three bands (far trees at the top, the
   camp in the middle, the near ground at the bottom), found by the shift with the least mean difference.
   Bound: far > middle > near > 0 to the right, and the left exactly the mirror.
3. head-right-overscan.png: the share of the left edge left black by the moved head. Bound: under 10%.
4. magic.png against depth.raw: the separation that best repeats around each pixel, turned back into depth.
   Bound: median error under 0.02 and 90th percentile under 0.05 (depth in 0..1).
"""
import json
import os
import sys

import numpy as np
from PIL import Image


def load(path):
    return np.asarray(Image.open(path).convert('RGB')).astype(np.float32)


def band_shift(a, b, y0, y1, maxs=90):
    h, w = a.shape[:2]
    A = a[int(y0 * h):int(y1 * h)].mean(axis=2)
    B = b[int(y0 * h):int(y1 * h)].mean(axis=2)
    best, shift = None, 0
    for s in range(-maxs, maxs + 1):
        e = np.abs(B[:, maxs + s:w - maxs + s] - A[:, maxs:w - maxs]).mean()
        if best is None or e < best:
            best, shift = e, s
    return shift


def decode(img, period, strength):
    img = img.astype(np.int32)
    h, w, _ = img.shape
    smin = int(round(period * (1 - strength)))
    best = np.zeros((h, w), np.float32)
    score = np.full((h, w), 1e18)
    for s in range(smin, period + 1):
        half = s // 2
        d = np.abs(img[:, :w - s] - img[:, s:]).sum(axis=2).astype(np.float64)
        k = 5
        c = np.cumsum(np.pad(d, ((0, 0), (k // 2 + 1, k // 2)), mode='edge'), axis=1)
        d = c[:, k:] - c[:, :-k]
        diff = np.full((h, w), 1e18)
        diff[:, half:half + w - s] = d
        better = diff < score
        score[better] = diff[better]
        best[better] = s
    return np.clip((1 - best / period) / strength, 0, 1)


def main(out):
    ok = True

    def report(name, value, good, bound):
        nonlocal ok
        ok = ok and good
        print(f"  {'ok ' if good else 'BAD'} {name}: {value} (bound: {bound})")

    rest = load(os.path.join(out, 'rest.png'))
    h, w, _ = rest.shape
    shot = np.asarray(Image.open(os.path.join(out, 'shot.jpg')).convert('RGB').resize((w, h), Image.BILINEAR)).astype(np.float32)
    diff = float(np.abs(rest - shot).mean())
    report('the resting view against the screenshot, mean difference of 255', f'{diff:.2f}', diff < 4, 'under 4')

    bands = ((0.08, 0.30), (0.40, 0.55), (0.72, 0.86))
    right = [band_shift(rest, load(os.path.join(out, 'head-right.png')), *b) for b in bands]
    left = [band_shift(rest, load(os.path.join(out, 'head-left.png')), *b) for b in bands]
    report('head 0.3 right: far, middle, near band slide (px)', right, right[0] > right[1] > right[2] > 0, 'far > middle > near > 0')
    report('head 0.3 left: the mirror', left, left == [-s for s in right], 'exactly the right slide, negated')

    edge = load(os.path.join(out, 'head-right-overscan.png'))[:, :6].mean(axis=2)
    black = float((edge < 8).mean() * 100)
    report('5% overscan, head 0.3 right: left edge black (%)', f'{black:.1f}', black < 10, 'under 10')

    meta = json.load(open(os.path.join(out, 'depth.json')))
    dep = np.frombuffer(open(os.path.join(out, 'depth.raw'), 'rb').read(), np.uint8).reshape(meta['h'], meta['w']).astype(np.float32) / 255
    mg = np.asarray(Image.open(os.path.join(out, 'magic.png')).convert('RGB'))
    mh, mw, _ = mg.shape
    period = min(160, max(70, round(mw / 10)))
    ref = np.asarray(Image.fromarray((dep * 255).astype(np.uint8)).resize((mw, mh), Image.BILINEAR)).astype(np.float32) / 255
    dec = decode(mg, period, 0.3)
    inner = (slice(30, mh - 5), slice(period, mw - period))
    err = np.abs(dec[inner] - ref[inner])
    med, p90 = float(np.median(err)), float(np.percentile(err, 90))
    report('the Magic Eye decoded against the depth: median, 90th percentile', f'{med:.3f}, {p90:.3f}', med < 0.02 and p90 < 0.05, 'under 0.02 and 0.05')
    print('live_view: all within bounds' if ok else 'live_view: some measures are out of bounds')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1]))
