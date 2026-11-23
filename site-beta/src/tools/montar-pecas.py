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
b = dura(nn(abrir('botao-beta'), 120, 40))
px = b.load(); W, H = b.size
plate = px[W // 2, H // 2]; meio = [px[W // 2, y] for y in range(H)]
def difere(c, r): return abs(c[0] - r[0]) + abs(c[1] - r[1]) + abs(c[2] - r[2]) + abs(c[3] - r[3]) > 40
orn = 0
for x in range(W // 2):
    if any(difere(px[x, y], meio[y]) for y in range(H)): orn = x
FATIA = orn + 2
for x in range(FATIA, W - FATIA):
    for y in range(H): px[x, y] = meio[y]
marca('botao', salvar(b, 'botao'), b.size, 'meio plano por coluna única; fatia maior que o ornamento medido', fatia=f'14 {FATIA}', borda=f'{14*2}px {FATIA*2}px', borda3=f'{14*3}px {FATIA*3}px')
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

# Popup e painel v2: placa opaca até o canto. Cantos da peça, bordas de uma fatia central, miolo plano.
def nove(nome, lado, c):
    o = abrir(nome); t = o.width // 8; W_, H_ = o.size
    i = Image.new('RGBA', (lado, lado), (15, 42, 41, 255))
    i.paste(nn(o.crop((0, 0, t, t)), c, c), (0, 0)); i.paste(nn(o.crop((W_ - t, 0, W_, t)), c, c), (lado - c, 0))
    i.paste(nn(o.crop((0, H_ - t, t, H_)), c, c), (0, lado - c)); i.paste(nn(o.crop((W_ - t, H_ - t, W_, H_)), c, c), (lado - c, lado - c))
    m = lado - 2 * c
    i.paste(nn(o.crop((W_ // 2, 0, W_ // 2 + 1, t)), m, c), (c, 0)); i.paste(nn(o.crop((W_ // 2, H_ - t, W_ // 2 + 1, H_)), m, c), (c, lado - c))
    i.paste(nn(o.crop((0, H_ // 2, t, H_ // 2 + 1)), c, m), (0, c)); i.paste(nn(o.crop((W_ - t, H_ // 2, W_, H_ // 2 + 1)), c, m), (lado - c, c))
    return dura(i)
for slot, nome, arq, lado, c in (('popup', 'popup-moldura-v2', 'popup', 72, 24), ('painel', 'painel-universo-v2', 'painel', 48, 16)):
    i = nove(nome, lado, c)
    marca(slot, salvar(i, arq), i.size, 'cantos e fatia central da peça v2, nearest, miolo plano #0F2A29', fatia=str(c), borda=f'{c}px')

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
# Capa desenhada pixel a pixel, na largura e na escala da barra: cristal, folhas, base de cobre.
CAPA = [
    '....cc......',
    '...cCCc.....',
    '...cCWc.gg..',
    '...cCCc.gGg.',
    '.gg.cc..gg..',
    'gGg.ca..g...',
    '.gg.ca.g....',
    '..gaaaag....',
    '.aLLLLLLa...',
    'aLMMMMMMMDa.',
    'aMMMMMMMMDa.',
    'aMMMMMMMMDa.',
]
COR = {'c': (23, 138, 128, 255), 'C': (95, 243, 224, 255), 'W': (233, 255, 251, 255), 'g': (46, 110, 52, 255), 'G': (111, 190, 84, 255), 'a': (138, 90, 43, 255), 'L': (235, 190, 132, 255), 'M': (198, 134, 66, 255), 'D': (150, 98, 46, 255), '.': (0, 0, 0, 0)}
cap = Image.new('RGBA', (12, 12))
for y, l in enumerate(CAPA):
    for x, ch_ in enumerate(l): cap.putpixel((x, y), COR[ch_])
marca('barraCapa', salvar(cap, 'barra-capa'), cap.size, 'desenhada pixel a pixel na grade da barra')

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
i = dura(nn(abrir('passo-3-v2'), 192, 192)); marca('passo3', salvar(i, 'passo-3'), i.size)
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
