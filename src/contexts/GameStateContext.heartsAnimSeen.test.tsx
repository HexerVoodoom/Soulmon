// @vitest-environment jsdom
/**
 * Beta-2 (4.2): `lastDayReport.heartsAnimSeen` — a marca "a animação de quebra dos corações já foi vista".
 * Mora DENTRO do relatório (a virada grava um relatório novo e a marca some: "uma vez por dia"), então o save
 * não ganha campo de topo e o contador do fuzz2 NÃO muda. O que o carregador garante: só `true` literal vale;
 * lixo no save (string, número, objeto) nunca cala a animação nem quebra a tela.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { GameStateProvider, useGameState } from './GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';

function Espiao() {
  const { gameState } = useGameState();
  return <pre data-testid="estado">{JSON.stringify(gameState)}</pre>;
}
const montar = () => {
  render(<GameStateProvider><Espiao /></GameStateProvider>);
  return JSON.parse(screen.getByTestId('estado').textContent!);
};
const relatorio = (extra: Record<string, unknown>) => ({
  date: 'Tue Oct 13 2026', done: 3, total: 4, required: 3, heartsLost: 1, wasPerfect: false, perfectDays: 0, degenerated: false, ...extra,
});

beforeEach(() => {
  installDomGlobals();
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('lastDayReport.heartsAnimSeen no carregamento do save', () => {
  it('true sobrevive ao recarregar (a animação não repete ao reabrir)', () => {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ activities: [], tasks: [], lastDayReport: relatorio({ heartsAnimSeen: true }) }));
    expect(montar().lastDayReport.heartsAnimSeen).toBe(true);
  });

  it('ausente continua ausente (relatório novo toca a animação uma vez)', () => {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ activities: [], tasks: [], lastDayReport: relatorio({}) }));
    const s = montar();
    expect(s.lastDayReport.date).toBe('Tue Oct 13 2026');
    expect('heartsAnimSeen' in s.lastDayReport).toBe(false);
  });

  for (const [nome, lixo] of [['string', 'sim'], ['número', 1], ['objeto', {}], ['null', null], ['false', false]] as const) {
    it(`lixo (${nome}) é descartado: o save não carrega marca falsa`, () => {
      localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ activities: [], tasks: [], lastDayReport: relatorio({ heartsAnimSeen: lixo }) }));
      const s = montar();
      expect('heartsAnimSeen' in s.lastDayReport).toBe(false);
      expect(s.lastDayReport.heartsLost).toBe(1); // o resto do relatório fica intacto
    });
  }
});
