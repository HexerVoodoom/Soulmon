import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import {
  mergeCareCaps, hydrateCareCaps, feedTimesFor, rubHealFor, type CareCaps,
} from './careCaps';
import {
  feedFood, rubHeal, rubRefusal, recentFeeds,
  FOOD_LIMIT_PER_HOUR, RUB_HEAL_DAILY_CAP, RUB_HEAL_STEP,
  type CareState,
} from './careRules';

const HOUR = 60 * 60 * 1000;
const TODAY = new Date('2026-08-25T12:00:00Z').toDateString();
const ONTEM = new Date('2026-08-24T12:00:00Z').toDateString();
const T0 = Date.UTC(2026, 7, 25, 12, 0, 0);
/**
 * O relógio de QUEM CARREGA o save. A higienização de `careCaps` mede os
 * timestamps contra ele (achado X-5): instante no futuro não é registro de
 * nada e é descartado. Fica um minuto depois de `T0` para que todo timestamp
 * fabricado nestes testes seja passado, e não futuro.
 */
const AGORA = T0 + 60_000;

function stateWith(over: Partial<CareState> = {}): CareState {
  return {
    healthPoints: 1,
    maxHealthPoints: 3,
    energyPoints: 0,
    evolutionStage: 'rookie',
    foodInventory: { '🍎': 99 },
    powerPoints: 0,
    harmonyPoints: 0,
    benevolencePoints: 0,
    totalXP: 0,
    attributesSinceLastEvolution: { power: 0, harmony: 0, benevolence: 0 },
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
    expect(mergeCareCaps(undefined, legado, AGORA)).toEqual({
      feedTimes: [T0, T0 + 1, T0 + 2],
      rubHeal: { date: TODAY, healed: 0.5 },
    });
  });

  it('quem já tinha carinho gasto NÃO ganha carinho de volta', () => {
    const caps = mergeCareCaps(undefined, { rubHeal: { date: TODAY, healed: RUB_HEAL_DAILY_CAP } }, AGORA);
    expect(rubRefusal(0.5, 3, rubHealFor(caps, TODAY), TODAY)).toBe('daily-cap');
  });

  it('quem já tinha comida gasta NÃO ganha comida de volta', () => {
    const legado = { feedTimes: Array.from({ length: FOOD_LIMIT_PER_HOUR }, (_, i) => T0 + i) };
    const caps = mergeCareCaps(undefined, legado, AGORA);
    expect(feedFood(stateWith(), '🍎', feedTimesFor(caps, T0), T0).refused).toBe('hourly-limit');
  });

  it('rubHeal usa MAX, nunca soma: migrar não cobra duas vezes o mesmo carinho', () => {
    const caps = mergeCareCaps(
      { rubHeal: { date: TODAY, healed: 0.5 } },
      { rubHeal: { date: TODAY, healed: 0.5 } },
      AGORA,
    );
    expect(caps.rubHeal).toEqual({ date: TODAY, healed: 0.5 });
  });

  it('rubHeal de OUTRO dia no aparelho não sobrescreve o de hoje que veio do save', () => {
    const caps = mergeCareCaps(
      { rubHeal: { date: TODAY, healed: RUB_HEAL_DAILY_CAP } },
      { rubHeal: { date: ONTEM, healed: 0 } },
      AGORA,
    );
    expect(caps.rubHeal).toEqual({ date: TODAY, healed: RUB_HEAL_DAILY_CAP });
  });

  it('feedTimes é UNIÃO com deduplicação: o mesmo instante não conta duas vezes', () => {
    const caps = mergeCareCaps({ feedTimes: [T0, T0 + 1] }, { feedTimes: [T0 + 1, T0 + 2] }, AGORA);
    expect(caps.feedTimes).toEqual([T0, T0 + 1, T0 + 2]);
  });

  it('É IDEMPOTENTE — rodar 3× dá o mesmo que 1× (o load roda no save local E na adoção da nuvem)', () => {
    const legado = { feedTimes: [T0, T0 + 1], rubHeal: { date: TODAY, healed: 0.5 } };
    const uma = mergeCareCaps(undefined, legado, AGORA);
    const tres = mergeCareCaps(mergeCareCaps(mergeCareCaps(undefined, legado, AGORA), legado, AGORA), legado, AGORA);
    expect(tres).toEqual(uma);
  });

  it('sem legado e sem save = vazio (instalação nova não nasce com teto gasto)', () => {
    expect(mergeCareCaps(undefined, {}, AGORA)).toEqual({});
  });

  it('legado ausente não apaga o que já está no save (2ª rodada do load)', () => {
    const noSave = { feedTimes: [T0], rubHeal: { date: TODAY, healed: 0.5 } };
    expect(mergeCareCaps(noSave, {}, AGORA)).toEqual(noSave);
  });
});

describe('hydrateCareCaps — lixo do save nunca vira teto quebrado', () => {
  it.each([null, undefined, 42, 'x', [], { feedTimes: 'nope' }])('%s vira vazio', (v) => {
    expect(hydrateCareCaps(v, AGORA)).toEqual({});
  });

  it('NaN/Infinity saem da janela — ficariam presos nela para sempre e travariam a comida', () => {
    expect(hydrateCareCaps({ feedTimes: [NaN, Infinity, 1, 'a', null] }, AGORA).feedTimes).toEqual([1]);
  });

  it('rubHeal sem `date` é descartado; `healed` torto vira 0 e negativo é aparado', () => {
    expect(hydrateCareCaps({ rubHeal: { healed: 1 } }, AGORA).rubHeal).toBeUndefined();
    expect(hydrateCareCaps({ rubHeal: { date: TODAY, healed: 'x' } }, AGORA).rubHeal)
      .toEqual({ date: TODAY, healed: 0 });
    expect(hydrateCareCaps({ rubHeal: { date: TODAY, healed: -5 } }, AGORA).rubHeal)
      .toEqual({ date: TODAY, healed: 0 });
  });
});

// ---------------------------------------------------------------------------
// A regra pura continua intocada — mudou de onde o estado VEM, nunca o que a
// regra decide. Se alguém copiar a regra para cá, isto cai (footgun 9).
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// REGRESSÃO X-5 — timestamp no FUTURO (achado do gate da fatia 2).
//
// O filtro original de `sanitizeFeedTimes` pegou o `NaN` e não pegou o futuro,
// que é a mesma classe de defeito: `recentFeeds` (`careRules.ts:67-69`) faz
// `now - t < HOUR_MS`, e isso é VERDADEIRO para todo `t` futuro. Enquanto os
// tetos moravam no localStorage o dano ficava preso no aparelho de relógio
// errado; desde a fatia 2 eles moram no save e o dano VIAJA.
//
// O conserto é na PROCEDÊNCIA (`careCaps.ts`), nunca na regra: `careRules.ts`
// continua intocado e continua sendo o único dono da janela de 1h.
// ---------------------------------------------------------------------------
describe('REGRESSÃO X-5 — relógio adiantado não trava a comida, e não viaja no save', () => {
  /** O relógio do aparelho errado, 3h à frente — o cenário do gate. */
  const ADIANTADO = 3 * HOUR;
  const seisNoFuturo = Array.from(
    { length: FOOD_LIMIT_PER_HOUR },
    (_, i) => T0 + ADIANTADO + i * 1000,
  );

  it('X-5 (o defeito, pela regra): para `recentFeeds` todo instante futuro está "na última hora"', () => {
    // Não é um bug de `recentFeeds` — é a razão de o filtro ser na entrada:
    // a regra pura não tem como distinguir "daqui a 3h" de "agora mesmo".
    expect(recentFeeds(seisNoFuturo, T0).length).toBe(FOOD_LIMIT_PER_HOUR);
  });

  it('X-5: as 6 comidas do aparelho adiantado somem no load do aparelho de relógio certo', () => {
    // Aparelho A (relógio +3h) alimentou 6× e mandou os 6 instantes para a nuvem.
    const saveDaNuvem = { feedTimes: seisNoFuturo };
    // Aparelho B, relógio certo, carrega o MESMO save.
    const caps = mergeCareCaps(saveDaNuvem, {}, T0);
    expect(caps.feedTimes, 'instante no futuro não é registro de nada').toBeUndefined();
    // E o efeito que importa para quem joga: ele consegue alimentar.
    expect(
      feedFood(stateWith(), '🍎', feedTimesFor(caps, T0), T0).refused,
      'o jogador ficaria até 4h sem conseguir alimentar, sem explicação na tela',
    ).toBeUndefined();
  });

  it('X-5: no PRÓPRIO aparelho adiantado nada é perdido — o `now` dele também está adiantado', () => {
    // A escolha de `now` (o relógio de quem CARREGA) não pune quem gravou.
    const agoraDele = seisNoFuturo[seisNoFuturo.length - 1]; // o load dele é depois da última comida
    expect(mergeCareCaps({ feedTimes: seisNoFuturo }, {}, agoraDele).feedTimes)
      .toEqual(seisNoFuturo);
  });

  it('X-5 (limite): `t === now` fica, `t === now + 1` sai', () => {
    expect(hydrateCareCaps({ feedTimes: [T0] }, T0).feedTimes).toEqual([T0]);
    expect(hydrateCareCaps({ feedTimes: [T0 + 1] }, T0).feedTimes).toBeUndefined();
  });

  it('X-5: o legado do localStorage passa pelo MESMO filtro na migração', () => {
    // Sem isto, o futuro entrava no save justamente pela porta da migração.
    expect(mergeCareCaps(undefined, { feedTimes: [T0 - 1, T0 + 1] }, T0).feedTimes)
      .toEqual([T0 - 1]);
  });
});

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
