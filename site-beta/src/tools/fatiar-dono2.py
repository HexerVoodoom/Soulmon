# Fatia as folhas do dono (src/assets-dono) em peças RGBA (PNG em public/dono/_png; fatiar-dono.mjs converte para WebP).
# Fundo removido por máscara da forma: pixels de moldura (cobre, ciano, verde de cipó, contorno escuro) -> fechamento -> preenche buracos -> maior componente -> dilata p/ pegar o contorno.
# A folha dos passos (tríptico) segue em fatiar-dono.py. Rodar: python src/tools/fatiar-dono2.py && node src/tools/fatiar-dono.mjs
from PIL import Image
import numpy as np, os, cv2
from scipy import ndimage as ndi
A = 'src/assets-dono/'; O = 'src/assets-dono/_pecas/'
os.makedirs(O, exist_ok=True)

def carregar(nome): return Image.open(A + nome + '.png').convert('RGBA')
def lum(a): return 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]

def maior(m):
    lab, n = ndi.label(m)
    if n == 0: return m
    cont = ndi.sum(m, lab, range(1, n + 1)); return lab == (1 + int(np.argmax(cont)))

def mascara(a, modo, dil=3, fecha=9):
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    if modo == 'cobre':
        m = ((r > 175) & (r > b * 2)) | ((g > 110) & (b > 90) & (r < 120)) | ((g > 120) & (g > b * 1.3) & (r > 60) & (g > r * 0.9))
    elif modo == 'escuro':
        m = lum(a) < 105
    else:
        m = a[..., 3] > 110
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (fecha, fecha))
    m = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_CLOSE, k).astype(bool)
    m = ndi.binary_fill_holes(m)
    lab, n = ndi.label(m); cont = ndi.sum(m, lab, range(1, n + 1)) if n else []
    m = np.isin(lab, [i + 1 for i, v in enumerate(cont) if v >= max(300, 0.02 * max(cont))]) if n else m   # todos os pedaços grandes da moldura
    if dil: m = cv2.dilate(m.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (dil * 2 + 1, dil * 2 + 1))).astype(bool)
    return ndi.binary_fill_holes(m)

def peca(img, box, nome, modo='cobre', dil=3, fecha=9):
    c = np.array(img.crop(box))
    m = mascara(c, modo, dil, fecha)
    c[..., 3] = np.where(m, 255, 0)
    im = Image.fromarray(c); im = im.crop(im.getbbox())
    im.save(O + nome + '.png'); print(nome, im.size)

s = carregar('Pixel Art Scrollbar UI Asset Sheet')
peca(s, (930, 575, 1010, 935), 'barra-trilho', 'escuro', 2)
peca(s, (1018, 575, 1098, 935), 'barra-trilho-cheio', 'escuro', 2)
peca(s, (940, 55, 1062, 170), 'barra-capa', 'cobre', 3)
peca(s, (945, 360, 1040, 520), 'barra-no', 'cobre', 3)
peca(s, (1215, 355, 1312, 520), 'barra-no-aceso', 'cobre', 3)
v = carregar('Pixel-Art Vine Button State Sprite Sheet')
for nome, y0, y1 in [('normal', 4, 184), ('hover', 184, 358), ('pressionado', 358, 524), ('desabilitado', 524, 700)]:
    peca(v, (1360, y0, 1930, y1), 'botao-' + nome, 'alfa', 2, 5)
c = carregar('Copper-Teal Sci-Fi UI Sprite Sheet')
peca(c, (15, 120, 950, 855), 'painel-cobre', 'alfa', 0, 5)
for nome, y0, y1 in [('selecionada', 40, 135), ('hover', 135, 225), ('clicada', 225, 320), ('ativa', 320, 410), ('inativa', 410, 505)]:
    peca(c, (970, y0, 1265, y1), 'aba-' + nome, 'alfa', 0, 5)
f = carregar('Soulmon Alchemical Crystal Frame')
# moldura de cristal: apaga o miolo (triângulo/elipse de marca-d'água) para o texto do modal ficar limpo; cipó, cobre e cristal ficam
fa = np.array(f); fr, fg, fb = [fa[..., i].astype(int) for i in range(3)]
fv = (fg > fr * 1.1) & (fg > 130) & (fb < 90) & (fr > 90); fc = ((fg > 150) & (fb > 170)) | ((fr > 175) & (fr > fb * 2))
rg = np.zeros(fa.shape[:2], bool); rg[150:860, 225:1320] = True
kc = np.zeros(fa.shape[:2], bool); kc[700:, :340] = True
ap = rg & ~fv & ~(fc & kc)
fa[ap] = (11, 43, 47, 255)
f = Image.fromarray(fa)
peca(f, (100, 10, 1420, 960), 'moldura-cristal', 'cobre', 6, 15)
w = carregar('Soulmon Água Profile UI Sheet')
# ficha: apaga o miolo (lontra, texto, setas) para só a moldura servir; mantém cipó e o cristal do canto
wa = np.array(w); rr, gg, bb = [wa[..., i].astype(int) for i in range(3)]
vinha = (gg > rr * 1.1) & (gg > 130) & (bb < 90) & (rr > 90)
reg = np.zeros(wa.shape[:2], bool); reg[140:770, 160:1150] = True; reg[640:810, 130:340] = False
apaga = reg & ~vinha
yy = np.arange(wa.shape[0])[:, None] * np.ones((1, wa.shape[1]), int)
cristal = ((gg > 150) & (bb > 170)) | ((rr > 175) & (rr > bb * 2) & (yy >= 772))   # cristal do canto e a faixa de baixo; o cobre solto (resto do botão de seta, "(") sai
r2 = np.zeros(wa.shape[:2], bool); r2[620:810, 130:340] = True
apaga |= r2 & ~vinha & ~cristal
wa[apaga] = (11, 43, 47, 255)
w = Image.fromarray(wa)
peca(w, (70, 20, 1235, 850), 'moldura-ficha', 'cobre', 6, 15)
_m = np.array(Image.open(O + 'moldura-ficha.png')); _m[630:665, 250:280] = (11, 43, 47, 255); Image.fromarray(_m).save(O + 'moldura-ficha.png')   # grãos soltos do botão de seta da folha
for nome, x0, y0, x1, y1, md in [('seta-esq', 1280, 70, 1460, 195, 'cobre'), ('seta-dir', 1500, 70, 1680, 195, 'cobre'), ('seta-esq-hover', 1275, 210, 1470, 335, 'cobre'), ('seta-dir-hover', 1495, 210, 1690, 335, 'cobre'), ('seta-esq-inativa', 1280, 485, 1460, 605, 'escuro'), ('seta-dir-inativa', 1500, 485, 1680, 605, 'escuro')]:
    peca(w, (x0, y0, x1, y1), nome, md, 3)

# ---- 5. árvore: um nó (moldura de cobre) sem o texto da placa; conexões são redesenhadas em SVG no site ----
t = carregar('Pixel Evolution Tree_ Rookie to Ultra')
arr = np.array(t.crop((514, 292, 778, 580)))
arr[..., 3] = np.where(arr[..., 3] > 150, 255, 0)
arr = arr[:250]
arr[198:226, 70:194] = (14, 44, 48, 255)   # placa: apaga o texto interno (rótulo de estágio não aparece em material público)
im = Image.fromarray(arr); im = im.crop(im.getbbox()); im.save(O + 'arvore-no.png'); print('arvore-no', im.size)
