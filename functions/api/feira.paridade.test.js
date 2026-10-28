import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { generateZip, validateZip, seededRng as rngZip } from '../../src/utils/mente/zip.ts';
import { generatePatches, validatePatches } from '../../src/utils/mente/patches.ts';
import { seededRng as rngSrc } from '../../src/utils/mente/eco.ts';
import {
  BOSS_ROSTER, ARAUTO, seededRng, gerarZip, validarZip, gerarColcha, validarColcha, TRAIL_PUZZLE_SIZE, gerarPicross, validarPicross,
} from './_feira.js';
import { cluesOf, matchesClues } from '../../src/utils/mente/picross.ts';

/**
 * Pages Functions não importam de `src/`: o elenco dos chefes e os geradores de Zip e Colcha são CÓPIAS no servidor
 * (`_feira.js`). Aqui a cópia fica presa à fonte (footgun 9: regra copiada diverge em silêncio).
 */
describe('o elenco do servidor espelha `src/data/bossRoster.ts`', () => {
  it('mesmas ids e mesmo PRIMEIRO elemento (o do gancho `reward.element`); o Arauto do Fim fica fora do sorteio comum', () => {
    // Lido como TEXTO: importar o `.ts` arrasta `essenceLabels` (a transformação sozinha levou ~200 s).
    const txt = readFileSync(new URL('../../src/data/bossRoster.ts', import.meta.url), 'utf8');
    const fonte = [...txt.matchAll(/^\s{4}id: '([a-z-]+)',[\s\S]*?elements: \[el\('([a-z_]+)'/gm)].map(m => [m[1], m[2]]);
    expect(fonte).toHaveLength(24);
    const meu = [[ARAUTO.id, ARAUTO.element], ...BOSS_ROSTER.map(b => [b.id, b.element])];
    expect(meu).toEqual(fonte);
    expect(BOSS_ROSTER.some(b => b.id === ARAUTO.id)).toBe(false);
  });
  it('a arte de cada chefe do sorteio existe em `src/assets/soulmon/bosses/`', async () => {
    const { existsSync } = await import('node:fs');
    for (const b of [ARAUTO, ...BOSS_ROSTER]) expect(existsSync(new URL(`../../src/assets/soulmon/bosses/boss-${b.id}.png`, import.meta.url)), b.id).toBe(true);
  });
});

describe('o RNG e os geradores da Trilha espelham `src/utils/mente/*`', () => {
  it('seededRng é o mesmo fluxo do cliente', () => {
    for (const seed of [0, 1, 42, 123456789, 4294967295]) {
      const a = rngSrc(seed), b = seededRng(seed), c = rngZip(seed);
      for (let i = 0; i < 20; i++) { const x = a(); expect(b()).toBe(x); expect(c()).toBe(x); }
    }
  });
  it('Zip: a mesma semente dá o MESMO puzzle (tamanho, números) e a solução passa nos dois validadores', () => {
    for (const seed of [1, 7, 99, 2024, 31337, 987654]) {
      const fonte = generateZip(TRAIL_PUZZLE_SIZE, rngSrc(seed));
      const meu = gerarZip(TRAIL_PUZZLE_SIZE, seededRng(seed));
      expect(meu.size).toBe(fonte.size);
      expect(meu.numbers).toEqual(fonte.numbers);
      expect(meu.solution).toEqual(fonte.solution);
      expect(validateZip(fonte, meu.solution)).toBe(true);
      expect(validarZip(meu, fonte.solution)).toBe(true);
      // mutações: os dois validadores concordam
      const rev = fonte.solution.slice().reverse();
      const troca = fonte.solution.slice(); [troca[1], troca[2]] = [troca[2], troca[1]];
      for (const caminho of [rev, troca, fonte.solution.slice(1), [...fonte.solution, 0]]) expect(validarZip(meu, caminho)).toBe(validateZip(fonte, caminho));
    }
  });
  it('Colcha: a mesma semente dá as MESMAS pistas e a solução passa nos dois validadores', () => {
    for (const seed of [1, 7, 99, 2024, 31337, 987654]) {
      const fonte = generatePatches(TRAIL_PUZZLE_SIZE, rngSrc(seed));
      const meu = gerarColcha(TRAIL_PUZZLE_SIZE, seededRng(seed));
      expect(meu.size).toBe(fonte.size);
      expect(meu.clues).toEqual(fonte.clues);
      expect(meu.solution).toEqual(fonte.solution);
      expect(validatePatches(fonte, meu.solution)).toBe(true);
      expect(validarColcha(meu, fonte.solution)).toBe(true);
      const mexida = fonte.solution.slice(1);
      expect(validarColcha(meu, mexida)).toBe(validatePatches(fonte, mexida));
    }
  });
  it('Picross: as pistas do servidor e a conferência concordam com `cluesOf`/`matchesClues` do cliente', () => {
    for (const seed of [3, 8, 21, 500]) {
      const p = gerarPicross(5, seededRng(seed));
      const grade = p.solution;
      expect(cluesOf(grade)).toEqual({ rows: p.rows, cols: p.cols });
      const marcas = grade.map(r => r.map(v => (v ? 1 : 0)));
      expect(matchesClues(marcas, { rows: p.rows, cols: p.cols })).toBe(true);
      expect(validarPicross(p, marcas)).toBe(true);
      const torta = marcas.map(r => r.slice()); torta[2][2] = torta[2][2] ? 0 : 1;
      expect(validarPicross(p, torta)).toBe(matchesClues(torta, { rows: p.rows, cols: p.cols }));
    }
  });
});
