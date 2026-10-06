/**
 * Guarda de DONO ÚNICO: as telas de luta não derivam o elemento nem a forma do golpe por conta própria. Quem lê a
 * identidade do lutador é `utils/fighterIdentity.ts`; uma nova derivação nas telas reprova aqui.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TELAS = ['ArenaGame', 'DungeonGame', 'NightmareBattle', 'DuelScreen', 'TournamentPage', 'arena/DueloSheet'];
const leia = (t: string) => readFileSync(resolve(__dirname, `../components/${t}.tsx`), 'utf8').split('\n');

/** Padrões proibidos nas telas: derivar o elemento/forma do golpe fora do dono único. */
const PROIBIDOS: Array<[string, RegExp]> = [
  ['forma do golpe fora do dono', /\b(fighterStrikeForm|skillStrikeForm|strikeKindForSchool|SCHOOL_STRIKE_FORM)\b/],
  ['elemento do golpe lido da skill', /\.elementoId\b|elementoId\s*:/],
  ['elemento dominante lido na tela', /elementoDominante|dominantElement/],
  ['elemento do pet virado em golpe sem o dono', /fxElementId\(\s*petElement\s*\)/],
];
/** A ÚNICA exceção: a MECÂNICA da vantagem elemental da Arena (tabela só das 17 bases, `arena.ts`), marcada na linha. */
const EXCECAO = /MECÂNICA da vantagem|basica\?\.elementoId \?\?|basica\?\.elementoId,|especial\?\.elementoId,/;

describe('identidade do lutador: dono único (grep)', () => {
  for (const tela of TELAS) {
    it(`${tela} não deriva elemento/forma do golpe por conta própria`, () => {
      const achados: string[] = [];
      leia(tela).forEach((l, i) => {
        if (/^\s*(\/\/|\*|\/\*)/.test(l) || EXCECAO.test(l)) return;
        for (const [nome, re] of PROIBIDOS) if (re.test(l)) achados.push(`${tela}:${i + 1} (${nome}): ${l.trim()}`);
      });
      expect(achados).toEqual([]);
    });
  }

  it('as telas de luta importam o dono único', () => {
    for (const tela of ['ArenaGame', 'DungeonGame', 'NightmareBattle', 'DuelScreen']) {
      expect(leia(tela).join('\n')).toMatch(/utils\/fighterIdentity'/);
    }
  });
});
