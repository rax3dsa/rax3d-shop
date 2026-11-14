#!/usr/bin/env python3
"""Regenerates sitemap.xml and the crawler link list (<noscript> block) in index.html
from ITEMS / PRICE / DESC. Run from the repo root after adding or editing a product:
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
rows = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        f'  <url><loc>https://rax3d.com/</loc><lastmod>{today if touch else home_last}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>']
rows.append(f'  <url><loc>https://rax3d.com/about.html</loc><lastmod>{today if touch else (re.search(r"<loc>https://rax3d\\.com/about\\.html</loc><lastmod>([\\d-]+)</lastmod>", old) or [None, today])[1]}</lastmod><changefreq>yearly</changefreq><priority>0.5</priority></url>')
for i in items:
    lm = today if touch else last.get(i['id'], today)
    rows.append(f'  <url><loc>https://rax3d.com/?p={i["id"]}</loc><lastmod>{lm}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>')
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
print(len(items), 'items;', len(cats), 'categories; sitemap + noscript updated')
