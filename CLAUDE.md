# RAX3D shop: standing rules for any session working on this repo

The shop is static (GitHub Pages, rax3d.com). Products live in `app.js`; prices and weights live in `index.html`; the payment worker is in `worker/`.

## Publish command (owner's standing order, 11-13)
- The phrases «ارفع للموقع» / «ارفعهم للموقع» = the owner's explicit go-ahead to publish (open the PR and merge it to main) the work shown to him in this conversation, including the price already told to him. Before that phrase do not publish: work on the branch, test, show, wait.
- The phrase does not cover deleting products or data, prices he was not shown, money actions or messages. If anything changed after the show, tell him before publishing.

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

## Pricing: use the invoicing app's calculator (owner's standing order, 11-13)
- Price every piece with `python3 tools/price-calc.py <grams> <hours> [acc]`: it is the invoicing app's calculator (`calcItem` in rax3dsa.github.io) with the same formulas and rounding. Live settings come from the data repo (`shared.json` -> `/settings`): spool 115 per 1000 g, waste 20%, machine 1.15 per hour, packaging 3, x4.5 single, x3.5 set, gateway 3.2% + 1.2. The app rounds the suggested price UP first, then covers the gateway fee: shop price = `ceil((suggested + 1.2) / 0.968)`. Extra parts (`acc`) are added at cost with no multiplier. Use `--settings` to read the settings live if they changed.
- Lowest-loss rule: the default shop price is the app's suggested shop price (zero gap, no loss against the suggestion). Go below it only when the owner sets a price by hand.
- BEFORE the owner confirms any price, tell him: the single price, the wholesale price, and the net profit in SAR and in % for both (and the gap against the suggested price when he set it by hand). Apply Rule 3 to the wholesale. Nothing goes live before he confirms. (Example: hdcookie, 14.27 g, 0.92 h, cost 6.03: app price 31 / 24, owner chose 30 by hand.)

## Giveaway (التوزيعات) product photos (owner's standing order, 11-14)
- The main image (`hq/<id>-0.webp`, 800x800) of EVERY giveaway product is a crowd scene: many identical copies of the piece in receding rows, ONE sharp hero copy front and centre, the rows behind smaller, softer and fading into the site's cream background (no hard cut at the frame, no studio/white background), so the customer understands at a glance that it is sold in bulk and with the same brand look.
- Build it with `python3 tools/crowd-scene.py <id> [--src photo] [--rect x,y,w,h]` (cuts the piece out of its own photo with GrabCut, needs opencv-python-headless; also writes `thumbs/<id>.jpg`). Look at the result, check the cut-out edges and the hero centring before showing it. The image is computer-composed from one photo: say so when presenting it.
- The same applies to the home strip card (thumb). Colour images are not needed for giveaways ordered by message.

## Giveaway price tabs on the piece page (owner's standing order, 11-14)
- EVERY giveaway product's page shows quantity tabs (50 / 100 / 500 / 1000 pieces); the selected tab shows the unit price, the total and the approximate days. Data lives in `DISTP` (app.js): `{id:{g:grams, h:print hours per piece}}`; `distRow()` applies the same formula, margins and floors as `tools/dist-price.py` and the invoicing app's `distUnit` (change all together), and days = ceil(pieces x hours / 24) + `DIST_BUF` (2 days prep and packing). The header shows "price by quantity, from <1000-piece price>" instead of "price by message". The chosen quantity is copied into the order message.
- A NEW giveaway product only needs its entry in `DISTP` (plus `sp:1` and the crowd photo). If its 3MF is not sliced, `g`/`h` are estimates: say so to the owner and ask him to slice, then replace them. `cool` (mini duck): g 2.55 and h 0.357 are ESTIMATES (the 3MF has 36 ducks per plate, unsliced).

## Distribution (bulk giveaway) pricing (owner's standing order, 11-13)
- Distributions (orders of 50+ pieces of one piece) have their own pricing, NOT the normal wholesale tier. Unit cost = (grams x 0.115 x 1.2 + hours x 1.15) x 1.05 (5% failure allowance, always included) + 0.5 (bulk packaging).
- Unit price = `((cost + 1.2 / qty) / (0.968 - target net margin))` rounded UP to 0.05 SAR. Target net margin: 50 pcs 25%, 100 pcs 20%, 500 pcs 15%, 1000 pcs 10% (about cost x 1.39 / 1.30 / 1.22 / 1.15; owner 11-14: lowered three times to compete with a rival whose small pieces sell at 4.00 / 3.50 / 3.00 for 100 / 500 / 1000). Minimum order 50 pieces.
- FLOOR per piece (owner 11-14, chosen by him): 50 pcs 3.75, 100 pcs 3.40, 500 pcs 3.00, 1000 pcs 2.65. The unit price is the HIGHER of the margin price and the floor, so light pieces (the mini Cool Duck, about 2.5 g, cost about 1.30) get the floor list and heavy ones keep the margin price (never below it). Same in `distUnit` (`DIST_FLOOR`) and `tools/dist-price.py` (`FLOOR`): change all together.
- Use `python3 tools/dist-price.py <grams> [hours] [--pack 0.5] [--qty N] [--printers P]`. If the hours are unknown they are estimated (0.25 + 0.042 x grams): say it is an estimate. The 5% failure allowance is included by default (`--fail 0` turns it off).
- BEFORE the owner confirms: tell him the unit price, the total and the net profit for each tier, and the print time needed (pieces x time per piece / printers). Nothing goes live before he confirms.
- Lowest loss (owner, 11-14): in the invoicing app every invoice line of 50+ pieces (not type «مجموعة») takes its suggested price and its cost from this same formula (`distUnit`), so the «الخسارة عن السعر المقترح» card shows no phantom loss against the normal wholesale suggestion (a 200 pcs line of 8 g was suggested 17 SAR per piece by the wholesale formula vs about 4.00 by this one). Lines of 12 to 49 pieces keep the normal wholesale formula.
- The same rule lives in the invoicing app as the admin tab «التوزيعات» (`distCalc`, `DIST_TIERS` in rax3dsa.github.io; it reads the app's live settings). Change the tiers in BOTH places together: this section, `tools/dist-price.py` and that tab.

## Pricing
- Cost = grams x 0.115 x 1.2 + print hours x 1.15 + 3 (packaging). Single = cost x 4.5, wholesale = cost x 3.5, then cover the gateway fee: `ceil((p + 1.2) / 0.968)`.
- Wholesale threshold: 12 pieces, or 6 when the weight is 100 g or more. If the 3MF is not sliced, the weight/time are estimates: say so and ask the owner to slice.
- The owner may set a price by hand; then derive wholesale as about 78% of it.
- Hand-set prices are the owner's (decision of 11-12): he raised the 9 pieces furthest below the formula (hdclock, hdtissue, hdtray, hdbuddy, cubea, cubeb, lampman; `hood` and `hdtool` were in this group and have since been removed from the shop) by 13% and 6 more (chips, pringles, clips, abst, wilson, knobs) by 10%, both tiers, rounded half up. They stay far below the formula on purpose: never re-derive them from the formula, and change them only when he gives a number or a percentage. Tell him the result table before anything goes live. Exception chosen with his go-ahead: cubeb wholesale is 205 (91% of the single price, not the usual ~78%), because at +13% (176) one failed print (about 124 SAR of filament and machine time) cost the profit of 3.7 sales; at 205 it is 2.
- "Loss" in the owner's words = how far a shop price sits below the formula price (the same idea as the invoicing app's card «الخسارة عن السعر المقترح»), not a sale below cost. On 11-12 no piece was below cost.
- Approved pieces (owner's standing order, 11-13): once the owner adopts a piece's price (e.g. lampman 144/113 kept, weight left as is, price entered in the invoicing app's custom-price field), never ask him to slice that piece again.
- SLICED AND APPROVED (11-13): the owner sliced these 17 pieces in Bambu Studio and approved their shop prices. Never ask him to slice them again and never call their cost an estimate (except cubea, see below). Weights in `index.html` `WEIGHT` were left as they were on purpose (his decision); the invoicing app gets the price through its per-line "custom price" field, which the owner fills by hand.
  | id | name | g | print time | single / wholesale (live) |
  |---|---|---|---|---|
  | lampman | مصباح الرجل الصغير | 318.77 | 25h06m | 144 / 113 |
  | wilson | كوب ويلسون تيكي | 281.17 | 21h09m | 179 / 141 |
  | hdbuddy | مجسم هارلي المتحرك | 12.85 | 1h12m | 24 / 16 |
  | snoopy | لوحة سنوبي تشيل | 54.44 | 3h58m | 72 / 56 |
  | cubeb | مصباح المكعبات B | 596.77 | 45h32m | 205 / 160 |
  | cubea | مصباح المكعبات A | about 366 (ESTIMATE) | about 28h (ESTIMATE) | 134 / 105 |
  | pmaskm | قناع اليقطين M | 146.07 | 12h44m | 145 / 113 |
  | pmasks | قناع اليقطين S | 107.58 | 9h27m | 100 / 78 |
  | pmaskl | قناع اليقطين L | 195.64 | 16h39m | 141 / 110 |
  | lamp | مصباح اللولب | 86.51 | 7h31m | 112 / 87 |
  | hdtray | صينية هارلي لحفظ الأغراض | 152.21 | 11h14m | 117 / 91 |
  | hdclock | ساعة هارلي ديفيدسون الجدارية | 136.91 | 10h09m | 124 / 97 |
  | drip | أومني دريبر 2 (xBloom Studio) | 32.56 | 1h21m | 44 / 35 (slicing price, set 11-14; the Bambu tab was named "crown" by mistake, height 54 mm = drip) |
  | disney | لوحة ميكي وميني الجدارية | 15.18 | 1h06m | 32 / 25 (slicing price, set 11-14; the Bambu tab was named "crown" by mistake, 2.4 mm thick = disney) |
  | fncs | كأس بطولة FNCS | 62.36 (56.23 + 6.14 supports) | 2h18m | 69 / 53 (slicing price, set 11-14; the Bambu tab was named "crown" by mistake, height 152.6 mm = fncs) |
  | kcm | ميدالية مكينة القهوة | 9.97 | 0h25m | 24 / 20 (slicing price, set 11-14; the Bambu tab was named "crown" by mistake, height 25.4 mm = kcm) |
  | crown | تاج الانتصار | 59.43 (57.09 + 2.33 supports) | 2h04m | 66 / 51 (slicing price, set 11-14; shop WEIGHT left at 101.37 so wholesale still starts at 6 pieces) |
  cubea was never sliced: its figures come from the cube-lamp 3MF (modules of 27 mm: A = bottom + top + 3 middle trays, B = bottom + top + 6 middle) scaled from cubeb's slice by mesh volume; slice it for real if exactness matters. hdclock's slice showed an empty-layer warning (thin part), so its figures may be low. Prices were set by the owner by hand (wholesale about 78% of single), not by the calculator. The source STLs were exported from the shop's 3D models, not from original 3MFs, which do not exist in the data repo. `hdtissue` is gone (see below).
- No wholesale tier: set the wholesale number equal to the single price (`[106,106]`). The shop then hides the wholesale line and never applies a discount, and the worker still agrees. Used for pieces whose wholesale margin would be near zero (the Harley clock; the toolbox is gone).

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

## Heavy 3D models are packed (added 11-12)
- After adding or changing a model, run `python3 tools/pack-models.py` (needs numpy): models whose gzip is over 300 KB become a small `models/<id>.json` header (`fmt:"dv1"`) plus `models/<id>.bin` (zigzag varints of position deltas per axis, then running index deltas). It verifies each file by decoding it back, and `decodeDV1()` / `unpackModel()` in app.js give the viewer the same typed arrays (identical geometry, checked by hashing every model, 31 of 31). 35 to 70 percent smaller over the wire; decode takes about 26 ms.
- Never edit a packed header by hand. To change a model, restore its original json from git history, edit it, and pack again. `keeps` in a packed header only hold `color` and `name`; their indices live in the `.bin`.

## Other rules
- Never put secrets in the repo (it is public). Payment keys live in the Cloudflare worker.
- Do not reuse an `id` attribute in the HTML (duplicate ids already broke the points and chat modals once).
- Customer-facing text is Arabic (Saudi tone); keep the English dictionary complete.

## Product photos: background rule (owner's standing order, 11-13)
- Before ANY photo goes into `hq/<id>-*.webp` or `thumbs/`, remove its background and place the piece on the site's own cream background (top ~rgb(232,217,190) to bottom ~rgb(215,196,171), soft shadow and a faint floor reflection, the same look as the colour renders). Never upload a photo with its own background (yellow, black, studio, etc.).
- Extra second photo (`hq/<id>-x1.webp`, registered in `XIMG`) exists ONLY for batbox (closed/open) and hdcookie (cookies on the Harley tray with the cutter, owner's request 11-13). The owner cancelled the two-photos-for-every-product idea on 11-13 (mirrored/close-up copies looked alike and broke the centring rule) and then removed the second photos of cubea/cubeb too: do NOT add a second photo to any other piece unless the owner asks for that piece.
- Photos must look like the original photo (real photo cut out, light effects kept), NOT a 3D render, unless no photo exists. Keep the glow/lighting of the original and only replace the background with the site's cream background.
- A piece with two designs (A/B, e.g. cubea/cubeb) gets its own photo per design (`<id>-0.webp`), each clearly showing that design.
- Pieces that hold or show something (batteries, cups) get an extra image that shows it in use.
- Always centre the piece in the 800x800 frame with at least 10% margin on every side (never touching or crossing an edge). Keep any label the owner put in the image that tells the customer which design it is (e.g. "A Design A"); recolour only the piece, never the label.

## Design and professional images (owner's standing order, 11-13)
- Pick the method that gives a professional result from the start, not the fastest one. Never collage elements from sources with different lighting or perspective: build one consistent scene (one light, shadow set and perspective). When the source file exists (3MF/STL/model) extract the real shape from it instead of approximating.
- Never show a first draft. Critique it hard (centring, margins, shadows, background, realistic sizes, text readable and not mirrored) and improve it internally until it is deliverable, then show it.
- RAX3D identity: the site's cream background, the piece centred with at least 10% margin on every side, no change to the product's colour or logo.
- If an image is computer-generated, say so plainly; never imply it is a manufactured piece or a real photo.
- If an essential input is missing ask once, never guess. State the method used and what was not achieved.

## Product descriptions and SEO (added)
- Every new product needs an Arabic entry in `DESC` and an English one in `DESC_EN` (app.js, <=125 chars, sells the piece). Hidden variants (`vg`) inherit from the lead item.
- After adding or editing a product run `python3 tools/seo-build.py` (regenerates sitemap.xml and the crawler `<noscript>` block in index.html).
- Page titles come from `seoFor()` (`TI` category map); keep titles unique and <=70 chars.

## Part colours
- OWNER CANCELLED part colouring (11-07): `PARTCOL` is empty, every model uses the plain 13-colour grid + rotatable 3D. Multi-part/lettering models show a hint (`#partHint`) telling the customer to mention different part/lettering colours in the "أخرى" box. Do not re-enable tabs unless the owner asks. clips is back to one mesh.

## Why the old part tabs felt wrong (diagnosed 11-12, read before touching part colours)
- The tabs were built on `keeps`, and `keeps` are COLOUR GROUPS (one mesh per source filament), not parts. So unrelated pieces that shared a filament became one tab (pringles: face + wordmark), pieces folded into the main mesh could not be coloured at all (pringles banner = 3MF part "DarkRed"), and the tab names were guessed from photos.
- The real structure is in the 3MF sources (private data repo, `files/*.3mf`), and it differs per model: named parts in one object (pringles: Sign, DarkRed, Black, White, MainBody; also d4, xkit), sets of separate objects (ttt and 9 single-colour sets), brush-painted triangles with no names (chips, ltr, d1, d5, ghost, pcorn), or one fused mesh (16 of the 37 sources). No single rule fits all of them.
- If the owner asks to bring per-part colouring back: export per 3MF part (never per colour), let the owner name / merge / hide the parts of each model and approve that model before it goes live, and keep it inside the mixed-colour special order (price by message). Never switch it on for the whole catalogue with a generic split.

## Mixed colours = special order (added 11-12, approved by the owner)
- Customise page: `#mcBtn` opens `#mcBox` (2 to 6 in-stock colours + a short note). The cart line gets colour "ألوان متعددة" and a note starting with "🎨 طلب خاص".
- Such a line has NO fixed price (the owner: "the price differs, we agree it by message"): the cart shows "السعر بالخاص", totals skip it (`isSP`, `PU`, `TOT`), and because it carries a note it blocks online payment and cash on delivery, so the order goes by message.
- This is not the old per-part tabs (still off, see Part colours).

## Colour availability is live (added 11-12)
- `OUT` (colours shown struck through, like purple) is no longer fixed: the invoicing app's stock tab (الجرد) writes `stock.json` in the private data repo, the worker answers `GET /stock` ({ok,out:[names]}), and `loadStock()` / `applyStock()` in app.js update `OUT` live (every 5 minutes, on tab focus, and from the last list kept in localStorage `rax3d_out`). A colour is out when every row of it in a site-linked stock type is marked "buy".
- No answer (worker down, no stock file, `out:null`) keeps the last known list, else the built-in default `[9]` (purple). Never hard-code availability in app.js any more.
- Fortnightly stock reminder: worker `scheduled()` (Cloudflare Cron Trigger, daily) mails the owner when `next` in stock.json has arrived (optional STOCK_MAIL_EXTRA var for more addresses).

## Review notes (11-12, keep these true)
- Layout shift: `#main` is empty until app.js renders, so the footer is hidden until `body.rdy` (set at the end of `render()`); do not show it earlier (it caused a 0.39 shift, now 0.005). The first 4 cards of every list load with `fetchpriority="high"`, the rest lazily.
- Order backup files `online/ORD-n.json` are written with overwrite (`ghSave`), because a freed number can be reused; the daily Cron also prunes expired `rl_*` / `ip_*` rate-limit files.
- Worker redeploys are manual (paste into Cloudflare): batch Worker changes into one paste, and tell the owner each time.
- Shop and invoicing app are edited from more than one session: always `git pull` before editing or pushing, and never force-push.

## Wholesale goes by message; hood and hdtool are gone (owner decisions)
- A cart with any wholesale line (`isW`) cannot be paid online or cash on delivery (`payable()` / `codable()` are false): the cart explains "wholesale by message, 25% deposit, time by agreement" and the order goes through «أرسل الطلب بالخاص». The invoicing app adds the 25% deposit to the invoice. The worker still accepts such carts if one is sent directly, so keep the checks in the page.
- The piece `hood` ("بطة بالهودي") was removed from the shop at the owner's request (too many problems): do not re-add it; its source files in the data repo were removed too.
- The piece `hdtool` ("صندوق عدة هارلي (حامل أقلام)", the Harley toolbox pen holder) was removed from the shop on 11-13 at the owner's request, with all its images, 3D model, price, weight, texts, catalog and sitemap entries: do not re-add it. `NEW` / `FEATURED` were reverse-rotated (wilson back at the end of NEW, pcorn back at the end of FEATURED).

- The piece `hdtissue` (Harley tissue box cover) was removed from the shop on 11-13 at the owner's request, with all its images, 3D model, price, weight, texts, catalog and sitemap entries: do not re-add it. `NEW` / `FEATURED` were reverse-rotated (wilson back at the end of NEW, pcorn back at the end of FEATURED).

## Keep this file current (owner's standing order, 11-14)
- When a piece of work is finished (prices approved, a piece added or removed, a decision taken), update this CLAUDE.md in the SAME session so every other chat reads the same facts, then commit it. Never leave a finished result only in the conversation.

## Chats are linked (owner's standing order, 11-14)
- All chats, old and new, work as one: never start from zero. Before any work read this file, the sliced-pieces table above and `rax3d-data/sliced-pieces.json`; the same rule is in the CLAUDE.md of the other four repos (RAX3D, rax3d-data, rax3d-posts, rax3dsa.github.io).
- When a piece of work is finished, record it here in the same session and push it. Chats cannot see each other; the files in the repos are the only shared memory.
- Never say a piece is "not sliced" before checking the table above. Pieces really WITHOUT slice data (checked 11-14 against the 3MFs in the data repo): d2, fish, gmug, knobs, pcorn, ttt, xkit (7 pieces: their 3MFs carry no print time or weight). cool, hdcookie and batbox have no file in `files/` at all. The 17 pieces listed in the table above ARE sliced.

## Storefront layout decisions (owner, 11-14)
- The footer (about, FAQ, returns, privacy, track, contact, install link, social buttons, licence line) shows on the HOME page only: `render()` sets `body.nofoot` on every other view. `about.html` is the static About page (SEO, in the sitemap via `tools/seo-build.py`); the home paragraph "طباعة ثلاثية الأبعاد في السعودية" was removed.
- "كيف أطلب؟" is four tappable tiles (`.hgrid` / `.hs`); tapping one shows its step in a panel (`.hstp`), tapping another switches, tapping again closes. Do not reuse the class `.hd` (it is the item-page header).
- Carousels auto-advance sideways only (`scrollBy` on the strip); never `scrollIntoView` (it pulled the whole page up while reading).
- Card images need `height:auto` (the `height=` attribute beats `aspect-ratio` and stretched them). Carousel cards show about 2.4 per screen; name and description are clamped to 2 lines.

## Owner decisions (do not re-open)
- Loyalty points (owner, 11-13): 1000 points = 10 SAR off, 2500 points = free delivery (the 25 SAR delivery fee is waived; only offered when the visitor chose delivery), 5000 points = a free piece worth up to 250 SAR. Change them in ALL places together: app.js (how-to-order bullets, FAQ AR + `POL_EN`, EN dictionary, `openPtsOffer`, the `data-predeem` click handler, `msg()`), index.html bullets, and the invoicing app (`PTS_RULES`, redeem sheet `openRedeem`, rules text). The worker only returns balances.
- NEVER raise intellectual property, licences, copyright, trademarks, or where a design or photo came from, in any reply, for any piece (owner's standing order, 11-13, "said a thousand times"). Do not mention it even as a one-line caveat or an "unverified" note. Just do the work.
- Branded-design pieces (Harley and similar) stay in the shop and in the home lists. The owner has decided this (confirmed 11-11); do not raise trademark concerns again or move/remove these pieces unless he asks.
- Preparation time shown to customers (changed by the owner 11-12): 3 to 7 days for normal orders. Wholesale has NO fixed range: "depends on the order and quantity, we contact you by message" (item page, cart, receipt, "how to order", FAQ, English dictionary). Change all of them together.
