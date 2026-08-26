import { describe, it, expect } from 'vitest';
import { applySpecialItem, specialRefusal, type SpecialItemState } from './specialItemUse';
import { CHIP_BOOST, HEART_HEAL, CHIP_EMOJI, HEART_ITEM_EMOJI, GLITCHTAMA_EMOJI } from './shop';

// Os três itens especiais tinham a regra dentro de updater inline no
// `handleFeed`, fora do alcance de qualquer teste. Estes testes travam os
// NÚMEROS (progressão: perfectDays, CHIP_BOOST, HEART_HEAL) e a PROCEDÊNCIA do
// argumento — a família de bug do X-6.

function estado(over: Partial<SpecialItemState> = {}): SpecialItemState {
  return {
    healthPoints: 2,
    maxHealthPoints: 5,
    foodInventory: {},
    perfectDays: 0,
    totalPerfectDays: 0,
    virusPoints: 0,
    dataPoints: 0,
    vaccinePoints: 0,
    totalXP: 0,
    attributesSinceLastEvolution: { virus: 0, data: 0, vaccine: 0 },
    ...over,
  };
}

describe('glitchtama', () => {
  it('vale exatamente 1 dia perfeito e 1 no vitalicio, e gasta 1 do inventario', () => {
    const prev = estado({ foodInventory: { [GLITCHTAMA_EMOJI]: 2 }, perfectDays: 3, totalPerfectDays: 7 });
    const { state, refused } = applySpecialItem(prev, GLITCHTAMA_EMOJI);
    expect(refused).toBeUndefined();
    expect(state.perfectDays).toBe(4);
    expect(state.totalPerfectDays).toBe(8);
    expect(state.foodInventory[GLITCHTAMA_EMOJI]).toBe(1);
  });

  it('o ultimo do estoque some da pastinha em vez de virar 0', () => {
    const { state } = applySpecialItem(estado({ foodInventory: { [GLITCHTAMA_EMOJI]: 1 } }), GLITCHTAMA_EMOJI);
    expect(GLITCHTAMA_EMOJI in state.foodInventory).toBe(false);
  });

  it('nao toca em vida, energia nem atributo', () => {
    const prev = estado({ foodInventory: { [GLITCHTAMA_EMOJI]: 1 }, healthPoints: 2, totalXP: 500 });
    const { state } = applySpecialItem(prev, GLITCHTAMA_EMOJI);
    expect(state.healthPoints).toBe(2);
    expect(state.totalXP).toBe(500);
    expect(state.attributesSinceLastEvolution).toEqual({ virus: 0, data: 0, vaccine: 0 });
  });

  it('totalPerfectDays ausente no save antigo comeca do zero, nao vira NaN', () => {
    const prev = estado({ foodInventory: { [GLITCHTAMA_EMOJI]: 1 } });
    delete (prev as Partial<SpecialItemState>).totalPerfectDays;
    const { state } = applySpecialItem(prev, GLITCHTAMA_EMOJI);
    expect(state.totalPerfectDays).toBe(1);
  });

  it('sem estoque nao concede dia perfeito nenhum', () => {
    const prev = estado({ foodInventory: {}, perfectDays: 3 });
    const { state, refused } = applySpecialItem(prev, GLITCHTAMA_EMOJI);
    expect(refused).toBe('no-stock');
    expect(state).toBe(prev);
  });
});

describe('coracaozinho', () => {
  it('cura exatamente HEART_HEAL e gasta 1', () => {
    const prev = estado({ foodInventory: { [HEART_ITEM_EMOJI]: 2 }, healthPoints: 2, maxHealthPoints: 5 });
    const { state } = applySpecialItem(prev, HEART_ITEM_EMOJI);
    expect(state.healthPoints).toBe(2 + HEART_HEAL);
    expect(state.foodInventory[HEART_ITEM_EMOJI]).toBe(1);
  });

  it('nunca passa do maximo', () => {
    const prev = estado({ foodInventory: { [HEART_ITEM_EMOJI]: 1 }, healthPoints: 4.5, maxHealthPoints: 5 });
    const { state } = applySpecialItem(prev, HEART_ITEM_EMOJI);
    expect(state.healthPoints).toBe(5);
  });

  it('com a vida cheia recusa e NAO gasta o item', () => {
    const prev = estado({ foodInventory: { [HEART_ITEM_EMOJI]: 1 }, healthPoints: 5, maxHealthPoints: 5 });
    const { state, refused } = applySpecialItem(prev, HEART_ITEM_EMOJI);
    expect(refused).toBe('already-full');
    expect(state).toBe(prev);
    expect(state.foodInventory[HEART_ITEM_EMOJI]).toBe(1);
  });

  // ⚠️ A FAMILIA DE BUG DO X-6, e ela ESTAVA presente aqui.
  //
  // A recusa de vida cheia so era lida do `gameState` de FORA do updater; o
  // updater inline se limitava a clampar com `Math.min`. Dois toques no mesmo
  // lote do React leem o mesmo `gameState` (4 < 5, passa duas vezes) e a
  // segunda passada decrementava o inventario para curar ZERO.
  //
  // Sem React nenhum: o furo de lote e o updater aplicado duas vezes em cadeia.
  it('dois toques no mesmo lote nao queimam o segundo coracaozinho a toa', () => {
    const prev = estado({ foodInventory: { [HEART_ITEM_EMOJI]: 2 }, healthPoints: 4, maxHealthPoints: 5 });
    const um = applySpecialItem(prev, HEART_ITEM_EMOJI);
    const dois = applySpecialItem(um.state, HEART_ITEM_EMOJI);
    expect(um.state.healthPoints).toBe(5);
    expect(dois.refused).toBe('already-full');
    // O segundo item continua na pastinha: nao curou nada, entao nao gastou.
    expect(dois.state.foodInventory[HEART_ITEM_EMOJI]).toBe(1);
  });

  it('dois toques no mesmo lote com UM item so gastam um', () => {
    const prev = estado({ foodInventory: { [HEART_ITEM_EMOJI]: 1 }, healthPoints: 1, maxHealthPoints: 5 });
    const um = applySpecialItem(prev, HEART_ITEM_EMOJI);
    const dois = applySpecialItem(um.state, HEART_ITEM_EMOJI);
    expect(dois.refused).toBe('no-stock');
    expect(dois.state.healthPoints).toBe(1 + HEART_HEAL);
  });

  it('nao toca em progressao', () => {
    const prev = estado({ foodInventory: { [HEART_ITEM_EMOJI]: 1 }, perfectDays: 3, totalXP: 100 });
    const { state } = applySpecialItem(prev, HEART_ITEM_EMOJI);
    expect(state.perfectDays).toBe(3);
    expect(state.totalXP).toBe(100);
  });
});

describe('chips', () => {
  const casos: Array<[string, 'virus' | 'data' | 'vaccine', 'virusPoints' | 'dataPoints' | 'vaccinePoints']> = [
    [CHIP_EMOJI.virus, 'virus', 'virusPoints'],
    [CHIP_EMOJI.data, 'data', 'dataPoints'],
    [CHIP_EMOJI.vaccine, 'vaccine', 'vaccinePoints'],
  ];

  for (const [emoji, attr, pontos] of casos) {
    it(`${attr}: +CHIP_BOOST no atributo, no acumulado da evolucao e 10x no XP`, () => {
      const prev = estado({ foodInventory: { [emoji]: 1 }, virusPoints: 4, dataPoints: 5, vaccinePoints: 6, totalXP: 70 });
      const { state } = applySpecialItem(prev, emoji);
      expect(state[pontos]).toBe(prev[pontos] + CHIP_BOOST);
      expect(state.attributesSinceLastEvolution[attr]).toBe(CHIP_BOOST);
      expect(state.totalXP).toBe(70 + CHIP_BOOST * 10);
      // Os outros dois atributos ficam EXATAMENTE onde estavam — e o ramo da
      // arvore sai daqui, entao um ponto vazado escolheria outra evolucao.
      for (const [, outroAttr, outroPontos] of casos) {
        if (outroAttr === attr) continue;
        expect(state[outroPontos]).toBe(prev[outroPontos]);
        expect(state.attributesSinceLastEvolution[outroAttr]).toBe(0);
      }
    });
  }

  it('nao enche energia nem cura: chip nao e comida', () => {
    const prev = estado({ foodInventory: { [CHIP_EMOJI.data]: 1 }, healthPoints: 2 });
    const { state } = applySpecialItem(prev, CHIP_EMOJI.data);
    expect(state.healthPoints).toBe(2);
    expect('energyPoints' in state).toBe(false);
  });

  it('nao concede dia perfeito', () => {
    const prev = estado({ foodInventory: { [CHIP_EMOJI.virus]: 1 }, perfectDays: 2, totalPerfectDays: 9 });
    const { state } = applySpecialItem(prev, CHIP_EMOJI.virus);
    expect(state.perfectDays).toBe(2);
    expect(state.totalPerfectDays).toBe(9);
  });

  it('dois toques no mesmo lote com UM chip so dao CHIP_BOOST uma vez', () => {
    const prev = estado({ foodInventory: { [CHIP_EMOJI.vaccine]: 1 } });
    const um = applySpecialItem(prev, CHIP_EMOJI.vaccine);
    const dois = applySpecialItem(um.state, CHIP_EMOJI.vaccine);
    expect(dois.refused).toBe('no-stock');
    expect(dois.state.vaccinePoints).toBe(CHIP_BOOST);
    expect(dois.state.totalXP).toBe(CHIP_BOOST * 10);
  });

  it('acumula sobre o que ja havia, sem zerar o acumulado da evolucao', () => {
    const prev = estado({
      foodInventory: { [CHIP_EMOJI.data]: 2 },
      attributesSinceLastEvolution: { virus: 1, data: 2, vaccine: 3 },
    });
    const um = applySpecialItem(prev, CHIP_EMOJI.data);
    const dois = applySpecialItem(um.state, CHIP_EMOJI.data);
    expect(dois.state.attributesSinceLastEvolution).toEqual({ virus: 1, data: 2 + CHIP_BOOST * 2, vaccine: 3 });
  });
});

describe('specialRefusal', () => {
  it('ignora comida comum (nao e item especial)', () => {
    expect(specialRefusal(estado({ foodInventory: { '🍎': 0 } }), '🍎')).toBeUndefined();
  });

  it('item comum passa batido pelo applySpecialItem, sem mexer em nada', () => {
    const prev = estado({ foodInventory: { '🍎': 3 } });
    expect(applySpecialItem(prev, '🍎').state).toBe(prev);
  });

  it('so o coracaozinho recusa por vida cheia — chip e glitchtama valem sempre', () => {
    const cheio = estado({
      healthPoints: 5, maxHealthPoints: 5,
      foodInventory: { [HEART_ITEM_EMOJI]: 1, [CHIP_EMOJI.virus]: 1, [GLITCHTAMA_EMOJI]: 1 },
    });
    expect(specialRefusal(cheio, HEART_ITEM_EMOJI)).toBe('already-full');
    expect(specialRefusal(cheio, CHIP_EMOJI.virus)).toBeUndefined();
    expect(specialRefusal(cheio, GLITCHTAMA_EMOJI)).toBeUndefined();
  });
});
