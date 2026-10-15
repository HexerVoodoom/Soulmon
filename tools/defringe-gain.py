"""Defringe determinístico dos ícones `fx/gain-*.png`: remove a franja clara (pixels brancos soltos/serrilhados) do contorno.
Regra (idempotente): alfa vira binário (>=128 opaco). Pixel opaco de BORDA (algum vizinho-4 transparente) com luminância
>170 cuja vizinhança opaca (8) é bem mais escura (mediana + 60) é recolorido com a mediana RGB dos vizinhos escuros
(decontaminação pela cor do interior); se tem <2 vizinhos opacos (ilha/poeira) é apagado. Sparkles/realces claros
(vizinhança também clara) não são tocados. Uso: python tools/defringe-gain.py gain-chest gain-confetti ..."""
import sys
from pathlib import Path
import numpy as np
from PIL import Image

D = Path(__file__).resolve().parent.parent / 'src/assets/soulmon/fx'
LUZ, SALTO = 170, 60


def lum(c):
    return c[..., 0] * .299 + c[..., 1] * .587 + c[..., 2] * .114


def passo(a):
    al = a[..., 3] >= 128
    a = a.copy()
    a[..., 3] = np.where(al, 255, 0)
    a[~al, :3] = 0
    h, w = al.shape
    L = lum(a[..., :3].astype(float))
    p = np.pad(al, 1)
    edge = al & ~(p[:-2, 1:-1] & p[2:, 1:-1] & p[1:-1, :-2] & p[1:-1, 2:])
    n = 0
    for y, x in zip(*np.nonzero(edge & (L > LUZ))):
        viz = [(y + dy, x + dx) for dy in (-1, 0, 1) for dx in (-1, 0, 1)
               if (dy or dx) and 0 <= y + dy < h and 0 <= x + dx < w and al[y + dy, x + dx]]
        if len(viz) < 2:
            a[y, x] = 0
            n += 1
            continue
        ls = np.array([L[v] for v in viz])
        if np.median(ls) + SALTO < L[y, x]:
            esc = [v for v in viz if L[v] <= np.median(ls)]
            a[y, x, :3] = np.median(np.array([a[v][:3] for v in esc]), axis=0).astype(np.uint8)
            n += 1
    return a, n


for nome in sys.argv[1:]:
    f = D / f'{nome}.png'
    a = np.array(Image.open(f).convert('RGBA'))
    for _ in range(3):  # 3 passadas: franja de 2-3px sai de fora pra dentro
        a, n = passo(a)
    print(nome, 'ultima passada tocou', n)
    Image.fromarray(a, 'RGBA').save(f, optimize=True)
