// RAX3D payment check. The Moyasar secret key lives here (env.MOYASAR_SECRET), never in the site.
// POST /confirm  { paymentId, ref, customer:{name,phone,city,address}, cart:[{id,qty,color}] }
// Re-prices the cart from the live site, asks Moyasar what was really paid, then emails the order.
const SITE = 'https://rax3d.com';
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
<div style="clear:both;padding:14px 18px 0;font-size:13px;color:#2e7d32;font-weight:bold">✓ مدفوعة (${esc(d.method)})</div>
<div style="margin:16px 18px 0;background:${CR};border:1px solid ${LN};padding:12px 14px;font-size:12.5px;line-height:1.8;color:#333"><b style="color:${G};font-size:14px">سياسة الاستبدال والاسترجاع</b><br>• إذا وصلتك القطعة مكسورة، أو فيها عيب طباعة، أو تختلف عن طلبك في اللون أو المقاس، راسلنا خلال 3 أيام من الاستلام مع صورة، ونعيد طباعتها أو نستبدلها مجاناً.<br>• لأن القطع تنصنع لك خصيصاً، ما نقبل الإرجاع بسبب تغيير الرأي بعد بدء الطباعة.<br>• تقدر تلغي طلبك مجاناً قبل ما نبدأ الطباعة.<br>• القطع المخصصة (اسم أو عبارة أو مقاس معدّل) تُستبدل فقط إذا فيها عيب.<br>• الفرق البسيط في درجة اللون أو ظهور خطوط الطبقات طبيعي في الطباعة ثلاثية الأبعاد، وما يُعتبر عيب.</div>
<div style="height:4px;background:${G};margin:18px 18px 0"></div>
<div style="text-align:center;padding:14px 18px 6px;font-weight:bold;font-size:18px;color:${G}">شكراً لتعاملكم مع RAX3D</div>
<div style="text-align:center;font-size:12.5px;color:#444;direction:ltr">Instagram: @rax3d.sa &nbsp;|&nbsp; TikTok: @rax3d.sa &nbsp;|&nbsp; Email: rax3d.sa@hotmail.com</div>
<div style="text-align:center;font-size:12.5px;color:#444;padding:6px 0 16px">رقم وثيقة العمل الحر: <span dir="ltr">FL-255870895</span></div>
<div style="height:10px;background:#111"></div></div>`;
}

export default {
  async fetch(req, env) {
    const cors = { 'Access-Control-Allow-Origin': SITE, 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' };
    const out = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST' || new URL(req.url).pathname !== '/confirm') return out({ ok: false }, 404);

    let b; try { b = await req.json() } catch { return out({ ok: false, reason: 'bad' }, 400) }
    const c = b.customer || {};
    if (!/^[0-9a-f-]{36}$/i.test(b.paymentId || '') || !/^RX-[A-Z0-9]{5}$/.test(b.ref || '') || !Array.isArray(b.cart) || !b.cart.length || b.cart.length > 40)
      return out({ ok: false, reason: 'bad' }, 400);

    // 1) what the cart should cost, from the live site prices
    const pr = await prices(); let total = 0; const lines = [], rows = [];
    for (const o of b.cart) {
      const q = Math.floor(+o.qty), u = unit(pr, String(o.id), q);
      if (!u || q < 1 || q > 500) return out({ ok: false, reason: 'item' }, 400);
      total += u * q; rows.push({ id: String(o.id), q, u, color: String(o.color || '').slice(0, 30) }); lines.push(`${esc(o.id)} × ${q} (${esc(String(o.color || '').slice(0, 30))}) = ${u * q} ريال`);
    }
    total += +env.SHIP_FEE || 0;

    // 2) what Moyasar says was paid
    const r = await fetch('https://api.moyasar.com/v1/payments/' + b.paymentId, { headers: { Authorization: 'Basic ' + btoa(env.MOYASAR_SECRET + ':') } });
    if (!r.ok) return out({ ok: false, reason: 'lookup' }, 502);
    const p = await r.json();
    if (p.status !== 'paid') return out({ ok: false, reason: 'unpaid', status: p.status });

    const info = `<p>رقم الطلب: <b>${esc(b.ref)}</b><br>الاسم: ${esc((c.name || '').slice(0, 60))}<br>الجوال: ${esc((c.phone || '').slice(0, 20))}<br>المدينة: ${esc((c.city || '').slice(0, 40))}<br>العنوان: ${esc((c.address || '').slice(0, 200))}</p><p>${lines.join('<br>')}</p><p>المدفوع: <b>${p.amount / 100} ${esc(p.currency)}</b> · طريقة الدفع: ${esc(p.source?.type || '')} · رقم الدفعة: ${esc(p.id)}</p>`;

    // 3) paid but the amount is not what we expect -> do not confirm, alert the owner
    if (p.currency !== 'SAR' || p.amount !== Math.round(total * 100) || p.metadata?.ref !== b.ref) {
      await mail(env, '⚠️ دفعة تحتاج مراجعة ' + b.ref, `<p>المتوقع: ${total} ريال</p>` + info);
      return out({ ok: false, reason: 'mismatch', paid: true });
    }
    // 4) order number = the next invoice number (ORD-n), reserved once per payment. Without GH_TOKEN we fall back to the old RX code.
    let num = null, dup = false;
    if (env.GH_TOKEN && env.GH_REPO) {
      try {
        const done = await ghRead(env, 'online/pay_' + b.paymentId + '.json');
        if (done) { num = done.data.num; dup = true }
        else {
          num = await reserveNumber(env);
          const order = { num, paymentId: b.paymentId, ref: b.ref, amount: p.amount / 100, currency: p.currency, method: p.source?.type || '', customer: { name: (c.name || '').slice(0, 60), phone: (c.phone || '').slice(0, 20), city: (c.city || '').slice(0, 40), address: (c.address || '').slice(0, 200) }, cart: b.cart.map(o => ({ id: String(o.id), qty: Math.floor(+o.qty), color: String(o.color || '').slice(0, 30) })), at: new Date().toISOString() };
          await ghCreate(env, 'online/ORD-' + num + '.json', order, 'طلب مدفوع ORD-' + num);
          await ghCreate(env, 'online/pay_' + b.paymentId + '.json', { num }, 'ربط الدفعة بالطلب ORD-' + num);
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
    const invoice = invoiceHtml({ label, date: today, name: c.name || '', phone: c.phone || '', rows: rows.map(r => ({ ...r, name: nm[r.id]?.n || r.id })), sub: total - (+env.SHIP_FEE || 0), ship: +env.SHIP_FEE || 0, total, method: p.source?.type === 'applepay' ? 'Apple Pay' : (p.source?.company ? String(p.source.company).toUpperCase() : (p.source?.type || '')) });
    const html = invoice + `<hr style="margin:26px 0;border:0;border-top:1px dashed #ccc"><p>طلب مدفوع <b>${esc(label)}</b>${num ? '' : ' (بدون رقم فاتورة، تعذّر حجز الرقم)'}</p>` + info.replace(esc(b.ref), esc(label)) +
      `<p>الصق الرسالة التالية في تطبيق الفواتير (استيراد الطلب) وتنعبّى الفاتورة بنفس الرقم:</p><pre style="background:#f4f1ea;padding:10px;border-radius:8px;white-space:pre-wrap">${esc(msg)}</pre>`;
    const sent = await mail(env, '✅ طلب مدفوع ' + label, html);
    return out({ ok: true, num, emailed: sent });
  }
};
