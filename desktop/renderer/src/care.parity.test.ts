// PARIDADE DE CUIDADO entre o overlay e o app — no modelo do
// `sprites.parity.test.ts`: o que quebrou em silêncio na fronteira do desktop
// só para de quebrar quando um teste EXECUTA essa fronteira.
//
// O que se trava aqui é a família inteira de defeitos do teto, não só o
// `healed: 0` fixo de `menu.ts:412`:
//   1. teto de carinho por APARELHO (o registro do save era ignorado);
//   2. teto de comida por APARELHO (a janela vinha do localStorage do overlay);
//   3. dia do jogador (o overlay usava o dia do APARELHO, em outro formato).
import { describe, it, expect } from 'vitest';
import { remoteRub, remoteFeed, remoteDayKey, localRub } from './care';
import { applyRub, applyFeed } from '../../../src/utils/careUpdaters';
import { RUB_HEAL_DAILY_CAP, RUB_HEAL_STEP, FOOD_LIMIT_PER_HOUR } from '../../../src/utils/careRules';
import { playerDayKey } from '../../../src/utils/playerDay';

const AGORA = new Date('2026-08-26T23:30:00-03:00');

/** Um save como o que o servidor devolve — o mesmo molde do pushCareAction.test. */
function save(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    evolutionStage: 'rookie', healthPoints: 1, maxHealthPoints: 3, energyPoints: 0,
    foodInventory: { '🍎': 20 }, tasks: [],
    virusPoints: 0, dataPoints: 0, vaccinePoints: 0, totalXP: 0,
    attributesSinceLastEvolution: { virus: 0, data: 0, vaccine: 0 },
    ...extra,
  };
}

describe('teto de carinho do overlay é o teto do SAVE, não o do aparelho', () => {
  it('RECUSA quando o teto do dia já foi gasto no save (era `healed: 0` fixo)', () => {
    const dia = remoteDayKey(save(), AGORA);
    const gasto = save({ careCaps: { rubHeal: { date: dia, healed: RUB_HEAL_DAILY_CAP } } });

    const r = remoteRub(gasto, AGORA);

    // Com o registro zerado fixo, isto curava — todo dia, em cima do celular.
    expect(r.refused).toBe('daily-cap');
    expect(r.next).toBeNull();
  });

  it('GRAVA o gasto de volta no save (sem isto o celular nunca fica sabendo)', () => {
    const r = remoteRub(save(), AGORA);
    expect(r.refused).toBeUndefined();
    const caps = r.next!.careCaps as { rubHeal: { date: string; healed: number } };
    expect(caps.rubHeal.healed).toBe(RUB_HEAL_STEP);
    expect(caps.rubHeal.date).toBe(remoteDayKey(save(), AGORA));
  });

  it('dois carinhos seguidos no mesmo save gastam o teto e o terceiro é recusado', () => {
    let s = save();
    for (let i = 0; i < RUB_HEAL_DAILY_CAP / RUB_HEAL_STEP; i++) {
      const r = remoteRub(s, AGORA);
      expect(r.refused, `gesto ${i}`).toBeUndefined();
      s = r.next!;
    }
    expect(remoteRub(s, AGORA).refused).toBe('daily-cap');
  });

  it('é BYTE A BYTE o que o app faria com o mesmo save (uma regra, não duas)', () => {
    const s = save();
    const dia = remoteDayKey(s, AGORA);
    expect(remoteRub(s, AGORA).next).toEqual(applyRub(s as never, dia).state);
  });
});

describe('a janela de comida do overlay é a do SAVE', () => {
  it('RECUSA na FOOD_LIMIT_PER_HOUR-ésima comida da janela que está no save', () => {
    const now = AGORA.getTime();
    const cheia = Array.from({ length: FOOD_LIMIT_PER_HOUR }, (_, i) => now - i * 1000);
    const r = remoteFeed(save({ careCaps: { feedTimes: cheia } }), '🍎', now);
    // Antes a janela vinha de `state.feedTimes` (localStorage do overlay), que
    // num aparelho recém-aberto está VAZIO — o teto do celular não valia aqui.
    expect(r.refused).toBe('hourly-limit');
  });

  it('GRAVA o timestamp em careCaps.feedTimes, não no localStorage do overlay', () => {
    const now = AGORA.getTime();
    const r = remoteFeed(save(), '🍎', now);
    expect((r.next!.careCaps as { feedTimes: number[] }).feedTimes).toEqual([now]);
  });

  it('é BYTE A BYTE o que o app faria com o mesmo save', () => {
    const s = save();
    const now = AGORA.getTime();
    expect(remoteFeed(s, '🍎', now).next).toEqual(applyFeed(s as never, '🍎', now).state);
  });
});

describe('o dia do overlay é o DIA DO JOGADOR, no formato do save', () => {
  it('obedece a âncora de fuso gravada no save, e não o relógio do aparelho', () => {
    const tokyo = save({ playerDayTz: { zone: 'Asia/Tokyo' } });
    const br = save({ playerDayTz: { zone: 'America/Sao_Paulo' } });
    // Mesmo INSTANTE, âncoras diferentes: 26/ago 23h30 em SP é 27/ago em Tóquio.
    expect(remoteDayKey(br, AGORA)).toBe('Wed Aug 26 2026');
    expect(remoteDayKey(tokyo, AGORA)).toBe('Thu Aug 27 2026');
  });

  it('sem âncora, é o `toDateString()` do app — save não migrado não muda de dia', () => {
    expect(remoteDayKey(save(), AGORA)).toBe(playerDayKey(AGORA, undefined));
  });

  it('a chave gravada é a MESMA string que o app compara (formato, não YYYY-MM-DD)', () => {
    const caps = remoteRub(save(), AGORA).next!.careCaps as { rubHeal: { date: string } };
    expect(caps.rubHeal.date).toMatch(/^[A-Z][a-z]{2} [A-Z][a-z]{2} \d{2} \d{4}$/);
  });
});

describe('carinho local (sem conta) usa o passo e o teto do jogo', () => {
  it('cura RUB_HEAL_STEP e recusa depois do teto diário', () => {
    const um = localRub({ hearts: 1, maxHearts: 3 }, AGORA);
    expect(um.hearts).toBe(1 + RUB_HEAL_STEP);
    const dois = localRub({ hearts: um.hearts, maxHearts: 3, rubHeal: um.rubHeal }, AGORA);
    expect(dois.hearts).toBe(1 + RUB_HEAL_DAILY_CAP);
    // O terceiro gesto é o que o overlay antigo concedia: ele só olhava se a
    // STRING do dia batia, então meio coração virava um coração inteiro por dia
    // e o teto do jogo (1/dia) valia por aparelho.
    expect(localRub({ hearts: dois.hearts, maxHearts: 3, rubHeal: dois.rubHeal }, AGORA).refused)
      .toBe('daily-cap');
  });

  it('recusa com HP cheio, e grava a data no formato do save', () => {
    expect(localRub({ hearts: 3, maxHearts: 3 }, AGORA).refused).toBe('already-full');
    expect(localRub({ hearts: 1, maxHearts: 3 }, AGORA).rubHeal!.date)
      .toBe(playerDayKey(AGORA, undefined));
  });
});
