"""Instala as peças de Honra (lote 14-11/2026) em src/assets/decor/<id>.webp.

Uso:  python tools/instalar-honra-decor.py [ORIGEM] [DESTINO] [--contato ARQUIVO.png]
  ORIGEM  padrão E:/Soulmon-assets/_lote-14-11/honra  (pastas por categoria, hon-*.png)
  DESTINO padrão src/assets/decor

Regras (docs/PLANO-HONRA-DECORACAO.md §4.2, utils/cosmeticosNovos.ts › DECOR_ART_SCALE):
  · o arquivo instalado é a CAIXA do espaço × 3 (× 2 no `rug`), alfa real, reduzido com NEAREST;
  · a peça é recortada na bounding box do alfa e encaixada SEM deformar: ancorada embaixo (chão),
    centralizada (parede, vitrine alta, tapete);
  · o tapete (3:2) é RECORTADO para a faixa 13:2 por projeção de linhas (a janela de altura w·2/13
    com mais alfa), nunca por grade fixa;
  · entram bronze, prata, ouro (envelhecido escuro, refeito em 15/11/2026), mithril e os cristais
    (`cristal-turquesa`, `cristal-irisdescente`); ficam fora `_v1*`, `_piloto*`, `_tmp*` (são subpastas,
    o glob não desce nelas) e `*.SEM-ALFA.png`.
Idempotente: a fonte é SEMPRE o PNG canônico da origem, nunca o webp já instalado.
"""
import sys, os, glob
from PIL import Image

# categoria -> (espaço, caixa w, caixa h, escala de instalação)
CAT = {
    'arma': ('wall', 56, 40, 3), 'estandarte': ('wall', 56, 40, 3),
    'estatua': ('floor-left', 56, 56, 3), 'manequim': ('floor-left', 56, 56, 3),
    'bigorna': ('floor-right', 48, 52, 3), 'chao': ('floor-right', 48, 52, 3),
    'pedestal': ('trophy', 46, 50, 3), 'tapete': ('rug', 104, 16, 2),
}
ANCORA = {'floor-left': 'baixo', 'floor-right': 'baixo', 'trophy': 'baixo', 'wall': 'centro', 'rug': 'centro'}
THR = 8  # alfa acima disto conta como "tem peça"


def bbox_alfa(im):
    return im.getchannel('A').point(lambda v: 255 if v > THR else 0).getbbox()


def faixa_do_tapete(im, razao):
    """Corta a janela horizontal de altura w/razao com mais massa de alfa (projeção de linhas)."""
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


def instalar(src, slot, caixa_w, caixa_h, k):
    im = Image.open(src).convert('RGBA')
    b = bbox_alfa(im)
    if not b:
        raise SystemExit(f'sem alfa real: {src}')
    im = im.crop(b)
    cw, ch = caixa_w * k, caixa_h * k
    if slot == 'rug':
        im = faixa_do_tapete(im, cw / ch)
    esc = min(cw / im.width, ch / im.height)
    nw, nh = max(1, round(im.width * esc)), max(1, round(im.height * esc))
    peca = im.resize((nw, nh), Image.NEAREST)
    tela = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    x = (cw - nw) // 2
    y = ch - nh if ANCORA[slot] == 'baixo' else (ch - nh) // 2
    tela.paste(peca, (x, y))
    return tela


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    contato = None
    if '--contato' in sys.argv:
        contato = sys.argv[sys.argv.index('--contato') + 1]
        args = [a for a in args if a != contato]
    origem = args[0] if args else 'E:/Soulmon-assets/_lote-14-11/honra'
    destino = args[1] if len(args) > 1 else 'src/assets/decor'
    os.makedirs(destino, exist_ok=True)
    feitos, total, por_cat, maior = [], 0, {}, 0
    for cat, (slot, bw, bh, k) in CAT.items():
        for f in sorted(glob.glob(os.path.join(origem, cat, 'hon-*.png'))):
            nome = os.path.basename(f)
            if 'SEM-ALFA' in nome:
                continue
            id_ = nome[:-4]
            out = os.path.join(destino, id_ + '.webp')
            tela = instalar(f, slot, bw, bh, k)
            tela.save(out, 'WEBP', quality=90, alpha_quality=100, method=6)
            tam = os.path.getsize(out)
            total += tam; maior = max(maior, tam)
            por_cat[cat] = por_cat.get(cat, 0) + 1
            feitos.append((id_, tela))
    print('instalado:', ', '.join(f'{c} {n}' for c, n in por_cat.items()), f'= {len(feitos)} peças')
    print(f'{total/1024:.1f} KB no total; maior arquivo {maior/1024:.1f} KB (teto por imagem 400 KB)')
    if contato and feitos:
        cols = 8; cel = 200
        lin = (len(feitos) + cols - 1) // cols
        folha = Image.new('RGBA', (cols * cel, lin * cel), (40, 52, 60, 255))
        for i, (_, t) in enumerate(feitos):
            r = t.copy(); r.thumbnail((cel - 8, cel - 8), Image.NEAREST)
            folha.alpha_composite(r, ((i % cols) * cel + 4, (i // cols) * cel + 4))
        folha.convert('RGB').save(contato)
        print('contato:', contato)


main()
