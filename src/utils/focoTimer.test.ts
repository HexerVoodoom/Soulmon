import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  FOCO_MODES, armEndNotice, disarmEndNotice, formatClock, isLongBreak, normalizeSessions, normalizeTimer,
  pause, recordSession, remainingMs, resume, settle, startPhase, KEEP_DAYS,
} from './focoTimer';

afterEach(() => { disarmEndNotice(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('timer de foco — o tempo é um timestamp, não um contador', () => {
  it('25/5 e 50/10: a duração sai da tabela de modos', () => {
    const t = startPhase('p25', 'focus', 1_000);
    expect(t.totalMs).toBe(25 * 60_000);
    expect(t.endAt).toBe(1_000 + 25 * 60_000);
    expect(startPhase('p50', 'break', 0).totalMs).toBe(FOCO_MODES.p50.breakMin * 60_000);
    expect(startPhase('p25', 'break', 0, true).totalMs).toBe(15 * 60_000);
  });

  it('aba em segundo plano: pular o relógio de uma vez dá a conta certa (sem ticks)', () => {
    const t = startPhase('p25', 'focus', 0);
    expect(remainingMs(t, 10 * 60_000)).toBe(15 * 60_000);
    expect(settle(t, 24 * 60_000)).toBe(t);
    const fim = settle(t, 26 * 60_000);
    expect(fim.status).toBe('ended');
    expect(remainingMs(fim, 99 * 60_000)).toBe(0);
  });

  it('pausar guarda o que falta; continuar recomeça dali, e o tempo parado não conta', () => {
    const t = startPhase('p25', 'focus', 0);
    const p = pause(t, 5 * 60_000);
    expect(p.status).toBe('paused');
    expect(remainingMs(p, 999 * 60_000)).toBe(20 * 60_000);
    const r = resume(p, 100 * 60_000);
    expect(r.status).toBe('running');
    expect(remainingMs(r, 100 * 60_000 + 60_000)).toBe(19 * 60_000);
  });

  it('formatClock arredonda para cima e nunca é negativo', () => {
    expect(formatClock(25 * 60_000)).toBe('25:00');
    expect(formatClock(1)).toBe('00:01');
    expect(formatClock(-5)).toBe('00:00');
  });

  it('pausa longa só depois do 4º foco do dia, e só no 25/5', () => {
    expect([1, 2, 3, 4, 8].map(n => isLongBreak('p25', n))).toEqual([false, false, false, true, true]);
    expect(isLongBreak('p50', 4)).toBe(false);
  });
});

describe('timer — o storage nunca derruba a folha', () => {
  it('lixo vira "sem timer"', () => {
    const lixo: unknown[] = [
      null, 5, 'x', {}, { mode: 'p99' },
      { mode: 'p25', phase: 'focus', status: 'running', totalMs: 1, endAt: 'a' },
      { mode: 'p25', phase: 'focus', status: 'running', totalMs: 9e12, endAt: 5 },
    ];
    for (const x of lixo) expect(normalizeTimer(x)).toBeNull();
  });
  it('um timer válido atravessa a normalização', () => {
    const t = startPhase('p50', 'focus', 123);
    expect(normalizeTimer(JSON.parse(JSON.stringify(t)))).toEqual(t);
  });
  it('pausado com sobra maior que o total é rejeitado', () => {
    expect(normalizeTimer({ mode: 'p25', phase: 'focus', status: 'paused', totalMs: 1000, leftMs: 5000 })).toBeNull();
  });
});

describe('registro dos "foquei" — só do dia, sem placar', () => {
  it('soma por dia e ignora dia mal formado', () => {
    let d = recordSession({}, '2026-10-04', 25);
    d = recordSession(d, '2026-10-04', 25);
    expect(d['2026-10-04']).toEqual({ n: 2, min: 50 });
    expect(recordSession(d, 'ontem', 25)).toBe(d);
  });
  it('guarda só os últimos dias e higieniza lixo', () => {
    const muitos: Record<string, unknown> = {};
    for (let i = 1; i <= 30; i++) muitos[`2026-09-${String(i).padStart(2, '0')}`] = { n: 1, min: 25 };
    muitos['lixo'] = { n: 1, min: 1 };
    muitos['2026-10-01'] = { n: -3, min: 'x' };
    const out = normalizeSessions(muitos);
    expect(Object.keys(out).length).toBeLessThanOrEqual(KEEP_DAYS);
    expect(out['lixo']).toBeUndefined();
    expect(out['2026-10-01']).toBeUndefined();
    expect(normalizeSessions('x')).toEqual({});
    expect(normalizeSessions([1, 2])).toEqual({});
  });
});

describe('aviso de fim — com relógio mockado', () => {
  it('dispara uma vez no fim, vibra, e só notifica com permissão JÁ concedida (nunca pede)', () => {
    vi.useFakeTimers();
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { vibrate });
    const ctor = vi.fn();
    const requestPermission = vi.fn();
    vi.stubGlobal('Notification', Object.assign(ctor, { permission: 'default', requestPermission }));
    armEndNotice(Date.now() + 60_000, Date.now(), { title: 'a', body: 'b' });
    vi.advanceTimersByTime(59_999);
    expect(vibrate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2);
    expect(vibrate).toHaveBeenCalledTimes(1);
    expect(ctor).not.toHaveBeenCalled();
    expect(requestPermission).not.toHaveBeenCalled();
  });
  it('cancelar desarma', () => {
    vi.useFakeTimers();
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { vibrate });
    armEndNotice(Date.now() + 1000, Date.now(), { title: 'a', body: 'b' });
    disarmEndNotice();
    vi.advanceTimersByTime(5000);
    expect(vibrate).not.toHaveBeenCalled();
  });
});
