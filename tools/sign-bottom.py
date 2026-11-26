#!/usr/bin/env python3
"""RAX3D signature: engrave the owner's signature (4 lines) into the flat BOTTOM face of a model.
Written for the RUBY R planter (bottom = one rectangle of 6 vertices). Standing order 11-26:
when the owner says «حط توقيعي» do this on his model. Needs: numpy trimesh shapely matplotlib triangle.
Usage: edit the path in load() (3dmodel object .model file), run, then write newV.npy/newF.npy back into the
3MF object (vertices/triangles), delete the stale gcode/plate files, re-zip. For other models adapt the
bottom-rectangle (rect) to their bottom outline; every boundary vertex must be kept (triangle PSLG does).
Text (mapped x=u, y=YC-w so it reads correctly when the model is flipped, front edge at the top):
RAX3D (cap 14 mm) / Instagram & TikTok / @rax3d.sa / rax3d.com (cap 6.5 mm), DejaVu Sans Bold, depth 0.6 mm."""
import re,numpy as np
def load(p='RUBY_R_planter_single_piece_1.model'):
    s=open(p).read()
    v=np.array(re.findall(r'<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"',s),float)
    t=np.array(re.findall(r'<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"',s),int)
    return v,t
import numpy as np, trimesh, collections, re, sys
from matplotlib.textpath import TextPath
from matplotlib.font_manager import FontProperties
from shapely.geometry import Polygon, box
from shapely.ops import unary_union
from shapely import affinity
from shapely.geometry.polygon import orient

DEPTH=0.6
v,t=load()
Z0=v[:,2].min()
selb=[i for i,f in enumerate(t) if all(abs(v[k,2]-Z0)<1e-4 for k in f)]
Z0=v[:,2].min()
YC=(-34.6+39.4)/2
fp=FontProperties(family='DejaVu Sans',weight='bold')
def text_poly(s,cap):
    tp=TextPath((0,0),s,size=1,prop=fp)
    polys=[Polygon(p) for p in tp.to_polygons() if len(p)>2]
    # even-odd combine
    g=None
    for p in sorted(polys,key=lambda p:-p.area):
        g=p if g is None else g.symmetric_difference(p)
    sc=cap/0.729
    g=affinity.scale(g,sc,sc,origin=(0,0))
    minx,miny,maxx,maxy=g.bounds
    return affinity.translate(g,-(minx+maxx)/2,0)  # centered in x, baseline at 0
lines=[("RAX3D",14),("Instagram & TikTok",6.5),("@rax3d.sa",6.5),("rax3d.com",6.5)]
gaps=[6,4,4]
tot=sum(c for _,c in lines)+sum(gaps)
w=tot/2   # top of block in text-up coords (centered)
parts=[]
for i,(s,c) in enumerate(lines):
    g=text_poly(s,c)
    top=w; base=top-c
    parts.append(affinity.translate(g,0,base))
    w=base-(gaps[i] if i<len(gaps) else 0)
G=unary_union(parts)
minx,miny,maxx,maxy=G.bounds
print('text bounds (u,w)',G.bounds,'width',maxx-minx,'height',maxy-miny)
# map to mesh coords: x=u, y=YC - w  (text-up = -y)
G=affinity.affine_transform(G,[1,0,0,-1,0,YC])
G=G.buffer(0)
polys=list(G.geoms) if G.geom_type=='MultiPolygon' else [G]
polys=[orient(p,1.0) for p in polys]
# validity: inside rectangle with margin
_b=v[[k for i in selb[:4] for k in t[i]]]
YA,YC_,YB=sorted(set(_b[:,1]))[0],sorted(set(_b[:,1]))[-1],sorted(set(_b[:,1]))[1]
print('rect y',YA,YB,YC_, 'x',_b[:,0].min(),_b[:,0].max())
XL,XR=_b[:,0].min(),_b[:,0].max()
rect=Polygon([(XL,YA),(XR,YA),(XR,YB),(XR,YC_),(XL,YC_),(XL,YB)])
print('margin',rect.exterior.distance(G), 'inside',rect.contains(G))

import triangle
def tri2d(poly):
    verts=[];segs=[];holes=[]
    def ring(coords):
        c=list(coords)[:-1];b=len(verts);verts.extend(c)
        for i in range(len(c)): segs.append([b+i,b+(i+1)%len(c)])
    ring(poly.exterior.coords)
    for h in poly.interiors:
        ring(h.coords);holes.append(Polygon(h).representative_point().coords[0])
    d={'vertices':np.array(verts),'segments':np.array(segs)}
    if holes:d['holes']=np.array(holes)
    r=triangle.triangulate(d,'p')
    assert len(r['vertices'])==len(verts),'steiner points added'
    return np.asarray(r['vertices']),np.asarray(r['triangles'])
newV=[];newF=[]
def addmesh(vv3,ff,flip=False):
    base=sum(len(x) for x in newV)
    newV.append(vv3)
    for f in ff:
        newF.append([base+f[0],base+f[2],base+f[1]] if flip else [base+f[0],base+f[1],base+f[2]])
# bottom face with holes (normal -z)
bp=Polygon(rect.exterior.coords,[p.exterior.coords for p in polys])
# holes must be the text OUTER rings; text inner rings (islands) are material -> handled below
# Build region = rect minus text (text may contain holes -> islands inside text)
region=rect.difference(G)
regs=list(region.geoms) if region.geom_type=='MultiPolygon' else [region]
for r in regs:
    vv,ff=tri2d(r)
    vv3=np.c_[vv,np.full(len(vv),Z0)]
    # make normal -z
    a=vv3[ff[:,0]];b=vv3[ff[:,1]];c=vv3[ff[:,2]]
    nz=np.cross(b-a,c-a)[:,2]
    addmesh(vv3,ff,flip=False)
    for k in range(len(newF)-len(ff),len(newF)):
        pass
    # fix orientation per-face
    start=len(newF)-len(ff)
    for k,nzv in zip(range(start,len(newF)),nz):
        if nzv>0: newF[k]=[newF[k][0],newF[k][2],newF[k][1]]
# pocket floor at Z0+DEPTH (normal -z): triangulate G
for p in polys:
    vv,ff=tri2d(p)
    vv3=np.c_[vv,np.full(len(vv),Z0+DEPTH)]
    a=vv3[ff[:,0]];b=vv3[ff[:,1]];c=vv3[ff[:,2]]
    nz=np.cross(b-a,c-a)[:,2]
    base=sum(len(x) for x in newV);newV.append(vv3)
    for f,nzv in zip(ff,nz):
        f=list(f+base)
        if nzv>0: f=[f[0],f[2],f[1]]
        newF.append(f)
# walls: for each ring of each oriented poly, left side = void
def ring_walls(coords):
    c=np.array(coords)[:-1]
    n=len(c);base=sum(len(x) for x in newV)
    vv=np.vstack([np.c_[c,np.full(n,Z0)],np.c_[c,np.full(n,Z0+DEPTH)]])
    newV.append(vv)
    for i in range(n):
        j=(i+1)%n
        ab,bb,at,bt=base+i,base+j,base+n+i,base+n+j
        newF.append([ab,bt,bb]);newF.append([ab,at,bt])
for p in polys:
    ring_walls(p.exterior.coords)
    for h in p.interiors: ring_walls(h.coords)

V0=v.copy();F0=t.copy()
keep=[i for i in range(len(F0)) if i not in selb[:4]]
print('removed bottom faces',len(F0)-len(keep))
allV=np.vstack([V0]+newV)
off=len(V0)
# newF indices were relative to newV start; shift
newF=np.array(newF)+off
allF=np.vstack([F0[keep],newF])
m=trimesh.Trimesh(allV,allF,process=True)
print(len(m.vertices),len(m.faces))
e=m.edges_sorted;u,c=np.unique(e,axis=0,return_counts=True);print('edge mult',collections.Counter(c))
print('winding consistent',m.is_winding_consistent,'volume',m.volume)
m0=trimesh.Trimesh(v,t,process=True);print('orig volume',m0.volume,'removed',m0.volume-m.volume)
np.save('newV.npy',m.vertices);np.save('newF.npy',m.faces)
