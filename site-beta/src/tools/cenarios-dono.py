# Cenários do dono (src/assets-dono): fundos de seção (AVIF/WebP em 2 larguras) e as 3 ilhas da grade de arenas com alfa (a de lava/forja, com roda e bigorna, fica de fora).
from PIL import Image
import numpy as np, cv2, os
from scipy import ndimage as ndi
A = 'src/assets-dono/'; O = 'public/dono/'
T = 'src/assets-dono/_pecas/'
for nome, saida in [('Moonlit Mossy Atelier Ruins', 'cen-atelier'), ('Neon Soulmon Island Terraces', 'cen-ilhas'), ('Neon Circuit Crystal Arena', 'cen-circuito')]:
    im = Image.open(A + nome + '.png').convert('RGB')
    for w in (800, 1400):
        im.resize((w, round(im.height * w / im.width)), Image.LANCZOS).save(T + f'{saida}-{w}.png')
g = np.array(Image.open(A + 'Soulmon Elemental Arenas Grid.png').convert('RGB'))
H, W = g.shape[:2]
quad = {'arena-bosque': (0, 0, W // 2, H // 2), 'arena-salao': (0, H // 2, W // 2, H), 'arena-lab': (W // 2, H // 2, W, H)}
for nome, (x0, y0, x1, y1) in quad.items():
    c = g[y0:y1, x0:x1].copy()
    mx, mn = c.max(2).astype(int), c.min(2).astype(int)
    claro = (mn > 205) & (mx - mn < 28)        # branco / xadrez claro do fundo
    lab, n = ndi.label(claro)
    borda = set(lab[0, :]) | set(lab[-1, :]) | set(lab[:, 0]) | set(lab[:, -1]); borda.discard(0)
    fundo = np.isin(lab, list(borda))
    forma = ndi.binary_fill_holes(~fundo)
    lab2, n2 = ndi.label(forma); cont = ndi.sum(forma, lab2, range(1, n2 + 1)); forma = lab2 == (1 + int(np.argmax(cont)))
    forma = cv2.erode(forma.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)   # tira a franja branca
    rgba = np.dstack([c, np.where(forma, 255, 0).astype(np.uint8)])
    im = Image.fromarray(rgba); im = im.crop(im.getbbox()); im.save(T + nome + '.png'); print(nome, im.size)
