// @vitest-environment jsdom
/**
 * QA2 (04/10/2026) — `NotificationManager` lia `restWindow`/`isSleeping` de
 * quando o efeito de intervalo rodou pela última vez (fora das deps):
 *  · o pet já dormindo e o lembrete de DEITAR saía assim mesmo;
 *  · a janela configurada depois do mount não calava o aviso das 20h.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';

const showNotification = vi.fn();
vi.mock('../utils/notifications', () => ({
  checkAndShowNotifications: vi.fn(),
  showNotification: (...a: unknown[]) => showNotification(...a),
  subscribeToPush: vi.fn(), unsubscribeFromPush: vi.fn(),
  registerForPushNotifications: vi.fn(), unregisterFromPushNotifications: vi.fn(),
  syncActivityAlarms: vi.fn(), syncTaskAlarms: vi.fn(),
}));
vi.mock('../plugins/SoulmonAlarmPlugin', () => ({ SoulmonAlarm: { scheduleAlarm: vi.fn(), cancelAlarm: vi.fn() } }));

import { NotificationManager } from './NotificationManager';

const base = {
  activities: [], tasks: [], userName: 'x', petName: 'Bito', language: 'en-US' as const,
  enabled: true, healthPoints: 3, maxHealthPoints: 3, completedSteps: 0, totalRequired: 3,
};

beforeEach(() => { vi.useFakeTimers(); showNotification.mockClear(); });
afterEach(() => { vi.useRealTimers(); });

describe('NotificationManager: props lidas na hora do disparo', () => {
  it('o lembrete de deitar SAI na hora da janela (30 min antes das 23:00), não só em :00/:01', () => {
    vi.setSystemTime(new Date(2026, 9, 4, 22, 28, 30));
    render(<NotificationManager {...base} completedSteps={3} restWindow={{ start: '23:00', end: '07:00' }} isSleeping={false} />);
    showNotification.mockClear();
    act(() => { vi.advanceTimersByTime(90_000); }); // passa por 22:30
    expect(showNotification).toHaveBeenCalledTimes(1);
    expect(showNotification.mock.calls[0][1]).toMatchObject({ tag: 'pet-sleep-reminder' });
  });

  it('o lembrete de deitar não sai se o pet foi dormir depois do último reinício do intervalo', () => {
    vi.setSystemTime(new Date(2026, 9, 4, 22, 28, 30)); // alvo = 22:30 (30 min antes de 23:00)
    const janela = { start: '23:00', end: '07:00' };
    const { rerender } = render(<NotificationManager {...base} restWindow={janela} isSleeping={false} />);
    showNotification.mockClear();
    rerender(<NotificationManager {...base} restWindow={janela} isSleeping />);
    act(() => { vi.advanceTimersByTime(90_000); }); // passa por 22:30
    expect(showNotification).not.toHaveBeenCalled();
  });

  it('a janela configurada depois do mount cala o aviso das 20h', () => {
    vi.setSystemTime(new Date(2026, 9, 4, 19, 59, 30));
    const { rerender } = render(<NotificationManager {...base} restWindow={null} />);
    showNotification.mockClear();
    rerender(<NotificationManager {...base} restWindow={{ start: '23:00', end: '07:00' }} />);
    act(() => { vi.advanceTimersByTime(90_000); }); // passa por 20:00
    expect(showNotification).not.toHaveBeenCalled();
  });

  it('sanidade: sem janela, o aviso das 20h sai', () => {
    vi.setSystemTime(new Date(2026, 9, 4, 19, 59, 30));
    render(<NotificationManager {...base} restWindow={null} />);
    showNotification.mockClear();
    act(() => { vi.advanceTimersByTime(90_000); });
    expect(showNotification).toHaveBeenCalledTimes(1);
  });
});
