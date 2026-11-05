# Independent replica of EMatrix_Math.BuildCamera / ProjectPoint and Terrain Scan culling (judge check).
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
sys.path.insert(0, HERE)
import math, re, sys
HEAD = 2.0
def build(px, py, pz, facing, zoom, pitch, fovY, W, H):
    cf, sf, cp, sp = math.cos(facing), math.sin(facing), math.cos(pitch), math.sin(pitch)
    fx, fy, fz = cf*cp, sf*cp, -sp
    rx, ry, rz = sf, -cf, 0.0
    ux, uy, uz = ry*fz - rz*fy, rz*fx - rx*fz, rx*fy - ry*fx
    tx, ty, tz = px, py, pz + HEAD
    return dict(cx=tx-fx*zoom, cy=ty-fy*zoom, cz=tz-fz*zoom, fx=fx, fy=fy, fz=fz, rx=rx, ry=ry, rz=rz,
                ux=ux, uy=uy, uz=uz, focal=(H*0.5)/math.tan(fovY*0.5), w=W, h=H)
def proj(c, x, y, z):
    dx, dy, dz = x-c['cx'], y-c['cy'], z-c['cz']
    d = dx*c['fx'] + dy*c['fy'] + dz*c['fz']
    if d <= 0.05: return None
    sx = c['w']*0.5 + (dx*c['rx'] + dy*c['ry'] + dz*c['rz'])/d*c['focal']
    sy = c['h']*0.5 + (dx*c['ux'] + dy*c['uy'] + dz*c['uz'])/d*c['focal']
    return sx, sy, d
RULES = [("canopy",16),("tree",14),("bush",2.5),("shrub",2),("rock",3),("stone",2.5),("fence",1.5),("lamp",4),("post",2),("crate",1),("barrel",1.2),("jar",0.7)]
def nominal(p):
    p = p.lower()
    for k, h in RULES:
        if k in p: return h
    return 1.5
def load(path):
    src = open(path).read()
    pat = re.compile(r'\{(\d+),"([^"]+\.m2)",(-?[\d.]+),(-?[\d.]+),(-?[\d.]+),(-?[\d.]+),(-?[\d.]+)\}')
    out = []
    for m in pat.finditer(src):
        fd, p, x, y, z, f, s = m.groups()
        out.append((int(fd), p, float(x), float(y), float(z), float(f), float(s)))
    return out
