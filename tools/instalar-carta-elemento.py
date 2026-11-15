#!/usr/bin/env python3
"""Instala a carta preta vazia do modal "Elemento novo" (REGISTRO §399, 15/11/2026) em src/assets/soulmon/ui/carta-elemento.webp.
Fonte: SEMPRE o PNG canônico de E:/Soulmon-assets/_lote-15-11/carta-elemento/ (carta-elemento.png; se ainda não existir, a versão
carta-elemento-vN.png mais nova). Nunca lê o webp já instalado. A carta é IGUAL para todos os elementos (5:7, alfa real).
Tamanho exibido = 380 px de largura máxima x 3 = 1140; a fonte tem 1060, então NÃO amplia (nearest só reduz). Paleta reduzida até caber
no teto de bytes. Idempotente: rodar duas vezes dá os mesmos bytes.
Uso: python tools/instalar-carta-elemento.py"""
import glob, os, re, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = 'E:/Soulmon-assets/_lote-15-11/carta-elemento'
OUT = os.path.join(ROOT, 'src/assets/soulmon/ui/carta-elemento.webp')
MAX_W = 380 * 3
TETO = 300 * 1024

def fonte():
    canon = os.path.join(SRC, 'carta-elemento.png')
    if os.path.exists(canon):
        return canon
    vs = sorted(glob.glob(os.path.join(SRC, 'carta-elemento-v*.png')), key=lambda f: int(re.search(r'-v(\d+)\.png$', f).group(1)))
    if not vs:
        sys.exit('sem arte em ' + SRC)
    return vs[-1]

def main():
    f = fonte()
    im = Image.open(f).convert('RGBA')
    if im.width > MAX_W:
        im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.NEAREST)
    for cores in (None, 128, 64, 32):
        src = im if cores is None else im.quantize(colors=cores, method=Image.FASTOCTREE, dither=Image.NONE).convert('RGBA')
        src.save(OUT, 'WEBP', lossless=True, quality=100, method=6)
        n = os.path.getsize(OUT)
        if n <= TETO:
            print(f'{os.path.basename(f)} -> {OUT} {im.size} {n} bytes (cores={cores})')
            return
    sys.exit(f'estourou o teto: {n} bytes')

main()
