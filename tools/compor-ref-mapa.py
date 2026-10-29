"""Compõe a REFERÊNCIA de cada mapa/área para a geração "integrada" (fundo + prédios numa imagem só).
Para cada área: fundo atual em cover-fit 760x1344 + as artes dos lotes coladas nas posições reais
(left/top/width em % lidos de areaSheetCopy.ts / playAreaLots.ts; MapPage AREA_POS para o Mapa geral).
Âncora do AreaScene: translate(-50%,-80%) sobre (largura + rótulo); no Mapa geral: -78%.
Saída: E:/Soulmon-assets/gerados-2026-10-29/ref-mapas/<area>.png  (e mapa.png)
Uso: python tools/compor-ref-mapa.py [area ...]   (somente leitura sobre o repo)"""
import os, re, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, 'src/assets/soulmon/areas')
M = os.path.join(ROOT, 'src/assets/soulmon/mapa')
OUT = 'E:/Soulmon-assets/gerados-2026-10-29/ref-mapas'
W, H = 760, 1344
LABEL_H = round(22 * W / 390)  # rótulo do lote (22 px a 390 de largura) escalado
DEF_W = 38.0

BG = {'mercado': 'bg-mercado', 'jogos': 'bg-jogos', 'exploracao': 'bg-exploracao', 'arena': 'bg-arena',
      'hall': 'bg-hall', 'laboratorio': 'bg-laboratorio', 'forja': 'bg-forja'}
# arte efetiva de cada lote (o que o index.ts resolve hoje: v2/v3 quando existem em disco)
ART = {
 'mercado': {'itens': 'lote-loja-itens', 'decoracao': 'lote-loja-decoracao', 'background': 'lote-loja-background',
             'conquistas': 'lote-mercado-conquistas', 'restaurante': 'lote-mercado-restaurante'},
 'arena': {'torneio': 'lote-arena-torneio', 'duelo': 'lote-arena-duelo', 'guerra': 'lote-arena-guerra'},
 'laboratorio': {'evolucao': 'lote-lab-evolucao-v2', 'stats': 'lote-lab-vinculo-v2', 'perfil': 'lote-laboratorio-perfil',
                 'biblioteca': 'lote-lab-biblioteca-v2'},
 'hall': {'guilda': 'lote-hall-guilda-luz', 'grove': 'lote-hall-grove', 'feira': 'lote-arena-feira'},
 'exploracao': {'passeio': 'lote-exploracao-passeio', 'fenda': 'lote-exploracao-endless-rift', 'dungeon': 'lote-jogos-dungeon-cripta'},
 'forja': {'oficina': 'lote-forja-oficina', 'caderno': 'lote-forja-caderno', 'refugio': 'lote-forja-refugio', 'ferreiro': 'lote-forja-ferreiro'},
 'jogos': {'salao': 'lote-jogos-ppt', 'mente': 'lote-jogos-mente'},
}
SRC = {'mercado': ('src/utils/areaSheetCopy.ts', 'MERCADO_LOTS'), 'arena': ('src/utils/areaSheetCopy.ts', 'ARENA_LOTS'),
       'laboratorio': ('src/utils/areaSheetCopy.ts', 'LABORATORIO_LOTS'), 'hall': ('src/utils/areaSheetCopy.ts', 'HALL_LOTS'),
       'exploracao': ('src/utils/playAreaLots.ts', 'EXPLORACAO_LOTS'), 'forja': ('src/utils/playAreaLots.ts', 'FORJA_LOTS'),
       'jogos': ('src/utils/playAreaLots.ts', 'JOGOS_LOTS')}

def cover(img):
    s = max(W / img.width, H / img.height)
    im = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    l, t = (im.width - W) // 2, (im.height - H) // 2
    return im.crop((l, t, l + W, t + H)).convert('RGBA')

def lots_of(area):
    f, name = SRC[area]
    txt = open(os.path.join(ROOT, f), encoding='utf8').read()
    blk = txt[txt.index(f'const {name}'):]
    blk = blk[:blk.index('\n];')]
    out = []
    for line in blk.split('\n'):
        m = re.match(r"\s*\{ id: '(\w+)'", line)
        if not m: continue
        g = lambda k: (re.search(k + r": '([\d.]+)%'", line) or [None, None])[1]
        out.append((m.group(1), float(g('left')), float(g('top')), float(g('width') or DEF_W)))
    return out

def paste(base, art_path, left, top, wpct, anchor, label):
    art = Image.open(art_path).convert('RGBA')
    bw = round(W * wpct / 100)
    art = art.resize((bw, round(bw * art.height / art.width)), Image.LANCZOS)
    total = bw + (LABEL_H if label else 0)
    x = round(W * left / 100 - bw / 2)
    y = round(H * top / 100 - anchor * total)
    base.alpha_composite(art, (x, y)) if x >= 0 and y >= 0 and x + bw <= W and y + art.height <= H else _clip(base, art, x, y)

def _clip(base, art, x, y):
    layer = Image.new('RGBA', base.size, (0, 0, 0, 0)); layer.paste(art, (x, y)); base.alpha_composite(layer)

def main(sel):
    os.makedirs(OUT, exist_ok=True)
    for area in (sel or list(BG)):
        base = cover(Image.open(os.path.join(A, BG[area] + '.png')))
        for lid, l, t, w in lots_of(area):
            paste(base, os.path.join(A, ART[area][lid] + '.png'), l, t, w, 0.80, True)
        base.convert('RGB').save(f'{OUT}/{area}.png'); print(area, len(lots_of(area)), 'lotes')
    if not sel or 'mapa' in sel:
        pos = {'mercado': (30, 17, 34), 'jogos': (74, 19.8, 34), 'exploracao': (16.8, 47.1, 30.3), 'forja': (15.1, 78.7, 30.7),
               'arena': (84.1, 47.3, 29.4), 'laboratorio': (49, 77.9, 34), 'hall': (84.7, 71.5, 30.8)}
        base = cover(Image.open(os.path.join(M, 'bg-mapa.png')))
        for a, (l, t, w) in pos.items():
            paste(base, os.path.join(M, f'zona-{a}.png'), l, t, w, 0.78, False)
        base.convert('RGB').save(f'{OUT}/mapa.png'); print('mapa 7 zonas')

if __name__ == '__main__':
    main(sys.argv[1:])
