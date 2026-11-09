// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  timeBand, timeItemIndex, setActive, flushUsageDays, clearUsageTime, trackMinigame, noteMinigameOutcome, resetUsageTimeForTest,
  TIME_SCREENS, TIME_FEATURES, TIME_MINIGAMES, TIME_BAND_EDGES, TIME_BAND_MID,
} from './usageTime';
import { pendingTelemetry, resetTelemetryForTest, setTelemetryEnabled, EVENT_SCHEMA } from './telemetry';
// @ts-expect-error módulo JS sem declaração de tipos
import * as reg from '../../functions/api/_usageRegistry.js';
// @ts-expect-error módulo JS sem declaração de tipos
import { applyAggregate, sanitizeBatch } from '../../functions/api/metrics.js';

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-09T12:00:00')); resetTelemetryForTest(); resetUsageTimeForTest(); });
afterEach(() => { vi.useRealTimers(); });

describe('faixas de tempo', () => {
  it('limites das 12 faixas', () => {
    expect([0, 4.9, 5, 9, 10, 29, 30, 59, 60, 119, 120, 2399, 2400, 99999].map(timeBand)).toEqual([0, 0, 1, 1, 2, 3, 4, 4, 5, 5, 6, 10, 11, 11]);
    expect(timeBand(NaN)).toBe(0);
    expect(TIME_BAND_MID.length).toBe(TIME_BAND_EDGES.length + 1);
  });
});

describe('registros: cliente = servidor', () => {
  it('mesmos nomes na mesma ordem e mesmas faixas', () => {
    expect([...TIME_SCREENS]).toEqual(reg.TIME_SCREENS);
    expect([...TIME_FEATURES]).toEqual(reg.TIME_FEATURES);
    expect([...TIME_MINIGAMES]).toEqual(reg.TIME_MINIGAMES);
    expect([...TIME_BAND_EDGES]).toEqual(reg.TIME_BAND_EDGES);
    expect([...TIME_BAND_MID]).toEqual(reg.TIME_BAND_MID);
  });
  it('cabem nos tetos do esquema', () => {
    expect(TIME_SCREENS.length).toBeLessThanOrEqual(EVENT_SCHEMA.time_spent!.item.max + 1);
    expect(TIME_FEATURES.length).toBeLessThanOrEqual(EVENT_SCHEMA.time_spent!.item.max + 1);
    expect(TIME_MINIGAMES.length).toBeLessThanOrEqual(EVENT_SCHEMA.minigame_start!.item.max + 1);
  });
});

describe('acumulador do dia', () => {
  it('soma o tempo, só manda dias FECHADOS e uma vez por par', () => {
    setActive('screen', 'home');
    vi.advanceTimersByTime(45_000);
    setActive('screen', 'map');
    vi.advanceTimersByTime(8_000);
    setActive('screen', null);
    expect(flushUsageDays('2026-11-09')).toBe(0); // hoje ainda não fechou
    expect(flushUsageDays('2026-11-10')).toBe(2);
    const ev = pendingTelemetry().filter(e => e.e === 'time_spent');
    expect(ev.map(e => e.p)).toEqual([
      { kind: 0, item: timeItemIndex('screen', 'home'), band: 4 },
      { kind: 0, item: timeItemIndex('screen', 'map'), band: 1 },
    ]);
    expect(ev.every(e => e.d === '2026-11-09')).toBe(true);
    expect(flushUsageDays('2026-11-10')).toBe(0); // já foi
  });
  it('nome fora do registro não gera nada; mesmo nome é idempotente', () => {
    setActive('feature', 'nao.existe');
    vi.advanceTimersByTime(30_000);
    setActive('feature', null);
    expect(flushUsageDays('2026-11-10')).toBe(0);
    setActive('feature', 'jogos.salao');
    setActive('feature', 'jogos.salao');
    vi.advanceTimersByTime(20_000);
    setActive('feature', null);
    expect(flushUsageDays('2026-11-10')).toBe(1);
  });
  it('opt-out apaga o acumulado e para de contar', () => {
    setActive('screen', 'home');
    vi.advanceTimersByTime(30_000);
    setActive('screen', null);
    setTelemetryEnabled(false);
    expect(flushUsageDays('2026-11-10')).toBe(0);
    setActive('screen', 'map');
    vi.advanceTimersByTime(30_000);
    setActive('screen', null);
    expect(flushUsageDays('2026-11-10')).toBe(0);
    clearUsageTime();
  });
});

describe('minigame', () => {
  it('start na entrada, end com resultado e faixa, e o 2º end é ignorado', () => {
    const end = trackMinigame('match3');
    expect(pendingTelemetry().map(e => ({ e: e.e, p: e.p }))).toEqual([{ e: 'minigame_start', p: { item: 3 } }]);
    vi.advanceTimersByTime(4_000); // abaixo do debounce de envio (5 s): a fila ainda guarda o start
    const fim = end;
    vi.setSystemTime(Date.now() + 61_000);
    fim(0);
    fim(1);
    const ev = pendingTelemetry().map(e => ({ e: e.e, p: e.p }));
    expect(ev[ev.length - 1]).toEqual({ e: 'minigame_end', p: { item: 3, outcome: 0, band: 5 } });
    expect(ev.filter(e => e.e === 'minigame_end').length).toBe(1);
    expect(trackMinigame('nope')).toBeTypeOf('function');
  });
});

describe('resultado da partida', () => {
  it('a tela de resultado informa o desfecho e o end() o usa; sem informe vira "saiu"', () => {
    const end = trackMinigame('dino');
    noteMinigameOutcome(1);
    end();
    const fim = pendingTelemetry().filter(e => e.e === 'minigame_end');
    expect(fim[0].p).toMatchObject({ item: 1, outcome: 1 });
    const end2 = trackMinigame('dino');
    end2();
    expect(pendingTelemetry().filter(e => e.e === 'minigame_end')[1].p).toMatchObject({ outcome: 2 });
    noteMinigameOutcome(0); // sem partida em andamento: ignorado
    const end3 = trackMinigame('dino');
    end3();
    expect(pendingTelemetry().filter(e => e.e === 'minigame_end')[2].p).toMatchObject({ outcome: 2 });
  });
});

describe('servidor: agregação dos eventos de tempo', () => {
  it('time_spent / minigame / tarefas / day_close / session_end viram contadores', () => {
    const agg = applyAggregate({}, [
      { e: 'time_spent', d: '2026-11-09', p: { kind: 0, item: 0, band: 4 } },
      { e: 'time_spent', d: '2026-11-09', p: { kind: 0, item: 0, band: 5 } },
      { e: 'time_spent', d: '2026-11-09', p: { kind: 2, item: 3, band: 2 } },
      { e: 'minigame_start', d: '2026-11-09', p: { item: 3 } },
      { e: 'minigame_end', d: '2026-11-09', p: { item: 3, outcome: 0, band: 5 } },
      { e: 'task_done', d: '2026-11-09', p: { kind: 0 } },
      { e: 'task_skipped', d: '2026-11-09', p: { kind: 1 } },
      { e: 'day_close', d: '2026-11-09', p: { planned: 4, done: 3 } },
      { e: 'day_close', d: '2026-11-09', p: { planned: 2, done: 2 } },
      { e: 'day_close', d: '2026-11-09', p: { planned: 0, done: 0 } },
      { e: 'session_end', d: '2026-11-09', p: { band: 6, build: 130 } },
    ]) as Record<string, number>;
    expect(agg).toMatchObject({
      'time.screen.home.users': 2, 'time.screen.home.band_4': 1, 'time.screen.home.band_5': 1, 'time.screen.home.sec_est': 135,
      'time.minigame.match3.users': 1,
      'minigame.match3.start': 1, 'minigame.match3.end_0': 1, 'minigame.match3.band_5': 1,
      'task_done.task': 1, 'task_skipped.habit': 1,
      tasks_planned_sum: 6, tasks_done_sum: 5, completion_bucket_7: 1, completion_bucket_10: 1,
      'session.band_6': 1, 'session.build_130': 1,
    });
    expect(agg.completion_bucket_0).toBeUndefined(); // dia sem nada planejado não entra
  });
  it('o esquema recusa índice/faixa fora do teto e prop desconhecida', () => {
    const lote = (events: unknown[]) => sanitizeBatch({ v: 1, id: 'a'.repeat(32), events }, '2026-11-09') as { ok: boolean; events: unknown[] };
    const ok = lote([{ e: 'time_spent', d: '2026-11-09', p: { kind: 0, item: 1, band: 3 } }]);
    expect(ok.events.length).toBe(1);
    expect(lote([{ e: 'time_spent', d: '2026-11-09', p: { kind: 0, item: 1, band: 99 } }]).events.length).toBe(0);
    expect(lote([{ e: 'time_spent', d: '2026-11-09', p: { kind: 0, item: 1, band: 3, name: 'x' } }]).events.length).toBe(0);
  });
});
