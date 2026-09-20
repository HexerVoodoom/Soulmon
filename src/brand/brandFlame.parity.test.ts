import { describe, it, expect, beforeAll } from 'vitest';
import { FLAME_GROUPS, FLAME_H, FLAME_W } from './flame';

/**
 * A chama existe em DUAS cópias de propósito — `index.html #splash` (literal,
 * porque a splash pinta antes do bundle) e `flame.ts` (o portão). Este teste
 * é o que impede as duas de divergirem em silêncio (footgun 9).
 */
let html = '';
beforeAll(async () => {
  const fs = await import(/* @vite-ignore */ 'node:fs');
  const { fileURLToPath } = await import(/* @vite-ignore */ 'node:url');
  const aqui = fileURLToPath(new URL('.', import.meta.url));
  html = fs.readFileSync(`${aqui}../../index.html`, 'utf8');
});

describe('a chama da splash e a do portão são a MESMA arte', () => {
  it('index.html tem a chama a 4× (76×120), sem sombra e sem opacidade', () => {
    const m = /<svg class="sp-flame[^"]*"[^>]*>([\s\S]*?)<\/svg>/.exec(html);
    expect(m, 'svg.sp-flame ausente no index.html').toBeTruthy();
    const tag = /<svg class="sp-flame[^"]*"[^>]*>/.exec(html)![0];
    expect(tag).toContain(`viewBox="0 0 ${FLAME_W} ${FLAME_H}"`);
    expect(tag).toContain(`width="${FLAME_W * 4}"`);
    expect(tag).toContain(`height="${FLAME_H * 4}"`);
  });

  it('os grupos e os pixels batem, um a um', () => {
    const inner = /<svg class="sp-flame[^"]*"[^>]*>([\s\S]*?)<\/svg>/.exec(html)![1];
    const grupos = [...inner.matchAll(/<g fill="(#[0-9a-f]{6})">([\s\S]*?)<\/g>/g)].map(g => ({
      fill: g[1],
      px: [...g[2].matchAll(/<rect x="(\d+)" y="(\d+)" width="1" height="1"\/>/g)].map(r => [Number(r[1]), Number(r[2])]),
    }));
    expect(grupos.length).toBe(FLAME_GROUPS.length);
    grupos.forEach((g, i) => {
      expect(g.fill).toBe(FLAME_GROUPS[i].fill);
      expect(g.px).toEqual(FLAME_GROUPS[i].px.map(p => [p[0], p[1]]));
    });
  });

  it('todo pixel cabe na grade 19×30', () => {
    for (const g of FLAME_GROUPS) for (const [x, y] of g.px) {
      expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThan(FLAME_W);
      expect(y).toBeGreaterThanOrEqual(0); expect(y).toBeLessThan(FLAME_H);
    }
  });
});
