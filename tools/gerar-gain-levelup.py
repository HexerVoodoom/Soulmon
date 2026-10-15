"""Redesenha `src/assets/soulmon/fx/gain-levelup.png` (chevron triplo do LEVEL UP) de forma determinística.

Por que existe: a arte original (96², gerada) tinha contorno de 1px irregular e o overlay a exibe a 48px com
`image-rendering: pixelated` (0,5×, vizinho-mais-próximo = descarta 1 de cada 2 pixels). O contorno de 1px sumia
em trechos e deixava pixels claros do miolo nas bordas ("pixels brancos serrilhados"). Aqui o desenho é feito numa
grade de 48 células e ampliado 2× inteiro: todo bloco 2×2 é uniforme, então 0,5×/1×/2× por vizinho-mais-próximo
dão exatamente a mesma imagem, sem franja. Alfa binário, borda sempre = contorno escuro.
Uso: python tools/gerar-gain-levelup.py   (saída idempotente)."""
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parent.parent / 'src/assets/soulmon/fx/gain-levelup.png'
CIANO, TINTA, SOMBRA, CONTORNO = (0x6E, 0xFF, 0xFB), (0xE9, 0xF5, 0xF2), (0x2F, 0xB8, 0xB6), (0x06, 0x14, 0x14)
N, CX, MEIA, ESPESSURA, PASSO, Y0 = 48, 24.0, 14, 10, 10, 2


def chevron(y0):
    """Mapa {(x,y): faixa} das células do chevron com ápice em y0 (faixa 0 = realce, 1 = cor, 2 = sombra)."""
    cel = {}
    for y in range(N):
        for x in range(N):
            dx = abs(x + 0.5 - CX)
            if dx > MEIA:
                continue
            topo = y0 + dx
            d = (y + 0.5) - topo
            if 0 <= d < ESPESSURA:
                cel[(x, y)] = 0 if d < 1.5 else (2 if d >= ESPESSURA - 2.5 else 1)
    return cel


g = {}
for k in (2, 1, 0):  # de trás pra frente: o de cima é desenhado por último
    c = chevron(Y0 + k * PASSO)
    for (x, y) in c:  # contorno de 1 célula ao redor (dilatação em 4 vizinhos)
        for ox, oy in ((1, 0), (-1, 0), (0, 1), (0, -1), (0, 0)):
            p = (x + ox, y + oy)
            if 0 <= p[0] < N and 0 <= p[1] < N and p not in c:
                g[p] = CONTORNO
    for p, f in c.items():
        g[p] = (TINTA, CIANO, SOMBRA)[f]

im = Image.new('RGBA', (N * 2, N * 2), (0, 0, 0, 0))
px = im.load()
for (x, y), cor in g.items():
    for ox in (0, 1):
        for oy in (0, 1):
            px[x * 2 + ox, y * 2 + oy] = cor + (255,)
im.save(OUT, optimize=True)
print('ok', OUT, im.size)
