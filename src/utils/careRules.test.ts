import { describe, it, expect } from 'vitest';
import {
  feedFood, rubHeal, feedsLeft, foodForCompletedTask,
  FOOD_LIMIT_PER_HOUR, RUB_HEAL_DAILY_CAP, type CareState,
} from './careRules';

// Estas regras agora rodam nos DOIS apps (celular e desktop). Antes viviam
// dentro do App.tsx e o desktop tinha a sua própria cópia — divergir significa
// o mesmo gesto dando resultados diferentes em cada aparelho.

const HORA = 60 * 60 * 1000;

function estado(over: Partial<CareState> = {}): CareState {
  return {
    healthPoints: 1,
    maxHealthPoints: 3,
    energyPoints: 0,
    evolutionStage: 'rookie', // 4 barras de energia
    foodInventory: { '🍎': 2 },
    virusPoints: 0,
    dataPoints: 0,
    vaccinePoints: 0,
    totalXP: 0,
    attributesSinceLastEvolution: { virus: 0, data: 0, vaccine: 0 },
    ...over,
  };
}

describe('alimentar', () => {
  it('consome a comida, dá +1 energia e os atributos da categoria', () => {
    // 🍎 = Study → { virus: 0, data: 3, vaccine: 1 }
    const r = feedFood(estado(), '🍎', [], 0);
    expect(r.refused).toBeUndefined();
    expect(r.state.foodInventory['🍎']).toBe(1);
    expect(r.state.energyPoints).toBe(1);
    expect(r.state.dataPoints).toBe(3);
    expect(r.state.vaccinePoints).toBe(1);
    expect(r.state.attributesSinceLastEvolution).toEqual({ virus: 0, data: 3, vaccine: 1 });
  });

  it('remove a chave do inventário quando acaba', () => {
    const r = feedFood(estado({ foodInventory: { '🍎': 1 } }), '🍎', [], 0);
    expect('🍎' in r.state.foodInventory).toBe(false);
  });

  it('recusa sem estoque, sem gastar uma vaga da hora', () => {
    const r = feedFood(estado({ foodInventory: {} }), '🍎', [], 0);
    expect(r.refused).toBe('no-stock');
    expect(r.feedTimes).toEqual([]);
  });

  it(`recusa a partir da ${FOOD_LIMIT_PER_HOUR}ª comida na mesma hora`, () => {
    const cheio = Array.from({ length: FOOD_LIMIT_PER_HOUR }, (_, i) => i * 1000);
    const r = feedFood(estado(), '🍎', cheio, 5000);
    expect(r.refused).toBe('hourly-limit');
    expect(r.state.foodInventory['🍎']).toBe(2); // nada foi consumido
  });

  it('a janela é deslizante: comida de mais de 1h atrás não conta', () => {
    const antigas = Array.from({ length: FOOD_LIMIT_PER_HOUR }, (_, i) => i * 1000);
    const r = feedFood(estado(), '🍎', antigas, HORA + 10_000);
    expect(r.refused).toBeUndefined();
    expect(r.feedTimes).toHaveLength(1); // as velhas foram podadas
  });

  it('mesmo recusando, poda os timestamps velhos', () => {
    // Senão a lista cresceria para sempre no localStorage.
    const agora = 2 * HORA;
    const velhas = [0, 1000];                                    // > 1h atrás
    const recentes = [1, 2, 3, 4, 5].map(i => agora - i * 1000);  // dentro da hora
    const r = feedFood(estado(), '🍎', [...velhas, ...recentes], agora);
    expect(r.refused).toBe('hourly-limit');
    expect(r.feedTimes).toEqual(recentes);
  });

  it('energia para no número de barras do estágio', () => {
    // rookie exige 4 tarefas → 4 barras.
    const r = feedFood(estado({ energyPoints: 4, foodInventory: { '🍎': 5 } }), '🍎', [], 0);
    expect(r.state.energyPoints).toBe(4);
  });

  it('feedsLeft reflete a janela', () => {
    expect(feedsLeft([], 0)).toBe(FOOD_LIMIT_PER_HOUR);
    expect(feedsLeft([0, 1, 2], 3)).toBe(FOOD_LIMIT_PER_HOUR - 3);
    expect(feedsLeft([0, 1, 2], 2 * HORA)).toBe(FOOD_LIMIT_PER_HOUR);
  });

  it('não mexe em campos fora da fatia de cuidado', () => {
    const comExtras = { ...estado(), perfectDays: 7, gamePoints: 42 };
    const r = feedFood(comExtras, '🍎', [], 0);
    expect(r.state.perfectDays).toBe(7);
    expect(r.state.gamePoints).toBe(42);
  });
});

describe('carinho', () => {
  const HOJE = 'Mon Aug 03 2026';

  it('cura meio coração', () => {
    const r = rubHeal(estado({ healthPoints: 1 }), null, HOJE);
    expect(r.state.healthPoints).toBe(1.5);
    expect(r.record).toEqual({ date: HOJE, healed: 0.5 });
  });

  it(`para no teto de ${RUB_HEAL_DAILY_CAP} coração por dia`, () => {
    const r = rubHeal(estado({ healthPoints: 1 }), { date: HOJE, healed: 1 }, HOJE);
    expect(r.refused).toBe('daily-cap');
    expect(r.state.healthPoints).toBe(1);
  });

  it('o teto reseta no dia seguinte', () => {
    const r = rubHeal(estado({ healthPoints: 1 }), { date: 'Sun Aug 02 2026', healed: 1 }, HOJE);
    expect(r.refused).toBeUndefined();
    expect(r.state.healthPoints).toBe(1.5);
  });

  it('não cura com o HP cheio, e não gasta o carinho do dia', () => {
    const r = rubHeal(estado({ healthPoints: 3, maxHealthPoints: 3 }), null, HOJE);
    expect(r.refused).toBe('already-full');
    expect(r.record.healed).toBe(0);
  });

  it('não passa do HP máximo com meio coração faltando', () => {
    const r = rubHeal(estado({ healthPoints: 2.75, maxHealthPoints: 3 }), null, HOJE);
    expect(r.state.healthPoints).toBe(3);
  });
});

describe('tarefa concluída vira comida', () => {
  it('adiciona a comida da categoria', () => {
    expect(foodForCompletedTask({}, 'Study')).toEqual({ '🍎': 1 });
  });

  it('acumula sobre o que já existe', () => {
    expect(foodForCompletedTask({ '🍎': 2 }, 'Study')).toEqual({ '🍎': 3 });
  });

  it('não dá atributo — atributo vem de alimentar', () => {
    // Guarda a regra da Version B descrita no CLAUDE.md.
    const antes = estado();
    const depois = foodForCompletedTask(antes.foodInventory, 'Study');
    expect(depois).not.toBe(antes.foodInventory);
    expect(antes.dataPoints).toBe(0);
  });
});
