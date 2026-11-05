# Normaliza as peças geradas à grade (nearest, WebP sem perda) e monta à mão, por edição de pixel,
# as que precisam de 9-slice plano. Chamado por preparar-site-assets.mjs. Atualiza o manifesto.
import json, os
from collections import deque
from PIL import Image
G = 'E:/Soulmon-marketing/site-assets/'
PUB = 'public/site/'
M = 'src/content/assets.json'
os.makedirs(PUB, exist_ok=True)
man = json.load(open(M, encoding='utf8'))

def abrir(n, trim=True):
    i = Image.open(G + n + '.png').convert('RGBA')
    return i.crop(i.getchannel('A').point(lambda a: 255 if a > 40 else 0).getbbox()) if trim else i
def nn(i, w, h): return i.resize((w, h), Image.NEAREST)
def dura(i):  # alfa binário: tira o halo
    r, g, b, a = i.split(); return Image.merge('RGBA', (r, g, b, a.point(lambda v: 255 if v >= 128 else 0)))
def ilhas(i, minimo=0.02):  # descarta ruído solto
    a = i.getchannel('A'); w, h = i.size; px = a.load(); visto = set(); manter = set(); limite = minimo * w * h
    for y in range(h):
        for x in range(w):
            if px[x, y] and (x, y) not in visto:
                q = deque([(x, y)]); visto.add((x, y)); comp = []
                while q:
                    c = q.popleft(); comp.append(c)
                    for d in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        n = (c[0] + d[0], c[1] + d[1])
                        if 0 <= n[0] < w and 0 <= n[1] < h and px[n] and n not in visto: visto.add(n); q.append(n)
                if len(comp) >= limite: manter.update(comp)
    for y in range(h):
        for x in range(w):
            if px[x, y] and (x, y) not in manter: px[x, y] = 0
    i.putalpha(a); return i
def salvar(i, nome): i.save(PUB + nome + '.webp', lossless=True, quality=100, method=6); return f'/site/{nome}.webp'
def marca(slot, src, tam, montada=None, estado='aguarda-revisao', **extra):
    m = man[slot]; m.update(src=src, estado=estado, tamanho=list(tam), **extra)
    if montada: m['montadaAMao'] = montada
    else: m.pop('montadaAMao', None)

# Logo: à parte, com perda (não é peça de grade).
lg = abrir('logo-completo-alfa')
for w in (240, 480):
    lg.resize((w, round(w * lg.height / lg.width)), Image.LANCZOS).save(PUB + f'logo-{w}.webp', quality=68, method=6)
marca('logo', '/site/logo-480.webp', (480, round(480 * lg.height / lg.width)))

# Botão: 192 de largura; o meio vira uma coluna só, as pontas ficam.
b = dura(nn(abrir('botao-beta'), 192, 63))
px = b.load(); W, H = b.size
plate = px[W // 2, H // 2]; meio = [px[W // 2, y] for y in range(H)]
def difere(c, r): return abs(c[0] - r[0]) + abs(c[1] - r[1]) + abs(c[2] - r[2]) + abs(c[3] - r[3]) > 40
orn = 0
for x in range(W // 2):
    if any(difere(px[x, y], meio[y]) for y in range(H)): orn = x
FATIA = orn + 2
for x in range(FATIA, W - FATIA):
    for y in range(H): px[x, y] = meio[y]
marca('botao', salvar(b, 'botao'), b.size, 'meio plano por coluna única; fatia maior que o ornamento medido', fatia=f'20 {FATIA}', borda=f'20px {FATIA}px')
print('botao ornamento', orn, 'fatia', FATIA)

# Perfil da borda: do alto da coluna central do botão até a placa.
perfil = []
for c in meio:
    if c[3] == 0: continue
    if not difere(c, plate): break
    perfil.append(c)
perfil = perfil[:5]; p = len(perfil); print('perfil', p, 'placa', plate)

src = abrir('popup-moldura')
def canto(tam):
    s = src.width // 8
    return dura(nn(src.crop((0, 0, s, s)), tam, tam))
def moldura(lado, c, com_canto=True, aberta=False):
    i = Image.new('RGBA', (lado, lado), plate); a = i.load()
    for k, cor in enumerate(perfil):
        for t in range(lado):
            a[t, k] = cor; a[k, t] = cor; a[lado - 1 - k, t] = cor
            if not aberta: a[t, lado - 1 - k] = cor
    for k, cor in enumerate(perfil):  # refaz os cantos internos em quina
        for t in range(k, lado - k):
            a[t, k] = cor; a[k, t] = cor; a[lado - 1 - k, t] = cor
            if not aberta: a[t, lado - 1 - k] = cor
    if com_canto:
        ct = canto(c)
        for ang, pos in ((0, (0, 0)), (270, (lado - c, 0)), (90, (0, lado - c)), (180, (lado - c, lado - c))):
            r = ct.rotate(ang)
            i.alpha_composite(r, pos)
    return i
for slot, nome, lado, c, canto_on, aberta, fatia in (('popup', 'popup', 72, 24, True, False, 24), ('painel', 'painel', 48, 16, True, False, 16), ('aba', 'aba', 24, 8, False, True, 8), ('celula', 'celula', 24, 8, False, False, 8)):
    i = moldura(lado, c, canto_on, aberta)
    marca(slot, salvar(i, nome), i.size, 'perfil da borda do botão, placa plana' + (', cantos do popup-moldura' if canto_on else ''), fatia=str(fatia), borda=f'{fatia}px')

# Barra: linha mediana da peça gerada, sem folha, 12 de largura e altura uniforme: repete por construção.
bc = abrir('barra-corpo-v2')
colunas = []
for x in range(bc.width):
    v = sorted(bc.getpixel((x, y)) for y in range(0, bc.height, 7))
    colunas.append(v[len(v) // 2])
linha = Image.new('RGBA', (bc.width, 1)); linha.putdata(colunas)
linha = nn(linha, 12, 1)
corpo = nn(linha, 12, 8); marca('barraCorpo', salvar(corpo, 'barra-corpo'), corpo.size, 'mediana por coluna; sem folhas, uniforme')
ch = corpo.copy(); a = ch.load()
for y in range(8):
    for x in range(12):
        c = a[x, y]
        if c[3] and c[2] >= c[0]: a[x, y] = (95, 243, 224, 255)  # só o canal de vidro muda; silhueta idêntica
marca('barraCheio', salvar(ch, 'barra-cheio'), ch.size, 'barra-corpo com o canal preenchido, pixel a pixel')
cap = abrir('botao-beta').rotate(-90, expand=True)
cap = dura(nn(cap, 12, round(12 * cap.height / cap.width)).crop((0, 0, 12, 12)))
marca('barraCapa', salvar(cap, 'barra-capa'), cap.size, 'ponta do botão girada')

# Disco: sem halo.
d = ilhas(dura(nn(abrir('disco-v2'), 240, round(240 * abrir('disco-v2').height / abrir('disco-v2').width))), 0.01)
marca('disco', salvar(d, 'disco'), d.size, 'alfa limpo, sem halo', estado='aguarda-revisao')

# Cristais: a silhueta do aceso vale para os três.
ac = ilhas(dura(nn(abrir('cristal-aceso'), 48, 96)))
mask = ac.getchannel('A')
marca('cristalAceso', salvar(ac, 'cristal-aceso'), ac.size, 'ilhas de brilho removidas')
for slot, n in (('cristalApagado', 'cristal-apagado'), ('cristalAcendendo', 'cristal-acendendo')):
    i = nn(abrir(n), 48, 96); i.putalpha(mask)
    marca(slot, salvar(i, n), i.size, 'alfa trocado pela silhueta do aceso')

for slot, n in (('passo1', 'passo-1'), ('passo2', 'passo-2'), ('passo3', 'passo-3')):
    i = dura(nn(abrir(n), 192, 192)); marca(slot, salvar(i, n), i.size)
s = abrir('seta'); s = dura(nn(s, 48, round(48 * s.height / s.width)))
marca('seta', salvar(s, 'seta'), s.size)

json.dump(man, open(M, 'w', encoding='utf8'), ensure_ascii=False, indent=2)

# Prova de repetição e folha para olhar
f = Image.new('RGBA', (560, 300), (7, 20, 19, 255))
for k in range(3):
    f.alpha_composite(nn(corpo, 48, 32), (10, 10 + k * 32)); f.alpha_composite(nn(ch, 48, 32), (70, 10 + k * 32))
f.alpha_composite(nn(cap, 48, 48), (130, 10)); f.alpha_composite(b, (190, 10))
f.alpha_composite(nn(Image.open(PUB + 'popup.webp').convert('RGBA'), 144, 144), (190, 90)); f.alpha_composite(nn(Image.open(PUB + 'painel.webp').convert('RGBA'), 96, 96), (340, 90))
f.alpha_composite(nn(Image.open(PUB + 'celula.webp').convert('RGBA'), 48, 48), (450, 90)); f.alpha_composite(nn(Image.open(PUB + 'aba.webp').convert('RGBA'), 48, 48), (505, 90))
for k, n in enumerate(('cristal-apagado', 'cristal-acendendo', 'cristal-aceso')): f.alpha_composite(Image.open(PUB + n + '.webp').convert('RGBA'), (10 + k * 54, 120))
f.alpha_composite(d, (10, 225)); f.alpha_composite(s, (270, 240))
f.convert('RGB').save('E:/tmp/claude/b5f03034d35be1a5/3e00f769-6e4b-4482-9866-bd58d75f44a7/scratchpad/pecas.png')
