#!/usr/bin/env python3
"""Conferência das 11 formas do Corvinho + folha de contato. Sai 1 se algo reprova."""
import colorsys, os, sys, itertools
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, 'src/assets/soulmon/corvo')
SRC = os.path.join(ROOT, 'src/assets/soulmon/mascot-raven.png')
REV = os.path.join(ROOT, 'docs/reviews/admin-corvo')
ORDER = ['rookie','champion-virus','champion-data','champion-vaccine','ultimate-virus','ultimate-data',
         'ultimate-vaccine','mega-virus','mega-data','mega-vaccine','ultra']
fail = []
def chk(ok, msg):
    print(('OK   ' if ok else 'FALHA ') + msg)
    if not ok: fail.append(msg)
src = Image.open(SRC).convert('RGBA'); sa = src.getchannel('A')
files = [f for f in os.listdir(D) if f.endswith('.png') and not f.endswith('-256.png')]
chk(len(files) == 11, f'11 arquivos 512 ({len(files)})')
chk(len([f for f in os.listdir(D) if f.endswith('-256.png')]) == 11, '11 arquivos 256')
chk(open(os.path.join(D, 'corvo-rookie.png'), 'rb').read() == open(SRC, 'rb').read(), 'rookie == mascote byte a byte')
lums = {}; ims = {}
for f in ORDER:
    im = Image.open(os.path.join(D, f'corvo-{f}.png')); ims[f] = im
    chk(im.size == (512, 512) and im.mode == 'RGBA', f'{f}: 512x512 RGBA')
    a = im.getchannel('A')
    chk(all(a.getpixel(p) == 0 for p in [(0,0),(511,0),(0,511),(511,511)]), f'{f}: cantos transparentes')
    chk(list(a.getdata()) == list(sa.getdata()), f'{f}: alfa identico ao original')
    bad = 0; tot = 0; ls = 0
    for r, g, b, al in im.getdata():
        if al == 0: continue
        tot += 1; ls += 0.299*r + 0.587*g + 0.114*b
        h, s, v = colorsys.rgb_to_hsv(r/255, g/255, b/255)
        if 270 <= h*360 <= 340 and s > 0.20 and v > 0.15: bad += 1
    chk(bad == 0, f'{f}: pixels saturados 270-340 graus = {bad}')
    lums[f] = ls / tot
print('luminancia media (0-255):', {k: round(v, 1) for k, v in lums.items()})
mind = min(abs(lums[a]-lums[b]) for a, b in itertools.combinations(ORDER, 2))
chk(mind >= 1.5, f'luminancia distinta por forma (menor diferenca {mind:.1f} >= 1.5)')
# folha de contato
os.makedirs(REV, exist_ok=True)
try: font = ImageFont.load_default(size=14)
except TypeError: font = ImageFont.load_default()
BG = (7, 20, 19); cell = 240; cols = 4
rows_c = 3; gs = 110
W = cols*cell; H = rows_c*(cell+22) + 30 + gs + 40
sheet = Image.new('RGB', (W, H), BG); dr = ImageDraw.Draw(sheet)
for i, f in enumerate(ORDER):
    x, y = (i % cols)*cell, (i//cols)*(cell+22)
    t = ims[f].resize((cell-8, cell-8), Image.LANCZOS)
    sheet.paste(t, (x+4, y+18), t); dr.text((x+8, y+2), f, fill=(230, 200, 120), font=font)
y0 = rows_c*(cell+22)+8
dr.text((8, y0), 'escala de cinza (mesma ordem)', fill=(160, 220, 220), font=font)
gw = W//11
for i, f in enumerate(ORDER):
    t = ims[f].resize((gw-4, gw-4), Image.LANCZOS)
    tile = Image.new('RGB', t.size, BG); tile.paste(t, (0, 0), t)
    sheet.paste(tile.convert('L').convert('RGB'), (i*gw+2, y0+20))
    dr.text((i*gw+3, y0+22+gw), str(i+1), fill=(200, 200, 200), font=font)
sheet.save(os.path.join(REV, 'folha-de-contato.png'))
print('folha:', os.path.join(REV, 'folha-de-contato.png'))
sys.exit(1 if fail else 0)
