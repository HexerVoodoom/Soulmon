import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** QA L05-08: o 0 do Cinzel é um "O": "0 Honra" lia-se "o Honra". O número das pílulas de Honra e Créditos vai na fonte de texto. */
describe('MapPage — número das pílulas de moeda legível', () => {
  const src = readFileSync(new URL('./MapPage.tsx', import.meta.url), 'utf8');
  const estilo = "style={{ fontFamily: 'var(--sm2-font-text)', fontVariantNumeric: 'lining-nums tabular-nums' }}";
  for (const n of ['emblems', 'credits']) {
    it(`{${n}} vai num span com a fonte de texto e algarismos de linha`, () => {
      expect(src).toContain(`<span ${estilo}>{${n}}</span>`);
    });
  }
});

/** QA 23/11/2026: a pílula é `inline-flex`, onde o espaço entre `</span>` e o rótulo some ("0Honra"); o vão tem que vir do `gap`. */
describe('MapPage — espaço entre número e rótulo nas pílulas', () => {
  const src = readFileSync(new URL('./MapPage.tsx', import.meta.url), 'utf8');
  it('a pílula (CHIP) é flex com gap por token', () => {
    const chip = src.slice(src.indexOf('const CHIP'), src.indexOf('};', src.indexOf('const CHIP')));
    expect(chip).toContain("display: 'inline-flex'");
    expect(chip).toContain("gap: 'var(--sm2-space-1)'");
  });
});
