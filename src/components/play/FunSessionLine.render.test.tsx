// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { SalaoSheet } from './PlaySheets';
import type { FunSessionStatus } from '../../utils/funSession';

const st = (o: Partial<FunSessionStatus>): (() => FunSessionStatus) => () => ({ active: false, roundsLeft: 0, msLeft: 0, costsEnergy: true, canPlay: true, ...o });
const linha = (status: () => FunSessionStatus, language: 'pt-BR' | 'en-US' = 'pt-BR') =>
  render(<SalaoSheet language={language} onStart={() => {}} funStatus={status} />).container.querySelector('[data-fun-session]');

afterEach(cleanup);

describe('Salão: a linha da sessão de diversão', () => {
  it('sem sessão mostra o custo', () => {
    expect(linha(st({}))?.textContent).toBe('1 energia = 3 rodadas (30 min)');
    cleanup();
    expect(linha(st({}), 'en-US')?.textContent).toBe('1 energy = 3 rounds (30 min)');
  });
  it('sessão aberta mostra rodadas e relógio', () => {
    expect(linha(st({ active: true, roundsLeft: 2, msLeft: 125_000, costsEnergy: false }))?.textContent).toBe('Rodadas restantes: 2 · expira em 02:05');
  });
  it('sem energia aponta para outras atividades, em PT e EN', () => {
    expect(linha(st({ canPlay: false }))?.textContent).toContain('Ateliê da Mente');
    cleanup();
    expect(linha(st({ canPlay: false }), 'en-US')?.textContent).toContain('Mind Atelier');
  });
});
