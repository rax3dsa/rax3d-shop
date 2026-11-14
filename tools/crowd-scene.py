#!/usr/bin/env python3
"""Giveaway (التوزيعات) hero image: one product photo repeated in receding rows on the site's cream background.
Usage: python3 tools/crowd-scene.py <id> [--src hq/<id>-0.webp] [--rect x,y,w,h]
Needs: pillow, numpy, opencv-python-headless. The piece is cut out of its own photo (GrabCut), then drawn in perspective rows:
a sharp hero duck/piece front and centre, rows behind it smaller, softer and fading into the cream background (so nothing is cut at the frame).
Writes hq/<id>-0.webp (800x800) and thumbs/<id>.jpg (320x320). The image is computer-composed: say so when you present it."""
import sys,random,argparse
import numpy as np,cv2
from PIL import Image,ImageFilter
ap=argparse.ArgumentParser();ap.add_argument('id');ap.add_argument('--src');ap.add_argument('--rect');a=ap.parse_args()
src_path=a.src or f'hq/{a.id}-0.webp';random.seed(7)
def bg():
    ys=np.array([0,150,300,450,600,799]);cols=np.array([[232,217,190],[231,215,188],[228,210,182],[225,206,178],[221,201,174],[215,196,171]],float)
    arr=np.zeros((800,800,3))
    for c in range(3): arr[:,:,c]=np.interp(np.arange(800),ys,cols[:,c])[:,None]
    yy,xx=np.mgrid[0:800,0:800];arr*=(1-0.07*(((xx-400)**2+(yy-380)**2)/(400**2*2)))[:,:,None]
    return Image.fromarray(arr.clip(0,255).astype('uint8')).convert('RGBA')
im=np.array(Image.open(src_path).convert('RGB'));h,w=im.shape[:2];bgr=cv2.cvtColor(im,cv2.COLOR_RGB2BGR)
rect=tuple(int(v) for v in a.rect.split(',')) if a.rect else (int(w*.23),int(h*.13),int(w*.54),int(h*.72))
mask=np.zeros((h,w),np.uint8);cv2.grabCut(bgr,mask,rect,np.zeros((1,65)),np.zeros((1,65)),6,cv2.GC_INIT_WITH_RECT)
m=((mask==1)|(mask==3)).astype(np.uint8);n,lab,st,_=cv2.connectedComponentsWithStats(m);m=(lab==1+np.argmax(st[1:,4])).astype(np.uint8)
ff=m.copy();cv2.floodFill(ff,np.zeros((h+2,w+2),np.uint8),(0,0),2);m=np.where(ff==2,0,1).astype(np.uint8);m=cv2.morphologyEx(m,cv2.MORPH_OPEN,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(7,7)))
al=cv2.GaussianBlur(cv2.erode(m,np.ones((3,3),np.uint8)).astype(np.float32),(0,0),1.0);x,y,bw,bh=cv2.boundingRect(m);pad=6
duck=np.dstack([im.astype(np.float32),al*255]).astype(np.uint8)[max(0,y-pad):y+bh+pad,max(0,x-pad):x+bw+pad];dh0,dw0=duck.shape[:2]
BG=bg();bgarr=np.array(BG).astype(np.float32);H0=345;S0=H0/dh0;RATIO=.80;G=98;base0=640
counts=[1,4,5,7,9,11,13,15,17,19,21,23,25,27]
blurs=[0,.6,1.2,1.9,2.6,3.3,3.8,4.2,4.5,4.8,5,5,5,5];fades=[0,.05,.11,.18,.26,.35,.45,.55,.65,.73,.80,.86,.90,.93]
placed=[];sh=np.zeros((800,800),np.float32);yy,xx=np.mgrid[0:800,0:800]
for d,n_ in enumerate(counts):
    s=S0*RATIO**d;base=base0-G*(1-RATIO**d)/(1-RATIO);pitch=dw0*s
    for i in range(n_):
        cx=400 if d==0 else 400+(i-(n_-1)/2)*pitch+random.uniform(-.03,.03)*pitch
        sc=s*random.uniform(.985,1.015);by=base+random.uniform(-2,2)*s;placed.append((d,cx,by,sc,random.uniform(-1.5,1.5)))
        e=((xx-cx)/(dw0*sc*.46))**2+((yy-(by-3))/(dw0*sc*.065))**2;sh=np.maximum(sh,(np.exp(-e*1.6)*.30*(1-.05*d)).astype(np.float32))
out=Image.composite(Image.new('RGBA',(800,800),(70,52,30,255)),BG.copy(),Image.fromarray((np.clip(sh,0,1)*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6)));hero=None
for d,cx,by,sc,ang in sorted(placed,key=lambda t:-t[0]):
    img=Image.fromarray(duck,'RGBA').resize((max(2,int(dw0*sc)),max(2,int(dh0*sc))),Image.LANCZOS)
    if abs(ang)>.01: img=img.rotate(ang,resample=Image.BICUBIC,expand=True)
    arr=np.array(img).astype(np.float32);f=fades[d];arr[...,:3]=arr[...,:3]*(1-f)+bgarr[int(np.clip(by-dh0*sc/2,0,799)),400,:3]*f
    img=Image.fromarray(arr.clip(0,255).astype(np.uint8),'RGBA')
    if blurs[d]>.05: img=img.filter(ImageFilter.GaussianBlur(blurs[d]))
    px=int(cx-img.width/2);py=int(by-img.height+pad*sc)
    if px>-img.width and px<800: out.alpha_composite(img,(px,py)) if px>=0 and py>=0 else out.alpha_composite(img.crop((max(0,-px),max(0,-py),img.width,img.height)),(max(px,0),max(py,0)))
    if d==0: hero=(img,px,py)
img,px,py=hero;refl=img.transpose(Image.FLIP_TOP_BOTTOM);ra=np.array(refl.split()[3]).astype(np.float32);fh=np.clip(1-np.arange(ra.shape[0])/(ra.shape[0]*.40),0,1)**1.7*.30
refl.putalpha(Image.fromarray((ra*fh[:,None]).astype(np.uint8)));ry=py+img.height-4;room=800-ry
if room>0: out.alpha_composite(refl.crop((0,0,refl.width,min(refl.height,room))),(px,ry))
res=np.array(out.convert('RGB')).astype(np.float32);dx=np.abs(xx-400)/400.;dy=(yy-420)/420.;v=np.clip((np.sqrt(dx**2+dy**2*.9)-.62)/.38,0,1)**1.4
res=res*(1-v[...,None]*.85)+np.array(BG.convert('RGB')).astype(np.float32)*v[...,None]*.85
fin=Image.fromarray(res.clip(0,255).astype(np.uint8));fin.save(f'hq/{a.id}-0.webp','WEBP',quality=86,method=6);fin.resize((320,320),Image.LANCZOS).save(f'thumbs/{a.id}.jpg','JPEG',quality=84,optimize=True)
print('ok',a.id,len(placed),'ducks')
