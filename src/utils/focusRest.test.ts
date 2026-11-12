import { describe, expect, it } from 'vitest';
import { REST_MIN, REST_STALE_MS, alarmClock, normalizeRest, restEndsAt, restFromFocusEnd, restLeftMs, restOver } from './focusRest';
import { focusEndAt } from './focusJourney';

const T0 = 1_800_000_000_000;
const base = { mode: 'p25' as const, env: 'cavern' as const, items: [], key: false };

describe('descanso por timestamp', () => {
  it('dura 5 min no 25/5 e 10 min no 50/10, contados do FIM do foco, não de quando a tela abriu', () => {
    expect(REST_MIN).toEqual({ p25: 5, p50: 10 });
    const r = restFromFocusEnd(T0 + 1000, 0, T0 + 3 * 60_000, base); // o app só abriu 3 min depois do fim
    expect(r.startedAt).toBe(T0 + 1000);
    expect(restLeftMs(r, T0 + 3 * 60_000)).toBe(5 * 60_000 - (3 * 60_000 - 1000));
    expect(restOver(r, T0 + 5 * 60_000 + 1000)).toBe(true);
    expect(restEndsAt({ startedAt: T0, mode: 'p50' })).toBe(T0 + 10 * 60_000);
  });
  it('sair do app não muda nada: a conta só depende do relógio', () => {
    const r = restFromFocusEnd(T0, 0, T0, base);
    expect(restLeftMs(r, T0 + 4 * 60_000)).toBe(60_000);
    expect(restLeftMs(r, T0 + 99 * 60_000)).toBe(0);
  });
  it('corrige a diferença servidor−aparelho e nunca começa no futuro', () => {
    expect(restFromFocusEnd(T0 + 10_000, 4_000, T0 + 20_000, base).startedAt).toBe(T0 + 6_000);
    expect(restFromFocusEnd(T0 + 90_000, 0, T0, base).startedAt).toBe(T0);
    expect(restFromFocusEnd(null, 0, T0, base).startedAt).toBe(T0);
  });
  it('normaliza o que vem do storage e descarta descanso velho ou torto', () => {
    expect(normalizeRest({ startedAt: T0, mode: 'p25', env: 'forest', items: [{ kind: 'material', id: 'moss', qty: 1 }, { x: 1 }], key: true }, T0 + 1000)).toEqual({ startedAt: T0, mode: 'p25', env: 'forest', items: [{ kind: 'material', id: 'moss', qty: 1 }], key: true });
    expect(normalizeRest({ startedAt: T0, mode: 'p25', env: 'forest' }, T0 + REST_STALE_MS + 1)).toBeNull();
    expect(normalizeRest({ startedAt: T0, mode: 'p99', env: 'forest' }, T0)).toBeNull();
    expect(normalizeRest({ startedAt: T0, mode: 'p25', env: 'lua' }, T0)).toBeNull();
    expect(normalizeRest(null, T0)).toBeNull();
  });
});

describe('fim do foco e alarme', () => {
  const c = { startAt: T0, pausedMs: 0, pausedAt: null, mode: 'p25' as const };
  it('o fim do foco anda com as pausas e é nulo enquanto pausado', () => {
    expect(focusEndAt(c)).toBe(T0 + 25 * 60_000);
    expect(focusEndAt({ ...c, pausedMs: 2 * 60_000 })).toBe(T0 + 27 * 60_000);
    expect(focusEndAt({ ...c, pausedAt: T0 + 1000 })).toBeNull();
    expect(focusEndAt({ ...c, pausedMs: 99 * 60_000 })).toBe(T0 + 55 * 60_000); // teto de 30 min parado
  });
  it('o alarme nativo HH:mm arredonda PARA CIMA (senão um instante no meio do minuto cairia amanhã)', () => {
    expect(alarmClock(new Date(2026, 10, 12, 14, 25, 40).getTime())).toBe('14:26');
    expect(alarmClock(new Date(2026, 10, 12, 14, 26, 0).getTime())).toBe('14:26');
    expect(alarmClock(new Date(2026, 10, 12, 23, 59, 1).getTime())).toBe('00:00');
  });
});
