import { describe, it, expect } from 'vitest';
import { roteiro, sessaoMs, faseEm, ciclosPara, premioDevido, chamaVisivel, CHAMA_BITS, CHAMA_DURACOES_MIN, diaLocal } from './chama';

describe('Chama: máquina de fases', () => {
  it('as durações oferecidas são 3/5/10 min e a sessão bate exatamente', () => {
    expect([...CHAMA_DURACOES_MIN]).toEqual([3, 5, 10]);
    for (const m of CHAMA_DURACOES_MIN) expect(sessaoMs(m)).toBe(m * 60_000);
  });
  it('ciclos de olhar 60 s + fechar 40 s cabem na duração', () => {
    expect(ciclosPara(3)).toBe(1);
    expect(ciclosPara(5)).toBe(2);
    expect(ciclosPara(10)).toBe(5);
    const r = roteiro(5);
    expect(r.map(s => s.fase)).toEqual(['chegada', 'olhar', 'fechar', 'olhar', 'fechar', 'repouso', 'fecho']);
    expect(r.find(s => s.fase === 'olhar')!.duracaoMs).toBe(60_000);
    expect(r.find(s => s.fase === 'fechar')!.duracaoMs).toBe(40_000);
    expect(r[0].duracaoMs).toBe(20_000);
    expect(r[r.length - 1].duracaoMs).toBe(10_000);
  });
  it('faseEm percorre as fases e termina em fim', () => {
    expect(faseEm(5, 0).fase).toBe('chegada');
    expect(faseEm(5, 20_000).fase).toBe('olhar');
    expect(faseEm(5, 80_000).fase).toBe('fechar');
    expect(faseEm(5, 120_000)).toMatchObject({ fase: 'olhar', ciclo: 2 });
    expect(faseEm(5, 299_999).fase).toBe('fecho');
    expect(faseEm(5, 300_000).fase).toBe('fim');
    expect(faseEm(5, -5).fase).toBe('chegada');
  });
  it('a chama só aparece ao olhar/chegar, nunca no modo olhos fechados', () => {
    expect(chamaVisivel('olhar', false)).toBe(true);
    expect(chamaVisivel('fechar', false)).toBe(false);
    expect(chamaVisivel('olhar', true)).toBe(false);
  });
});

describe('Chama: prêmio 1×/dia', () => {
  it('paga fixo só ao concluir e só uma vez no dia', () => {
    expect(premioDevido(true, null, '2026-11-04')).toBe(CHAMA_BITS);
    expect(premioDevido(true, '2026-11-04', '2026-11-04')).toBe(0);
    expect(premioDevido(true, '2026-11-03', '2026-11-04')).toBe(CHAMA_BITS);
    expect(premioDevido(false, null, '2026-11-04')).toBe(0);
  });
  it('diaLocal formata AAAA-MM-DD', () => {
    expect(diaLocal(new Date(2026, 10, 4, 12).getTime())).toBe('2026-11-04');
  });
});
