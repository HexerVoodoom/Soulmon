import { describe, it, expect } from 'vitest';
import { homeMissions, staleTaskOfDay } from './homeMissions';

const now = new Date(2026, 9, 5, 12);
const velha = (id: string, dias: number) => ({ id, name: id, createdAt: new Date(2026, 9, 5 - dias).toISOString() });

describe('homeMissions', () => {
  it('diárias primeiro (passeio, meta, uma parada) e semanais à parte', () => {
    const r = homeMissions({
      passeio: 'available', meta: { done: 1, goal: 3 },
      tasks: [velha('a', 10), velha('b', 30)],
      weekly: [{ mission: { id: 'checkins', target: 3, descPt: 'x', descEn: 'x' }, count: 5, done: true, claimed: false }],
      now,
    });
    expect(r.daily.map(m => m.kind)).toEqual(['passeio', 'meta', 'parada']);
    expect(r.weekly[0].count).toBe(3);
  });

  it('no máximo UMA tarefa parada por dia, a mais antiga', () => {
    const r = homeMissions({ passeio: null, meta: { done: 0, goal: 0 }, tasks: [velha('a', 10), velha('b', 30), velha('c', 8)], weekly: [], now });
    expect(r.daily.filter(m => m.kind === 'parada')).toHaveLength(1);
    expect(staleTaskOfDay([velha('a', 10), velha('b', 30)], now)?.id).toBe('b');
  });

  it('missão de parada não depende de quanto tempo atrasou (sem recompensa crescente)', () => {
    const a = homeMissions({ passeio: null, meta: { done: 0, goal: 0 }, tasks: [velha('a', 8)], weekly: [], now }).daily[0];
    const b = homeMissions({ passeio: null, meta: { done: 0, goal: 0 }, tasks: [velha('a', 80)], weekly: [], now }).daily[0];
    expect(a).toEqual(b);
  });

  it('semanal já resgatada sai; passeio feito vira ✓', () => {
    const r = homeMissions({ passeio: null, meta: { done: 0, goal: 0 }, tasks: [], weekly: [{ mission: { id: 'x', target: 1, descPt: '', descEn: '' }, count: 1, done: true, claimed: true }], now });
    expect(r.weekly).toHaveLength(0);
    expect(r.daily[0].done).toBe(true);
  });
});
