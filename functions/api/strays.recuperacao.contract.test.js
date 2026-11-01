/**
 * CONTRATO DA RECUPERAÇÃO DO DESGARRADO (01/11/2026, dono, REGISTRO §213 emenda): voltar a logar NÃO recupera. A marca
 * `strayedAt` gruda até o dono completar TODAS as tarefas do dia em 2 dias seguidos — recalculado no servidor a partir do save
 * enviado no POST (`isDayCompleteInSave`), no máximo 1 dia por data; um dia sem fechar quebra a sequência.
 */
import { describe, it, expect } from 'vitest';
import {
  applyStrayRecovery, isDayCompleteInSave, isStrayProfile, markStrayIfInactive, recoverStrayFromSave, strayRecoveryProgress,
  touchLastLogin, STRAY_RECOVERY_DAYS, prevDay,
} from './_strays.js';

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 10, 1, 15);
const A = 'a'.repeat(32);
const D1 = '2026-11-01', D2 = '2026-11-02', D3 = '2026-11-03', D4 = '2026-11-04';

/** Save com o dia `d` completo: 1 tarefa concluída nele, hábito diário feito nele, nada pendente vencido. */
const fullDay = (d) => ({
  completedTasks: [{ id: 't', completedAt: `${d}T12:00:00.000Z` }],
  activities: [{ id: 'h', weekDays: [], lastCompletedDate: d }],
  tasks: [],
});
const marked = () => ({ id: A, pid: 'p'.repeat(24), lastLoginAt: NOW, strayedAt: NOW - DAY, strayRecovery: { streak: 0, lastDay: null } });

function mkEnv(profile) {
  const store = new Map(profile ? [[`profile:${A}`, JSON.stringify(profile)]] : []);
  return { env: { SOULMON_SAVES: { get: async k => store.get(k) ?? null, put: async (k, v) => { store.set(k, v); } } }, store };
}

describe('dia completo recalculado do save (servidor)', () => {
  it('completo: tarefa concluída no dia + hábito do dia feito + nada pendente vencido', () => {
    expect(isDayCompleteInSave(fullDay(D1), D1)).toBe(true);
  });
  it('incompleto: sem tarefa no dia, hábito não feito, ou tarefa pendente vencida', () => {
    expect(isDayCompleteInSave({ ...fullDay(D1), completedTasks: [] }, D1)).toBe(false);
    expect(isDayCompleteInSave({ ...fullDay(D1), activities: [{ id: 'h', weekDays: [], lastCompletedDate: '2026-10-31' }] }, D1)).toBe(false);
    expect(isDayCompleteInSave({ ...fullDay(D1), tasks: [{ id: 'x', completed: false, deadline: { date: D1, time: '10:00' } }] }, D1)).toBe(false);
  });
  it('hábito fora do dia da semana não conta; data do aparelho (toDateString) é lida', () => {
    const domingo = '2026-11-01'; // 01/11/2026 é domingo
    expect(isDayCompleteInSave({ ...fullDay(domingo), activities: [{ id: 'h', weekDays: [1], lastCompletedDate: '2026-10-26' }] }, domingo)).toBe(true);
    expect(isDayCompleteInSave({ ...fullDay(domingo), activities: [{ id: 'h', weekDays: [], lastCompletedDate: 'Sun Nov 01 2026' }] }, domingo)).toBe(true);
  });
  it('um flag do cliente não vale nada', () => {
    expect(isDayCompleteInSave({ dayComplete: true, perfectDays: 999, completedToday: true }, D1)).toBe(false);
  });
});

describe('login sozinho NÃO recupera', () => {
  it('voltar depois de 90+ dias marca strayedAt e continua no pool', async () => {
    const velho = NOW - 120 * DAY;
    const { env, store } = mkEnv({ id: A, pid: 'p'.repeat(24), lastLoginAt: velho, updatedAt: velho });
    expect(await touchLastLogin(env, A, NOW)).toBe(true);
    const p = JSON.parse(store.get(`profile:${A}`));
    expect(p.lastLoginAt).toBe(NOW);
    expect(p.strayedAt).toBe(NOW);
    expect(isStrayProfile(p, NOW)).toBe(true);
    // logar de novo nos dias seguintes também não tira a marca
    expect(await touchLastLogin(env, A, NOW + 3 * DAY)).toBe(true);
    expect(isStrayProfile(JSON.parse(store.get(`profile:${A}`)), NOW + 3 * DAY)).toBe(true);
  });
  it('save sem dia completo não mexe na marca', async () => {
    const { env, store } = mkEnv(marked());
    expect(await recoverStrayFromSave(env, A, { completedTasks: [] }, Date.parse(`${D1}T20:00:00Z`))).toBe(false);
    expect(JSON.parse(store.get(`profile:${A}`)).strayedAt).toBeGreaterThan(0);
  });
  it('quem nunca ficou 90 dias fora não é marcado', () => {
    const p = { id: A, pid: 'x', lastLoginAt: NOW - 30 * DAY };
    expect(markStrayIfInactive(p, NOW)).toBe(p);
  });
});

describe('2 dias completos SEGUIDOS recuperam', () => {
  it('dia 1 → 1/2; dia 2 → marca limpa, sai do pool', async () => {
    const { env, store } = mkEnv(marked());
    expect(await recoverStrayFromSave(env, A, fullDay(D1), Date.parse(`${D1}T20:00:00Z`))).toBe(true);
    let p = JSON.parse(store.get(`profile:${A}`));
    expect(p.strayRecovery).toEqual({ streak: 1, lastDay: D1 });
    expect(strayRecoveryProgress(p, D1)).toBe(1);
    expect(strayRecoveryProgress(p, D2)).toBe(1);
    expect(isStrayProfile(p, NOW)).toBe(true);
    expect(await recoverStrayFromSave(env, A, fullDay(D2), Date.parse(`${D2}T20:00:00Z`))).toBe(true);
    p = JSON.parse(store.get(`profile:${A}`));
    expect(p.strayedAt).toBeUndefined();
    expect(p.strayRecovery).toBeUndefined();
    expect(isStrayProfile(p, Date.parse(`${D2}T20:00:00Z`))).toBe(false);
  });
  it('no máximo 1 dia por data: dois saves completos no MESMO dia contam 1', () => {
    const p1 = applyStrayRecovery(marked(), fullDay(D1), D1);
    expect(p1.strayRecovery).toEqual({ streak: 1, lastDay: D1 });
    expect(applyStrayRecovery(p1, fullDay(D1), D1)).toBe(p1);
    expect(STRAY_RECOVERY_DAYS).toBe(2);
  });
});

describe('sequência quebrada zera', () => {
  it('dia 1 completo, dia 2 não, dia 3 completo → volta a 1/2 (não recupera)', () => {
    const p1 = applyStrayRecovery(marked(), fullDay(D1), D1);
    expect(applyStrayRecovery(p1, { completedTasks: [] }, D2)).toBe(p1);
    expect(strayRecoveryProgress(p1, D3)).toBe(0); // o dia 2 ficou sem fechar: o aviso mostra 0/2
    const p3 = applyStrayRecovery(p1, fullDay(D3), D3);
    expect(p3.strayedAt).toBeGreaterThan(0);
    expect(p3.strayRecovery).toEqual({ streak: 1, lastDay: D3 });
    const p4 = applyStrayRecovery(p3, fullDay(D4), D4);
    expect(p4.strayedAt).toBeUndefined();
  });
  it('prevDay atravessa o mês', () => {
    expect(prevDay('2026-11-01')).toBe('2026-10-31');
  });
});
