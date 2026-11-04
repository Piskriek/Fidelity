#!/usr/bin/env python3
"""tools/frame_fill.py - the terrain test's red frame in an owner screenshot, for the fit rung.

The fit rung's measure (council round 2026-11-04-rungs): how much of its test frame a model fills,
top to bottom. The director read it by eye, and two readings of one picture disagreed by 0.13.
This tool makes the reading repeatable and states its precision:

  find      The frame: the four red edges /fide terrain test draws (v1.8.5 and later), or, when a
            shot has no marks (v1.8.3, v1.8.4), the known rectangle: 40% of the screen height,
            centred, 0.8 as wide as tall. Prints the frame's rows and columns.
  sheet     A contact sheet of labelled crops with a cyan tick every 5% of the frame's height
            (long ticks every 10%, numbered from the top), for the eye. A reading against the
            ticks has a precision of about half a tick: 0.025 of the frame.
  twin      The model's edges from a pair of shots of one test frame, the second with the test
            frame hidden and everything else unchanged (v1.8.8's twin steps take this pair): the
            model is the longest run of rows where the two differ inside the frame (a unit walking
            past is a shorter run). Prints the gaps at the top and the bottom, the width, and
            'clipped' or 'overflow' where the model touches an edge: the fields of a ledger row
            (docs/rungs/ledger.json).

An automatic fill from one shot was tried and dropped: the test models are lit dimly and the
dimmed world is not uniformly darker, so a brightness threshold read a frame-filling bush as 0.075.
Run it on shots copied from origin/owner/reports; it writes only the sheet you name.

Usage:
  python3 tools/frame_fill.py find SHOT.jpg [...]
  python3 tools/frame_fill.py sheet OUT.png SHOT.jpg[=LABEL] [...]
  python3 tools/frame_fill.py twin SHOT_WITH_MODEL.jpg SHOT_WITHOUT.jpg
Needs Pillow and numpy (the director's side only; not part of npm test).
"""
import sys
import os

try:
    import numpy as np
    from PIL import Image, ImageDraw
except ImportError:  # the tool is optional: say so and stop
    print("frame_fill: needs Pillow and numpy (pip install pillow numpy)", file=sys.stderr)
    sys.exit(2)


def find_frame(a):
    """The red edges as (top, bottom, left, right), or None when the shot has no marks."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    red = (r > 170) & (g < 110) & (b < 110) & ((r - g) > 90)
    rows = np.where(red.sum(axis=1) > 150)[0]
    cols = np.where(red.sum(axis=0) > 150)[0]
    if len(rows) < 2 or len(cols) < 2:
        return None
    return int(rows.min()), int(rows.max()), int(cols.min()), int(cols.max())


def known_frame(h, w, aspect=0.8):
    """The unmarked test frame: 40% of the screen height, centred."""
    fh = round(h * 0.4)
    fw = round(fh * aspect)
    top, left = (h - fh) // 2, (w - fw) // 2
    return top, top + fh - 1, left, left + fw - 1


def frame_of(img):
    a = np.asarray(img.convert("RGB")).astype(int)
    f = find_frame(a)
    return (f, True) if f else (known_frame(a.shape[0], a.shape[1]), False)


def crop_with_ticks(path, label):
    img = Image.open(path).convert("RGB")
    (top, bottom, left, right), marked = frame_of(img)
    pad = 34
    box = (max(0, left - pad - 20), max(0, top - pad), min(img.width, right + pad), min(img.height, bottom + pad))
    c = img.crop(box).copy()
    d = ImageDraw.Draw(c)
    for k in range(0, 21):
        y = top - box[1] + round(k * (bottom - top) / 20)
        d.line([(0, y), (30 if k % 2 == 0 else 14, y)], fill=(0, 255, 255), width=2 if k % 2 == 0 else 1)
        d.line([(c.width - (30 if k % 2 == 0 else 14), y), (c.width, y)], fill=(0, 255, 255), width=2 if k % 2 == 0 else 1)
        if k % 2 == 0:
            d.text((34, y - 6), str(k * 5), fill=(0, 255, 255))
    d.rectangle([0, 0, c.width, 14], fill=(0, 0, 0))
    d.text((4, 1), f"{label}{'' if marked else ' (frame not marked)'}", fill=(255, 255, 0))
    return c


def cmd_find(paths):
    for p in paths:
        (t, b, l, r), marked = frame_of(Image.open(p))
        print(f"{os.path.basename(p)}: frame {'marked' if marked else 'known rectangle'} rows {t}-{b} cols {l}-{r}")


def cmd_sheet(out, items):
    crops = []
    for it in items:
        path, _, label = it.partition("=")
        crops.append(crop_with_ticks(path, label or os.path.basename(path)))
    w = sum(c.width for c in crops) + 6 * (len(crops) - 1)
    h = max(c.height for c in crops)
    sheet = Image.new("RGB", (w, h), (40, 40, 40))
    x = 0
    for c in crops:
        sheet.paste(c, (x, 0))
        x += c.width + 6
    sheet.save(out)
    print(f"sheet: {out} ({w}x{h}, {len(crops)} crop(s))")


def largest_run(idx, gap=8):
    """The longest run of indices whose gaps are at most `gap`: the model, not a kobold walking past."""
    if len(idx) == 0:
        return None
    best, start, prev = None, idx[0], idx[0]
    for i in list(idx[1:]) + [None]:
        if i is not None and i - prev <= gap:
            prev = i
            continue
        if best is None or prev - start > best[1] - best[0]:
            best = (start, prev)
        if i is not None:
            start = prev = i
    return best


def cmd_twin(with_model, without):
    a = np.asarray(Image.open(with_model).convert("RGB")).astype(int)
    b = np.asarray(Image.open(without).convert("RGB")).astype(int)
    if a.shape != b.shape:
        print("twin: the two shots differ in size", file=sys.stderr)
        return 2
    f = find_frame(a)
    top, bottom, left, right = f if f else known_frame(a.shape[0], a.shape[1])
    t, bt, l, r = top + 3, bottom - 3, left + 3, right - 3
    diff = np.abs(a[t:bt + 1, l:r + 1] - b[t:bt + 1, l:r + 1]).max(axis=2) > 40
    fh, fw = bt - t + 1, r - l + 1
    run = largest_run(np.where(diff.mean(axis=1) >= 0.01)[0])
    if run is None:
        print(f"twin: no difference inside the frame rows {top}-{bottom}: nothing drawn, or the pair is not a twin")
        return 1
    s, e = int(run[0]), int(run[1])
    crun = largest_run(np.where(diff[s:e + 1].mean(axis=0) >= 0.01)[0])
    c0, c1 = (int(crun[0]), int(crun[1])) if crun else (0, fw - 1)
    top_gap, bottom_gap = s / fh, (fh - 1 - e) / fh
    touches = {"top": s <= 2, "bottom": e >= fh - 3, "sides": c0 <= 2 or c1 >= fw - 3}
    edge = lambda gap, hit: "clipped" if hit else round(gap, 3)
    print(f"twin: frame rows {top}-{bottom} cols {left}-{right} | model rows {t + s}-{t + e} cols {l + c0}-{l + c1}"
          f" | top {edge(top_gap, touches['top'])} bottom {edge(bottom_gap, touches['bottom'])}"
          f" width {'overflow' if touches['sides'] else round((c1 - c0 + 1) / fw, 3)} fill {round((e - s + 1) / fh, 3)}"
          f" | precision about {round(2 / fh, 3)} of the frame (ledger fields: top, bottom, width)")
    return 0


def main(argv):
    if not argv or argv[0] not in ("find", "sheet", "twin"):
        print(__doc__.split("Usage:")[1].split("Needs")[0].rstrip(), file=sys.stderr)
        return 2
    if argv[0] == "find":
        return cmd_find(argv[1:]) or 0
    if argv[0] == "sheet":
        return cmd_sheet(argv[1], argv[2:]) or 0
    return cmd_twin(argv[1], argv[2])


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
