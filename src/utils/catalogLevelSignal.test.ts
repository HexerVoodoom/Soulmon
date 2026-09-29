import { describe, it, expect } from 'vitest';
import { lowConstancyStreak, catalogLevelSignal, pickCatalogLevelInviteCandidate } from './catalogLevelSignal';
import { emptyRhythm, completeHabit, applyMissedDay, dayKeyOf } from './habitRhythm';
import type { HabitRhythm } from './habitRhythm';
import { ACTIVITY_CATALOG } from '../data/activityCatalog';

const HOJE = new Date('2026-09-28T12:00:00');

function dia(n: number): Date {
  return new Date(HOJE.getTime() - n * 86400000);
}

describe('lowConstancyStreak', () => {
  it('rhythm vazio: sem histórico não há sequência de falta', () => {
    expect(lowConstancyStreak(emptyRhythm(), HOJE, 0.4)).toBe(0);
  });

  it('14 dias consecutivos perdidos (sem nenhum feito) contam 14', () => {
    let r = emptyRhythm();
    for (let i = 1; i <= 14; i++) r = applyMissedDay(r, dayKeyOf(dia(i)));
    expect(lowConstancyStreak(r, HOJE, 0.4)).toBeGreaterThanOrEqual(14);
  });

  it('um dia FEITO no meio interrompe a sequência', () => {
    let r = emptyRhythm();
    for (let i = 1; i <= 5; i++) r = applyMissedDay(r, dayKeyOf(dia(i)));
    r = completeHabit(r, dayKeyOf(dia(6)));
    for (let i = 7; i <= 20; i++) r = applyMissedDay(r, dayKeyOf(dia(i)));
    // A busca vem de ONTEM para trás; o dia feito (dia 6) para a sequência
    // antes de alcançar os dias 7..20.
    expect(lowConstancyStreak(r, HOJE, 0.4)).toBeLessThan(6);
  });

  it('dia protegido por escudo NÃO conta e NÃO quebra a sequência', () => {
    let r1 = emptyRhythm();
    for (let i = 1; i <= 10; i++) r1 = applyMissedDay(r1, dayKeyOf(dia(i)));
    const semEscudo = lowConstancyStreak(r1, HOJE, 0.4);

    let r2 = emptyRhythm();
    for (let i = 1; i <= 10; i++) {
      if (i === 5) { r2 = { ...r2, shielded: [...r2.shielded, dayKeyOf(dia(i))] }; continue; }
      r2 = applyMissedDay(r2, dayKeyOf(dia(i)));
    }
    const comEscudo = lowConstancyStreak(r2, HOJE, 0.4);
    // O dia protegido não deveria reduzir a contagem de falta observada.
    expect(comEscudo).toBeGreaterThanOrEqual(semEscudo - 1);
  });

  it('ausência (dia sem NENHUM registro) é perdoada — não quebra nem conta', () => {
    let r = emptyRhythm();
    for (let i = 1; i <= 5; i++) r = applyMissedDay(r, dayKeyOf(dia(i)));
    // dias 6 e 7 ficam sem registro nenhum (ausência) — não estão em done/missed/shielded
    for (let i = 8; i <= 12; i++) r = applyMissedDay(r, dayKeyOf(dia(i)));
    const streak = lowConstancyStreak(r, HOJE, 0.4);
    expect(streak).toBeGreaterThan(0);
  });
});

describe('catalogLevelSignal', () => {
  it('sugere SUBIR quando constância de 21 dias é alta e o item já está no nível há tempo suficiente', () => {
    let r = emptyRhythm();
    for (let i = 1; i <= 21; i++) r = completeHabit(r, dayKeyOf(dia(i)));
    const signal = catalogLevelSignal({
      currentLevel: 1, rhythm: r, now: HOJE,
      levelSetAt: dia(30).toISOString(),
    });
    expect(signal).toBe('up');
  });

  it('NÃO sugere subir se levelSetAt está ausente (nunca assume tempo não observado)', () => {
    let r = emptyRhythm();
    for (let i = 1; i <= 21; i++) r = completeHabit(r, dayKeyOf(dia(i)));
    const signal = catalogLevelSignal({ currentLevel: 1, rhythm: r, now: HOJE });
    expect(signal).not.toBe('up');
  });

  it('NUNCA sugere subir em item optInOnly, mesmo com constância perfeita', () => {
    let r = emptyRhythm();
    for (let i = 1; i <= 21; i++) r = completeHabit(r, dayKeyOf(dia(i)));
    const signal = catalogLevelSignal({
      currentLevel: 1, optInOnly: true, rhythm: r, now: HOJE, levelSetAt: dia(30).toISOString(),
    });
    expect(signal).not.toBe('up');
  });

  it('sugere DESCER com 14 dias consecutivos de baixa constância', () => {
    let r = emptyRhythm();
    for (let i = 1; i <= 30; i++) r = applyMissedDay(r, dayKeyOf(dia(i)));
    const signal = catalogLevelSignal({
      currentLevel: 2, rhythm: r, now: HOJE, levelSetAt: dia(60).toISOString(),
    });
    expect(signal).toBe('down');
  });

  it('item optInOnly ainda pode descer', () => {
    let r = emptyRhythm();
    for (let i = 1; i <= 30; i++) r = applyMissedDay(r, dayKeyOf(dia(i)));
    const signal = catalogLevelSignal({
      currentLevel: 2, optInOnly: true, rhythm: r, now: HOJE, levelSetAt: dia(60).toISOString(),
    });
    expect(signal).toBe('down');
  });

  it('cooldown de 14 dias após recusa bloqueia nova oferta de descer', () => {
    let r = emptyRhythm();
    for (let i = 1; i <= 30; i++) r = applyMissedDay(r, dayKeyOf(dia(i)));
    const signal = catalogLevelSignal({
      currentLevel: 2, rhythm: r, now: HOJE, levelSetAt: dia(60).toISOString(),
      lastDownDeclineAt: dia(2).toISOString(),
    });
    expect(signal).toBeNull();
  });

  it('nada quando a constância está no meio do caminho', () => {
    let r = emptyRhythm();
    for (let i = 1; i <= 10; i++) r = i % 2 === 0 ? completeHabit(r, dayKeyOf(dia(i))) : applyMissedDay(r, dayKeyOf(dia(i)));
    const signal = catalogLevelSignal({ currentLevel: 2, rhythm: r, now: HOJE, levelSetAt: dia(30).toISOString() });
    expect(signal).toBeNull();
  });
});

describe('pickCatalogLevelInviteCandidate', () => {
  const item = ACTIVITY_CATALOG.find((i) => !i.optInOnly)!;
  const optInItem = ACTIVITY_CATALOG.find((i) => i.optInOnly)!;

  function rhythmSubindo(): HabitRhythm {
    let r = emptyRhythm();
    for (let i = 1; i <= 21; i++) r = completeHabit(r, dayKeyOf(dia(i)));
    return r;
  }

  it('respeita o teto de 1 convite por dia — devolve null se já mostrou hoje', () => {
    const activities = [{ id: 'a1', catalogId: item.id, level: 1 as const, catalogLevelSetAt: dia(30).toISOString() }];
    const habitRhythms = { a1: rhythmSubindo() };
    const candidate = pickCatalogLevelInviteCandidate(activities, habitRhythms, HOJE, dayKeyOf(HOJE));
    expect(candidate).toBeNull();
  });

  it('sem teto atingido, devolve o primeiro hábito com sugestão pendente, na ORDEM do array', () => {
    const activities = [
      { id: 'sem-catalogo' }, // sem catalogId — ignorado
      { id: 'a1', catalogId: item.id, level: 1 as const, catalogLevelSetAt: dia(30).toISOString() },
      { id: 'a2', catalogId: item.id, level: 1 as const, catalogLevelSetAt: dia(30).toISOString() },
    ];
    const habitRhythms = { a1: rhythmSubindo(), a2: rhythmSubindo() };
    const candidate = pickCatalogLevelInviteCandidate(activities, habitRhythms, HOJE, undefined);
    expect(candidate?.activity.id).toBe('a1');
    expect(candidate?.suggestion).toBe('up');
  });

  it('devolve null quando nenhuma atividade tem catalogId', () => {
    const activities = [{ id: 'a1' }, { id: 'a2' }];
    const candidate = pickCatalogLevelInviteCandidate(activities, {}, HOJE, undefined);
    expect(candidate).toBeNull();
  });

  it('item optInOnly pode aparecer como candidato de DESCER, nunca de SUBIR', () => {
    let r = emptyRhythm();
    for (let i = 1; i <= 30; i++) r = applyMissedDay(r, dayKeyOf(dia(i)));
    const activities = [{ id: 'a1', catalogId: optInItem.id, level: 2 as const, catalogLevelSetAt: dia(60).toISOString() }];
    const candidate = pickCatalogLevelInviteCandidate(activities, { a1: r }, HOJE, undefined);
    expect(candidate?.suggestion).toBe('down');
  });

  it('catalogId que não existe no pool é ignorado, sem lançar', () => {
    const activities = [{ id: 'a1', catalogId: 'id-que-nao-existe', level: 1 as const }];
    expect(() => pickCatalogLevelInviteCandidate(activities, {}, HOJE, undefined)).not.toThrow();
    expect(pickCatalogLevelInviteCandidate(activities, {}, HOJE, undefined)).toBeNull();
  });
});
