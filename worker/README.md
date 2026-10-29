# دالة التحقق من الدفع (Cloudflare Worker)

1. `npm i -g wrangler && wrangler login`
2. من مجلد `worker/`: `wrangler secret put MOYASAR_SECRET` (المفتاح السري sk_ من ميسر) ثم `wrangler secret put RESEND_KEY` (مفتاح resend.com لإرسال الإيميل)
3. `wrangler deploy` ← يعطيك رابط مثل `https://rax3d-pay.<حسابك>.workers.dev`
4. في `index.html` عدّل السطر `const PAY={pk:"",api:"",ship:0}`: ضع المفتاح العام pk_ في `pk` والرابط في `api` ورسوم التوصيل في `ship` (ونفس الرسوم في `SHIP_FEE` داخل `wrangler.toml`).
5. جرّب أولًا بمفاتيح الاختبار pk_test_ / sk_test_ قبل المفاتيح الفعلية.
6. Apple Pay: فعّل الدومين rax3d.com من لوحة ميسر وارفع ملف التحقق في `/.well-known/`.

لا تضع المفتاح السري في أي ملف داخل المستودع (المستودع عام).

## ترقيم الفواتير + إيميل الطلب المدفوع
الدالة تحجز رقم الفاتورة التالي من `counter.json` في مستودع `rax3d-data` (ORD-n)، وتحفظ الطلب في `online/ORD-n.json`، وترسل إيميل «✅ طلب مدفوع ORD-n» فيه رسالة جاهزة تلصقها في تطبيق الفواتير.
Secrets المطلوبة: `MOYASAR_SECRET` (مفتاح sk_live)، `RESEND_KEY`، `GH_TOKEN` (fine-grained، Contents قراءة/كتابة على rax3d-data فقط). المتغير `GH_REPO` في wrangler.toml.

## دخول الفاتورة لبرنامج الفواتير + الاسترداد
- عند الدفع: الدالة تضيف الفاتورة (باسم ORD-n) في `partner_log.json` بمستودع rax3d-data، والتطبيق يستلمها تلقائيًا ويدخلها السجل والإحصائيات والنقاط. التكلفة تنحسب من القطع المحفوظة عندك، وإلا من وزن القطعة.
- عند الاسترداد: ميسر يرسل Webhook إلى `/webhook` (حدث payment_refunded)، والدالة تضيف أمر إلغاء، والتطبيق يحوّل الفاتورة «ملغاة».
- ميسر ← الإعدادات ← Webhooks ← أضف: `https://rax3d-pay.rax3d.workers.dev/webhook`، الحدث payment_refunded، ورمز سري (Shared secret) نفسه في `WEBHOOK_SECRET` (اختياري لكن يفضل).


## Cash on delivery (POST /cod)
Body: `{ref, customer:{name,phone,city,address}, cart:[{id,qty,color}]}`. Reserves an ORD-n number, stores `online/ORD-n.json` (cod:true) and emails the owner. It is NOT added to the invoicing app log (no sale/points until delivered and paid). Needs the same secrets as /confirm (GH_TOKEN, GH_REPO, RESEND_KEY, MAIL_TO).
