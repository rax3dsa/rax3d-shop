import numpy as np
from PIL import Image,ImageDraw
mv,mf,sv,sf,ev,ef=[np.load(n) for n in ('mp_v.npy','mp_f.npy','ms_v.npy','ms_f.npy','me_v.npy','me_f.npy')]
S=3;W=1400;H=900
V=np.vstack([mv,sv,ev]);F=np.vstack([mf,sf+len(mv),ef+len(mv)+len(sv)]);C=np.r_[np.zeros(len(mf),int),np.ones(len(sf),int),np.full(len(ef),2)]
t=np.radians(30);Rx=np.array([[1,0,0],[0,np.cos(t),-np.sin(t)],[0,np.sin(t),np.cos(t)]])
Vv=(V-[0,0,1])@Rx.T;tri=Vv[F];n=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);n/=np.linalg.norm(n,axis=1)[:,None]+1e-9
L=np.array([-.35,.5,.8]);L/=np.linalg.norm(L);sh=.7+.45*np.clip(n@L,0,1)
k=W*S*0.86/(Vv[:,0].max()-Vv[:,0].min());px=Vv[:,0]*k+W*S/2;py=H*S*.5-Vv[:,1]*k
im=Image.new('RGB',(W*S,H*S),(226,211,184));d=ImageDraw.Draw(im)
col=[np.array((0,112,70)),np.array((212,30,36)),np.array((245,245,240))]
dep=Vv[F][:,:,2].mean(1)+C*1000   # emblem (sits on top of the map) is always drawn last
for i in np.argsort(dep):
    if n[i,2]<=0:continue
    c=tuple(int(min(255,v)) for v in col[C[i]]*sh[i]);f=F[i];d.polygon([(px[f[0]],py[f[0]]),(px[f[1]],py[f[1]]),(px[f[2]],py[f[2]])],fill=c)
im.resize((W,H),Image.LANCZOS).save('preview.png')
