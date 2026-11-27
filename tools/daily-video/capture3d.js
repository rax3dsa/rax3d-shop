// يصوّر القطعة من عارض الـ3D الخاص بالموقع نفسه (three.js) إطارات PNG شفافة.
// node capture3d.js <id> <outDir> [frames=72] [size=900]   متغير البيئة MODE: turn (افتراضي) | colors | grow
//  turn   : دوران 360°.   colors: دوران 360° مع تبديل اللون (ألوان الموقع المتاحة).   grow: نمو القطعة طبقة طبقة (قطع أفقي متحرك) ثم دوران كامل.
const {chromium}=require('playwright');const fs=require('fs');
const [,, id, out, N0, S0]=process.argv;const N=+N0||72,SZ=+S0||900,MODE=process.env.MODE||'turn';
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width:900,height:1200}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8131/?p='+id);await p.waitForSelector('[data-edit]',{timeout:20000});await p.click('[data-edit]');await p.waitForTimeout(1500);
 await p.evaluate(()=>{if(!(typeof V!=='undefined'&&V.on))open3D()}).catch(()=>{});
 await p.waitForFunction(()=>typeof V!=='undefined'&&V.on&&V.scene&&V.controls&&V.scene.children.length>4,{timeout:90000}).catch(e=>console.log('wait failed'));
 await p.waitForTimeout(3000);
 const meta=await p.evaluate(({SZ})=>{V.controls.autoRotate=false;V.controls.enableDamping=false;V.renderer.setPixelRatio(1);V.renderer.setSize(SZ,SZ,false);V.cam.aspect=1;V.cam.updateProjectionMatrix();
   const R={d:V.cam.position.length(),y:V.cam.position.y};window.__r=R;
   const box=new THREE.Box3();V.scene.traverse(o=>{if(o.isMesh&&o.geometry&&o.visible){const g=o.geometry;g.computeBoundingBox&&g.computeBoundingBox();const bb=g.boundingBox.clone().applyMatrix4(o.matrixWorld);box.union(bb)}});
   window.__box=box;V.scene.traverse(o=>{if(o.isMesh&&o.material){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>{m.side=THREE.DoubleSide;m.needsUpdate=true})}});
   return {ymin:box.min.y,ymax:box.max.y,h:box.max.y-box.min.y}},{SZ});
 fs.mkdirSync(out,{recursive:true});
 if(MODE==='grow'||process.env.COLOR)await p.evaluate(ci=>{if(typeof tintMain==='function')tintMain(ci)},+(process.env.COLOR||5));
 const cols=await p.evaluate(()=>{const out=new Set(OUT||[]);return COLORS.map((c,i)=>({i,n:c[0],h:c[1]})).filter(c=>c.i>0&&!out.has(c.i)&&c.i!==9)});
 let frames=[];
 if(MODE==='turn')for(let i=0;i<N;i++)frames.push({ang:i/N*Math.PI*2});
 if(MODE==='colors')for(let i=0;i<N;i++){const k=Math.min(cols.length-1,Math.floor(i/N*cols.length));frames.push({ang:i/N*Math.PI*2,ci:cols[k].i,seg:k})}
 if(MODE==='grow'){const G=Math.round(N*0.7),F=N-G;for(let i=0;i<G;i++){const pr=(i+1)/G;frames.push({ang:0.35*Math.PI+pr*Math.PI*0.9,grow:pr})}for(let i=0;i<F;i++)frames.push({ang:0.35*Math.PI+0.9*Math.PI+i/F*Math.PI*2,grow:1,done:true})}
 fs.writeFileSync(out+'/meta.json',JSON.stringify({mode:MODE,n:frames.length,colors:cols,box:meta,layers:Math.round(meta.h/0.2)},null,1));
 for(let i=0;i<frames.length;i++){const f=frames[i];
  const png=await p.evaluate(({f})=>{const R=window.__r,B=window.__box;
    if(f.ci!==undefined&&typeof tintMain==='function')tintMain(f.ci);
    if(f.grow!==undefined){V.renderer.localClippingEnabled=true;V.renderer.clippingPlanes=f.grow>=1?[]:[new THREE.Plane(new THREE.Vector3(0,-1,0),B.min.y+f.grow*(B.max.y-B.min.y))]}
    const hor=Math.sqrt(Math.max(1e-6,R.d*R.d-R.y*R.y));V.cam.position.set(Math.sin(f.ang)*hor,R.y,Math.cos(f.ang)*hor);V.cam.lookAt(0,0,0);V.cam.updateMatrixWorld(true);
    V.renderer.render(V.scene,V.cam);return V.renderer.domElement.toDataURL('image/png')},{f});
  fs.writeFileSync(`${out}/${String(i).padStart(3,'0')}.png`,Buffer.from(png.split(',')[1],'base64'));}
 console.log('frames',frames.length,MODE,errs.slice(0,3));await b.close()})();
