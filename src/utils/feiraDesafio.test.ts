// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { feiraDesafioStatus, sanitizeFeiraDesafio, recordFeiraDesafio, markFeiraDesafioDone, readFeiraDesafio } from './feiraDesafio';

describe('feiraDesafio — o inimigo só vale no dia em que o Soulmon voltou', () => {
  beforeEach(() => { try { localStorage.clear(); } catch { /* sem storage */ } });
  it('sem registro: nada', () => {
    expect(feiraDesafioStatus(null, '2026-11-04')).toBe('none');
  });
  it('mesmo dia, sem lutar: aberto; lutou: feito', () => {
    expect(feiraDesafioStatus({ day: '2026-11-04', k: 3, done: false }, '2026-11-04')).toBe('open');
    expect(feiraDesafioStatus({ day: '2026-11-04', k: 3, done: true }, '2026-11-04')).toBe('done');
  });
  it('outro dia sem lutar: escapou; outro dia depois de lutar: nada pendente', () => {
    expect(feiraDesafioStatus({ day: '2026-11-03', k: 3, done: false }, '2026-11-04')).toBe('escaped');
    expect(feiraDesafioStatus({ day: '2026-11-03', k: 3, done: true }, '2026-11-04')).toBe('none');
  });
  it('lixo vira "sem registro"', () => {
    for (const bad of [null, 1, 'x', {}, { day: '' }, { day: 5 }]) expect(sanitizeFeiraDesafio(bad)).toBeNull();
    expect(sanitizeFeiraDesafio({ day: '2026-11-04', k: 2.7 })).toEqual({ day: '2026-11-04', k: 2, done: false });
  });
  it('gravar a volta e marcar a luta (aparelho, fora do save)', () => {
    recordFeiraDesafio('2026-11-04', 7);
    expect(readFeiraDesafio()).toEqual({ day: '2026-11-04', k: 7, done: false });
    markFeiraDesafioDone();
    expect(feiraDesafioStatus(readFeiraDesafio(), '2026-11-04')).toBe('done');
    expect(feiraDesafioStatus(readFeiraDesafio(), '2026-11-05')).toBe('none');
  });
});
