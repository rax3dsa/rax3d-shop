// هاشتاقات وكلمات مفتاحية احترافية: عامة + حسب الفئة + حسب القطعة (عربي وإنجليزي). لا معلومات اتصال غير المعتمدة.
const BASE_AR=['#طباعة_ثلاثية_الأبعاد','#طباعة_3D','#الدمام','#السعودية','#تصميم_مخصص','#هدايا','#RAX3D'];
const BASE_EN=['#3dprinting','#3dprinted','#saudiarabia','#dammam','#customgifts','#madeinsaudi'];
const CAT={
 'الإضاءات':{ar:['#اضاءة','#ديكور_منزلي','#مصباح','#اضاءة_ديكور'],en:['#lamp','#homedecor','#lighting','#decorideas']},
 'الديكور':{ar:['#ديكور','#ديكور_منزلي','#تحف','#مزهرية'],en:['#homedecor','#decor','#interiordesign','#shelfdecor']},
 'إكسسوارات المكتب':{ar:['#مكتب','#اكسسوارات_مكتب','#منظم_مكتب','#ديكور_مكتب'],en:['#deskdecor','#officedecor','#desksetup','#workspace']},
 'إكسسوارات القهوة':{ar:['#قهوة','#ركن_القهوة','#مختص_قهوة','#اكسسوارات_القهوة'],en:['#coffeelover','#coffeecorner','#specialtycoffee','#baristalife']},
 'سناك وضيافة':{ar:['#ضيافة','#سناك','#تقديم','#سفرة'],en:['#hosting','#snacks','#tableware','#serveware']},
 'ميداليات':{ar:['#ميدالية','#ميداليات_مفاتيح','#هدايا_صغيرة','#تذكار'],en:['#keychain','#keychains','#smallgifts','#giftideas']},
 'إكسسوارات السيارة':{ar:['#اكسسوارات_سيارات','#ديكور_سيارة','#تزيين_السيارة','#سيارات'],en:['#caraccessories','#cardecor','#cargram','#cars']},
 'ألعاب وقيمرز':{ar:['#قيمرز','#ألعاب','#هدايا_قيمرز','#عشاق_الأبطال'],en:['#gamer','#gaming','#collectibles','#fanart']},
 'التوزيعات':{ar:['#توزيعات','#توزيعات_مناسبات','#توزيعات_جملة','#هدايا_مناسبات'],en:['#giveaways','#partyfavors','#wholesale','#eventfavors']},
};
function build(it,d){
 const c=CAT[it.cat]||CAT['الديكور'];
 const name=it.name.replace(/[()]/g,'').replace(/\s+/g,'_');
 const ar=[...new Set([...BASE_AR,...c.ar,'#'+name])].slice(0,12);
 const en=[...new Set([...BASE_EN,...c.en])].slice(0,10);
 const kw=[it.name,it.cat,'طباعة ثلاثية الأبعاد في السعودية','طباعة 3D الدمام','هدايا مخصصة',...(it.use||'').split(/[،,]/).map(s=>s.trim()).filter(s=>s.length>2&&s.length<26)];
 const price=d.price[0]+' ريال';
 const cap=`${d.isNew?'🆕 وصل حديثاً':'✨ منتج اليوم'}: ${it.name}\n${it.use}\n\n🎨 تطبعها بلونك (${d.colors} لونًا)\n💰 ${price}${d.wq&&isFinite(d.wq)&&d.price[1]<d.price[0]?` · الجملة ${d.price[1]} ريال من ${d.wq} ${d.wq>10?'قطعة':'قطع'}`:''}\n🛒 اطلب: واتساب 0555681402 أو rax3d.com\n📍 الدمام، السعودية`;
 return {caption:cap,hashtags_ar:ar,hashtags_en:en,keywords:[...new Set(kw)],full:`${cap}\n\n${ar.join(' ')}\n${en.join(' ')}`,spotlight:`${it.name} 🖨️ ${price} | اطلب عبر واتساب 0555681402`};
}
module.exports={build};
