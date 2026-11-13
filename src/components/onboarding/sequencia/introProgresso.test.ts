// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { STORAGE_KEYS } from '../../../utils/storageKeys';
import { gravarProgresso, lerProgresso, limparProgresso } from './introProgresso';

beforeEach(() => localStorage.clear());

describe('progresso local da intro', () => {
  it('sem nada guardado começa na cena 1', () => {
    expect(lerProgresso()).toEqual({ cena: 1, quadro: 0 });
  });
  it('grava e lê {cena, quadro, tarefaId, alimentou}', () => {
    gravarProgresso({ cena: 4, quadro: 2, tarefaId: 'tutorial-9', alimentou: true });
    expect(lerProgresso()).toEqual({ cena: 4, quadro: 2, tarefaId: 'tutorial-9', alimentou: true });
  });
  it('JSON quebrado ou fora do mapa volta ao começo, sem lançar', () => {
    localStorage.setItem(STORAGE_KEYS.INTRO_NARRATIVA_PROGRESSO, '{nao json');
    expect(lerProgresso()).toEqual({ cena: 1, quadro: 0 });
    localStorage.setItem(STORAGE_KEYS.INTRO_NARRATIVA_PROGRESSO, JSON.stringify({ cena: 77, quadro: 1 }));
    expect(lerProgresso()).toEqual({ cena: 1, quadro: 0 });
  });
  it('limpar apaga só a chave da intro', () => {
    localStorage.setItem('outra', '1');
    gravarProgresso({ cena: 3, quadro: 0 });
    limparProgresso();
    expect(localStorage.getItem(STORAGE_KEYS.INTRO_NARRATIVA_PROGRESSO)).toBeNull();
    expect(localStorage.getItem('outra')).toBe('1');
  });
});
