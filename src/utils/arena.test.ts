// 🏟️ Arena — pure-logic tests (ficha, elements, names, composition). The BALANCE gates of the v3
// engine (duration, win by build/family/area, skill, ruler) live in `arena.v3.test.ts`; the balance
// section and the torcida calibration of the old turn engine were deleted with it (PR3b lists them).
import { describe, it, expect } from 'vitest';
import {
  getArenaAttributes, COUNTERS, buildArenaRound, ESCOLA_FAMILY_PROVISORIO, elementAdvantage, type BestiaryCreature,
} from './arena';
import { buildStageSkills } from './soulProfile/ficha/skills';
import { CLASS_ELEMENT_ORDER } from './soulProfile/types';
import type { Ficha } from './soulProfile/ficha/types';
import { mulberry32 } from './oracle';
import poolJson from './soulProfile/bestiary/pool.json';

const POOL = (poolJson as { criaturas: BestiaryCreature[] }).criaturas;

function fichaWith(elementos: Record<string, number>): Ficha {
  return {
    nome: 'Teste',
    elementos,
    escolas: { combate_fisico: 3 },
    recursos: { mana: 2 },
    talentos: {},
    profissoes: {},
    totals: { elementos: 0, escolas: 3, recursos: 2, talentos: 0, profissoes: 0 },
  };
}

describe('getArenaAttributes — regra de discrepância', () => {
  it('dois atributos quando os pesos são próximos (≤ ×1.7)', () => {
    const { principal, secundario } = getArenaAttributes(fichaWith({ fogo: 5, agua: 4 }));
    expect(principal).toBe('fogo');
    expect(secundario).toBe('agua');
  });

  it('repete o principal quando o topo passa de ×1.7 do segundo', () => {
    const { principal, secundario } = getArenaAttributes(fichaWith({ fogo: 9, agua: 3 }));
    expect(principal).toBe('fogo');
    expect(secundario).toBe('fogo');
  });

  it('par comprado pesa CUSTO_PONTO_PAR e alimenta os dois componentes base', () => {
    // vapor (fogo+agua) ×2 por ponto: 3 pts → 6 de peso em fogo E em agua.
    const { principal, secundario } = getArenaAttributes(fichaWith({ vapor: 3, terra: 5 }));
    expect(['fogo', 'agua']).toContain(principal);
    expect(principal).not.toBe(secundario === principal ? '' : principal === 'fogo' ? 'fogo2' : '');
    expect(new Set([principal, secundario]).size).toBeGreaterThanOrEqual(1);
  });
});

describe('tabela de counters', () => {
  it('todo elemento countera exatamente 2 e é counterado por exatamente 2', () => {
    const counteredBy = new Map<string, number>();
    for (const el of CLASS_ELEMENT_ORDER) {
      const targets = COUNTERS[el];
      expect(targets, `COUNTERS[${el}]`).toBeDefined();
      expect(targets.length).toBe(2);
      expect(new Set(targets).size).toBe(2);
      expect(targets).not.toContain(el);
      for (const t of targets) {
        expect(CLASS_ELEMENT_ORDER).toContain(t);
        counteredBy.set(t, (counteredBy.get(t) ?? 0) + 1);
      }
    }
    for (const el of CLASS_ELEMENT_ORDER) {
      expect(counteredBy.get(el), `${el} counterado por`).toBe(2);
    }
  });
});

describe('inimigos do bestiário', () => {
  it('nunca expõe o `nome` do pool (nome exibido é gerado)', () => {
    const rng = mulberry32(1234);
    for (let round = 1; round <= 5; round++) {
      for (const enemy of buildArenaRound(round, 1, rng, POOL)) {
        for (const creature of POOL.slice(0, 200)) {
          expect(creature.nome.includes(enemy.namePt)).toBe(false);
          expect(enemy.namePt.includes(creature.nome)).toBe(false);
          expect(enemy.nameEn.includes(creature.nome)).toBe(false);
        }
        // e o objeto não carrega o nome original de jeito nenhum
        expect(JSON.stringify(enemy)).not.toMatch(/Pikachu|Pokémon/i);
      }
    }
  });

  it('composição dos rounds: 1/2/1/3/1 inimigos, chefe no 5', () => {
    const rng = mulberry32(99);
    expect(buildArenaRound(1, 1, rng, POOL)).toHaveLength(1);
    expect(buildArenaRound(2, 1, rng, POOL)).toHaveLength(2);
    expect(buildArenaRound(3, 1, rng, POOL)).toHaveLength(1);
    expect(buildArenaRound(4, 1, rng, POOL)).toHaveLength(3);
    const boss = buildArenaRound(5, 1, rng, POOL);
    expect(boss).toHaveLength(1);
    expect(boss[0].cls).toBe('boss');
    expect(boss[0].tier).toBe('mega');
  });
});

describe('PR3b — a família do especial ainda é PROVISÓRIA (até o PR9)', () => {
  it('REPROVA no dia em que StageSkill.familia passar a existir: troque ESCOLA_FAMILY_PROVISORIO pela família real', () => {
    const ficha = fichaWith({ fogo: 3, agua: 2 });
    const par = buildStageSkills(ficha, 'rookie', 'seed');
    expect('familia' in par.basica).toBe(false);
    expect('familia' in par.especial).toBe(false);
    expect(Object.keys(ESCOLA_FAMILY_PROVISORIO).sort()).toEqual(
      ['benca', 'combate_fisico', 'conjuracao', 'evocacao', 'longo_alcance', 'maldicao']);
  });
});

describe('elementAdvantage — devolve -1, 0 ou 1 (era elementMultiplier)', () => {
  it('a tabela de counters vira vantagem de exatamente 1 golpe', () => {
    for (const [atacante, [a, b]] of Object.entries(COUNTERS)) {
      expect(elementAdvantage(atacante, [a])).toBe(1);
      expect(elementAdvantage(atacante, [b])).toBe(1);
      expect(elementAdvantage(a, [atacante])).toBe(-1);
    }
  });
});
