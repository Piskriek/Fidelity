import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
sys.path.insert(0, HERE)
import math, sys
from proj import build, proj, nominal, load
rows = load(os.path.join(ROOT, 'FidelityEMatrix', 'Data', 'EMatrix_Data_Azeroth_tbc.lua'))
P = (-8766.5, -98.4, 88.7)
facing = float(sys.argv[1]) if len(sys.argv) > 1 else 4.09
W, H = 1507, 853
c = build(P[0], P[1], P[2], facing, 4.6, 0.35, 1.0, W, H)
print("focal %.1f" % c['focal'])
inr, drawn = [], []
for fd, p, x, y, z, f, s in rows:
    d = math.hypot(x-P[0], y-P[1])
    if d > 70: continue
    inr.append(p)
    r = proj(c, x, y, z)
    name = p.split('/')[-1]
    if r and r[2] >= 1.0 and -200 < r[0] < W + 200:
        hpx = c['focal']*nominal(p)*s/r[2]
        if hpx >= 14:
            drawn.append((d, name, x, y, z, r[0], r[1], r[2], hpx, s))
drawn.sort()
print(len(inr), "placements within 70 yd;", len(drawn), "drawable (scan culling)")
for d, name, x, y, z, sx, sy, dep, hpx, s in drawn:
    on = "ON " if 0 <= sx <= W else "off"
    print(f"{on} {d:5.1f}yd {name:28s} UI {sx:7.1f},{sy:6.1f} depth {dep:5.1f} h {min(hpx, 2*H):6.0f}px scale {s:.2f} | shot px {sx*1851/W:6.0f},{1048 - sy*1048/H:6.0f}")
