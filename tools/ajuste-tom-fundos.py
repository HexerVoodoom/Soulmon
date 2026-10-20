#!/usr/bin/env python3
"""Ajuste de tom dos fundos do Hall e do Laboratorio (W8a, 19/10/2026).

Pedido do dono: os fundos novos MISTURAM com os predios; deixar mais SEPARADO,
como nos outros mapas. Pos-processo deterministico (Pillow/numpy/scipy), sem
gerar imagem nova.

IDEMPOTENTE: a FONTE e SEMPRE o original guardado fora do repo
(ORIG_DIR). O PNG do repo e sobrescrito com adjust(original); rodar 2x da o
mesmo resultado. Nunca le o PNG ja ajustado do repo como entrada.

Uso:
  python tools/ajuste-tom-fundos.py medir      # metricas de todas as areas (le o repo)
  python tools/ajuste-tom-fundos.py aplicar    # grava os 2 fundos no repo + previas
"""
import io, json, sys, shutil
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
from skimage import color

REPO = Path(__file__).resolve().parent.parent
AREAS_DIR = REPO / 'src/assets/soulmon/areas'
OUT = Path('D:/Soulmon/_gemini_out/w5-arte-20261019')
ORIG_DIR = OUT / 'originais'
PREV_DIR = OUT / 'previas'
VW, VH = 360, 640

# (arte, left%, top%, width%) — espelha areaSheetCopy.ts / playAreaLots.ts
AREAS = {
    'mercado': ('bg-mercado.png', [
        ('lote-loja-itens', 26, 33, 38), ('lote-mercado-conquistas', 72, 29, 64),
        ('lote-loja-background', 26, 55, 38), ('lote-loja-decoracao', 72, 55, 42),
        ('lote-mercado-ferreiro', 26, 81, 44), ('lote-mercado-restaurante', 73, 81, 40)]),
    'arena': ('bg-arena.png', [
        ('lote-arena-torneio', 19, 49, 40), ('lote-arena-duelo', 68, 45, 44), ('lote-arena-guerra', 44, 74, 36)]),
    'exploracao': ('bg-exploracao.png', [
        ('lote-exploracao-masmorra', 24, 23, 52), ('lote-exploracao-passeio', 76, 37, 56),
        ('lote-exploracao-oficina-v3', 28, 86, 62), ('lote-exploracao-caderno-v3', 28, 54, 47)]),
    'jogos': ('bg-jogos.png', [
        ('lote-jogos-ppt', 44, 28, 52), ('lote-jogos-mente', 72, 63, 50), ('lote-jogos-refugio', 50, 92, 56)]),
    'laboratorio': ('bg-laboratorio.png', [
        ('lote-laboratorio-evolucao', 29, 66, 44), ('lote-laboratorio-pet', 71, 67, 48),
        ('lote-laboratorio-stats', 50, 40, 62), ('lote-laboratorio-perfil', 50, 89, 41),
        ('lote-hall-biblioteca', 17, 39, 32), ('lote-hall-amigos-terra', 83, 39, 32)]),
    'hall': ('bg-hall.png', [
        ('lote-arena-feira', 27, 44, 44), ('lote-hall-grove', 74, 44, 44), ('lote-hall-guilda-luz', 50, 73, 58)]),
}

# Parametros do ajuste (por area). Fonte unica de verdade.
PARAMS = {
    'laboratorio': dict(sat=0.85, lc=0.80, lc_sigma=10, gain=0.72, gamma=1.0, vig=0.16, blur=0.6, pool=0.62),
    'hall':        dict(sat=0.75, lc=0.90, lc_sigma=10, gain=0.70, gamma=1.0, vig=0.16, blur=1.0, pool=1.0),
}


def cover(img, w=VW, h=VH):
    s = max(w / img.width, h / img.height)
    nw, nh = round(img.width * s), round(img.height * s)
    r = img.resize((nw, nh), Image.LANCZOS)
    x, y = (nw - w) // 2, (nh - h) // 2
    return r.crop((x, y, x + w, y + h)), s, x, y


def lot_layers(lots):
    """[(alpha_mask float HxW, rgb float HxWx3, shadow float)] em coords da cena 360x640."""
    out = []
    for name, l, t, w in lots:
        art = Image.open(AREAS_DIR / f'{name}.png').convert('RGBA')
        bw = max(w / 100 * VW, 120)
        total = bw + 22
        x0 = l / 100 * VW - bw / 2
        y0 = t / 100 * VH - 0.8 * total
        sz = max(1, round(bw))
        a = art.resize((sz, sz), Image.LANCZOS)
        layer = Image.new('RGBA', (VW, VH), (0, 0, 0, 0))
        layer.alpha_composite(a, (round(x0), round(y0))) if (0 <= round(x0) and 0 <= round(y0) and round(x0) + sz <= VW and round(y0) + sz <= VH) else layer.paste(a, (round(x0), round(y0)))
        out.append((name, layer))
    return out


def compose(bg_scene, layers, shadow=True):
    base = bg_scene.convert('RGBA')
    for name, layer in layers:
        if shadow:  # drop-shadow(0 6px 6px rgba(0,0,0,.55)) do AreaScene
            al = layer.split()[3].filter(ImageFilter.GaussianBlur(3))
            sh = Image.new('RGBA', (VW, VH), (0, 0, 0, 0))
            sh.putalpha(al.point(lambda v: int(v * .55)))
            sh2 = Image.new('RGBA', (VW, VH), (0, 0, 0, 0)); sh2.paste(sh, (0, 6))
            base.alpha_composite(sh2)
        base.alpha_composite(layer)
    return base.convert('RGB')


def lab(rgb):
    return color.rgb2lab(np.asarray(rgb, dtype=np.float64) / 255.0)


def separation(bg_scene, layers):
    """Por lote: dE medio entre a borda interna do predio e o anel de fundo em volta."""
    L = lab(bg_scene)
    masks = {n: (np.asarray(l)[:, :, 3] > 128) for n, l in layers}
    anyfig = np.zeros((VH, VW), bool)
    for m in masks.values(): anyfig |= m
    keepout = ndi.binary_dilation(anyfig, iterations=3)
    res = {}
    for n, l in layers:
        m = masks[n]
        if m.sum() < 50: continue
        edge = m & ~ndi.binary_erosion(m, iterations=5)
        ring = ndi.binary_dilation(m, iterations=16) & ~ndi.binary_dilation(m, iterations=5) & ~keepout
        if ring.sum() < 50: continue
        rgb = np.asarray(l)[:, :, :3].astype(np.float64) / 255.0
        Lf = color.rgb2lab(rgb)
        fig_mean = Lf[edge].mean(0)
        ring_mean = L[ring].mean(0)
        d = fig_mean - ring_mean
        dE = float(np.sqrt((d ** 2).sum()))
        # fracao dos px da borda do predio que ficam "perto demais" do fundo (dE por px < 15 contra o anel medio)
        pix = np.sqrt(((Lf[edge] - ring_mean) ** 2).sum(1))
        res[n] = dict(dL=round(float(d[0]), 1), dC=round(float(np.hypot(fig_mean[1], fig_mean[2]) - np.hypot(ring_mean[1], ring_mean[2])), 1),
                      dE=round(dE, 1), blend=round(float((pix < 15).mean()), 3))
    return res


def bg_stats(img):
    a = np.asarray(img.convert('RGB'), dtype=np.float64) / 255.0
    hsv = color.rgb2hsv(a)
    Lc = color.rgb2lab(a)[:, :, 0]
    hp = Lc - ndi.gaussian_filter(Lc, 6)
    hue = hsv[:, :, 0] * 360
    purple = ((hue >= 262) & (hue <= 345) & (hsv[:, :, 1] > 0.15) & (hsv[:, :, 2] > 0.1)).mean()
    return dict(L=round(float(Lc.mean()), 1), sat=round(float(hsv[:, :, 1].mean()), 3),
                lcontrast=round(float(hp.std()), 2), purple_pct=round(float(purple * 100), 2))


def webp_kb(img):
    b = io.BytesIO(); img.save(b, 'WEBP', quality=85); return round(b.tell() / 1024, 1)


def adjust(orig, p, lots):
    """orig: PIL RGB 760x1344 ORIGINAL. Devolve PIL RGB ajustado. Deterministico."""
    a = np.asarray(orig.convert('RGB'), dtype=np.float64) / 255.0
    lab_ = color.rgb2lab(a)
    # 1) contraste local: puxa o detalhe de alta frequencia para a media local (plataformas seguem legiveis)
    for c in range(3):
        base = ndi.gaussian_filter(lab_[:, :, c], p['lc_sigma'])
        lab_[:, :, c] = base + p['lc'] * (lab_[:, :, c] - base)
    # 2) dessaturar (chroma a/b)
    lab_[:, :, 1:] *= p['sat']
    # 3) escurecer (ganho + gamma em L)
    Ln = np.clip(lab_[:, :, 0] / 100.0, 0, 1) ** p['gamma']
    lab_[:, :, 0] = Ln * 100.0 * p['gain']
    # 4) vinheta suave
    h, w = lab_.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.hypot((xx - w / 2) / (w / 2), (yy - h / 2) / (h / 2))
    vig = 1 - p['vig'] * np.clip(r - 0.35, 0, None) ** 1.5
    lab_[:, :, 0] *= vig
    # 4b) 'poca' de sombra: escurece (L) em volta de cada predio, com pena -- a luz cai onde o predio assenta
    if p.get('pool', 1) < 1:
        _, s0, ox0, oy0 = cover(orig)
        mp = np.zeros((h, w), np.float64)
        for name, l, t, wd in lots:
            bw = max(wd / 100 * VW, 120)
            x0 = l / 100 * VW - bw / 2
            y0 = t / 100 * VH - 0.8 * (bw + 22)
            cx, cy = (x0 + bw / 2 + ox0) / s0, (y0 + bw * 0.5 + oy0) / s0
            rx, ry = bw * 0.7 / s0, bw * 0.65 / s0
            mp = np.maximum(mp, np.clip(1 - (((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2), 0, 1))
        mp = ndi.gaussian_filter(mp, 14)
        lab_[:, :, 0] *= 1 - (1 - p['pool']) * mp
    out = np.clip(color.lab2rgb(lab_), 0, 1)
    img = Image.fromarray((out * 255 + 0.5).astype(np.uint8))
    # 5) blur gaussiano leve onde ficam os predios (mascara = caixa de cada lote em coords do fundo, com pena)
    if p['blur'] > 0:
        s, ox, oy = None, None, None
        _, s, ox, oy = cover(orig)
        m = np.zeros((h, w), np.float64)
        for name, l, t, wd in lots:
            bw = max(wd / 100 * VW, 120)
            total = bw + 22
            x0 = l / 100 * VW - bw / 2
            y0 = t / 100 * VH - 0.8 * total
            cx, cy = (x0 + bw / 2 + ox) / s, (y0 + bw * 0.5 + oy) / s
            rx, ry = bw * 0.62 / s, bw * 0.58 / s
            m = np.maximum(m, np.clip(1 - (((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2), 0, 1) ** 0.5)
        m = ndi.gaussian_filter(m, 18)
        bl = np.asarray(img.filter(ImageFilter.GaussianBlur(p['blur'] / s * 0.5)), dtype=np.float64)
        arr = np.asarray(img, dtype=np.float64)
        img = Image.fromarray(np.clip(arr * (1 - m[:, :, None]) + bl * m[:, :, None] + 0.5, 0, 255).astype(np.uint8))
    return img


def scene(bgimg, lots):
    bg_scene, *_ = cover(bgimg)
    layers = lot_layers(lots)
    return bg_scene, layers


def report(source_for):
    rows = {}
    for area, (bgf, lots) in AREAS.items():
        bgimg = source_for(area, bgf)
        bgs, layers = scene(bgimg, lots)
        rows[area] = dict(bg=bg_stats(bgimg), sep=separation(bgs, layers))
    return rows


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else 'medir'
    ORIG_DIR.mkdir(parents=True, exist_ok=True)
    PREV_DIR.mkdir(parents=True, exist_ok=True)

    def orig_of(area, bgf):  # fonte SEMPRE o original quando existe
        o = ORIG_DIR / bgf
        return Image.open(o).convert('RGB') if o.exists() else Image.open(AREAS_DIR / bgf).convert('RGB')

    if mode == 'tentar':  # tentar <area> '{json params}' : so mede e grava previa em E:/tmp, nao toca o repo
        area = sys.argv[2]; p = dict(PARAMS[area]); p.update(json.loads(sys.argv[3]))
        bgf, lots = AREAS[area]
        orig = orig_of(area, bgf)
        new = adjust(orig, p, lots)
        b0, l0 = scene(orig, lots); b1, l1 = scene(new, lots)
        side = Image.new('RGB', (VW * 2 + 12, VH), (20, 20, 20))
        side.paste(compose(b0, l0), (0, 0)); side.paste(compose(b1, l1), (VW + 12, 0))
        side.save(f'E:/tmp/try-{area}.png')
        sp = separation(b1, l1)
        print(bg_stats(new), webp_kb(new)); print({k[5:]: (v['dE'], v['dL'], v['blend']) for k, v in sp.items()})
        return
    if mode == 'medir':
        rows = report(orig_of)
        print(json.dumps(rows, indent=1, ensure_ascii=False))
        return

    # W12 (20/10/2026): os fundos do Laboratorio e do Hall foram SUBSTITUIDOS (`tools/instalar-w12.py`) e o dono pediu SEM o efeito de escurecer.
    # Este ajuste nao se aplica mais a eles: rodar `aplicar` regravaria os fundos W5 escurecidos por cima dos novos.
    print('aplicar desativado: fundos do Lab/Hall sao os da W12 (sem ajuste de tom); ver tools/instalar-w12.py')
    return
    for area in ('laboratorio', 'hall'):
        bgf, lots = AREAS[area]
        o = ORIG_DIR / bgf
        if not o.exists():
            shutil.copy2(AREAS_DIR / bgf, o)  # guarda o original UMA vez (fora do repo)
    result = {}
    for area in ('laboratorio', 'hall'):
        bgf, lots = AREAS[area]
        orig = Image.open(ORIG_DIR / bgf).convert('RGB')
        new = adjust(orig, PARAMS[area], lots)
        new.save(AREAS_DIR / bgf, optimize=True)
        new = Image.open(AREAS_DIR / bgf).convert('RGB')
        b0, l0 = scene(orig, lots); b1, l1 = scene(new, lots)
        before, after = compose(b0, l0), compose(b1, l1)
        side = Image.new('RGB', (VW * 2 + 12, VH), (20, 20, 20))
        side.paste(before, (0, 0)); side.paste(after, (VW + 12, 0))
        side.save(PREV_DIR / f'ajuste-tom-{area}.png')
        result[area] = dict(antes=dict(bg=bg_stats(orig), sep=separation(b0, l0), webp_kb=webp_kb(orig)),
                            depois=dict(bg=bg_stats(new), sep=separation(b1, l1), webp_kb=webp_kb(new)))
    print(json.dumps(result, indent=1, ensure_ascii=False))


if __name__ == '__main__':
    main()
