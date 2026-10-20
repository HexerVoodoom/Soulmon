#!/usr/bin/env python3
"""20/10/2026: os 5 icones de HUMOR sao a arte enviada pelo dono (gotas em pixel art: cinza-chuva -> azul-triste ->
verde-agua neutro -> ciano feliz -> dourado com brilhos). SUBSTITUI o tingimento da W13 (`tools/mood-tint.py`).

Fonte = SEMPRE o original do dono (tira 1280x371, RGBA, alfa real); saida = src/assets/icons/mood/mood-N-*.png (128x128).
Idempotente (rodar 2x grava bytes identicos): fatia por projecao de colunas de alfa, mesma escala nos 5 (a nuvem do
'rough' define o lado comum), centralizados, ~4% de margem.

  python tools/mood-dono.py [caminho/emotions-original.png]
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image

REPO = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('D:/Soulmon/_gemini_out/w13-humor-dono/emotions-original.png')
DST = REPO / 'src/assets/icons/mood'
NAMES = ['mood-1-rough', 'mood-2-low', 'mood-3-okay', 'mood-4-good', 'mood-5-great']

im = Image.open(SRC).convert('RGBA')
a = np.array(im)[:, :, 3]
cols = (a > 8).any(axis=0)
runs, s = [], None
for x, v in enumerate(cols):
    if v and s is None: s = x
    if not v and s is not None: runs.append([s, x - 1]); s = None
if s is not None: runs.append([s, len(cols) - 1])
merged = [runs[0]]
for r in runs[1:]:
    if r[0] - merged[-1][1] < 24: merged[-1][1] = r[1]
    else: merged.append(r)
assert len(merged) == 5, f'esperava 5 icones, achei {len(merged)}'
boxes = []
for x0, x1 in merged:
    ys = np.where((a[:, x0:x1 + 1] > 8).any(axis=1))[0]
    boxes.append((int(x0), int(ys[0]), int(x1) + 1, int(ys[-1]) + 1))
side = max(max(b[2] - b[0], b[3] - b[1]) for b in boxes)
for n, b in zip(NAMES, boxes):
    tile = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    crop = im.crop(b)
    tile.alpha_composite(crop, ((side - crop.width) // 2, (side - crop.height) // 2))
    pad = int(side * 0.04)
    big = Image.new('RGBA', (side + 2 * pad, side + 2 * pad), (0, 0, 0, 0))
    big.alpha_composite(tile, (pad, pad))
    big.resize((128, 128), Image.LANCZOS).save(DST / f'{n}.png', optimize=False)
print('ok', side)
