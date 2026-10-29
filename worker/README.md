# دالة التحقق من الدفع (Cloudflare Worker)

1. `npm i -g wrangler && wrangler login`
2. من مجلد `worker/`: `wrangler secret put MOYASAR_SECRET` (المفتاح السري sk_ من ميسر) ثم `wrangler secret put RESEND_KEY` (مفتاح resend.com لإرسال الإيميل)
3. `wrangler deploy` ← يعطيك رابط مثل `https://rax3d-pay.<حسابك>.workers.dev`
4. في `index.html` عدّل السطر `const PAY={pk:"",api:"",ship:0}`: ضع المفتاح العام pk_ في `pk` والرابط في `api` ورسوم التوصيل في `ship` (ونفس الرسوم في `SHIP_FEE` داخل `wrangler.toml`).
5. جرّب أولًا بمفاتيح الاختبار pk_test_ / sk_test_ قبل المفاتيح الفعلية.
6. Apple Pay: فعّل الدومين rax3d.com من لوحة ميسر وارفع ملف التحقق في `/.well-known/`.

لا تضع المفتاح السري في أي ملف داخل المستودع (المستودع عام).
