// RAX3D payment check. The Moyasar secret key lives here (env.MOYASAR_SECRET), never in the site.
// POST /confirm  { paymentId, ref, customer:{name,phone,city,address}, cart:[{id,qty,color}] }
// Re-prices the cart from the live site, asks Moyasar what was really paid, then emails the order.
const SITE = 'https://rax3d.com';
// delivery fee added to every online and cash-on-delivery order (riyals). The site reads it from GET /config so both always agree.
const SHIP_FEE = 25;
// cash on delivery is a direct handover (no delivery), so it carries no delivery fee. The site reads it from GET /config (codShip).
const COD_SHIP_FEE = 0;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function prices() {
  const html = await (await fetch(SITE + '/index.html', { cf: { cacheTtl: 60 } })).text();
  const P = JSON.parse(html.match(/const PRICE=(\{.*?\});/)[1]);
  const wRaw = html.match(/const WEIGHT=\{([\s\S]*?)\};/)[1];
  const W = Object.fromEntries([...wRaw.matchAll(/(\w+):([\d.]+)/g)].map(m => [m[1], +m[2]]));
  return { P, W };
}
const unit = ({ P, W }, id, q) => P[id] ? (q >= (W[id] >= 100 ? 6 : 12) ? P[id][1] : P[id][0]) : 0;

// extra recipients for the NEW ORDER emails (the owner's partner Ahmed): set ORDERS_MAIL_EXTRA in the Cloudflare dashboard as a comma list (kept out of this public repo; keep_vars protects it)
const orderExtra = env => String(env.ORDERS_MAIL_EXTRA || '').split(',').map(e => e.trim()).filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)).slice(0, 3);
async function mail(env, subject, html, extra) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.RESEND_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.MAIL_FROM || 'RAX3D <onboarding@resend.dev>', to: [env.MAIL_TO, ...(extra || [])], subject, html })
  });
  return r.ok;
}


// ---- Cloudflare Turnstile (bot check) for the two public endpoints that can be abused: /cod (fake orders) and /points (balance look-ups).
// Active only when TURNSTILE_SECRET is set (and TURNSTILE_SITEKEY, which /config hands to the page); otherwise nothing changes.
async function turnstileOk(env, token, ip) {
  if (!env.TURNSTILE_SECRET) return true;
  if (typeof token !== 'string' || !token || token.length > 2048) return false;
  try {
    const fd = new FormData(); fd.append('secret', env.TURNSTILE_SECRET); fd.append('response', token); if (ip) fd.append('remoteip', ip);
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: fd });
    const j = await r.json(); return !!(j && j.success);
  } catch (_) { return false }
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
// create OR overwrite a file (the order backup ORD-n.json can already exist when a number was freed and reused)
async function ghSave(env, path, data, msg) {
  for (let i = 0; i < 3; i++) {
    const cur = await ghRead(env, path), body = { message: msg, content: b64e(JSON.stringify(data)) }; if (cur) body.sha = cur.sha;
    const r = await gh(env, 'PUT', path, body); if (r.ok) return true; if (r.status !== 409 && r.status !== 422) throw new Error('gh ' + r.status);
    await sleep(300);
  }
  return false;
}
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


// ---- bank transfer details on the invoice copy: same source the invoicing app uses (settings in shared.json of the private data repo) and the same IBAN rule ----
function ibanOk(v) { v = String(v || '').replace(/\s+/g, '').toUpperCase(); if (!/^SA\d{22}$/.test(v)) return false; const r = v.slice(4) + v.slice(0, 4); let m = 0; for (const ch of r) m = (m * (/\d/.test(ch) ? 10 : 100) + (/\d/.test(ch) ? +ch : ch.charCodeAt(0) - 55)) % 97; return m === 1 }
let BCACHE = { t: 0, d: null };      // per-isolate copy, refreshed at most every 5 minutes
async function bankInfo(env) {
  if (!env.GH_TOKEN || !env.GH_REPO) return null;
  const now = Date.now(); if (BCACHE.t && now - BCACHE.t < 300000) return BCACHE.d;
  try {
    const f = await ghRead(env, 'shared.json'), st = (f && f.data && f.data.settings) || {}, iban = String(st.bankIban || '').replace(/\s+/g, '').toUpperCase();
    BCACHE = { t: now, d: ibanOk(iban) ? { bank: String(st.bankName || '').slice(0, 80), holder: String(st.bankHolder || '').slice(0, 80), iban } : null };
  } catch (e) { if (!BCACHE.t) return null }   // keep the last copy if GitHub hiccups
  return BCACHE.d;
}

// ---- the invoice copy in the same look as the invoicing app (gold / cream, RTL) ----
function invoiceHtml(d) {
  const G = '#B8902A', GL = '#E0B64A', CR = '#FBF5E6', LN = '#D9D2C0', money = v => (Math.round(v * 100) / 100) + ' ر.س';
  const td = (s, x = '') => `<td style="border:1px solid ${LN};padding:9px 10px;${x}">${s}</td>`;
  const th = s => `<th style="background:#111;color:${GL};padding:9px 10px;border:1px solid #111">${s}</th>`;
  const lab = s => `<td style="background:#F1ECE0;border:1px solid ${LN};padding:9px 10px;font-weight:bold;width:28%">${s}</td>`;
  const body = d.rows.map((r, i) => `<tr style="background:${i % 2 ? CR : '#fff'}">${td(i + 1, 'text-align:center;color:#888')}${td(esc(r.name) + (r.color ? ` <span style="color:#888">(${esc(r.color)})</span>` : ''))}${td(r.q, 'text-align:center')}${td(money(r.u), 'text-align:center')}${td(money(r.u * r.q), 'text-align:center')}</tr>`).join('');
  const ship = d.ship ? `<tr>${lab('التوصيل')}${td(money(d.ship), 'text-align:center')}</tr>` : '';
  const bk = d.bank, bank = bk ? `<div style="margin:16px 18px 0;border:1px solid ${G};padding:10px 12px"><b style="color:${G};font-size:14px">بيانات التحويل البنكي</b><table style="width:100%;margin-top:8px;border-collapse:collapse;font-size:14px"><tr>${lab('البنك')}${td(esc(bk.bank || 'مصرف الراجحي'))}</tr>${bk.holder ? `<tr>${lab('اسم المستفيد')}${td(esc(bk.holder))}</tr>` : ''}<tr>${lab('رقم الآيبان (IBAN)')}${td(`<b dir="ltr" style="letter-spacing:1px;font-size:15px">${esc(bk.iban.replace(/(.{4})/g, '$1 ').trim())}</b>`, 'text-align:left')}</tr></table></div>` : '';
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
<div style="clear:both;padding:14px 18px 0;font-size:13px;color:#2e7d32;font-weight:bold">${d.cod ? '<span style="color:#b26a00">⏳ الدفع عند الاستلام: المطلوب دفعه ' + money(d.total) + '</span>' : '✓ مدفوعة (' + esc(d.method) + ')'}</div>${bank}
<div style="margin:16px 18px 0;background:${CR};border:1px solid ${LN};padding:12px 14px;font-size:12.5px;line-height:1.8;color:#333"><b style="color:${G};font-size:14px">سياسة الاستبدال والاسترجاع</b><br>• إذا وصلتك القطعة مكسورة، أو فيها عيب طباعة، أو تختلف عن طلبك في اللون أو المقاس، راسلنا خلال 3 أيام من الاستلام مع صورة، ونعيد طباعتها أو نستبدلها مجاناً.<br>• لأن القطع تنصنع لك خصيصاً، ما نقبل الإرجاع بسبب تغيير الرأي بعد بدء الطباعة.<br>• تقدر تلغي طلبك مجاناً قبل ما نبدأ الطباعة.<br>• القطع المخصصة (اسم أو عبارة أو مقاس معدّل) تُستبدل فقط إذا فيها عيب.<br>• الفرق البسيط في درجة اللون أو ظهور خطوط الطبقات طبيعي في الطباعة ثلاثية الأبعاد، وما يُعتبر عيب.</div>
<div style="height:4px;background:${G};margin:18px 18px 0"></div>
<div style="text-align:center;padding:14px 18px 6px;font-weight:bold;font-size:18px;color:${G}">شكراً لتعاملكم مع RAX3D</div>
<div style="text-align:center;font-size:12.5px;color:#444;direction:ltr">Instagram: @rax3d.sa &nbsp;|&nbsp; TikTok: @rax3d.sa &nbsp;|&nbsp; Email: rax3d.sa@hotmail.com</div>
<div style="text-align:center;font-size:12.5px;color:#444;padding:6px 0 16px">رقم وثيقة العمل الحر: <span dir="ltr">FL-255870895</span></div>
<div style="height:10px;background:#111"></div></div>`;
}

// Moyasar webhook (payment_refunded): a refunded payment cancels its invoice in the invoicing app
// Moyasar dashboard "Verify Webhook": Moyasar POSTs a webhook_verification event whose data.verification_code (6 digits, valid 30 minutes)
// must be typed into the dashboard. The code is mailed to the owner. It is handled before the secret check because that event may not carry the
// secret; only 6 digits are ever mailed, and at most 5 mails an hour per isolate, so it cannot be used to flood the inbox.
let VRL = [];
let WHL = [];
async function hook(req, env, out, ctx) {
  let e; try { e = await req.json() } catch { return out({ ok: false }, 400) }
  if (e && e.type === 'webhook_verification') {
    const code = String((e.data && e.data.verification_code) || '');
    if (!/^\d{6}$/.test(code)) return out({ ok: true, ignored: true });
    const now = Date.now(); VRL = VRL.filter(t => now - t < 3600e3);
    if (VRL.length >= 5) return out({ ok: false, reason: 'limit' }, 429);
    VRL.push(now);
    await mail(env, '🔑 رمز تحقق Webhook ميسر: ' + code, `<p style="font-size:22px">رمز التحقق: <b dir="ltr">${code}</b></p><p>اكتبه في نافذة «Verify Webhook» في لوحة ميسر. صالح 30 دقيقة.</p>`);
    return out({ ok: true });
  }
  if (env.WEBHOOK_SECRET && e.secret_token !== env.WEBHOOK_SECRET) return out({ ok: false }, 401);
  // no WEBHOOK_SECRET set: anyone could post fake events, so cap the unauthenticated ones (confirm still re-checks Moyasar). Set WEBHOOK_SECRET to remove this cap.
  if (!env.WEBHOOK_SECRET) { const now2 = Date.now(); WHL = WHL.filter(t => now2 - t < 3600e3); if (WHL.length >= 30) return out({ ok: false, reason: 'limit' }, 429); WHL.push(now2) }
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
const PRL = new Map();               // best-effort per-IP limit (12 lookups a minute) against walking through phone numbers
async function points(req, env, out) {
  { const og = req.headers.get('Origin'); if (og && og !== SITE && og !== 'https://www.rax3d.com') return out({ ok: false, reason: 'origin' }, 403) }
  const ip = req.headers.get('CF-Connecting-IP') || '', now = Date.now();
  if (ip) { const a = (PRL.get(ip) || []).filter(t => now - t < 60000); if (a.length >= 12) return out({ ok: false, reason: 'limit' }, 429); a.push(now); PRL.set(ip, a); if (PRL.size > 5000) PRL.clear() }
  let b; try { b = await req.json() } catch { return out({ ok: false, reason: 'bad' }, 400) }
  const ph = normPhone(b && b.phone);
  if (!/^05\d{8}$/.test(ph)) return out({ ok: false, reason: 'bad' }, 400);
  if (!(await turnstileOk(env, b && b.ts, ip))) return out({ ok: false, reason: 'captcha' }, 403);
  if (!env.GH_TOKEN || !env.GH_REPO) return out({ ok: true, src: 'none' });
  if (now - PCACHE.t > 60000) {
    try { const f = await ghRead(env, 'points_private.json'); PCACHE = { t: now, d: f ? f.data : null } }
    catch (e) { if (!PCACHE.t) return out({ ok: false, reason: 'error' }, 502) }   // keep serving the last copy if GitHub hiccups
  }
  if (!PCACHE.d || PCACHE.d.v !== 1) return out({ ok: true, src: 'none' });
  const tr = (PCACHE.d.t || {})[ph];   // loyalty tier + total purchases, published by the invoicing app
  return out({ ok: true, src: 'private', pts: Math.max(0, Math.floor(+((PCACHE.d.p || {})[ph]) || 0)), tier: Array.isArray(tr) ? Math.max(0, Math.min(2, tr[0] | 0)) : null, sp: Array.isArray(tr) ? Math.max(0, tr[1] | 0) : 0 });
}



// ---- order tracking for the signed-in customer: POST /orders {phone, ts} -> his orders with their stage ----
// tracking_private.json (written by the invoicing app) = { v:1, o:{ "05xxxxxxxx":[{ n, d, st:0..4, it:[names] }] } }. Only these four fields are returned (no address, no prices).
const TRL = new Map();
let TCACHE = { t: 0, d: null };
let OCACHE = { t: 0, p: [], g: {} };
async function ordersPost(req, env, out) {
  { const og = req.headers.get('Origin'); if (og && og !== SITE && og !== 'https://www.rax3d.com') return out({ ok: false, reason: 'origin' }, 403) }
  const ip = req.headers.get('CF-Connecting-IP') || '', now = Date.now();
  if (ip) { const a = (TRL.get(ip) || []).filter(t => now - t < 60000); if (a.length >= 12) return out({ ok: false, reason: 'limit' }, 429); a.push(now); TRL.set(ip, a); if (TRL.size > 5000) TRL.clear() }
  let b; try { b = await req.json() } catch { return out({ ok: false, reason: 'bad' }, 400) }
  const ph = normPhone(b && b.phone);
  if (!/^05\d{8}$/.test(ph)) return out({ ok: false, reason: 'bad' }, 400);
  if (!(await turnstileOk(env, b && b.ts, ip))) return out({ ok: false, reason: 'captcha' }, 403);
  if (!env.GH_TOKEN || !env.GH_REPO) return out({ ok: true, o: [] });
  if (now - TCACHE.t > 60000) {
    try { const f = await ghRead(env, 'tracking_private.json'); TCACHE = { t: now, d: f ? f.data : null } }
    catch (e) { if (!TCACHE.t) return out({ ok: false, reason: 'error' }, 502) }
  }
  const mine = TCACHE.d && TCACHE.d.v === 1 && TCACHE.d.o && Array.isArray(TCACHE.d.o[ph]) ? TCACHE.d.o[ph].map(x => ({ ...x })) : [];
  // fresher sources: the shared inbox of site orders (an order appears at once, before the owner imports it) and the live stages written from the Orders tab
  if (now - OCACHE.t > 60000) { try { const a = await ghRead(env, 'partner_log.json'), g = await ghRead(env, 'order_stages.json'); OCACHE = { t: now, p: a && Array.isArray(a.data) ? a.data : [], g: g && g.data && g.data.o ? g.data.o : {} } } catch (e) { if (!OCACHE.t) OCACHE = { t: now, p: [], g: {} } } }
  const have = new Set(mine.map(x => String(x.n)));
  for (const r of OCACHE.p) if (r && r.online && normPhone(r.phone) === ph && !have.has(String(r.num)) && !OCACHE.p.some(v => v && v.void != null && Number(v.void) === Number(r.num))) { mine.push({ n: r.num, d: r.date, st: 0, it: String(r.desc || '').split(' ، ').slice(0, 6) }); have.add(String(r.num)) }
  for (const x of mine) { const o = OCACHE.g[String(x.n)]; if (o && o.st != null) x.st = +o.st }
  const list = mine.sort((a, b) => b.n - a.n);
  return out({ ok: true, o: list.slice(0, 15).map(r => ({ n: r.n, d: String(r.d || '').slice(0, 10), st: Math.max(0, Math.min(4, +r.st || 0)), it: (Array.isArray(r.it) ? r.it : []).slice(0, 6).map(x => String(x).slice(0, 60)) })) });
}


// ---- weekly vote on the next piece (owner's idea 8): the options are the shop's EXISTING categories only ----
// poll.json (written by the invoicing app): { id, title, opts:[category names], end:'YYYY-MM-DD' }.  votes.json: { id, c:{cat:n}, cc:{cat:n} (voters whose mobile is a known customer), v:{phoneHash:cat} }
// GET /poll -> poll + counts. POST /vote {id, opt, phone, ts}: one vote per mobile per poll, 10/hour per IP, Turnstile if on, only while the poll is open.
const VTRL = new Map();
let PLC = { t: 0, p: null, v: null };
async function pollState(env) {
  const now = Date.now();
  if (PLC.t && now - PLC.t < 60000) return PLC;
  try { const a = await ghRead(env, 'poll.json'), b = await ghRead(env, 'votes.json'); PLC = { t: now, p: a ? a.data : null, v: b ? b.data : null } }
  catch (e) { if (!PLC.t) throw e }
  return PLC;
}
const pollOpen = p => p && p.id && Array.isArray(p.opts) && p.opts.length >= 2 && typeof p.end === 'string' && riyadhDay() <= p.end;
async function pollGet(env, out) {
  if (!env.GH_TOKEN || !env.GH_REPO) return out({ ok: true, poll: null });
  let st; try { st = await pollState(env) } catch (e) { return out({ ok: false, reason: 'error' }, 502) }
  const p = st.p; if (!pollOpen(p)) return out({ ok: true, poll: null });
  const v = st.v && st.v.id === p.id ? st.v : { c: {}, cc: {} };
  return out({ ok: true, poll: { id: p.id, title: String(p.title || '').slice(0, 120), opts: p.opts.slice(0, 8).map(x => String(x).slice(0, 40)), end: p.end }, c: Object.fromEntries(p.opts.map(o => [o, v.c && v.c[o] | 0])) });
}
async function votePost(req, env, out) {
  { const og = req.headers.get('Origin'); if (og && og !== SITE && og !== 'https://www.rax3d.com') return out({ ok: false, reason: 'origin' }, 403) }
  if (!env.GH_TOKEN || !env.GH_REPO) return out({ ok: false, reason: 'error' }, 503);
  const ip = req.headers.get('CF-Connecting-IP') || '', now = Date.now();
  if (ip) { const a = (VTRL.get(ip) || []).filter(t => now - t < 3600000); if (a.length >= 10) return out({ ok: false, reason: 'limit' }, 429); a.push(now); VTRL.set(ip, a); if (VTRL.size > 5000) VTRL.clear() }
  let b; try { b = await req.json() } catch { return out({ ok: false, reason: 'bad' }, 400) }
  const ph = normPhone(b && b.phone), opt = String((b && b.opt) || '');
  if (!/^05\d{8}$/.test(ph)) return out({ ok: false, reason: 'bad' }, 400);
  if (!(await turnstileOk(env, b && b.ts, ip))) return out({ ok: false, reason: 'captcha' }, 403);
  let st; try { PLC.t = 0; st = await pollState(env) } catch (e) { return out({ ok: false, reason: 'error' }, 502) }
  const p = st.p; if (!pollOpen(p) || String(b && b.id) !== String(p.id) || !p.opts.includes(opt)) return out({ ok: false, reason: 'closed' }, 400);
  const hh = (await sha('vote|' + ph)).slice(0, 16);
  let known = false; try { const f = await ghRead(env, 'points_private.json'); known = !!(f && f.data && ((f.data.p && Object.prototype.hasOwnProperty.call(f.data.p, ph)) || (f.data.t && Object.prototype.hasOwnProperty.call(f.data.t, ph)))) } catch (_) {}
  let dup = false;
  await ghUpdate(env, 'votes.json', { id: '', c: {}, cc: {}, v: {} }, d => {
    if (!d || d.id !== p.id) d = { id: p.id, c: {}, cc: {}, v: {} };
    if (d.v[hh]) { dup = true; return undefined }
    d.v[hh] = opt; d.c[opt] = (d.c[opt] | 0) + 1; if (known) d.cc[opt] = (d.cc[opt] | 0) + 1; return d;
  }, 'صوت جديد في تصويت الأسبوع');
  PLC.t = 0;
  if (dup) return out({ ok: false, reason: 'dup' }, 409);
  const st2 = await pollState(env).catch(() => null), v = st2 && st2.v && st2.v.id === p.id ? st2.v : { c: {} };
  return out({ ok: true, c: Object.fromEntries(p.opts.map(o => [o, v.c && v.c[o] | 0])) });
}

// ---- customer reviews (owner approves each one by email before it shows) ----
// reviews.json in the private data repo: { v:1, list:[{ k, id, s:1..5, n, t, ph:<phone hash>, vb:<known customer>, at, st:'p'|'a' }] }
// POST /review {id,s,n,t,phone,ts} -> stored as pending + email with a signed approve/reject link. GET /reviews -> approved only (no phone data).
const RVRL = new Map();
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const sha = async s => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
async function rvSig(env, k) { const key = await crypto.subtle.importKey('raw', new TextEncoder().encode('rv|' + env.GH_TOKEN), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(k))).slice(0, 32) }
// constant-time string compare (a signature check must not leak how many leading characters matched)
const safeEq = (a, b) => { a = String(a); b = String(b); if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0 };
const rvClean = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
// «ر. ع.» : first letter of the first name and of the last name (one name: one letter)
const rvInit = v => { const w = String(v || '').replace(/[ً-ٟـ]/g, '').trim().split(/\s+/).filter(Boolean).map(x => [...(/^ال.{2,}/.test(x) ? x.slice(2) : x)][0]); return w.length ? (w.length === 1 ? w[0] + '.' : w[0] + '. ' + w[w.length - 1] + '.') : '' };
const rvLink = /(https?:|www\.|\.com|\.sa\b|@\w|t\.me|wa\.me)/i;
async function reviewPost(req, env, out) {
  { const og = req.headers.get('Origin'); if (og && og !== SITE && og !== 'https://www.rax3d.com') return out({ ok: false, reason: 'origin' }, 403) }
  if (!env.GH_TOKEN || !env.GH_REPO) return out({ ok: false, reason: 'error' }, 503);
  const ip = req.headers.get('CF-Connecting-IP') || '', now = Date.now();
  if (ip) { const a = (RVRL.get(ip) || []).filter(t => now - t < 3600000); if (a.length >= 5) return out({ ok: false, reason: 'limit' }, 429); a.push(now); RVRL.set(ip, a); if (RVRL.size > 5000) RVRL.clear() }
  let b; try { b = await req.json() } catch { return out({ ok: false, reason: 'bad' }, 400) }
  const id = String((b && b.id) || ''), s = Math.round(+(b && b.s)), fn = rvClean(b && b.n, 40), n = (b && b.h) ? rvInit(fn) : fn, t = rvClean(b && b.t, 300), ph = normPhone(b && b.phone);
  if (!/^[\w-]{1,30}$/.test(id) || !(s >= 1 && s <= 5) || fn.length < 2 || !/^05\d{8}$/.test(ph)) return out({ ok: false, reason: 'bad' }, 400);
  if (rvLink.test(fn) || rvLink.test(t)) return out({ ok: false, reason: 'link' }, 400);
  const items = await names(), it = items[id]; if (!it) return out({ ok: false, reason: 'bad' }, 400);
  if (!(await turnstileOk(env, b && b.ts, ip))) return out({ ok: false, reason: 'captcha' }, 403);
  const phh = (await sha('rvph|' + ph)).slice(0, 16), k = hex(crypto.getRandomValues(new Uint8Array(6)));
  let vb = false; try { const f = await ghRead(env, 'points_private.json'); vb = !!(f && f.data && f.data.p && Object.prototype.hasOwnProperty.call(f.data.p, ph)) } catch (_) {}
  let dup = false, full = false;
  await ghUpdate(env, 'reviews.json', { v: 1, list: [] }, d => {
    d = d && Array.isArray(d.list) ? d : { v: 1, list: [] };
    if (d.list.some(r => r.id === id && r.ph === phh)) { dup = true; return undefined }
    if (d.list.filter(r => r.st === 'p').length >= 100) { full = true; return undefined }
    d.list.push({ k, id, s, n, fn, t, ph: phh, vb, at: new Date().toISOString(), st: 'p' }); return d;
  }, 'تقييم جديد بانتظار الموافقة');
  if (dup) return out({ ok: false, reason: 'dup' }, 409);
  if (full) return out({ ok: false, reason: 'busy' }, 429);
  const sig = await rvSig(env, k), base = new URL(req.url).origin + '/review/act?k=' + k + '&sig=' + sig;
  // awaited on purpose: a promise left running after the response is cancelled by Workers and the email never left
  try { await mail(env, '⭐ تقييم جديد بانتظار موافقتك: ' + (it.n || id), `<div dir="rtl" style="font-family:sans-serif"><p><b>${esc(it.n || id)}</b> — ${'★'.repeat(s)}${'☆'.repeat(5 - s)}</p><p>${esc(fn)}${n !== fn ? ' (يظهر للزوار: ' + esc(n) + ')' : ''}${vb ? ' — عميل سابق' : ' — جواله غير موجود في العملاء'}</p><p>${esc(t) || '(بدون تعليق)'}</p><p><a href="${base}">راجع ووافق أو ارفض</a></p></div>`) } catch (_) {}
  return out({ ok: true });
}
let RVC = { t: 0, d: null };
async function reviewsGet(env, out) {
  if (!env.GH_TOKEN || !env.GH_REPO) return out({ ok: true, d: {} });
  const now = Date.now();
  if (!RVC.t || now - RVC.t > 60000) { try { const f = await ghRead(env, 'reviews.json'); RVC = { t: now, d: f ? f.data : null } } catch (e) { if (!RVC.t) return out({ ok: true, d: {} }) } }
  const d = {}, list = (RVC.d && Array.isArray(RVC.d.list) ? RVC.d.list : []).filter(r => r.st === 'a').sort((a, b) => (b.at > a.at ? 1 : -1));
  for (const r of list) { const o = d[r.id] || (d[r.id] = { sum: 0, c: 0, l: [] }); o.sum += r.s; o.c++; if (o.l.length < 30) o.l.push({ n: r.n, s: r.s, t: r.t, at: String(r.at).slice(0, 10), vb: !!r.vb }) }
  for (const id in d) { d[id] = { a: Math.round(d[id].sum / d[id].c * 10) / 10, c: d[id].c, l: d[id].l } }
  return out({ ok: true, d });
}
const rvPage = body => new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><body dir="rtl" style="font-family:sans-serif;max-width:480px;margin:40px auto;padding:0 16px;line-height:1.8">' + body, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
async function reviewAct(req, env, url) {
  if (!env.GH_TOKEN || !env.GH_REPO) return rvPage('غير متاح');
  let k, sig, a = '';
  if (req.method === 'POST') { const f = await req.formData(); k = String(f.get('k') || ''); sig = String(f.get('sig') || ''); a = String(f.get('a') || '') } else { k = url.searchParams.get('k') || ''; sig = url.searchParams.get('sig') || '' }
  if (!/^[0-9a-f]{12}$/.test(k) || !safeEq(sig, await rvSig(env, k))) return rvPage('رابط غير صالح');
  const f = await ghRead(env, 'reviews.json'), r = f && f.data && Array.isArray(f.data.list) ? f.data.list.find(x => x.k === k) : null;
  if (!r) return rvPage('هذا التقييم لم يعد موجودًا (تمت معالجته).');
  if (req.method !== 'POST') return rvPage(`<h2>${'★'.repeat(r.s)}${'☆'.repeat(5 - r.s)}</h2><p><b>${esc(r.fn || r.n)}</b>${r.fn && r.fn !== r.n ? ' (يظهر: ' + esc(r.n) + ')' : ''}${r.vb ? ' (عميل سابق)' : ''}</p><p>${esc(r.t) || '(بدون تعليق)'}</p><p>الحالة: ${r.st === 'a' ? 'معتمد' : 'بانتظار القرار'}</p><form method="post"><input type="hidden" name="k" value="${k}"><input type="hidden" name="sig" value="${sig}"><button name="a" value="ok" style="padding:12px 22px;font-size:16px">✅ موافقة ونشر</button> <button name="a" value="no" style="padding:12px 22px;font-size:16px">🗑️ رفض وحذف</button></form>`);
  if (a !== 'ok' && a !== 'no') return rvPage('طلب غير صالح');
  await ghUpdate(env, 'reviews.json', { v: 1, list: [] }, d => { const i = d.list.findIndex(x => x.k === k); if (i < 0) return undefined; if (a === 'ok') d.list[i].st = 'a'; else d.list.splice(i, 1); return d }, a === 'ok' ? 'تقييم معتمد' : 'تقييم مرفوض');
  RVC.t = 0;
  return rvPage(a === 'ok' ? '✅ تم نشر التقييم (يظهر في الموقع خلال دقيقة).' : '🗑️ تم حذف التقييم.');
}

// ---- live colour availability ----
// The invoicing app's stock tab keeps stock.json in the private data repo: { types:[{name,site}], rows:[{t,c,q,buy}], next, mailedFor }.
// The shop asks GET /stock which colours are out: a colour is out when EVERY row of that colour in a site-linked type is marked "buy" (طلب شراء).
// Answers { ok, out: [names] } or { ok, out: null } when there is no stock file yet (the page keeps its built-in default).
const CN = s => String(s || '').replace(/[ً-ٟـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/\s+/g, ' ').trim();
const SITE_COLS = ['أبيض', 'أسود', 'رمادي', 'أحمر', 'برتقالي', 'أصفر', 'أخضر', 'أزرق', 'بنفسجي', 'وردي', 'ذهبي', 'بني'], COL_ALIAS = { 'رصاصي': 'رمادي', 'كحلي': 'أزرق', 'سماوي': 'أزرق', 'زهري': 'وردي', 'قهوائي': 'بني', 'بنفسجى': 'بنفسجي' };
const COL_EN = { white: 'أبيض', black: 'أسود', gray: 'رمادي', grey: 'رمادي', silver: 'رمادي', graphite: 'رمادي', charcoal: 'رمادي', red: 'أحمر', orange: 'برتقالي', yellow: 'أصفر', green: 'أخضر', lime: 'أخضر', olive: 'أخضر', mint: 'أخضر', blue: 'أزرق', navy: 'أزرق', cyan: 'أزرق', sky: 'أزرق', purple: 'بنفسجي', violet: 'بنفسجي', lavender: 'بنفسجي', pink: 'وردي', magenta: 'وردي', rose: 'وردي', gold: 'ذهبي', brown: 'بني', coffee: 'بني', bronze: 'بني', chocolate: 'بني' };
function siteColor(c, strict) {   // «اسود» ← «أسود»، «اخضر ريميدي» ← «أخضر» (أول كلمة)؛ غير معروف يبقى كما هو
  const n = CN(c), w = n.split(' ')[0], by = x => SITE_COLS.find(s => CN(s) === x) || COL_ALIAS[x];
  if (by(n) || by(w)) return by(n) || by(w);
  const hit = [...new Set(n.toLowerCase().split(/[^a-z]+/).map(x => COL_EN[x]).filter(Boolean))]; if (hit.length === 1) return hit[0];   // two colours (Blue Green): inventory only, never linked to the site   // English as on the filament sticker: "Matte Ice Blue 10100"
  return strict ? '' : String(c);
}
function outColours(d) {
  if (!d || !Array.isArray(d.rows)) return null;
  const linked = new Set((Array.isArray(d.types) ? d.types : []).filter(t => t && t.site).map(t => String(t.name)));
  const by = new Map();
  // colour = the name first, then the sticker number/code field (BROWN 10100)
  for (const r of d.rows) { if (!r || !linked.has(String(r.t))) continue; const raw = String(r.c || '').slice(0, 30); if (!raw) continue; const c = siteColor(raw, 1) || siteColor(String(r.code || '').slice(0, 30), 1) || raw; const a = by.get(c) || []; a.push(!!r.buy); by.set(c, a) }
  return [...by].filter(([, a]) => a.length && a.every(Boolean)).map(([c]) => c);
}
let SCACHE = { t: 0, d: null };      // per-isolate copy, refreshed at most once a minute
async function stockOut(env) {
  if (!env.GH_TOKEN || !env.GH_REPO) return null;
  const now = Date.now(); if (SCACHE.t && now - SCACHE.t < 60000) return SCACHE.d;
  try { const f = await ghRead(env, 'stock.json'); SCACHE = { t: now, d: f ? outColours(f.data) : null } }
  catch (e) { if (!SCACHE.t) return null }   // keep the last copy if GitHub hiccups
  return SCACHE.d;
}
// Daily hygiene (same Cron Trigger): the per-phone / per-IP rate-limit files in online/ (rl_*, ip_*) only matter for 24 hours, but they never went away.
// Delete the ones with no entry in the last 24 hours (at most 20 a run), so phone numbers and hashed addresses are not kept forever in the data repo.
async function pruneGuards(env) {
  if (!env.GH_TOKEN || !env.GH_REPO) return 0;
  const r = await gh(env, 'GET', 'online'); if (!r.ok) return 0; const list = await r.json(); if (!Array.isArray(list)) return 0;
  const now = Date.now(); let n = 0;
  for (const f of list) {
    if (n >= 20) break; if (!f || !/^(rl|ip)_[0-9a-f]+\.json$/.test(String(f.name))) continue;
    const g = await ghRead(env, 'online/' + f.name).catch(() => null); if (!g || !g.data) continue;
    if ((Array.isArray(g.data.t) ? g.data.t : []).some(t => now - t < 864e5)) continue;
    const d = await gh(env, 'DELETE', 'online/' + f.name, { message: 'حذف حد قديم (أكثر من 24 ساعة)', sha: g.sha }); if (d.ok) n++;
  }
  return n;
}
// Fortnightly stock reminder (Cron Trigger, once a day): mails the owner (MAIL_TO, plus optional STOCK_MAIL_EXTRA = comma separated, max 3) when `next` has arrived.
// The reminder is claimed in stock.json (mailedFor = next) before mailing, so two runs, or the app's own fallback mail, never send it twice.
// ---- fortnight report (owner's idea 6, 11-16): rides on the SAME mail as the filament stock reminder (every 2 weeks, when `next` in stock.json arrives) ----
// Reads the invoicing app's cloud copy backups/admin/log.json: sales and profit of the last 14 days vs the 14 before, the 3 most profitable pieces, and how fresh that backup is.
async function fortnightReport(env) {
  const f = await ghRead(env, 'backups/admin/log.json');
  if (!f || !f.data || !Array.isArray(f.data.log)) return '<p>⚠️ لا توجد نسخة احتياطية سحابية للسجل. افتح برنامج الفواتير واحفظ أي فاتورة (علامة ☁️✔) حتى تُنشأ.</p>';
  const d = f.data, today = riyadhDay(), off = n => { const x = new Date(today + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() - n); return x.toISOString().slice(0, 10) };
  const live = d.log.filter(r => r && r.status !== 'ملغاة' && typeof r.date === 'string');
  const cur = live.filter(r => r.date >= off(13) && r.date <= today), prev = live.filter(r => r.date >= off(27) && r.date <= off(14));
  const sum = (rs, k) => rs.reduce((a, r) => a + (Number(r[k]) || 0), 0), r2 = v => Math.round(v * 100) / 100;
  const pc = sum(cur, 'profit'), pp = sum(prev, 'profit'), ch = pp > 0 ? Math.round((pc - pp) / pp * 100) : null;
  const m = new Map();
  cur.forEach(r => { const its = Array.isArray(r.items) ? r.items : [], tot = its.reduce((a, i) => a + (Number(i.line) || 0), 0) || 1; its.forEach(i => { const k = String(i.desc || '').trim(); if (!k) return; const o = m.get(k) || { q: 0, p: 0 }; o.q += Number(i.q) || 0; o.p += (Number(r.profit) || 0) * ((Number(i.line) || 0) / tot); m.set(k, o) }) });
  const top = [...m].sort((a, b) => b[1].p - a[1].p).filter(x => x[1].p > 0).slice(0, 3);
  let vote = ''; try { const st = await pollState(env), pl = st.p; if (pl && pl.id && Array.isArray(pl.opts) && st.v && st.v.id === pl.id) { const rows = pl.opts.map(o => [o, st.v.c && st.v.c[o] | 0]).sort((a, b) => b[1] - a[1]); vote = `<p>🗳️ تصويت القسم القادم (${esc(String(pl.title || ''))}): ${rows.map(x => esc(x[0]) + ' ' + x[1]).join('، ')}</p>` } } catch (_) {}
  const age = Math.floor((Date.now() - Date.parse(d.savedAt)) / 864e5), saved = String(d.savedAt || '').slice(0, 10);
  return `<p style="font-size:16px"><b>📊 تقرير آخر أسبوعين</b></p>
<p>الفواتير: <b>${cur.length}</b> · المبيعات: <b>${r2(sum(cur, 'total'))}</b> ر.س · صافي الربح: <b>${r2(pc)}</b> ر.س ${ch === null ? '' : `(${ch >= 0 ? '▲' : '▼'} ${Math.abs(ch)}% عن الأسبوعين السابقين: ${r2(pp)})`}</p>
<p>🏆 الأكثر ربحًا: ${top.length ? top.map(x => esc(x[0]) + ' (' + r2(x[1].p) + ' ر.س × ' + x[1].q + ')').join('، ') : 'لا مبيعات في هذه الفترة'}</p>
${vote}<p>☁️ آخر نسخة احتياطية للسجل: <b>${esc(saved || 'غير معروف')}</b>${age > 10 ? ' ⚠️ قديمة (أكثر من 10 أيام)، تأكد أن علامة ☁️✔ تظهر في برنامج الفواتير.' : ' ✔'}</p>`;
}
async function stockReminder(env) {
  if (!env.GH_TOKEN || !env.GH_REPO || !env.RESEND_KEY || !env.MAIL_TO) return 'config';
  const today = riyadhDay(), f = await ghRead(env, 'stock.json'); if (!f || !f.data) return 'nofile';
  const ok = x => x && /^\d{4}-\d{2}-\d{2}$/.test(x.next || '') && today >= x.next && x.mailedFor !== x.next;
  if (!ok(f.data)) return 'notdue';
  let claimed = null;
  await ghUpdate(env, 'stock.json', null, x => { if (!ok(x)) return undefined; claimed = x; x.mailedFor = x.next; return x }, 'تذكير جرد الفلمنت');
  if (!claimed) return 'taken';
  const need = (claimed.rows || []).filter(r => r && r.buy).map(r => esc(String(r.t || '') + ' ' + String(r.c || '')));
  const extra = String(env.STOCK_MAIL_EXTRA || '').split(',').map(e => e.trim()).filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)).slice(0, 3);
  let rep = ''; try { rep = await fortnightReport(env) } catch (e) { rep = '<p>تعذّر إعداد تقرير الأسبوعين هذه المرة.</p>' }
  const out0 = (claimed.rows || []).filter(r => r && !r.buy && r.q === 0).map(r => esc(String(r.t || '') + ' ' + String(r.c || '')));
  await mail(env, '🧾 موعد جرد الفلمنت وتقرير أسبوعين — RAX3D', rep + `<hr><p style="font-size:17px"><b>🧾 موعد الجرد الدوري (كل أسبوعين)</b></p><p>افتح تبويب «الجرد» في برنامج الفواتير، راجع الكميات وحدّث «طلب شراء»، ثم اضغط «تم الجرد».</p><p>بحاجة شراء الآن: <b>${need.length ? need.join('، ') : 'لا شيء'}</b></p>${out0.length ? `<p>نفدت (كميتها 0 وغير موسومة للشراء): <b>${out0.join('، ')}</b></p>` : ''}`, extra);
  return 'sent';
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
  if (!(await turnstileOk(env, b.ts, req.headers.get('CF-Connecting-IP') || ''))) return out({ ok: false, reason: 'captcha' }, 403);
  const pr = await prices(); let sub = 0; const rows = [];
  for (const o of b.cart) {
    const q = Math.floor(+o.qty), u = unit(pr, String(o.id), q);
    if (!u || !(q >= 1 && q <= 500)) return out({ ok: false, reason: 'item' }, 400);
    sub += u * q; rows.push({ id: String(o.id), q, u, color: String(o.color || '').slice(0, 30) });
  }
  const ship = COD_SHIP_FEE, total = sub + ship;
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
      await ghSave(env, 'online/ORD-' + num + '.json', { num, cod: true, ref: b.ref, total, customer: { name, phone, city, address }, cart: rows, at: new Date().toISOString() }, 'طلب دفع عند الاستلام ORD-' + num).catch(() => {});
      // the invoice already has its number, so it goes straight into the invoicing app's log (points included)
      const rec = { num, date: riyadhDay(), online: true, cod: true, mode: 'pickup', ship: 0, payId: 'cod_' + b.ref, client: name, phone, code: b.ref,
        desc: rows.map(r => (nm0[r.id]?.n || r.id) + ' (' + r.q + ')').join(' ، '), qty: rows.reduce((a, r) => a + r.q, 0), disc: 0, total: sub, profit: 0, sugg: 0, sub,
        items: rows.map(r => ({ desc: nm0[r.id]?.n || r.id, color: /^(اللون الأساسي|كما بالصورة)?$/.test(r.color) ? '' : r.color, q: r.q, unit: r.u, line: r.u * r.q, cost: 0, w: +pr.W[r.id] || 0, h: 0, m: 0, sec: 0, type: 'واحدة', auto: false, dp: 0 })) };
      try { await ghUpdate(env, 'partner_log.json', [], arr => { arr = Array.isArray(arr) ? arr : []; if (!arr.some(x => x && Number(x.num) === num)) arr.push(rec); return arr }, 'فاتورة دفع عند الاستلام ORD-' + num) } catch (e) { logFail = true }
    }
  } catch (e) { return out({ ok: false, reason: 'number' }, 502) }
  if (dup) return out({ ok: true, num, dup: true });
  const nm = await names(), label = 'ORD-' + num;
  rows.forEach(r => { r.name = nm[r.id]?.n || r.id });
  const msg = [`طلب ${label} (دفع عند الاستلام)`, `* الاسم: ${name}`, `* الجوال: ${phone}`,
    ...rows.map(r => `\n* القطعة: ${r.name}\n* اللون: ${r.color || 'كما بالصورة'}\n* الكمية: ${r.q}`)].join('\n');
  const html = `<p style="font-size:16px"><b>🚚 طلب جديد بالدفع عند الاستلام ${esc(label)}</b><br>الطلب غير مدفوع، تحصّل ${total} ريال عند التسليم. ${logFail ? '⚠️ تعذّر إضافته تلقائيًا لبرنامج الفواتير، الصق الرسالة أسفل في «استيراد الطلب».' : 'الفاتورة انسجلت تلقائيًا في برنامج الفواتير (بنقاط الولاء) أول ما تفتحه. إذا انلغى الطلب ألغ الفاتورة من التطبيق.'}</p>`
    + invoiceHtml({ label, date: riyadhDay(), name, phone, rows, sub, ship, total, cod: true, bank: await bankInfo(env) })
    + `<p>الجوال: <span dir="ltr">${esc(phone)}</span></p><p>الاستلام مباشر: المكان والموعد يُتفق عليهما بالتواصل مع العميل.</p>`
    + `<p>للتسجيل في التطبيق بنفس الرقم، الصق هذه الرسالة في «استيراد الطلب»:</p><pre style="background:#f4f1ea;padding:10px;border-radius:8px;white-space:pre-wrap">${esc(msg)}</pre>`;
  const sent = await mail(env, '🚚 طلب دفع عند الاستلام ' + label, html, orderExtra(env));
  return out({ ok: true, num, emailed: sent });
}

// Invoicing app "forgot PIN": the app makes the 6-digit code itself and keeps only its hash; this just mails the code to the owner (MAIL_TO),
// because the app's own mail service (FormSubmit) can fail. The code only ever goes to MAIL_TO, so nobody can read it by calling this;
// the worst a stranger can do is cause mails, so it is limited to 5 an hour per isolate and only digits are accepted.
const APP_ORIGIN = 'https://rax3dsa.github.io';
let RRL = [];
async function recovery(req, env, out) {
  if (req.headers.get('Origin') !== APP_ORIGIN) return out({ ok: false, reason: 'origin' }, 403);
  let b; try { b = await req.json() } catch { return out({ ok: false, reason: 'bad' }, 400) }
  const code = String((b && b.code) || '');
  if (!/^\d{6,8}$/.test(code)) return out({ ok: false, reason: 'bad' }, 400);
  const now = Date.now(); RRL = RRL.filter(t => now - t < 3600e3);
  if (RRL.length >= 5) return out({ ok: false, reason: 'limit' }, 429);
  RRL.push(now);
  const sent = await mail(env, '🔑 رمز استرجاع دخول الدعم الفني: ' + code, `<p style="font-size:22px">رمز التحقق: <b dir="ltr">${code}</b></p><p>اكتبه في شاشة «نسيت رمز الدخول» في برنامج الفواتير. صالح 15 دقيقة. إذا ما طلبته فتجاهل هذي الرسالة.</p>`);
  return out({ ok: sent }, sent ? 200 : 502);
}

// ---- custom orders (طلب خاص) ----
// The invoicing app (owner only) writes custom/<id>.json to the data repo: { id, name, desc, price, img, status:'open', at }.
// The customer opens https://rax3d.com/?c=<id>; the page reads it from GET /custom/<id> and pays online (/confirm, metadata.custom) or picks cash on delivery (POST /custom/cod).
// The link works once: the file's status moves to 'paid' or 'cod'. The customer must pick delivery or pickup (mandatory, like the shop): delivery adds SHIP_FEE online (COD_SHIP_FEE on COD), pickup is free.
const CID = /^[A-Za-z0-9]{16}$/;
const customLog = (id, c, price, label, name, phone, payId, cod) => ({ num: label, date: riyadhDay(), online: true, ...(cod ? { cod: true } : {}), payId, client: name, phone, code: 'CU-' + id.slice(0, 5).toUpperCase(),
  desc: 'طلب خاص: ' + String(c.desc || '').slice(0, 120), qty: 1, disc: 0, total: price, profit: 0, sugg: 0, sub: price,
  items: [{ desc: 'طلب خاص: ' + String(c.desc || '').slice(0, 120), color: '', q: 1, unit: price, line: price, cost: 0, w: 0, h: 0, m: 0, sec: 0, type: 'واحدة', auto: false, dp: 0 }] });
async function customGet(id, env, out) {
  if (!CID.test(id) || !env.GH_TOKEN || !env.GH_REPO) return out({ ok: false, reason: 'bad' }, 404);
  const f = await ghRead(env, 'custom/' + id + '.json');
  if (!f) return out({ ok: false, reason: 'none' }, 404);
  const c = f.data;
  const lp = /^05\d{8}$/.test(String(c.phone || '')) ? String(c.phone).slice(0, 2) + '•••••' + String(c.phone).slice(-3) : '';
  return out({ ok: true, status: c.status || 'open', name: String(c.name || '').slice(0, 60), phoneMask: lp, desc: String(c.desc || '').slice(0, 1200), price: +c.price, img: String(c.img || '').slice(0, 400000), num: c.status && c.status !== 'open' ? c.num || null : null });
}
// the order number is only handed out after the payment/COD, so the record also keeps it for the second visit to the link
async function customDone(env, id, status, num, extra) {
  await ghUpdate(env, 'custom/' + id + '.json', null, d => d ? ({ ...d, status, num, doneAt: new Date().toISOString(), ...extra }) : undefined, 'طلب خاص ' + id.slice(0, 5) + ' ← ' + status);
}
async function customCod(req, env, out) {
  let b; try { b = await req.json() } catch { return out({ ok: false, reason: 'bad' }, 400) }
  { const og = req.headers.get('Origin'); if (og && og !== SITE && og !== 'https://www.rax3d.com') return out({ ok: false, reason: 'origin' }, 403) }
  const id = String(b.id || ''), cu = b.customer || {}; let name = String(cu.name || '').trim().slice(0, 60), phone = String(cu.phone || '').replace(/\s/g, '').slice(0, 20);
  if (!CID.test(id) || !env.GH_TOKEN || !env.GH_REPO) return out({ ok: false, reason: 'bad' }, 400);
  const mode = b.mode === 'pickup' ? 'pickup' : b.mode === 'delivery' ? 'delivery' : '';
  if (!mode) return out({ ok: false, reason: 'mode' }, 400);
  const fee = mode === 'pickup' ? 0 : COD_SHIP_FEE;
  if (!(await turnstileOk(env, b.ts, req.headers.get('CF-Connecting-IP') || ''))) return out({ ok: false, reason: 'captcha' }, 403);
  const f = await ghRead(env, 'custom/' + id + '.json');
  if (!f) return out({ ok: false, reason: 'none' }, 404);
  const c = f.data, price = Math.round(+c.price);
  if (!(price >= 1 && price <= 50000)) return out({ ok: false, reason: 'bad' }, 400);
  if ((c.status || 'open') !== 'open') return out({ ok: false, reason: 'used', num: c.num || null }, 409);
  // the client the owner typed in the invoicing app wins: loyalty points follow that phone
  if (/^05\d{8}$/.test(String(c.phone || ''))) { name = String(c.name || name).slice(0, 60); phone = String(c.phone) }
  if (name.length < 2 || !/^(05\d{8}|\+?9665\d{8})$/.test(phone)) return out({ ok: false, reason: 'fields' }, 400);
  let num;
  try {
    num = await reserveNumber(env);
    // the marker acts as a lock: a double tap stops here instead of making a second invoice
    if (!(await ghCreate(env, 'online/cod_custom_' + id + '.json', { num }, 'ربط الطلب الخاص ' + id.slice(0, 5)))) { const w = await ghRead(env, 'online/cod_custom_' + id + '.json'); return out({ ok: true, num: w ? w.data.num : num, dup: true }) }
    await ghSave(env, 'online/ORD-' + num + '.json', { num, cod: true, custom: id, mode, ship: fee, total: price + fee, customer: { name, phone }, desc: c.desc, at: new Date().toISOString() }, 'طلب خاص دفع عند الاستلام ORD-' + num).catch(() => {});
    const rec = customLog(id, c, price, num, name, phone, 'cod_custom_' + id, true);
    try { await ghUpdate(env, 'partner_log.json', [], arr => { arr = Array.isArray(arr) ? arr : []; if (!arr.some(x => x && Number(x.num) === num)) arr.push(rec); return arr }, 'فاتورة طلب خاص ORD-' + num) } catch (e) {}
    await customDone(env, id, 'cod', num, { mode, customer: { name, phone } }).catch(() => {});
  } catch (e) { return out({ ok: false, reason: 'number' }, 502) }
  const label = 'ORD-' + num;
  const html = `<p style="font-size:16px"><b>🚚 طلب خاص بالدفع عند الاستلام ${esc(label)}</b><br>الطلب غير مدفوع، تحصّل ${price + fee} ريال عند التسليم.<br>طريقة الاستلام: <b>${mode === 'pickup' ? '🏪 استلام مباشر' : '🚚 توصيل' + (fee ? ' (' + fee + ' ريال)' : '')}</b></p><p>الاسم: ${esc(name)}<br>الجوال: <span dir="ltr">${esc(phone)}</span></p><p>الوصف:<br>${esc(String(c.desc || '')).replace(/\n/g, '<br>')}</p>`;
  const sent = await mail(env, '🚚 طلب خاص (دفع عند الاستلام) ' + label, html, orderExtra(env));
  return out({ ok: true, num, price, mode, fee, emailed: sent });
}
// called from confirmCore when the payment's metadata carries custom=<id>; the payment is already known to be paid
async function customPaid(b, p, md, env, out, refuse) {
  const id = String(md.custom || '');
  if (!CID.test(id) || !env.GH_TOKEN || !env.GH_REPO) return refuse('bad');
  const f = await ghRead(env, 'custom/' + id + '.json');
  if (!f) return refuse('none');
  const c = f.data, price = Math.round(+c.price);
  const mode = md.mode === 'pickup' ? 'pickup' : md.mode === 'delivery' ? 'delivery' : '', fee = mode === 'pickup' ? 0 : SHIP_FEE;
  if (!mode || p.currency !== 'SAR' || p.amount !== (price + fee) * 100) { await mail(env, '⚠️ دفعة طلب خاص تحتاج مراجعة', `<p>المتوقع: ${price + fee} ريال (${mode || 'بدون اختيار استلام'}), المدفوع: ${p.amount / 100} ${esc(p.currency)}.<br>رقم الدفعة: <span dir="ltr">${esc(p.id)}</span></p>`); return out({ ok: false, reason: 'mismatch', paid: true }) }
  const done = await ghRead(env, 'online/pay_' + p.id + '.json');
  if (done) return out({ ok: true, num: done.data.num, dup: true });
  if ((c.status || 'open') !== 'open') return refuse('used');
  let name = String(md.name || (b.customer && b.customer.name) || '').slice(0, 60), phone = String(md.phone || (b.customer && b.customer.phone) || '').slice(0, 20);
  if (/^05\d{8}$/.test(String(c.phone || ''))) { name = String(c.name || name).slice(0, 60); phone = String(c.phone) }
  const num = await reserveNumber(env);
  if (!(await ghCreate(env, 'online/pay_' + p.id + '.json', { num }, 'ربط الدفعة بالطلب الخاص ORD-' + num))) { const w = await ghRead(env, 'online/pay_' + p.id + '.json'); return out({ ok: true, num: w ? w.data.num : null, dup: true }) }
  await ghSave(env, 'online/ORD-' + num + '.json', { num, paymentId: p.id, custom: id, mode, ship: fee, amount: p.amount / 100, currency: p.currency, method: p.source?.type || '', customer: { name, phone }, desc: c.desc, at: new Date().toISOString() }, 'طلب خاص مدفوع ORD-' + num).catch(() => {});
  let logFail = false;
  try { await ghUpdate(env, 'partner_log.json', [], arr => { arr = Array.isArray(arr) ? arr : []; if (!arr.some(x => x && Number(x.num) === num)) arr.push(customLog(id, c, price, num, name, phone, p.id, false)); return arr }, 'فاتورة طلب خاص مدفوع ORD-' + num) } catch (e) { logFail = true }
  await customDone(env, id, 'paid', num, { payId: p.id, mode, customer: { name, phone } }).catch(() => {});
  const label = 'ORD-' + num;
  const invoice = invoiceHtml({ label, date: riyadhDay(), name, phone, rows: [{ name: 'طلب خاص: ' + String(c.desc || '').slice(0, 120), q: 1, u: price, color: '' }], sub: price, ship: fee, total: price + fee, bank: await bankInfo(env), method: p.source?.type === 'applepay' ? 'Apple Pay' : (p.source?.company ? String(p.source.company).toUpperCase() : 'Card') });
  const html = invoice + `<hr style="margin:26px 0;border:0;border-top:1px dashed #ccc"><p>✅ طلب خاص مدفوع <b>${esc(label)}</b> · ${mode === 'pickup' ? '🏪 استلام مباشر' : '🚚 توصيل'}${logFail ? ' (⚠️ تعذّر إضافة الفاتورة لبرنامج الفواتير، أضفها يدوياً)' : ''}</p><p>الوصف:<br>${esc(String(c.desc || '')).replace(/\n/g, '<br>')}</p><p>الجوال: <span dir="ltr">${esc(phone)}</span></p>`;
  const sent = await mail(env, '✅ طلب خاص مدفوع ' + label, html, orderExtra(env));
  return out({ ok: true, num, price, mode, fee, emailed: sent });
}

async function handle(req, env, ctx) {
  {
    // answer CORS for both the bare domain and www (the origin checks below already accept both)
    const og0 = req.headers.get('Origin'), path = new URL(req.url).pathname;
    const allow = og0 === 'https://www.rax3d.com' ? og0 : (og0 === APP_ORIGIN && path === '/recovery') ? og0 : SITE;
    const cors = { 'Access-Control-Allow-Origin': allow, 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' };
    const out = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method === 'POST' && path === '/recovery') return recovery(req, env, out);
    if (req.method === 'POST' && path === '/webhook') return hook(req, env, out, ctx);
    if (req.method === 'POST' && path === '/cod') return cod(req, env, out);
    if (req.method === 'POST' && path === '/custom/cod') return customCod(req, env, out);
    if (req.method === 'GET' && path.startsWith('/custom/')) return customGet(path.slice(8), env, out);
    if (req.method === 'POST' && path === '/points') return points(req, env, out);
    if (req.method === 'POST' && path === '/orders') return ordersPost(req, env, out);
    if (req.method === 'GET' && path === '/poll') return pollGet(env, out);
    if (req.method === 'POST' && path === '/vote') return votePost(req, env, out);
    if (req.method === 'POST' && path === '/review') return reviewPost(req, env, out);
    if (req.method === 'GET' && path === '/reviews') return reviewsGet(env, out);
    if (path === '/review/act' && (req.method === 'GET' || req.method === 'POST')) return reviewAct(req, env, new URL(req.url));
    if (req.method === 'GET' && path === '/stock') return out({ ok: true, out: await stockOut(env) });
    if (req.method === 'GET' && path === '/config') return out({ ok: true, ship: SHIP_FEE, codShip: COD_SHIP_FEE, modes: true, turnstile: (env.TURNSTILE_SECRET && env.TURNSTILE_SITEKEY) ? String(env.TURNSTILE_SITEKEY) : null });
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
    // every refusal after this point happens AFTER the customer paid: always tell the owner, never fail silently
    const refuse = async reason => {
      try { await mail(env, '⚠️ دفعة مدفوعة ما انسجّل طلبها (' + reason + ')', `<p>العميل دفع لكن الطلب رُفض آليًا (<b>${esc(reason)}</b>). تواصل معه وراجع الدفعة، وإن لزم استردها من ميسر.</p><p>رقم الدفعة: <span dir="ltr">${esc(b.paymentId)}</span><br>المبلغ: ${p.amount / 100} ${esc(p.currency)}</p>`) } catch (_) {}
      return out({ ok: false, reason, paid: true }, 400);
    };
    const md = p.metadata || {};
    if (md.custom) return customPaid(b, p, md, env, out, refuse);
    if (!/^RX-[A-Z0-9]{5}$/.test(b.ref || '')) b.ref = md.ref;
    if (!Array.isArray(b.cart) || !b.cart.length) {
      const cols = {}; String(md.cols || '').split(',').forEach(s => { const i = s.indexOf(':'); if (i > 0) cols[s.slice(0, i)] = s.slice(i + 1) });
      b.cart = String(md.items || '').split(',').filter(Boolean).map(s => { const i = s.lastIndexOf('x'); return { id: s.slice(0, i), qty: +s.slice(i + 1), color: cols[s.slice(0, i)] || '' } });
    }
    const c = (b.customer && b.customer.name) ? b.customer : { name: md.name || '', phone: md.phone || '' };
    if (!/^RX-[A-Z0-9]{5}$/.test(b.ref || '') || !Array.isArray(b.cart) || !b.cart.length || b.cart.length > 40) return refuse('bad');

    // 2) what the cart should cost, from the live site prices
    const pr = await prices(); let total = 0; const lines = [], rows = [];
    for (const o of b.cart) {
      const q = Math.floor(+o.qty), u = unit(pr, String(o.id), q);
      if (!u || !(q >= 1 && q <= 500)) return refuse('item');
      total += u * q; rows.push({ id: String(o.id), q, u, color: String(o.color || '').slice(0, 30) }); lines.push(`${esc(o.id)} × ${q} (${esc(String(o.color || '').slice(0, 30))}) = ${u * q} ريال`);
    }
    const mode = (p.metadata && p.metadata.mode === 'pickup') ? 'pickup' : 'delivery', ship = mode === 'pickup' ? 0 : SHIP_FEE;
    total += ship;

    const info = `<p>طريقة الاستلام: <b>${mode === 'pickup' ? '🏪 استلام مباشر (بدون رسوم توصيل)' : '🚚 توصيل (' + SHIP_FEE + ' ريال)'}</b><br>رقم الطلب: <b>${esc(b.ref)}</b><br>الاسم: ${esc((c.name || '').slice(0, 60))}<br>الجوال: ${esc((c.phone || '').slice(0, 20))}<br>المدينة: ${esc((c.city || '').slice(0, 40))}<br>العنوان: ${esc((c.address || '').slice(0, 200))}</p><p>${lines.join('<br>')}</p><p>المدفوع: <b>${p.amount / 100} ${esc(p.currency)}</b> · طريقة الدفع: ${esc(p.source?.type || '')} · رقم الدفعة: ${esc(p.id)}</p>`;

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
          await ghSave(env, 'online/ORD-' + num + '.json', order, 'طلب مدفوع ORD-' + num).catch(() => {});
          // the invoice itself goes to the same shared inbox the data-entry phone uses; the app imports it into its log
          const nm0 = await names(), itemsT = total - ship;
          const rec = { num, date: riyadhDay(), online: true, mode: ship > 0 ? 'delivery' : 'pickup', ship, payId: b.paymentId, client: (c.name || '').slice(0, 60), phone: (c.phone || '').slice(0, 20), code: b.ref,
            desc: rows.map(r => (nm0[r.id]?.n || r.id) + ' (' + r.q + ')').join(' ، '), qty: rows.reduce((a, r) => a + r.q, 0), disc: 0, total: itemsT, profit: 0, sugg: 0, sub: itemsT,
            items: rows.map(r => ({ desc: nm0[r.id]?.n || r.id, color: /^(اللون الأساسي|كما بالصورة)?$/.test(r.color) ? '' : r.color, q: r.q, unit: r.u, line: r.u * r.q, cost: 0, w: +pr.W[r.id] || 0, h: 0, m: 0, sec: 0, type: 'واحدة', auto: false, dp: 0 })) };
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
    const invoice = invoiceHtml({ label, date: today, name: c.name || '', phone: c.phone || '', rows: rows.map(r => ({ ...r, name: nm[r.id]?.n || r.id })), sub: total - ship, ship, total, bank: await bankInfo(env), method: p.source?.type === 'applepay' ? 'Apple Pay' : (p.source?.company ? String(p.source.company).toUpperCase() : (p.source?.type || '')) });
    const html = invoice + `<hr style="margin:26px 0;border:0;border-top:1px dashed #ccc"><p>طلب مدفوع <b>${esc(label)}</b>${num ? '' : ' (بدون رقم فاتورة، تعذّر حجز الرقم)'}</p>` + info.replace(esc(b.ref), esc(label)) +
      ((logFail || !num) ? `<p style="color:#b00">⚠️ تعذّر إضافة الفاتورة تلقائيًا لبرنامج الفواتير. الصق الرسالة التالية في التطبيق (استيراد الطلب) عشان تنحفظ بنفس الرقم:</p><pre style="background:#f4f1ea;padding:10px;border-radius:8px;white-space:pre-wrap">${esc(msg)}</pre>` : `<p>✓ الفاتورة دخلت برنامج الفواتير تلقائيًا (تظهر لك أول ما تفتحه).</p>`);
    const sent = await mail(env, '✅ طلب مدفوع ' + label, html, orderExtra(env));
    return out({ ok: true, num, emailed: sent });
  }
}

// any unexpected exception still answers with JSON + CORS, so the page can show its "contact us with your payment number" message
export default {
  async scheduled(ev, env, ctx) { ctx.waitUntil(Promise.all([stockReminder(env).catch(() => {}), pruneGuards(env).catch(() => {})])) },
  async fetch(req, env, ctx) {
    try { return await handle(req, env, ctx) }
    catch (e) {
      return new Response(JSON.stringify({ ok: false, reason: 'error' }), { status: 500, headers: { 'Access-Control-Allow-Origin': SITE, 'Content-Type': 'application/json', 'Vary': 'Origin' } });
    }
  }
};
