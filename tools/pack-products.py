#!/usr/bin/env python3
"""Owner's standing order (11-14): every time 20 NEW products have been added to the shop, send him ONE zip (split in parts of ~60 MB if big)
with one folder per product:  <site name>/<site name>.3mf|.stl  +  <site name>/<site name>.jpg  (the product photo).

  python3 tools/pack-products.py --new            # products in app.js that are not in tools/products-baseline.json
  python3 tools/pack-products.py --ids a,b,c      # explicit ids
  python3 tools/pack-products.py --count          # only print how many new products there are (the order triggers at 20)

Options: --data ../rax3d-data/files   (private data repo, original 3MF files)   --out /tmp/pack   --part-mb 60
Source of the model file per product, first hit wins: files/<id>.3mf in the data repo, files/<id>.stl, else an STL exported from models/<id>.json
(the shop's own 3D model; same scale, parts merged, sits on the bed). Needs numpy and Pillow.
After the zips are sent to the owner: add the sent ids to tools/products-baseline.json and commit (so the count restarts)."""
import argparse, base64, json, os, re, shutil, struct, sys, zipfile
import numpy as np
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser()
ap.add_argument('--new', action='store_true'); ap.add_argument('--count', action='store_true'); ap.add_argument('--ids', default='')
ap.add_argument('--data', default=os.path.join(ROOT, '..', 'rax3d-data', 'files')); ap.add_argument('--out', default='/tmp/rax3d-pack')
ap.add_argument('--part-mb', type=float, default=60)
A = ap.parse_args()
app = open(os.path.join(ROOT, 'app.js'), encoding='utf-8').read()
items = re.findall(r'\{id:"([a-z0-9]+)",cat:"[^"]*",name:"([^"]*)"', app)
base = set(json.load(open(os.path.join(ROOT, 'tools', 'products-baseline.json')))['delivered'])
new = [i for i, _ in items if i not in base]
if A.count:
    print(f'{len(items)} products in the shop, {len(new)} new since the last pack (the order triggers at 20)'); sys.exit()
ids = [x for x in A.ids.split(',') if x] if A.ids else new
names = dict(items); dup = {}
for i, n in items: dup.setdefault(n, []).append(i)   # duplicates are judged against ALL shop names
def folder_name(i):   # same-named designs (e.g. two sizes) get a suffix, never the same folder
    n = names[i]
    return n if len(dup[n]) == 1 else f'{n} {i}'
def decode_model(i):
    d = json.load(open(os.path.join(ROOT, 'models', f'{i}.json'))); dec = lambda s, t: np.frombuffer(base64.b64decode(s), dtype=t).astype(np.int64)
    if d.get('fmt') == 'dv1':
        u = open(os.path.join(ROOT, d['bin']), 'rb').read(); p = 0
        def rv():
            nonlocal p
            v = 0; s = 0
            while True:
                b = u[p]; p += 1; v |= (b & 127) << s; s += 7
                if not b & 128: break
            return -((v + 1) >> 1) if v & 1 else v >> 1
        n = d['nv'] * 3; pos = np.zeros(n, np.int64)
        for ax in range(3):
            a = 0
            for k in range(ax, n, 3): a += rv(); pos[k] = a
        arrs = []
        for c in d['ni']:
            o = np.zeros(c, np.int64); a = 0
            for k in range(c): a += rv(); o[k] = a
            arrs.append(o)
        idx = np.concatenate(arrs)
    else:
        pos = np.frombuffer(base64.b64decode(d['pos']), '<i2').astype(np.int64); t = '<u4' if d.get('i32') else '<u2'
        idx = [dec(d['idx'], t)] + [dec(k['idx'], t) for k in (d.get('keeps') or [])] + ([dec(d['keep'], t)] if d.get('keep') else []); idx = np.concatenate(idx)
    v = pos.reshape(-1, 3) * d['scale']; sel = v[np.unique(idx)]; mn = sel.min(0); ext = sel.max(0) - mn
    return v - np.array([mn[0] + ext[0] / 2, mn[1] + ext[1] / 2, mn[2]]), idx
def write_stl(path, v, idx):
    t = v[idx.reshape(-1, 3)].astype('<f4'); n = np.cross(t[:, 1] - t[:, 0], t[:, 2] - t[:, 0]); l = np.linalg.norm(n, axis=1, keepdims=True); n = (n / np.where(l == 0, 1, l)).astype('<f4')
    r = np.zeros(len(t), dtype=[('n', '<f4', 3), ('v', '<f4', (3, 3)), ('a', '<u2')]); r['n'] = n; r['v'] = t
    open(path, 'wb').write(b'RAX3D'.ljust(80, b'\0') + struct.pack('<I', len(t)) + r.tobytes())
shutil.rmtree(A.out, ignore_errors=True); top = os.path.join(A.out, 'RAX3D-Products'); os.makedirs(top)
rows = []
for i in ids:
    fn = re.sub(r'[\\/:*?"<>|]', '-', folder_name(i)).strip().rstrip('.'); fd = os.path.join(top, fn); os.makedirs(fd)
    src3 = os.path.join(A.data, f'{i}.3mf'); srcs = os.path.join(A.data, f'{i}.stl')
    if os.path.exists(src3): shutil.copyfile(src3, os.path.join(fd, fn + '.3mf')); kind = '3mf (original)'
    elif os.path.exists(srcs): shutil.copyfile(srcs, os.path.join(fd, fn + '.stl')); kind = 'stl (data repo)'
    else: v, idx = decode_model(i); write_stl(os.path.join(fd, fn + '.stl'), v, idx); kind = 'stl (exported from the shop 3D model)'
    Image.open(os.path.join(ROOT, 'hq', f'{i}-0.webp')).convert('RGB').save(os.path.join(fd, fn + '.jpg'), quality=92)
    rows.append((i, fn, kind, sum(os.path.getsize(os.path.join(fd, f)) for f in os.listdir(fd))))
parts = [[]]; cur = 0
for r in rows:
    if cur + r[3] > A.part_mb * 1048576 and parts[-1]: parts.append([]); cur = 0
    parts[-1].append(r); cur += r[3]
for k, b in enumerate(parts, 1):
    zp = os.path.join(A.out, f'RAX3D-products-part{k}.zip')
    with zipfile.ZipFile(zp, 'w', zipfile.ZIP_STORED) as z:
        for _, fn, _, _ in b:
            for f in os.listdir(os.path.join(top, fn)): z.write(os.path.join(top, fn, f), f'RAX3D-Products/{fn}/{f}')
    print(zp, len(b), 'folders', round(os.path.getsize(zp) / 1048576, 1), 'MB')
for r in rows: print(r[0], '->', r[1], '|', r[2])
