/**
 * GUARD — franja clara no recorte dos ícones de ganho `fx/gain-*.png` (bug do dono, 15/10/2026: "as setas do level up
 * têm pixels brancos serrilhados ao redor").
 *
 * Causa real: o PNG (não o CSS). Alfa já era binário, mas o contorno escuro de 1px era irregular; o overlay mostra o
 * chevron a 48px com `image-rendering: pixelated` (0,5× por vizinho-mais-próximo = descarta 1 de cada 2 pixels), o que
 * fazia o contorno sumir em trechos e expunha pixels claros do miolo/da borda. Correção: `tools/gerar-gain-levelup.py`
 * (redesenho em grade de 48 células ampliada 2×) e `tools/defringe-gain.py` (decontaminação dos demais).
 *
 * Checagem objetiva, por pixel (mesma regra do `defringe-gain.py`):
 *  1. alfa binário (0 ou 255) — sem semitransparência com cor clara;
 *  2. nenhum pixel de BORDA (vizinho-4 transparente) com luminância > 170 e mais de 60 acima da mediana dos vizinhos
 *     opacos (halo claro sobre interior escuro) nem ilha de borda com < 2 vizinhos opacos.
 * No chevron do level up, além disso: toda borda é o contorno `#061414` e todo bloco 2×2 é uniforme (por isso 0,5×
 * pixelated, 1× e 2× dão a mesma imagem).
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const DIR = path.resolve(__dirname, 'soulmon/fx');
const LUZ = 170;
const SALTO = 60;

type Img = { w: number; h: number; d: Buffer };
const lum = (d: Buffer, i: number) => d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;

/** Pixels que violam a regra: semitransparentes + franja clara de borda. */
export function violacoes({ w, h, d }: Img): { semi: number; franja: number } {
  const op = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0;
  let semi = 0;
  let franja = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = d[i + 3];
      if (a > 0 && a < 255) semi++;
      if (a === 0) continue;
      const borda = !op(x - 1, y) || !op(x + 1, y) || !op(x, y - 1) || !op(x, y + 1);
      if (!borda || lum(d, i) <= LUZ) continue;
      const ls: number[] = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if ((dx || dy) && op(x + dx, y + dy)) ls.push(lum(d, ((y + dy) * w + x + dx) * 4));
      }
      if (ls.length < 2) { franja++; continue; }
      ls.sort((p, q) => p - q);
      const med = (ls[(ls.length - 1) >> 1] + ls[ls.length >> 1]) / 2;
      if (med + SALTO < lum(d, i)) franja++;
    }
  }
  return { semi, franja };
}

async function ler(arq: string): Promise<Img> {
  const { data, info } = await sharp(fs.readFileSync(path.join(DIR, arq))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { w: info.width, h: info.height, d: data };
}

const sintetica = (w: number, h: number, f: (x: number, y: number) => [number, number, number, number]): Img => {
  const d = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) d.set(f(x, y), (y * w + x) * 4);
  return { w, h, d };
};

describe('autoverificação do detector de franja', () => {
  it('acusa halo branco de borda sobre interior escuro e semitransparência', () => {
    const img = sintetica(6, 6, (x, y) => {
      if (x === 0 || x === 5 || y === 0 || y === 5) return [0, 0, 0, 0];
      return x === 1 && y === 2 ? [255, 255, 255, 255] : [20, 60, 60, 255];
    });
    expect(violacoes(img).franja).toBe(1);
    expect(violacoes(sintetica(2, 1, (x) => (x ? [255, 255, 255, 128] : [0, 0, 0, 0]))).semi).toBe(1);
  });
  it('não acusa recorte limpo nem realce claro cercado de claro', () => {
    const limpo = sintetica(6, 6, (x, y) => (x === 0 || x === 5 || y === 0 || y === 5 ? [0, 0, 0, 0] : [6, 20, 20, 255]));
    expect(violacoes(limpo)).toEqual({ semi: 0, franja: 0 });
    const claro = sintetica(6, 6, (x, y) => (x === 0 || x === 5 || y === 0 || y === 5 ? [0, 0, 0, 0] : [240, 250, 250, 255]));
    expect(violacoes(claro)).toEqual({ semi: 0, franja: 0 });
  });
});

describe('ícones de ganho: recorte sem franja clara', () => {
  const arquivos = fs.readdirSync(DIR).filter((f) => /^gain-.*\.png$/.test(f));
  it('há ícones de ganho para checar', () => expect(arquivos).toContain('gain-levelup.png'));
  for (const arq of arquivos) {
    it(`${arq}: alfa binário e sem halo claro`, async () => {
      expect(violacoes(await ler(arq))).toEqual({ semi: 0, franja: 0 });
    });
  }
});

describe('gain-levelup.png (chevron triplo exibido a 48px pixelated)', () => {
  it('96², borda = contorno #061414, blocos 2×2 uniformes', async () => {
    const { w, h, d } = await ler('gain-levelup.png');
    expect([w, h]).toEqual([96, 96]);
    const op = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] === 255;
    let bordas = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (!op(x, y)) continue;
      if (!op(x - 1, y) || !op(x + 1, y) || !op(x, y - 1) || !op(x, y + 1)) {
        bordas++;
        expect([d[i], d[i + 1], d[i + 2]]).toEqual([0x06, 0x14, 0x14]);
      }
      const j = ((y & ~1) * w + (x & ~1)) * 4;
      expect([...d.subarray(i, i + 4)]).toEqual([...d.subarray(j, j + 4)]);
    }
    expect(bordas).toBeGreaterThan(100);
  });
});
