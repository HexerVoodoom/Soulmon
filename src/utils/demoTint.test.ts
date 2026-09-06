/**
 * WP1.12 — micro-posse no demo.
 *
 * Os três personagens pré-prontos são iguais para todo mundo: "meu bichinho"
 * começa sendo o bichinho de todo mundo. O tint é a menor coisa possível que
 * transforma um personagem emprestado em algo escolhido.
 *
 * A trava é que ele seja o OPOSTO de uma mecânica — se um dia valer alguma
 * coisa, virou vantagem cosmética paga com escolha, que é outro produto.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DEMO_TINTS, demoTintFilter } from './sprites';

describe('demoTint — três tonalidades e o original', () => {
  it('a primeira opção é a arte ORIGINAL, sem filtro', () => {
    expect(DEMO_TINTS[0]).toBe(0);
    expect(demoTintFilter(0)).toBeUndefined();
  });

  it('as outras devolvem um `hue-rotate`', () => {
    for (let i = 1; i < DEMO_TINTS.length; i += 1) {
      expect(demoTintFilter(i)).toMatch(/^hue-rotate\(\d+deg\)$/);
    }
  });

  it('índice inválido cai no original em vez de quebrar', () => {
    expect(demoTintFilter(-3)).toBeUndefined();
    expect(demoTintFilter(99)).toBe(demoTintFilter(DEMO_TINTS.length - 1));
    expect(demoTintFilter(undefined)).toBeUndefined();
  });

  it('são hue-rotate e não sprites novos — zero byte a mais no bundle', () => {
    for (const g of DEMO_TINTS) expect(typeof g).toBe('number');
  });
});

describe('demoTint — é o OPOSTO de uma mecânica', () => {
  it('nenhuma regra de jogo lê `demoTint`', () => {
    // Se um dia ler, virou vantagem cosmética paga com escolha — outro
    // produto. As regras vivem nestes módulos; nenhum deles pode citá-lo.
    const regras = [
      'src/utils/careRules.ts', 'src/utils/dailyReset.ts', 'src/utils/habitRhythm.ts',
      'src/utils/dungeon.ts', 'src/utils/shop.ts', 'src/utils/bond.ts',
      'src/types/progression.ts',
    ];
    for (const f of regras) {
      const fonte = readFileSync(resolve(process.cwd(), f), 'utf-8');
      expect(fonte, `${f} passou a ler demoTint`).not.toContain('demoTint');
    }
  });
});
