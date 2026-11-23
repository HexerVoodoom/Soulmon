"""Instala as 33 decorações refeitas no estilo novo (lote 14-15/11/2026) em src/assets/decor/<id>.png.

Uso:  python tools/instalar-decor-refeitas.py [ORIGEM] [DESTINO] [--contato ARQ.png] [--antes DIR]
  ORIGEM  padrão E:/Soulmon-assets/_lote-14-11/decoracao  (<nome>.png, alfa real)
  DESTINO padrão src/assets/decor
  --antes DIR   pasta com os PNG de antes (ex.: copiados do git); a prancha mostra ANTES | DEPOIS.

O ID DO ITEM NÃO MUDA: a peça refeita troca a arte no mesmo arquivo (decisão P10 do plano). Por isso o
formato é PNG, o mesmo que `utils/decorArt.ts` importa; nada de código muda e o Vite renomeia com hash.
Mesma regra do instalador da Honra (tools/instalar-honra-decor.py):
  - o arquivo é a CAIXA do espaço (`DECOR_SLOTS`) x 3, alfa real, reduzido com NEAREST;
  - recorta na bounding box do alfa e encaixa SEM deformar (escala `contain`); âncora embaixo no
    chão, centro na parede e no tapete (grass e sand ancoram embaixo);
  - o espaço `rug` (13:2) recebe uma faixa: se a peça é mais alta que 13:2, a janela de altura w*2/13
    com mais alfa (projeção de linhas), nunca grade fixa.
Idempotente: a fonte é SEMPRE o PNG canônico da origem, nunca o arquivo já instalado (rodar duas vezes
seguidas regrava os mesmos bytes).
"""
import sys, os
from PIL import Image

SLOTS = {  # espaço -> (w, h) de DECOR_SLOTS
    'floor-left': (56, 56), 'floor-right': (48, 52), 'trophy': (46, 50), 'wall': (56, 40), 'rug': (104, 16),
}
K = 3  # escala de instalação (caixa x 3)
THR = 8  # alfa acima disto conta como "tem peça"
# nome do PNG de origem -> (id do item = nome do arquivo instalado, espaço)
PECAS = {
    'arcade-cab': ('furn-arcade-cab', 'floor-left'), 'books': ('furn-books', 'floor-left'),
    'campfire': ('furn-campfire', 'floor-left'), 'cauldron': ('furn-cauldron', 'floor-left'),
    'chair': ('furn-chair', 'floor-left'), 'crystal': ('furn-crystal', 'floor-left'),
    'sofa': ('furn-sofa', 'floor-left'), 'tent': ('furn-tent', 'floor-left'), 'well': ('furn-well', 'floor-left'),
    'food-bowl': ('furn-food-bowl', 'floor-right'), 'plant': ('furn-plant', 'floor-right'),
    'lamp': ('furn-lamp', 'floor-right'), 'rock': ('furn-rock', 'floor-right'),
    'mushrooms': ('furn-mushrooms', 'floor-right'), 'hourglass': ('furn-hourglass', 'floor-right'),
    'clock': ('furn-clock', 'wall'), 'garland': ('furn-garland', 'wall'), 'picture': ('furn-picture', 'wall'),
    'window': ('furn-window', 'wall'), 'wind-chime': ('furn-wind-chime', 'wall'),
    'champion-banner': ('furniture-champion-banner', 'wall'), 'medal-wall': ('furniture-medal-wall', 'wall'),
    'crate': ('furn-crate', 'trophy'), 'shelf-simple': ('furn-shelf-simple', 'trophy'),
    'trophy-shelf': ('furniture-trophy-shelf', 'trophy'), 'podium': ('furniture-podium', 'trophy'),
    'trophy-concha-mare': ('trophy-concha-mare', 'trophy'),
    'rug': ('furn-rug', 'rug'), 'grass': ('furn-grass', 'rug'), 'sand': ('furn-sand', 'rug'),
    'stone-tiles': ('furn-stone-tiles', 'rug'), 'circuit-mat': ('furn-circuit-mat', 'rug'), 'deck': ('furn-deck', 'rug'),
}
ANCORA_BAIXO_EXTRA = {'grass', 'sand'}  # nos demais, chão/vitrine ancoram embaixo; parede e tapete, no centro


def bbox_alfa(im):
    return im.getchannel('A').point(lambda v: 255 if v > THR else 0).getbbox()


def faixa(im, razao):
    """Corta a janela de altura w/razao com mais massa de alfa (projeção de linhas)."""
    w, h = im.size
    alvo = max(1, round(w / razao))
    if alvo >= h:
        return im
    a = im.getchannel('A')
    linhas = [sum(a.crop((0, y, w, y + 1)).getdata()) for y in range(h)]
    soma = sum(linhas[:alvo]); melhor, y0 = soma, 0
    for y in range(1, h - alvo + 1):
        soma += linhas[y + alvo - 1] - linhas[y - 1]
        if soma > melhor:
            melhor, y0 = soma, y
    out = im.crop((0, y0, w, y0 + alvo))
    b = bbox_alfa(out)
    return out.crop(b) if b else out


def instalar(src, slot, baixo):
    im = Image.open(src).convert('RGBA')
    b = bbox_alfa(im)
    if not b:
        raise SystemExit(f'sem alfa real: {src}')
    im = im.crop(b)
    bw, bh = SLOTS[slot]
    cw, ch = bw * K, bh * K
    if slot == 'rug':
        im = faixa(im, cw / ch)
    esc = min(cw / im.width, ch / im.height)
    nw, nh = max(1, round(im.width * esc)), max(1, round(im.height * esc))
    peca = im.resize((nw, nh), Image.NEAREST)
    tela = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    x = (cw - nw) // 2
    y = ch - nh if baixo else (ch - nh) // 2
    tela.paste(peca, (x, y))
    return tela


def contato(feitos, antes, saida):
    cel = 200; cols = 4
    lin = (len(feitos) + cols - 1) // cols
    larg = cel * (2 if antes else 1)
    folha = Image.new('RGBA', (cols * larg, lin * cel), (40, 52, 60, 255))

    def poe(im, cx, cy):
        r = im.copy(); r.thumbnail((cel - 8, cel - 8), Image.NEAREST)
        folha.alpha_composite(r, (cx + 4, cy + 4))

    for i, (id_, t) in enumerate(feitos):
        gx, gy = (i % cols) * larg, (i // cols) * cel
        if antes:
            p = os.path.join(antes, id_ + '.png')
            if os.path.exists(p):
                poe(Image.open(p).convert('RGBA'), gx, gy)
            poe(t, gx + cel, gy)
        else:
            poe(t, gx, gy)
    folha.convert('RGB').save(saida)
    print('contato:', saida)


def main():
    argv = sys.argv[1:]
    opt = {}
    for k in ('--contato', '--antes'):
        if k in argv:
            i = argv.index(k); opt[k] = argv[i + 1]; del argv[i:i + 2]
    origem = argv[0] if argv else 'E:/Soulmon-assets/_lote-14-11/decoracao'
    destino = argv[1] if len(argv) > 1 else 'src/assets/decor'
    os.makedirs(destino, exist_ok=True)
    feitos, total, maior = [], 0, 0
    for nome, (id_, slot) in PECAS.items():
        src = os.path.join(origem, nome + '.png')
        if not os.path.exists(src):
            raise SystemExit(f'faltando: {src}')
        baixo = slot in ('floor-left', 'floor-right', 'trophy') or nome in ANCORA_BAIXO_EXTRA
        tela = instalar(src, slot, baixo)
        out = os.path.join(destino, id_ + '.png')
        tela.save(out, 'PNG', optimize=True)
        tam = os.path.getsize(out)
        total += tam; maior = max(maior, tam)
        feitos.append((id_, tela))
    print(f'instalado: {len(feitos)} peças em {destino}')
    print(f'{total/1024:.1f} KB no total; maior arquivo {maior/1024:.1f} KB (teto por imagem 400 KB)')
    if '--contato' in opt:
        contato(feitos, opt.get('--antes'), opt['--contato'])


if __name__ == '__main__':
    main()
