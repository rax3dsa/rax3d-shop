/* Custom order page (طلب خاص): https://rax3d.com/?c=<id>
   The owner creates the link in the invoicing app (description, price, optional photo). The customer sees the order here and pays online
   (Moyasar) or chooses cash on delivery. The worker re-checks the amount and makes the link single-use. Uses PAY, esc, payLoad, tsToken, copyText from app.js. */
(()=>{
 let q;try{q=new URLSearchParams(location.search)}catch(_){return}
 const id=q.get("c");if(!id||!/^[A-Za-z0-9]{16}$/.test(id))return;
 const KEY="rax3d_cu_"+id;
 const bg=document.createElement("div");bg.className="modal-bg";bg.id="custbg";bg.style.zIndex="60";
 bg.innerHTML=`<div class="modal" dir="rtl" role="dialog" aria-modal="true" aria-labelledby="cut"><h3 id="cut">طلب خاص من RAX3D</h3><div id="cubody"><p class="inote">جاري تحميل طلبك…</p></div></div>`;
 document.body.appendChild(bg);
 const B=()=>document.getElementById("cubody"),S=n=>`${n} ريال`;
 const msg=(t,err)=>{const m=document.getElementById("cumsg");if(m){m.textContent=t;m.className="dmsg"+(err?" err":"")}};
 const receipt=(num,price,paid,mode,fee)=>{const md=mode==="pickup"?"استلام مباشر":mode==="delivery"?"توصيل":"";const t=["RAX3D · ORD-"+num,"طلب خاص",...(md?["طريقة الاستلام: "+md]:[]),"المبلغ: "+S(price+(fee||0)),paid?"مدفوع":"الدفع عند الاستلام","rax3d.com"].join("\n");window.RCPT=t;
  return `<p class="total">${paid?"تم الدفع ✓":"وصلنا طلبك ✓"}</p><div class="rcpt"><div class="rrow"><span>رقم الطلب</span><b dir="ltr">ORD-${+num}</b></div>${md?`<div class="rrow"><span>الاستلام</span><b>${mode==="pickup"?"🏪 استلام مباشر":"🚚 توصيل"}</b></div>`:""}${fee?`<div class="rrow"><span>التوصيل</span><b>${S(fee)}</b></div>`:""}<div class="rrow tot"><span>المبلغ</span><b>${S(price+(fee||0))}</b></div><div class="rrow"><span>الحالة</span><b>${paid?"مدفوع ✓":"الدفع عند الاستلام"}</b></div></div><button type="button" class="btn alt" id="rcptCopy">📋 انسخ تفاصيل الطلب</button><p class="inote">${paid?"بنتواصل معك لتأكيد التجهيز والتسليم.":"بنتواصل معك لتأكيد التجهيز وموعد الاستلام، وتدفع عند الاستلام."} احفظ رقم الطلب.</p>`};
 async function confirm(pid,c){
  B().innerHTML=`<p class="total">تم الدفع ✓</p><p class="inote">جاري تأكيد طلبك…</p>`;
  let o={};try{o=JSON.parse(localStorage.getItem(KEY)||"{}")}catch(_){}
  try{const r=await fetch(PAY.api+"/confirm",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({paymentId:pid,customer:{name:o.name||"",phone:o.phone||""}})});const j=await r.json();
   if(j.ok){try{localStorage.removeItem(KEY)}catch(_){}B().innerHTML=receipt(j.num||"",j.price||(c&&c.price)||0,true,j.mode,j.fee);return}
   B().innerHTML=`<p class="inote">${j.paid?"تم الدفع، لكن نحتاج نراجع طلبك يدويًا. تواصل معنا ومعك رقم الدفعة <b dir=\"ltr\">"+esc(String(pid).slice(-8))+"</b>.":"ما تأكد الدفع الحين. إذا انخصم منك مبلغ تواصل معنا ومعك رقم الدفعة <b dir=\"ltr\">"+esc(String(pid).slice(-8))+"</b>."}</p>`
  }catch(_){B().innerHTML=`<p class="inote">تعذر التحقق من الدفع الحين. لا تدفع مرة ثانية، تواصل معنا ومعك رقم الدفعة <b dir="ltr">${esc(String(pid).slice(-8))}</b>.</p>`}
 }
 function form(c){
  const img=/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(c.img||"")?`<img src="${c.img}" alt="" style="width:100%;border-radius:14px;max-height:260px;object-fit:contain;background:var(--bg)">`:"";
  B().innerHTML=`${c.name?`<p class="inote">الطلب باسم <b>${esc(c.name)}</b></p>`:""}${img}<p style="white-space:pre-wrap;line-height:1.8;margin:0">${esc(c.desc)}</p>
   <p class="total" id="cutot">المبلغ: ${S(c.price)}</p><p class="inote">السعر شامل التجهيز.</p>
   <div id="cuform">${c.phoneMask?`<p class="inote">الطلب مسجّل باسم <b>${esc(c.name||"")}</b> · الجوال <b dir="ltr">${esc(c.phoneMask)}</b><br>تُحسب نقاط الولاء على هذا الرقم.</p>`:`<label class="flab" for="cuName">الاسم</label><input class="fin" id="cuName" autocomplete="name" maxlength="40" value="${esc(c.name||"")}">
   <label class="flab" for="cuPhone">رقم الجوال</label><input class="fin" id="cuPhone" inputmode="tel" autocomplete="tel" maxlength="20" placeholder="05xxxxxxxx" dir="ltr">`}
   <fieldset class="modes" id="cuModes"><legend class="flab">طريقة الاستلام (إلزامي)</legend>
    <label class="mode"><input type="radio" name="cuMode" value="delivery"><span><span class="mt">🚚 توصيل</span><small class="mf">رسوم ${PAY.ship} ريال</small></span></label>
    <label class="mode"><input type="radio" name="cuMode" value="pickup"><span><span class="mt">🏪 استلام مباشر</span><small class="mf">مجاني، نتفق معك على المكان والموعد</small></span></label></fieldset>
   <div class="dmsg" id="cumsg" aria-live="polite"></div>
   <button type="button" class="btn gold" id="cuPay" style="width:100%">ادفع الآن (بطاقة / Apple Pay)</button>
   <button type="button" class="btn alt" id="cuCod" style="margin-top:8px;width:100%">الدفع عند الاستلام</button></div>
   <div class="mysr-form" id="cumysr" hidden></div><p class="inote">الدفع عبر ميسر (مدى، البطاقات، Apple Pay). ما نحفظ بيانات بطاقتك. الرابط يعمل مرة واحدة.</p>`;
  const mode=()=>{const r=document.querySelector("input[name=cuMode]:checked");return r?r.value:""};
  const feeOf=(m,cod)=>m==="pickup"?0:(cod?(PAY.codShip==null?PAY.ship:PAY.codShip):PAY.ship);
  const upd=()=>{const m=mode(),t=document.getElementById("cutot");if(t)t.textContent=m?`المبلغ: ${S(c.price+feeOf(m,false))}`+(feeOf(m,false)?` (يشمل التوصيل ${PAY.ship})`:""):`المبلغ قبل التوصيل: ${S(c.price)}`};
  document.querySelectorAll("input[name=cuMode]").forEach(i=>i.onchange=upd);upd();
  const read=cod=>{const locked=!!c.phoneMask,n=locked?String(c.name||""):document.getElementById("cuName").value.trim(),p=locked?"":document.getElementById("cuPhone").value.replace(/\s/g,"");if(!locked&&(n.length<2||!/^(05\d{8}|\+?9665\d{8})$/.test(p))){msg("عبّي الاسم والجوال (05xxxxxxxx).",true);return null}const m=mode();if(!m){msg("اختر طريقة الاستلام: توصيل أو استلام مباشر.",true);return null}return{n,p,m,fee:feeOf(m,cod)}};
  document.getElementById("cuPay").onclick=async()=>{const v=read(false);if(!v)return;try{localStorage.setItem(KEY,JSON.stringify({name:v.n,phone:v.p,mode:v.m}))}catch(_){}
   try{await payLoad()}catch(_){msg("تعذر تحميل بوابة الدفع، جرّب مرة ثانية.",true);return}
   document.getElementById("cuform").hidden=true;const f=document.getElementById("cumysr");f.hidden=false;f.innerHTML="";
   Moyasar.init({element:"#cumysr",amount:(c.price+v.fee)*100,currency:"SAR",description:"RAX3D custom "+id.slice(0,5),publishable_api_key:PAY.pk,callback_url:location.origin+"/?c="+id,methods:PAY.methods,supported_networks:["visa","mastercard","mada"],
    ...(PAY.methods.includes("applepay")?{apple_pay:{country:"SA",label:"RAX3D",version:6,merchant_capabilities:["supports3DS"],validate_merchant_url:"https://api.moyasar.com/v1/applepay/initiate"}}:{}),
    metadata:{custom:id,name:v.n,phone:v.p,mode:v.m},on_completed:async pay=>{await confirm(pay.id,c)}})};
  document.getElementById("cuCod").onclick=async e=>{const v=read(true);if(!v)return;const t=e.currentTarget;t.disabled=true;msg("جاري إرسال طلبك…");
   let ts=null;if(PAY.ts){try{ts=await tsToken()}catch(_){msg("تعذّر التحقق الأمني. جرّب مرة ثانية.",true);t.disabled=false;return}}
   try{const r=await fetch(PAY.api+"/custom/cod",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,ts,mode:v.m,customer:{name:v.n,phone:v.p}})});const j=await r.json();
    if(j.ok){B().innerHTML=receipt(j.num,c.price,false,v.m,v.fee);return}
    msg(j.reason==="mode"?"اختر طريقة الاستلام.":j.reason==="used"?"هذا الرابط مستخدم من قبل.":j.reason==="captcha"?"ما تم التحقق الأمني. جرّب مرة ثانية.":j.reason==="fields"?"تأكد من الاسم والجوال.":"ما تم إرسال الطلب، جرّب مرة ثانية أو تواصل معنا.",true)}catch(_){msg("ما فيه اتصال، جرّب مرة ثانية.",true)}t.disabled=false}
 }
 (async()=>{
  const pid=q.get("id"),st=q.get("status");
  if(pid&&st){history.replaceState(null,"","/?c="+id);if(st==="paid"){await confirm(pid,null);return}B().innerHTML=`<p class="inote">ما تمت عملية الدفع (${esc(q.get("message")||st)}). تقدر تحاول مرة ثانية من نفس الرابط.</p><button type="button" class="btn" onclick="location.reload()">حاول مرة ثانية</button>`;return}
  try{const r=await fetch(PAY.api+"/custom/"+id,{cache:"no-store"});const c=await r.json();
   if(!c.ok){B().innerHTML=`<p class="inote">ما لقينا هذا الطلب. تأكد من الرابط أو تواصل معنا على @rax3d.sa</p>`;return}
   if(c.status!=="open"){B().innerHTML=`<p class="total">هذا الطلب ${c.status==="paid"?"مدفوع":"مسجّل"} ✓</p>${c.num?`<p class="inote">رقم الطلب <b dir="ltr">ORD-${+c.num}</b>. للاستفسار تواصل معنا على @rax3d.sa</p>`:""}`;return}
   try{await CFGP}catch(_){}
   form(c)}catch(_){B().innerHTML=`<p class="inote">ما فيه اتصال، حدّث الصفحة.</p>`}
 })();
})();
