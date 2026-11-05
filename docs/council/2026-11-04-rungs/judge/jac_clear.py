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
        sx, sy = r[0]*1851/W, 1048 - r[1]*1048/H
        # chat box region in the step-1/2 shots ~ x < 600, y > 540 (shot px); HUD box ~ x 1506-1788, y 306-446
        chat = sx < 600 and sy > 540
        hud = 1500 <= sx <= 1790 and 300 <= sy <= 450
        pts.append((p.split('/')[-1], x, y, z, d, chat, hud, sx, sy))
def screen(th, x, y, z):
    yaw, pitch, fov = th
    c = build(P[0], P[1], P[2], 4.09 + yaw, 4.6, pitch, fov, W, H)
    return proj(c, x, y, z)
def jac(sel):
    th0 = [0.0, 0.35, 1.0]; cols = []
    for k in range(3):
        h = 1e-5; tp = list(th0); tm = list(th0); tp[k] += h; tm[k] -= h; col = []
        for q in sel:
            a = screen(tp, *q[1:4]); b = screen(tm, *q[1:4])
            col += [(a[0]-b[0])/(2*h), (a[1]-b[1])/(2*h)]
        cols.append(col)
    return cols
clear = [q for q in pts if not q[5] and not q[6]]
for q in pts: print(f"{q[0]:28s} {q[4]:5.1f}yd shot {q[7]:6.0f},{q[8]:5.0f} {'CHAT' if q[5] else ''}{'HUD' if q[6] else ''}")
for label, sel in (("clear of chat and HUD", clear), ("clear, near only (<25 yd)", [q for q in clear if q[4] < 25])):
    if len(sel) >= 2:
        cols = jac(sel)
        print(f"{label} n={len(sel)}: cos(yaw,fov)={cos(cols[0],cols[2]):.3f} cos(yaw,pitch)={cos(cols[0],cols[1]):.3f} cos(pitch,fov)={cos(cols[1],cols[2]):.3f} cond={cond(cols):.1f}")
