// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const native = vi.hoisted(() => ({ is: true, schedule: vi.fn(async () => {}), exact: vi.fn(async () => ({ exact: true })) as ReturnType<typeof vi.fn> | undefined, cancel: vi.fn(async () => {}), shown: vi.fn(), granted: true }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => native.is } }));
vi.mock('../plugins/SoulmonAlarmPlugin', () => ({ SoulmonAlarm: { scheduleAlarm: native.schedule, get scheduleExactAlarm() { return native.exact; }, cancelAlarm: native.cancel } }));
vi.mock('./notifications', () => ({ checkNotificationPermission: () => ({ granted: native.granted, denied: !native.granted, prompt: false }), showNotification: native.shown }));

import { cancelFocusAlarm, focusAlarmCopy, scheduleFocusAlarm } from './focusNotify';

beforeEach(() => { vi.useFakeTimers(); native.exact = vi.fn(async () => ({ exact: true })); native.schedule.mockClear(); native.cancel.mockClear(); native.shown.mockClear(); native.granted = true; });
afterEach(() => { cancelFocusAlarm('focus-end'); cancelFocusAlarm('rest-end'); vi.useRealTimers(); });

describe('avisos do foco (hora do descanso / descanso acabou)', () => {
  it('no APK usa o alarme EXATO com o timestamp em ms e id próprio (beta12, item I)', () => {
    native.is = true;
    const now = new Date(2026, 10, 12, 14, 0, 10).getTime();
    scheduleFocusAlarm('focus-end', now + 25 * 60_000, 'pt-BR', now);
    expect(native.exact).toHaveBeenCalledWith({ id: 'foco-fim', title: 'Hora do descanso', body: expect.stringContaining('foco acabou'), atMs: now + 25 * 60_000 });
    expect(native.schedule).not.toHaveBeenCalled();
    scheduleFocusAlarm('rest-end', now + 30 * 60_000, 'en-US', now);
    expect(native.exact).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'foco-descanso-fim', title: 'Break is over', atMs: now + 30 * 60_000 }));
  });
  it('APK anterior (sem o método) ou método que rejeita cai no alarme "HH:mm" de sempre', async () => {
    native.is = true;
    const now = new Date(2026, 10, 12, 14, 0, 10).getTime();
    native.exact = undefined;
    scheduleFocusAlarm('focus-end', now + 25 * 60_000, 'pt-BR', now);
    expect(native.schedule).toHaveBeenCalledWith({ id: 'foco-fim', title: 'Hora do descanso', body: expect.stringContaining('foco acabou'), scheduledTime: '14:26' });
    native.schedule.mockClear();
    native.exact = vi.fn(async () => { throw new Error('not implemented'); });
    scheduleFocusAlarm('rest-end', now + 30 * 60_000, 'pt-BR', now);
    await vi.advanceTimersByTimeAsync(0);
    expect(native.schedule).toHaveBeenCalledWith(expect.objectContaining({ id: 'foco-descanso-fim', scheduledTime: '14:31' }));
  });
  it('reagendar troca o alarme (cancela o anterior) e instante já passado não agenda nada', () => {
    native.is = true;
    const now = Date.now();
    scheduleFocusAlarm('focus-end', now - 1000, 'pt-BR', now);
    expect(native.schedule).not.toHaveBeenCalled();
    expect(native.exact).not.toHaveBeenCalled();
    expect(native.cancel).toHaveBeenCalledWith({ id: 'foco-fim' });
  });
  it('na web dispara só com o app em segundo plano e só com a permissão já concedida', () => {
    native.is = false;
    const now = Date.now();
    scheduleFocusAlarm('rest-end', now + 5_000, 'pt-BR', now);
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    vi.advanceTimersByTime(5_001);
    expect(native.shown).not.toHaveBeenCalled(); // app à vista: o relógio da tela já mostra
    scheduleFocusAlarm('rest-end', now + 10_000, 'pt-BR', now);
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    vi.advanceTimersByTime(10_001);
    expect(native.shown).toHaveBeenCalledWith('O descanso acabou', expect.objectContaining({ body: 'Pronto para outra rodada?' }));
    native.shown.mockClear(); native.granted = false;
    scheduleFocusAlarm('rest-end', now + 20_000, 'pt-BR', now);
    vi.advanceTimersByTime(20_001);
    expect(native.shown).not.toHaveBeenCalled(); // sem permissão, nunca insiste
  });
  it('textos nos dois idiomas', () => {
    expect(focusAlarmCopy('focus-end', 'en-US').title).toBe('Time to rest');
    expect(focusAlarmCopy('rest-end', 'pt-BR').title).toBe('O descanso acabou');
  });
});
