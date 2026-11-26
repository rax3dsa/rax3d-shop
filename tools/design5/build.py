import numpy as np,trimesh,zipfile,io
from shapely.geometry import Polygon,Point,box
from shapely import affinity
from shapely.ops import unary_union
c=np.load('contour.npy').astype(float)
# smooth the traced outline (closed), then fit to the 3MF map size 30 x 28.4 mm, y up
k=np.ones(21)/21
cs=np.stack([np.convolve(np.r_[c[-20:,i],c[:,i],c[:20,i]],k,'same')[20:-20] for i in (0,1)],1)
P=Polygon(cs).buffer(0).simplify(0.25)
minx,miny,maxx,maxy=P.bounds
P=affinity.translate(P,-(minx+maxx)/2,-(miny+maxy)/2)
minx,miny,maxx,maxy=P.bounds
P=affinity.scale(P,30/(maxx-minx),-28.4/(maxy-miny),origin=(0,0))   # flip y (image y is down)
P=P.simplify(0.015);print('map pts',len(P.exterior.coords),'bounds',[round(v,2) for v in P.bounds],'area',round(P.area,1))
L,W,T_MAP,T_STRIP,YOFF=60.0,6.0,2.0,1.2,-0.5
# red bar with half-circle ends (arc at both tips) = stadium; map area removed so the two parts never overlap
r=W/2;bar=unary_union([box(-(L/2-r),YOFF-r,(L/2-r),YOFF+r),Point(-(L/2-r),YOFF).buffer(r,resolution=64),Point(L/2-r,YOFF).buffer(r,resolution=64)])
strip=bar.difference(P)
def ext(poly,h):
    geoms=list(poly.geoms) if hasattr(poly,'geoms') else [poly]
    ms=[trimesh.creation.extrude_polygon(g,h) for g in geoms if g.area>0.05]
    return trimesh.util.concatenate(ms)
from emblem_sil import emblem
from shapely.ops import polylabel
E_H=0.6
ROT=50.0   # owner: emblem runs along the map's NW-SE diagonal, palm at the top-left corner, swords toward the bottom-right
_base=affinity.rotate(emblem(),ROT,origin=(0,0));_bx0,_by0,_bx1,_by1=_base.bounds;_base=affinity.translate(_base,-(_bx0+_bx1)/2,-(_by0+_by1)/2)
# exact centre of the map's bounding box; largest emblem that keeps >= 1.2 mm clear of the map edge
best=None
for E_SC in np.arange(0.03,0.008,-0.0005):
    e=affinity.scale(_base,E_SC,E_SC,origin=(0,0))
    if P.contains(e) and P.exterior.distance(e)>=1.2:best=(0,0,0,P.exterior.distance(e),E_SC);break
print('chosen scale',best[4])
em0=affinity.scale(_base,best[4],best[4],origin=(0,0));best=best[:4]
_,dx,dy,gap=best;em=affinity.translate(em0,dx,dy)
print('emblem size mm',round(em.bounds[2]-em.bounds[0],1),'x',round(em.bounds[3]-em.bounds[1],1),'offset from map centre',dx,dy,'min gap to map edge mm',round(gap,2))
mp=ext(P,T_MAP);ms=ext(strip,T_STRIP);me=ext(em,E_H);me.apply_translation([0,0,T_MAP])
for n,m in (('map',mp),('strip',ms),('emblem',me)):
    m.merge_vertices();m.remove_unreferenced_vertices()
    print(n,'watertight',m.is_watertight,'vol mm3',round(m.volume,1),'bounds',m.bounds.round(2).tolist(),'faces',len(m.faces))
allm=trimesh.util.concatenate([mp,ms,me]);print('overall size',(allm.bounds[1]-allm.bounds[0]).round(2).tolist())
mp.export('map.stl');ms.export('strip.stl');me.export('emblem.stl');allm.export('design5.stl')
np.save('me_v.npy',me.vertices);np.save('me_f.npy',me.faces)
np.save('mp_v.npy',mp.vertices);np.save('mp_f.npy',mp.faces);np.save('ms_v.npy',ms.vertices);np.save('ms_f.npy',ms.faces)
print('est grams (1.24 g/cm3):',round((mp.volume+ms.volume+me.volume)*1.24/1000,2),'green',round(mp.volume*1.24/1000,2),'red',round(ms.volume*1.24/1000,2),'white',round(me.volume*1.24/1000,2))
