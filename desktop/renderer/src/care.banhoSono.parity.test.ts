// PARIDADE DE BANHO E SONO entre o overlay e o app.
//
// O achado (docs/PLANO-DESKTOP-STEAM.md, fase 2b): "carinho/comida/tarefa
// escrevem; ❌ banho e dormir não escrevem nada". O menu do overlay OFERECE as
// duas ações, o jogador clica, e o save não muda em byte nenhum:
//   • `menu.ts:doShower` só tocava a fala e a bolha 🫧 — o cocô do save
//     continuava sujo e o dreno de 6h continuava cobrando coração;
//   • `menu.ts:doSleepToggle` só virava `state.sleeping`, um booleano do
//     localStorage DESTE aparelho — a noite nunca era registrada em
//     `rest.nights`, então dormir pelo overlay não contava para constância,
//     sonho nem pesadelo.
//
// Como no `care.parity.test.ts`: o que quebra na fronteira do desktop só para
// de quebrar quando um teste EXECUTA a fronteira. `menu.ts` toca o DOM no topo
// e nenhum teste em node consegue importá-lo — por isso a decisão mora aqui.
import { describe, it, expect } from 'vitest';
import { remoteShower, remoteSleep, remoteWake, remoteRestState } from './care';
import { applyPoopDrain, POOP_DRAIN_PERIOD_MS, type PoopDrainState } from '../../../src/utils/poopDrain';
import { recordNight, createRestState, isWithinWindow, morningKey } from '../../../src/utils/restWindow';

/** 26/ago/2026, 23h30 em São Paulo. */
const AGORA = new Date('2026-08-26T23:30:00-03:00');

function save(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    evolutionStage: 'rookie', healthPoints: 3, maxHealthPoints: 3, energyPoints: 0,
    foodInventory: { '🍎': 20 }, tasks: [],
    virusPoints: 0, dataPoints: 0, vaccinePoints: 0, totalXP: 0,
    attributesSinceLastEvolution: { virus: 0, data: 0, vaccine: 0 },
    poopEventsShown: [], poopEventsCompleted: [], poopPenaltyClockAt: 0,
    ...extra,
  };
}

/** Um save com cocô na tela e o relógio do dreno já correndo há 6h. */
function sujo(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return save({
    // Veterano de propósito: desde 22/09/2026 (decisão #58b) o dreno respeita
    // a carência de save NOVO, e um save sem histórico nenhum é lido como novo
    // (`saveDaysLived`/`looksLikeVeteranSave`). O que este arquivo prova é o
    // BANHO do overlay, não a carência — então o fixture tem histórico.
    totalPerfectDays: 5,
    poopEventsShown: [0],
    poopEventsCompleted: [],
    poopPenaltyClockAt: AGORA.getTime() - POOP_DRAIN_PERIOD_MS,
    lastResetDate: AGORA.toDateString(),
    ...extra,
  });
}

describe('🚿 o banho do overlay LIMPA o cocô do save', () => {
  it('sem o banho, o dreno cobra o coração — é o dano que o botão morto deixava passar', () => {
    const antes = applyPoopDrain(sujo() as unknown as PoopDrainState, { now: AGORA.getTime(), isSleeping: false });
    expect(antes.healthPoints).toBe(2);
  });

  it('DEPOIS do banho o mesmo dreno não cobra nada (a regra do app é quem julga)', () => {
    const r = remoteShower(sujo());
    expect(r.refused).toBeUndefined();
    const depois = applyPoopDrain(r.next as unknown as PoopDrainState, { now: AGORA.getTime(), isSleeping: false });
    expect(depois.healthPoints).toBe(3);
  });

  it('marca todo cocô mostrado como limpo e PARA o relógio de 6h', () => {
    const r = remoteShower(sujo({ poopEventsShown: [0, 1], poopEventsCompleted: [0] }));
    expect(r.next!.poopEventsCompleted).toEqual([0, 1]);
    expect(r.next!.poopPenaltyClockAt).toBe(0);
  });

  it('RECUSA quando já está limpo — sem isto o overlay gravaria no save a cada clique', () => {
    expect(remoteShower(save()).refused).toBe('already-clean');
    expect(remoteShower(save({ poopEventsShown: [0], poopEventsCompleted: [0] })).refused)
      .toBe('already-clean');
  });

  it('save antigo, sem os campos de cocô, não vira lixo nem NaN', () => {
    const velho = save();
    delete velho.poopEventsShown; delete velho.poopEventsCompleted; delete velho.poopPenaltyClockAt;
    expect(remoteShower(velho).refused).toBe('already-clean');
  });

  it('relógio correndo sem cocô sujo é limpável — é o mesmo "para o relógio" do dreno', () => {
    const r = remoteShower(save({ poopPenaltyClockAt: AGORA.getTime() - 1000 }));
    expect(r.next!.poopPenaltyClockAt).toBe(0);
  });
});

describe('💤 dormir pelo overlay REGISTRA a noite no save', () => {
  it('grava a noite com sleptAt — byte a byte o que o app faria (uma regra, não duas)', () => {
    const s = save();
    const esperado = recordNight(remoteRestState(s), AGORA);
    expect((remoteSleep(s, AGORA) as { rest: unknown }).rest).toEqual(esperado);
    expect(esperado.nights).toHaveLength(1);
    expect(esperado.nights[0].sleptAt).toBe(AGORA.toISOString());
  });

  it('acordar ATUALIZA a mesma noite em vez de criar uma segunda', () => {
    const acordou = new Date('2026-08-27T07:00:00-03:00');
    const deitou = remoteSleep(save(), AGORA);
    const rest = (remoteWake(deitou, AGORA, acordou) as { rest: { nights: unknown[] } }).rest;
    expect(rest.nights).toHaveLength(1);
    expect(rest.nights[0]).toEqual({
      date: morningKey(AGORA, acordou, undefined),
      sleptAt: AGORA.toISOString(),
      wokeAt: acordou.toISOString(),
      onTime: isWithinWindow(createRestState().window, AGORA),
    });
  });

  it('a JANELA continua no relógio do APARELHO, de propósito', () => {
    // Decisão registrada: deitar cedo é um gesto do mundo real, "é noite ONDE A
    // PESSOA ESTÁ". `onTime` sai de `isWithinWindow`, que lê a hora de parede do
    // aparelho — a âncora do save nomeia a MANHÃ, nunca julga a hora de deitar.
    const s = save({ playerDayTz: { zone: 'Asia/Tokyo' } });
    const rest = (remoteSleep(s, AGORA) as { rest: { nights: { onTime: boolean }[] } }).rest;
    expect(rest.nights[0].onTime).toBe(isWithinWindow(createRestState().window, AGORA));
  });

  it('mas o NOME da noite obedece a âncora do save (a manhã é do dia do jogador)', () => {
    const tokyo = save({ playerDayTz: { zone: 'Asia/Tokyo' } });
    const br = save({ playerDayTz: { zone: 'America/Sao_Paulo' } });
    // 26/ago 23h30 em SP é 27/ago 11h30 em Tóquio: lá ainda é ANTES do meio-dia,
    // então a manhã é o MESMO dia civil; em SP a manhã é a do dia seguinte.
    const noite = (s: Record<string, unknown>) =>
      (remoteSleep(s, AGORA) as { rest: { nights: { date: string }[] } }).rest.nights[0].date;
    expect(noite(br)).toBe('Thu Aug 27 2026');
    expect(noite(tokyo)).toBe('Thu Aug 27 2026');
  });

  it('a âncora do save é FIADA dentro do rest — sem isto a noite volta a ser nomeada pelo aparelho', () => {
    // É a linha travada por guard de AST no `GameStateContext` (`rest.playerDayTz`).
    // `recordNight` lê a âncora do ESTADO, nunca por parâmetro: quem esquece a
    // fiação volta em silêncio ao dia do APARELHO, compilando.
    expect(remoteRestState(save({ playerDayTz: { zone: 'Asia/Tokyo' } })).playerDayTz)
      .toEqual({ zone: 'Asia/Tokyo' });
  });

  it('rest ausente ou malformado no save vira um RestState novo, sem perder a noite', () => {
    expect(remoteRestState(save()).nights).toEqual([]);
    expect(remoteRestState(save({ rest: 'lixo' })).window).toEqual(createRestState().window);
    expect(remoteRestState(save({ rest: { window: { start: '22:00', end: '06:00' }, nights: 'x' } })).nights)
      .toEqual([]);
  });

  it('PRESERVA a janela e os sonhos que o jogador configurou no celular', () => {
    const s = save({ rest: { window: { start: '21:00', end: '05:00' }, nights: [], dreams: ['d1'] } });
    const rest = (remoteSleep(s, AGORA) as { rest: { window: unknown; dreams: string[] } }).rest;
    expect(rest.window).toEqual({ start: '21:00', end: '05:00' });
    expect(rest.dreams).toEqual(['d1']);
  });
});
