"""Pixelização leve de um fundo da Home (reprodutível).

  python tools/pixelizar-fundo.py <origem.png> <saida-1200x648.png> [--fator 2] [--cores 128] [--nitidez 40]

1) recorta o CENTRO da origem para a proporção exata 1200:648 (nunca estica);
2) reduz para 1200/fator de largura (LANCZOS, é a média local);
3) quantiza a paleta (mediancut, sem dithering);
4) amplia de volta a 1200x648 com NEAREST (blocos de ~fator px).
Fonte sempre é o arquivo informado; rodar duas vezes dá o mesmo PNG.
"""
import argparse
from PIL import Image, ImageFilter

W, H = 1200, 648

def pixelizar(origem, fator, cores, nitidez=40):
    im = Image.open(origem).convert('RGB')
    cw = round(im.height * W / H)
    if cw > im.width:  # origem mais estreita que 1200:648: recorta em cima/baixo
        ch = round(im.width * H / W)
        t = (im.height - ch) // 2
        im = im.crop((0, t, im.width, t + ch))
    else:
        l = (im.width - cw) // 2
        im = im.crop((l, 0, l + cw, im.height))
    im = im.resize((W, H), Image.LANCZOS)
    pw, ph = round(W / fator), round(H / fator)
    small = im.resize((pw, ph), Image.LANCZOS)
    if nitidez:  # devolve o contorno que a média suavizou (o templo aprovado tem traço firme)
        small = small.filter(ImageFilter.UnsharpMask(radius=1.2, percent=nitidez, threshold=2))
    small = small.quantize(colors=cores, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    return small.resize((W, H), Image.NEAREST)

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('origem'); ap.add_argument('saida')
    ap.add_argument('--fator', type=float, default=2.5)
    ap.add_argument('--cores', type=int, default=128)
    ap.add_argument('--nitidez', type=int, default=40, help='percent do UnsharpMask no tamanho reduzido')
    a = ap.parse_args()
    pixelizar(a.origem, a.fator, a.cores, a.nitidez).save(a.saida, optimize=True)
