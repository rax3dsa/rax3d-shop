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
- No wholesale tier: set the wholesale number equal to the single price (`[106,106]`). The shop then hides the wholesale line and never applies a discount, and the worker still agrees. Used for pieces whose wholesale margin would be near zero (the Harley clock and toolbox).

## Rule 3: no wholesale price when wholesale would lose money (approved by the owner, permanent)
For every new or re-priced product, check the wholesale price before publishing:
- Wholesale net = wholesale - (wholesale x 0.032 + 1.2) - cost (cost as in Pricing; use the estimate if the 3MF is not sliced).
- If wholesale net is zero or negative (a loss), the wholesale price MUST equal the single price, e.g. `[106,106]`. The shop then hides the wholesale line and never discounts (WQ = Infinity), and the worker agrees. Never leave a loss-making wholesale price.
- Also apply it when the owner asks for a price at which wholesale would lose money.
- If wholesale net is positive but under about 10% of the wholesale price, keep it but warn the owner in the reply (it disappears with one failed print).
- In the reply, state which products had their wholesale removed and why.

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

## Part colours
- OWNER CANCELLED part colouring (11-07): `PARTCOL` is empty, every model uses the plain 13-colour grid + rotatable 3D. Multi-part/lettering models show a hint (`#partHint`) telling the customer to mention different part/lettering colours in the "أخرى" box. Do not re-enable tabs unless the owner asks. clips is back to one mesh.

## Why the old part tabs felt wrong (diagnosed 11-12, read before touching part colours)
- The tabs were built on `keeps`, and `keeps` are COLOUR GROUPS (one mesh per source filament), not parts. So unrelated pieces that shared a filament became one tab (pringles: face + wordmark), pieces folded into the main mesh could not be coloured at all (pringles banner = 3MF part "DarkRed"), and the tab names were guessed from photos.
- The real structure is in the 3MF sources (private data repo, `files/*.3mf`), and it differs per model: named parts in one object (pringles: Sign, DarkRed, Black, White, MainBody; also d4, hood, xkit), sets of separate objects (ttt and 9 single-colour sets), brush-painted triangles with no names (chips, ltr, d1, d5, ghost, pcorn), or one fused mesh (16 of the 37 sources). No single rule fits all of them.
- If the owner asks to bring per-part colouring back: export per 3MF part (never per colour), let the owner name / merge / hide the parts of each model and approve that model before it goes live, and keep it inside the mixed-colour special order (price by message). Never switch it on for the whole catalogue with a generic split.

## Mixed colours = special order (added 11-12, approved by the owner)
- Customise page: `#mcBtn` opens `#mcBox` (2 to 6 in-stock colours + a short note). The cart line gets colour "ألوان متعددة" and a note starting with "🎨 طلب خاص".
- Such a line has NO fixed price (the owner: "the price differs, we agree it by message"): the cart shows "السعر بالخاص", totals skip it (`isSP`, `PU`, `TOT`), and because it carries a note it blocks online payment and cash on delivery, so the order goes by message.
- This is not the old per-part tabs (still off, see Part colours).

## Owner decisions (do not re-open)
- Branded-design pieces (Harley and similar) stay in the shop and in the home lists. The owner has decided this (confirmed 11-11); do not raise trademark concerns again or move/remove these pieces unless he asks.
- Preparation time shown to customers (changed by the owner 11-12): 3 to 7 days for normal orders. Wholesale has NO fixed range: "depends on the order and quantity, we contact you by message" (item page, cart, receipt, "how to order", FAQ, English dictionary). Change all of them together.
