"""Instala as 20 decorações sem arte (4 ruínas + 16 de elemento), a lanterna refeita e o ícone `prism`.

Uso:  python tools/instalar-decor-elementos.py [ORIGEM] [--contato ARQ.png] [--antes DIR]
  ORIGEM  padrão E:/Soulmon-assets/_lote-15-11/chatgpt-fila  (<id>.png, alfa real, 1254²)

Reusa `instalar()` de tools/instalar-decor-refeitas.py (caixa do espaço × escala, NEAREST, bbox do alfa,
`contain`, âncora embaixo no chão e centro na parede/tapete, faixa 3:1 -> 13:2 por janela de maior alfa).
A caixa de cada id vem de `utils/cosmeticosNovos.ts` (SLOT_FURN) e a escala de `DECOR_ART_SCALE`
(3, e 2 no tapete); o espaço de cada id é lido do código, não repetido aqui:
  - decoração nova  -> src/assets/decor/<id>.webp (sem perda; o glob de `cosmeticosNovos.ts` lê .webp)
  - lanterna        -> src/assets/decor/furn-lantern.png (mesmo id e formato; `decorArt.ts` importa o PNG)
  - prism           -> src/assets/soulmon/icons/materiais/prism.webp (128x128; `materialIcons.ts` troca o emoji)
Idempotente: a fonte é SEMPRE o PNG canônico da origem, nunca o arquivo já instalado.
"""
import sys, os, re, importlib.util
from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
spec = importlib.util.spec_from_file_location('refeitas', os.path.join(AQUI, 'instalar-decor-refeitas.py'))
refeitas = importlib.util.module_from_spec(spec)
spec.loader.exec_module(refeitas)

LANTERNA = 'E:/Soulmon-assets/_lote-14-11/decoracao/furn-lantern.png'
CAIXAS = {'floor-left': (56, 56), 'floor-right': (48, 52), 'rug': (104, 16), 'wall': (56, 40)}


def ler_slots():
    """id -> espaço, na ordem em que `cosmeticosNovos.ts` os monta (4 por tema; elementos alternam esquerdo/direito)."""
    src = open(os.path.join(RAIZ, 'src/utils/cosmeticosNovos.ts'), encoding='utf-8').read()
    nomes = re.search(r'const NOMES_FURN[^{]*\{(.*?)\n\};', src, re.S).group(1)
    ids = re.findall(r"'(furn-[a-z0-9-]+)':", nomes)
    elem = re.search(r'const ELEMENTOS[^{]*\{(.*?)\n\};', src, re.S).group(1)
    els = re.findall(r'(\w+): \[', elem)
    slots = {}
    temas = {}
    for i in ids:
        if i.startswith('furn-el-'):
            continue
        temas.setdefault(i.split('-')[1], []).append(i)
    for lista in temas.values():
        for n, i in enumerate(lista[:4]):
            slots[i] = ['floor-left', 'floor-right', 'rug', 'wall'][n]
    for n, el in enumerate(els):
        slots[f'furn-el-{el}'] = 'floor-left' if n % 2 == 0 else 'floor-right'
    return slots


def escala(slot):
    return 2 if slot == 'rug' else 3


def instalar_slot(src, slot):
    k = refeitas.K
    refeitas.K = escala(slot)
    try:
        return refeitas.instalar(src, slot, slot != 'rug' and slot != 'wall')
    finally:
        refeitas.K = k


def main():
    argv = sys.argv[1:]
    opt = {}
    for k in ('--contato', '--antes'):
        if k in argv:
            i = argv.index(k); opt[k] = argv[i + 1]; del argv[i:i + 2]
    origem = argv[0] if argv else 'E:/Soulmon-assets/_lote-15-11/chatgpt-fila'
    dec = os.path.join(RAIZ, 'src/assets/decor')
    refeitas.SLOTS.update(CAIXAS)
    ja = {f[:-5] for f in os.listdir(dec) if f.endswith('.webp')}
    feitos, total, maior = [], 0, 0
    for id_, slot in ler_slots().items():
        if id_ in ja:
            continue  # peça que já tem arte instalada não é tocada aqui
        src = os.path.join(origem, id_ + '.png')
        if not os.path.exists(src):
            raise SystemExit(f'faltando: {src}')
        tela = instalar_slot(src, slot)
        out = os.path.join(dec, id_ + '.webp')
        tela.save(out, 'WEBP', lossless=True, method=6)
        tam = os.path.getsize(out)
        total += tam; maior = max(maior, tam)
        feitos.append((id_, tela))
    print(f'decoracoes novas: {len(feitos)} em {dec}; {total/1024:.1f} KB; maior {maior/1024:.1f} KB')
    lant = instalar_slot(LANTERNA, 'floor-right')
    out = os.path.join(dec, 'furn-lantern.png')
    lant.save(out, 'PNG', optimize=True)
    print(f'lanterna: {os.path.getsize(out)/1024:.1f} KB')
    feitos.append(('furn-lantern', lant))
    icone = Image.open(os.path.join(origem, 'prism.png')).convert('RGBA')
    icone = icone.crop(refeitas.bbox_alfa(icone))
    lado = max(icone.size)
    quad = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
    quad.paste(icone, ((lado - icone.width) // 2, (lado - icone.height) // 2))
    # margem de 5 px como os outros ícones de material (ore: caixa 5..122)
    quad = quad.resize((118, 118), Image.LANCZOS)
    tela = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
    tela.paste(quad, (5, 5))
    quad = tela
    out = os.path.join(RAIZ, 'src/assets/soulmon/icons/materiais/prism.webp')
    quad.save(out, 'WEBP', quality=90, method=6)
    print(f'prism: {os.path.getsize(out)/1024:.1f} KB')
    if '--contato' in opt:
        refeitas.contato(feitos, opt.get('--antes'), opt['--contato'])


if __name__ == '__main__':
    main()
