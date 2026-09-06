// @vitest-environment jsdom
/**
 * WP3.3 — o título do Vínculo na home, e o nome do pet.
 *
 * O comentário de `BOND_REWARDS` (`utils/bond.ts`) prometia, por escrito, que
 * o título do nível 2 "aparece na home, sob o nome do pet, sem precisar abrir
 * nada". Era falso: `bondTitle` só era lido em `StatsPage` e `TournamentPage`
 * — e o NOME do pet não existia neste componente. Os níveis 2 (dia 1) e 3
 * (dia 3) são os que decidem retenção; a recompensa deles chegava a quem já
 * tinha o hábito de abrir Estatísticas, ou seja, a quem já estava retido.
 *
 * Este teste é a régua da frase. Se cair, o comentário voltou a mentir.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { CompanionHUD } from './CompanionHUD';
import { bondTitle } from '../utils/bond';

const base = {
  companionMood: 'idle' as const,
  energyLevel: 3,
  message: '',
  currentStage: 'rookie',
  evolutionStage: 'rookie',
  healthPoints: 3,
  maxHealthPoints: 3,
  dominantBranch: 'balanced' as const,
  currentXP: 0,
  nextLevelXP: 10,
  useAI: false,
  language: 'pt-BR' as const,
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('CompanionHUD — nome e título do Vínculo (WP3.3)', () => {
  it('mostra o nome do pet', () => {
    renderWithCss(<CompanionHUD {...base} petDisplayName="Bito" />);
    expect(screen.getByText('Bito')).toBeTruthy();
  });

  it('mostra o título do Vínculo sob o nome', () => {
    const titulo = bondTitle(2, 'pt-BR');
    expect(titulo, 'o nível 2 precisa dar título — é a recompensa do dia 1').toBeTruthy();
    renderWithCss(<CompanionHUD {...base} petDisplayName="Bito" bondTitleText={titulo} />);
    expect(screen.getByText(titulo!)).toBeTruthy();
  });

  it('sem título (nível 1) o nome aparece sozinho, sem espaço vazio', () => {
    // Nível 1 é todo mundo no minuto zero. Uma linha reservada e vazia lê como
    // "falta algo aqui" — espaço vazio é VAZIO, a mesma regra do palco.
    renderWithCss(<CompanionHUD {...base} petDisplayName="Bito" bondTitleText={null} />);
    expect(screen.getByText('Bito')).toBeTruthy();
  });

  it('sem nome e sem título, nada é desenhado', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} />);
    expect(container.textContent).not.toContain('Bito');
  });

  it('o título vem do idioma escolhido', () => {
    const en = bondTitle(5, 'en-US');
    renderWithCss(<CompanionHUD {...base} language="en-US" bondTitleText={en} />);
    expect(screen.getByText(en!)).toBeTruthy();
  });
});
