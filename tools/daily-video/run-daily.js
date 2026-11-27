// تشغيل يومي: يختار قطعة (المنتجات الجديدة أولًا ثم دورة على بقية القطع)، ينتج فيديو بنمط اليوم، ويسجّل الحالة.
// node run-daily.js <postsDir> [id] [mode]     postsDir = مستودع rax3d-posts (المخرجات في <postsDir>/daily/)
const {chromium}=require('playwright');const fs=require('fs'),path=require('path'),cp=require('child_process');
const POSTS=path.resolve(process.argv[2]||'.'),FORCE_ID=process.argv[3]||'',FORCE_MODE=process.argv[4]||'';
const SHOP=path.resolve(__dirname,'../..'),DAILY=path.join(POSTS,'daily'),STATE=path.join(DAILY,'state.json');
const MODE_BY_DAY=['daily','colors','daily','layers','daily','hook','daily'];   // الأحد..السبت (توقيت الرياض)
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 fs.mkdirSync(DAILY,{recursive:true});
 const state=fs.existsSync(STATE)?JSON.parse(fs.readFileSync(STATE,'utf8')):{used:[],history:[]};
 const srv=cp.spawn('python3',['-m','http.server','8131'],{cwd:SHOP,stdio:'ignore'});await sleep(1500);
 try{
  const b=await chromium.launch();const p=await b.newPage();await p.goto('http://localhost:8131/',{waitUntil:'domcontentloaded'});await p.waitForTimeout(2500);
  const info=await p.evaluate(()=>({cand:ITEMS.filter(x=>!x.hid&&MODELS[x.id]).map(x=>x.id),all:ITEMS.map(x=>x.id),nw:NEW.slice()}));await b.close();
  const ksa=new Date(Date.now()+3*3600e3),date=ksa.toISOString().slice(0,10),dow=ksa.getUTCDay();
  let id=FORCE_ID,reason='manual';
  if(!id){
   const produced=new Set(state.history.map(h=>h.id));
   const fresh=info.nw.filter(x=>info.cand.includes(x)&&!produced.has(x));
   if(fresh.length){id=fresh[0];reason='new product'}
   else{let pool=info.cand.filter(x=>!state.used.includes(x));if(!pool.length){state.used=[];pool=info.cand.slice()}id=pool[0];reason='rotation'}
  }
  if(!info.all.includes(id))throw new Error('unknown id '+id);
  const mode=FORCE_MODE||(reason==='new product'?'daily':MODE_BY_DAY[dow]);
  const out=path.join(DAILY,`${date}-${id}-${mode}`);
  console.log('picked',id,mode,reason,out);
  cp.execFileSync('node',[path.join(__dirname,'build.js'),id,out],{stdio:'inherit',env:{...process.env,VMODE:mode,MUSIC_LOG:path.join(DAILY,'music-log.json')}});
  if(!state.used.includes(id))state.used.push(id);
  state.history.push({date,id,mode,reason,video:path.relative(POSTS,path.join(out,`${id}${mode==='daily'?'':'-'+mode}.mp4`))});
  fs.writeFileSync(STATE,JSON.stringify(state,null,1));
  // ملخص التشغيل لصفحة GitHub
  const sum=`### فيديو اليوم: ${id} (${mode}) — ${reason}\n\n- الملف: \`${path.relative(POSTS,out)}\`\n- الوصف والهاشتاقات: \`caption.txt\` في نفس المجلد\n`;
  if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,sum);
  // حذف فيديوهات أقدم من 45 يومًا (يبقى الوصف والسجل)
  const cut=Date.now()-45*86400e3;for(const d of fs.readdirSync(DAILY)){const full=path.join(DAILY,d);if(!fs.statSync(full).isDirectory())continue;const m=d.match(/^(\d{4}-\d{2}-\d{2})-/);if(m&&Date.parse(m[1])<cut)for(const f of fs.readdirSync(full))if(/\.(mp4|wav)$/.test(f))fs.rmSync(path.join(full,f))}
 }finally{srv.kill()}
})().catch(e=>{console.error(e);process.exit(1)});
