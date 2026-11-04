import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
sys.path.insert(0, HERE)
import math, sys
from proj import build, proj, nominal
P = (-8766.5, -98.4, 88.7); W, H = 1507, 853
pts = {
 'barrel':  (-8765.8, -112.5, 84.0), 'jar01': (-8765.9, -114.0, 83.8), 'crate': (-8766.0, -114.1, 83.7),
 'jar03':   (-8765.9, -114.5, 83.7), 'tent':  None, 'bush13': (-8779.2, -95.7, 86.2), 'tree': (-8780.6, -96.3, 85.8),
}
def screen(th, x, y, z):
    yaw, pitch, fov, zoom, look = th
    c = build(P[0], P[1], P[2] + (look - 2.0), 4.09 + yaw, zoom, pitch, fov, W, H)
    r = proj(c, x, y, z)
    return r
def jac(names, free):
    th0 = [0.0, 0.35, 1.0, 4.6, 2.0]
    cols = []
    for k in free:
        h = 1e-5
        tp = list(th0); tm = list(th0); tp[k] += h; tm[k] -= h
        col = []
        for n in names:
            a = screen(tp, *pts[n]); b = screen(tm, *pts[n])
            col += [(a[0]-b[0])/(2*h), (a[1]-b[1])/(2*h)]
        cols.append(col)
    return cols
def cos(a, b):
    return sum(x*y for x, y in zip(a, b)) / math.sqrt(sum(x*x for x in a) * sum(y*y for y in b))
def cond(cols):
    import itertools
    n = len(cols)
    # normalise columns, form Gram matrix, eigenvalues by Jacobi (small n)
    norm = [math.sqrt(sum(x*x for x in c)) for c in cols]
    U = [[x/norm[i] for x in c] for i, c in enumerate(cols)]
    G = [[sum(a*b for a, b in zip(U[i], U[j])) for j in range(n)] for i in range(n)]
    A = [row[:] for row in G]
    for _ in range(200):
        p, q, m = 0, 1, 0.0
        for i in range(n):
            for j in range(i+1, n):
                if abs(A[i][j]) > m: m, p, q = abs(A[i][j]), i, j
        if m < 1e-15: break
        th = 0.5*math.atan2(2*A[p][q], A[q][q]-A[p][p])
        c, s = math.cos(th), math.sin(th)
        for k in range(n):
            akp, akq = A[k][p], A[k][q]
            A[k][p], A[k][q] = c*akp - s*akq, s*akp + c*akq
        for k in range(n):
            apk, aqk = A[p][k], A[q][k]
            A[p][k], A[q][k] = c*apk - s*aqk, s*apk + c*aqk
    ev = sorted(A[i][i] for i in range(n))
    return ev[-1]/ev[0] if ev[0] > 0 else float('inf')
if __name__ == '__main__':
    labels = ['yaw', 'pitch', 'fov', 'zoom', 'look']
    for names in (['barrel','jar01','crate','jar03'], ['barrel','jar01','crate','jar03','bush13','tree']):
        print("points:", names)
        cols = jac(names, [0,1,2])
        print("  cos(yaw,fov)=%.4f cos(yaw,pitch)=%.4f cos(pitch,fov)=%.4f  cond(JtJ, normalised, yaw+pitch+fov)=%.1f" % (cos(cols[0],cols[2]), cos(cols[0],cols[1]), cos(cols[1],cols[2]), cond(cols)))
        cols2 = jac(names, [1,2])
        print("  pitch+fov only (yaw pinned): cos=%.4f cond=%.1f" % (cos(cols2[0], cols2[1]), cond(cols2)))
        cols3 = jac(names, [0,1,2,3])
        print("  yaw+pitch+fov+zoom cond=%.1f; cos(fov,zoom)=%.4f" % (cond(cols3), cos(cols3[2], cols3[3])))
    # pitch monotonicity of feet (screen y) and of code height for barrel, crate, bush
    lo = math.atan(0.6/4.6)
    print("pitch range", round(lo,3), "1.4")
    for n in ('barrel', 'crate', 'bush13'):
        ys = []; hs = []
        for i in range(0, 101):
            p = lo + (1.4-lo)*i/100
            c = build(P[0], P[1], P[2], 4.09, 4.6, p, 1.0, W, H)
            r = proj(c, *pts[n])
            ys.append(r[1] if r else None)
            hs.append(c['focal']*1.2/r[2] if r else None)
        mono_y = all(ys[i+1] > ys[i] for i in range(100) if ys[i] is not None and ys[i+1] is not None)
        print(f"  {n}: foot y from {ys[0]:.1f} to {ys[-1]:.1f}, strictly increasing={mono_y}; code height (h=1.2) {hs[0]:.1f} min {min(hs):.1f} end {hs[-1]:.1f}")
