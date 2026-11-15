#!/usr/bin/env python3
"""Giveaway (التوزيعات) product made of SEVERAL designs (e.g. redline = 5 tags): builds all its images from transparent cut-outs of the designs.
Usage: python3 tools/crowd-mix.py <id> --pieces a.png b.png c.png ... [--hero 2] [--seed 7]
  --pieces : one transparent PNG per design (rendered from the real 3MF meshes), in the order shown to the customer.
  --hero   : 1-based index of the design drawn as the sharp hero copy in the crowd scene (default 1).
Writes hq/<id>-0.webp (crowd scene: many copies of all the designs in receding rows, one sharp hero, rows behind smaller/softer/fading into the cream background),
hq/<id>-x1..xN.webp (one image per design: piece centred on the site's cream background, soft shadow + faint reflection, >=10% margin) and thumbs/<id>.jpg.
Needs: pillow, numpy. The images are computer-composed from renders of the 3MF: say so when presenting them."""
import random,argparse
import numpy as np
from PIL import Image,ImageFilter,ImageDraw,ImageFont
ap=argparse.ArgumentParser();ap.add_argument('id');ap.add_argument('--pieces',nargs='+',required=True);ap.add_argument('--hero',type=int,default=1);ap.add_argument('--seed',type=int,default=7);a=ap.parse_args()
random.seed(a.seed)
def bg():
    ys=np.array([0,150,300,450,600,799]);cols=np.array([[232,217,190],[231,215,188],[228,210,182],[225,206,178],[221,201,174],[215,196,171]],float)
    arr=np.zeros((800,800,3))
    for c in range(3): arr[:,:,c]=np.interp(np.arange(800),ys,cols[:,c])[:,None]
    yy,xx=np.mgrid[0:800,0:800];arr*=(1-0.07*(((xx-400)**2+(yy-380)**2)/(400**2*2)))[:,:,None]
    return Image.fromarray(arr.clip(0,255).astype('uint8')).convert('RGBA')
BG=bg();bgarr=np.array(BG).astype(np.float32)
P=[Image.open(p).convert('RGBA') for p in a.pieces];P=[p.crop(p.getbbox()) for p in P]
def shadow(img,canvas,px,py,dy,blur,op):
    al=img.split()[3];sh=Image.new('L',canvas.size,0);sh.paste(al,(px,py+dy));sh=sh.filter(ImageFilter.GaussianBlur(blur))
    canvas.paste(Image.new('RGBA',canvas.size,(70,52,30,255)),(0,0),sh.point(lambda v:int(v*op)))
def reflect(img,canvas,px,py):
    refl=img.transpose(Image.FLIP_TOP_BOTTOM);ra=np.array(refl.split()[3]).astype(np.float32);fh=np.clip(1-np.arange(ra.shape[0])/(ra.shape[0]*.40),0,1)**1.7*.28
    refl.putalpha(Image.fromarray((ra*fh[:,None]).astype(np.uint8)));ry=py+img.height-2
    if 800-ry>0: canvas.alpha_composite(refl.crop((0,0,refl.width,min(refl.height,800-ry))),(px,ry))
def vignette(canvas):
    yy,xx=np.mgrid[0:800,0:800];dx=np.abs(xx-400)/400.;dy=(yy-420)/420.;v=np.clip((np.sqrt(dx**2+dy**2*.9)-.56)/.38,0,1)**1.4
    res=np.array(canvas.convert('RGB')).astype(np.float32);res=res*(1-v[...,None]*.85)+np.array(BG.convert('RGB')).astype(np.float32)*v[...,None]*.85
    return Image.fromarray(res.clip(0,255).astype(np.uint8))
def badge(img,n):
    """design-number tag in the top corner of each per-design image: a dark pill 'تصميم N' (Pillow built with raqm)"""
    txt=f'تصميم {n}'   # Pillow with raqm shapes Arabic itself
    f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',40);d=ImageDraw.Draw(img);b=d.textbbox((0,0),txt,font=f);w,h=b[2]-b[0],b[3]-b[1]
    x0,y0=44,44;d.rounded_rectangle((x0,y0,x0+w+44,y0+h+32),22,fill=(58,42,24,235));d.text((x0+22-b[0],y0+16-b[1]),txt,font=f,fill=(246,236,214,255))
# one image per design
for i,p in enumerate(P,1):
    s=min(600/p.width,430/p.height);img=p.resize((max(2,int(p.width*s)),max(2,int(p.height*s))),Image.LANCZOS)
    out=BG.copy();px=(800-img.width)//2;py=(800-img.height)//2-30
    shadow(img,out,px,py,16,9,.34);out.alpha_composite(img,(px,py));reflect(img,out,px,py)
    out=out.convert('RGBA');badge(out,i);Image.fromarray(np.array(out.convert('RGB'))).save(f'hq/{a.id}-x{i}.webp','WEBP',quality=88,method=6)
# crowd scene
W0=440;H=P[a.hero-1].height*W0/P[a.hero-1].width;RATIO=.80;G=108;base0=625
counts=[1,3,4,5,6,7,8,9,10,11,12];blurs=[0,.6,1.2,1.9,2.6,3.3,3.8,4.2,4.5,4.8,5];fades=[0,.05,.11,.18,.26,.35,.45,.55,.65,.73,.80]
placed=[];order=list(range(len(P)))
for d,n_ in enumerate(counts):
    s=RATIO**d;base=base0-G*(1-RATIO**d)/(1-RATIO);pitch=W0*s*1.06
    seq=[a.hero-1] if d==0 else [order[(k+d*2)%len(P)] for k in range(n_)]
    if d: random.shuffle(seq)
    for k,pi in enumerate(seq):
        cx=400 if d==0 else 400+(k-(n_-1)/2)*pitch+random.uniform(-.03,.03)*pitch
        placed.append((d,cx,base+random.uniform(-2,2)*s,s*random.uniform(.985,1.015),random.uniform(-1.2,1.2),pi))
out=BG.copy();hero=None
for d,cx,by,sc,ang,pi in sorted(placed,key=lambda t:-t[0]):
    p=P[pi];w=W0*sc;h=w*p.height/p.width;img=p.resize((max(2,int(w)),max(2,int(h))),Image.LANCZOS)
    if abs(ang)>.01: img=img.rotate(ang,resample=Image.BICUBIC,expand=True)
    px=int(cx-img.width/2);py=int(by-img.height)
    if px>=800 or px+img.width<=0: continue
    arr=np.array(img).astype(np.float32);f=fades[d];arr[...,:3]=arr[...,:3]*(1-f)+bgarr[int(np.clip(by-h/2,0,799)),400,:3]*f
    img=Image.fromarray(arr.clip(0,255).astype(np.uint8),'RGBA')
    if blurs[d]>.05: img=img.filter(ImageFilter.GaussianBlur(blurs[d]))
    shadow(img,out,px,py,int(10*sc)+3,5,.30*(1-.05*d))
    out.alpha_composite(img.crop((max(0,-px),max(0,-py),min(img.width,800-px),img.height)),(max(px,0),max(py,0)))
    if d==0: hero=(img,px,py)
img,px,py=hero;reflect(img,out,px,py)
fin=vignette(out);fin.save(f'hq/{a.id}-0.webp','WEBP',quality=86,method=6);fin.resize((320,320),Image.LANCZOS).save(f'thumbs/{a.id}.jpg','JPEG',quality=84,optimize=True)
print('ok',a.id,len(placed),'pieces,',len(P),'designs')
