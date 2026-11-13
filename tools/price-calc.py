#!/usr/bin/env python3
"""Price calculator = the invoicing app's calculator (rax3dsa.github.io, calcItem): same formulas, same rounding.
    python3 tools/price-calc.py <grams> <hours> [acc]          e.g.  python3 tools/price-calc.py 14.27 0.92
    acc = extra parts per piece (LED set, clock movement...), added at cost with no multiplier.
    python3 tools/price-calc.py 14.27 0.92 --settings path/to/shared.json   (reads /settings live; the default below is the live value of 11-13)
Prints cost, the app's suggested single/set price, the online shop price (gateway fee covered), net profit and Rule 3 checks."""
import json, math, sys
S = dict(spool=115, spoolW=1000, run=1.15, waste=0.2, pack=3, multSet=3.5, multOne=4.5, payFee=3.2, payFix=1.2)
a = [x for x in sys.argv[1:] if not x.startswith('--')]
if '--settings' in sys.argv:
    d = json.load(open(sys.argv[sys.argv.index('--settings') + 1]))
    S.update({k: v for k, v in (d.get('settings', d)).items() if k in S})
if len(a) < 2: sys.exit(__doc__)
w, h = float(a[0]), float(a[1]); acc = float(a[2]) if len(a) > 2 else 0.0
R2 = lambda x: round(x + 1e-12, 2)
ceil = lambda x: math.ceil(x - 1e-9)
base = w * S['spool'] / S['spoolW'] * (1 + S['waste']) + h * S['run'] + S['pack']
cost = base + acc
sugg_one = ceil(R2(base * S['multOne'] + acc)); sugg_set = ceil(R2(base * S['multSet'] + acc))
shop = lambda p: ceil((p + S['payFix']) / (1 - S['payFee'] / 100))
net = lambda p: p - (p * S['payFee'] / 100 + S['payFix']) - cost
one, whole = shop(sugg_one), shop(sugg_set)
print(f'cost {cost:.2f}  (material+waste {w*S["spool"]/S["spoolW"]*(1+S["waste"]):.2f}, machine {h*S["run"]:.2f}, packaging {S["pack"]:.2f}, extras {acc:.2f})')
print(f'single:    suggested {sugg_one}  ->  shop price {one}   net profit {net(one):.2f} ({net(one)/one*100:.0f}%)')
print(f'wholesale: suggested {sugg_set}  ->  shop price {whole}   net profit {net(whole):.2f} ({net(whole)/whole*100:.0f}%)')
if net(whole) <= 0: print('RULE 3: wholesale loses money -> set wholesale = single', [one, one])
elif net(whole) < 0.10 * whole: print('RULE 3 warning: wholesale net under 10% of the wholesale price; keep but warn the owner')
else: print('RULE 3 ok: wholesale net is healthy ->', [one, whole])
