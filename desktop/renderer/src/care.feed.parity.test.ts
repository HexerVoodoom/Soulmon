// PARIDADE DA COMIDA SEM CONTA — a última regra que o overlay reimplementava.
//
// O achado: `menu.ts:459` fazia
//   `state.energy = Math.min(state.maxEnergy, state.energy + 1)`
// LOGO DEPOIS de chamar `feedFood`, que já devolve exatamente essa energia
// calculada com `getMaxEnergyForStage(evolutionStage)`. A regra estava escrita
// duas vezes; hoje as duas dão o mesmo número por coincidência de origem
// (`state.maxEnergy` é preenchido por `cloudSync` com a MESMA função), então a
// mudança é ESTRUTURAL e o que se prova aqui é paridade byte a byte com o
// caminho antigo — mais o guard que faz a coincidência parar de ser sorte.
import { describe, it, expect } from 'vitest';
import { localFeed, remoteFeed } from './care';
import { hungerAt } from '../../../src/utils/hunger';
import { feedFood, FOOD_LIMIT_PER_HOUR, type CareState } from '../../../src/utils/careRules';
import { getMaxEnergyForStage } from '../../../src/types/progression';

const AGORA = 1_772_000_000_000;

/**
 * O CAMINHO ANTIGO, copiado de `menu.ts` (pré-conserto) linha a linha:
 * pré-teste de janela, `feedFood` com o cast mentiroso, e a energia à mão.
 * Está aqui para o teste poder AFIRMAR que nada mudou para o jogador.
 */
function legado(
  st: { stage: string; energy: number; maxEnergy: number; foodInventory: Record<string, number>; feedTimes: number[] },
  emoji: string,
  now: number,
) {
  const local = feedFood(st as unknown as CareState, emoji, st.feedTimes, now);
  if (local.refused) return { energy: st.energy, foodInventory: st.foodInventory, refused: local.refused };
  return {
    foodInventory: local.state.foodInventory,
    energy: Math.min(st.maxEnergy, st.energy + 1),
    refused: undefined as undefined | string,
  };
}

const ESTAGIOS = ['rookie', 'champion-power', 'ultimate-harmony', 'mega-benevolence', 'ultra'];

describe('a comida sem conta continua a MESMA regra do app (beta-2 3.5: comer sobe a FOME, não a energia)', () => {
  it('em todo estágio, energia, estoque e janela: as recusas e o estoque são os do caminho antigo — e a energia NÃO muda ao comer', () => {
    let casos = 0;
    for (const stage of ESTAGIOS) {
      const maxEnergy = getMaxEnergyForStage(stage);
      for (let energy = 0; energy <= maxEnergy; energy++) {
        for (const foodInventory of [{}, { '🍎': 1 }, { '🍎': 3, '🍚': 2 }] as Record<string, number>[]) {
          for (const feedTimes of [
            [],
            [AGORA - 1000],
            Array.from({ length: FOOD_LIMIT_PER_HOUR }, (_, i) => AGORA - i * 1000), // janela cheia
            Array.from({ length: FOOD_LIMIT_PER_HOUR }, (_, i) => AGORA - 2 * 3600_000 - i), // toda vencida
          ]) {
            const base = { stage, energy, maxEnergy, foodInventory, feedTimes };
            const velho = legado({ ...base }, '🍎', AGORA);
            const novo = localFeed({ stage, energy, foodInventory, feedTimes }, '🍎', AGORA);
            expect(novo.refused, `${stage}/${energy}`).toBe(velho.refused);
            expect(novo.foodInventory, `${stage}/${energy}`).toEqual(velho.foodInventory);
            // A ÚNICA diferença para o caminho antigo é a pedida pelo dono: a comida não dá mais +1 de energia.
            expect(novo.energy, `${stage}/${energy}`).toBe(energy);
            casos++;
          }
        }
      }
    }
    expect(casos).toBeGreaterThan(100);
  });
});

describe('o overlay não reescreve a energia: comer nunca a muda, em estágio nenhum', () => {
  it.each(ESTAGIOS)('%s: dez comidas seguidas deixam a energia onde estava', stage => {
    let st = { stage, energy: 3, foodInventory: { '🍎': 99 } as Record<string, number>, feedTimes: [] as number[] };
    for (let i = 0; i < 10; i++) {
      // Janela sempre limpa: o que se mede aqui é a energia, não o ritmo.
      const r = localFeed({ ...st, feedTimes: [] }, '🍎', AGORA + i * 1000);
      expect(r.refused).toBeUndefined();
      st = { ...st, energy: r.energy, foodInventory: r.foodInventory };
    }
    expect(st.energy).toBe(3);
  });

  it('não há campo de teto para o chamador passar errado (o tipo `LocalFeedState` não tem `maxEnergy`)', () => {
    const r = localFeed({ stage: 'mega-harmony', energy: 11, foodInventory: { '🍎': 1 }, feedTimes: [] }, '🍎', AGORA);
    expect(r.energy).toBe(11);
    expect(getMaxEnergyForStage('mega-harmony')).toBe(12);
  });
});

describe('as recusas continuam sendo as do app', () => {
  it('sem estoque devolve no-stock e nao mexe em nada', () => {
    const r = localFeed({ stage: 'rookie', energy: 1, foodInventory: {}, feedTimes: [] }, '🍎', AGORA);
    expect(r.refused).toBe('no-stock');
    expect(r.energy).toBe(1);
  });

  it('janela cheia devolve hourly-limit e PODA os vencidos mesmo recusando', () => {
    const cheia = Array.from({ length: FOOD_LIMIT_PER_HOUR }, (_, i) => AGORA - i * 1000);
    const r = localFeed(
      { stage: 'rookie', energy: 0, foodInventory: { '🍎': 5 }, feedTimes: [...cheia, AGORA - 5 * 3600_000] },
      '🍎', AGORA,
    );
    expect(r.refused).toBe('hourly-limit');
    expect(r.feedTimes).toHaveLength(FOOD_LIMIT_PER_HOUR); // o vencido saiu
    expect(r.energy).toBe(0);
  });

  it('o limite de ritmo continua sendo o do app, nao um literal do overlay', () => {
    let st = { stage: 'rookie', energy: 0, foodInventory: { '🍎': 99 } as Record<string, number>, feedTimes: [] as number[] };
    for (let i = 0; i < FOOD_LIMIT_PER_HOUR; i++) {
      const r = localFeed(st, '🍎', AGORA + i);
      expect(r.refused).toBeUndefined();
      st = { ...st, foodInventory: r.foodInventory, feedTimes: r.feedTimes };
    }
    expect(localFeed(st, '🍎', AGORA + FOOD_LIMIT_PER_HOUR).refused).toBe('hourly-limit');
  });
});

describe('com conta: o overlay grava a FOME no save e deixa a energia ao relógio (beta-2 3.5)', () => {
  const remoto = () => ({
    evolutionStage: 'rookie', healthPoints: 3, maxHealthPoints: 3, energyPoints: 2, foodInventory: { '🍎': 2 },
    powerPoints: 0, harmonyPoints: 0, benevolencePoints: 0, totalXP: 0,
    attributesSinceLastEvolution: { power: 0, harmony: 0, benevolence: 0 },
    hunger: { v: 10, at: AGORA - 1000 }, energyClock: { at: AGORA - 1000, carry: 0 },
  } as Record<string, unknown>);
  it('comer sobe `hunger` no save real e NÃO mexe em `energyPoints`', () => {
    const r = remoteFeed(remoto(), '🍎', AGORA);
    expect(r.refused).toBeUndefined();
    const next = r.next as Record<string, unknown>;
    expect(next.energyPoints).toBe(2);
    expect(hungerAt(next.hunger as { v: number; at: number }, AGORA)).toBeGreaterThan(10);
    expect((next.foodInventory as Record<string, number>)['🍎']).toBe(1);
  });
});
