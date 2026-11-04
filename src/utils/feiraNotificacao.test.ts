import { describe, it, expect, vi } from 'vitest';
import { scheduleFeiraVolta, cancelFeiraVolta, feiraVoltaCopy, hhmmOf, FEIRA_VOLTA_TAG, type FeiraVoltaDeps } from './feiraNotificacao';

const deps = (native: boolean, permitted = true) => {
  const d = {
    native: () => native,
    schedule: vi.fn(async () => {}),
    cancel: vi.fn(async () => {}),
    permitted: () => permitted,
    show: vi.fn(),
    setTimer: vi.fn((fn: () => void, ms: number) => ({ fn, ms })),
    clearTimer: vi.fn(),
  };
  return d as typeof d & FeiraVoltaDeps;
};

describe('feiraNotificacao — o aviso da volta da investigação', () => {
  const now = new Date(2026, 10, 4, 14, 0).getTime();
  const at = now + 30 * 60_000;
  it('copy PT e EN chamam para derrotar o inimigo', () => {
    expect(feiraVoltaCopy('pt-BR').body).toContain('Seu Soulmon voltou da investigação na feira. Derrote o inimigo');
    expect(feiraVoltaCopy('en-US').body).toContain('Defeat the enemy');
  });
  it('APK: alarme local na hora da volta, com a tag própria', () => {
    const d = deps(true);
    expect(scheduleFeiraVolta(at, now, 'pt-BR', true, d)).toBe(true);
    expect(d.schedule).toHaveBeenCalledWith(expect.objectContaining({ id: FEIRA_VOLTA_TAG, scheduledTime: hhmmOf(at) }));
    expect(hhmmOf(at)).toBe('14:30');
  });
  it('web: timer até a volta, só com permissão concedida', () => {
    const d = deps(false);
    expect(scheduleFeiraVolta(at, now, 'en-US', true, d)).toBe(true);
    expect(d.setTimer).toHaveBeenCalledWith(expect.any(Function), 30 * 60_000);
    const sem = deps(false, false);
    expect(scheduleFeiraVolta(at, now, 'en-US', true, sem)).toBe(false);
    expect(sem.setTimer).not.toHaveBeenCalled();
    cancelFeiraVolta(d);
  });
  it('interruptor desligado ou volta no passado: nada agendado', () => {
    const d = deps(true);
    expect(scheduleFeiraVolta(at, now, 'pt-BR', false, d)).toBe(false);
    expect(scheduleFeiraVolta(now - 1, now, 'pt-BR', true, d)).toBe(false);
    expect(d.schedule).not.toHaveBeenCalled();
  });
  it('cancelar tira o alarme nativo', () => {
    const d = deps(true);
    cancelFeiraVolta(d);
    expect(d.cancel).toHaveBeenCalledWith({ id: FEIRA_VOLTA_TAG });
  });
});
