/**
 * Combat v3, AC8 (PR3b): a Arena não tem `Math.random`. A luta é função da SEMENTE da run
 * (`newDefenseSeed()` → sabor das rodadas, defesa automática, anel, esquiva e o núcleo): a mesma semente
 * com os mesmos gestos dá o mesmo log. Um `Math.random` em qualquer destes arquivos quebra isso sem
 * nada ficar vermelho — por isso esta régua é de FONTE.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const FILES = [
  'utils/arena.ts',
  'components/ArenaGame.tsx',
  'components/games/useGroupBattle.ts',
];
const SORTEIO = /Math\s*\.\s*random|crypto\s*\.\s*getRandomValues|Date\s*\.\s*now\s*\(\)\s*%/;

/** O mesmo texto sem comentários: os cabeçalhos explicam o que NÃO se faz e podem citar o nome. */
function semComentarios(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

describe('AC8. a Arena não sorteia fora da semente', () => {
  for (const f of FILES) {
    it(`${f} não tem Math.random`, () => {
      const src = semComentarios(readFileSync(resolve(__dirname, '..', f), 'utf8'));
      expect(src).not.toMatch(SORTEIO);
    });
  }
  it('RED: o detector pega um Math.random de verdade (e ignora o nome num comentário)', () => {
    expect(semComentarios('const x = Math.random();')).toMatch(SORTEIO);
    expect(semComentarios('const y = 1; // nunca Math.random\n/* Math.random */')).not.toMatch(SORTEIO);
  });
});
