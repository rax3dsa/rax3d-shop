#!/usr/bin/env python3
"""Static AR files for iPhone Quick Look:  python3 tools/build-usdz.py <app-data.json> [id ...]
iOS opens Quick Look reliably from a real https .usdz URL (not from a blob built on the phone), so every piece with a 3D model gets ar/<id>.usdz
(default colour, real size from DIM, binary USD, ARKit-compliant). <app-data.json> = {MODELS, DIM, COLORS} dumped from the page by tools/dump-app-data.js.
Needs: pip install usd-core numpy. Run it again after adding or changing a model."""
import base64, json, os, sys, tempfile, shutil
import numpy as np
from pxr import Usd, UsdGeom, UsdShade, Sdf, Gf, UsdUtils, Vt

def unvarint(buf, pos, n):
    out = np.empty(n, dtype=np.int64)
    for i in range(n):
        v = 0; s = 0
        while True:
            b = buf[pos]; pos += 1; v |= (b & 0x7f) << s; s += 7
            if not b & 0x80: break
        out[i] = -((v + 1) >> 1) if v & 1 else v >> 1
    return out, pos

def load_model(path):
    h = json.load(open(path, encoding='utf-8')); sc = h.get('scale', 0.01)
    if h.get('type') == 'ring-grid':
        q = np.frombuffer(base64.b64decode(h['pos']), '<i2').astype(np.float64).reshape(-1, 3) * sc
        R, n = h['rings'], h['n']; cen = len(q); pos = np.vstack([q, [[0.0, 0.0, 0.0]]])   # centre vertex at the origin, as in ringGrid()
        idx = []
        for l in range(R - 1):
            for k in range(n):
                a = l * n + k; b = l * n + (k + 1) % n; c = a + n; e = b + n
                idx += [a, c, b, b, c, e]
        for k in range(n): idx += [cen, k, (k + 1) % n]
        return pos, [(np.array(idx, np.int64), None)]
    if h.get('fmt') == 'dv1':
        buf = open(os.path.join(os.path.dirname(path), '..', h['bin']), 'rb').read(); nv = h['nv']; p = 0
        pos = np.empty(nv * 3, np.int64)
        for ax in range(3):
            d, p = unvarint(buf, p, nv); pos[ax::3] = np.cumsum(d)
        arrs = []
        for c in h['ni']:
            d, p = unvarint(buf, p, c); arrs.append(np.cumsum(d))
    else:
        pos = np.frombuffer(base64.b64decode(h['pos']), '<i2').astype(np.int64)
        dt = '<u4' if h.get('i32') else '<u2'
        arrs = [np.frombuffer(base64.b64decode(h['idx']), dt).astype(np.int64)]
        for k in h.get('keeps') or []: arrs.append(np.frombuffer(base64.b64decode(k['idx']), dt).astype(np.int64))
        if h.get('keep'): arrs.append(np.frombuffer(base64.b64decode(h['keep']), dt).astype(np.int64))
    pos = pos.astype(np.float64).reshape(-1, 3) * sc
    parts = [(arrs[0], None)]
    for i, k in enumerate(h.get('keeps') or []): parts.append((arrs[1 + i], k.get('color') or '#ffffff'))
    if h.get('hasKeep'): parts.append((arrs[-1], h.get('keepColor') or '#ffffff'))
    return pos, parts

def lin(hexs):
    h = hexs.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return Gf.Vec3f(*[(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4) for x in c])

def build(mid, spec, dim, colors, out):
    pos, parts = load_model(spec['file'])
    if not spec.get('up'): pos = np.stack([pos[:, 0], pos[:, 2], -pos[:, 1]], 1)   # Z-up print files -> Y-up, same as the viewer
    real = max(dim) / 1000.0; size = pos.max(0) - pos.min(0); k = real / max(size)
    c = (pos.max(0) + pos.min(0)) / 2; pos = (pos - c) * k; pos[:, 1] -= pos[:, 1].min()
    d = tempfile.mkdtemp(); usdc = os.path.join(d, 'model.usdc')
    st = Usd.Stage.CreateNew(usdc); UsdGeom.SetStageUpAxis(st, UsdGeom.Tokens.y); UsdGeom.SetStageMetersPerUnit(st, 1.0)
    root = UsdGeom.Xform.Define(st, '/Root'); st.SetDefaultPrim(root.GetPrim())
    di = spec.get('def'); main_hex = colors[di][1] if di and colors[di][1] else '#cfcfcf'
    for i, (idx, hexs) in enumerate(parts):
        hx = hexs or main_hex
        tri = idx.reshape(-1, 3); used = np.unique(tri); remap = -np.ones(len(pos), np.int64); remap[used] = np.arange(len(used)); p = pos[used]; t = remap[tri]
        # smooth area-weighted normals
        v0, v1, v2 = p[t[:, 0]], p[t[:, 1]], p[t[:, 2]]; fn = np.cross(v1 - v0, v2 - v0); nrm = np.zeros_like(p)
        for j in range(3): np.add.at(nrm, t[:, j], fn)
        ln = np.linalg.norm(nrm, axis=1); ln[ln == 0] = 1; nrm /= ln[:, None]
        m = UsdGeom.Mesh.Define(st, f'/Root/Part{i}')
        m.CreatePointsAttr(Vt.Vec3fArray.FromNumpy(p.astype(np.float32))); m.CreateFaceVertexCountsAttr(Vt.IntArray.FromNumpy(np.full(len(t), 3, np.int32)))
        m.CreateFaceVertexIndicesAttr(Vt.IntArray.FromNumpy(t.reshape(-1).astype(np.int32)))
        m.CreateNormalsAttr(Vt.Vec3fArray.FromNumpy(nrm.astype(np.float32))); m.SetNormalsInterpolation(UsdGeom.Tokens.vertex)
        m.CreateSubdivisionSchemeAttr('none'); m.CreateDoubleSidedAttr(True)
        mat = UsdShade.Material.Define(st, f'/Root/Materials/M{i}'); sh = UsdShade.Shader.Define(st, f'/Root/Materials/M{i}/PreviewSurface'); sh.CreateIdAttr('UsdPreviewSurface')
        sh.CreateInput('diffuseColor', Sdf.ValueTypeNames.Color3f).Set(lin(hx)); sh.CreateInput('roughness', Sdf.ValueTypeNames.Float).Set(0.5); sh.CreateInput('metallic', Sdf.ValueTypeNames.Float).Set(0.0)
        mat.CreateSurfaceOutput().ConnectToSource(sh.ConnectableAPI(), 'surface')
        UsdShade.MaterialBindingAPI.Apply(m.GetPrim()).Bind(mat)
    st.GetRootLayer().Save()
    ok = UsdUtils.CreateNewARKitUsdzPackage(Sdf.AssetPath(usdc), out)
    shutil.rmtree(d, ignore_errors=True)
    return ok

if __name__ == '__main__':
    meta = json.load(open(sys.argv[1])); only = set(sys.argv[2:]); os.makedirs('ar', exist_ok=True); tot = 0
    for mid, spec in meta['MODELS'].items():
        if only and mid not in only: continue
        if mid not in meta['DIM']: print('skip (no DIM)', mid); continue
        out = f'ar/{mid}.usdz'
        try: ok = build(mid, spec, meta['DIM'][mid], meta['COLORS'], out)
        except Exception as e: print('FAIL', mid, e); continue
        sz = os.path.getsize(out) if os.path.exists(out) else 0; tot += sz; print(f'{mid:9} {"ok" if ok else "ARKIT-CHECK FAILED"} {sz/1048576:.2f} MB')
    print(f'total {tot/1048576:.1f} MB')
