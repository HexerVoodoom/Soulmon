#!/usr/bin/env python3
"""
ARTE PROCEDURAL DO ELEMENTO PESADELO + 3 CENARIOS (15/10/2026, pedido do dono).

Gera, SEM modelo de imagem (so Pillow/numpy/scipy, deterministico por semente):
  src/assets/soulmon/pesadelo/el-pesadelo.png + fx-pesadelo-{cast,aura,slash,impact,defended,orb}.png  (128x128, alfa)
  src/assets/soulmon/bg/pesadelo-{abismo-glitch,corredor-impossivel,quarto-sem-fim}.png                (608x1080, opaco)
  <folha>  (folha de contato, opcional, fora do repo)

Estetica "meio sombra, meio aberracao 3D, meio glitch", PIXEL ART, paleta de pesadelo: preto #05080C, roxo-azulado
#3B2A7A/#763BFF, ciano #A9FBFF. Nenhum rosa/vermelho. Parte dos monstros ja existentes (alfa de dino-shadow-*.png e
dungeon-spirit.png: silhueta no cast, vigias da aura, estilhacos do impact, vultos dos cenarios).

Uso:  python scripts/gerar-pesadelo-arte.py [--folha E:/soulmon-pesadelo-arte/folha.png]
Rodar duas vezes seguidas produz bytes identicos (nenhum relogio, semente fixa por arquivo).
"""
import glob, math, os, random, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FXDIR = os.path.join(ROOT, 'src/assets/soulmon/pesadelo')
BGDIR = os.path.join(ROOT, 'src/assets/soulmon/bg')
SHADOWS = sorted(glob.glob(os.path.join(ROOT, 'src/assets/soulmon/dino/dino-shadow-*.png'))) + [os.path.join(ROOT, 'src/assets/soulmon/dungeon-spirit.png')]
N = 128

# paleta de pesadelo (sem rosa/vermelho; "magenta-escuro" = roxo profundo #4A1A7A)
K = (5, 8, 12); V0 = (14, 11, 38); V1 = (28, 20, 72); V2 = (59, 42, 122); V3 = (91, 52, 200); V4 = (118, 59, 255)
MG = (74, 26, 122); C0 = (18, 70, 110); C1 = (63, 200, 232); C2 = (127, 230, 255); C3 = (169, 251, 255); WH = (230, 254, 255)
PAL = np.array([K, V0, V1, V2, V3, V4, MG, C0, C1, C2, C3, WH], dtype=np.int32)


def snap(rgb):
    d = ((rgb[..., None, :].astype(np.int32) - PAL[None, None, :, :]) ** 2).sum(-1)
    return PAL[d.argmin(-1)].astype(np.uint8)


def darker(arr, f, rows):
    """SCANLINES: escurece (e re-ajusta a paleta) as linhas `rows` onde ha alfa."""
    a = arr.copy()
    ys = np.array(list(rows))
    sub = a[ys, :, :3].astype(np.float32) * f
    m = a[ys, :, 3] > 0
    sn = snap(sub.astype(np.int32))
    cur = a[ys, :, :3]
    cur[m] = sn[m]
    a[ys, :, :3] = cur
    return a


def blank(h=N, w=N):
    return np.zeros((h, w, 4), np.uint8)


def mask_of(fn, h=N, w=N):
    im = Image.new('L', (w, h), 0)
    fn(ImageDraw.Draw(im))
    return np.array(im) > 0


def paint(arr, mask, color):
    arr[mask] = (*color, 255)


def over(base, top):
    out = base.copy()
    m = top[..., 3] > 0
    out[m] = top[m]
    return out


def shift(arr, dx, dy):
    out = np.zeros_like(arr)
    h, w = arr.shape[:2]
    ys, yd = slice(max(0, -dy), min(h, h - dy)), slice(max(0, dy), min(h, h + dy))
    xs, xd = slice(max(0, -dx), min(w, w - dx)), slice(max(0, dx), min(w, w + dx))
    out[yd, xd] = arr[ys, xs]
    return out


def shiftm(mask, dx, dy):
    return shift(mask[..., None].astype(np.uint8), dx, dy)[..., 0] > 0


def outline(mask, n=1):
    return ndi.binary_dilation(mask, iterations=n) & ~mask


def extrude(arr, mask, depth, dx, dy, cols):
    """EXTRUSAO 3D FALSA: copias da silhueta deslocadas, cada vez mais escuras, ATRAS da peca."""
    under = blank(*arr.shape[:2])
    for k in range(depth, 0, -1):
        c = cols[min(len(cols) - 1, int((k - 1) * len(cols) / depth))]
        under[shiftm(mask, dx * k, dy * k)] = (*c, 255)
    return over(under, arr)


def chroma(arr, dx=2):
    """ABERRACAO CROMATICA: a silhueta em ciano (esq.) e roxo-magenta escuro (dir.) atras do original."""
    m = arr[..., 3] > 0
    ly = blank(*arr.shape[:2])
    ly[shiftm(m, dx, 0)] = (*MG, 255)
    ly[shiftm(m, -dx, 0)] = (*C1, 255)
    return over(ly, arr)


def tear(arr, rng, n, maxs, hmin=1, hmax=5, y0=0, y1=None):
    """FATIAMENTO HORIZONTAL: faixas de linhas deslocadas (glitch de varredura)."""
    out = arr.copy()
    h = arr.shape[0]
    y1 = h if y1 is None else y1
    for _ in range(n):
        y = rng.randrange(y0, max(y0 + 1, y1 - hmax))
        bh = rng.randint(hmin, hmax)
        s = rng.randint(-maxs, maxs)
        out[y:y + bh] = np.roll(out[y:y + bh], s, axis=1)
    return out


def noise_px(arr, rng, count, reach=3, cols=(C3, C1, V4, V3, K)):
    """RUIDO DE PIXEL / DADOS CORROMPIDOS: blocos 1-3 px colados na borda da peca."""
    out = arr.copy()
    m = arr[..., 3] > 0
    ring = ndi.binary_dilation(m, iterations=reach) & ~m
    ys, xs = np.nonzero(ring)
    if len(ys) == 0:
        return out
    for _ in range(count):
        i = rng.randrange(len(ys))
        w = rng.choice((1, 1, 2, 3))
        hh = rng.choice((1, 1, 2))
        out[ys[i]:ys[i] + hh, xs[i]:xs[i] + w] = (*rng.choice(cols), 255)
    return out


def silhouette(i, size):
    """Alfa de um monstro pesadelo existente, recortado e reescalado (nearest)."""
    im = Image.open(SHADOWS[i % len(SHADOWS)]).convert('RGBA')
    im = im.crop(im.getbbox())
    s = size / max(im.size)
    im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.NEAREST)
    a = np.array(im)
    a[..., 3] = np.where(a[..., 3] > 127, 255, 0)
    return a


def paste(dst, src, x, y):
    h, w = src.shape[:2]
    H, W = dst.shape[:2]
    for yy in range(h):
        for xx in range(w):
            if src[yy, xx, 3] and 0 <= y + yy < H and 0 <= x + xx < W:
                dst[y + yy, x + xx] = src[yy, xx]
    return dst


def finish(arr):
    arr = arr.copy()
    on = arr[..., 3] > 0
    arr[on, :3] = snap(arr[on, :3][None])[0]
    arr[..., 3] = np.where(on, 255, 0)
    arr[~on, :3] = 0
    return arr


def save(arr, name):
    os.makedirs(FXDIR, exist_ok=True)
    Image.fromarray(finish(arr)).save(os.path.join(FXDIR, name), optimize=True)


def eyes(arr, x, y, gap=7, col=C3):
    for dx in (0, gap):
        arr[y:y + 2, x + dx:x + dx + 3] = (*col, 255)
    return arr


# ───────────────────────────────────────────────── FX (128²)
def fx_icon():
    rng = random.Random(1001)
    a = blank()
    body = mask_of(lambda d: d.ellipse((-6, -53, 134, 87), fill=255)) & mask_of(lambda d: d.ellipse((-6, 41, 134, 181), fill=255))
    paint(a, outline(body, 2), V3)
    paint(a, body, K)
    for k in range(-5, 6):  # veias de wireframe radiais (3D falso)
        ang = k * 0.17
        for t in range(0, 60, 3):
            x = int(64 + t * math.cos(ang))
            y = int(64 + t * math.sin(ang) * 0.42)
            if 0 <= y < N and 0 <= x < N and body[y, x]:
                a[y, x] = (*V2, 255)
    iris = mask_of(lambda d: d.ellipse((42, 42, 86, 86), fill=255))
    paint(a, iris & body, C0)
    paint(a, outline(iris, 1) & body, C1)
    paint(a, mask_of(lambda d: d.ellipse((48, 48, 80, 80), fill=255)) & body, C1)
    paint(a, mask_of(lambda d: d.ellipse((52, 52, 76, 76), fill=255)) & body, C2)
    paint(a, mask_of(lambda d: d.polygon([(64, 40), (71, 64), (64, 88), (57, 64)], fill=255)), K)
    a[52:55, 54:58] = (*WH, 255)
    a = extrude(a, a[..., 3] > 0, 7, 2, 3, [V2, V1, V0])
    a = chroma(a, 2)
    a = tear(a, rng, 5, 7, 1, 4, 18, 110)
    return noise_px(a, rng, 40, 4)


def fx_cast():
    rng = random.Random(1002)
    a = blank()

    def ell(cy, rx, ry):
        return mask_of(lambda d: d.ellipse((64 - rx, cy - ry, 64 + rx, cy + ry), fill=255))

    top = ell(86, 56, 22)
    side = np.zeros((N, N), bool)
    for k in range(1, 9):  # tampas empilhadas = extrusao
        side |= ell(86 + k, 56, 22)
    paint(a, side, V1)
    paint(a, outline(side, 1), V0)
    paint(a, top, V0)
    paint(a, outline(top, 1), V3)
    inner = ell(86, 44, 16)
    paint(a, inner, K)
    paint(a, outline(inner, 1), V2)
    for t in np.linspace(0, 2 * math.pi, 220):  # anel de runas tracejado
        if int(t * 7) % 2 == 0:
            continue
        x = int(64 + 50 * math.cos(t))
        y = int(86 + 19 * math.sin(t))
        a[y, x] = (*C1, 255)
        a[y, min(N - 1, x + 1)] = (*C0, 255)
    for t in np.linspace(0, 2 * math.pi, 14, endpoint=False):  # marcas de dados corrompidos
        x = int(64 + 37 * math.cos(t))
        y = int(86 + 13 * math.sin(t))
        a[y:y + 2, x:x + rng.choice((2, 3, 4))] = (*rng.choice((C2, V4, C1)), 255)
    for t in range(0, 360, 30):  # raios de wireframe
        r = math.radians(t)
        for s in range(8, 40, 2):
            a[int(86 + s * 0.36 * math.sin(r)), int(64 + s * math.cos(r))] = (*V2, 255)
    sil = silhouette(8, 70)  # o pesadelo que sobe do circulo: silhueta existente, extrudada
    sm = blank()
    paste(sm, sil, 64 - sil.shape[1] // 2, 80 - sil.shape[0])
    a = over(a, extrude(sm, sm[..., 3] > 0, 5, 2, -1, [V2, V1, V0]))
    for _ in range(70):  # nevoa de pixels
        x = rng.randint(20, 108)
        y = rng.randint(30, 92)
        a[y:y + rng.choice((1, 2)), x:x + rng.choice((1, 2, 3))] = (*rng.choice((V2, V3, V1)), 255)
    a = tear(a, rng, 4, 6, 1, 3, 40, 100)
    a = chroma(a, 1)
    a = darker(a, 0.62, [y for y in range(60, 100) if y % 3 == 0])
    return noise_px(a, rng, 30, 3)


def fx_aura():
    rng = random.Random(1003)
    a = blank()
    cx, cy = 64, 66
    yy, xx = np.mgrid[0:N, 0:N]
    ang = np.arctan2((yy - cy) / 1.16, xx - cx)
    r = np.hypot(xx - cx, (yy - cy) / 1.16)
    ph = [rng.uniform(0, 6.28) for _ in range(3)]
    wob = 2.2 * np.sin(3 * ang + ph[0]) + 1.6 * np.sin(5 * ang + ph[1]) + 1.0 * np.sin(9 * ang + ph[2])
    rin = 43 + wob * 0.5
    rout = 51 + wob
    ring = (r >= rin) & (r <= rout)
    paint(a, ring, V1)
    paint(a, ring & (r >= rin + 1.5) & (r <= rout - 3), V2)
    paint(a, ring & (r <= rin + 1.2), V3)  # borda interna acesa
    paint(a, ring & (r >= rout - 1.2) & (np.sin(ang * 14) > 0.1), K)
    for _ in range(420):  # FUMACA DE PIXELS subindo pelas bordas
        t = rng.uniform(0, 6.28)
        base = 50 + 2 * math.sin(3 * t + ph[0])
        up = rng.expovariate(1 / 6.0)
        x = int(cx + (base + rng.uniform(0, 3)) * math.cos(t))
        y = int(cy + base * 1.16 * math.sin(t) - up * (1.2 if math.sin(t) < 0.3 else 0.4))
        if 0 <= x < N and 0 <= y < N and r[y, x] > rin[y, x] + 2:
            a[y:y + rng.choice((1, 2)), x:x + rng.choice((1, 2))] = (*rng.choice((V2, V1, V3, K)), 255)
    for k, t in enumerate((0.55, 2.3, 3.9, 5.5)):  # vigias: silhuetas dos monstros existentes
        s = silhouette(k * 3 + 1, 18)
        x = int(cx + 47 * math.cos(t)) - s.shape[1] // 2
        y = int(cy + 47 * 1.16 * math.sin(t)) - s.shape[0] // 2
        sm = blank()
        paste(sm, s, x, y)
        mm = sm[..., 3] > 0
        paint(a, outline(mm, 1), V4)
        a = over(a, sm)
    for _ in range(5):  # olhos ciano na fumaca
        t = rng.uniform(0, 6.28)
        ex = int(cx + 47 * math.cos(t))
        ey = int(cy + 47 * 1.16 * math.sin(t))
        a[ey:ey + 2, ex:ex + 2] = (*C3, 255)
    a = tear(a, rng, 7, 5, 1, 3)
    a = chroma(a, 1)
    a[r < rin - 2] = 0  # o miolo VAZADO, para o bicho ficar dentro
    return a


def crescent(c1, r1, c2, r2):
    return (mask_of(lambda d: d.ellipse((c1[0] - r1, c1[1] - r1, c1[0] + r1, c1[1] + r1), fill=255))
            & ~mask_of(lambda d: d.ellipse((c2[0] - r2, c2[1] - r2, c2[0] + r2, c2[1] + r2), fill=255)))


def fx_slash():
    rng = random.Random(1004)
    cr = crescent((50, 62), 50, (68, 78), 48)
    ex = blank()
    paint(ex, cr, K)
    paint(ex, ndi.binary_erosion(cr, iterations=2) & ~ndi.binary_erosion(cr, iterations=5), V2)
    paint(ex, outline(cr, 1), V3)
    rim = cr & ~shiftm(cr, 3, 3)  # gume de luz ciano ao longo da borda externa
    paint(ex, rim, C1)
    paint(ex, rim & ~shiftm(cr, 2, 2), C3)
    a = extrude(ex, cr, 5, 2, 2, [V2, V1, V0])
    a = tear(a, rng, 9, 9, 1, 5, 10, 120)
    a = chroma(a, 2)
    for _ in range(26):  # blocos corrompidos voando da ponta
        x = rng.randint(70, 124)
        y = rng.randint(4, 40)
        a[y:y + rng.choice((2, 3)), x:x + rng.choice((2, 3, 4, 6))] = (*rng.choice((C2, C1, V4, K, V3)), 255)
    eyes(a, 28, 92)  # o par de olhos na cauda
    return noise_px(a, rng, 25, 3)


def fx_impact():
    rng = random.Random(1005)
    cx = cy = 64
    pts = []
    n = 16
    for i in range(n * 2):
        t = i * math.pi / n + rng.uniform(-.07, .07)
        rad = rng.uniform(40, 60) if i % 2 == 0 else rng.uniform(13, 22)
        pts.append((cx + rad * math.cos(t), cy + rad * math.sin(t)))
    star = mask_of(lambda d: d.polygon(pts, fill=255))
    ex = blank()
    paint(ex, outline(star, 2), V3)
    paint(ex, star, K)
    mid = mask_of(lambda d: d.polygon([(cx + (p[0] - cx) * .62, cy + (p[1] - cy) * .62) for p in pts], fill=255))
    paint(ex, mid, V1)
    paint(ex, outline(mid, 1) & star, V4)
    core = mask_of(lambda d: d.polygon([(cx + (p[0] - cx) * .3, cy + (p[1] - cy) * .3) for p in pts], fill=255))
    paint(ex, core, C1)
    paint(ex, mask_of(lambda d: d.ellipse((57, 57, 71, 71), fill=255)), C3)
    paint(ex, mask_of(lambda d: d.ellipse((60, 60, 68, 68), fill=255)), WH)
    a = extrude(ex, star, 5, 2, 3, [V2, V1, V0])
    for _ in range(9):  # estilhacos: pedacos das silhuetas dos monstros, com contorno
        s = silhouette(rng.randrange(13), 40)
        h, w = s.shape[:2]
        sz = rng.choice((7, 9, 11))
        y0 = rng.randrange(0, max(1, h - sz))
        x0 = rng.randrange(0, max(1, w - sz))
        piece = s[y0:y0 + sz, x0:x0 + sz].copy()
        if piece.shape[0] < sz or piece.shape[1] < sz or (piece[..., 3] > 0).sum() < sz * sz * .4:
            piece = np.zeros((sz, sz, 4), np.uint8)
            piece[...] = (*K, 255)
        t = rng.uniform(0, 6.28)
        rad = rng.uniform(46, 60)
        x = int(cx + rad * math.cos(t) - sz / 2)
        y = int(cy + rad * math.sin(t) - sz / 2)
        sm = blank()
        piece[..., 3] = 255
        paste(sm, piece, max(0, min(N - sz, x)), max(0, min(N - sz, y)))
        mm = sm[..., 3] > 0
        paint(a, outline(mm, 1), rng.choice((V3, V4, C1)))
        a = over(a, sm)
    a = tear(a, rng, 8, 8, 1, 4, 8, 120)
    a = chroma(a, 2)
    return noise_px(a, rng, 45, 4)


def fx_defended():
    rng = random.Random(1006)
    hexm = mask_of(lambda d: d.polygon([(58, 8), (86, 26), (86, 100), (58, 120), (30, 100), (30, 26)], fill=255))
    ex = blank()
    paint(ex, outline(hexm, 2), V4)
    paint(ex, hexm, K)
    for k in range(-5, 6):  # grade em wireframe convergindo para um ponto de fuga
        for t in range(0, 70, 2):
            x = int(58 + t * 0.42 * math.cos(k * 0.52))
            y = int(64 + t * math.sin(k * 0.52))
            if 0 <= y < N and 0 <= x < N and hexm[y, x]:
                ex[y, x] = (*V3, 255)
    for r in (14, 26, 38, 50):
        for t in np.linspace(0, 2 * math.pi, 140):
            x = int(58 + r * 0.55 * math.cos(t))
            y = int(64 + r * math.sin(t))
            if 0 <= y < N and 0 <= x < N and hexm[y, x]:
                ex[y, x] = (*C1, 255) if r % 24 == 14 else (*V2, 255)
    a = extrude(ex, hexm, 7, -2, 1, [V2, V1, V0])
    for br in range(3):  # rachaduras em ciano claro
        px, py = 58.0, 64.0
        ang = rng.uniform(-1.2, 1.2) + br * 2.1
        for _ in range(16):
            ang += rng.uniform(-.7, .7)
            px += math.cos(ang) * 3
            py += math.sin(ang) * 3
            xi, yi = int(px), int(py)
            if 0 <= yi < N - 1 and 0 <= xi < N - 1 and hexm[yi, xi]:
                a[yi:yi + 2, xi:xi + 1] = (*C3, 255)
    for dy in (-1, 1):  # duas fagulhas defletidas
        for i in range(18):
            xx = 92 + i * 2
            yy = 56 + dy * i * 2
            if 0 <= xx < N - 2 and 0 <= yy < N - 2:
                a[yy:yy + 2, xx:xx + 2] = (*(WH if i < 4 else (C2 if i < 10 else C1)), 255)
    a = tear(a, rng, 6, 7, 1, 4, 5, 122)
    a = chroma(a, 2)
    return noise_px(a, rng, 30, 3)


def fx_orb():
    rng = random.Random(1007)
    a = blank()
    cx, cy, R = 90, 64, 20
    for _ in range(46):  # rastro: riscos horizontais afilados
        y = rng.randint(cy - 20, cy + 20)
        L = int(rng.uniform(20, 84) * (1 - abs(y - cy) / 26.0))
        x1 = cx - 10
        a[y:y + rng.choice((1, 2)), max(0, x1 - L):x1] = (*rng.choice((V2, V1, V3, V4)), 255)
    trail = a[..., 3] > 0
    paint(a, trail & (np.indices((N, N))[1] % 7 == 0), K)
    a = tear(a, rng, 12, 14, 1, 3, 30, 100)
    yy, xx = np.mgrid[0:N, 0:N]
    rr = np.hypot(xx - cx, yy - cy)
    ball = rr <= R
    ex = blank()
    paint(ex, outline(ball, 2), V4)
    paint(ex, ball, K)
    for rad in (8, 15):  # globo em wireframe (profundidade 3D falsa)
        paint(ex, ball & (np.abs(rr - rad) < 0.7), V2)
    for k in range(-2, 3):
        paint(ex, ball & (np.abs((xx - cx) - k * 8 * (1 - (yy - cy) ** 2 / (R * R + .01))) < 0.8), V1)
    paint(ex, ball & (rr > R - 3) & (xx > cx), V3)
    paint(ex, ball & (rr > R - 1.5) & (xx > cx + 3), C1)
    paint(ex, ball & (np.abs(yy - cy) < 2) & (np.abs(xx - cx) < 14), C2)  # o olho (fenda) ciano
    paint(ex, ball & (np.abs(yy - cy) < 1) & (np.abs(xx - cx) < 8), WH)
    paint(ex, ball & (np.abs(xx - (cx + 2)) < 1) & (np.abs(yy - cy) < 9), K)  # pupila
    a = over(a, extrude(ex, ball, 6, -3, 0, [V2, V1, V0]))
    a = tear(a, rng, 5, 5, 1, 3, 40, 90)
    a = chroma(a, 2)
    for _ in range(20):
        x = rng.randint(10, 74)
        y = rng.randint(30, 98)
        a[y:y + 2, x:x + rng.choice((2, 3, 4))] = (*rng.choice((C1, C3, V4)), 255)
    return noise_px(a, rng, 25, 3)


def make_fx():
    out = {'el-pesadelo.png': fx_icon(), 'fx-pesadelo-cast.png': fx_cast(), 'fx-pesadelo-aura.png': fx_aura(),
           'fx-pesadelo-slash.png': fx_slash(), 'fx-pesadelo-impact.png': fx_impact(),
           'fx-pesadelo-defended.png': fx_defended(), 'fx-pesadelo-orb.png': fx_orb()}
    for k, v in out.items():
        save(v, k)
    return out


# ───────────────────────────────────────────────── CENARIOS (152x270 -> x4 = 608x1080, pixel art)
BW, BH, SC = 152, 270, 4
BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0


def vnoise(rng, h, w, cell):
    g = np.array([[rng.random() for _ in range(w // cell + 2)] for _ in range(h // cell + 2)])
    im = Image.fromarray((g * 255).astype(np.uint8)).resize(((w // cell + 2) * cell, (h // cell + 2) * cell), Image.BICUBIC)
    return np.array(im)[:h, :w] / 255.0


def ramp(t, cols):
    """t em [0,1] -> cor da lista, com dither de Bayer 4x4 (pixel art)."""
    h, w = t.shape
    n = len(cols) - 1
    th = np.tile(BAYER, (h // 4 + 1, w // 4 + 1))[:h, :w]
    v = np.clip(t, 0, 0.9999) * n
    i = np.floor(v).astype(int)
    idx = np.where(v - i > th, i + 1, i)
    return np.array(cols, np.uint8)[np.clip(idx, 0, n)]


def finalize_bg(img, name):
    img = img.copy()
    img[::2] = snap((img[::2].astype(np.float32) * 0.82).astype(np.int32))  # scanlines
    big = np.repeat(np.repeat(img, SC, axis=0), SC, axis=1)
    Image.fromarray(big).save(os.path.join(BGDIR, name), optimize=True)
    return img


def bg_abismo():
    rng = random.Random(2001)
    yy, xx = np.mgrid[0:BH, 0:BW]
    n = vnoise(rng, BH, BW, 18) * .6 + vnoise(rng, BH, BW, 7) * .4
    vig = np.hypot((xx - BW / 2) / (BW / 2), (yy - BH * .62) / (BH * .55))
    img = ramp(np.clip(.08 + .55 * (1 - vig) * n + .12 * n, 0, 1), [K, V0, V1, V2, V3])
    pit = np.hypot((xx - BW / 2) / 34, (yy - BH * .64) / 14) < 1  # o vazio roxo que respira
    rim = (np.hypot((xx - BW / 2) / 36, (yy - BH * .64) / 15) < 1) & ~pit
    img[rim] = np.array(V4, np.uint8)
    img[pit] = np.array(K, np.uint8)
    for _ in range(46):  # chuva de dados
        x = rng.randrange(BW)
        y0 = rng.randrange(BH)
        L = rng.randint(8, 70)
        img[y0:y0 + L, x] = np.array(rng.choice((V2, V3, C0, C1, V2, V3)), np.uint8)
        if rng.random() < .3:
            img[y0 + L - 2:y0 + L, x] = np.array(C3, np.uint8)
    for _ in range(95):  # blocos corrompidos
        w = rng.choice((3, 5, 8, 13, 21))
        h = rng.choice((1, 2, 3, 5))
        x = rng.randrange(BW - w)
        y = rng.randrange(BH - h)
        img[y:y + h, x:x + w] = np.array(rng.choice((K, K, V0, V1, V2, V3, V4, C0, C1, MG)), np.uint8)
    for k in range(5):  # silhuetas perdidas no vazio (os monstros)
        s = silhouette(k * 2 + 1, rng.choice((26, 34, 42)))
        sm = np.zeros((BH, BW, 4), np.uint8)
        paste(sm, s, rng.randrange(8, BW - 50), rng.randrange(40, BH - 70))
        m = sm[..., 3] > 0
        img[outline(m, 1)] = np.array(V2, np.uint8)
        img[m] = sm[m][:, :3]
    for _ in range(34):  # fatiamento horizontal do quadro
        y = rng.randrange(BH - 8)
        h = rng.randint(1, 8)
        img[y:y + h] = np.roll(img[y:y + h], rng.randint(-14, 14), axis=1)
    bright = img.astype(np.int32).sum(-1) > 220  # separacao RGB onde ha luz
    r = np.where(bright, np.roll(img[..., 0], 2, axis=1), img[..., 0])
    b = np.where(bright, np.roll(img[..., 2], -2, axis=1), img[..., 2])
    img = snap(np.stack([r, img[..., 1], b], -1).astype(np.int32))
    return finalize_bg(img, 'pesadelo-abismo-glitch.png')


def line(img, x0, y0, x1, y1, c):
    n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
    for i in range(n + 1):
        t = i / max(n, 1)
        x = int(round(x0 + (x1 - x0) * t))
        y = int(round(y0 + (y1 - y0) * t))
        if 0 <= x < BW and 0 <= y < BH:
            img[y, x] = np.array(c, np.uint8)


def bg_corredor():
    rng = random.Random(2002)
    yy, xx = np.mgrid[0:BH, 0:BW]
    img = ramp(np.clip(.05 + .2 * (1 - np.abs(yy - 120) / 150), 0, 1), [K, V0, V1])
    vps = [(76, 118), (36, 176), (118, 80)]  # varios pontos de fuga: o corredor nao fecha
    for vi, (cx, cy) in enumerate(vps):
        cyc = [(V3, C1, C0), (V2, V3, V1), (V2, V4, V1)][vi]
        scale = [1.0, .5, .38][vi]
        w0, h0 = 150 * scale, 215 * scale
        frames = []
        for k in range(15):
            s = .84 ** k
            jx = math.sin(k * 1.7 + vi) * 3.5 * (1 - s) * 6
            jy = math.cos(k * 1.3 + vi) * 2.5 * (1 - s) * 6
            frames.append((cx + jx, cy + jy, w0 * s / 2, h0 * s / 2))
        for k, (fx, fy, hw, hh) in enumerate(frames):
            c = cyc[0] if k < 4 else cyc[1] if k < 9 else cyc[2]
            x0, x1, y0, y1 = int(fx - hw), int(fx + hw), int(fy - hh), int(fy + hh)
            line(img, x0, y0, x1, y0, c)
            line(img, x0, y1, x1, y1, c)
            line(img, x0, y0, x0, y1, c)
            line(img, x1, y0, x1, y1, c)
            if k > 0:  # arestas de profundidade ate o quadro anterior (wireframe)
                px, py, phw, phh = frames[k - 1]
                for sx, sy in ((-1, -1), (1, -1), (-1, 1), (1, 1)):
                    line(img, int(px + sx * phw), int(py + sy * phh), int(fx + sx * hw), int(fy + sy * hh), V2 if k % 2 else V1)
            if k % 3 == 1 and hw > 4:  # portas repetidas
                dx0, dx1, dy0 = int(fx - hw * .25), int(fx + hw * .25), int(fy + hh * .1)
                img[max(0, dy0):max(0, y1), max(0, dx0):max(0, dx1)] = np.array(K, np.uint8)
                line(img, dx0, dy0, dx1, dy0, C1)
                line(img, dx0, dy0, dx0, y1, V3)
                line(img, dx1, dy0, dx1, y1, V3)
        ex, ey = int(frames[-1][0]), int(frames[-1][1])  # um olho ao fundo de cada fuga
        img[ey:ey + 1, max(0, ex - 2):ex + 3] = np.array(C3, np.uint8)
    n = vnoise(rng, BH, BW, 12)
    img = np.where(n[..., None] > .86, np.array(V1, np.uint8), img)
    for _ in range(40):
        y = rng.randrange(BH - 6)
        h = rng.randint(1, 6)
        img[y:y + h] = np.roll(img[y:y + h], rng.randint(-10, 10), axis=1)
    for _ in range(40):
        w = rng.choice((2, 4, 6))
        x = rng.randrange(BW - w)
        img[rng.randrange(BH), x:x + w] = np.array(rng.choice((C1, V4, K)), np.uint8)
    return finalize_bg(snap(img.astype(np.int32)), 'pesadelo-corredor-impossivel.png')


def box(img, x, y, w, h, c):
    img[max(0, y):max(0, y + h), max(0, x):max(0, x + w)] = np.array(c, np.uint8)


def bg_quarto():
    rng = random.Random(2003)
    yy, xx = np.mgrid[0:BH, 0:BW]
    hor = int(BH * .72)  # horizonte BAIXO
    t = np.where(yy < hor, .06 + .5 * (yy / hor) ** 1.5, .05)
    img = ramp(np.clip(t, 0, 1), [K, V0, V1, V2])
    for k in range(1, 28):  # chao em fuga
        line(img, 0, hor + int(((k / 28.0) ** 1.9) * (BH - hor)), BW - 1, hor + int(((k / 28.0) ** 1.9) * (BH - hor)), V1)
    for k in range(-14, 15):
        line(img, 76 + k * 2, hor, 76 + k * 22, BH - 1, V1)
    for row in range(14):  # portas que se repetem para o infinito
        s = .8 ** row
        w = int(40 * s) + 2
        h = int(110 * s) + 3
        x = int(76 - w / 2 + math.sin(row * 1.1) * 10 * s)
        y = int(hor - h - 2 * row)
        box(img, x, y, w, h, V0)
        box(img, x, y, w, 1, V3)
        box(img, x, y, 1, h, V3)
        box(img, x + w - 1, y, 1, h, V2)
        if w > 8:
            box(img, x + 2, y + 2, max(1, w - 4), max(1, h - 3), K)
    box(img, 12, hor - 22, 46, 14, V1)  # cama
    box(img, 12, hor - 22, 46, 2, V3)
    box(img, 8, hor - 30, 6, 30, V0)
    box(img, 12, hor - 8, 3, 10, K)
    box(img, 55, hor - 8, 3, 10, K)
    box(img, 112, hor - 62, 30, 62, V0)  # guarda-roupa
    box(img, 112, hor - 62, 30, 2, V3)
    box(img, 126, hor - 60, 2, 60, K)
    for si, sz, fx, fy in [(7, 20, 66, hor - 72), (2, 52, 100, hor - 54), (9, 22, 22, hor - 25), (1, 24, 84, hor - 22)]:
        s = silhouette(si, sz)  # vultos: alfa dos pesadelos existentes
        sm = np.zeros((BH, BW, 4), np.uint8)
        paste(sm, s, fx, fy)
        m = sm[..., 3] > 0
        img[outline(m, 1)] = np.array(V2, np.uint8)
        img[m] = sm[m][:, :3]
        ys, xs = np.nonzero(m)
        if len(ys):
            ey = ys.min() + max(2, s.shape[0] // 6)
            ex = int(xs.mean()) - 2
            img[ey:ey + 1, ex:ex + 2] = np.array(C3, np.uint8)
            img[ey:ey + 1, ex + 4:ex + 6] = np.array(C3, np.uint8)
    th = np.tile(BAYER, (BH // 4 + 1, BW // 4 + 1))[:BH, :BW]
    for k, (cy, amp) in enumerate(((hor - 10, .55), (hor + 14, .5), (hor - 70, .3))):  # NEVOA
        nn = vnoise(rng, BH, BW, 14 + 6 * k)
        band = np.exp(-((yy - cy) / 15.0) ** 2) * amp * (0.4 + nn)
        img[band > th * .7 + .12] = np.array(V2 if k != 2 else V1, np.uint8)
    box(img, 75, 0, 1, 40, V2)  # lampada pendurada que falha
    box(img, 73, 40, 5, 3, C2)
    box(img, 74, 43, 3, 1, C0)
    for _ in range(26):
        y = rng.randrange(BH - 5)
        h = rng.randint(1, 5)
        img[y:y + h] = np.roll(img[y:y + h], rng.randint(-6, 6), axis=1)
    return finalize_bg(snap(img.astype(np.int32)), 'pesadelo-quarto-sem-fim.png')


def folha(fx, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    names = list(fx.keys())
    cell, pad, bgw = 256, 12, 304
    W = pad + len(names) * (cell + pad)
    H = pad * 3 + 2 * (cell + pad) + 540
    sheet = Image.new('RGBA', (W, H), (20, 16, 40, 255))
    d = ImageDraw.Draw(sheet)
    for i, n in enumerate(names):
        im = Image.fromarray(finish(fx[n])).resize((cell, cell), Image.NEAREST)
        for row, bg in enumerate(((10, 8, 26, 255), (70, 70, 80, 255))):
            tile = Image.new('RGBA', (cell, cell), bg)
            tile.alpha_composite(im)
            sheet.paste(tile, (pad + i * (cell + pad), pad + row * (cell + pad)))
        d.text((pad + i * (cell + pad) + 4, pad + 2), n.replace('.png', ''), fill=(169, 251, 255, 255))
    for i, n in enumerate(('pesadelo-abismo-glitch', 'pesadelo-corredor-impossivel', 'pesadelo-quarto-sem-fim')):
        im = Image.open(os.path.join(BGDIR, n + '.png')).convert('RGBA').resize((bgw, 540), Image.NEAREST)
        x, y = pad + i * (bgw + pad), pad * 2 + 2 * (cell + pad)
        sheet.paste(im, (x, y))
        d.text((x + 4, y + 4), n, fill=(169, 251, 255, 255))
    sheet.convert('RGB').save(path)


if __name__ == '__main__':
    fx = make_fx()
    os.makedirs(BGDIR, exist_ok=True)
    bg_abismo()
    bg_corredor()
    bg_quarto()
    if '--folha' in sys.argv:
        folha(fx, sys.argv[sys.argv.index('--folha') + 1])
    print('ok')
