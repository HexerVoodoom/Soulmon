#!/usr/bin/env python3
"""Gera src/utils/elementPaleta.data.ts: a PALETA (até 4 cores dominantes + peso) de cada
src/assets/soulmon/elementos/el-*.png, em CIELAB. Camada da RODADA 1 do REGISTRO §402: a cor média e a
dominante (element-visual.py / element-dominante.py) erram ícone multicolorido de paleta parecida; a
paleta inteira é o que `utils/match3Cores.ts` compara (chamfer ponderado de CIEDE2000) e simula em
daltonismo.   python scripts/element-paleta.py
k-means (k=4, semente fixa, determinístico) nos pixels opacos sem quase-preto/quase-branco (mesmos pixels do
element-dominante.py); grupos com menos de PESO_MIN do peso saem; saída: [L, a, b, peso em %]."""
import glob, os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
SRC = os.path.join(ROOT, 'src/assets/soulmon/elementos')
OUT = os.path.join(ROOT, 'src/utils/elementPaleta.data.ts')
K, AMOSTRA, PESO_MIN = 4, 4000, 0.06

def srgb_to_lab(rgb):
    c = rgb / 255.0
    c = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    M = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750], [0.0193339, 0.1191920, 0.9503041]])
    xyz = c @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 216 / 24389, np.cbrt(xyz), (24389 / 27 * xyz + 16) / 116)
    return np.stack([116 * f[:, 1] - 16, 500 * (f[:, 0] - f[:, 1]), 200 * (f[:, 1] - f[:, 2])], axis=1)

def kmeans(X, w, k=K, it=20):
    # inicialização por farthest-first a partir do pixel mais pesado: determinística e separa bem as cores
    C = [X[int(np.argmax(w))]]
    for _ in range(k - 1):
        d = np.min([((X - c) ** 2).sum(1) for c in C], axis=0)
        C.append(X[int(np.argmax(d))])
    C = np.array(C, dtype=float)
    for _ in range(it):
        a = ((X[:, None, :] - C[None]) ** 2).sum(2).argmin(1)
        for j in range(k):
            m = a == j
            if m.any(): C[j] = (X[m] * w[m, None]).sum(0) / w[m].sum()
    a = ((X[:, None, :] - C[None]) ** 2).sum(2).argmin(1)
    return C, np.array([w[a == j].sum() for j in range(k)])

def paleta(path):
    im = np.asarray(Image.open(path).convert('RGBA')).astype(float)
    rgb, al = im[..., :3].reshape(-1, 3), im[..., 3].reshape(-1)
    opaque = al >= 128
    keep = opaque & (rgb.max(1) >= 40) & (rgb.min(1) <= 235)
    if keep.sum() < 20: keep = opaque
    if keep.sum() == 0: return [[0, 0, 0, 100]]
    lab, w = srgb_to_lab(rgb[keep]), al[keep]
    s = np.random.RandomState(1).choice(len(lab), min(len(lab), AMOSTRA), replace=False)
    C, W = kmeans(lab[s], w[s])
    W = W / W.sum()
    ordem = np.argsort(-W)
    out = [[round(float(C[j][0])), round(float(C[j][1])), round(float(C[j][2])), round(float(W[j]) * 100)] for j in ordem if W[j] >= PESO_MIN]
    return out or [[round(float(C[ordem[0]][0])), round(float(C[ordem[0]][1])), round(float(C[ordem[0]][2])), 100]]

def main():
    rows = [(os.path.basename(p)[3:-4], paleta(p)) for p in sorted(glob.glob(os.path.join(SRC, 'el-*.png')))]
    lines = ["// GERADO por scripts/element-paleta.py - nao edite a mao. Rode o script quando entrar ícone novo.",
             "// Paleta de cada ícone de elemento: até 4 cores dominantes [L, a, b (CIELAB), peso em %], da mais pesada para a mais leve.",
             "export const ELEMENT_PALETA: Readonly<Record<string, ReadonlyArray<readonly [number, number, number, number]>>> = {"]
    for i, p in rows: lines.append(f"  {i}: [{', '.join('[' + ','.join(str(x) for x in c) + ']' for c in p)}],")
    lines.append("};")
    open(OUT, 'w', newline='\n', encoding='utf-8').write('\n'.join(lines) + '\n')
    print(len(rows), 'ícones ->', OUT)
main()
