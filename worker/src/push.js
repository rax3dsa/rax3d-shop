// Web Push (RFC 8030 + RFC 8291 aes128gcm + VAPID RFC 8292) with WebCrypto only: no dependency.
// Used for the phone notification «🛒 طلب جديد» of the owner's invoicing app (a PWA installed on the phone).
export const b64u = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export const unb64u = s => Uint8Array.from(atob(String(s).replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - String(s).length % 4) % 4)), c => c.charCodeAt(0));
const cat = (...a) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let p = 0; a.forEach(x => { o.set(x, p); p += x.length }); return o };
const enc = s => new TextEncoder().encode(s);
async function hkdf(salt, ikm, info, len) {
  const k = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, k, len * 8));
}
// ov = {asPriv (JWK), asPub (raw 65 bytes), salt} only for the RFC test vector
export async function encryptPush(payload, uaPubB64, authB64, ov = {}) {
  const ua = unb64u(uaPubB64), auth = unb64u(authB64);
  let asPriv, asPub;
  if (ov.asPriv) { asPriv = await crypto.subtle.importKey('jwk', ov.asPriv, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']); asPub = ov.asPub }
  else { const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']); asPriv = kp.privateKey; asPub = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey)) }
  const uaKey = await crypto.subtle.importKey('raw', ua, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, asPriv, 256));
  const salt = ov.salt || crypto.getRandomValues(new Uint8Array(16));
  const prk = await hkdf(auth, shared, cat(enc('WebPush: info\0'), ua, asPub), 32);
  const cek = await hkdf(salt, prk, enc('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, prk, enc('Content-Encoding: nonce\0'), 12);
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const data = cat(typeof payload === 'string' ? enc(payload) : payload, new Uint8Array([2]));   // 0x02 = last record delimiter
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, data));
  const rs = new Uint8Array([0, 0, 0x10, 0]);   // record size 4096, big endian
  return cat(salt, rs, new Uint8Array([asPub.length]), asPub, ct);
}
export async function newVapid() {
  const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey));
  return { pub: b64u(raw), d: jwk.d, x: jwk.x, y: jwk.y };
}
export async function vapidHeader(v, endpoint, subject) {
  const aud = new URL(endpoint).origin;
  const head = b64u(enc(JSON.stringify({ typ: 'JWT', alg: 'ES256' }))), claims = b64u(enc(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject })));
  const key = await crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', d: v.d, x: v.x, y: v.y, ext: true }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc(head + '.' + claims)));
  return 'vapid t=' + head + '.' + claims + '.' + b64u(sig) + ', k=' + v.pub;
}
// returns {ok, status}; status 404/410 = the subscription is gone (caller prunes it)
export async function sendPush(sub, text, v, subject) {
  const body = await encryptPush(text, sub.keys.p256dh, sub.keys.auth);
  const r = await fetch(sub.endpoint, { method: 'POST', headers: { Authorization: await vapidHeader(v, sub.endpoint, subject), 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: '86400', Urgency: 'high' }, body });
  return { ok: r.ok, status: r.status };
}
