import { describe, it, expect } from 'vitest';
import { createRestState, recordNight, autoSleepStart, type RestWindow } from './restWindow';
import { hasPendingNightmare, createNightmareState, nightmaresFor } from './nightmares';

const W: RestWindow = { start: '23:00', end: '07:00' };
const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m, 20);

describe('sono automático também arma o pesadelo (mesma regra do manual)', () => {
  it('abrir o app no meio da janela: a noite começa no início da janela', () => {
    const s = autoSleepStart(W, at(11, 3, 10));
    expect(s.getHours()).toBe(23);
    expect(s.getMinutes()).toBe(0);
    expect(s.getDate()).toBe(10);
  });
  it('fora da janela devolve o instante dado', () => {
    const t = at(11, 12, 0);
    expect(autoSleepStart(W, t).getTime()).toBe(t.getTime());
  });
  it('auto-sleep percebido às 03:10 e acordar às 07:05 rende pesadelo; com a hora de abrir não rendia', () => {
    const wake = at(11, 7, 5);
    const rest = recordNight({ ...createRestState(W) }, autoSleepStart(W, at(11, 3, 10)), wake);
    expect(nightmaresFor(rest, wake).count).toBe(1);
    expect(hasPendingNightmare(createNightmareState(), rest, wake)).toBe(true);
    const antigo = recordNight({ ...createRestState(W) }, at(11, 3, 10), wake);
    expect(nightmaresFor(antigo, wake).count).toBe(0);
  });
  it('mesmo resultado do sono manual deitado às 23:00 (sem rolagem dupla: 1 por noite)', () => {
    const wake = at(11, 7, 5);
    const manual = recordNight(createRestState(W), at(10, 23, 0), wake);
    const auto = recordNight(createRestState(W), autoSleepStart(W, at(11, 1, 0)), wake);
    expect(nightmaresFor(auto, wake)).toEqual(nightmaresFor(manual, wake));
  });
});
