#!/usr/bin/env python3
"""Instala a REGERAÇÃO "darker dusk" (941x1672, ChatGPT, 12/11/2026) dos fundos de combate de 93 elementos.

Fonte canônica (sempre lida daqui, nunca de cópia): E:/Soulmon-assets/masmorra-cenarios-v2/<id>.png
Lista de ids: tools/cenarios-darker-ids.txt (os demais compostos seguem em tools/instalar-cenarios-masmorra-compostos.py, que pula estes).
Saída: src/assets/soulmon/combate/elemento/<id>.webp (720x1280, cover + LANCZOS + UnsharpMask leve, WebP q85)
e src/utils/combatArtElementoMedias3.data.ts (cor média por id; vence V1/V2). Remove o <id>.png antigo (360x640) do mesmo id.
Idempotente: reescreve só se o conteúdo mudar. Uso: python tools/instalar-cenarios-masmorra-darker.py [--origem DIR]
"""
import argparse, io, sys
from pathlib import Path
from PIL import Image, ImageFilter, ImageOps, ImageStat

RAIZ = Path(__file__).resolve().parent.parent
W, H = 720, 1280

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--origem', default='E:/Soulmon-assets/masmorra-cenarios-v2')
    ap.add_argument('--saida', default=str(RAIZ / 'src/assets/soulmon/combate/elemento'))
    ap.add_argument('--dados', default=str(RAIZ / 'src/utils/combatArtElementoMedias3.data.ts'))
    a = ap.parse_args()
    origem, saida, dados = Path(a.origem), Path(a.saida), Path(a.dados)
    ids = sorted({l.strip() for l in (RAIZ / 'tools/cenarios-darker-ids.txt').read_text(encoding='utf8').splitlines() if l.strip()})
    saida.mkdir(parents=True, exist_ok=True)
    medias, mudou, total = {}, 0, 0
    for i in ids:
        im = ImageOps.fit(Image.open(origem / f'{i}.png').convert('RGB'), (W, H), Image.LANCZOS, centering=(0.5, 0.5))
        im = im.filter(ImageFilter.UnsharpMask(radius=1, percent=40, threshold=2))
        r, g, b = (int(round(v)) for v in ImageStat.Stat(im).mean)
        medias[i] = f'#{r:02x}{g:02x}{b:02x}'
        buf = io.BytesIO(); im.save(buf, 'WEBP', quality=85, method=6)
        total += len(buf.getvalue())
        dst = saida / f'{i}.webp'
        if not dst.exists() or dst.read_bytes() != buf.getvalue():
            dst.write_bytes(buf.getvalue()); mudou += 1
        velho = saida / f'{i}.png'
        if velho.exists():
            velho.unlink(); mudou += 1
    linhas = ''.join(f"  {k}: '{v}',\n" for k, v in sorted(medias.items()))
    ts = ("// GERADO por tools/instalar-cenarios-masmorra-darker.py — não editar à mão. id → cor média (#rrggbb) dos fundos regerados (darker dusk).\n"
          f"export const ELEMENTO_BG_MEAN_V3: Record<string, string> = {{\n{linhas}}};\n")
    if not dados.exists() or dados.read_text(encoding='utf8') != ts:
        dados.write_text(ts, encoding='utf8', newline='\n'); mudou += 1
    print(f'{len(medias)} fundos; {total//1024} KB; {mudou} alteracao(oes)')
    return 0

if __name__ == '__main__':
    sys.exit(main())
