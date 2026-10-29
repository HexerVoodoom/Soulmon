"""Regera as peças de src/assets/soulmon/fx-ataque/ que foram serradas pelo fatiador de grade fixa 3x2.
Causa (29/10/2026): slice_fase2.py cortava a folha em 3 colunas iguais; orb/cast/slash que cruzam a divisa
saíam com corte reto. Aqui a fatia é por COMPONENTE CONEXO (dilatado), atribuído à célula pelo centroide.
Fonte: SEMPRE a folha ORIGINAL em E:/Soulmon-assets (nunca o PNG canônico nem backup dele). Idempotente.
Convenção de saída (medida nas peças íntegras): maior lado = 118 px, centrada em tela 128x128, LANCZOS,
alfa normalizado (<=24 -> 0, >=232 -> 255).
Uso: python tools/regerar-fx-cortados.py [--lista arq.txt] [id-estado.png ...]   (sem args: lê PENDENTE do teste)"""
import os, re, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DST = os.path.join(ROOT, 'src/assets/soulmon/fx-ataque')
RAWS = ['E:/Soulmon-assets/beta3-geradas/elementos-novos/_raw/fx-{id}.png',
        'E:/Soulmon-assets/beta3-geradas/fase2-ataques/_raw/{id}.png']
NAMES = ['orb', 'slash', 'impact', 'cast', 'aura', 'defended']
FIT = 118

def raw_for(i):
    for t in RAWS:
        p = t.format(id=i)
        if os.path.exists(p): return p
    return None

def pieces(img):
    a = np.array(img.getchannel('A'))
    h, w = a.shape
    m = a > 24
    lab, n = ndi.label(ndi.binary_dilation(m, iterations=7))
    cells = {}
    cw, ch = w / 3, h / 2
    for k in range(1, n + 1):
        ys, xs = np.nonzero((lab == k) & m)
        if len(xs) < 40: continue
        w_ = a[ys, xs].astype(float)
        cx, cy = (xs * w_).sum() / w_.sum(), (ys * w_).sum() / w_.sum()
        cells.setdefault(min(5, int(cy // ch) * 3 + min(2, int(cx // cw))), []).append(k)
    out = {}
    for c, ks in cells.items():
        sel = np.isin(lab, ks) & ndi.binary_dilation(m, iterations=2)
        arr = np.array(img).copy()
        arr[~sel] = 0
        out[c] = Image.fromarray(arr, 'RGBA')
    return out

def finish(p):
    p = p.crop(p.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox())
    s = FIT / max(p.size)
    p = p.resize((max(1, round(p.width * s)), max(1, round(p.height * s))), Image.LANCZOS)
    r, g, b, al = p.split()
    al = al.point(lambda v: 0 if v <= 24 else (255 if v >= 232 else v))
    p = Image.merge('RGBA', (r, g, b, al))
    t = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
    t.paste(p, ((128 - p.width) // 2, (128 - p.height) // 2), p)
    return t

def main(files):
    by = {}
    for f in files:
        m = re.match(r'fx-(.+)-(orb|slash|impact|cast|aura|defended)\.png$', f)
        by.setdefault(m.group(1), []).append(m.group(2))
    for i, ks in sorted(by.items()):
        rp = raw_for(i)
        if not rp: print('SEM FOLHA', i); continue
        ps = pieces(Image.open(rp).convert('RGBA'))
        for k in ks:
            idx = NAMES.index(k)
            if idx not in ps: print('FALTA', i, k); continue
            out = finish(ps[idx])
            out.save(os.path.join(DST, f'fx-{i}-{k}.png'))
            if k == 'aura':
                out.resize((96, 96), Image.LANCZOS).save(os.path.join(DST, f'fx-{i}-aura-96.png'))
            print('ok', i, k)

if __name__ == '__main__':
    a = sys.argv[1:]
    if not a:
        src = open(os.path.join(ROOT, 'src/utils/fxAtaqueBordas.contract.test.ts'), encoding='utf8').read()
        a = re.findall(r"^  '(fx-[^']+\.png)',", src, re.M)
    main(a)
