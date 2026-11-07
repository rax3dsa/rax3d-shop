# RAX3D shop: standing rules for any session working on this repo

The shop is static (GitHub Pages, rax3d.com). Products live in `app.js`; prices and weights live in `index.html`; the payment worker is in `worker/`.

## Rule 1: "وصل حديثاً" (NEW) and "الأكثر طلباً" (FEATURED) rotate on every new product (approved by the owner, permanent)
When a new product is added to the shop:
1. Put its id FIRST in `NEW` (app.js).
2. `NEW` keeps exactly 6 ids: the id that falls off the END of `NEW` goes FIRST in `FEATURED`.
3. `FEATURED` keeps exactly 6 ids: drop the LAST id of `FEATURED` (that product stays in its category, it only leaves the home list).
Do this in the same commit as the product. Never grow either list. Say in the reply which id moved and which was dropped.

## Rule 2: checklist for adding a product (all of it, in one commit)
- `models/<id>.json` (3D, see below), `hq/<id>-0..12.webp` (800x800, 13 colour images, 0 = the owner's photo), `thumbs/<id>.jpg` (320x320).
- `app.js`: `IMG`, `ITEMS` (id, cat, name, use), `DIM` [X,Y,Z mm], `MODELS`, `NEW`/`FEATURED` (Rule 1), Arabic to English entries in `EN` (name, use).
- `index.html`: `PRICE` ({id:[single,wholesale]}) and `WEIGHT` (grams). The worker reads both from the live page, so they must stay there.
- `catalog.json` (`n`, `en`, `g`), `sitemap.xml` (`?p=<id>`), bump the cache version in `sw.js`.
- Test in a browser before pushing: item page (AR + EN), 3D view, a colour change, cart price, no console errors.

## Pricing
- Cost = grams x 0.115 x 1.2 + print hours x 1.15 + 3 (packaging). Single = cost x 4.5, wholesale = cost x 3.5, then cover the gateway fee: `ceil((p + 1.2) / 0.968)`.
- Wholesale threshold: 12 pieces, or 6 when the weight is 100 g or more. If the 3MF is not sliced, the weight/time are estimates: say so and ask the owner to slice.
- The owner may set a price by hand; then derive wholesale as about 78% of it.

## 3D viewer rules (hard-won)
- `models/*.json` = welded int16 positions (scale 0.01 mm, within +-327 mm), index arrays, optional `keeps` (fixed-colour parts). The main mesh follows the colour the customer picks.
- MODELS needs `keep:["keep"]` when the model has `keeps`. `up:1` when the piece is already Y-up/face-forward, otherwise Z-up is rotated.
- Colours in `keeps` are used as linear values: store `srgb_to_linear(hex)` or they look washed out.
- Coplanar parts z-fight: lower the base part by 0.05 to 0.1 mm under the colour layers.
- The Bambu 3MF stores each part with its own transform (components + build item); apply them, and use the `source_offset` values to reassemble multi-plate parts.

## Other rules
- Never put secrets in the repo (it is public). Payment keys live in the Cloudflare worker.
- Do not reuse an `id` attribute in the HTML (duplicate ids already broke the points and chat modals once).
- Customer-facing text is Arabic (Saudi tone); keep the English dictionary complete.

## Product descriptions and SEO (added)
- Every new product needs an Arabic entry in `DESC` and an English one in `DESC_EN` (app.js, <=125 chars, sells the piece). Hidden variants (`vg`) inherit from the lead item.
- After adding or editing a product run `python3 tools/seo-build.py` (regenerates sitemap.xml and the crawler `<noscript>` block in index.html).
- Page titles come from `seoFor()` (`TI` category map); keep titles unique and <=70 chars.

## Part colours (owner-approved for 7 models ONLY, 11-07)
- Only the ids in `PARTCOL` (app.js: pringles, chips, ttt, lampman, ltr, w1, clips) get the part-colour tabs ("اللون الأساسي" = photo look, then the main part, then each fixed part; names in `MN` + `PN`, named from the product photo). Every other model keeps the plain 13-colour grid + rotatable 3D. Do not extend `PARTCOL` unless the owner asks.
- Part names must come from the photo (e.g. pringles: face & lettering / moustache & eyes). clips: second bowl is a split-out `keeps` part (blue).
- Untested in a real browser: check tabs, base-colour look, cart text (AR + EN).
- lampman (`two` model): tabs = base / الجسم / الغطاء العلوي. The top-cover tab recolours shade + bulb together (click handler calls `set3DShade`); the old standalone shade control is hidden for it.
