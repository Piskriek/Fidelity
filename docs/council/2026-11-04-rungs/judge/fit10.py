# The projection's first verdict at the tenth report's pose (reports/20261105-0530 on origin/owner/reports).
# Inputs: blind10_scene.json, the director's readings of the step-1 overlay-off twin (WoWScrnShot_110526_052834.jpg),
# frozen before any prediction was opened (owner ruling 1; its SHA256 cca1df12... was printed in the director's
# session at 03:42:10Z, before the saved predictions were read, and the file is committed byte-identical), and the
# shutter pose the client saved (reports/20261105-0530/FidelityEMatrix.lua, step 104 "1 Scene + twin", twin.pose).
# The placements are the map data's own (FidelityEMatrix/Data/EMatrix_Data_Azeroth_tbc.lua, read by proj.load), and
# the camera is the judge's replica in proj.py: with them the barrel's predicted foot is the one the client recorded.
# Plain Python 3, no other package.
import os, sys, math, json
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
sys.path.insert(0, HERE)
from proj import build, proj, load, nominal

PX, PY, GZ, FACING, ZOOM = -8754.5, -102.5, 87.81278791393584, 4.635471820831299, 4.550000190734863
W, H = 1507.4736328125, 853.3333740234375
S = 1839 / W  # shot pixels per UI unit (the shots are 1839 x 1041)
DEFAULT = (0.0, 0.35, 1.0)  # yaw offset, pitch, fovY: the camera in use (the saved defaults)
CLIENT_FOOT_C = (1243.866865, 346.284760)  # the barrel's foot as the client recorded it at step 1 (UI units)
HELD = 'G'  # chosen before any fitted residual was computed: the sharpest trunk base, the smallest precision over its height
# The blind reader's own error: after unsealing, a pixel check put the two sapling trunks 9.5 px (G) and 7 px (F)
# from their blind feet, against a stated 3 px. Every blind foot therefore carries at least this precision.
READ_FLOOR_PX = 10
# the matches, made after unsealing: blind label -> (file, approximate x, y to find the placement, origin uncertainty yd)
MATCH = {
    'C': ('westfallbarrel01', -8765.8, -112.5, 0.15),
    'D': ('westfallcrate', -8766.0, -114.1, 0.3),
    'B': ('gnolltent02', -8766.3, -116.9, 1.0),
    'A': ('gnolltent02', -8766.8, -173.6, 1.0),
    'K': ('elwynnbush09', -8789.0, -183.0, 0.3),
    'L': ('elwynntreecanopy02', -8796.1, -191.2, 0.5),
    'G': ('elwynntreemid01', -8758.4, -195.1, 0.3),
    'F': ('elwynntreemid01', -8752.6, -212.1, 0.3),
}
DATA = load(os.path.join(ROOT, 'FidelityEMatrix', 'Data', 'EMatrix_Data_Azeroth_tbc.lua'))
def placement(file, x, y):
    hits = sorted(set((e[2], e[3], e[4], e[6], e[1]) for e in DATA if e[1].split('/')[-1] == file + '.m2' and abs(e[2] - x) < 0.06 and abs(e[3] - y) < 0.06))
    assert len(hits) == 1, (file, x, y, hits)
    return hits[0]
PLACE = {k: placement(f, x, y) for k, (f, x, y, _) in MATCH.items()}
blind = {o['label']: o for o in json.load(open(os.path.join(HERE, 'blind10_scene.json')))['objects']}

def ui(p): return (p[0] / S, (1041 - p[1]) / S)
def camera(th): return build(PX, PY, GZ, FACING + th[0], ZOOM, th[1], th[2], W, H)
def predict(th, k):
    c = camera(th)
    x, y, z, s, path = PLACE[k]
    f = proj(c, x, y, z)
    t = proj(c, x, y, z + nominal(path) * s)
    return (f[0], f[1]), f[2], abs(t[1] - f[1]), c['focal']
def reading_px(k): return max(blind[k]['foot_precision_px'], READ_FLOOR_PX)
def precision(th, k):  # the reading's precision over the prop's projected height (what the verdict uses)
    _, _, hp, _ = predict(th, k)
    return (reading_px(k) / S) / hp
def sigma(th, k):  # the fit's weight: the reading and the origin uncertainty
    _, depth, _, focal = predict(th, k)
    return math.hypot(reading_px(k) / S, MATCH[k][3] * focal / depth)
def residual(th, k):
    p, _, hp, _ = predict(th, k)
    o = ui(blind[k]['foot_px'])
    return math.hypot(p[0] - o[0], p[1] - o[1]) / hp
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
def fit(keys, free, th0=DEFAULT):
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
def decide(r, p, tau=0.1):
    return 'pass' if r + p <= tau else 'fail' if r - p > tau else 'undecided'
def table(th, tag):
    print(tag)
    for k in MATCH:
        p, depth, hp, _ = predict(th, k)
        o = ui(blind[k]['foot_px'])
        dx, dy = (p[0] - o[0]) * S, -(p[1] - o[1]) * S  # predicted minus read, shot pixels, y down
        r, pr = residual(th, k), precision(th, k)
        print('   %s %-20s %5.1f yd  dx %+5.0f px dy %+5.0f px | height %4.0f px | residual/height %.3f precision %.3f -> %s%s' % (
            k, MATCH[k][0], depth, dx, dy, hp * S, r, pr, decide(r, pr), '  <- held out' if k == HELD else ''))
if __name__ == '__main__':
    fc, _, _, _ = predict(DEFAULT, 'C')
    assert abs(fc[0] - CLIENT_FOOT_C[0]) < 1e-3 and abs(fc[1] - CLIENT_FOOT_C[1]) < 1e-3, ('the replica must give the client\'s recorded foot', fc)
    print('the barrel\'s foot at the camera in use: replica (%.6f, %.6f), client (%.6f, %.6f)' % (fc[0], fc[1], *CLIENT_FOOT_C))
    table(DEFAULT, 'the camera in use (saved default: pitch 0.35 rad, fovY 1.0 rad, yaw = facing):')
    keys = [k for k in MATCH if k != HELD]
    for name, free in (('pitch', (1,)), ('pitch and fovY', (1, 2)), ('pitch, fovY and a yaw offset', (0, 1, 2))):
        th, chi2 = fit(keys, free)
        print('\nfitted %s on %s: yaw offset %+.4f rad, pitch %.4f rad (%.2f deg), fovY %.4f rad (%.2f deg), chi2 %.1f for %d equations' % (
            name, ''.join(keys), th[0], th[1], math.degrees(th[1]), th[2], math.degrees(th[2]), chi2, 2 * len(keys)))
        table(th, '  residuals:')
    print('\nleave one out (pitch and fovY):')
    for k in MATCH:
        th, _ = fit([q for q in MATCH if q != k], (1, 2))
        r, pr = residual(th, k), precision(th, k)
        print('   out %s %-20s pitch %.4f fovY %.4f -> residual/height %.3f precision %.3f -> %s' % (k, MATCH[k][0], th[1], th[2], r, pr, decide(r, pr)))
