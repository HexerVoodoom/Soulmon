#!/usr/bin/env python3
"""Instala as salas de descanso (oásis) do Pomodoro (REGISTRO §301), uma por cenário do Foco.

Fonte canônica (sempre lida daqui): E:/Soulmon-assets/jornada-oasis/<cenario>.png (ChatGPT, 12/11/2026), cenarios: forest shore cavern garden workshop observatory.
Saída: src/assets/soulmon/jornada/oasis-<cenario>.webp (1024x2048, 1:2 opaco, cover + LANCZOS, WebP q85, descendo ate q70 se passar de 400 KB); lido por src/components/play/journeyArt.ts.
Cenário sem fonte é pulado (vale o fundo gerado em código). Idempotente. Uso: python tools/instalar-oasis-jornada.py [--origem DIR]
"""
import argparse, io, sys
from pathlib import Path
from PIL import Image, ImageOps

RAIZ = Path(__file__).resolve().parent.parent
ENVS = ['forest', 'shore', 'cavern', 'garden', 'workshop', 'observatory']

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--origem', default='E:/Soulmon-assets/jornada-oasis')
    a = ap.parse_args()
    saida = RAIZ / 'src/assets/soulmon/jornada'
    saida.mkdir(parents=True, exist_ok=True)
    feitos, mudou = [], 0
    for env in ENVS:
        src = Path(a.origem) / f'{env}.png'
        if not src.exists():
            continue
        im = ImageOps.fit(Image.open(src).convert('RGB'), (1024, 2048), Image.LANCZOS, centering=(0.5, 0.5))
        q = 85
        while True:  # teto de 400 KB por arquivo: baixa a qualidade de 5 em 5 so se estourar (min 70)
            buf = io.BytesIO(); im.save(buf, 'WEBP', quality=q, method=6)
            if buf.tell() <= 400_000 or q <= 70:
                break
            q -= 5
        dst = saida / f'oasis-{env}.webp'
        if not dst.exists() or dst.read_bytes() != buf.getvalue():
            dst.write_bytes(buf.getvalue()); mudou += 1
        feitos.append(env)
    print(f'{len(feitos)} oasis ({", ".join(feitos)}); {mudou} alterado(s)')
    return 0

if __name__ == '__main__':
    sys.exit(main())
