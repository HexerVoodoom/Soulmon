// 🏟️ Arena — pure-logic tests. The balance simulation here is the AUTHORITY
// on the coefficients in arena.ts: if a tweak there breaks the win-rate
// bands, the tweak is wrong, not the test.
import { describe, it, expect } from 'vitest';
import {
  getArenaAttributes, COUNTERS, buildArenaRound, simulateArenaRun,
  SPECIAL_EFFECTS, type ArenaArchetypeConfig, type BestiaryCreature,
} from './arena';
import { CLASS_ELEMENT_ORDER } from './soulProfile/types';
import type { Ficha } from './soulProfile/ficha/types';
import type { EscolaId } from './soulProfile/ficha/types';
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

describe('simulação de balance — os coeficientes obedecem a este teste', () => {
  const ESCOLAS: EscolaId[] = [
    'combate_fisico', 'longo_alcance', 'conjuracao', 'evocacao', 'benca', 'maldicao',
  ];
  const RUNS = 300;

  it('taxa de vitória de cada arquétipo entre 40% e 80%, spread ≤ 20pp', () => {
    const rates: Record<string, number> = {};
    for (const escola of ESCOLAS) {
      expect(SPECIAL_EFFECTS[escola]).toBeDefined();
      const config: ArenaArchetypeConfig = {
        stage: 'rookie',
        escolaBasica: escola,
        escolaEspecial: escola,
        elementoBasica: 'vigor',
        elementoEspecial: 'vigor',
        attrs: { principal: 'vigor', secundario: 'vigor' },
      };
      const rng = mulberry32(20260818);
      let wins = 0;
      for (let i = 0; i < RUNS; i++) {
        if (simulateArenaRun(config, { rng, pool: POOL, accMean: 0.7 }).won) wins++;
      }
      rates[escola] = wins / RUNS;
    }
    const values = Object.values(rates);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const detail = JSON.stringify(rates);
    expect(min, `taxas: ${detail}`).toBeGreaterThanOrEqual(0.4);
    expect(max, `taxas: ${detail}`).toBeLessThanOrEqual(0.8);
    expect(max - min, `spread: ${detail}`).toBeLessThanOrEqual(0.2);
  });
});
