// @vitest-environment jsdom
// QA3 REGRESSAO: atividade concluída cuja `category` não existe no catálogo (save velho/corrompido — a hidratação só
// confere `id`) derrubava o hook com TypeError (`attrs.power` de undefined) e, com ele, a Home inteira.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProgressTracking } from './useProgressTracking';

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-08-12T12:00:00')); });
afterEach(() => { vi.useRealTimers(); });

describe('useProgressTracking com categoria desconhecida', () => {
  it('não lança e não soma atributo nenhum para a atividade de categoria inexistente', () => {
    const state = {
      evolutionStage: 'mega-harmony',
      activities: [
        { id: 'a', category: 'Astrologia', steps: [], weekDays: [0, 1, 2, 3, 4, 5, 6], completedToday: true, lastCompletedDate: new Date().toDateString() },
        { id: 'b', category: undefined, steps: [], weekDays: [0, 1, 2, 3, 4, 5, 6], completedToday: true, lastCompletedDate: new Date().toDateString() },
      ],
      tasks: [],
      completedTasks: [],
    } as unknown as Parameters<typeof useProgressTracking>[0];
    const { result } = renderHook(() => useProgressTracking(state));
    expect(result.current.todayAttributes).toEqual({ power: 0, harmony: 0, benevolence: 0 });
  });
});
