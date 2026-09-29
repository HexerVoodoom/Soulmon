#!/usr/bin/env python3
"""Gera as 11 formas do Corvinho (recolor programatico do mascote proprio).
Entrada: src/assets/soulmon/mascot-raven.png  Saida: src/assets/soulmon/corvo/corvo-<id>.png (+ -256).
Sem IA de terceiros, sem numpy: PIL + colorsys, determinístico (sem aleatoriedade).
Bandas recoloridas por máscara de matiz com rampas suaves (alfa e bordas preservados):
  corpo/cartola  = matiz 195-265 (azul-marinho, s>0.12)
  chama          = matiz 135-200 e v>0.4 (turquesa)
Intocados nas formas coloridas: bico/máscara off-white, olho âmbar, correntes douradas, cinza da faixa/patas.
"""
import colorsys, os, sys
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src/assets/soulmon/mascot-raven.png')
OUT = os.path.join(ROOT, 'src/assets/soulmon/corvo')
ORDER = ['rookie','champion-power','champion-harmony','champion-benevolence','ultimate-power','ultimate-harmony',
         'ultimate-benevolence','mega-power','mega-harmony','mega-benevolence','ultra']
# Matiz-alvo (graus): corpo, chama
PATH = {'power': (8, 32), 'harmony': (112, 78), 'benevolence': (214, 192)}
# Intensidade por estágio: sk=x saturação, vk/va=brilho corpo, fs/fv/fa=saturação/brilho da chama
STAGE = {
 'champion': dict(sk=0.65, vk=0.85, va=0.0, fs=1.0, fv=1.0,  fa=0.0),
 'ultimate': dict(sk=1.00, vk=1.30, va=0.04, fs=1.1, fv=1.1,  fa=0.05),
 'mega':     dict(sk=1.20, vk=1.60, va=0.10, fs=1.2, fv=1.25, fa=0.12),
}
# ajuste de luminância por caminho (separa em cinza): poder escuro, harmonia médio, benevolência claro
PATH_V = {'power': 0.70, 'harmony': 0.95, 'benevolence': 1.38}

# ajuste fino por forma (multiplica o brilho do corpo) para separar luminância entre formas
FORM_V = {'champion-harmony': 1.10, 'mega-power': 1.22}

def ss(x, a, b):
    if b == a: return 1.0 if x >= b else 0.0
    t = min(1.0, max(0.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
def clamp(x): return 0.0 if x < 0 else 1.0 if x > 1 else x

def weights(h, s, v):
    hue = ss(h, 130, 145) * (1 - ss(h, 200, 208))          # janela teal (135-200)
    body = ss(h, 188, 198) * (1 - ss(h, 262, 272))          # janela azul (195-265)
    tealw = ss(h, 130, 145) * (1 - ss(h, 190, 198))
    sg = ss(s, 0.10, 0.20)
    wv = ss(v, 0.35, 0.50)
    wf = tealw * wv * sg
    wb = min(1.0, (body + tealw * (1 - wv)) * sg)
    wb = min(wb, 1 - wf) if wf > 0 else wb
    return wb, wf

def lum(r, g, b): return 0.299 * r + 0.587 * g + 0.114 * b

def recolor(px, form):
    r, g, b = px
    h, s, v = colorsys.rgb_to_hsv(r, g, b); h *= 360
    wb, wf = weights(h, s, v)
    if form == 'ultra':
        L = lum(r, g, b)
        c = clamp(0.5 + (L - 0.45) * 2.2)
        if wf > 0: c = c * (1 - wf) + (0.86 + 0.14 * L) * wf
        return (c, c, c)
    stage, path = form.split('-')
    P = STAGE[stage]; ht, hf = PATH[path]; pv = PATH_V[path]
    out = (r, g, b)
    if wb > 0:
        nh = (ht + (h - 215) * 0.25) % 360
        ns = clamp(s * P['sk']); nv = clamp(v * P['vk'] * pv * FORM_V.get(form, 1.0) + P['va'])
        out = tuple(o * (1 - wb) + n * wb for o, n in zip(out, colorsys.hsv_to_rgb(nh / 360, ns, nv)))
    if wf > 0:
        nh = (hf + (h - 180) * 0.5) % 360
        ns = clamp(s * P['fs']); nv = clamp(v * P['fv'] + P['fa'])
        out = tuple(o * (1 - wf) + n * wf for o, n in zip(out, colorsys.hsv_to_rgb(nh / 360, ns, nv)))
    return out

def main():
    src = Image.open(SRC).convert('RGBA'); os.makedirs(OUT, exist_ok=True)
    data = list(src.getdata())
    for form in ORDER:
        dst = os.path.join(OUT, f'corvo-{form}.png')
        if form == 'rookie':
            with open(SRC, 'rb') as f, open(dst, 'wb') as g: g.write(f.read())   # original byte a byte
            im = src
        else:
            cache = {}; px = []
            for r, g, b, a in data:
                if a == 0: px.append((r, g, b, 0)); continue
                k = (r, g, b)
                if k not in cache:
                    o = recolor((r / 255, g / 255, b / 255), form)
                    cache[k] = tuple(int(round(c * 255)) for c in o)
                px.append(cache[k] + (a,))
            im = Image.new('RGBA', src.size); im.putdata(px); im.save(dst, optimize=True)
        # 256: LANCZOS (mascote tem bordas suavizadas, nao e grade estrita de pixel)
        im.resize((256, 256), Image.LANCZOS).save(os.path.join(OUT, f'corvo-{form}-256.png'), optimize=True)
        print('ok', form)
if __name__ == '__main__': main()
