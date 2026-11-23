#!/usr/bin/env python3
"""Instala os cenários da masmorra dos elementos COMPOSTOS (curados) gerados no ChatGPT (aprovados pelo dono, 11/11/2026).

Fonte canônica (sempre lida daqui, nunca de cópia): E:/Soulmon-assets/masmorra-cenarios-v2/<id>.png (941x1672)
Saída: src/assets/soulmon/combate/elemento/<id>.webp (450x800, cover + LANCZOS + UnsharpMask leve, WebP q82)
e src/utils/combatArtElementoMedias2.data.ts (cor média por id). `utils/combatArt.ts` lê `combate/elemento/*` (png OU webp):
o cenário próprio do elemento vence o do elemento base; sem arquivo, cai no base.
Os 20 elementos BASE ficam de fora (têm `combate/bg-<id>.png`, tools/instalar-cenarios-masmorra-base.py); contatos/_ref também.
Idempotente: reescreve só se o conteúdo mudar. Uso: python tools/instalar-cenarios-masmorra-compostos.py [--origem DIR] [--saida DIR]
"""
import argparse, io, sys
from pathlib import Path
from PIL import Image, ImageFilter, ImageOps, ImageStat

RAIZ = Path(__file__).resolve().parent.parent
W, H = 450, 800
BASES = {'fogo', 'agua', 'terra', 'ar', 'eletricidade', 'arcano', 'sombra', 'luz', 'vileza', 'morte', 'vida', 'vigor',
         'marcial', 'tempo', 'som', 'gravidade', 'espaco', 'fada', 'industrial', 'planta', 'neutro'}

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--origem', default='E:/Soulmon-assets/masmorra-cenarios-v2')
    ap.add_argument('--saida', default=str(RAIZ / 'src/assets/soulmon/combate/elemento'))
    ap.add_argument('--dados', default=str(RAIZ / 'src/utils/combatArtElementoMedias2.data.ts'))
    a = ap.parse_args()
    origem, saida, dados = Path(a.origem), Path(a.saida), Path(a.dados)
    saida.mkdir(parents=True, exist_ok=True)
    medias, mudou, total = {}, 0, 0
    for src in sorted(origem.glob('*.png')):
        if src.stem in BASES or src.stem.startswith(('_', 'contato')):
            continue
        im = ImageOps.fit(Image.open(src).convert('RGB'), (W, H), Image.LANCZOS, centering=(0.5, 0.5))
        im = im.filter(ImageFilter.UnsharpMask(radius=1, percent=60, threshold=2))
        r, g, b = (int(round(v)) for v in ImageStat.Stat(im).mean)
        medias[src.stem] = f'#{r:02x}{g:02x}{b:02x}'
        buf = io.BytesIO(); im.save(buf, 'WEBP', quality=82, method=6)
        total += len(buf.getvalue())
        dst = saida / f'{src.stem}.webp'
        if not dst.exists() or dst.read_bytes() != buf.getvalue():
            dst.write_bytes(buf.getvalue()); mudou += 1
    linhas = ''.join(f"  {k}: '{v}',\n" for k, v in sorted(medias.items()))
    ts = ("// GERADO por tools/instalar-cenarios-masmorra-compostos.py — não editar à mão. id do elemento COMPOSTO → cor média (#rrggbb).\n"
          f"export const ELEMENTO_BG_MEAN_V2: Record<string, string> = {{\n{linhas}}};\n")
    if not dados.exists() or dados.read_text(encoding='utf8') != ts:
        dados.write_text(ts, encoding='utf8', newline='\n'); mudou += 1
    print(f'{len(medias)} compostos; {total//1024} KB; {mudou} arquivo(s) alterado(s)')
    return 0

if __name__ == '__main__':
    sys.exit(main())
