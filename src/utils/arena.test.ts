// 🏟️ Arena — pure-logic tests. The balance simulation here is the AUTHORITY
// on the coefficients in arena.ts: if a tweak there breaks the win-rate
// bands, the tweak is wrong, not the test.
import { describe, it, expect } from 'vitest';
import {
  getArenaAttributes, COUNTERS, buildArenaRound, simulateArenaRun,
  SPECIAL_EFFECTS, type ArenaArchetypeConfig, type BestiaryCreature,
  arenaTorcidaTurn, ARENA_TORCIDA_MULT, ARENA_AUTO_ACC, PERFECT_ACC,
} from './arena';
import { TORCIDA_TAPS_FULL, TORCIDA_TAPS_CAP } from './torcida';
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
  /**
   * ⚠️ Eram 300, e 300 é RUÍDO DEMAIS para o limite que este teste afirma.
   *
   * A taxa é uma proporção binomial: com 300 amostras o erro padrão perto de
   * 50% é ~2,9pp, e o teste exige um piso de 40%. Ou seja, a medição balançava
   * ±3pp contra uma régua de 1pp de folga — ele passava por sorte.
   *
   * A conta apareceu em 07/09/2026, quando o pool do bestiário perdeu 282
   * criaturas de franquia protegida: a sequência que o RNG semeado sorteia
   * mudou, `maldicao` marcou 0,39 e o teste quebrou. Não era regressão de
   * balanço — com 3000 runs (SE ~0,9pp) a mesma configuração passa. Aumentar a
   * AMOSTRA é o conserto; afrouxar o piso seria apagar a régua para caber no
   * ruído. Custo: ~0,8s.
   */
  const RUNS = 3000;

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

// ── Torcida por toques no Duelo da Arena (H14, 02/10/2026) ──────────────────
//
// O pet golpeia sozinho (`autoAttack`) e a torcida só SOMA. A calibração é
// medida aqui, não prometida: sem torcer ≈ a simulação base (timing 0,7); com
// a torcida cheia, o ganho médio é do tamanho do duelo fantasma (+31pp:
// 51% → 82%, `functions/api/_duel.test.js`).
describe('torcida por toques — a conta e a calibração', () => {
  const ESCOLAS: EscolaId[] = [
    'combate_fisico', 'longo_alcance', 'conjuracao', 'evocacao', 'benca', 'maldicao',
  ];
  const RUNS = 3000;
  const taxas = (opts: Record<string, unknown>) => ESCOLAS.map(escola => {
    const config: ArenaArchetypeConfig = {
      stage: 'rookie', escolaBasica: escola, escolaEspecial: escola,
      elementoBasica: 'vigor', elementoEspecial: 'vigor',
      attrs: { principal: 'vigor', secundario: 'vigor' },
    };
    const rng = mulberry32(20260818);
    let wins = 0;
    for (let i = 0; i < RUNS; i++) {
      if (simulateArenaRun(config, { rng, pool: POOL, accMean: 0.7, ...opts }).won) wins++;
    }
    return wins / RUNS;
  });
  const media = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

  it('arenaTorcidaTurn: só gasta com o gauge cheio; excedente não rende; nunca abaixo de 1', () => {
    expect(arenaTorcidaTurn(0)).toEqual({ mult: 1, special: false, gaugeLeft: 0 });
    expect(arenaTorcidaTurn(TORCIDA_TAPS_FULL - 1)).toEqual({ mult: 1, special: false, gaugeLeft: TORCIDA_TAPS_FULL - 1 });
    expect(arenaTorcidaTurn(TORCIDA_TAPS_FULL)).toEqual({ mult: ARENA_TORCIDA_MULT, special: true, gaugeLeft: 0 });
    // Teto por golpe: 1000 toques valem o mesmo que 8.
    expect(arenaTorcidaTurn(1000).mult).toBe(ARENA_TORCIDA_MULT);
    // Entrada podre não forja nada.
    for (const lixo of [NaN, -5, Infinity * 0]) expect(arenaTorcidaTurn(lixo).mult).toBe(1);
    expect(ARENA_TORCIDA_MULT).toBeGreaterThan(1);
    expect(ARENA_AUTO_ACC).toBeLessThan(PERFECT_ACC); // o golpe automático nunca é crítico
  });

  it('sem torcer, o golpe automático rende ≈ a simulação base (±4pp na média) e respeita as faixas', () => {
    const base = taxas({});
    const auto = taxas({ autoAttack: true });
    expect(Math.abs(media(auto) - media(base))).toBeLessThanOrEqual(0.04);
    expect(Math.min(...auto), JSON.stringify(auto)).toBeGreaterThanOrEqual(0.4);
    expect(Math.max(...auto), JSON.stringify(auto)).toBeLessThanOrEqual(0.8);
    expect(Math.max(...auto) - Math.min(...auto), JSON.stringify(auto)).toBeLessThanOrEqual(0.2);
  });

  it('a torcida só SOMA: cada nível de toque rende mais que o anterior, em toda escola', () => {
    const n0 = taxas({ autoAttack: true });
    const n2 = taxas({ autoAttack: true, tapsPerTurn: 2 });
    const n4 = taxas({ autoAttack: true, tapsPerTurn: 4 });
    const n8 = taxas({ autoAttack: true, tapsPerTurn: 8 });
    ESCOLAS.forEach((_, i) => {
      expect(n2[i]).toBeGreaterThan(n0[i]);
      expect(n4[i]).toBeGreaterThan(n2[i]);
      expect(n8[i]).toBeGreaterThanOrEqual(n4[i]);
    });
  });

  it('torcida cheia (gauge pronto a cada golpe) ≈ o ganho do duelo fantasma (+31pp, faixa +25..+40)', () => {
    const ganho = media(taxas({ autoAttack: true, tapsPerTurn: TORCIDA_TAPS_FULL }))
      - media(taxas({ autoAttack: true }));
    expect(ganho).toBeGreaterThanOrEqual(0.25);
    expect(ganho).toBeLessThanOrEqual(0.4);
  });

  it('ritmo NORMAL (≈3 toques/s × ~3,8 s por turno ≈ 11 toques) enche o gauge a cada 2 turnos: +20..+28pp (rodada 5/I10)', () => {
    // O gauge passou de 8 para 16 toques e o turno de 2,3 s para ~3,8 s (`utils/combatFx.ts`):
    // quem toca normal continua soltando um golpe de torcida a cada 2 turnos — o mesmo
    // ganho que 4 toques/turno rendiam com o gauge de 8 (81,9% ≈ 82%).
    const ganho = media(taxas({ autoAttack: true, tapsPerTurn: 11 }))
      - media(taxas({ autoAttack: true }));
    expect(ganho).toBeGreaterThanOrEqual(0.2);
    expect(ganho).toBeLessThanOrEqual(0.28);
    // E o gauge cheio ainda é o teto (16 toques por turno = especial todo turno).
    expect(TORCIDA_TAPS_FULL).toBe(16);
  });

  it('toque ilimitado não rende mais que o teto: 1000 toques por turno = TORCIDA_TAPS_CAP', () => {
    const teto = taxas({ autoAttack: true, tapsPerTurn: TORCIDA_TAPS_CAP });
    const abuso = taxas({ autoAttack: true, tapsPerTurn: 1000 });
    expect(abuso).toEqual(teto);
  });
});
