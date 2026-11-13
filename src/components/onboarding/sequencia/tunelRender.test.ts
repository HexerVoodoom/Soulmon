import { describe, it, expect } from 'vitest';
import { criarTextura, desenharTunel, TUNEL_H, TUNEL_W } from './tunelRender';

const novo = () => new Uint32Array(TUNEL_W * TUNEL_H);
const igual = (a: Uint32Array, b: Uint32Array) => Buffer.from(a.buffer).equals(Buffer.from(b.buffer));

describe('túnel pseudo-3D (canvas 2D de software)', () => {
  const tex = criarTextura();

  it('o buffer interno é 320x180', () => { expect([TUNEL_W, TUNEL_H]).toEqual([320, 180]); });

  it('é determinístico: o mesmo instante dá os mesmos pixels', () => {
    const a = novo(), b = novo();
    desenharTunel(a, tex, 1.5); desenharTunel(b, tex, 1.5);
    expect(igual(a, b)).toBe(true);
  });

  it('com movimento o quadro muda com o tempo', () => {
    const a = novo(), b = novo();
    desenharTunel(a, tex, 0); desenharTunel(b, tex, 2);
    expect(igual(a, b)).toBe(false);
  });

  it('movimento reduzido: quadro estático, idêntico em qualquer instante (zero movimento)', () => {
    const a = novo(), b = novo();
    desenharTunel(a, tex, 0, false); desenharTunel(b, tex, 37.3, false);
    expect(igual(a, b)).toBe(true);
  });

  it('pinta todos os pixels com alfa opaco e o centro (fundo do túnel) é bem escuro', () => {
    const a = novo();
    desenharTunel(a, tex, 0.7);
    expect(a.every(p => (p >>> 24) === 255)).toBe(true);
    const meio = a[Math.floor(TUNEL_H / 2) * TUNEL_W + TUNEL_W / 2];
    expect((meio & 255) + ((meio >>> 8) & 255) + ((meio >>> 16) & 255)).toBeLessThan(150);
  });

  it('custo por quadro cabe no orçamento (medido; limite folgado para não ser instável em CI)', () => {
    const a = novo();
    desenharTunel(a, tex, 0); // aquece
    const N = 30;
    const t0 = performance.now();
    for (let i = 0; i < N; i++) desenharTunel(a, tex, i / 30);
    const medio = (performance.now() - t0) / N;
    // alvo do plano: < 4 ms num aparelho de entrada. Aqui só barramos regressão grosseira numa máquina de dev.
    console.info(`[tunel] ${medio.toFixed(2)} ms/quadro (320x180)`);
    expect(medio).toBeLessThan(12);
  });
});
