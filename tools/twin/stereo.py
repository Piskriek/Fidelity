#!/usr/bin/env python3
"""tools/twin/stereo.py - 3D you can see on any screen, no glasses: from the Fidelity Twin's renders.

  magic  DEPTH.png OUT.png   A Magic Eye picture (an autostereogram): one patterned image that hides the depth
                             map. Look "through" the screen, as if at something far behind it, until the two dots
                             at the top become three: the scene comes out in depth.
                             --cross makes it for crossed eyes instead. --period (px between pattern repeats,
                             default 120) and --strength (how far near things come out, default 0.3).
  pair   LEFT.png RIGHT.png OUTPREFIX
                             A side-by-side pair for crossed eyes (OUTPREFIX-cross.png: the right eye's view on the
                             left), one for parallel viewing (-parallel.png) and a red/cyan anaglyph (-anaglyph.png).

DEPTH.png is the twin's ?view=depth render (near white, far black); LEFT and RIGHT are its ?eye=L and ?eye=R renders.
Needs Pillow and numpy. Writes only the files it is given.
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter


def pattern_tile(period, height, seed=7):
    """A tile of bold, saturated colour blobs (about 3 px across): the eyes lock onto it more easily than fine noise.
    It wraps horizontally, so the repeats join without a seam."""
    rng = np.random.default_rng(seed)
    small = rng.random((height // 3 + 2, period // 3, 3))
    small = np.concatenate([small, small[:, :1]], axis=1)  # wrap the last column into the first
    tile = Image.fromarray((small * 255).astype(np.uint8), 'RGB').resize((period + 3, (height // 3 + 2) * 3), Image.BICUBIC)
    a = np.asarray(tile).astype(np.float32)[:height, :period]
    a = (a - a.min(axis=(0, 1))) / np.maximum(np.ptp(a, axis=(0, 1)), 1)  # stretch each channel to the full range
    return (25 + 230 * a).astype(np.uint8)


def magic_eye(depth, period=120, strength=0.3, cross=False):
    """The symmetric single-image stereogram (Thimbleby, Inglis and Witten, 1994): each point of the depth map links
    two pixels, centred on it, `separation` apart; linked pixels share a colour. The separation shrinks where the scene
    is near, so the two eyes, each fixed on a different repeat of the pattern, see that point nearer. Centring the
    pair keeps the hidden scene where it is in the depth map; the links are chained so that no pixel is pulled two
    ways. depth: floats 0 (far) to 1 (near)."""
    h, w = depth.shape
    d = 1.0 - depth if cross else depth
    sep = np.rint(period * (1.0 - strength * d)).astype(np.int64)
    tile = pattern_tile(period, h)
    out = np.zeros((h, w, 3), np.uint8)
    for y in range(h):
        same = list(range(w))
        srow = sep[y]
        for x in range(w):
            s = int(srow[x])
            left = x - s // 2
            right = left + s
            if 0 <= left and right < w:
                k = same[left]
                while k != left and k != right:  # follow the existing chain so the two links agree
                    if k < right:
                        left = k
                    else:
                        left, right = right, k
                    k = same[left]
                same[left] = right
        row, t = out[y], tile[y]
        for x in range(w - 1, -1, -1):
            row[x] = t[x % period] if same[x] == x else row[same[x]]
    return out


def guide_dots(img, period):
    """Two dots one background separation apart: when the eyes fuse the picture, they show as three."""
    draw = ImageDraw.Draw(img)
    cx, y, r = img.width // 2, 14, 6
    for x in (cx - period // 2, cx + period // 2):
        draw.ellipse((x - r, y - r, x + r, y + r), fill=(0, 0, 0), outline=(255, 255, 255), width=2)
    return img


def cmd_magic(argv):
    src, out = argv[0], argv[1]
    opts = dict(period=120, strength=0.3, cross=False)
    i = 2
    while i < len(argv):
        a = argv[i]
        if a == '--cross': opts['cross'] = True
        elif a == '--period': opts['period'] = int(argv[i + 1]); i += 1
        elif a == '--strength': opts['strength'] = float(argv[i + 1]); i += 1
        else: raise SystemExit(f'stereo magic: unknown option {a}')
        i += 1
    g = np.asarray(Image.open(src).convert('L')).astype(np.float32) / 255.0
    g = np.asarray(Image.fromarray((g * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.0))).astype(np.float32) / 255.0  # soften edges: fewer echoes
    img = Image.fromarray(magic_eye(g, **opts), 'RGB')
    guide_dots(img, opts['period']).save(out)
    print(f'stereo: {out} ({img.width}x{img.height}, period {opts["period"]} px, strength {opts["strength"]}, {"crossed" if opts["cross"] else "parallel"} viewing)')


def cmd_pair(argv):
    left, right, prefix = Image.open(argv[0]).convert('RGB'), Image.open(argv[1]).convert('RGB'), argv[2]
    w, h, gap = left.width, left.height, 24
    for name, (a, b) in (('cross', (right, left)), ('parallel', (left, right))):
        sheet = Image.new('RGB', (2 * w + gap, h), (16, 16, 16))
        sheet.paste(a, (0, 0)); sheet.paste(b, (w + gap, 0))
        sheet.save(f'{prefix}-{name}.png')
    L, R = np.asarray(left.convert('L')), np.asarray(right.convert('L'))
    Image.fromarray(np.dstack([L, R, R]), 'RGB').save(f'{prefix}-anaglyph.png')  # red left, cyan right
    print(f'stereo: {prefix}-cross.png, {prefix}-parallel.png, {prefix}-anaglyph.png')


def selftest():
    """A raised square must come out nearer: pixels around it repeat at the shorter separation, the background at the
    longer one, and the pairs are centred on the point they show."""
    d = np.zeros((40, 400), np.float32)
    d[10:30, 150:250] = 1.0
    img = magic_eye(d, period=60, strength=0.5)
    far_ok = all((img[5, x] == img[5, x + 60]).all() for x in range(0, 340))
    near_ok = all((img[20, x - 15] == img[20, x + 15]).all() for x in range(165, 235))
    assert far_ok and near_ok, (far_ok, near_ok)
    print('stereo: selftest ok (the background repeats every 60 px, the raised square every 30 px, centred on it)')


if __name__ == '__main__':
    if len(sys.argv) >= 2 and sys.argv[1] == 'selftest': selftest()
    elif len(sys.argv) >= 4 and sys.argv[1] == 'magic': cmd_magic(sys.argv[2:])
    elif len(sys.argv) >= 5 and sys.argv[1] == 'pair': cmd_pair(sys.argv[2:])
    else: print(__doc__); sys.exit(2)
