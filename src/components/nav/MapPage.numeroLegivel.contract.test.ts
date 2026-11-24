import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** QA L05-08: o 0 do Cinzel é um "O". O número das 3 pílulas vai na fonte de texto, com algarismos de linha e tabulares (classe `.sm2-moeda__val`, no index.css). */
describe('MapPage — número das pílulas de moeda legível', () => {
  const src = readFileSync(new URL('./MapPage.tsx', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../../index.css', import.meta.url), 'utf8');
  for (const n of ['nBits', 'nEmblems', 'nCredits']) {
    it(`{${n}} vai no span .sm2-moeda__val`, () => {
      expect(src).toContain(`<span className="sm2-moeda__val">{${n}}</span>`);
    });
  }
  it('.sm2-moeda__val usa algarismos de linha tabulares e a pílula não carrega fonte de título', () => {
    const ini = css.indexOf('\n.sm2-moeda__val {');
    const bloco = css.slice(css.indexOf('{', ini), css.indexOf('}', ini));
    expect(bloco).toContain('lining-nums tabular-nums');
  });
});

/** 24/11/2026: o ícone senta no anel de cobre da barra (absoluto, 16px), não num flex com gap; o miolo do valor é centralizado. */
describe('MapPage — ícone no anel da barra de moeda', () => {
  const css = readFileSync(new URL('../../index.css', import.meta.url), 'utf8');
  it('.sm2-moeda__in é inline-flex e o primeiro filho (ícone) é absoluto de 16px', () => {
    const ini = css.indexOf('.sm2-moeda__in {');
    const bloco = css.slice(css.indexOf('{', ini), css.indexOf('}', ini));
    expect(bloco).toContain('display: inline-flex');
    const ic = css.indexOf('.sm2-moeda__in > :first-child {');
    const blocoIc = css.slice(css.indexOf('{', ic), css.indexOf('}', ic));
    expect(blocoIc).toContain('position: absolute');
    expect(blocoIc).toContain('width: 16px');
  });
});
