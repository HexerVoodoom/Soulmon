#!/usr/bin/env python3
"""Gera src/utils/elementSilhueta.data.ts: a SILHUETA de cada src/assets/soulmon/elementos/el-*.png como
máscara binária 16x16 (alfa >= 50% depois de reduzir com média por caixa), 16 linhas de 4 dígitos hex
(64 caracteres). Camada da RODADA 2 do REGISTRO §402: `utils/match3Cores.ts` compara o IoU das máscaras de
dois ícones (ícones de cor diferente mas de forma quase igual a 40 px se confundem na tela).
  python scripts/element-silhueta.py
O tabuleiro real mostra o ícone em ~40 px (célula de ~49 px com padding 2; 7 colunas em no máximo 380 px);
16x16 é o menor grid que ainda separa espada fina de disco de halo."""
import glob, os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
SRC = os.path.join(ROOT, 'src/assets/soulmon/elementos')
OUT = os.path.join(ROOT, 'src/utils/elementSilhueta.data.ts')
S = 16

def mascara(path):
    al = np.asarray(Image.open(path).convert('RGBA').resize((S, S), Image.BOX))[..., 3] / 255.0
    m = al >= 0.5
    return ''.join('%04x' % int(''.join('1' if v else '0' for v in row), 2) for row in m)

def main():
    rows = [(os.path.basename(p)[3:-4], mascara(p)) for p in sorted(glob.glob(os.path.join(SRC, 'el-*.png')))]
    lines = ["// GERADO por scripts/element-silhueta.py - nao edite a mao. Rode o script quando entrar ícone novo.",
             "// Silhueta de cada ícone de elemento: máscara 16x16 (alfa >= 50%), 16 linhas de 4 dígitos hex (64 caracteres).",
             "export const ELEMENT_SILHUETA: Readonly<Record<string, string>> = {"]
    for i, s in rows: lines.append(f"  {i}: '{s}',")
    lines.append("};")
    open(OUT, 'w', newline='\n', encoding='utf-8').write('\n'.join(lines) + '\n')
    print(len(rows), 'ícones ->', OUT)
main()
