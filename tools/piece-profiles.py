#!/usr/bin/env python3
"""Builds PROF in app.js: a tiny silhouette (12 layer widths + height/width ratio) for every piece that has a 3D model,
so the loading printer can print the SAME piece the customer is looking at (pldP in app.js). Run from the repo root:
    python3 tools/piece-profiles.py          # rewrites the `const PROF=...;` line in app.js
Reads models/<id>.json (plain base64 int16 or packed dv1 + .bin). Vertical axis = Z, or Y when the MODELS entry has up:1.
Widths are the front-view (X) extent per layer, relative to the widest layer (0..100)."""
import base64, json, os, re
import numpy as np
N = 12
app = open('app.js', encoding='utf-8').read()
up = {m: True for m in re.findall(r'(\w+):\{file:"models/\w+\.json"[^}]*?\bup:1', app)}
def unvarint(buf, pos, n):
    out = np.empty(n, dtype=np.int64)
    for i in range(n):
        v = 0; s = 0
        while True:
            b = buf[pos]; pos += 1; v |= (b & 0x7f) << s; s += 7
            if not b & 0x80: break
        out[i] = -((v + 1) >> 1) if v & 1 else v >> 1
    return out, pos
def positions(d):
    if d.get('fmt') == 'dv1':
        buf = open(d['bin'], 'rb').read(); n = d['nv'] * 3
        dd, _ = unvarint(buf, 0, n)
        return np.cumsum(dd.reshape(3, -1), axis=1).T.astype(float) * d['scale']
    return np.frombuffer(base64.b64decode(d['pos']), dtype='<i2').reshape(-1, 3).astype(float) * d['scale']
prof = {}
for f in sorted(os.listdir('models')):
    if not f.endswith('.json'): continue
    i = f[:-5]; d = json.load(open('models/' + f, encoding='utf-8'))
    try: P = positions(d)
    except Exception as e: print('skip', i, e); continue
    if len(P) < 30: continue
    v = P[:, 1] if up.get(i) else P[:, 2]; x = P[:, 0]
    if (v.max() - v.min()) < 0.25 * (x.max() - x.min()) and (P[:, 1].max() - P[:, 1].min()) > 0.4 * (x.max() - x.min()): v = P[:, 1]   # flat plaque (wall board): show it standing
    lo, hi = v.min(), v.max(); H = hi - lo
    if H <= 0: continue
    edges = np.linspace(lo, hi, N + 1); w = []
    for k in range(N):
        pad = H / N * 0.75; m = (v >= edges[k] - pad) & (v <= edges[k + 1] + pad)
        w.append(float(x[m].max() - x[m].min()) if m.sum() > 2 else np.nan)
    w = np.array(w); ok = ~np.isnan(w)
    if not ok.any(): continue
    w = np.interp(np.arange(N), np.arange(N)[ok], w[ok])
    W = w.max(); wmax = x.max() - x.min()
    prof[i] = [round(float(H / wmax), 2)] + [int(round(100 * t / W)) for t in w]
js = 'const PROF=' + json.dumps(prof, separators=(',', ':')) + ';   /* piece silhouettes for the loading printer: [height/width, 12 layer widths %], built by tools/piece-profiles.py */'
if re.search(r'^const PROF=.*$', app, re.M): app = re.sub(r'^const PROF=.*$', lambda m: js, app, count=1, flags=re.M)
else: app = app.replace('const PLD_SVG=', js + '\nconst PLD_SVG=', 1)
open('app.js', 'w', encoding='utf-8').write(app)
print(len(prof), 'profiles,', len(js), 'bytes')
for k in ('cool', 'lamp', 'd2', 'hdclock', 'wilson'):
    if k in prof: print(k, prof[k])
