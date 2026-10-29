import { describe, it, expect } from 'vitest';
import { createRestState, recordNight, decideMissedWindowNight, type RestWindow } from './restWindow';
import { nightmaresFor } from './nightmares';

const W: RestWindow = { start: '23:00', end: '07:00' };
const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m, 20);

describe('§189 — janela sem app conta a noite', () => {
  const rest = createRestState(W);
  it('app fechado a janela inteira: conta 23:00→07:00', () => {
    const d = decideMissedWindowNight(rest, at(10, 20, 0).toISOString(), at(11, 8, 30));
    expect(d).not.toBeNull();
    expect(d!.sleptAt.getHours()).toBe(23);
    expect(d!.wokeAt.getHours()).toBe(7);
    const r = recordNight(rest, d!.sleptAt, d!.wokeAt);
    expect(r.nights).toHaveLength(1);
    expect(r.nights[0].onTime).toBe(true);
    expect(nightmaresFor(r, at(11, 8, 30)).count).toBeGreaterThanOrEqual(0);
  });
  it('sem carimbo, carimbo inválido ou app ativo na janela: não conta', () => {
    expect(decideMissedWindowNight(rest, null, at(11, 8))).toBeNull();
    expect(decideMissedWindowNight(rest, 'lixo', at(11, 8))).toBeNull();
    expect(decideMissedWindowNight(rest, at(10, 23, 30).toISOString(), at(11, 8))).toBeNull();
    expect(decideMissedWindowNight(rest, at(11, 3, 0).toISOString(), at(11, 8))).toBeNull();
  });
  it('só a janela mais recente: dias depois conta só a última noite; o dia seguinte reavalia', () => {
    const d = decideMissedWindowNight(rest, at(10, 20).toISOString(), at(13, 8))!;
    expect(d.sleptAt.getDate()).toBe(12);
  });
  it('sem dupla contagem: noite já registrada ou rodar de novo é no-op', () => {
    const d = decideMissedWindowNight(rest, at(10, 20).toISOString(), at(11, 8))!;
    const r = recordNight(rest, d.sleptAt, d.wokeAt);
    expect(decideMissedWindowNight(r, at(10, 20).toISOString(), at(11, 9))).toBeNull();
  });
  it('janela ainda em curso: não conta a de agora', () => {
    expect(decideMissedWindowNight(rest, at(10, 20).toISOString(), at(11, 3))).toBeNull();
  });
});
