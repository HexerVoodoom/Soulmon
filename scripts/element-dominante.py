#!/usr/bin/env python3
"""Gera src/utils/elementDominante.data.ts: a COR DOMINANTE [L,a,b] (CIELAB) de cada
src/assets/soulmon/elementos/el-*.png. Complementa `elementVisual.data.ts` (cor MEDIA): o par de
numeros e o que `utils/match3Cores.ts` usa para decidir se dois ícones se confundem no Match-3.
  python scripts/element-dominante.py
Dominante = o maior de 3 grupos (k-means em Lab, deterministico) com croma >= 12; sem grupo
cromatico, o maior grupo. Mesmos pixels do element-visual.py (opacos, sem quase-preto/quase-branco)."""
import glob, os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
SRC = os.path.join(ROOT, 'src/assets/soulmon/elementos')
OUT = os.path.join(ROOT, 'src/utils/elementDominante.data.ts')
CHROMA_MIN, K, AMOSTRA = 12.0, 3, 3000

def srgb_to_lab(rgb):
    c = rgb / 255.0
    c = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    M = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750], [0.0193339, 0.1191920, 0.9503041]])
    xyz = c @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 216 / 24389, np.cbrt(xyz), (24389 / 27 * xyz + 16) / 116)
    return np.stack([116 * f[:, 1] - 16, 500 * (f[:, 0] - f[:, 1]), 200 * (f[:, 1] - f[:, 2])], axis=1)

def kmeans(X, w, k=K, it=15):
    C = X[np.linspace(0, len(X) - 1, k).astype(int)].copy()
    for _ in range(it):
        a = ((X[:, None, :] - C[None]) ** 2).sum(2).argmin(1)
        for j in range(k):
            m = a == j
            if m.any(): C[j] = (X[m] * w[m, None]).sum(0) / w[m].sum()
    a = ((X[:, None, :] - C[None]) ** 2).sum(2).argmin(1)
    return C, np.array([w[a == j].sum() for j in range(k)])

def dominante(path):
    im = np.asarray(Image.open(path).convert('RGBA')).astype(float)
    rgb, al = im[..., :3].reshape(-1, 3), im[..., 3].reshape(-1)
    opaque = al >= 128
    keep = opaque & (rgb.max(1) >= 40) & (rgb.min(1) <= 235)
    if keep.sum() < 20: keep = opaque
    if keep.sum() == 0: return [0, 0, 0]
    lab, w = srgb_to_lab(rgb[keep]), al[keep]
    s = np.random.RandomState(1).choice(len(lab), min(len(lab), AMOSTRA), replace=False)
    C, W = kmeans(lab[s], w[s])
    chroma = np.hypot(C[:, 1], C[:, 2])
    cand = [j for j in range(K) if chroma[j] >= CHROMA_MIN] or list(range(K))
    return [round(float(x), 1) for x in C[max(cand, key=lambda j: W[j])]]

def main():
    rows = [(os.path.basename(p)[3:-4], dominante(p)) for p in sorted(glob.glob(os.path.join(SRC, 'el-*.png')))]
    lines = ["// GERADO por scripts/element-dominante.py - nao edite a mao. Rode o script quando entrar ícone novo.",
             "// Cor DOMINANTE de cada ícone de elemento: [L, a, b] (CIELAB). Complementa `elementVisual.data.ts` (cor média).",
             "export const ELEMENT_DOMINANTE: Readonly<Record<string, readonly [number, number, number]>> = {"]
    for i, s in rows: lines.append(f"  {i}: [{', '.join(str(x) for x in s)}],")
    lines.append("};")
    open(OUT, 'w', newline='\n', encoding='utf-8').write('\n'.join(lines) + '\n')
    print(len(rows), 'ícones ->', OUT)
main()
