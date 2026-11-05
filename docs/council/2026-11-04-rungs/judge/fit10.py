# The projection's first verdict at the tenth report's pose (reports/20261105-0530 on origin/owner/reports).
# Inputs: blind10.json, the director's readings of the step-1 overlay-off twin (WoWScrnShot_110526_052834.jpg)
# frozen before any prediction was opened (owner ruling 1), and the shutter pose the client saved
# (reports/20261105-0530/FidelityEMatrix.lua, step 104 "1 Scene + twin", twin.pose). The camera is the
# judge's replica in proj.py, which reproduces every foot, top and depth the client recorded at steps 1,
# 10 and 11 (both shutters) to within 1e-12 UI units. Plain Python 3, no other package.
import os, sys, math, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from proj import build, proj

PX, PY, GZ, FACING, ZOOM = -8754.5, -102.5, 87.81278791393584, 4.635471820831299, 4.550000190734863
W, H = 1507.4736328125, 853.3333740234375
S = 1839 / W  # shot pixels per UI unit (the shots are 1839 x 1041)
HELD = 'G'    # chosen before any fitted residual was computed: the sharpest trunk base, the smallest precision over its height
# the matches, made after unsealing: blind label -> (placement, world point, scale, nominal height, origin uncertainty yd)
MATCH = {
    'C': ('westfallbarrel01 15.1 yd', (-8765.8, -112.5, 84.0), 1.00, 1.2, 0.15),
    'D': ('westfallcrate 16.3 yd', (-8766.0, -114.1, 83.7), 1.00, 1.0, 0.3),
    'B': ('gnolltent02 18.6 yd', (-8766.3, -116.9, 83.4), 1.00, 1.5, 1.0),
    'A': ('gnolltent02 72.1 yd', (-8766.8, -173.6, 83.5), 1.00, 1.5, 1.0),
    'K': ('elwynnbush09 87.6 yd', (-8789.0, -183.0, 81.5), 1.12, 2.5, 0.3),
    'L': ('elwynntreecanopy02 97.9 yd', (-8796.1, -191.2, 82.0), 1.10, 16.0, 0.5),
    'G': ('elwynntreemid01 92.6 yd', (-8758.4, -195.1, 85.5), 1.00, 14.0, 0.3),
    'F': ('elwynntreemid01 109.6 yd', (-8752.6, -212.1, 87.0), 1.03, 14.0, 0.3),
}
blind = {o['label']: o for o in json.load(open(os.path.join(HERE, 'blind10.json')))['scene']['objects']}

def ui(p): return (p[0] / S, (1041 - p[1]) / S)
def camera(th): return build(PX, PY, GZ, FACING + th[0], ZOOM, th[1], th[2], W, H)
def predict(th, k):
    c = camera(th)
    _, xyz, s, h, _ = MATCH[k]
    f = proj(c, *xyz)
    t = proj(c, xyz[0], xyz[1], xyz[2] + h * s)
    return (f[0], f[1]), f[2], abs(t[1] - f[1]), c['focal']
def sigma(th, k):
    _, depth, _, focal = predict(th, k)
    return math.hypot(blind[k]['foot_precision_px'] / S, MATCH[k][4] * focal / depth)
def resid(th, keys):
    r = []
    for k in keys:
        p, _, _, _ = predict(th, k)
        o = ui(blind[k]['foot_px'])
        sg = sigma(th, k)
        r += [(p[0] - o[0]) / sg, (p[1] - o[1]) / sg]
    return r
def solve(A, b):
    n = len(b)
    M = [A[i][:] + [b[i]] for i in range(n)]
    for i in range(n):
        piv = max(range(i, n), key=lambda r: abs(M[r][i]))
        M[i], M[piv] = M[piv], M[i]
        for r in range(n):
            if r != i:
                f = M[r][i] / M[i][i]
                M[r] = [a - f * c for a, c in zip(M[r], M[i])]
    return [M[i][n] / M[i][i] for i in range(n)]
def fit(keys, free, th0=(0.0, 0.35, 1.0)):
    th, lam = list(th0), 1e-3
    for _ in range(300):
        r = resid(th, keys)
        J = []
        for i in free:
            a, b = th[:], th[:]
            a[i] += 1e-6; b[i] -= 1e-6
            J.append([(x - y) / 2e-6 for x, y in zip(resid(a, keys), resid(b, keys))])
        A = [[sum(J[i][m] * J[j][m] for m in range(len(r))) for j in range(len(free))] for i in range(len(free))]
        g = [sum(J[i][m] * r[m] for m in range(len(r))) for i in range(len(free))]
        step = solve([[A[i][j] * (1 + lam if i == j else 1) for j in range(len(free))] for i in range(len(free))], [-x for x in g])
        tn = th[:]
        for j, i in enumerate(free): tn[i] += step[j]
        if sum(x * x for x in resid(tn, keys)) < sum(x * x for x in r):
            th, lam = tn, lam * 0.3
            if max(abs(x) for x in step) < 1e-10: break
        else:
            lam *= 10
    return th, sum(x * x for x in resid(th, keys))
def table(th, tag):
    print(tag)
    for k in MATCH:
        p, depth, hp, _ = predict(th, k)
        o = ui(blind[k]['foot_px'])
        dx, dy = (p[0] - o[0]) * S, -(p[1] - o[1]) * S  # shot pixels, y down
        print('   %s %-28s dx %+5.0f px dy %+5.0f px | height %4.0f px | residual/height %.3f (precision %.3f)%s' % (
            k, MATCH[k][0], dx, dy, hp * S, math.hypot(p[0] - o[0], p[1] - o[1]) / hp, (blind[k]['foot_precision_px'] / S) / hp, '  <- held out' if k == HELD else ''))
if __name__ == '__main__':
    table((0.0, 0.35, 1.0), 'the camera in use (saved default: pitch 0.35 rad, fovY 1.0 rad, yaw = facing):')
    keys = [k for k in MATCH if k != HELD]
    for name, free in (('pitch', (1,)), ('pitch and fovY', (1, 2)), ('pitch, fovY and a yaw offset', (0, 1, 2))):
        th, chi2 = fit(keys, free)
        print('\nfitted %s on %s: yaw offset %+.4f rad, pitch %.4f rad (%.1f deg), fovY %.4f rad (%.1f deg), chi2 %.1f for %d equations' % (
            name, ''.join(keys), th[0], th[1], math.degrees(th[1]), th[2], math.degrees(th[2]), chi2, 2 * len(keys)))
        table(th, '  residuals:')
    print('\nleave one out (pitch and fovY):')
    for k in MATCH:
        th, _ = fit([q for q in MATCH if q != k], (1, 2))
        p, depth, hp, _ = predict(th, k)
        o = ui(blind[k]['foot_px'])
        print('   out %s %-28s pitch %.4f fovY %.4f -> residual/height %.3f (precision %.3f)' % (k, MATCH[k][0], th[1], th[2], math.hypot(p[0] - o[0], p[1] - o[1]) / hp, (blind[k]['foot_precision_px'] / S) / hp))
