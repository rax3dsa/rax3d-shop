const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.route('**/config',r=>r.fulfill({json:{ok:true,ship:25}}));
await p.goto('http://localhost:8123/');await p.waitForTimeout(1500);
const d=await p.evaluate(()=>({MODELS,DIM,COLORS,ITEMS:ITEMS.map(i=>({id:i.id,name:i.name}))}));
fs.writeFileSync('/tmp/claude-0/appdata.json',JSON.stringify(d));console.log(Object.keys(d.MODELS).length,'models');
await b.close()})();
