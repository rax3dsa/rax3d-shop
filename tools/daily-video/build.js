// خط إنتاج الفيديو اليومي: node build.js <id> [outDir]
// يستخرج بيانات القطعة من الموقع، يصوّر دورانها 3D من عارض الموقع، يرسم المشاهد، يولّد موسيقى فريدة، ويكتب الوصف والهاشتاقات.
const {chromium}=require('playwright');const fs=require('fs'),path=require('path'),cp=require('child_process');
const id=process.argv[2];const VM=process.env.VMODE||'daily';const CFG={daily:{scene:'scene.html',mode:'turn',n:72},colors:{scene:'scene-colors.html',mode:'colors',n:240},layers:{scene:'scene-layers.html',mode:'grow',n:240},hook:{scene:'scene-hook.html',mode:'turn',n:48}}[VM];const OUT=process.argv[3]||path.join(__dirname,'out',id);
const MULTI=()=>VM==='colors';
const SHOP=path.resolve(__dirname,'../..'),TMP=path.join(SHOP,'_dv_tmp',id),FPS=30,NF=CFG.n;
const {build}=require('./tags');
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});fs.mkdirSync(TMP,{recursive:true});
 const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 // 1) بيانات القطعة
 let p=await b.newPage();await p.goto('http://localhost:8131/',{waitUntil:'domcontentloaded'});await p.waitForTimeout(2500);
 const d=await p.evaluate(id=>{const it=ITEMS.find(x=>x.id===id);if(!it)return null;return {id,it,name:it.name,use:it.use,cat:it.cat,price:PRICE[id],dim:DIM[id]||null,desc:DESC[id]||'',colors:COLORS.length-1,wq:WQ(id),isNew:NEW.includes(id),vars:(it.vg?ITEMS.filter(x=>x.vg===it.vg).sort((a,b)=>(a.id===id?-1:b.id===id?1:0)):[it]).map((x,i)=>({id:x.id,vt:x.vt||'التصميم',price:PRICE[x.id]}))}},id);
 if(!d)throw new Error('قطعة غير موجودة: '+id);if(!isFinite(d.wq))d.wq=null;d.hook=d.price[0]<=50?`ما توقعت تنطبع بـ${d.price[0]} ريال؟`:'قطعة تتطبع لك بلونك';await p.close();
 fs.writeFileSync(path.join(OUT,'data.json'),JSON.stringify(d,null,1));
 // 2) 3D (قلب الألوان: كل تصميم في القطعة يُصوَّر بدوره)
 const vs=(VM==='colors'&&d.vars.length>1)?d.vars:[{id}];if(vs.length<2)d.vars=[{id,price:d.price}];
 const NV=vs.length>1?120:NF;const metas={};
 for(const v of vs){const T=path.join(SHOP,'_dv_tmp',v.id);fs.mkdirSync(T,{recursive:true});
  if(!fs.existsSync(path.join(T,String(NV-1).padStart(3,'0')+'.png')))cp.execFileSync('node',[path.join(__dirname,'capture3d.js'),v.id,T,String(NV),'900'],{stdio:'inherit',env:{...process.env,MODE:CFG.mode}});
  metas[v.id]=fs.existsSync(path.join(T,'meta.json'))?JSON.parse(fs.readFileSync(path.join(T,'meta.json'),'utf8')):{colors:[],layers:0,box:{h:0}}}
 const meta=metas[id];d.metas=metas;d.nv=NV;
 // 3) المشاهد
 p=await b.newPage({viewport:{width:1080,height:1920}});await p.goto('http://localhost:8131/tools/daily-video/'+CFG.scene);
 await p.evaluate(async([d,nf,m])=>{await init(d,nf,m)},[d,d.nv||NF,meta]);
 const dur=await p.evaluate(()=>DUR),N=Math.round(dur*FPS),FD=path.join(OUT,'frames');fs.mkdirSync(FD,{recursive:true});
 for(let i=0;i<N;i++){await p.evaluate(t=>setT(t),i/FPS);await p.screenshot({path:path.join(FD,String(i).padStart(4,'0')+'.png')})}
 await b.close();
 // 4) موسيقى فريدة + دمج
 cp.execFileSync('python3',[path.join(__dirname,'music.py'),VM==='daily'?id:id+'#'+VM,d.cat,path.join(OUT,'music.wav'),String(dur)],{stdio:'inherit'});
 cp.execFileSync('ffmpeg',['-loglevel','error','-y','-framerate',String(FPS),'-i',path.join(FD,'%04d.png'),'-i',path.join(OUT,'music.wav'),'-t',String(dur),'-vf','format=yuv420p','-c:v','libx264','-crf','18','-preset','medium','-c:a','aac','-b:a','192k','-shortest',path.join(OUT,`${id}${VM==='daily'?'':'-'+VM}.mp4`)]);
 fs.rmSync(path.join(OUT,'music.wav'),{force:true});   // لا نحفظ الصوت الخام (5 ميجا) في المستودع
 // 5) الوصف والهاشتاقات
 const c=build(d.it,d);fs.writeFileSync(path.join(OUT,'caption.txt'),c.full+'\n\n--- Spotlight ---\n'+c.spotlight+'\n\n--- Keywords ---\n'+c.keywords.join(', ')+'\n');
 fs.rmSync(FD,{recursive:true,force:true});if(process.env.KEEP3D!=='1'){fs.rmSync(TMP,{recursive:true,force:true});fs.rmSync(path.join(SHOP,'_dv_tmp'),{recursive:true,force:true})}
 console.log('done',OUT);
})().catch(e=>{console.error(e);process.exit(1)});
