import { describe, it, expect } from 'vitest';
import { createRestState, recordNight, type RestState } from './restWindow';
import {
  nightmaresFor,
  hasPendingNightmare,
  markFought,
  nightmareDayKey,
  nightmareRewards,
  createNightmareState,
  hasPendingGoodDream,
  claimGoodDream,
  type NightmareState,
} from './nightmares';
import { playerDayKey, deviceOffsetMs, type PlayerDayAnchor } from './playerDay';
import { pickPresentation, presentationBacklog } from './presentationQueue';
import {
  nightmareGateOpen,
  nightmareRetryInMs,
  dreamMode,
  NIGHTMARE_AFTER_COMPLETION_MS,
  DREAM_MODAL_HOURS,
  type NightmareGateInput,
} from './nightmareWake';

/** Instantes explícitos em hora LOCAL (sem mexer no TZ do processo). */
const em = (dia: number, h: number, m = 0) => new Date(2026, 9, dia, h, m, 0);
const DEITOU = em(19, 23, 30);
const ACORDOU = em(20, 7, 0);

const noiteArmada = (anchor?: PlayerDayAnchor): RestState =>
  recordNight({ ...createRestState(), ...(anchor ? { playerDayTz: anchor } : {}) }, DEITOU, ACORDOU);

const livre = (nowMs: number, over: Partial<NightmareGateInput> = {}): NightmareGateInput => ({
  nowMs, sleeping: false, wakePending: false, busy: false, onHome: true, completionWokeAt: null, ...over,
});

describe('a) noite armada e abrir às 07h', () => {
  it('há pesadelo pendente e o portão está aberto', () => {
    const rest = noiteArmada();
    expect(nightmaresFor(rest, ACORDOU).count).toBe(1);
    expect(hasPendingNightmare(createNightmareState(), rest, ACORDOU)).toBe(true);
    expect(nightmareGateOpen(livre(ACORDOU.getTime()))).toBe(true);
  });
});

describe('b) o portão não depende da hora', () => {
  it.each([15, 23, 3])('abrir às %ih: portão aberto', (h) => {
    expect(nightmareGateOpen(livre(em(20, h).getTime()))).toBe(true);
  });
  it('o pendente às 15h segue valendo (mesma chave do dia)', () => {
    expect(hasPendingNightmare(createNightmareState(), noiteArmada(), em(20, 15))).toBe(true);
  });
});

describe('c) app fechado a noite toda', () => {
  it('só a noite gravada + uma abertura de tarde: pendente', () => {
    expect(hasPendingNightmare(createNightmareState(), noiteArmada(), em(20, 16, 40))).toBe(true);
  });
});

describe('d) sem noite', () => {
  const rest = createRestState();
  it('count 0 e não pendente', () => {
    expect(nightmaresFor(rest, ACORDOU).count).toBe(0);
    expect(hasPendingNightmare(createNightmareState(), rest, ACORDOU)).toBe(false);
  });
  it('na fila o 1º é o resumo do dia', () => {
    const ready = { nightmare: false, dailyReport: true };
    expect(pickPresentation(ready)).toBe('dailyReport');
    expect(presentationBacklog(ready)[0]).toBe('dailyReport');
  });
});

describe('e) dormindo / à espera de acordar', () => {
  const t = ACORDOU.getTime();
  it('sleeping e wakePending fecham o portão', () => {
    expect(nightmareGateOpen(livre(t, { sleeping: true }))).toBe(false);
    expect(nightmareGateOpen(livre(t, { wakePending: true }))).toBe(false);
  });
  it('na fila: holdDayStart segura; sem hold o pesadelo é o 1º', () => {
    const ready = { nightmare: true, dailyReport: true };
    expect(presentationBacklog(ready, null, undefined, { holdDayStart: true })).not.toContain('nightmare');
    expect(presentationBacklog(ready, null, undefined, { holdDayStart: false })[0]).toBe('nightmare');
  });
});

describe('f) acordou por concluir tarefa', () => {
  const t0 = em(20, 9).getTime();
  const base = { completionWokeAt: t0 };
  it('1s depois: fechado', () => {
    expect(nightmareGateOpen(livre(t0 + 1000, base))).toBe(false);
  });
  it('5s depois, fora da Home: fechado', () => {
    expect(nightmareGateOpen(livre(t0 + NIGHTMARE_AFTER_COMPLETION_MS, { ...base, onHome: false }))).toBe(false);
  });
  it('5s depois, na Home: aberto', () => {
    expect(nightmareGateOpen(livre(t0 + NIGHTMARE_AFTER_COMPLETION_MS, base))).toBe(true);
  });
  it('nightmareRetryInMs é coerente', () => {
    expect(nightmareRetryInMs(livre(t0 + 1000, base))).toBe(NIGHTMARE_AFTER_COMPLETION_MS - 1000);
    expect(nightmareRetryInMs(livre(t0 + 9000, base))).toBe(0);
    expect(nightmareRetryInMs(livre(t0 + 1000))).toBeNull();
    expect(nightmareRetryInMs(livre(t0 + 1000, { ...base, busy: true }))).toBeNull();
  });
});

describe('g) masmorra / missão da guilda', () => {
  const rest = noiteArmada();
  it('ocupado: fechado; livre no mesmo dia: aberto', () => {
    expect(nightmareGateOpen(livre(em(20, 14).getTime(), { busy: true }))).toBe(false);
    expect(nightmareGateOpen(livre(em(20, 18).getTime(), { busy: false }))).toBe(true);
    expect(hasPendingNightmare(createNightmareState(), rest, em(20, 18))).toBe(true);
  });
  it('no dia seguinte expira sozinho, e `fought` não muda', () => {
    const nm = createNightmareState();
    expect(hasPendingNightmare(nm, rest, em(21, 8))).toBe(false);
    expect(nm.fought).toEqual([]);
  });
});

describe('h) sonho bom', () => {
  it('ocupa o slot sob o mesmo portão e, depois de coletado, o pesadelo volta', () => {
    const rest = noiteArmada();
    const nm: NightmareState = { fought: [], goodDream: true };
    expect(hasPendingGoodDream(nm)).toBe(true);
    expect(nightmareGateOpen(livre(ACORDOU.getTime(), { busy: true }))).toBe(false);
    expect(nightmareGateOpen(livre(ACORDOU.getTime()))).toBe(true);
    const { state } = claimGoodDream(nm);
    expect(hasPendingGoodDream(state)).toBe(false);
    const dia2 = recordNight(rest, em(20, 23, 30), em(21, 7));
    expect(hasPendingNightmare(state, dia2, em(21, 8))).toBe(true);
  });
});

describe('i) pular/perder sem custo', () => {
  const rest = noiteArmada();
  const key = nightmareDayKey(ACORDOU, rest.playerDayTz);
  it('markFought não mexe em nada além de `nightmares`; perder paga zero', () => {
    expect(nightmareRewards('legendary', false)).toEqual({ hearts: 0, energy: 0, bits: 0 });
    const save = { nightmares: createNightmareState(), hp: 3, bits: 10, energy: 5 };
    for (const count of [false, true]) {
      const depois = { ...save, nightmares: markFought(save.nightmares, key, count) };
      expect({ ...depois, nightmares: 0 }).toEqual({ ...save, nightmares: 0 });
      expect(hasPendingNightmare(depois.nightmares, rest, ACORDOU)).toBe(false);
    }
  });
  it('2º aparelho com a key em `fought` não repete', () => {
    const nm = markFought(createNightmareState(), key, false);
    expect(hasPendingNightmare(nm, rest, em(20, 15))).toBe(false);
  });
});

describe('j) fuso do jogador', () => {
  const ancora: PlayerDayAnchor = { offsetMs: deviceOffsetMs(em(20, 12)) + 13 * 3600000 };
  it('a chave do jogador decide; abrir às 15h do aparelho segue aberto', () => {
    const acordou = em(20, 12);
    const rest = recordNight({ ...createRestState(), playerDayTz: ancora }, em(20, 4), acordou);
    expect(rest.nights[0].date).toBe(playerDayKey(acordou, ancora));
    expect(hasPendingNightmare(createNightmareState(), rest, em(20, 15))).toBe(true);
    expect(nightmareGateOpen(livre(em(20, 15).getTime()))).toBe(true);
  });
});

describe('k) dreamMode', () => {
  it('07h modal; 4h dentro; 12h fora', () => {
    expect(dreamMode(7, false)).toBe('modal');
    expect(dreamMode(DREAM_MODAL_HOURS.from, false)).toBe('modal');
    expect(dreamMode(DREAM_MODAL_HOURS.to, false)).toBe('none');
    expect(dreamMode(12, true)).toBe('silent');
  });
  it('15h: silent com slot pendente, none sem', () => {
    expect(dreamMode(15, true)).toBe('silent');
    expect(dreamMode(15, false)).toBe('none');
  });
});
