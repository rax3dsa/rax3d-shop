// RAX3D payment check. The Moyasar secret key lives here (env.MOYASAR_SECRET), never in the site.
// POST /confirm  { paymentId, ref, customer:{name,phone,city,address}, cart:[{id,qty,color}] }
// Re-prices the cart from the live site, asks Moyasar what was really paid, then emails the order.
const SITE = 'https://rax3d.com';
// delivery fee added to every online and cash-on-delivery order (riyals). The site reads it from GET /config so both always agree.
const SHIP_FEE = 25;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function prices() {
  const html = await (await fetch(SITE + '/index.html', { cf: { cacheTtl: 60 } })).text();
  const P = JSON.parse(html.match(/const PRICE=(\{.*?\});/)[1]);
  const wRaw = html.match(/const WEIGHT=\{([\s\S]*?)\};/)[1];
  const W = Object.fromEntries([...wRaw.matchAll(/(\w+):([\d.]+)/g)].map(m => [m[1], +m[2]]));
  return { P, W };
}
const unit = ({ P, W }, id, q) => P[id] ? (q >= (W[id] >= 100 ? 6 : 12) ? P[id][1] : P[id][0]) : 0;

async function mail(env, subject, html) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.RESEND_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.MAIL_FROM || 'RAX3D <onboarding@resend.dev>', to: [env.MAIL_TO], subject, html })
  });
  return r.ok;
}


// ---- invoice numbering (shares counter.json with the invoicing app in the private data repo) ----
const b64e = s => { const b = new TextEncoder().encode(s); let o = ''; for (let i = 0; i < b.length; i += 0x8000) o += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(o) };
const b64d = s => new TextDecoder().decode(Uint8Array.from(atob(String(s).replace(/\s/g, '')), c => c.charCodeAt(0)));
const gh = (env, method, path, body) => fetch('https://api.github.com/repos/' + env.GH_REPO + '/contents/' + path, {
  method, headers: { Authorization: 'Bearer ' + env.GH_TOKEN, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'rax3d-pay', 'Content-Type': 'application/json' },
  body: body ? JSON.stringify(body) : undefined });
const ghRead = async (env, path) => { const r = await gh(env, 'GET', path); if (r.status === 404) return null; if (!r.ok) throw new Error('gh ' + r.status); const j = await r.json(); return { data: JSON.parse(b64d(j.content)), sha: j.sha } };
const ghCreate = async (env, path, data, msg) => { const r = await gh(env, 'PUT', path, { message: msg, content: b64e(JSON.stringify(data)) }); if (r.status === 422 || r.status === 409) return false; if (!r.ok) throw new Error('gh ' + r.status); return true };
const sleep = ms => new Promise(r => setTimeout(r, ms));
// reserve the next invoice number the same way the app does (optimistic write with the file sha)
async function reserveNumber(env) {
  for (let i = 0; i < 6; i++) {
    const c = await ghRead(env, 'counter.json'); const num = Number(c?.data?.next);
    if (!c || !Number.isInteger(num) || num < 1) throw new Error('counter');
    const r = await gh(env, 'PUT', 'counter.json', { message: 'رقم الفاتورة القادم ' + (num + 1), content: b64e(JSON.stringify({ next: num + 1 })), sha: c.sha });
    if (r.ok) return num;
    if (r.status !== 409 && r.status !== 422) throw new Error('gh ' + r.status);
    await sleep(500 + Math.random() * 700);
  }
  throw new Error('busy');
}
// read-modify-write a JSON file in the data repo with the sha (same optimistic pattern the app uses)
async function ghUpdate(env, path, def, fn, msg) {
  for (let i = 0; i < 6; i++) {
    const c = await ghRead(env, path); const nd = fn(c ? c.data : def);
    if (nd === undefined) return;
    const body = { message: msg, content: b64e(JSON.stringify(nd)) }; if (c) body.sha = c.sha;
    const r = await gh(env, 'PUT', path, body);
    if (r.ok) return;
    if (r.status !== 409 && r.status !== 422) throw new Error('gh ' + r.status);
    await sleep(500 + Math.random() * 700);
  }
  throw new Error('busy');
}
const riyadhDay = () => new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10);
async function names() { try { const j = await (await fetch(SITE + '/catalog.json', { cf: { cacheTtl: 60 } })).json(); return j.items || {} } catch { return {} } }


// ---- the invoice copy in the same look as the invoicing app (gold / cream, RTL) ----
function invoiceHtml(d) {
  const G = '#B8902A', GL = '#E0B64A', CR = '#FBF5E6', LN = '#D9D2C0', money = v => (Math.round(v * 100) / 100) + ' ر.س';
  const td = (s, x = '') => `<td style="border:1px solid ${LN};padding:9px 10px;${x}">${s}</td>`;
  const th = s => `<th style="background:#111;color:${GL};padding:9px 10px;border:1px solid #111">${s}</th>`;
  const lab = s => `<td style="background:#F1ECE0;border:1px solid ${LN};padding:9px 10px;font-weight:bold;width:28%">${s}</td>`;
  const body = d.rows.map((r, i) => `<tr style="background:${i % 2 ? CR : '#fff'}">${td(i + 1, 'text-align:center;color:#888')}${td(esc(r.name) + (r.color ? ` <span style="color:#888">(${esc(r.color)})</span>` : ''))}${td(r.q, 'text-align:center')}${td(money(r.u), 'text-align:center')}${td(money(r.u * r.q), 'text-align:center')}</tr>`).join('');
  const ship = d.ship ? `<tr>${lab('التوصيل')}${td(money(d.ship), 'text-align:center')}</tr>` : '';
  return `<div dir="rtl" style="max-width:640px;margin:auto;background:#fff;border:1px solid ${LN};font-family:Tahoma,Arial,sans-serif;color:#1a1a1a">
<div style="padding:22px 18px 10px;text-align:center"><img src="${SITE}/icon-192.png" width="84" height="84" alt="RAX3D" style="border-radius:14px"><div style="font-size:26px;font-weight:bold;color:${G};letter-spacing:2px;direction:ltr">RAX3D</div></div>
<div style="height:4px;background:${G};margin:0 18px"></div>
<div style="padding:12px 18px;overflow:hidden"><span style="float:right;font-size:20px;font-weight:bold;color:${G}">فاتورة</span><span style="float:left;font-weight:bold;color:${G}">رقم الطلب: <span dir="ltr">${esc(d.label)}</span></span></div>
<table style="width:calc(100% - 36px);margin:0 18px;border-collapse:collapse;font-size:14px">
<tr>${lab('رقم الفاتورة')}${td(`<b style="color:${G}">${esc(d.label)}</b>`)}${lab('التاريخ')}${td(`<span dir="ltr">${esc(d.date)}</span>`)}</tr>
<tr>${lab('اسم العميل')}<td colspan="3" style="border:1px solid ${LN};padding:9px 10px;background:${CR}">${esc(d.name)}</td></tr>
<tr>${lab('رقم الجوال')}<td colspan="3" style="border:1px solid ${LN};padding:9px 10px;background:${CR};direction:ltr;text-align:right">${esc(d.phone)}</td></tr></table>
<table style="width:calc(100% - 36px);margin:18px 18px 0;border-collapse:collapse;font-size:14px"><tr>${th('#')}${th('وصف القطعة')}${th('العدد')}${th('سعر الوحدة')}${th('الإجمالي')}</tr>${body}</table>
<table style="width:55%;margin:18px;border-collapse:collapse;font-size:14px;float:left">
<tr>${lab('المجموع')}${td(money(d.sub), 'text-align:center')}</tr>${ship}
<tr>${lab('الخصومات')}${td(money(0), 'text-align:center')}</tr>
<tr><td style="background:#111;color:${GL};padding:10px;font-weight:bold;border:1px solid #111">المجموع النهائي</td><td style="background:#111;color:${GL};padding:10px;font-weight:bold;text-align:center;border:1px solid #111">${money(d.total)}</td></tr></table>
<div style="clear:both;padding:14px 18px 0;font-size:13px;color:#2e7d32;font-weight:bold">${d.cod ? '<span style="color:#b26a00">⏳ الدفع عند الاستلام: المطلوب تحصيله ' + money(d.total) + '</span>' : '✓ مدفوعة (' + esc(d.method) + ')'}</div>
<div style="margin:16px 18px 0;background:${CR};border:1px solid ${LN};padding:12px 14px;font-size:12.5px;line-height:1.8;color:#333"><b style="color:${G};font-size:14px">سياسة الاستبدال والاسترجاع</b><br>• إذا وصلتك القطعة مكسورة، أو فيها عيب طباعة، أو تختلف عن طلبك في اللون أو المقاس، راسلنا خلال 3 أيام من الاستلام مع صورة، ونعيد طباعتها أو نستبدلها مجاناً.<br>• لأن القطع تنصنع لك خصيصاً، ما نقبل الإرجاع بسبب تغيير الرأي بعد بدء الطباعة.<br>• تقدر تلغي طلبك مجاناً قبل ما نبدأ الطباعة.<br>• القطع المخصصة (اسم أو عبارة أو مقاس معدّل) تُستبدل فقط إذا فيها عيب.<br>• الفرق البسيط في درجة اللون أو ظهور خطوط الطبقات طبيعي في الطباعة ثلاثية الأبعاد، وما يُعتبر عيب.</div>
<div style="height:4px;background:${G};margin:18px 18px 0"></div>
<div style="text-align:center;padding:14px 18px 6px;font-weight:bold;font-size:18px;color:${G}">شكراً لتعاملكم مع RAX3D</div>
<div style="text-align:center;font-size:12.5px;color:#444;direction:ltr">Instagram: @rax3d.sa &nbsp;|&nbsp; TikTok: @rax3d.sa &nbsp;|&nbsp; Email: rax3d.sa@hotmail.com</div>
<div style="text-align:center;font-size:12.5px;color:#444;padding:6px 0 16px">رقم وثيقة العمل الحر: <span dir="ltr">FL-255870895</span></div>
<div style="height:10px;background:#111"></div></div>`;
}

// Moyasar webhook (payment_refunded): a refunded payment cancels its invoice in the invoicing app
async function hook(req, env, out, ctx) {
  let e; try { e = await req.json() } catch { return out({ ok: false }, 400) }
  if (env.WEBHOOK_SECRET && e.secret_token !== env.WEBHOOK_SECRET) return out({ ok: false }, 401);
  const id = e.data && e.data.id;
  // payment_paid: wait a little so the customer's own browser confirms first (it shows them the order number); the marker file makes this a no-op then
  if (/^payment_paid$/i.test(String(e.type || '')) && /^[0-9a-f-]{36}$/i.test(id || '')) {
    const late = (async () => { await sleep(12000); await confirm({ paymentId: id }, env, out) })().catch(() => {});
    if (ctx && ctx.waitUntil) ctx.waitUntil(late); else await late;
    return out({ ok: true, queued: true });
  }
  if (!/refund/i.test(String(e.type || ''))) return out({ ok: true, ignored: true });
  if (!/^[0-9a-f-]{36}$/i.test(id || '') || !env.GH_TOKEN || !env.GH_REPO) return out({ ok: true, ignored: true });
  const r = await fetch('https://api.moyasar.com/v1/payments/' + id, { headers: { Authorization: 'Basic ' + btoa(env.MOYASAR_SECRET + ':') } });
  if (!r.ok) return out({ ok: false, reason: 'lookup' }, 502);
  const p = await r.json();
  const pay = await ghRead(env, 'online/pay_' + id + '.json');
  if (!pay) return out({ ok: true, ignored: true, reason: 'unlinked' });
  const num = pay.data.num, full = p.status === 'refunded' || (+p.refunded > 0 && +p.refunded >= +p.amount);
  if (full) {
    let fresh = false;
    await ghUpdate(env, 'partner_log.json', [], arr => { arr = Array.isArray(arr) ? arr : []; if (arr.some(x => x && Number(x.void) === Number(num))) return undefined; fresh = true; arr.push({ void: num, voidAt: riyadhDay(), payId: id }); return arr }, 'استرداد ORD-' + num);
    if (fresh) await mail(env, '🚫 استرداد ORD-' + num, `<p>تم استرداد دفعة الطلب <b>ORD-${num}</b> (${p.amount / 100} ${esc(p.currency)}).<br>الفاتورة تتحول «ملغاة» في برنامج الفواتير تلقائيًا أول ما تفتحه.</p>`);
  } else {
    await mail(env, '↩️ استرداد جزئي ORD-' + num, `<p>استرداد جزئي (${(+p.refunded || 0) / 100} من ${p.amount / 100} ${esc(p.currency)}) للطلب <b>ORD-${num}</b>. الفاتورة ما انلغت تلقائيًا، عدّلها أو ألغها من التطبيق لو تبغى.</p>`);
  }
  return out({ ok: true, num, voided: full });
}

// ---- loyalty balance lookup ----
// The invoicing app writes { phone: points } to points_private.json in the PRIVATE data repo. The site asks here with the visitor's own mobile,
// so no file with everybody's balances has to be public. Answers: {ok, src:'private', pts} | {ok, src:'none'} (file not published yet) | {ok:false}.
const normPhone = v => { let d = String(v || '').replace(/[٠-٩]/g, c => '٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/\D/g, ''); if (d.startsWith('00966')) d = d.slice(5); else if (d.startsWith('966')) d = d.slice(3); if (d.length === 9 && d[0] === '5') d = '0' + d; return d };
let PCACHE = { t: 0, d: null };      // per-isolate copy, refreshed at most once a minute
const PRL = new Map();               // best-effort per-IP limit (30 lookups a minute) against walking through phone numbers
async function points(req, env, out) {
  { const og = req.headers.get('Origin'); if (og && og !== SITE && og !== 'https://www.rax3d.com') return out({ ok: false, reason: 'origin' }, 403) }
  const ip = req.headers.get('CF-Connecting-IP') || '', now = Date.now();
  if (ip) { const a = (PRL.get(ip) || []).filter(t => now - t < 60000); if (a.length >= 30) return out({ ok: false, reason: 'limit' }, 429); a.push(now); PRL.set(ip, a); if (PRL.size > 5000) PRL.clear() }
  let b; try { b = await req.json() } catch { return out({ ok: false, reason: 'bad' }, 400) }
  const ph = normPhone(b && b.phone);
  if (!/^05\d{8}$/.test(ph)) return out({ ok: false, reason: 'bad' }, 400);
  if (!env.GH_TOKEN || !env.GH_REPO) return out({ ok: true, src: 'none' });
  if (now - PCACHE.t > 60000) {
    try { const f = await ghRead(env, 'points_private.json'); PCACHE = { t: now, d: f ? f.data : null } }
    catch (e) { if (!PCACHE.t) return out({ ok: false, reason: 'error' }, 502) }   // keep serving the last copy if GitHub hiccups
  }
  if (!PCACHE.d || PCACHE.d.v !== 1) return out({ ok: true, src: 'none' });
  return out({ ok: true, src: 'private', pts: Math.max(0, Math.floor(+((PCACHE.d.p || {})[ph]) || 0)) });
}

// Cash on delivery: no payment to verify. The order gets its ORD number, goes into the invoicing app's log (with loyalty points)
// and is emailed to the owner. If the order is cancelled, the owner cancels the invoice in the app.
async function cod(req, env, out) {
  let b; try { b = await req.json() } catch { return out({ ok: false, reason: 'bad' }, 400) }
  const c = b.customer || {}, name = String(c.name || '').trim().slice(0, 60), phone = String(c.phone || '').replace(/\s/g, '').slice(0, 20);
  const city = String(c.city || '').trim().slice(0, 40), address = String(c.address || '').trim().slice(0, 200);
  if (!/^RX-[A-Z0-9]{5}$/.test(b.ref || '') || !Array.isArray(b.cart) || !b.cart.length || b.cart.length > 40) return out({ ok: false, reason: 'bad' }, 400);
  { const og = req.headers.get('Origin'); if (og && og !== SITE && og !== 'https://www.rax3d.com') return out({ ok: false, reason: 'origin' }, 403) }
  if (name.length < 2 || !/^(05\d{8}|\+?9665\d{8})$/.test(phone)) return out({ ok: false, reason: 'fields' }, 400);
  const pr = await prices(); let sub = 0; const rows = [];
  for (const o of b.cart) {
    const q = Math.floor(+o.qty), u = unit(pr, String(o.id), q);
    if (!u || !(q >= 1 && q <= 500)) return out({ ok: false, reason: 'item' }, 400);
    sub += u * q; rows.push({ id: String(o.id), q, u, color: String(o.color || '').slice(0, 30) });
  }
  const ship = SHIP_FEE, total = sub + ship;
  // unpaid COD orders earn loyalty points at once, so one fake order of 40 items x 500 pcs could mint huge points.
  // Cap the COD order value (COD_MAX riyals, default 1500, 0 = no cap); bigger orders pay online or go by DM.
  const codMax = env.COD_MAX === undefined ? 1500 : +env.COD_MAX;
  if (codMax > 0 && total > codMax) return out({ ok: false, reason: 'max', max: codMax }, 400);
  if (!env.GH_TOKEN || !env.GH_REPO) return out({ ok: false, reason: 'config' }, 500);
  let num, dup = false, logFail = false;
  const nm0 = await names();
  try {
    const done = await ghRead(env, 'online/cod_' + b.ref + '.json');
    if (done) { num = done.data.num; dup = true }
    else {
      // abuse guard: per phone (COD_LIMIT, default 5/day, 0 = unlimited) and per IP (COD_IP_LIMIT, default 10/day, 0 = unlimited)
      const now = Date.now(), ip = req.headers.get('CF-Connecting-IP') || '';
      const ipHash = ip ? [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('rax3d|' + ip)))].slice(0, 8).map(x => x.toString(16).padStart(2, '0')).join('') : '';
      const guards = [['rl_' + phone.replace(/\D/g, '').slice(-9), env.COD_LIMIT === undefined ? 5 : +env.COD_LIMIT]];
      if (ipHash) guards.push(['ip_' + ipHash, env.COD_IP_LIMIT === undefined ? 10 : +env.COD_IP_LIMIT]);
      for (const [k, cap] of guards) {
        if (!(cap > 0)) continue;
        const g = await ghRead(env, 'online/' + k + '.json');
        if (((g && g.data.t) || []).filter(t => now - t < 864e5).length >= cap) return out({ ok: false, reason: 'limit' }, 429);
      }
      for (const [k, cap] of guards) if (cap > 0) await ghUpdate(env, 'online/' + k + '.json', { t: [] }, d => ({ t: [...(d.t || []).filter(t => now - t < 864e5), now] }), 'حد الطلبات');
      num = await reserveNumber(env);
      // the marker is created first and acts as a lock: a second identical request (double tap) stops here instead of making a second invoice
      if (!(await ghCreate(env, 'online/cod_' + b.ref + '.json', { num }, 'ربط الطلب ' + b.ref))) { const w = await ghRead(env, 'online/cod_' + b.ref + '.json'); return out({ ok: true, num: w ? w.data.num : num, dup: true }) }
      await ghCreate(env, 'online/ORD-' + num + '.json', { num, cod: true, ref: b.ref, total, customer: { name, phone, city, address }, cart: rows, at: new Date().toISOString() }, 'طلب دفع عند الاستلام ORD-' + num);
      // the invoice already has its number, so it goes straight into the invoicing app's log (points included)
      const rec = { num, date: riyadhDay(), online: true, cod: true, payId: 'cod_' + b.ref, client: name, phone, code: b.ref,
        desc: rows.map(r => (nm0[r.id]?.n || r.id) + ' (' + r.q + ')').join(' ، '), qty: rows.reduce((a, r) => a + r.q, 0), disc: 0, total: sub, profit: 0, sugg: 0, sub,
        items: rows.map(r => ({ desc: nm0[r.id]?.n || r.id, q: r.q, unit: r.u, line: r.u * r.q, cost: 0, w: +pr.W[r.id] || 0, h: 0, m: 0, sec: 0, type: 'واحدة', auto: false, dp: 0 })) };
      try { await ghUpdate(env, 'partner_log.json', [], arr => { arr = Array.isArray(arr) ? arr : []; if (!arr.some(x => x && Number(x.num) === num)) arr.push(rec); return arr }, 'فاتورة دفع عند الاستلام ORD-' + num) } catch (e) { logFail = true }
    }
  } catch (e) { return out({ ok: false, reason: 'number' }, 502) }
  if (dup) return out({ ok: true, num, dup: true });
  const nm = await names(), label = 'ORD-' + num;
  rows.forEach(r => { r.name = nm[r.id]?.n || r.id });
  const msg = [`طلب ${label} (دفع عند الاستلام)`, `* الاسم: ${name}`, `* الجوال: ${phone}`,
    ...rows.map(r => `\n* القطعة: ${r.name}\n* اللون: ${r.color || 'كما بالصورة'}\n* الكمية: ${r.q}`)].join('\n');
  const html = `<p style="font-size:16px"><b>🚚 طلب جديد بالدفع عند الاستلام ${esc(label)}</b><br>الطلب غير مدفوع، تحصّل ${total} ريال عند التسليم. ${logFail ? '⚠️ تعذّر إضافته تلقائيًا لبرنامج الفواتير، الصق الرسالة أسفل في «استيراد الطلب».' : 'الفاتورة انسجلت تلقائيًا في برنامج الفواتير (بنقاط الولاء) أول ما تفتحه. إذا انلغى الطلب ألغ الفاتورة من التطبيق.'}</p>`
    + invoiceHtml({ label, date: riyadhDay(), name, phone, rows, sub, ship, total, cod: true })
    + `<p>الجوال: <span dir="ltr">${esc(phone)}</span></p><p>العنوان يُتفق عليه بالتواصل مع العميل.</p>`
    + `<p>للتسجيل في التطبيق بنفس الرقم، الصق هذه الرسالة في «استيراد الطلب»:</p><pre style="background:#f4f1ea;padding:10px;border-radius:8px;white-space:pre-wrap">${esc(msg)}</pre>`;
  const sent = await mail(env, '🚚 طلب دفع عند الاستلام ' + label, html);
  return out({ ok: true, num, emailed: sent });
}

async function handle(req, env, ctx) {
  {
    // answer CORS for both the bare domain and www (the origin checks below already accept both)
    const og0 = req.headers.get('Origin'), allow = og0 === 'https://www.rax3d.com' ? og0 : SITE;
    const cors = { 'Access-Control-Allow-Origin': allow, 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' };
    const out = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const path = new URL(req.url).pathname;
    if (req.method === 'POST' && path === '/webhook') return hook(req, env, out, ctx);
    if (req.method === 'POST' && path === '/cod') return cod(req, env, out);
    if (req.method === 'POST' && path === '/points') return points(req, env, out);
    if (req.method === 'GET' && path === '/config') return out({ ok: true, ship: SHIP_FEE });
    if (req.method !== 'POST' || path !== '/confirm') return out({ ok: false }, 404);

    { const og = req.headers.get('Origin'); if (og && og !== SITE && og !== 'https://www.rax3d.com') return out({ ok: false, reason: 'origin' }, 403) }
    let b; try { b = await req.json() } catch { return out({ ok: false, reason: 'bad' }, 400) }
    return confirm(b, env, out);
  }
}

// A payment that Moyasar says is paid must never vanish: if anything breaks after that point, the owner gets an email with the payment id.
async function confirm(b, env, out) {
  const flag = { paid: false };
  try { return await confirmCore(b, env, out, flag) }
  catch (e) {
    if (!flag.paid) throw e;
    try { await mail(env, '⚠️ دفعة مدفوعة تعذّر تأكيدها', `<p>العميل دفع لكن تعذّر تسجيل الطلب تلقائيًا. راجع الدفعة في لوحة ميسر وتواصل مع العميل.</p><p>رقم الدفعة: <span dir="ltr">${esc(b && b.paymentId)}</span><br>الخطأ: ${esc(String(e && e.message || e).slice(0, 200))}</p>`) } catch (_) {}
    return out({ ok: false, reason: 'error', paid: true }, 500);
  }
}
async function confirmCore(b, env, out, flag) {
  {
    if (!b || !/^[0-9a-f-]{36}$/i.test(b.paymentId || '')) return out({ ok: false, reason: 'bad' }, 400);

    // 1) what Moyasar says was paid (also carries the order details, so a confirm still works if the browser lost them)
    // Apple Pay / mada can still be "initiated" for a moment right after the sheet closes, so look again a few times
    let p = null, st = '';
    for (let i = 0; i < 5; i++) {
      const r = await fetch('https://api.moyasar.com/v1/payments/' + b.paymentId, { headers: { Authorization: 'Basic ' + btoa(env.MOYASAR_SECRET + ':') } });
      if (!r.ok) return out({ ok: false, reason: 'lookup', code: r.status }, 502);
      p = await r.json(); st = p.status;
      if (st === 'paid' || st === 'failed' || st === 'voided' || st === 'refunded') break;
      await sleep(1500);
    }
    if (p.status !== 'paid') return out({ ok: false, reason: 'unpaid', status: p.status });
    flag.paid = true;
    const md = p.metadata || {};
    if (!/^RX-[A-Z0-9]{5}$/.test(b.ref || '')) b.ref = md.ref;
    if (!Array.isArray(b.cart) || !b.cart.length) {
      const cols = {}; String(md.cols || '').split(',').forEach(s => { const i = s.indexOf(':'); if (i > 0) cols[s.slice(0, i)] = s.slice(i + 1) });
      b.cart = String(md.items || '').split(',').filter(Boolean).map(s => { const i = s.lastIndexOf('x'); return { id: s.slice(0, i), qty: +s.slice(i + 1), color: cols[s.slice(0, i)] || '' } });
    }
    const c = (b.customer && b.customer.name) ? b.customer : { name: md.name || '', phone: md.phone || '' };
    if (!/^RX-[A-Z0-9]{5}$/.test(b.ref || '') || !Array.isArray(b.cart) || !b.cart.length || b.cart.length > 40) return out({ ok: false, reason: 'bad' }, 400);

    // 2) what the cart should cost, from the live site prices
    const pr = await prices(); let total = 0; const lines = [], rows = [];
    for (const o of b.cart) {
      const q = Math.floor(+o.qty), u = unit(pr, String(o.id), q);
      if (!u || !(q >= 1 && q <= 500)) return out({ ok: false, reason: 'item' }, 400);
      total += u * q; rows.push({ id: String(o.id), q, u, color: String(o.color || '').slice(0, 30) }); lines.push(`${esc(o.id)} × ${q} (${esc(String(o.color || '').slice(0, 30))}) = ${u * q} ريال`);
    }
    total += SHIP_FEE;

    const info = `<p>رقم الطلب: <b>${esc(b.ref)}</b><br>الاسم: ${esc((c.name || '').slice(0, 60))}<br>الجوال: ${esc((c.phone || '').slice(0, 20))}<br>المدينة: ${esc((c.city || '').slice(0, 40))}<br>العنوان: ${esc((c.address || '').slice(0, 200))}</p><p>${lines.join('<br>')}</p><p>المدفوع: <b>${p.amount / 100} ${esc(p.currency)}</b> · طريقة الدفع: ${esc(p.source?.type || '')} · رقم الدفعة: ${esc(p.id)}</p>`;

    // 3) paid but the amount is not what we expect -> do not confirm, alert the owner
    if (p.currency !== 'SAR' || p.amount !== Math.round(total * 100) || p.metadata?.ref !== b.ref) {
      await mail(env, '⚠️ دفعة تحتاج مراجعة ' + b.ref, `<p>المتوقع: ${total} ريال</p>` + info);
      return out({ ok: false, reason: 'mismatch', paid: true });
    }
    // 4) order number = the next invoice number (ORD-n), reserved once per payment. Without GH_TOKEN we fall back to the old RX code.
    let num = null, dup = false, logFail = false;
    if (env.GH_TOKEN && env.GH_REPO) {
      try {
        const done = await ghRead(env, 'online/pay_' + b.paymentId + '.json');
        if (done) { num = done.data.num; dup = true }
        else {
          num = await reserveNumber(env);
          const order = { num, paymentId: b.paymentId, ref: b.ref, amount: p.amount / 100, currency: p.currency, method: p.source?.type || '', customer: { name: (c.name || '').slice(0, 60), phone: (c.phone || '').slice(0, 20), city: (c.city || '').slice(0, 40), address: (c.address || '').slice(0, 200) }, cart: b.cart.map(o => ({ id: String(o.id), qty: Math.floor(+o.qty), color: String(o.color || '').slice(0, 30) })), at: new Date().toISOString() };
          // the payment marker is created first and acts as a lock: a second confirm for the same payment (double tap, or the paid webhook) stops here
          if (!(await ghCreate(env, 'online/pay_' + b.paymentId + '.json', { num }, 'ربط الدفعة بالطلب ORD-' + num))) { const w = await ghRead(env, 'online/pay_' + b.paymentId + '.json'); return out({ ok: true, num: w ? w.data.num : null, dup: true }) }
          await ghCreate(env, 'online/ORD-' + num + '.json', order, 'طلب مدفوع ORD-' + num);
          // the invoice itself goes to the same shared inbox the data-entry phone uses; the app imports it into its log
          const nm0 = await names(), itemsT = total - (SHIP_FEE);
          const rec = { num, date: riyadhDay(), online: true, payId: b.paymentId, client: (c.name || '').slice(0, 60), phone: (c.phone || '').slice(0, 20), code: b.ref,
            desc: rows.map(r => (nm0[r.id]?.n || r.id) + ' (' + r.q + ')').join(' ، '), qty: rows.reduce((a, r) => a + r.q, 0), disc: 0, total: itemsT, profit: 0, sugg: 0, sub: itemsT,
            items: rows.map(r => ({ desc: nm0[r.id]?.n || r.id, q: r.q, unit: r.u, line: r.u * r.q, cost: 0, w: +pr.W[r.id] || 0, h: 0, m: 0, sec: 0, type: 'واحدة', auto: false, dp: 0 })) };
          try { await ghUpdate(env, 'partner_log.json', [], arr => { arr = Array.isArray(arr) ? arr : []; if (!arr.some(x => x && Number(x.num) === num)) arr.push(rec); return arr }, 'فاتورة طلب مدفوع ORD-' + num) } catch (e) { logFail = true }
        }
      } catch (e) { num = null }
    } else if (env.ORDERS) { if (await env.ORDERS.get(b.ref)) return out({ ok: true, dup: true }); await env.ORDERS.put(b.ref, '1', { expirationTtl: 60 * 60 * 24 * 30 }) }
    if (dup) return out({ ok: true, num, dup: true });

    // 5) the email: the order message is in the same format the invoicing app already imports
    const nm = await names();
    const label = num ? 'ORD-' + num : b.ref;
    const msg = [`طلب مدفوع ${label}`, `* الاسم: ${(c.name || '').slice(0, 60)}`, `* الجوال: ${(c.phone || '').slice(0, 20)}`,
      ...b.cart.map(o => `\n* القطعة: ${nm[o.id]?.n || o.id}\n* اللون: ${String(o.color || 'كما بالصورة').slice(0, 30)}\n* الكمية: ${Math.floor(+o.qty)}`)].join('\n');
    const today = new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10);
    const invoice = invoiceHtml({ label, date: today, name: c.name || '', phone: c.phone || '', rows: rows.map(r => ({ ...r, name: nm[r.id]?.n || r.id })), sub: total - (SHIP_FEE), ship: SHIP_FEE, total, method: p.source?.type === 'applepay' ? 'Apple Pay' : (p.source?.company ? String(p.source.company).toUpperCase() : (p.source?.type || '')) });
    const html = invoice + `<hr style="margin:26px 0;border:0;border-top:1px dashed #ccc"><p>طلب مدفوع <b>${esc(label)}</b>${num ? '' : ' (بدون رقم فاتورة، تعذّر حجز الرقم)'}</p>` + info.replace(esc(b.ref), esc(label)) +
      ((logFail || !num) ? `<p style="color:#b00">⚠️ تعذّر إضافة الفاتورة تلقائيًا لبرنامج الفواتير. الصق الرسالة التالية في التطبيق (استيراد الطلب) عشان تنحفظ بنفس الرقم:</p><pre style="background:#f4f1ea;padding:10px;border-radius:8px;white-space:pre-wrap">${esc(msg)}</pre>` : `<p>✓ الفاتورة دخلت برنامج الفواتير تلقائيًا (تظهر لك أول ما تفتحه).</p>`);
    const sent = await mail(env, '✅ طلب مدفوع ' + label, html);
    return out({ ok: true, num, emailed: sent });
  }
}

// any unexpected exception still answers with JSON + CORS, so the page can show its "contact us with your payment number" message
export default {
  async fetch(req, env, ctx) {
    try { return await handle(req, env, ctx) }
    catch (e) {
      return new Response(JSON.stringify({ ok: false, reason: 'error' }), { status: 500, headers: { 'Access-Control-Allow-Origin': SITE, 'Content-Type': 'application/json', 'Vary': 'Origin' } });
    }
  }
};
