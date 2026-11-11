#!/usr/bin/env python3
"""Instala os cenários da masmorra dos 20 elementos BASE (aprovados pelo dono em 10/11/2026).

Fonte canônica (sempre lida daqui, nunca de cópia): E:/Soulmon-assets/masmorra-cenarios-v2/<id>.png (941x1672)
Saída: src/assets/soulmon/combate/bg-<id>.png (450x800, cover + LANCZOS + UnsharpMask leve) — o `bg-` que `utils/combatArt.ts`
usa para o elemento base e para os compostos sem cenário próprio. Imprime a cor média de cada um (para BG_MEAN em combatArt.ts).
Idempotente: reescreve só se o conteúdo mudar. Uso: python tools/instalar-cenarios-masmorra-base.py [--origem DIR] [--saida DIR]
"""
import argparse, io, sys
from pathlib import Path
from PIL import Image, ImageFilter, ImageOps, ImageStat

RAIZ = Path(__file__).resolve().parent.parent
W, H = 450, 800
BASES = ['fogo', 'agua', 'terra', 'ar', 'eletricidade', 'arcano', 'sombra', 'luz', 'vileza', 'morte', 'vida', 'vigor',
         'marcial', 'tempo', 'som', 'gravidade', 'espaco', 'fada', 'industrial', 'planta']

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--origem', default='E:/Soulmon-assets/masmorra-cenarios-v2')
    ap.add_argument('--saida', default=str(RAIZ / 'src/assets/soulmon/combate'))
    a = ap.parse_args()
    origem, saida = Path(a.origem), Path(a.saida)
    mudou = 0
    for id_ in BASES:
        src = origem / f'{id_}.png'
        if not src.exists():
            print(f'FALTA {src}', file=sys.stderr); return 1
        im = ImageOps.fit(Image.open(src).convert('RGB'), (W, H), Image.LANCZOS, centering=(0.5, 0.5))
        im = im.filter(ImageFilter.UnsharpMask(radius=1, percent=60, threshold=2))
        r, g, b = (int(round(v)) for v in ImageStat.Stat(im).mean)
        buf = io.BytesIO(); im.save(buf, 'PNG', optimize=True)
        dst = saida / f'bg-{id_}.png'
        if not dst.exists() or dst.read_bytes() != buf.getvalue():
            dst.write_bytes(buf.getvalue()); mudou += 1
        print(f"{id_}: '#{r:02x}{g:02x}{b:02x}', {len(buf.getvalue())//1024}KB")
    print(f'{len(BASES)} cenários; {mudou} alterado(s)')
    return 0

if __name__ == '__main__':
    sys.exit(main())
