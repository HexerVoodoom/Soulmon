#!/usr/bin/env python3
"""Gera src/utils/elementVisual.data.ts: assinatura visual [L,a,b,opaco] de cada
src/assets/soulmon/elementos/el-*.png. Rode de novo quando entrarem elementos novos:
  python scripts/element-visual.py
L,a,b = CIELAB (D65) medio dos pixels opacos (alfa>=128), pesado por alfa,
ignorando quase-preto (contorno, max(rgb)<40) e quase-branco (min(rgb)>235).
opaco = fracao de pixels com alfa>=128 (0..1)."""
import glob, os, sys
from PIL import Image
import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'src/assets/soulmon/elementos')
OUT = os.path.join(ROOT, 'src/utils/elementVisual.data.ts')

def srgb_to_lab(rgb):
    c = rgb / 255.0
    c = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    M = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750], [0.0193339, 0.1191920, 0.9503041]])
    xyz = c @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 216 / 24389, np.cbrt(xyz), (24389 / 27 * xyz + 16) / 116)
    return np.stack([116 * f[:, 1] - 16, 500 * (f[:, 0] - f[:, 1]), 200 * (f[:, 1] - f[:, 2])], axis=1)

def signature(path):
    im = np.asarray(Image.open(path).convert('RGBA')).astype(float)
    rgb, al = im[..., :3].reshape(-1, 3), im[..., 3].reshape(-1)
    opaque = al >= 128
    keep = opaque & (rgb.max(1) >= 40) & (rgb.min(1) <= 235)
    if keep.sum() < 20: keep = opaque
    if keep.sum() == 0: return [0, 0, 0, 0]
    lab = srgb_to_lab(rgb[keep]); w = al[keep]
    m = (lab * w[:, None]).sum(0) / w.sum()
    return [round(float(m[0]), 1), round(float(m[1]), 1), round(float(m[2]), 1), round(float(opaque.mean()), 3)]

def main():
    rows = []
    for p in sorted(glob.glob(os.path.join(SRC, 'el-*.png'))):
        rows.append((os.path.basename(p)[3:-4], signature(p)))
    lines = ["// GERADO por scripts/element-visual.py - nao edite a mao. Rode o script quando entrar ícone novo.",
             "// Assinatura visual de cada ícone de elemento: [L, a, b (CIELAB), fração opaca].",
             "export const ELEMENT_VISUAL: Readonly<Record<string, readonly [number, number, number, number]>> = {"]
    for i, s in rows: lines.append(f"  {i}: [{', '.join(str(x) for x in s)}],")
    lines.append("};")
    open(OUT, 'w', newline='\n', encoding='utf-8').write('\n'.join(lines) + '\n')
    print(len(rows), 'ícones ->', OUT)
main()
