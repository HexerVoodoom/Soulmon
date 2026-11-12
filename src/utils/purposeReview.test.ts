import { describe, it, expect } from 'vitest';
import { completeReview, dismissReview, evidence, monthsEndingAt, recordWeekly, reviewOffer, weekEvidence, weeklyAnswered, SEMESTER_REWARD_FRAME_ID, isWeeklyDay } from './purposeReview';
import { emptyPurpose, setGoal } from './purpose';
import { emptyRhythm, dayKeyOf } from './habitRhythm';

const base = () => setGoal(emptyPurpose(), { text: 'Correr 5 km', areas: ['corpo'] }, new Date(2026, 0, 15));

describe('purposeReview: quando oferecer', () => {
  it('mensal: do dia 1 ao 7, sobre o mês anterior; no dia 8 some', () => {
    const p = base();
    expect(reviewOffer(p, new Date(2026, 1, 1))).toEqual({ kind: 'month', period: '2026-01', monthKey: '2026-01' });
    expect(reviewOffer(p, new Date(2026, 1, 7))?.kind).toBe('month');
    expect(reviewOffer(p, new Date(2026, 1, 8))).toBeNull();
  });
  it('virada de mês pela data local: 31/jan 23h59 ainda não; 1/fev 00h00 sim', () => {
    const p = base();
    expect(reviewOffer(p, new Date(2026, 0, 31, 23, 59))).toBeNull();
    expect(reviewOffer(p, new Date(2026, 1, 1, 0, 0))?.period).toBe('2026-01');
  });
  it('sem objetivo, ou no mesmo mês em que foi criado: nada', () => {
    expect(reviewOffer(undefined, new Date(2026, 1, 1))).toBeNull();
    expect(reviewOffer(emptyPurpose(), new Date(2026, 1, 1))).toBeNull();
    expect(reviewOffer(base(), new Date(2026, 0, 20))).toBeNull();
  });
  it('perdida não acumula: dispensar tira o card, e o mês seguinte traz o seu', () => {
    let p = base();
    const o = reviewOffer(p, new Date(2026, 1, 2))!;
    p = dismissReview(p, o);
    expect(reviewOffer(p, new Date(2026, 1, 3))).toBeNull();
    expect(reviewOffer(p, new Date(2026, 2, 2))?.period).toBe('2026-02');
  });
  it('aos 6 meses: semestral; aos 12: anual; no lugar da mensal', () => {
    const p = base();
    expect(reviewOffer(p, new Date(2026, 6, 2))).toMatchObject({ kind: 'semester', period: 'C1', cycle: 1 });
    expect(reviewOffer(p, new Date(2027, 0, 2))).toMatchObject({ kind: 'year', period: 'C2', cycle: 2 });
  });
});

describe('purposeReview: concluir', () => {
  it('grava a revisão, o status da meta anterior e a meta nova', () => {
    let p = base();
    const o1 = reviewOffer(p, new Date(2026, 1, 2))!;
    p = completeReview(p, o1, { perceived: 'closer', obstacles: ['time'], decision: 'keep', nextMilestone: 'Correr 3x' }, new Date(2026, 1, 2)).purpose;
    expect(p.reviews).toHaveLength(1);
    expect(p.milestones[0]).toMatchObject({ label: 'Correr 3x', status: 'open', period: 'month' });
    const o2 = reviewOffer(p, new Date(2026, 2, 2))!;
    p = completeReview(p, o2, { previousStatus: 'partial' }, new Date(2026, 2, 2)).purpose;
    expect(p.milestones[0].status).toBe('partial');
  });
  it('é idempotente: concluir duas vezes o mesmo período não duplica', () => {
    const p = base();
    const o = reviewOffer(p, new Date(2026, 1, 2))!;
    const a = completeReview(p, o, {}, new Date(2026, 1, 2)).purpose;
    const b = completeReview(a, o, {}, new Date(2026, 1, 3)).purpose;
    expect(b).toBe(a);
  });
  it('semestral concede o cosmético 1 vez, para qualquer resposta; de novo, não', () => {
    const p = base();
    const o = reviewOffer(p, new Date(2026, 6, 2))!;
    const r = completeReview(p, o, { perceived: 'farther' }, new Date(2026, 6, 2));
    expect(r.grantedFrame).toBe(SEMESTER_REWARD_FRAME_ID);
    expect(r.purpose.grants).toHaveLength(1);
    // mesmo semestre, revisão apagada à força: o id de concessão segura
    const refeito = completeReview({ ...r.purpose, reviews: [] }, o, {}, new Date(2026, 6, 3));
    expect(refeito.grantedFrame).toBeUndefined();
  });
  it('trocar o texto do objetivo não muda a âncora do semestre', () => {
    let p = base();
    p = setGoal(p, { text: 'Correr 10 km', areas: [] }, new Date(2026, 3, 1));
    expect(p.firstCreatedAt).toBe('2026-01-15');
    expect(reviewOffer(p, new Date(2026, 6, 2))?.kind).toBe('semester');
  });
  it('anual com arquivo: arquiva o objetivo e libera um novo, com âncora nova', () => {
    const p = base();
    const o = reviewOffer(p, new Date(2027, 0, 2))!;
    const r = completeReview(p, o, { archiveGoal: true }, new Date(2027, 0, 2)).purpose;
    expect(r.goal).toBeUndefined();
    expect(r.history.at(-1)?.status).toBe('archived');
    expect(r.firstCreatedAt).toBeUndefined();
    expect(setGoal(r, { text: 'Novo', areas: [] }, new Date(2027, 0, 5)).firstCreatedAt).toBe('2027-01-05');
  });
});

describe('purposeReview: evidência e semanal', () => {
  it('feitas / oportunidades por hábito, prioridades primeiro; semestre soma 6 meses', () => {
    const p = { ...base(), priorities: ['b'], monthlyAgg: { '2026-01': { a: { done: 5, due: 10 }, b: { done: 18, due: 22 } }, '2026-02': { b: { done: 2, due: 4 } } } };
    const e = evidence(p, ['2026-01']);
    expect(e.rows.map(r => r.id)).toEqual(['b', 'a']);
    expect(e.total).toEqual({ done: 23, due: 32 });
    expect(evidence(p, monthsEndingAt('2026-02', 6)).rows.find(r => r.id === 'b')).toMatchObject({ done: 20, due: 26 });
    expect(evidence(p, ['2025-12']).has).toBe(false);
  });
  it('semanal: X de Y dos últimos 7 dias; domingo; 1 pergunta por semana', () => {
    const hoje = new Date(2026, 10, 8); // domingo
    expect(isWeeklyDay(hoje)).toBe(true);
    const r = emptyRhythm();
    r.done = [dayKeyOf(new Date(2026, 10, 3)), dayKeyOf(new Date(2026, 10, 5)), dayKeyOf(new Date(2026, 10, 1))];
    const rows = weekEvidence(['a'], { a: r }, { a: { weekDays: [0, 1, 2, 3, 4, 5, 6] } }, hoje);
    expect(rows).toEqual([{ id: 'a', done: 2, due: 7 }]); // 1/nov está fora da janela 2..8
    let p = base();
    expect(weeklyAnswered(p, hoje)).toBe(false);
    p = recordWeekly(p, ['energy', 'time'], hoje);
    expect(weeklyAnswered(p, hoje)).toBe(true);
    expect(p.reviews[0].obstacles).toEqual(['energy']);
    expect(recordWeekly(p, ['time'], hoje)).toBe(p);
  });
});
