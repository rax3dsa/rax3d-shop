#!/usr/bin/env python3
"""Lossless re-encoding of the heavy 3D models (run from the repo root):  python3 tools/pack-models.py [min_gzip_kb]

models/<id>.json (base64 int16 positions + base64 index arrays) becomes a small JSON header + models/<id>.bin:
  positions: per-axis deltas (all x, then all y, then all z), indices: running deltas, every value as a zigzag varint.
The page decodes it in JS (decodeDV1 in app.js) into the same typed arrays, so the geometry is bit-for-bit identical, and
the file is 35-70 % smaller after the server's gzip. Models that are already packed (fmt = "dv1") and small ones are skipped.
Every file is decoded back here and compared before it is written."""
import base64, gzip, json, os, sys
import numpy as np
MIN = int(sys.argv[1]) if len(sys.argv) > 1 else 300
def zz(a):
    a = a.astype(np.int64); return np.where(a < 0, (-a << 1) - 1, a << 1)
def varint(a):
    out = bytearray()
    for v in zz(a).tolist():
        while v > 0x7f: out.append((v & 0x7f) | 0x80); v >>= 7
        out.append(v)
    return bytes(out)
def unvarint(buf, pos, n):
    out = np.empty(n, dtype=np.int64)
    for i in range(n):
        v = 0; s = 0
        while True:
            b = buf[pos]; pos += 1; v |= (b & 0x7f) << s; s += 7
            if not b & 0x80: break
        out[i] = -((v + 1) >> 1) if v & 1 else v >> 1
    return out, pos
tot0 = tot1 = 0
for f in sorted(os.listdir('models')):
    if not f.endswith('.json'): continue
    path = 'models/' + f; raw = open(path, encoding='utf-8').read(); d = json.loads(raw)
    if d.get('type') != 'mesh' or 'idx' not in d or d.get('fmt'): continue
    g0 = len(gzip.compress(raw.encode(), 9)) // 1024
    if g0 < MIN: continue
    u32 = bool(d.get('i32')); dt = '<u4' if u32 else '<u2'
    rd = lambda s: np.frombuffer(base64.b64decode(s), dtype=dt).astype(np.int64)
    pos = np.frombuffer(base64.b64decode(d['pos']), dtype='<i2').astype(np.int64); assert len(pos) % 3 == 0
    arrs = [rd(d['idx'])] + [rd(k['idx']) for k in (d.get('keeps') or [])]; has_keep = bool(d.get('keep'))
    if has_keep: arrs.append(rd(d['keep']))
    p3 = pos.reshape(-1, 3); pd = np.diff(p3, axis=0, prepend=0).T.reshape(-1)
    binary = varint(pd) + b''.join(varint(np.diff(a, prepend=0)) for a in arrs)
    # verify: decode exactly the way the page does
    q = 0; dd, q = unvarint(binary, q, len(pos)); chk = np.cumsum(dd.reshape(3, -1), axis=1).T.reshape(-1); assert (chk == pos).all(), f + ' positions'
    for a in arrs:
        dd, q = unvarint(binary, q, len(a)); assert (np.cumsum(dd) == a).all(), f + ' indices'
    assert q == len(binary)
    h = {k: v for k, v in d.items() if k not in ('pos', 'idx', 'keep', 'keeps')}
    h.update({'fmt': 'dv1', 'bin': 'models/' + f[:-5] + '.bin', 'nv': len(pos) // 3, 'ni': [len(a) for a in arrs], 'hasKeep': has_keep})
    if d.get('keeps'): h['keeps'] = [{k: v for k, v in kk.items() if k != 'idx'} for kk in d['keeps']]
    open('models/' + f[:-5] + '.bin', 'wb').write(binary); open(path, 'w', encoding='utf-8').write(json.dumps(h, ensure_ascii=False, separators=(',', ':')))
    g1 = (len(gzip.compress(binary, 9)) + len(gzip.compress(json.dumps(h).encode(), 9))) // 1024; tot0 += g0; tot1 += g1
    print(f'{f[:-5]:9} gzip {g0:5d} KB -> {g1:5d} KB  ({100 * g1 // g0}%)  verified')
print(f'total gzip {tot0} KB -> {tot1} KB ({100 * tot1 // max(tot0, 1)}%)')
