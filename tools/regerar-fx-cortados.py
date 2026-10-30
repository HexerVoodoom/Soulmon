"""Regera as pecas de src/assets/soulmon/fx-ataque/ que sairam cortadas ou com FRAGMENTO DE VIZINHA.
Causas (29-30/10/2026):
  1. slice_fase2.py cortava a folha em 3 colunas iguais (grade fixa): o que cruza a divisa vira corte reto na peca e
     um caco solto na peca ao lado (ex.: a ponta da cabeca do orb aparecia a esquerda do crescente `slash`).
  2. a 1a regeracao (c3875bb75) fatiava por componente conexo mas atribuia CADA fragmento pelo centroide: caco perto da
     divisa continuava na celula errada.
Aqui: a folha e fatiada por componente conexo (dilatado); so os componentes GRANDES ancoram a celula (centroide); todo
fragmento vai para a ancora MAIS PROXIMA. Layout da folha: 3x2 (linha de 6 se a folha for larga). Cada peca instalada e
casada com a peca da folha de mesmo formato/cor (qualquer folha candidata) - a peca so e trocada se o casamento e
inequivoco e a nova e mais limpa (menos fragmentos soltos, sem corte reto).
Fonte: SEMPRE as folhas ORIGINAIS em E:/Soulmon-assets (nunca o PNG canonico nem backup dele). Idempotente: rodar duas
vezes e no-op na segunda.
Convencao de saida (medida nas pecas integras): maior lado = 118 px, centrada em 128x128, LANCZOS, alfa normalizado
(<=24 -> 0, >=232 -> 255). aura-96 = reescala da aura 128.
Uso: python tools/regerar-fx-cortados.py [--dry] [--so id1,id2] [--pasta-relatorio dir]"""
import glob, os, re, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DST = os.path.join(ROOT, 'src/assets/soulmon/fx-ataque')
A = 'E:/Soulmon-assets'
NAMES = ['orb', 'slash', 'impact', 'cast', 'aura', 'defended']
FIT = 118
# Casamentos reprovados a olho (a peca nova veio com vizinha colada ou com outro desenho): ficam como estao -> lista de regeracao.
SKIP = set()  # as 3 pecas antes reprovadas foram refeitas a mao (2026-10-30, recorte guiado da folha original)


def cands(e):
    out = sorted(glob.glob(f'{A}/entrada-dono/fx-{e}-refazer/*.png')) + sorted(glob.glob(f'{A}/entrada-dono/fx-{e}/*folha*.png'))
    for p in (f'{A}/beta3-geradas/elementos-novos/_raw/fx-{e}.png', f'{A}/beta3-geradas/fase2-ataques/_raw/{e}.png'):
        if os.path.exists(p):
            out.append(p)
    return out


def layout(img):
    return (6, 1) if img.width / img.height > 1.7 else (3, 2)


def pieces(img):
    """-> {indice_da_celula: Image RGBA}. Ancoras grandes por centroide; fragmentos para a ancora mais proxima."""
    ncol, nrow = layout(img)
    arr0 = np.array(img)
    a = arr0[..., 3]
    h, w = a.shape
    m = a > 24
    h2, w2 = h // 2, w // 2
    m2 = m[:h2 * 2, :w2 * 2].reshape(h2, 2, w2, 2).any(axis=(1, 3))
    lab2, n = ndi.label(ndi.binary_dilation(m2, iterations=4))
    lab = np.zeros((h, w), int)
    lab[:h2 * 2, :w2 * 2] = np.repeat(np.repeat(lab2, 2, 0), 2, 1)
    lab[~m] = 0
    cw, chh = w / ncol, h / nrow
    info = {}
    for k in range(1, n + 1):
        ys, xs = np.nonzero(lab == k)
        if len(xs) < 40:
            continue
        wt = a[ys, xs].astype(float)
        cx, cy = (xs * wt).sum() / wt.sum(), (ys * wt).sum() / wt.sum()
        info[k] = (len(xs), min(nrow - 1, int(cy // chh)) * ncol + min(ncol - 1, int(cx // cw)))
    if not info:
        return {}
    big = max(v[0] for v in info.values())
    anchors = {}
    for k, (ar, c) in info.items():
        if ar >= 0.05 * big:
            anchors.setdefault(c, []).append(k)
    dist = {c: ndi.distance_transform_edt(~np.isin(lab, ks)) for c, ks in anchors.items()}
    assign = {}
    for k, (ar, c) in info.items():
        if any(k in ks for ks in anchors.values()):
            assign[k] = c
            continue
        ys, xs = np.nonzero(lab == k)
        assign[k] = min(dist, key=lambda cc: dist[cc][ys, xs].min())
    dm = ndi.binary_dilation(m, iterations=2)
    out = {}
    for c in anchors:
        mine = np.isin(lab, [k for k, cc in assign.items() if cc == c])
        other = np.isin(lab, [k for k, cc in assign.items() if cc != c])
        sel = ndi.binary_dilation(mine, iterations=2) & dm & ~other
        arr = arr0.copy()
        arr[~sel] = 0
        out[c] = Image.fromarray(arr, 'RGBA')
    return out


def finish(p):
    p = p.crop(p.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox())
    s = FIT / max(p.size)
    p = p.resize((max(1, round(p.width * s)), max(1, round(p.height * s))), Image.LANCZOS)
    r, g, b, al = p.split()
    al = al.point(lambda v: 0 if v <= 24 else (255 if v >= 232 else v))
    p = Image.merge('RGBA', (r, g, b, al))
    t = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
    t.paste(p, ((128 - p.width) // 2, (128 - p.height) // 2), p)
    return t


# ---- medidas -------------------------------------------------------------------------------------------------------
def main_comp(im):
    """(mascara da maior componente dilatada, #componentes, area fora da principal, maior corte reto lateral)."""
    a = np.array(im.getchannel('A'))
    m = a > 24
    lab, n = ndi.label(ndi.binary_dilation(m, iterations=3))
    if n == 0:
        return m, 0, 0, 0
    ar = [int(((lab == k) & m).sum()) for k in range(1, n + 1)]
    k = int(np.argmax(ar)) + 1
    ys, xs = np.nonzero(m)
    flat = 0
    for col in (xs.min(), xs.max()):
        run = best = 0
        for v in m[:, col]:
            run = run + 1 if v else 0
            best = max(best, run)
        flat = max(flat, best)
    return (lab == k) & m, n, sum(ar) - max(ar), flat


def shape(mask):
    ys, xs = np.nonzero(mask)
    if len(xs) == 0:
        return np.zeros((48, 48), bool), 1.0
    c = Image.fromarray((mask[ys.min():ys.max() + 1, xs.min():xs.max() + 1] * 255).astype(np.uint8))
    return np.array(c.resize((48, 48), Image.BILINEAR)) > 100, (xs.max() - xs.min() + 1) / (ys.max() - ys.min() + 1)


def meancolor(im):
    a = np.array(im).astype(float)
    w = a[..., 3] > 24
    return a[w][:, :3].mean(0) if w.any() else np.zeros(3)


def similar(old, new):
    """Formato da peca principal (independe de escala e de fragmentos) + cor media."""
    om = main_comp(old)[0]
    nm = main_comp(new)[0]
    so, ro = shape(om)
    sn, rn = shape(nm)
    u = (so | sn).sum()
    iou = (so & sn).sum() / u if u else 0
    asp = min(ro, rn) / max(ro, rn)
    col = float(np.abs(meancolor(old) - meancolor(new)).max())
    return iou, asp, col


def plan_element(e):
    """-> {estado: dict(status, new, sheet, ...)}."""
    olds = {n: Image.open(os.path.join(DST, f'fx-{e}-{n}.png')).convert('RGBA') for n in NAMES}
    pcs = []
    for p in cands(e):
        im = Image.open(p).convert('RGBA')
        for k, v in pieces(im).items():
            pcs.append((p, k, finish(v)))
    out = {}
    for n in NAMES:
        old = olds[n]
        _, oc, ostray, oflat = main_comp(old)
        best = None
        for p, k, new in pcs:
            iou, asp, col = similar(old, new)
            sc = iou * asp - col / 255
            if best is None or sc > best[0]:
                best = (sc, p, k, new, iou, asp, col)
        if best is None:
            out[n] = dict(status='sem-folha')
            continue
        sc, p, k, new, iou, asp, col = best
        _, nc, nstray, nflat = main_comp(new)
        # casamento firme (formato igual) OU relaxado: a peca velha tem fragmentos alheios, que distorcem o formato medido
        ok = (e, n) not in SKIP and ((iou >= 0.8 and asp >= 0.85 and col <= 30) or (iou >= 0.62 and asp >= 0.85 and col <= 14 and ostray - nstray > 15))
        dirty = (ostray - nstray > 15) or (oc > nc) or (oflat >= 24 and oflat > nflat + 4)
        out[n] = dict(status='trocar' if (ok and dirty) else ('ok' if ok else 'sem-casamento'), new=new, sheet=p, k=k,
                      iou=round(float(iou), 2), asp=round(float(asp), 2), col=round(col, 1), ostray=ostray, nstray=nstray,
                      oc=oc, nc=nc, oflat=oflat, nflat=nflat)
    # peca instalada VAZIA/QUEBRADA (ex.: espinheiro-slash era so duas sementes soltas, sem o crescente): pega, na folha das
    # outras pecas do elemento, a que nenhum outro estado reivindicou.
    for n in NAMES:
        old = olds[n]
        areas = {m: int((np.array(olds[m].getchannel('A')) > 24).sum()) for m in NAMES}
        mediana = sorted(v for m, v in areas.items() if m != n)[len(NAMES) // 2 - 1]
        if out[n].get('status') != 'sem-casamento' or areas[n] >= 0.25 * mediana:
            continue
        sheets = [d['sheet'] for m, d in out.items() if m != n and d.get('status') in ('ok', 'trocar')]
        if not sheets:
            continue
        sheet = max(set(sheets), key=sheets.count)
        used = {d['k'] for m, d in out.items() if m != n and d.get('sheet') == sheet and d.get('status') in ('ok', 'trocar')}
        free = [(p, k, new) for p, k, new in pcs if p == sheet and k not in used]
        if len(free) == 1:
            p, k, new = free[0]
            out[n] = dict(status='trocar', new=new, sheet=p, k=k, iou=0, asp=0, col=0, ostray=0, nstray=0, oc=0, nc=0,
                          oflat=0, nflat=0, motivo='peca instalada quebrada')
    return out


def main(argv):
    dry = '--dry' in argv
    only = None
    rep = None
    for i, x in enumerate(argv):
        if x == '--so':
            only = set(argv[i + 1].split(','))
        if x == '--pasta-relatorio':
            rep = argv[i + 1]
    els = sorted({re.match(r'fx-(.+?)-(?:aura-96|aura|cast|defended|impact|orb|slash)\.png$', f).group(1)
                  for f in os.listdir(DST) if f.endswith('.png')})
    log = {}
    for e in els:
        if only and e not in only:
            continue
        pl = plan_element(e)
        log[e] = {n: {k: v for k, v in d.items() if k != 'new'} for n, d in pl.items()}
        for n, d in pl.items():
            if d['status'] != 'trocar':
                continue
            print('trocar', e, n, d['iou'], d['asp'], d['col'], 'estranhos', d['ostray'], '->', d['nstray'], flush=True)
            if dry:
                continue
            d['new'].save(os.path.join(DST, f'fx-{e}-{n}.png'))
            if n == 'aura':
                d['new'].resize((96, 96), Image.LANCZOS).save(os.path.join(DST, f'fx-{e}-aura-96.png'))
    if rep:
        os.makedirs(rep, exist_ok=True)
        json.dump(log, open(os.path.join(rep, 'plano-regeracao.json'), 'w'), indent=1, default=str)


if __name__ == '__main__':
    main(sys.argv[1:])
