import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * QA L11-04/L11-13: o nome do item perdia para o preço de largura fixa e saía
 * "Lago das Lan...". O nome quebra em até 2 linhas e leva o texto inteiro no `title`.
 */
describe('nome de item nas prateleiras não é cortado com reticências', () => {
  for (const f of ['ShopShelf', 'FrameShelf', 'SubscriptionShelf']) {
    it(`${f}: o nome usa line-clamp 2 e title, sem nowrap`, () => {
      const src = readFileSync(new URL(`./${f}.tsx`, import.meta.url), 'utf8');
      const linhas = src.split('\n').filter(l => l.includes('>{name}</span>'));
      expect(linhas.length).toBeGreaterThan(0);
      for (const l of linhas) {
        expect(l).toContain('WebkitLineClamp: 2');
        expect(l).toContain('title={name}');
        expect(l).not.toContain("whiteSpace: 'nowrap'");
      }
    });
  }
});
