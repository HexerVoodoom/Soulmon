#!/usr/bin/env python3
"""W13 (20/10/2026): progressao de cores do humor (dono: "os 3 do meio se parecem muito").

Fonte = SEMPRE os originais (L6/final, 128x128, alfa real); saida = src/assets/icons/mood/mood-N-*.png.
Idempotente: rodar duas vezes grava bytes identicos. So o PREENCHIMENTO do corpo muda (matiz/saturacao/brilho);
o contorno escuro, os brancos (olhos/brilhos) e o alfa ficam; nuvem, folha, faiscas e gotas (componentes
separados do corpo) ficam como no original.

  python tools/mood-tint.py            # gera os 5 PNG
  python tools/mood-tint.py previa     # + w13-humor.png (40 px e 32 px, claro e escuro)
"""
import sys, colorsys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parent.parent
SRC = Path('D:/Soulmon/_gemini_out/w5-arte-20261019/L6/final')
DST = REPO / 'src/assets/icons/mood'
OUT = Path('D:/Soulmon/_gemini_out/w5-arte-20261019/previas')
NAMES = ['1-rough', '2-low', '3-okay', '4-good', '5-great']
# (matiz 0..1, fator de saturacao, saturacao minima, brilho-alvo do p90 do preenchimento)
TINT = {
    '1-rough': (0.94, 1.9, 0.50, 0.74),   # vermelho-arroxeado frio e escuro
    '2-low':   (0.075, 1.2, 0.72, 0.98),  # laranja
    '3-okay':  (0.155, 1.1, 0.72, 1.00),  # amarelo
    '4-good':  (0.27, 1.0, 0.62, 0.92),   # verde-lima
    '5-great': (0.47, 1.0, 0.68, 0.98),   # verde-turquesa brilhante (faiscas seguem douradas)
}


def components(mask):
    h, w = mask.shape
    lab = np.zeros((h, w), int)
    n = 0
    for y in range(h):
        for x in range(w):
            if mask[y, x] and not lab[y, x]:
                n += 1
                st = [(y, x)]
                lab[y, x] = n
                while st:
                    cy, cx = st.pop()
                    for dy in (-1, 0, 1):
                        for dx in (-1, 0, 1):
                            ny, nx = cy + dy, cx + dx
                            if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not lab[ny, nx]:
                                lab[ny, nx] = n
                                st.append((ny, nx))
    return lab, n


def smooth(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def tint(name):
    im = Image.open(SRC / f'mood-{name}.png').convert('RGBA')
    a = np.asarray(im).astype(np.float64)
    rgb = a[..., :3] / 255
    alpha = a[..., 3]
    lab, n = components(alpha > 20)
    sizes = [(lab == i).sum() for i in range(1, n + 1)]
    body = (lab == (1 + int(np.argmax(sizes))))
    hue, sf, smin, vf = TINT[name]
    mx, mn = rgb.max(-1), rgb.min(-1)
    v = mx
    s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-9), 0)
    # peso de "preenchimento": colorido e nao escuro (contorno/olhos escuros e brancos ficam)
    wgt = smooth(s, 0.10, 0.24) * smooth(v, 0.22, 0.36) * body
    ns = np.clip(np.maximum(s * sf, smin * np.clip(s / 0.5, 0.6, 1.0)), 0, 1)
    fill = wgt > 0.5
    nv = np.clip(v * (vf / max(np.percentile(v[fill], 90), 1e-6)), 0, 1)
    out = rgb.copy()
    import colorsys
    flat = np.array([colorsys.hsv_to_rgb(hue, ns.flat[i], nv.flat[i]) for i in range(ns.size)]).reshape(rgb.shape)
    out = rgb * (1 - wgt[..., None]) + flat * wgt[..., None]
    res = np.dstack([np.round(out * 255), alpha]).clip(0, 255).astype(np.uint8)
    return Image.fromarray(res, 'RGBA')


def main():
    for n in NAMES:
        tint(n).save(DST / f'mood-{n}.png', optimize=True)
    print('ok', DST)
    if len(sys.argv) > 1 and sys.argv[1] == 'previa':
        previa()


def previa():
    f = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', 11)
    labels = ['Mal', 'Baixo', 'Normal', 'Bom', 'Ótimo']
    rows = []
    for bgc, fg in (((250, 250, 250), (30, 30, 30)), ((24, 24, 28), (235, 235, 235))):
        for sz in (40, 32):
            rows.append((bgc, fg, sz))
    W, H = 5 * 90 + 20, len(rows) * 80 + 20
    sheet = Image.new('RGB', (W, H), (128, 128, 128))
    d = ImageDraw.Draw(sheet)
    y = 10
    for bgc, fg, sz in rows:
        d.rectangle([5, y - 4, W - 5, y + 72], fill=bgc)
        for i, n in enumerate(NAMES):
            im = Image.open(DST / f'mood-{n}.png').convert('RGBA').resize((sz, sz), Image.LANCZOS)
            x = 20 + i * 90 + (90 - sz) // 2 - 10
            layer = Image.new('RGBA', sheet.size, (0, 0, 0, 0))
            layer.paste(im, (x, y))
            base = sheet.convert('RGBA')
            base.alpha_composite(layer)
            sheet.paste(base.convert('RGB'))
            d = ImageDraw.Draw(sheet)
            tw = d.textlength(labels[i], font=f)
            d.text((x + sz / 2 - tw / 2, y + sz + 3), labels[i], fill=fg, font=f)
        y += 80
    sheet = sheet.resize((W * 2, H * 2), Image.NEAREST)
    OUT.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT / 'w13-humor.png')
    print('previa', OUT / 'w13-humor.png')


if __name__ == '__main__':
    main()
