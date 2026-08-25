/**
 * REGRESSÃO V1 — o dreno de cocô é a única perda de HP sem teto do jogo.
 *
 * Achado C1 de `squad-alpha-runs/soulmon-01/discovery/mecanismo-e-etica.md`,
 * verificado por leitura de código em `discovery/verificacao-V1.md`.
 *
 * O FATO (App.tsx:2007-2029, no `setGameState` do efeito de dreno):
 *
 *     const periods = Math.floor((now - clock) / SIX_HOURS);
 *     healthPoints: Math.max(0, prev.healthPoints - periods)
 *
 * `periods` é irrestrito e a subtração acontece FORA de `computeDailyReset()`:
 *   - não passa por `MAX_HEARTS_LOST_PER_DAY` (dailyReset.ts:125)
 *   - não passa por `heartLossCap` / traço Teimoso (passives.ts:97)
 *   - não passa por `forgivesHP` / `ABSENCE_FORGIVENESS_DAYS` (dailyReset.ts:571,588)
 *
 * Contradiz literalmente CLAUDE.md:76 ("teto de 1 coração perdido por dia;
 * ausência ≥2 dias não cobra nada").
 *
 * ⚠️ ESTE ARQUIVO NASCE PARCIALMENTE VERMELHO, DE PROPÓSITO. As camadas 2, 3 e 4
 * descrevem o contrato que a correção (decisão D-09) precisa satisfazer; elas
 * ficam vermelhas até a correção entrar. A camada 1 é verde hoje e depois dela:
 * prova, com números, POR QUE o teto importa.
 *
 * Estrutura copiada de `dailyGoal.contract.test.ts` (guard de duplicação de
 * regra do repo): diferencial sintético + contrato + guard de origem no fonte.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { MAX_HEARTS_LOST_PER_DAY, ABSENCE_FORGIVENESS_DAYS } from './dailyReset';
import { heartLossCap } from './passives';

const SIX_HOURS = 6 * 3600000;
const src = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8');

/** A FORMA DEFEITUOSA, escrita aqui de propósito: é a cópia literal do que
 *  App.tsx:2023-2027 faz hoje. É o "duplicado sintético" que dá as duas pontas
 *  ao guard — sem ele, o contrato proibiria uma forma sem provar que ela é ruim. */
function drenoSemTeto(healthPoints: number, clock: number, now: number): number {
  const periods = Math.floor((now - clock) / SIX_HOURS);
  if (periods <= 0) return healthPoints;
  return Math.max(0, healthPoints - periods);
}

// ---------------------------------------------------------------------------
// 1. DIFERENCIAL — a perda sem teto NÃO é ruído de desenho (verde hoje)
// ---------------------------------------------------------------------------
describe('a perda sem teto do dreno diverge da regra escrita do produto', () => {
  it('24h com cocô na tela zera um mega (4 HP) num dia em que o teto era 1', () => {
    const now = Date.now();
    expect(drenoSemTeto(4, now - 24 * 3600000, now)).toBe(0);
    expect(MAX_HEARTS_LOST_PER_DAY).toBe(1);
  });

  it('retorno de 2 dias de ausência cobra 8 corações de uma vez (piso 0)', () => {
    const now = Date.now();
    const clockAntigo = now - 48 * 3600000; // relógio persistido de antes da ausência
    expect(Math.floor((now - clockAntigo) / SIX_HOURS)).toBe(8);
    expect(drenoSemTeto(3, clockAntigo, now)).toBe(0); // HP 0 → degeneração
    expect(ABSENCE_FORGIVENESS_DAYS).toBe(2); // e a regra dizia: não cobra nada
  });

  it('o traço Teimoso (perde só 0,5) também é ignorado por esse caminho', () => {
    expect(heartLossCap('teimoso', MAX_HEARTS_LOST_PER_DAY)).toBe(0.5);
    const now = Date.now();
    expect(drenoSemTeto(3, now - 12 * 3600000, now)).toBe(1); // perdeu 2, não 0,5
  });
});

// ---------------------------------------------------------------------------
// 2. CONTRATO — o dreno tem que virar regra PURA com dono declarado
//    (VERMELHO até a correção D-09 entrar)
//
//    Dono proposto: `src/utils/poopDrain.ts`, ao lado de `careRules.ts`, pelo
//    mesmo motivo que careRules existe: regra dentro de handler do App diverge
//    em silêncio do desktop (footgun 9 do CLAUDE.md).
//
//    Assinatura esperada:
//      applyPoopDrain(state, { now: number; isSleeping: boolean }) => state
// ---------------------------------------------------------------------------
type DrainState = {
  healthPoints: number;
  poopEventsShown: number[];
  poopEventsCompleted: number[];
  poopPenaltyClockAt: number;
  petPassive?: string;
  lastResetDate?: string;
};

const base = (over: Partial<DrainState> = {}): DrainState => ({
  healthPoints: 3,
  poopEventsShown: [0],
  poopEventsCompleted: [],
  poopPenaltyClockAt: 0,
  lastResetDate: new Date().toDateString(),
  ...over,
});

async function applyPoopDrain(
  s: DrainState,
  o: { now: number; isSleeping: boolean },
): Promise<DrainState> {
  // Especificador montado em runtime DE PROPOSITO: o modulo dono ainda nao
  // existe (a correcao D-09 e quem o cria). Import estatico deixaria o
  // `npx tsc --noEmit` do repo inteiro vermelho, o que bloquearia todo mundo;
  // assim a falha fica onde tem que ficar: no teste, em runtime.
  const spec = ['.', 'poopDrain'].join('/');
  const mod = (await import(/* @vite-ignore */ spec)) as unknown as {
    applyPoopDrain: (a: DrainState, b: typeof o) => DrainState;
  };
  return mod.applyPoopDrain(s, o);
}

describe('CONTRATO: o dreno respeita o teto diário (CLAUDE.md:76)', () => {
  it('24h de cocô não limpo custa no máximo MAX_HEARTS_LOST_PER_DAY', async () => {
    const now = Date.now();
    const out = await applyPoopDrain(
      base({ poopPenaltyClockAt: now - 24 * 3600000, healthPoints: 4 }),
      { now, isSleeping: false },
    );
    expect(4 - out.healthPoints).toBeLessThanOrEqual(MAX_HEARTS_LOST_PER_DAY);
    expect(out.healthPoints).toBeGreaterThan(0); // nunca degenera por relógio
  });

  it('6h exatas custam 1 coração — o dreno continua existindo', async () => {
    const now = Date.now();
    const out = await applyPoopDrain(
      base({ poopPenaltyClockAt: now - SIX_HOURS }),
      { now, isSleeping: false },
    );
    expect(out.healthPoints).toBe(2);
  });

  it('menos de 6h não cobra nada', async () => {
    const now = Date.now();
    const out = await applyPoopDrain(
      base({ poopPenaltyClockAt: now - 5 * 3600000 }),
      { now, isSleeping: false },
    );
    expect(out.healthPoints).toBe(3);
  });

  it('o traço Teimoso vale aqui como vale na virada (0,5)', async () => {
    const now = Date.now();
    const out = await applyPoopDrain(
      base({ poopPenaltyClockAt: now - 24 * 3600000, petPassive: 'teimoso' }),
      { now, isSleeping: false },
    );
    expect(3 - out.healthPoints).toBeLessThanOrEqual(heartLossCap('teimoso', MAX_HEARTS_LOST_PER_DAY));
  });

  it('dormindo não cobra (só empurra o relógio)', async () => {
    const now = Date.now();
    const out = await applyPoopDrain(
      base({ poopPenaltyClockAt: now - 24 * 3600000 }),
      { now, isSleeping: true },
    );
    expect(out.healthPoints).toBe(3);
  });

  it('cocô limpo zera o relógio e não cobra', async () => {
    const now = Date.now();
    const out = await applyPoopDrain(
      base({ poopEventsCompleted: [0], poopPenaltyClockAt: now - 24 * 3600000 }),
      { now, isSleeping: false },
    );
    expect(out.healthPoints).toBe(3);
    expect(out.poopPenaltyClockAt).toBe(0);
  });
});

describe('CONTRATO: ausência ≥2 dias não cobra nada (ABSENCE_FORGIVENESS_DAYS)', () => {
  it('quem volta depois de 3 dias com cocô pendente não perde HP nenhum', async () => {
    const now = Date.now();
    const out = await applyPoopDrain(
      base({
        poopPenaltyClockAt: now - 72 * 3600000,
        lastResetDate: new Date(now - 3 * 86400000).toDateString(),
      }),
      { now, isSleeping: false },
    );
    expect(out.healthPoints).toBe(3);
  });

  it('ausência de 2 dias (o limiar) também é perdoada', async () => {
    const now = Date.now();
    const out = await applyPoopDrain(
      base({
        poopPenaltyClockAt: now - 30 * 3600000,
        lastResetDate: new Date(now - 2 * 86400000).toDateString(),
      }),
      { now, isSleeping: false },
    );
    expect(out.healthPoints).toBe(3);
  });

  it('1 dia de ausência NÃO é perdão — o dreno normal (com teto) vale', async () => {
    const now = Date.now();
    const out = await applyPoopDrain(
      base({
        poopPenaltyClockAt: now - 12 * 3600000,
        lastResetDate: new Date(now - 1 * 86400000).toDateString(),
      }),
      { now, isSleeping: false },
    );
    expect(3 - out.healthPoints).toBeLessThanOrEqual(MAX_HEARTS_LOST_PER_DAY);
  });
});

// ---------------------------------------------------------------------------
// 3. GUARD DE ORIGEM — no fonte (VERMELHO até a correção entrar)
//    Sem esta camada, alguém reescreve a subtração crua em App.tsx e o
//    contrato acima continua verde apontando para um módulo que ninguém chama.
// ---------------------------------------------------------------------------
describe('GUARD: nenhuma subtração crua de HP por relógio sobra em App.tsx', () => {
  it('App.tsx não subtrai `periods` do HP sem passar por regra pura', () => {
    const app = src('App.tsx').replace(/\s+/g, ' ');
    // Booleano, e não toMatch: o fonte inteiro no diff de falha é ilegível.
    expect(/healthPoints: Math\.max\(0, prev\.healthPoints - periods\)/.test(app)).toBe(false);
  });

  it('App.tsx delega o dreno ao dono da regra (utils/poopDrain)', () => {
    expect(/applyPoopDrain/.test(src('App.tsx'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. ACHADO IRMÃO — `poopPenaltyClockAt` na HIDRATAÇÃO do save
//    (GameStateContext.tsx:689 — hoje `num(loadedState.poopPenaltyClockAt, 0)`,
//    restaura o relógio velho tal e qual). É o que cria a CORRIDA entre o
//    dreno (roda na montagem, App.tsx:2032) e o zeramento da virada
//    (dailyReset.ts:769, agendado a cada 30s pelo useDailyReset).
//    Zerar na hidratação elimina a corrida sem depender de ordem de efeitos.
//    (VERMELHO até a correção entrar)
// ---------------------------------------------------------------------------
describe('GUARD: a hidratação do save não ressuscita o relógio do dreno', () => {
  it('GameStateContext não restaura poopPenaltyClockAt cru do save', () => {
    const ctx = src('contexts/GameStateContext.tsx').replace(/\s+/g, ' ');
    expect(/poopPenaltyClockAt: num\(loadedState\.poopPenaltyClockAt, 0\)/.test(ctx)).toBe(false);
  });
});
