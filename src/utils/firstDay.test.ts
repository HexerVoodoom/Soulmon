/**
 * WP1.3 — o cartão do primeiro dia.
 *
 * A regra que este arquivo trava não é "o checklist funciona": é que ele
 * MORRE. Um checklist que sobrevive ao primeiro dia deixa de ser convite e
 * vira lista de pendências — e quem não deu carinho no D0 encontraria, no dia
 * seguinte, dois itens em aberto esperando por ele. Este produto não cobra.
 */
import { describe, it, expect } from 'vitest';
import {
  emptyFirstDay, markGesture, allGesturesDone, shouldShowFirstDay,
  normalizeFirstDay, FIRST_DAY_GESTURES,
} from './firstDay';

const HOJE = '2026-09-06';
const AMANHA = '2026-09-07';

describe('firstDay — os três gestos', () => {
  it('são exatamente carinho, comida e uma conclusão', () => {
    expect([...FIRST_DAY_GESTURES]).toEqual(['pet', 'feed', 'task']);
  });

  it('marcar é idempotente e devolve a MESMA referência (footgun 6)', () => {
    const um = markGesture(emptyFirstDay(HOJE), 'pet');
    expect(markGesture(um, 'pet')).toBe(um);
    expect(um.done).toEqual(['pet']);
  });

  it('fecha quando os três acontecem, em qualquer ordem', () => {
    let p = emptyFirstDay(HOJE);
    for (const g of ['task', 'pet', 'feed'] as const) p = markGesture(p, g);
    expect(allGesturesDone(p)).toBe(true);
  });
});

describe('firstDay — o cartão morre pelos DOIS lados', () => {
  it('some quando os três gestos foram feitos', () => {
    let p = emptyFirstDay(HOJE);
    for (const g of FIRST_DAY_GESTURES) p = markGesture(p, g);
    expect(shouldShowFirstDay(p, HOJE)).toBe(false);
  });

  it('some na virada do dia MESMO incompleto — convite não vira cobrança', () => {
    const p = markGesture(emptyFirstDay(HOJE), 'pet');
    expect(shouldShowFirstDay(p, HOJE)).toBe(true);
    expect(shouldShowFirstDay(p, AMANHA)).toBe(false);
  });

  it('sem registro nenhum, não aparece', () => {
    expect(shouldShowFirstDay(null, HOJE)).toBe(false);
  });
});

describe('firstDay — o que vem do save é higienizado', () => {
  it('gesto desconhecido não entra', () => {
    const p = normalizeFirstDay({ day: HOJE, done: ['pet', 'hackear', 42] });
    expect(p?.done).toEqual(['pet']);
  });

  it('duplicata é colapsada', () => {
    expect(normalizeFirstDay({ day: HOJE, done: ['feed', 'feed'] })?.done).toEqual(['feed']);
  });

  it('lixo devolve null, não um cartão fantasma', () => {
    expect(normalizeFirstDay(null)).toBeNull();
    expect(normalizeFirstDay({ done: ['pet'] })).toBeNull();
    expect(normalizeFirstDay('x')).toBeNull();
  });
});

describe('firstDay — o check-in não dispara no D0 (a outra metade do WP1.3)', () => {
  it('needsCheckIn é falso no dia da criação', async () => {
    // A fila de intersticiais podia abrir o ritual de PLANEJAMENTO em cima de
    // quem tinha acabado de conhecer a criatura: a primeira coisa depois do
    // nascimento seria um formulário de metas. `handleCompleteOnboarding`
    // grava `lastCheckInDate` do dia de hoje — e "hoje já foi feito" não é uma
    // exceção escondida na fila: é a verdade (a pessoa acabou de escolher
    // tudo no onboarding).
    const { needsCheckIn } = await import('./rituals');
    const { playerDayKey } = await import('./playerDay');
    const agora = new Date('2026-09-06T09:00:00');
    const hoje = playerDayKey(agora, undefined);
    expect(needsCheckIn({ lastCheckInDate: hoje }, agora)).toBe(false);
    // E volta a valer no dia seguinte — não é um desligamento permanente.
    expect(needsCheckIn({ lastCheckInDate: hoje }, new Date('2026-09-07T09:00:00'))).toBe(true);
  });
});
