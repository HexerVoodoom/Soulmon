#!/usr/bin/env python3
"""W12 (20/10/2026): medicao das plataformas dos mapas, checagem de geometria dos lotes e previas.

Le as posicoes dos lotes direto de src/utils/areaSheetCopy.ts e playAreaLots.ts (fonte unica),
as plataformas medidas nos PNG (tabela PLAT, em px da imagem) e os sprites de src/assets/soulmon/areas.

  python tools/w12-mapas.py propor [vw vh]   # onde cada lote deveria ficar p/ a pegada assentar no centro da plataforma
  python tools/w12-mapas.py checar           # H11 (toque), dentro da cena, H12, em 5 telas + 360x640
  python tools/w12-mapas.py previas          # grava w12-<mapa>.png / -diag.png (360x640 e 390x844)
"""
import re, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

REPO = Path(__file__).resolve().parent.parent
ART = REPO / 'src/assets/soulmon/areas'
OUT = Path('D:/Soulmon/_gemini_out/w5-arte-20261019/previas')
LABEL_H, MINW = 22, 120

SPRITE = {
    'mercado': {'itens': 'lote-loja-itens', 'conquistas': 'lote-mercado-conquistas', 'background': 'lote-loja-background',
                'decoracao': 'lote-loja-decoracao', 'ferreiro': 'lote-mercado-ferreiro', 'restaurante': 'lote-mercado-restaurante'},
    'arena': {'torneio': 'lote-arena-torneio', 'duelo': 'lote-arena-duelo', 'guerra': 'lote-arena-guerra'},
    'exploracao': {'masmorra': 'lote-exploracao-masmorra', 'passeio': 'lote-exploracao-passeio',
                   'oficina': 'lote-exploracao-oficina-v3', 'caderno': 'lote-exploracao-caderno-v3'},
    'jogos': {'salao': 'lote-jogos-ppt', 'mente': 'lote-jogos-mente', 'refugio': 'lote-jogos-refugio'},
    'laboratorio': {'evolucao': 'lote-laboratorio-evolucao', 'pet': 'lote-laboratorio-pet', 'stats': 'lote-laboratorio-stats',
                    'perfil': 'lote-laboratorio-perfil', 'biblioteca': 'lote-hall-biblioteca', 'amigos': 'lote-hall-amigos-terra'},
    'hall': {'guilda': 'lote-hall-guilda-luz', 'grove': 'lote-hall-grove', 'feira': 'lote-arena-feira'},
}
BG = {'mercado': 'bg-mercado', 'arena': 'bg-arena', 'exploracao': 'bg-exploracao', 'jogos': 'bg-jogos',
      'laboratorio': 'bg-laboratorio', 'hall': 'bg-hall'}
LABEL = {'feira': 'Feira', 'grove': 'Grove', 'guilda': 'Clan Hall'}  # os do Hall vem do GUILD_COPY
# Plataformas MEDIDAS nos PNG (px da imagem): (lote, kind, cx, cy, w, h). 'free' = clareira sem borda nitida (so referencia).
PLAT = {
    'laboratorio': [('stats', 'ellipse', 383, 472, 265, 175), ('biblioteca', 'ellipse', 170, 569, 184, 134),
                    ('amigos', 'ellipse', 590, 566, 190, 130), ('evolucao', 'ellipse', 235, 875, 200, 138),
                    ('pet', 'ellipse', 529, 881, 200, 140), ('perfil', 'ellipse', 383, 1124, 227, 146)],
    'hall': [('feira', 'diamond', 196, 427.5, 300, 148), ('grove', 'diamond', 585.5, 427, 290, 148),
             ('guilda', 'diamond', 385, 993, 508, 246)],
    'arena': [('torneio+duelo', 'diamond', 500, 810, 450, 330), ('guerra', 'diamond', 755, 650, 435, 302)],
    'jogos': [('salao', 'ellipse', 390, 418, 460, 322), ('mente', 'free', 400, 790, 280, 170), ('refugio', 'free', 388, 1015, 265, 230)],
    'exploracao': [('masmorra', 'diamond', 210, 252, 250, 135), ('passeio', 'diamond', 566, 458, 268, 180)],
    'mercado': [('itens', 'diamond', 220, 364, 224, 148), ('conquistas', 'diamond', 505, 364, 226, 148),
                ('background', 'diamond', 220, 605, 224, 163), ('decoracao', 'diamond', 506, 607, 228, 163)],
}
VIEWPORTS = [(360, 740), (360, 780), (390, 844), (393, 873), (412, 915)]
REF = (390, 844)


def parse_lots():
    out = {}
    for fname in ('src/utils/areaSheetCopy.ts', 'src/utils/playAreaLots.ts'):
        txt = (REPO / fname).read_text(encoding='utf-8')
        for m in re.finditer(r"const (\w+)_LOTS\b[^=]*=\s*\[(.*?)\n\];", txt, re.S):
            area = m.group(1).lower()
            lots = []
            for l in re.finditer(r"\{\s*id:\s*'(\w+)'(.*?)left:\s*'([\d.]+)%',\s*top:\s*'([\d.]+)%'(?:,\s*width:\s*'([\d.]+)%')?", m.group(2), re.S):
                lab = re.search(r"labelPt:\s*'([^']*)'", l.group(2))
                lots.append(dict(id=l.group(1), left=float(l.group(3)), top=float(l.group(4)),
                                 width=float(l.group(5) or 38), label=lab.group(1) if lab else LABEL.get(l.group(1), l.group(1))))
            out[area] = lots
    return out


_sprite_cache = {}


def sprite(area, lot):
    k = (area, lot)
    if k not in _sprite_cache:
        im = Image.open(ART / (SPRITE[area][lot] + '.png')).convert('RGBA')
        a = np.asarray(im.getchannel('A'))
        ys, xs = np.where(a > 20)
        W = im.width
        b = (xs.min() / W, ys.min() / W, (xs.max() + 1) / W, (ys.max() + 1) / W)
        # pegada: x = centro da caixa opaca; y = base - 0.18 * largura opaca (centro do diamante iso 2:1 do rodape)
        fx = (b[0] + b[2]) / 2  # centro da caixa opaca (o centroide do rodape engana em sprite assimetrico)
        fy = b[3] - 0.18 * (b[2] - b[0])
        _sprite_cache[k] = (im, b, fx, fy)
    return _sprite_cache[k]


def cover(W, H, vw, vh):
    s = max(vw / W, vh / H)
    return s, (W * s - vw) / 2, (H * s - vh) / 2


def hit_rects(area, lot, vw, vh):
    im, b, fx, fy = sprite(area, lot['id'])
    bw = max(lot['width'] / 100 * vw, MINW)
    total = bw + LABEL_H
    x0 = lot['left'] / 100 * vw - bw / 2
    y0 = lot['top'] / 100 * vh - 0.8 * total
    art = (x0 + b[0] * bw, y0 + b[1] * bw, x0 + b[2] * bw, y0 + b[3] * bw)
    lw = min(bw, len(lot['label']) * 7.5 + 20)
    lab = (x0 + (bw - lw) / 2, y0 + bw, x0 + (bw + lw) / 2, y0 + total)
    return art, lab, (x0 + fx * bw, y0 + fy * bw), bw, (x0, y0)


def inter(a, b):
    return min(a[2], b[2]) - max(a[0], b[0]) > 0 and min(a[3], b[3]) - max(a[1], b[1]) > 0


def plat_for(area, lot_id):
    for n, kind, cx, cy, w, h in PLAT.get(area, []):
        if lot_id in n.split('+'):
            return n, kind, cx, cy, w, h
    return None


def propor(vw, vh):
    lots = parse_lots()
    for area, ls in lots.items():
        W, H = Image.open(ART / (BG[area] + '.png')).size
        s, ox, oy = cover(W, H, vw, vh)
        for l in ls:
            p = plat_for(area, l['id'])
            if not p:
                continue
            n, kind, cx, cy, w, h = p
            sx, sy = cx * s - ox, cy * s - oy
            _, b, fx, fy = sprite(area, l['id'])
            bw = max(l['width'] / 100 * vw, MINW)
            left = (sx - (fx - 0.5) * bw) / vw * 100
            top = (sy - fy * bw + 0.8 * (bw + LABEL_H)) / vh * 100
            opaque = (b[2] - b[0]) * bw
            art, lab, fp, _, _ = hit_rects(area, l, vw, vh)
            print(f"{area}:{l['id']:11s} plat c=({sx / vw * 100:.1f}%,{sy / vh * 100:.1f}%) util {w * s / vw * 100:.0f}%x{h * s / vh * 100:.0f}% | opaco {opaque / vw * 100:.0f}% ({opaque / (w * s):.2f} da plat) | atual {l['left']:.0f}/{l['top']:.0f} w{l['width']:.0f}, pegada em ({fp[0] / vw * 100:.1f},{fp[1] / vh * 100:.1f}) -> p/ centrar: {left:.1f}/{top:.1f}")


def checar():
    lots = parse_lots()
    bad = 0
    for vw, vh in VIEWPORTS + ([(360, 640)] if '--tudo' in sys.argv else []):
        for area, ls in lots.items():
            R = {l['id']: hit_rects(area, l, vw, vh) for l in ls}
            for i in range(len(ls)):
                art, lab = R[ls[i]['id']][:2]
                if vh > 700:  # espelha areaLotGeometry.dentroDaCena.qa3.test.ts: todo alvo (arte e rotulo) dentro da cena
                    for nome, r in (('arte', art), ('rotulo', lab)):
                        if r[0] < -1 or r[1] < -1 or r[2] > vw + 1 or r[3] > vh + 1:
                            print('FORA da cena', nome, area, ls[i]['id'], vw, vh, [round(v) for v in r])
                            bad += 1
                for j in range(i + 1, len(ls)):
                    a2 = R[ls[j]['id']]
                    if any(inter(r, t) for r in (art, lab) for t in (a2[0], a2[1])):
                        print('H11', area, ls[i]['id'], 'x', ls[j]['id'], vw, vh, ' | '.join(f'{k}:{[round(v/ (vw if n%2==0 else vh)*100) for n,v in enumerate(r)]}' for k, r in ((ls[i]['id'], art), (ls[j]['id'], a2[0]))))
                        bad += 1
    for area, ls in lots.items():
        for l in ls:
            b = sprite(area, l['id'])[1]
            ow = l['width'] * (b[2] - b[0])
            if not 24 <= ow <= 70:
                print('H12', area, l['id'], f'{ow:.1f}%')
                bad += 1
    print('violacoes:', bad)
    return bad


def set_lot(area, lot_id, left, top, width=None):
    """Reescreve left/top(/width) do lote no .ts (so os tres valores; comentarios ficam)."""
    for fname in ('src/utils/areaSheetCopy.ts', 'src/utils/playAreaLots.ts'):
        path = REPO / fname
        txt = path.read_text(encoding='utf-8')
        m = re.search(r"const %s_LOTS\b[^=]*=\s*\[(.*?)\n\];" % area.upper(), txt, re.S)
        if not m:
            continue
        block = m.group(1)
        pat = re.compile(r"(\{\s*id:\s*'%s'.*?left:\s*')[\d.]+(%%',\s*top:\s*')[\d.]+(%%')(?:(,\s*width:\s*')[\d.]+(%%'))?" % lot_id, re.S)
        mm = pat.search(block)
        if not mm:
            continue
        def sub(x):
            s = x.group(1) + f'{left:g}' + x.group(2) + f'{top:g}' + x.group(3)
            if x.group(4):
                s += x.group(4) + f'{(width if width is not None else float(re.search(r"width:\s*.([\d.]+)", x.group(0)).group(1))):g}' + x.group(5)
            return s
        nb = pat.sub(sub, block, count=1)
        path.write_text(txt.replace(block, nb, 1), encoding='utf-8')
        return True
    raise SystemExit(f'lote nao achado: {area}:{lot_id}')


def font(sz):
    return ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', sz)


def render(area, vw, vh, diag):
    lots = parse_lots()[area]
    bgim = Image.open(ART / (BG[area] + '.png')).convert('RGB')
    W, H = bgim.size
    s, ox, oy = cover(W, H, vw, vh)
    r = bgim.resize((round(W * s), round(H * s)), Image.LANCZOS)
    canvas = r.crop((round(ox), round(oy), round(ox) + vw, round(oy) + vh)).convert('RGBA')
    f = font(12)
    for l in lots:  # a ordem do array e a ordem de pintura
        im, b, fx, fy = sprite(area, l['id'])
        art, lab, fp, bw, (x0, y0) = hit_rects(area, l, vw, vh)
        sz = max(1, round(bw))
        sp = im.resize((sz, sz), Image.LANCZOS)
        shadow = Image.new('RGBA', (vw, vh), (0, 0, 0, 0))
        shadow.paste(sp, (round(x0), round(y0) + 6))
        al = shadow.getchannel('A').filter(ImageFilter.GaussianBlur(3)).point(lambda v: int(v * .55))
        sh = Image.new('RGBA', (vw, vh), (0, 0, 0, 0))
        sh.putalpha(al)
        canvas.alpha_composite(sh)
        if area == 'laboratorio' and l['id'] == 'stats':  # W13: sombra de voo (espelha AreaScene: elipse 90% da largura opaca, centro 2% da caixa abaixo da base do sprite)
            ew = (b[2] - b[0]) * bw * 0.9
            eh = ew * 0.22
            ecx, ecy = x0 + (b[0] + b[2]) / 2 * bw, y0 + (b[3] + 0.02) * bw
            sm = Image.new('L', (vw, vh), 0)
            ImageDraw.Draw(sm).ellipse([ecx - ew / 2, ecy - eh / 2, ecx + ew / 2, ecy + eh / 2], fill=int(255 * .45))
            sm = sm.filter(ImageFilter.GaussianBlur(3))
            blk = Image.new('RGBA', (vw, vh), (0, 0, 0, 255))
            blk.putalpha(sm)
            canvas.alpha_composite(blk)
        layer = Image.new('RGBA', (vw, vh), (0, 0, 0, 0))
        layer.paste(sp, (round(x0), round(y0)))
        canvas.alpha_composite(layer)
        d = ImageDraw.Draw(canvas)
        d.rounded_rectangle([lab[0], lab[1] - 2, lab[2], lab[3] - 4], radius=9, fill=(8, 25, 26, 217), outline=(95, 243, 224, 90))
        tw = d.textlength(l['label'], font=f)
        d.text(((lab[0] + lab[2]) / 2 - tw / 2, lab[1] + 1), l['label'], fill=(233, 245, 242), font=f)
    if diag:
        d = ImageDraw.Draw(canvas)
        for n, kind, cx, cy, w, h in PLAT.get(area, []):
            sx, sy, sw, sh_ = cx * s - ox, cy * s - oy, w * s, h * s
            if kind in ('ellipse', 'free'):
                d.ellipse([sx - sw / 2, sy - sh_ / 2, sx + sw / 2, sy + sh_ / 2], outline=(255, 0, 255, 255), width=1)
            else:
                d.polygon([(sx, sy - sh_ / 2), (sx + sw / 2, sy), (sx, sy + sh_ / 2), (sx - sw / 2, sy)], outline=(255, 0, 255, 255))
            d.line([sx - 3, sy, sx + 3, sy], fill=(255, 0, 255, 255))
            d.line([sx, sy - 3, sx, sy + 3], fill=(255, 0, 255, 255))
        for l in lots:
            art, lab, fp, bw, _ = hit_rects(area, l, vw, vh)
            d.rectangle(art, outline=(255, 230, 0, 255), width=1)
            d.rectangle(lab, outline=(0, 255, 120, 255), width=1)
            d.ellipse([fp[0] - 3, fp[1] - 3, fp[0] + 3, fp[1] + 3], fill=(255, 230, 0, 255))
    return canvas.convert('RGB')


def previas():
    OUT.mkdir(parents=True, exist_ok=True)
    for area in parse_lots():
        for (vw, vh), suf in (((360, 640), ''), ((390, 844), '-390x844')):
            render(area, vw, vh, False).save(OUT / f'w12-{area}{suf}.png')
            render(area, vw, vh, True).save(OUT / f'w12-{area}{suf}-diag.png')
    print('previas em', OUT)


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'checar'
    if cmd == 'propor':
        propor(*(map(int, sys.argv[2:4]) if len(sys.argv) > 3 else REF))
    elif cmd == 'checar':
        sys.exit(1 if checar() else 0)
    elif cmd == 'previas':
        previas()
    elif cmd == 'set':  # set area:lot left top [width]
        a, l = sys.argv[2].split(':')
        set_lot(a, l, float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5]) if len(sys.argv) > 5 else None)
