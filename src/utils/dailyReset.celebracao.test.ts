import { describe, it, expect } from 'vitest';
import { completeDayReached, deveCelebrarDiaCompleto } from './dailyReset';

describe('deveCelebrarDiaCompleto (R8-i): a celebração é do dia completo, uma vez por dia', () => {
  const hoje = 'Sun Oct 04 2026';

  it('celebra na transição falso → verdadeiro', () => {
    expect(deveCelebrarDiaCompleto({ antes: false, agora: true, ultimoDia: null, hoje })).toBe(true);
  });

  it('não celebra ao abrir o app com o dia já completo', () => {
    expect(deveCelebrarDiaCompleto({ antes: true, agora: true, ultimoDia: null, hoje })).toBe(false);
  });

  it('não celebra de novo no mesmo dia (completa, desfaz e completa outra vez)', () => {
    expect(deveCelebrarDiaCompleto({ antes: false, agora: true, ultimoDia: hoje, hoje })).toBe(false);
  });

  it('celebra de novo em outro dia', () => {
    expect(deveCelebrarDiaCompleto({ antes: false, agora: true, ultimoDia: 'Sat Oct 03 2026', hoje })).toBe(true);
  });

  it('não celebra enquanto o dia não está completo', () => {
    expect(deveCelebrarDiaCompleto({ antes: false, agora: false, ultimoDia: null, hoje })).toBe(false);
  });

  it('a meta de coração (parcial) NÃO basta: o gatilho segue completeDayReached (peso ≥ meta, ≥1 cadastrada, energia ≥ meta)', () => {
    const base = { registered: 5, goal: 5, done: 3, energy: 5 }; // 3 bastam p/ coração (0,6×5), não p/ o dia
    expect(completeDayReached(base)).toBe(false);
    expect(completeDayReached({ ...base, done: 5, energy: 4 })).toBe(false);
    expect(completeDayReached({ ...base, registered: 0, done: 0, goal: 0 })).toBe(false);
    expect(completeDayReached({ ...base, done: 5 })).toBe(true);
  });
});
