import { describe, it, expect, beforeAll } from 'vitest';
import { FLAME_GROUPS, FLAME_H, FLAME_W } from './flame';

/**
 * Desde 14/10/2026 (REGISTRO §50) a splash do `index.html` NÃO carrega mais a chama: ela é só o
 * fundo do visor com a barra turquesa. A chama vive apenas em `flame.ts` (o portão, via
 * `BrandFlame`). Este teste trava as duas pontas: a splash sem ilustração e a grade da chama.
 */
let html = '';
beforeAll(async () => {
  const fs = await import(/* @vite-ignore */ 'node:fs');
  const { fileURLToPath } = await import(/* @vite-ignore */ 'node:url');
  const aqui = fileURLToPath(new URL('.', import.meta.url));
  html = fs.readFileSync(`${aqui}../../index.html`, 'utf8');
});

describe('a splash não tem ilustração; a chama do portão é consistente', () => {
  it('index.html #splash: só a barra (sem svg, sem texto visível)', () => {
    const m = /<div id="splash"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/.exec(html);
    expect(m, '#splash ausente').toBeTruthy();
    expect(m![1]).not.toMatch(/<svg|<img|<h1|<p /);
    expect(m![1]).toContain('class="sm2-loadbar');
    expect(m![1]).toContain('role="progressbar"');
  });

  it('todo pixel da chama cabe na grade 19×30', () => {
    for (const g of FLAME_GROUPS) for (const [x, y] of g.px) {
      expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThan(FLAME_W);
      expect(y).toBeGreaterThanOrEqual(0); expect(y).toBeLessThan(FLAME_H);
    }
  });
});
