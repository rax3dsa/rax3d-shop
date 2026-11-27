// خط إنتاج الفيديو اليومي: node build.js <id> [outDir]
// يستخرج بيانات القطعة من الموقع، يصوّر دورانها 3D من عارض الموقع، يرسم المشاهد، يولّد موسيقى فريدة، ويكتب الوصف والهاشتاقات.
const {chromium}=require('playwright');const fs=require('fs'),path=require('path'),cp=require('child_process');
const id=process.argv[2];const OUT=process.argv[3]||path.join(__dirname,'out',id);
const SHOP=path.resolve(__dirname,'../..'),TMP=path.join(SHOP,'_dv_tmp',id),FPS=30,NF=72;
const {build}=require('./tags');
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});fs.mkdirSync(TMP,{recursive:true});
 const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 // 1) بيانات القطعة
 let p=await b.newPage();await p.goto('http://localhost:8131/',{waitUntil:'domcontentloaded'});await p.waitForTimeout(2500);
 const d=await p.evaluate(id=>{const it=ITEMS.find(x=>x.id===id);if(!it)return null;return {id,it,name:it.name,use:it.use,cat:it.cat,price:PRICE[id],dim:DIM[id]||null,desc:DESC[id]||'',colors:COLORS.length-1,wq:WQ(id),isNew:NEW.includes(id)}},id);
 if(!d)throw new Error('قطعة غير موجودة: '+id);if(!isFinite(d.wq))d.wq=null;await p.close();
 fs.writeFileSync(path.join(OUT,'data.json'),JSON.stringify(d,null,1));
 // 2) 3D
 if(!fs.existsSync(path.join(TMP,'071.png')))cp.execFileSync('node',[path.join(__dirname,'capture3d.js'),id,TMP,String(NF),'900'],{stdio:'inherit',env:process.env});
 // 3) المشاهد
 p=await b.newPage({viewport:{width:1080,height:1920}});await p.goto('http://localhost:8131/tools/daily-video/scene.html');
 await p.evaluate(async([d,nf])=>{await init(d,nf)},[d,NF]);
 const dur=await p.evaluate(()=>DUR),N=Math.round(dur*FPS),FD=path.join(OUT,'frames');fs.mkdirSync(FD,{recursive:true});
 for(let i=0;i<N;i++){await p.evaluate(t=>setT(t),i/FPS);await p.screenshot({path:path.join(FD,String(i).padStart(4,'0')+'.png')})}
 await b.close();
 // 4) موسيقى فريدة + دمج
 cp.execFileSync('python3',[path.join(__dirname,'music.py'),id,d.cat,path.join(OUT,'music.wav'),String(dur)],{stdio:'inherit'});
 cp.execFileSync('ffmpeg',['-loglevel','error','-y','-framerate',String(FPS),'-i',path.join(FD,'%04d.png'),'-i',path.join(OUT,'music.wav'),'-t',String(dur),'-vf','format=yuv420p','-c:v','libx264','-crf','18','-preset','medium','-c:a','aac','-b:a','192k','-shortest',path.join(OUT,`${id}.mp4`)]);
 // 5) الوصف والهاشتاقات
 const c=build(d.it,d);fs.writeFileSync(path.join(OUT,'caption.txt'),c.full+'\n\n--- Spotlight ---\n'+c.spotlight+'\n\n--- Keywords ---\n'+c.keywords.join(', ')+'\n');
 fs.rmSync(FD,{recursive:true,force:true});if(process.env.KEEP3D!=='1'){fs.rmSync(TMP,{recursive:true,force:true});fs.rmSync(path.join(SHOP,'_dv_tmp'),{recursive:true,force:true})}
 console.log('done',OUT);
})().catch(e=>{console.error(e);process.exit(1)});
