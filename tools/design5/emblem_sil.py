import numpy as np,cv2
from shapely.geometry import Polygon,LinearRing
from shapely.ops import unary_union
from shapely import affinity
K=4
def _smooth_ring(coords,step=3.0,win=7):
    ls=LinearRing(coords);n=max(40,int(ls.length/step));pts=np.array([ls.interpolate(i/n,normalized=True).coords[0] for i in range(n)])
    k=np.ones(win)/win;h=win//2
    return np.stack([np.convolve(np.r_[pts[-h:,i],pts[:,i],pts[:h,i]],k,'valid') for i in (0,1)],1)
def emblem():
    sil=np.load('sil.npy').astype(np.float32)
    big=cv2.resize(sil,None,fx=K,fy=K,interpolation=cv2.INTER_CUBIC);big=cv2.GaussianBlur(big,(0,0),K*0.9)>0.5
    cnts,hier=cv2.findContours(big.astype(np.uint8),cv2.RETR_CCOMP,cv2.CHAIN_APPROX_NONE);polys=[];holes=[]
    for c,h in zip(cnts,hier[0]):
        if len(c)<30:continue
        p=Polygon(_smooth_ring(c[:,0,:])).buffer(0)
        if p.area<200:continue
        (holes if h[3]>=0 else polys).append(p)
    g=unary_union(polys)
    for hp in holes:g=g.difference(hp)
    g=affinity.scale(g,1,-1,origin=(0,0));x0,y0,x1,y1=g.bounds
    g=affinity.translate(g,-(x0+x1)/2,-(y0+y1)/2);s=1000/max(x1-x0,y1-y0);return affinity.scale(g,s,s,origin=(0,0)).simplify(0.8)
if __name__=='__main__':
    g=emblem();print(g.bounds,g.geom_type,g.area)
