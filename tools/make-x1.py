# Makes hq/<id>-x1.webp (the 2nd photo, see CLAUDE.md photo rules) from hq/<id>-0.webp: mirrored view (no text/logo, not rotationally symmetric) or a close-up crop (ZOOM focus as fractions of the piece box).
# Usage: python3 tools/make-x1.py id1,id2 ; then register the id in XIMG (app.js) and bump the cache in sw.js. Check every result by eye. Add the id to MIRROR or ZOOM first.
import numpy as np, sys
from PIL import Image, ImageFilter, ImageOps
import os
H=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','hq')+'/'
MIRROR='knobs xkit d2 d5 d6 skel ks1 ks2 ks3 kcm monk abst ghost lampman pmaskl pmaskm pmasks w1 w2 w4 w5 fish crown wilson gmug clips ttt'.split()
ZOOM={'fncs':(.5,.3), # id: (focus x, focus y) as fractions of the piece's bounding box
 'drip':(.5,.4),'knobs':(.33,.5),'xkit':(.42,.3),'chips':(.78,.55),'pringles':(.72,.5),'vase':(.5,.4),'vase2':(.5,.4),'vase3':(.5,.4),
 'lamp':(.5,.35),'snoopy':(.38,.3),'disney':(.5,.5),'hdclock':(.5,.5),'hdtool':(.55,.3),'hdtray':(.5,.5),'hdbuddy':(.5,.25),
 'hdtissue':(.35,.3),'ltr':(.55,.5),'pcorn':(.5,.5)}
def bbox(im):
    a=np.asarray(im).astype(float)
    side=np.concatenate([a[:,:14],a[:,-14:]],axis=1); bg=np.median(side,axis=1)[:,None,:]
    m=(np.abs(a-bg).max(axis=2)>30)
    ys,xs=np.where(m)
    if len(xs)<500: return 0,0,800,800
    return np.percentile(xs,0.7),np.percentile(ys,0.7),np.percentile(xs,99.3),np.percentile(ys,99.3)
def make(i):
    im=Image.open(H+i+'-0.webp').convert('RGB')
    if i in MIRROR:
        out=ImageOps.mirror(im); mode='mirror'
    else:
        x0,y0,x1,y1=bbox(im); bw,bh=x1-x0,y1-y0; fx,fy=ZOOM[i]
        side=int(max(600,0.78*max(bw,bh))); side=min(side,800)
        cx,cy=x0+fx*bw,y0+fy*bh
        l=int(min(max(cx-side/2,0),800-side)); t=int(min(max(cy-side/2,0),800-side))
        out=im.crop((l,t,l+side,t+side)).resize((800,800),Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.2,60,2)); mode=f'zoom{side}'
    out.save(H+i+'-x1.webp','WEBP',quality=84,method=6)
    return mode
if __name__=='__main__':
    for i in sys.argv[1].split(','): print(i,make(i))
