"""Miniaturas dos cenarios para o fundo do LCD do widget V-Pet.
Le src/utils/backgrounds.ts (id -> arte), reduz para 360x194 (proporcao do LCD) e grava
android/app/src/main/res/drawable-nodpi/vpet_bg_<id com _>.webp. Cenario sem arte pintada (gradiente) e ignorado.
Rodar: python scripts/gen-widget-backgrounds.py (idempotente; a fonte e sempre a arte atual)."""
import os, re
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, 'src/utils/backgrounds.ts'), encoding='utf8').read()
imports = dict(re.findall(r"import (\w+) from '([^']+)'", src))
out = os.path.join(ROOT, 'android/app/src/main/res/drawable-nodpi')
n = 0
for m in re.finditer(r"'(bg-[a-z0-9-]+)': \{(.*?)\n  \},", src, re.S):
    bid, body = m.groups()
    v = re.search(r"css: `url\(\$\{(\w+)\}\)`", body)
    if not v or v.group(1) not in imports:
        continue
    f = os.path.normpath(os.path.join(ROOT, 'src/utils', imports[v.group(1)].split('?')[0]))
    im = Image.open(f).convert('RGB').resize((360, 194), Image.LANCZOS)
    im.save(os.path.join(out, 'vpet_bg_' + bid.replace('-', '_') + '.webp'), 'WEBP', quality=78, method=6)
    n += 1
# Cenarios-alias (artAliases.ts: outro id, mesma pintura): copia a miniatura da arte de origem.
import shutil
al = open(os.path.join(ROOT, 'src/utils/artAliases.ts'), encoding='utf8').read()
for bid, frm in re.findall(r"'(bg-[a-z0-9-]+)': \{ from: '(bg-[a-z0-9-]+)'", al):
    a = os.path.join(out, 'vpet_bg_' + frm.replace('-', '_') + '.webp')
    if os.path.exists(a):
        shutil.copyfile(a, os.path.join(out, 'vpet_bg_' + bid.replace('-', '_') + '.webp')); n += 1
print(n, 'miniaturas')
