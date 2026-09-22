import { describe, it, expect } from 'vitest';
import { applySpecialItem, specialRefusal, glitchtamaUsedToday, GLITCHTAMA_PER_DAY, type SpecialItemState } from './specialItemUse';
import { playerDayKey } from './playerDay';
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

/** Relógio fixo: o teto do Glitchtama é por DIA DO JOGADOR, então toda
 *  chamada precisa de um `now` — e um relógio fixo mantém os casos antigos
 *  todos no mesmo dia, que é o que os deixa aritmeticamente idênticos. */
const AGORA = new Date('2026-09-07T12:00:00Z');

describe('glitchtama', () => {
  /* ⚰️ 22/09/2026 — decisão do dono #41/#60: o 🌀 deixou de somar em
     `totalPerfectDays` (o vitalício que `achievements.ts` lê) e passou a somar
     em `missionPerfectDays` (o da missão `mission-perfect-30`, que a decisão
     manda continuar contando o item). Este teste afirmava `totalPerfectDays`
     8 — e era justamente esse número que deixava o perfil G abrir
     `dias-completos-30` com ZERO dias completos (QA rodada 2, §2.6). */
  it('vale exatamente 1 dia perfeito, soma no vitalicio da MISSAO e gasta 1 do inventario', () => {
    const prev = estado({ foodInventory: { [GLITCHTAMA_EMOJI]: 2 }, perfectDays: 3, totalPerfectDays: 7, missionPerfectDays: 7 });
    const { state, refused } = applySpecialItem(prev, GLITCHTAMA_EMOJI, AGORA);
    expect(refused).toBeUndefined();
    expect(state.perfectDays).toBe(4);
    expect(state.totalPerfectDays).toBe(7);      // #41/#60: intacto
    expect(state.missionPerfectDays).toBe(8);
    expect(state.foodInventory[GLITCHTAMA_EMOJI]).toBe(1);
  });

  it('o ultimo do estoque some da pastinha em vez de virar 0', () => {
    const { state } = applySpecialItem(estado({ foodInventory: { [GLITCHTAMA_EMOJI]: 1 } }), GLITCHTAMA_EMOJI, AGORA);
    expect(GLITCHTAMA_EMOJI in state.foodInventory).toBe(false);
  });

  it('nao toca em vida, energia nem atributo', () => {
    const prev = estado({ foodInventory: { [GLITCHTAMA_EMOJI]: 1 }, healthPoints: 2, totalXP: 500 });
    const { state } = applySpecialItem(prev, GLITCHTAMA_EMOJI, AGORA);
    expect(state.healthPoints).toBe(2);
    expect(state.totalXP).toBe(500);
    expect(state.attributesSinceLastEvolution).toEqual({ virus: 0, data: 0, vaccine: 0 });
  });

  it('vitalicio ausente no save antigo comeca do zero, nao vira NaN', () => {
    const prev = estado({ foodInventory: { [GLITCHTAMA_EMOJI]: 1 } });
    delete (prev as Partial<SpecialItemState>).totalPerfectDays;
    delete (prev as Partial<SpecialItemState>).missionPerfectDays;
    const { state } = applySpecialItem(prev, GLITCHTAMA_EMOJI, AGORA);
    expect(state.missionPerfectDays).toBe(1);
    expect(state.totalPerfectDays).toBeUndefined();   // #41/#60: não é tocado
  });

  it('sem estoque nao concede dia perfeito nenhum', () => {
    const prev = estado({ foodInventory: {}, perfectDays: 3 });
    const { state, refused } = applySpecialItem(prev, GLITCHTAMA_EMOJI, AGORA);
    expect(refused).toBe('no-stock');
    expect(state).toBe(prev);
  });
});

describe('coracaozinho', () => {
  it('cura exatamente HEART_HEAL e gasta 1', () => {
    const prev = estado({ foodInventory: { [HEART_ITEM_EMOJI]: 2 }, healthPoints: 2, maxHealthPoints: 5 });
    const { state } = applySpecialItem(prev, HEART_ITEM_EMOJI, AGORA);
    expect(state.healthPoints).toBe(2 + HEART_HEAL);
    expect(state.foodInventory[HEART_ITEM_EMOJI]).toBe(1);
  });

  it('nunca passa do maximo', () => {
    const prev = estado({ foodInventory: { [HEART_ITEM_EMOJI]: 1 }, healthPoints: 4.5, maxHealthPoints: 5 });
    const { state } = applySpecialItem(prev, HEART_ITEM_EMOJI, AGORA);
    expect(state.healthPoints).toBe(5);
  });

  it('com a vida cheia recusa e NAO gasta o item', () => {
    const prev = estado({ foodInventory: { [HEART_ITEM_EMOJI]: 1 }, healthPoints: 5, maxHealthPoints: 5 });
    const { state, refused } = applySpecialItem(prev, HEART_ITEM_EMOJI, AGORA);
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
    const um = applySpecialItem(prev, HEART_ITEM_EMOJI, AGORA);
    const dois = applySpecialItem(um.state, HEART_ITEM_EMOJI, AGORA);
    expect(um.state.healthPoints).toBe(5);
    expect(dois.refused).toBe('already-full');
    // O segundo item continua na pastinha: nao curou nada, entao nao gastou.
    expect(dois.state.foodInventory[HEART_ITEM_EMOJI]).toBe(1);
  });

  it('dois toques no mesmo lote com UM item so gastam um', () => {
    const prev = estado({ foodInventory: { [HEART_ITEM_EMOJI]: 1 }, healthPoints: 1, maxHealthPoints: 5 });
    const um = applySpecialItem(prev, HEART_ITEM_EMOJI, AGORA);
    const dois = applySpecialItem(um.state, HEART_ITEM_EMOJI, AGORA);
    expect(dois.refused).toBe('no-stock');
    expect(dois.state.healthPoints).toBe(1 + HEART_HEAL);
  });

  it('nao toca em progressao', () => {
    const prev = estado({ foodInventory: { [HEART_ITEM_EMOJI]: 1 }, perfectDays: 3, totalXP: 100 });
    const { state } = applySpecialItem(prev, HEART_ITEM_EMOJI, AGORA);
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
      const { state } = applySpecialItem(prev, emoji, AGORA);
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
    const { state } = applySpecialItem(prev, CHIP_EMOJI.data, AGORA);
    expect(state.healthPoints).toBe(2);
    expect('energyPoints' in state).toBe(false);
  });

  it('nao concede dia perfeito', () => {
    const prev = estado({ foodInventory: { [CHIP_EMOJI.virus]: 1 }, perfectDays: 2, totalPerfectDays: 9 });
    const { state } = applySpecialItem(prev, CHIP_EMOJI.virus, AGORA);
    expect(state.perfectDays).toBe(2);
    expect(state.totalPerfectDays).toBe(9);
  });

  it('dois toques no mesmo lote com UM chip so dao CHIP_BOOST uma vez', () => {
    const prev = estado({ foodInventory: { [CHIP_EMOJI.vaccine]: 1 } });
    const um = applySpecialItem(prev, CHIP_EMOJI.vaccine, AGORA);
    const dois = applySpecialItem(um.state, CHIP_EMOJI.vaccine, AGORA);
    expect(dois.refused).toBe('no-stock');
    expect(dois.state.vaccinePoints).toBe(CHIP_BOOST);
    expect(dois.state.totalXP).toBe(CHIP_BOOST * 10);
  });

  it('acumula sobre o que ja havia, sem zerar o acumulado da evolucao', () => {
    const prev = estado({
      foodInventory: { [CHIP_EMOJI.data]: 2 },
      attributesSinceLastEvolution: { virus: 1, data: 2, vaccine: 3 },
    });
    const um = applySpecialItem(prev, CHIP_EMOJI.data, AGORA);
    const dois = applySpecialItem(um.state, CHIP_EMOJI.data, AGORA);
    expect(dois.state.attributesSinceLastEvolution).toEqual({ virus: 1, data: 2 + CHIP_BOOST * 2, vaccine: 3 });
  });
});

describe('specialRefusal', () => {
  it('ignora comida comum (nao e item especial)', () => {
    expect(specialRefusal(estado({ foodInventory: { '🍎': 0 } }), '🍎', AGORA)).toBeUndefined();
  });

  it('item comum passa batido pelo applySpecialItem, sem mexer em nada', () => {
    const prev = estado({ foodInventory: { '🍎': 3 } });
    expect(applySpecialItem(prev, '🍎', AGORA).state).toBe(prev);
  });

  it('so o coracaozinho recusa por vida cheia — chip e glitchtama valem sempre', () => {
    const cheio = estado({
      healthPoints: 5, maxHealthPoints: 5,
      foodInventory: { [HEART_ITEM_EMOJI]: 1, [CHIP_EMOJI.virus]: 1, [GLITCHTAMA_EMOJI]: 1 },
    });
    expect(specialRefusal(cheio, HEART_ITEM_EMOJI, AGORA)).toBe('already-full');
    expect(specialRefusal(cheio, CHIP_EMOJI.virus, AGORA)).toBeUndefined();
    expect(specialRefusal(cheio, GLITCHTAMA_EMOJI, AGORA)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// O TETO DO GLITCHTAMA (auditoria de alinhamento, 06/09/2026).
//
// A conta que motivou o teto: rookie→mega custa 14 dias perfeitos e o Ultra
// custa mais 45 = 59. A masmorra não tem limite diário nem gate de entrada, e
// concluir os 5 andares sempre dropa um Glitchtama — então 59 runs seguidas
// compravam a escada inteira num fim de semana, contra a justificativa escrita
// em `progression.ts` de que o recurso do Ultra "não cresce indefinidamente".
// ---------------------------------------------------------------------------
describe('teto diário do glitchtama', () => {
  const comDois = () => estado({ foodInventory: { [GLITCHTAMA_EMOJI]: 2 }, playerDayTz: { offsetMs: -3 * 60 * 60 * 1000 } });

  it('o primeiro do dia dá o ponto e grava o uso', () => {
    const { state, refused } = applySpecialItem(comDois(), GLITCHTAMA_EMOJI, AGORA);
    expect(refused).toBeUndefined();
    expect(state.perfectDays).toBe(1);
    expect(state.glitchtamaUse?.used).toBe(1);
  });

  it('o SEGUNDO do mesmo dia é recusado — e não consome o item', () => {
    const primeiro = applySpecialItem(comDois(), GLITCHTAMA_EMOJI, AGORA).state;
    const segundo = applySpecialItem(primeiro, GLITCHTAMA_EMOJI, AGORA);
    expect(segundo.refused).toBe('daily-cap');
    // A recusa é ANTES do decremento: o item volta para a pastinha e vale
    // amanhã. Recusar depois de consumir seria o X-6 ao contrário.
    expect(segundo.state.foodInventory[GLITCHTAMA_EMOJI]).toBe(1);
    expect(segundo.state.perfectDays).toBe(1);
    expect(segundo.state).toBe(primeiro);
  });

  it('a virada do DIA DO JOGADOR devolve o direito', () => {
    const primeiro = applySpecialItem(comDois(), GLITCHTAMA_EMOJI, AGORA).state;
    const amanha = new Date(AGORA.getTime() + 24 * 60 * 60 * 1000);
    const segundo = applySpecialItem(primeiro, GLITCHTAMA_EMOJI, amanha);
    expect(segundo.refused).toBeUndefined();
    expect(segundo.state.perfectDays).toBe(2);
    expect(segundo.state.glitchtamaUse?.used).toBe(1);
  });

  it('dois toques no MESMO lote do React não passam os dois (X-6)', () => {
    // O contador é escrito no mesmo retorno que dá o ponto, então a segunda
    // passada sobre o `prev` da primeira já enxerga o teto batido.
    const prev = comDois();
    const a = applySpecialItem(prev, GLITCHTAMA_EMOJI, AGORA);
    const b = applySpecialItem(a.state, GLITCHTAMA_EMOJI, AGORA);
    expect(a.state.perfectDays + (b.state.perfectDays - a.state.perfectDays)).toBe(1);
  });

  it('save antigo sem o campo ganha o dia de hoje inteiro, nunca dívida', () => {
    const antigo = estado({ foodInventory: { [GLITCHTAMA_EMOJI]: 1 } });
    expect(glitchtamaUsedToday(antigo, AGORA)).toBe(0);
    expect(applySpecialItem(antigo, GLITCHTAMA_EMOJI, AGORA).refused).toBeUndefined();
  });

  it('o teto vale SÓ para o glitchtama — coraçãozinho e chip seguem livres', () => {
    const st = estado({
      foodInventory: { [HEART_ITEM_EMOJI]: 2, [CHIP_EMOJI.virus]: 2 },
      healthPoints: 1,
      glitchtamaUse: { day: playerDayKey(AGORA, undefined), used: GLITCHTAMA_PER_DAY },
    });
    expect(applySpecialItem(st, HEART_ITEM_EMOJI, AGORA).refused).toBeUndefined();
    expect(applySpecialItem(st, CHIP_EMOJI.virus, AGORA).refused).toBeUndefined();
  });
});
