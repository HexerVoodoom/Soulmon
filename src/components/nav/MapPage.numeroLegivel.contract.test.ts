import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** QA L05-08: o 0 do Cinzel é um "O": "0 Honra" lia-se "o Honra". O número das pílulas de Honra e Créditos vai na fonte de texto. */
describe('MapPage — número das pílulas de moeda legível', () => {
  const src = readFileSync(new URL('./MapPage.tsx', import.meta.url), 'utf8');
  for (const n of ['emblems', 'credits']) {
    it(`{${n}} vai num span com a fonte de texto e algarismos de linha`, () => {
      expect(src).toMatch(new RegExp(`fontFamily: 'var\(--sm2-font-text\)', fontVariantNumeric: 'lining-nums tabular-nums' \}\}>\{${n}\}</span>`));
    });
  }
});
