#!/usr/bin/env python3
"""Regenerates sitemap.xml, the crawler link list (<noscript> block) in index.html and the static
English pages (en.html + en-<id>.html, one per visible piece; the same SPA with data-lang="en") from ITEMS / PRICE / DESC / DESC_EN / EN. Run from the repo root after adding or editing a product:
    python3 tools/seo-build.py            # keeps existing lastmod, new ids get today
    python3 tools/seo-build.py --touch    # sets lastmod = today for all pages
"""
import re, json, sys, datetime, html
today = datetime.date.today().isoformat()
touch = '--touch' in sys.argv
app = open('app.js', encoding='utf-8').read()
idx = open('index.html', encoding='utf-8').read()
items_src = re.search(r'const ITEMS=\[(.*?)\n\];', app, re.S).group(1)
items = []
for l in items_src.strip().split('\n'):
    m = re.match(r'\s*\{id:"([\w-]+)",cat:"([^"]+)",name:"([^"]+)"', l)
    if m: items.append({'id': m[1], 'cat': m[2], 'name': m[3], 'hid': 'hid:true' in l, 'vg': (re.search(r'vg:"(\w+)"', l) or [None, None])[1]})
price = json.loads(re.search(r'const PRICE=(\{.*?\});', idx).group(1))
desc = json.loads(re.search(r'const DESC=(\{.*?\});', app).group(1))
def dsc(i):
    if i['id'] in desc: return desc[i['id']]
    lead = next((x for x in items if x['vg'] and x['vg'] == i['vg']), i)
    return desc.get(lead['id'], '')
# ---- sitemap
old = open('sitemap.xml', encoding='utf-8').read()
last = dict(re.findall(r'<loc>https://rax3d\.com/\?p=([\w-]+)</loc><lastmod>([\d-]+)</lastmod>', old))
home_last = (re.search(r'<loc>https://rax3d\.com/</loc><lastmod>([\d-]+)</lastmod>', old) or [None, today])[1]
rows = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
        f'  <url><loc>https://rax3d.com/</loc><lastmod>{today if touch else home_last}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority><xhtml:link rel="alternate" hreflang="ar" href="https://rax3d.com/"/><xhtml:link rel="alternate" hreflang="en" href="https://rax3d.com/en.html"/></url>',
        f'  <url><loc>https://rax3d.com/en.html</loc><lastmod>{today if touch else home_last}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority><xhtml:link rel="alternate" hreflang="ar" href="https://rax3d.com/"/><xhtml:link rel="alternate" hreflang="en" href="https://rax3d.com/en.html"/></url>']
rows.append(f'  <url><loc>https://rax3d.com/about.html</loc><lastmod>{today if touch else (re.search(r"<loc>https://rax3d\\.com/about\\.html</loc><lastmod>([\\d-]+)</lastmod>", old) or [None, today])[1]}</lastmod><changefreq>yearly</changefreq><priority>0.5</priority></url>')
rows.append(f'  <url><loc>https://rax3d.com/about-en.html</loc><lastmod>{today if touch else (re.search(r"<loc>https://rax3d\\.com/about\\.html</loc><lastmod>([\\d-]+)</lastmod>", old) or [None, today])[1]}</lastmod><changefreq>yearly</changefreq><priority>0.5</priority></url>')
for i in items:
    lm = today if touch else last.get(i['id'], today)
    alt = '' if i['hid'] else f'<xhtml:link rel="alternate" hreflang="ar" href="https://rax3d.com/?p={i["id"]}"/><xhtml:link rel="alternate" hreflang="en" href="https://rax3d.com/en-{i["id"]}.html"/>'
    rows.append(f'  <url><loc>https://rax3d.com/?p={i["id"]}</loc><lastmod>{lm}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority>{alt}</url>')
    if not i['hid']: rows.append(f'  <url><loc>https://rax3d.com/en-{i["id"]}.html</loc><lastmod>{lm}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority>{alt}</url>')
rows.append('</urlset>')
open('sitemap.xml', 'w', encoding='utf-8').write('\n'.join(rows) + '\n')
# ---- crawler link list
cats = []
for i in items:
    if not i['hid'] and i['cat'] not in cats: cats.append(i['cat'])
out = ['<!--SEO-START--><noscript><section dir="rtl" style="padding:16px;max-width:760px;margin:auto">',
       '<h1>RAX3D | متجر طباعة ثلاثية الأبعاد في السعودية</h1>',
       '<p>هدايا وديكور وإكسسوارات مطبوعة بتقنية الطباعة ثلاثية الأبعاد. اختر القطعة واللون والمقاس واطلبها بالإفراد أو بالجملة. الموقع يحتاج تفعيل JavaScript لعرض المجسمات واختيار الألوان.</p>']
for c in cats:
    out.append(f'<h2>{html.escape(c)}</h2><ul>')
    for i in items:
        if i['cat'] == c and not i['hid']:
            p = price.get(i['id'])
            out.append(f'<li><a href="?p={i["id"]}">{html.escape(i["name"])}</a>' + (f' - من {p[1]} ريال' if p else '') + (f'. {html.escape(dsc(i))}' if dsc(i) else '') + '</li>')
    out.append('</ul>')
out.append('</section></noscript><!--SEO-END-->')
block = '\n'.join(out)
if '<!--SEO-START-->' in idx:
    idx = re.sub(r'<!--SEO-START-->.*?<!--SEO-END-->', lambda m: block, idx, flags=re.S)
else:
    a = '<div class="shell" dir="rtl">'
    assert idx.count(a) == 1
    idx = idx.replace(a, block + '\n' + a)
open('index.html', 'w', encoding='utf-8').write(idx)


# ---- static English pages: same SPA, language fixed by <html data-lang="en"> (app.js FORCEEN), English head + crawler block
import os
en_src = open('app.js', encoding='utf-8').read()
EN = json.loads(re.search(r'const EN=(\{.*?\});\n', en_src, re.S).group(1))
for m in re.finditer(r'Object\.assign\(EN,(\{.*?\})\);', en_src, re.S):
    try: EN.update(json.loads(m.group(1)))
    except Exception: pass
desc_en = json.loads(re.search(r'const DESC_EN=(\{.*?\});\n', en_src, re.S).group(1))
tr = lambda x: EN.get(x, x)
TIE = {"التوزيعات": "3D printed giveaways", "إكسسوارات السيارة": "3D printed car hanger", "إكسسوارات القهوة": "3D printed coffee accessory", "ميداليات": "3D printed keychain", "إكسسوارات المكتب": "3D printed desk decor", "الديكور": "3D printed home decor", "الإضاءات": "3D printed decor lamp", "سناك وضيافة": "3D printed hospitality", "ألعاب وقيمرز": "3D printed toys and gamer gifts"}
KWE = {"التوزيعات": "giveaways, event giveaways, bulk giveaways, 3D giveaways", "إكسسوارات السيارة": "car accessories, car hanger", "إكسسوارات القهوة": "coffee accessories, xBloom, coffee brewing tools", "إكسسوارات المكتب": "office accessories, desk decor, staff gifts", "الديكور": "home decor, vase, decor gifts", "الإضاءات": "table lamp, decor lighting, LED lamp, desk lighting", "ميداليات": "keychain, giveaways, small gift", "سناك وضيافة": "hospitality, chips holder, table decor", "ألعاب وقيمرز": "toys, whistle, kids gifts, video games, gamer gifts"}
HOME_T = 'RAX3D | 3D printing in Saudi Arabia: gifts, decor and accessories made to order'
HOME_D = 'A 3D printing store in Saudi Arabia: vases, gifts, keychains, xBloom coffee accessories, whistles and desk decor. Pick the piece, colour and size and see it in 3D before you order.'
HOME_K = '3D printing, 3D printing Saudi Arabia, 3D print store, printed gifts, desk decor, home decor, vases, keychains, whistles, coffee accessories, xBloom accessories, custom cup, graduation gifts, custom printing, RAX3D'
def dsc_en(i):
    if i['id'] in desc_en: return desc_en[i['id']]
    lead = next((x for x in items if x['vg'] and x['vg'] == i['vg']), i)
    return desc_en.get(lead['id'], '')
E=lambda x: html.escape(x, quote=True)
def meta(h, attr, name, content):
    pat = re.compile(r'<meta %s="%s" content="[^"]*">' % (attr, re.escape(name)))
    tag = '<meta %s="%s" content="%s">' % (attr, name, E(content))
    return pat.sub(lambda m: tag, h, count=1) if pat.search(h) else h.replace('</head>', tag + '\n</head>', 1)
def en_page(pid):
    h = idx
    it = next((x for x in items if x['id'] == pid), None) if pid else None
    url = f'https://rax3d.com/en-{pid}.html' if it else 'https://rax3d.com/en.html'
    ar_url = f'https://rax3d.com/?p={pid}' if it else 'https://rax3d.com/'
    if it:
        nm = tr(it['name']); p = price.get(pid)
        d = (dsc_en(it) or (nm + '. Order your piece 3D printed in the colours and size you want')) + (f' From {p[1]} SAR.' if p else '')
        t = f"{nm} – {TIE.get(it['cat'], '3D printed')} | RAX3D"; k = ', '.join(x for x in [nm, KWE.get(it['cat']), '3D printing Saudi Arabia', '3D printing', 'RAX3D'] if x)
        img = 'https://rax3d.com/' + (f'thumbs/{pid}.jpg' if os.path.exists(f'thumbs/{pid}.jpg') else 'icon-512.png')
    else:
        t, d, k, img = HOME_T, HOME_D, HOME_K, 'https://rax3d.com/icon-512.png'
    h = h.replace('<html lang="ar" dir="rtl">', '<html lang="en" dir="ltr" data-lang="en"' + (f' data-p="{pid}"' if it else '') + '>', 1)
    h = re.sub(r'<title>.*?</title>', lambda m: '<title>' + E(t) + '</title>', h, count=1, flags=re.S)
    h = meta(h, 'name', 'description', d); h = meta(h, 'name', 'keywords', k)
    h = meta(h, 'property', 'og:title', t); h = meta(h, 'property', 'og:description', d); h = meta(h, 'property', 'og:locale', 'en_US'); h = meta(h, 'property', 'og:url', url); h = meta(h, 'property', 'og:image', img)
    h = meta(h, 'name', 'twitter:title', t); h = meta(h, 'name', 'twitter:description', d); h = meta(h, 'name', 'twitter:image', img)
    h = re.sub(r'<link rel="canonical" href="[^"]*">', lambda m: f'<link rel="canonical" href="{url}">', h, count=1)
    h = re.sub(r'<link rel="alternate" hreflang="ar"[^\n]*', lambda m: f'<link rel="alternate" hreflang="en" href="{url}"><link rel="alternate" hreflang="ar" href="{ar_url}"><link rel="alternate" hreflang="x-default" href="{ar_url}">', h, count=1)
    out = ['<!--SEO-START--><noscript><section dir="ltr" style="padding:16px;max-width:760px;margin:auto">']
    if it:
        out.append(f'<h1>{E(tr(it["name"]))}</h1><p>{E(d)}</p><p><a href="en.html">All pieces</a> · <a href="{ar_url}">العربية</a></p>')
    else:
        out.append('<h1>RAX3D | 3D printing store in Saudi Arabia</h1><p>Gifts, decor and accessories made with 3D printing. Pick the piece, colour and size and order single pieces or wholesale.</p>')
        for c in cats:
            out.append(f'<h2>{E(tr(c))}</h2><ul>')
            for i in items:
                if i['cat'] == c and not i['hid']:
                    p = price.get(i['id'])
                    out.append(f'<li><a href="en-{i["id"]}.html">{E(tr(i["name"]))}</a>' + (f' - from {p[1]} SAR' if p else '') + (f'. {E(dsc_en(i))}' if dsc_en(i) else '') + '</li>')
            out.append('</ul>')
        out.append(f'<p><a href="{ar_url}">العربية</a></p>')
    out.append('</section></noscript><!--SEO-END-->')
    h = re.sub(r'<!--SEO-START-->.*?<!--SEO-END-->', lambda m: '\n'.join(out), h, flags=re.S)
    return h
for f in os.listdir('.'):
    if re.fullmatch(r'en(-[\w-]+)?\.html', f): os.remove(f)
n = 0
for pid in [None] + [i['id'] for i in items if not i['hid']]:
    open('en.html' if pid is None else f'en-{pid}.html', 'w', encoding='utf-8').write(en_page(pid)); n += 1
print(len(items), 'items;', len(cats), 'categories; sitemap + noscript updated;', n, 'English pages')
