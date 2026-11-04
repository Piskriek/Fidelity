import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
sys.path.insert(0, HERE)
import math, sys
from proj import build, proj, nominal, load
from jac import cos, cond
rows = load(os.path.join(ROOT, 'FidelityEMatrix', 'Data', 'EMatrix_Data_Azeroth_tbc.lua'))
P = (-8766.5, -98.4, 88.7); W, H = 1507, 853
c0 = build(P[0], P[1], P[2], 4.09, 4.6, 0.35, 1.0, W, H)
pts = []
for fd, p, x, y, z, f, s in rows:
    d = math.hypot(x-P[0], y-P[1])
    if d > 70: continue
    r = proj(c0, x, y, z)
    if r and r[2] >= 1.0 and 0 <= r[0] <= W and 0 <= r[1] <= H and c0['focal']*nominal(p)*s/r[2] >= 14:
        pts.append((p.split('/')[-1], x, y, z, d))
print(len(pts), "on-screen drawable placements")
def screen(th, x, y, z):
    yaw, pitch, fov, zoom = th
    c = build(P[0], P[1], P[2], 4.09 + yaw, zoom, pitch, fov, W, H)
    return proj(c, x, y, z)
def jac(sel, free):
    th0 = [0.0, 0.35, 1.0, 4.6]; cols = []
    for k in free:
        h = 1e-5; tp = list(th0); tm = list(th0); tp[k] += h; tm[k] -= h; col = []
        for n, x, y, z, d in sel:
            a = screen(tp, x, y, z); b = screen(tm, x, y, z)
            col += [(a[0]-b[0])/(2*h), (a[1]-b[1])/(2*h)]
        cols.append(col)
    return cols
for label, sel in (("all on-screen", pts), ("near (<25 yd) on-screen", [q for q in pts if q[4] < 25]),
                   ("camp4 + barrel01 + wheelbarrow", [q for q in pts if q[4] < 21])):
    cols = jac(sel, [0, 1, 2])
    cols4 = jac(sel, [0, 1, 2, 3])
    print(f"{label} (n={len(sel)}): cos(yaw,fov)={cos(cols[0],cols[2]):.4f} cond(yaw,pitch,fov)={cond(cols):.1f} cond(+zoom)={cond(cols4):.0f} cos(fov,zoom)={cos(cols4[2],cols4[3]):.4f}")
