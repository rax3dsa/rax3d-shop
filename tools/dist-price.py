#!/usr/bin/env python3
"""Distribution (bulk giveaway) price calculator, owner's standing order 11-13. Not the normal wholesale tier.
    python3 tools/dist-price.py <grams> [hours] [--pack 0.5] [--qty N] [--printers P]
Unit cost = grams x 0.115 x 1.2 + hours x 1.15 + bulk packaging (0.5). If hours is missing it is ESTIMATED as 0.25 + 0.042 x grams (from the owner's own files): say so.
Unit price = ((cost + 1.2 / qty) / (0.968 - target net margin)) rounded UP to 0.05 SAR. Target net margin after gateway fees: 50 pcs 40%, 100 pcs 37%, 500 pcs 33%, 1000 pcs 30%.
Minimum order 50 pieces. Add a 5% failure allowance for hard prints."""
import math, sys
a = sys.argv[1:]
def opt(name, default):
    if name in a:
        i = a.index(name); v = a[i + 1]; del a[i:i + 2]; return float(v)
    return default
pack = opt('--pack', 0.5); qty = int(opt('--qty', 0)); printers = int(opt('--printers', 1))
if not a: sys.exit(__doc__)
g = float(a[0]); est = len(a) < 2; h = float(a[1]) if not est else 0.25 + 0.042 * g
SPOOL, WASTE, RUN, FEE, FIX = 0.115, 0.2, 1.15, 0.032, 1.2
TIERS = [(50, 0.40), (100, 0.37), (500, 0.33), (1000, 0.30)]
cost = g * SPOOL * (1 + WASTE) + h * RUN + pack
price = lambda q, m: math.ceil(((cost + FIX / q) / (1 - FEE - m)) / 0.05 - 1e-9) * 0.05
net = lambda p, q: p - (p * FEE + FIX / q) - cost
print(f'unit cost {cost:.2f}  (material+waste {g*SPOOL*(1+WASTE):.2f}, machine {h*RUN:.2f}{" ESTIMATED time "+str(round(h*60))+" min" if est else ""}, packaging {pack:.2f})')
for q, m in TIERS:
    p = price(q, m); print(f'{q:>5} pcs: {p:.2f} per piece  total {p*q:,.0f}  net/piece {net(p,q):.2f} ({net(p,q)/p*100:.0f}%)  print time {q*h/printers:.0f} h' + (f' = {q*h/printers/24:.1f} days on {printers} printer(s)' if printers else ''))
if qty:
    if qty < 50: print('below the 50 piece minimum: do not quote')
    else:
        m = [t for t in TIERS if t[0] <= qty][-1][1]; p = price(qty, m); print(f'QUOTE {qty} pcs: {p:.2f} per piece, total {p*qty:,.2f}, net {net(p,qty)*qty:,.2f} ({net(p,qty)/p*100:.0f}%)')
