#!/usr/bin/env python3
"""Instala a arte dos 50 elementos curados novos (212-261): sprites (4 formas), ícone, folha de FX e manifest.
Fonte: E:/Soulmon-assets/elementos-novos/lote{1,2,3}/ (sempre lida de lá). Idempotente.
- rookie -> novos-arquivo/combinados/NNN-slug.png (256x256, bbox escalada a 210, centrada, vizinho mais próximo)
- champion/ultimate/mega -> novos-arquivo/combinados-formas/NNN-slug-<forma>.png (sem consumidor no bundle)
- vazamento da referência (criatura minúscula no canto) é removido nas peças listadas em VAZAM
- ícone -> elementos/el-<id>.png (96x96); FX 3x2 -> fx-ataque/fx-<id>-{orb,slash,impact,cast,aura,aura-96,defended}.png
Uso: python tools/instalar-elementos-novos.py   (depois: node scripts/fx-facing.mjs; python scripts/element-visual.py)"""
import json, os, re, sys, importlib.util
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = 'E:/Soulmon-assets/elementos-novos'
ART = os.path.join(ROOT, 'src/assets/soulmon')
spec = importlib.util.spec_from_file_location('regfx', os.path.join(ROOT, 'tools/regerar-fx-cortados.py'))
regfx = importlib.util.module_from_spec(spec); spec.loader.exec_module(regfx)
NAMES = regfx.NAMES  # orb, slash, impact, cast, aura, defended (ordem row-major da folha 3x2)

VAZAM = {'arquiteto_da_realidade-mega', 'cataclismo-mega', 'cataclismo-ultimate', 'cavaleiro_absoluto-mega',
         'cavaleiro_absoluto-ultimate', 'ceifador_estelar-mega', 'genesis-mega', 'juizo_final-mega', 'leviata-mega',
         'leviata-ultimate', 'ragnarok-mega', 'renascimento-mega', 'senhor_da_praga-mega', 'sinfonia_do_caos-mega',
         'sopro_do_dragao-mega', 'sopro_do_dragao-ultimate', 'titano_forjado-mega'}

def lote_data():
    out = []
    for l in (1, 2, 3):
        t = open(os.path.join(ROOT, f'src/utils/elementosLote{l}.data.ts'), encoding='utf8').read()
        for m in re.finditer(r"\[\s*'(\d+)',\s*'(\w+)',\s*'([^']+)',([^\]]*)\]", t):
            comps = re.findall(r"'(\w+)'", m.group(4))
            out.append((l, m.group(1), m.group(2), m.group(3), comps))
    return out

def strip_leak(im):
    a = np.array(im.getchannel('A')) > 40
    k = 4; h = a.shape[0] // k * k; w = a.shape[1] // k * k
    m = a[:h, :w].reshape(h // k, k, w // k, k).any(axis=(1, 3))
    lab, n = ndi.label(ndi.binary_dilation(m, iterations=3))
    ar = [int(((lab == i) & m).sum()) for i in range(1, n + 1)]
    main = int(np.argmax(ar)) + 1
    kill = [i + 1 for i, v in enumerate(ar) if i + 1 != main and v >= 0.015 * ar[main - 1]]
    if not kill:
        return im, 0
    big = np.repeat(np.repeat(np.isin(lab, kill), k, 0), k, 1)
    arr = np.array(im); full = np.zeros(arr.shape[:2], bool); full[:big.shape[0], :big.shape[1]] = big
    arr[full] = 0
    return Image.fromarray(arr, 'RGBA'), len(kill)

def sprite256(im):
    im = im.crop(im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox())
    s = 210 / max(im.size)
    im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.NEAREST)
    t = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
    t.paste(im, ((256 - im.width) // 2, (256 - im.height) // 2), im)
    return t

def save(im, path, fmt='PNG'):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path, fmt, optimize=True)

def src_icon(l, i):
    return {1: f'{A}/lote1/icones/el-{i}.png', 2: f'{A}/lote2/icones-raw/{i}.png', 3: f'{A}/lote3/icone/el-{i}.png'}[l]

def src_fx(l, i):
    return {1: f'{A}/lote1/fx/fx-raw-{i}.png', 2: f'{A}/lote2/fx-raw/{i}.png', 3: f'{A}/lote3/fx-raw/{i}.png'}[l]

def main():
    rows = lote_data(); assert len(rows) == 50, len(rows)
    leaks = []
    for l, num, slug, name, comps in rows:
        for st in ('rookie', 'champion', 'ultimate', 'mega'):
            im = Image.open(f'{A}/lote{l}/soulmon/{slug}-{st}.png').convert('RGBA')
            if f'{slug}-{st}' in VAZAM:
                im, k = strip_leak(im)
                leaks.append(f'{slug}-{st}:{k}')
            o = sprite256(im)
            dst = f'{ART}/novos-arquivo/combinados/{num}-{slug}.png' if st == 'rookie' else f'{ART}/novos-arquivo/combinados-formas/{num}-{slug}-{st}.png'
            save(o, dst)
        ic = Image.open(src_icon(l, slug)).convert('RGBA')
        ic = ic.crop(ic.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox())
        s = 90 / max(ic.size); ic = ic.resize((max(1, round(ic.width * s)), max(1, round(ic.height * s))), Image.LANCZOS)
        t = Image.new('RGBA', (96, 96), (0, 0, 0, 0)); t.paste(ic, ((96 - ic.width) // 2, (96 - ic.height) // 2), ic)
        save(t, f'{ART}/elementos/el-{slug}.png')
        sheet = Image.open(src_fx(l, slug)).convert('RGBA')
        pcs = regfx.pieces(sheet)
        assert len(pcs) == 6, (slug, sorted(pcs))
        for c, n in zip(sorted(pcs), NAMES):
            f = regfx.finish(pcs[c])
            save(f, f'{ART}/fx-ataque/fx-{slug}-{n}.png')
            if n == 'aura':
                save(f.resize((96, 96), Image.LANCZOS), f'{ART}/fx-ataque/fx-{slug}-aura-96.png')
    # manifest
    mp = f'{ART}/novos-arquivo/manifest.json'
    man = json.load(open(mp, encoding='utf8'))
    man['combined'] = [c for c in man['combined'] if c['n'] <= 211]
    for l, num, slug, name, comps in rows:
        man['combined'].append({'n': int(num), 'file': f'combinados/{num}-{slug}.png', 'combination': slug.replace('_', ' ').title(),
                                'components': comps, 'name': name, 'lote': l})
    json.dump(man, open(mp, 'w', encoding='utf8', newline='\n'), ensure_ascii=False, indent=1)
    open(mp, 'a', encoding='utf8').write('\n')
    print('50 elementos instalados; vazamentos removidos:', ' '.join(leaks))

main()
