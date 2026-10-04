// @vitest-environment jsdom
/**
 * QA2 (04/10/2026) — `syncTaskAlarms` comparava `deadline.date` (dia LOCAL, do
 * `<input type="date">`) com `new Date().toISOString()` (dia UTC). Em UTC−3, das
 * 21h à meia-noite o "hoje" UTC já é amanhã: a tarefa com prazo hoje à noite
 * perdia o alarme no re-sync, e a de amanhã ganhava um alarme hoje.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false, getPlatform: () => 'web' } }));
vi.mock('@capacitor/push-notifications', () => ({ PushNotifications: {} }));
vi.mock('../plugins/SoulmonAlarmPlugin', () => ({ SoulmonAlarm: { scheduleAlarm: vi.fn(() => Promise.resolve()), cancelAlarm: vi.fn() } }));

import { syncTaskAlarms, getScheduledNotifications } from './notifications';

const TZ_ORIGINAL = process.env.TZ;
beforeEach(() => {
  process.env.TZ = 'America/Sao_Paulo';
  localStorage.clear();
  vi.useFakeTimers();
  // 22:30 de 04/10 em Brasília = 01:30 UTC de 05/10
  vi.setSystemTime(new Date('2026-10-05T01:30:00Z'));
});
afterEach(() => {
  vi.useRealTimers();
  if (TZ_ORIGINAL === undefined) delete process.env.TZ; else process.env.TZ = TZ_ORIGINAL;
});

describe('syncTaskAlarms usa o dia LOCAL', () => {
  it('prazo hoje (local) às 23:30 com alarme de 1h agenda 22:30 mesmo depois das 21h', () => {
    syncTaskAlarms([
      { id: 'hoje', name: 'Hoje', alarm: { type: '1h' }, deadline: { date: '2026-10-04', time: '23:30' } },
    ], 'pt-BR');
    expect(getScheduledNotifications().map(n => [n.taskId, n.scheduledTime])).toEqual([['hoje', '22:30']]);
  });

  it('prazo amanhã (local) NÃO ganha alarme hoje', () => {
    syncTaskAlarms([
      { id: 'amanha', name: 'Amanhã', alarm: { type: '1h' }, deadline: { date: '2026-10-05', time: '08:00' } },
    ], 'pt-BR');
    expect(getScheduledNotifications()).toEqual([]);
  });
});
