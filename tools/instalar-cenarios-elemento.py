#!/usr/bin/env python3
"""Instala os cenários de combate dos elementos FUNDIDOS.

Fonte canônica (sempre lida daqui, nunca de cópia): E:/Soulmon-assets/gerados-2026-10-29/combate-elementos/<id>.png
Saída: src/assets/soulmon/combate/elemento/<id>.png (360x640, cover + LANCZOS + UnsharpMask r1 p100 t2)
e src/utils/combatArtElementoMedias.data.ts (cor média por id).
Idempotente: reescreve o PNG só se o conteúdo mudar; 2ª execução = no-op.
Uso: python tools/instalar-cenarios-elemento.py [--origem DIR] [--saida DIR]
"""
import argparse, io, sys
from pathlib import Path
from PIL import Image, ImageFilter, ImageOps, ImageStat

RAIZ = Path(__file__).resolve().parent.parent
W, H = 360, 640

def converter(src: Path) -> Image.Image:
    im = Image.open(src).convert('RGB')
    im = ImageOps.fit(im, (W, H), Image.LANCZOS, centering=(0.5, 0.5))
    return im.filter(ImageFilter.UnsharpMask(radius=1, percent=100, threshold=2))

def media_hex(im: Image.Image) -> str:
    r, g, b = (int(round(v)) for v in ImageStat.Stat(im).mean)
    return f'#{r:02x}{g:02x}{b:02x}'

BASES = {'fogo', 'agua', 'terra', 'ar', 'eletricidade', 'arcano', 'sombra', 'luz', 'vileza', 'morte', 'vida', 'vigor',
         'marcial', 'tempo', 'som', 'gravidade', 'espaco', 'fada', 'industrial', 'planta'}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--origem', default='E:/Soulmon-assets/gerados-2026-10-29/combate-elementos')
    ap.add_argument('--saida', default=str(RAIZ / 'src/assets/soulmon/combate/elemento'))
    ap.add_argument('--dados', default=str(RAIZ / 'src/utils/combatArtElementoMedias.data.ts'))
    a = ap.parse_args()
    origem, saida, dados = Path(a.origem), Path(a.saida), Path(a.dados)
    saida.mkdir(parents=True, exist_ok=True)
    medias, mudou = {}, 0
    for src in sorted(origem.glob('*.png')):
        # Os 20 elementos BASE têm cenário próprio em `combate/bg-<id>.png`; aqui só entram os fundidos.
        if src.stem in BASES:
            continue
        im = converter(src)
        medias[src.stem] = media_hex(im)
        buf = io.BytesIO(); im.save(buf, 'PNG', optimize=True)
        dst = saida / src.name
        if not dst.exists() or dst.read_bytes() != buf.getvalue():
            dst.write_bytes(buf.getvalue()); mudou += 1
    linhas = ''.join(f"  {k}: '{v}',\n" for k, v in sorted(medias.items()))
    ts = ("// GERADO por tools/instalar-cenarios-elemento.py — não editar à mão. id do elemento FUNDIDO → cor média (#rrggbb) do cenário.\n"
          f"export const ELEMENTO_BG_MEAN: Record<string, string> = {{\n{linhas}}};\n")
    if not dados.exists() or dados.read_text(encoding='utf8') != ts:
        dados.write_text(ts, encoding='utf8', newline='\n'); mudou += 1
    print(f'{len(medias)} cenários; {mudou} arquivo(s) alterado(s)')
    return 0

if __name__ == '__main__':
    sys.exit(main())
