#!/usr/bin/env python3
"""W12 (20/10/2026): instala os fundos do Laboratorio e do Hall e o predio do Clan War.

Fonte = SEMPRE o original recebido guardado fora do repo (ORIG); o arquivo do repo e
sobrescrito com f(original). Rodar 2x da o mesmo resultado (no-op). NAO aplica o ajuste de
tom/escurecimento da W8-A (`tools/ajuste-tom-fundos.py`): pedido do dono, "pode tirar o efeito
de escurecer".
"""
import io, shutil
from pathlib import Path
import numpy as np
from PIL import Image

REPO = Path(__file__).resolve().parent.parent
AREAS = REPO / 'src/assets/soulmon/areas'
RECEBIDO = Path('D:/Soulmon/_gemini_out/w12-recebido')
ORIG = Path('D:/Soulmon/_gemini_out/w5-arte-20261019/originais')

BG = {  # arquivo no repo -> (original recebido, nome do original guardado)
    'bg-laboratorio.png': (RECEBIDO / 'lab-bg/lab-bg.png', 'bg-laboratorio-w12.png'),
    'bg-hall.png': (RECEBIDO / 'hall-bg/hall-bg.png', 'bg-hall-w12.png'),
}
PREDIO = ('lote-arena-guerra.png', RECEBIDO / 'clan-war/clan-war-predio.png', 'lote-arena-guerra-w12.png')


def keep(src: Path, name: str) -> Path:
    ORIG.mkdir(parents=True, exist_ok=True)
    dst = ORIG / name
    if not dst.exists():
        shutil.copy2(src, dst)  # guarda UMA vez; nunca sobrescreve o que ja esta la
    return dst


def webp_kb(img):
    b = io.BytesIO(); img.save(b, 'WEBP', quality=85); return round(b.tell() / 1024, 1)


def predio(img):
    """Pos-processo dos predios do repo: alfa binarizado em 200, bbox, 512 com ~4% de margem, Lanczos."""
    a = np.asarray(img.convert('RGBA')).copy()
    a[:, :, 3] = np.where(a[:, :, 3] >= 200, 255, 0)
    a[a[:, :, 3] == 0, :3] = 0
    im = Image.fromarray(a, 'RGBA')
    x0, y0, x1, y1 = im.getchannel('A').getbbox()
    im = im.crop((x0, y0, x1, y1))
    side = 512
    inner = round(side * 0.92)  # ~4% de margem de cada lado
    s = inner / max(im.size)
    im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    out = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    out.paste(im, ((side - im.width) // 2, (side - im.height) // 2))
    return out


def main():
    for nome, (src, guard) in BG.items():
        o = keep(src, guard)
        im = Image.open(o).convert('RGB').resize((760, 1344), Image.LANCZOS)
        im.save(AREAS / nome, optimize=True)
        print(nome, im.size, 'webp q85 ~', webp_kb(im), 'KB')
    nome, src, guard = PREDIO
    o = keep(src, guard)
    out = predio(Image.open(o))
    out.save(AREAS / nome, optimize=True)
    print(nome, out.size, 'bbox', out.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox())


if __name__ == '__main__':
    main()
