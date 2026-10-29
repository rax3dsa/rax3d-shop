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
    const pr = await prices(); let total = 0; const lines = [];
    for (const o of b.cart) {
      const q = Math.floor(+o.qty), u = unit(pr, String(o.id), q);
      if (!u || q < 1 || q > 500) return out({ ok: false, reason: 'item' }, 400);
      total += u * q; lines.push(`${esc(o.id)} × ${q} (${esc(String(o.color || '').slice(0, 30))}) = ${u * q} ريال`);
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
    // 4) once per order (optional KV binding ORDERS)
    if (env.ORDERS) { if (await env.ORDERS.get(b.ref)) return out({ ok: true, ref: b.ref, dup: true }); await env.ORDERS.put(b.ref, '1', { expirationTtl: 60 * 60 * 24 * 30 }) }
    const sent = await mail(env, '✅ طلب مدفوع ' + b.ref, info);
    return out({ ok: true, ref: b.ref, emailed: sent });
  }
};
