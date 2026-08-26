import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import {
  mergeCareCaps, hydrateCareCaps, feedTimesFor, rubHealFor, type CareCaps,
} from './careCaps';
import {
  feedFood, rubHeal, rubRefusal, FOOD_LIMIT_PER_HOUR, RUB_HEAL_DAILY_CAP, RUB_HEAL_STEP,
  type CareState,
} from './careRules';

const HOUR = 60 * 60 * 1000;
const TODAY = new Date('2026-08-25T12:00:00Z').toDateString();
const ONTEM = new Date('2026-08-24T12:00:00Z').toDateString();
const T0 = Date.UTC(2026, 7, 25, 12, 0, 0);

function stateWith(over: Partial<CareState> = {}): CareState {
  return {
    healthPoints: 1,
    maxHealthPoints: 3,
    energyPoints: 0,
    evolutionStage: 'rookie',
    foodInventory: { '🍎': 99 },
    virusPoints: 0,
    dataPoints: 0,
    vaccinePoints: 0,
    totalXP: 0,
    attributesSinceLastEvolution: { virus: 0, data: 0, vaccine: 0 },
    ...over,
  };
}

// ---------------------------------------------------------------------------
// O furo que este trabalho fecha: DOIS APARELHOS, UM SAVE.
//
// Antes, cada aparelho tinha o próprio contador no localStorage. Estes testes
// simulam PWA e APK compartilhando o MESMO objeto de save — que é exatamente o
// que muda quando os tetos saem do localStorage.
// ---------------------------------------------------------------------------
describe('teto através de dois aparelhos no mesmo save', () => {
  it('comida: 6/hora contando os dois aparelhos juntos, não 6 em cada', () => {
    let state = stateWith();
    let caps: CareCaps = {};
    let aceitas = 0;

    // Alterna PWA/APK; os dois leem e escrevem o MESMO `caps` (o save).
    for (let i = 0; i < FOOD_LIMIT_PER_HOUR * 2; i++) {
      const t = T0 + i * 1000;
      const r = feedFood(state, '🍎', feedTimesFor(caps, t), t);
      if (!r.refused) aceitas++;
      state = r.state;
      caps = { ...caps, feedTimes: r.feedTimes };
    }

    expect(aceitas).toBe(FOOD_LIMIT_PER_HOUR);
    // O contrafactual: com um contador POR APARELHO teriam passado 12.
    expect(aceitas).not.toBe(FOOD_LIMIT_PER_HOUR * 2);
  });

  it('carinho: 1 coração/dia contando os dois aparelhos juntos, não 1 em cada', () => {
    let state = stateWith({ healthPoints: 0.5, maxHealthPoints: 3 });
    let caps: CareCaps = {};
    const hpInicial = state.healthPoints;

    for (let i = 0; i < 10; i++) {
      const r = rubHeal(state, rubHealFor(caps, TODAY), TODAY);
      if (r.refused) continue;
      state = r.state;
      caps = { ...caps, rubHeal: r.record };
    }

    expect(state.healthPoints - hpInicial).toBe(RUB_HEAL_DAILY_CAP);
    expect(state.healthPoints - hpInicial).not.toBe(RUB_HEAL_DAILY_CAP * 2);
  });

  it('a janela desliza: passada 1h o segundo aparelho volta a poder alimentar', () => {
    const cheia = Array.from({ length: FOOD_LIMIT_PER_HOUR }, (_, i) => T0 + i);
    expect(feedTimesFor({ feedTimes: cheia }, T0).length).toBe(FOOD_LIMIT_PER_HOUR);
    expect(feedTimesFor({ feedTimes: cheia }, T0 + HOUR + FOOD_LIMIT_PER_HOUR).length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Migração: nem perda nem ganho de cuidado na virada.
// ---------------------------------------------------------------------------
describe('mergeCareCaps — migração do localStorage para o save', () => {
  it('save sem tetos + legado do aparelho = o legado, intacto (nem perda nem ganho)', () => {
    const legado = { feedTimes: [T0, T0 + 1, T0 + 2], rubHeal: { date: TODAY, healed: 0.5 } };
    expect(mergeCareCaps(undefined, legado)).toEqual({
      feedTimes: [T0, T0 + 1, T0 + 2],
      rubHeal: { date: TODAY, healed: 0.5 },
    });
  });

  it('quem já tinha carinho gasto NÃO ganha carinho de volta', () => {
    const caps = mergeCareCaps(undefined, { rubHeal: { date: TODAY, healed: RUB_HEAL_DAILY_CAP } });
    expect(rubRefusal(0.5, 3, rubHealFor(caps, TODAY), TODAY)).toBe('daily-cap');
  });

  it('quem já tinha comida gasta NÃO ganha comida de volta', () => {
    const legado = { feedTimes: Array.from({ length: FOOD_LIMIT_PER_HOUR }, (_, i) => T0 + i) };
    const caps = mergeCareCaps(undefined, legado);
    expect(feedFood(stateWith(), '🍎', feedTimesFor(caps, T0), T0).refused).toBe('hourly-limit');
  });

  it('rubHeal usa MAX, nunca soma: migrar não cobra duas vezes o mesmo carinho', () => {
    const caps = mergeCareCaps(
      { rubHeal: { date: TODAY, healed: 0.5 } },
      { rubHeal: { date: TODAY, healed: 0.5 } },
    );
    expect(caps.rubHeal).toEqual({ date: TODAY, healed: 0.5 });
  });

  it('rubHeal de OUTRO dia no aparelho não sobrescreve o de hoje que veio do save', () => {
    const caps = mergeCareCaps(
      { rubHeal: { date: TODAY, healed: RUB_HEAL_DAILY_CAP } },
      { rubHeal: { date: ONTEM, healed: 0 } },
    );
    expect(caps.rubHeal).toEqual({ date: TODAY, healed: RUB_HEAL_DAILY_CAP });
  });

  it('feedTimes é UNIÃO com deduplicação: o mesmo instante não conta duas vezes', () => {
    const caps = mergeCareCaps({ feedTimes: [T0, T0 + 1] }, { feedTimes: [T0 + 1, T0 + 2] });
    expect(caps.feedTimes).toEqual([T0, T0 + 1, T0 + 2]);
  });

  it('É IDEMPOTENTE — rodar 3× dá o mesmo que 1× (o load roda no save local E na adoção da nuvem)', () => {
    const legado = { feedTimes: [T0, T0 + 1], rubHeal: { date: TODAY, healed: 0.5 } };
    const uma = mergeCareCaps(undefined, legado);
    const tres = mergeCareCaps(mergeCareCaps(mergeCareCaps(undefined, legado), legado), legado);
    expect(tres).toEqual(uma);
  });

  it('sem legado e sem save = vazio (instalação nova não nasce com teto gasto)', () => {
    expect(mergeCareCaps(undefined, {})).toEqual({});
  });

  it('legado ausente não apaga o que já está no save (2ª rodada do load)', () => {
    const noSave = { feedTimes: [T0], rubHeal: { date: TODAY, healed: 0.5 } };
    expect(mergeCareCaps(noSave, {})).toEqual(noSave);
  });
});

describe('hydrateCareCaps — lixo do save nunca vira teto quebrado', () => {
  it.each([null, undefined, 42, 'x', [], { feedTimes: 'nope' }])('%s vira vazio', (v) => {
    expect(hydrateCareCaps(v)).toEqual({});
  });

  it('NaN/Infinity saem da janela — ficariam presos nela para sempre e travariam a comida', () => {
    expect(hydrateCareCaps({ feedTimes: [NaN, Infinity, 1, 'a', null] }).feedTimes).toEqual([1]);
  });

  it('rubHeal sem `date` é descartado; `healed` torto vira 0 e negativo é aparado', () => {
    expect(hydrateCareCaps({ rubHeal: { healed: 1 } }).rubHeal).toBeUndefined();
    expect(hydrateCareCaps({ rubHeal: { date: TODAY, healed: 'x' } }).rubHeal)
      .toEqual({ date: TODAY, healed: 0 });
    expect(hydrateCareCaps({ rubHeal: { date: TODAY, healed: -5 } }).rubHeal)
      .toEqual({ date: TODAY, healed: 0 });
  });
});

// ---------------------------------------------------------------------------
// A regra pura continua intocada — mudou de onde o estado VEM, nunca o que a
// regra decide. Se alguém copiar a regra para cá, isto cai (footgun 9).
// ---------------------------------------------------------------------------
describe('a regra pura permanece a dona da decisão', () => {
  it('careCaps.ts não redeclara nenhuma constante de teto nem a janela de 1h', () => {
    const src = readFileSync('src/utils/careCaps.ts', 'utf-8');
    expect(src).not.toMatch(/FOOD_LIMIT_PER_HOUR\s*=/);
    expect(src).not.toMatch(/RUB_HEAL_DAILY_CAP\s*=/);
    expect(src).not.toMatch(/RUB_HEAL_STEP\s*=/);
    expect(src).not.toMatch(/60\s*\*\s*60\s*\*\s*1000/);
    expect(src).toContain("from './careRules'");
  });

  it('os ajudantes só delegam: mesma resposta da regra chamada direto', () => {
    const times = [T0 - HOUR - 1, T0 - 10, T0];
    expect(feedTimesFor({ feedTimes: times }, T0)).toEqual([T0 - 10, T0]);
    expect(rubHealFor({ rubHeal: { date: ONTEM, healed: 9 } }, TODAY))
      .toEqual({ date: TODAY, healed: 0 });
  });

  it('o passo de cura continua vindo da regra, não daqui', () => {
    const r = rubHeal(stateWith({ healthPoints: 0.5 }), rubHealFor({}, TODAY), TODAY);
    expect(r.state.healthPoints).toBe(0.5 + RUB_HEAL_STEP);
    expect(r.record.healed).toBe(RUB_HEAL_STEP);
  });
});
