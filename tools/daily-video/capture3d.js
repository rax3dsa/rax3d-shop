// يصوّر دوران القطعة 360° من عارض الـ3D الخاص بالموقع نفسه (three.js) إطارات PNG شفافة
// الاستعمال: node capture3d.js <id> <outDir> [frames=90] [size=1000] [colorIndex]
const {chromium}=require('playwright');const fs=require('fs');
const [,, id, out, N0, S0, CI]=process.argv;const N=+N0||90,SZ=+S0||1000;
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width:900,height:1200}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8131/?p='+id);await p.waitForTimeout(2500);
 await p.waitForSelector('[data-edit]',{timeout:20000});await p.click('[data-edit]');await p.waitForTimeout(1500);
 await p.evaluate(()=>{if(!(typeof V!=='undefined'&&V.on))open3D()}).catch(()=>{});
 await p.waitForFunction(()=>typeof V!=='undefined'&&V.on&&V.scene&&V.controls&&V.scene.children.length>4,{timeout:90000}).catch(e=>console.log('wait failed'));
 await p.waitForTimeout(3000);
 const ok=await p.evaluate(({SZ,CI})=>{try{
   V.controls.autoRotate=false;V.controls.enableDamping=false;
   const c=V.renderer.domElement;V.renderer.setPixelRatio(1);V.renderer.setSize(SZ,SZ,false);V.cam.aspect=1;V.cam.updateProjectionMatrix();
   if(CI!==undefined&&CI!==''&&typeof tintMain==='function')tintMain(+CI);
   window.__r={d:V.cam.position.length(),y:V.cam.position.y};return true}catch(e){return String(e)}},{SZ,CI});
 console.log('prep',ok);
 fs.mkdirSync(out,{recursive:true});
 for(let i=0;i<N;i++){
  const png=await p.evaluate(({i,N})=>{const R=window.__r;const ang=i/N*Math.PI*2;const hor=Math.sqrt(Math.max(1e-6,R.d*R.d-R.y*R.y));
    V.cam.position.set(Math.sin(ang)*hor,R.y,Math.cos(ang)*hor);V.cam.lookAt(0,0,0);V.cam.updateMatrixWorld(true);
    V.renderer.render(V.scene,V.cam);return V.renderer.domElement.toDataURL('image/png')},{i,N});
  fs.writeFileSync(`${out}/${String(i).padStart(3,'0')}.png`,Buffer.from(png.split(',')[1],'base64'));}
 console.log('frames',N,errs.slice(0,3));await b.close()})();
