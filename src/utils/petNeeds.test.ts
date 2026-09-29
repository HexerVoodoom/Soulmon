import { describe, expect, it } from 'vitest';
import {
  LOW_ENERGY_RATIO,
  PLAY_ATTRIBUTE_POINT,
  PLAY_BUFF_DURATION_MIN,
  PLAY_BUFF_MULTIPLIER,
  PLAY_ENERGY_COST,
  activeBuff,
  canPlay,
  consumeBuff,
  minigameMultiplier,
  needsAttention,
  play,
  tiredness,
  tirednessMessage,
} from './petNeeds';
import type { PetNeedsState } from './petNeeds';
import { dayKeyOf } from './habitRhythm';
import { createRestState } from './restWindow';

const NOW = new Date(2026, 7, 19, 10, 0, 0);
const TODAY = dayKeyOf(NOW);

function baseState(over: Partial<PetNeedsState> = {}): PetNeedsState {
  return {
    energyPoints: 3,
    foodInventory: {},
    evolutionStage: 'rookie',
    tasks: [],
    activities: [],
    ...over,
  };
}

describe('brincar', () => {
  it('é 1×/dia e a segunda chamada é idempotente', () => {
    const s = baseState();
    expect(canPlay(s, TODAY)).toBe(true);

    const first = play(s, TODAY, NOW);
    expect(first.refused).toBeUndefined();
    expect(first.buff?.kind).toBe('minigame');
    expect(first.state.energyPoints).toBe(3 - PLAY_ENERGY_COST);
    expect(canPlay(first.state, TODAY)).toBe(false);

    const second = play(first.state, TODAY, NOW);
    expect(second.refused).toBe('already-played');
    expect(second.state).toBe(first.state);
    expect(second.state.energyPoints).toBe(first.state.energyPoints);
  });

  it('recusa sem energia e não muda nada', () => {
    const s = baseState({ energyPoints: 0 });
    expect(canPlay(s, TODAY)).toBe(false);
    const r = play(s, TODAY, NOW);
    expect(r.refused).toBe('no-energy');
    expect(r.buff).toBeUndefined();
    expect(r.state).toBe(s);
  });

  it('dá um ponto de atributo da categoria do buff', () => {
    const s = baseState({ powerPoints: 0, harmonyPoints: 0, benevolencePoints: 0 });
    const { state, buff } = play(s, TODAY, NOW);
    const key = `${buff!.attribute}Points` as 'powerPoints' | 'harmonyPoints' | 'benevolencePoints';
    expect(state[key]).toBe(PLAY_ATTRIBUTE_POINT);
    const total = (state.powerPoints ?? 0) + (state.harmonyPoints ?? 0) + (state.benevolencePoints ?? 0);
    expect(total).toBe(PLAY_ATTRIBUTE_POINT);
  });

  it('o buff vale, expira e o multiplicador nunca fica abaixo de 1', () => {
    const { state } = play(baseState(), TODAY, NOW);
    expect(activeBuff(state, NOW)).not.toBeNull();
    expect(minigameMultiplier(state, NOW)).toBe(PLAY_BUFF_MULTIPLIER);

    const later = new Date(NOW.getTime() + (PLAY_BUFF_DURATION_MIN + 1) * 60000);
    expect(activeBuff(state, later)).toBeNull();
    // expirado NÃO vira penalidade: volta ao neutro
    expect(minigameMultiplier(state, later)).toBe(1);
    expect(minigameMultiplier(baseState(), NOW)).toBe(1);
  });

  it('consumir o buff não devolve a permissão de brincar de novo', () => {
    const { state } = play(baseState(), TODAY, NOW);
    const after = consumeBuff(state);
    expect(activeBuff(after, NOW)).toBeNull();
    expect(canPlay(after, TODAY)).toBe(false);
  });
});

describe('cansaço derivado', () => {
  const heavyTasks = Array.from({ length: 8 }, (_, i) => ({
    id: `t${i}`,
    effort: 1 as const,
    startDate: dayKeyOf(new Date(2026, 7, 18)),
  }));

  it("'tired' quando a carga de ontem passou do limite", () => {
    expect(tiredness(baseState({ tasks: heavyTasks }), NOW)).toBe('tired');
  });

  it("'tired' quando a noite ficou fora da janela", () => {
    const rest = createRestState();
    rest.nights = [{ date: TODAY, onTime: false }];
    expect(tiredness(baseState({ rest }), NOW)).toBe('tired');
  });

  it("'rested' com boa constância de noites na janela", () => {
    const rest = createRestState();
    rest.nights = Array.from({ length: 6 }, (_, i) => ({
      date: dayKeyOf(new Date(NOW.getTime() - i * 86400000)),
      onTime: true,
    }));
    expect(tiredness(baseState({ rest }), NOW)).toBe('rested');
  });

  it("'normal' sem dado nenhum — noite sem registro é neutra", () => {
    expect(tiredness(baseState(), NOW)).toBe('normal');
    expect(tiredness(baseState({ rest: createRestState() }), NOW)).toBe('normal');
  });

  it('as falas existem nos dois idiomas e não levam emoji', () => {
    const emoji = /\p{Extended_Pictographic}/u;
    for (const level of ['rested', 'normal', 'tired'] as const) {
      for (const lang of ['en', 'pt-BR']) {
        const msg = tirednessMessage(level, lang);
        expect(msg.length).toBeGreaterThan(0);
        expect(emoji.test(msg)).toBe(false);
      }
    }
    expect(tirednessMessage('tired', 'pt-BR')).not.toBe(tirednessMessage('tired', 'en'));
  });

  it('NÃO altera energia, HP nem perfectDays — é só cosmético', () => {
    const state = { ...baseState({ tasks: heavyTasks }), healthPoints: 3, perfectDays: 5 };
    const snapshot = JSON.stringify(state);
    const level = tiredness(state, NOW);
    expect(level).toBe('tired');
    // a função não escreve nada
    expect(JSON.stringify(state)).toBe(snapshot);
    expect(state.energyPoints).toBe(3);
    expect(state.healthPoints).toBe(3);
    expect(state.perfectDays).toBe(5);

    // e nenhuma outra função deste módulo reage ao cansaço
    expect(minigameMultiplier(state, NOW)).toBe(1);
    expect(canPlay(state, TODAY)).toBe(true);
    const played = play(state, TODAY, NOW);
    expect(played.buff?.multiplier).toBe(PLAY_BUFF_MULTIPLIER);
    expect(tiredness(baseState(), NOW)).toBe('normal');
  });
});

describe('needsAttention', () => {
  it('devolve no máximo UM item, com par EN/PT', () => {
    const s = baseState({ hasPoop: true, energyPoints: 0, foodInventory: { '🍎': 3 } });
    const wishes = needsAttention(s, NOW);
    expect(wishes).toHaveLength(1);
    expect(wishes[0].kind).toBe('shower');
    expect(wishes[0].en.length).toBeGreaterThan(0);
    expect(wishes[0].pt.length).toBeGreaterThan(0);
    expect(wishes[0].en).not.toBe(wishes[0].pt);
  });

  it('oferece brincar quando dá, e comida só com estoque e energia baixa', () => {
    expect(needsAttention(baseState(), NOW)[0].kind).toBe('play');

    const played = play(baseState({ energyPoints: 0, foodInventory: { '🍎': 1 } }), TODAY, NOW).state;
    expect(needsAttention({ ...played, playLog: { date: TODAY } }, NOW)[0].kind).toBe('feed');

    // sem estoque não sugere comer (seria cobrar tarefa por tabela)
    const noStock = { ...baseState({ energyPoints: 0 }), playLog: { date: TODAY } };
    expect(needsAttention(noStock, NOW)).toHaveLength(0);
  });

  it('energia acima do corte não gera sugestão de comida', () => {
    const s = { ...baseState({ energyPoints: 4, foodInventory: { '🍎': 2 } }), playLog: { date: TODAY } };
    expect(s.energyPoints).toBeGreaterThan(4 * LOW_ENERGY_RATIO);
    expect(needsAttention(s, NOW)).toHaveLength(0);
  });
});

describe('nenhuma função devolve penalidade', () => {
  it('brincar só gasta a energia declarada e nunca mexe em HP/perfectDays', () => {
    const state = { ...baseState(), healthPoints: 2, perfectDays: 7, gamePoints: 100 };
    const { state: after } = play(state, TODAY, NOW);
    expect(after.healthPoints).toBe(2);
    expect(after.perfectDays).toBe(7);
    expect(after.gamePoints).toBe(100);
    expect(state.energyPoints - after.energyPoints).toBe(PLAY_ENERGY_COST);
    expect(after.energyPoints).toBeGreaterThanOrEqual(0);
  });

  it('multiplicador nunca é menor que 1 em nenhum estado', () => {
    const states: PetNeedsState[] = [
      baseState(),
      baseState({ energyPoints: 0 }),
      play(baseState(), TODAY, NOW).state,
      { ...baseState(), playLog: { date: TODAY } },
      { ...baseState(), playLog: { date: TODAY, buff: { kind: 'minigame', multiplier: PLAY_BUFF_MULTIPLIER, expiresAt: 'lixo', attribute: 'harmony' } } },
    ];
    for (const s of states) {
      expect(minigameMultiplier(s, NOW)).toBeGreaterThanOrEqual(1);
      expect(minigameMultiplier(s, new Date(NOW.getTime() + 86400000))).toBeGreaterThanOrEqual(1);
    }
  });
});
