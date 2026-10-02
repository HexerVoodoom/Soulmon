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

describe('CompanionHUD — nome e título do Vínculo saíram da faixa do pet (B1, 02/10/2026)', () => {
  it('o nome NÃO é desenhado sob o pet: mora no header da Home (HomeHud)', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} petDisplayName="Bito" />);
    expect(container.querySelector('.sm2-home-petname')).toBeNull();
  });

  it('o título do Vínculo continua existindo em utils/bond (Estatísticas), mas a Home não o desenha', () => {
    const titulo = bondTitle(2, 'pt-BR');
    expect(titulo, 'o nível 2 dá título — só não aparece mais na Home').toBeTruthy();
    const { container } = renderWithCss(<CompanionHUD {...base} petDisplayName="Bito" />);
    expect(container.textContent).not.toContain(titulo!);
    expect(container.textContent).not.toMatch(/companheiro|companion/i);
  });
});

describe('CompanionHUD — a marca da volta é OPT-IN (WP4.19)', () => {
  it('não aparece sozinha: quem decide contar é o jogador', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} redeemedMark={false} />);
    expect(container.textContent).not.toContain('Voltou inteiro');
  });

  it('aparece quando o jogador ligou', () => {
    renderWithCss(<CompanionHUD {...base} redeemedMark />);
    expect(screen.getByText('✦ Voltou inteiro')).toBeTruthy();
  });

  it('lê como prestígio, nunca como queda: não diz que o pet caiu', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} redeemedMark />);
    const texto = (container.textContent ?? '').toLowerCase();
    for (const p of ['caiu', 'degenerou', 'regrediu', 'perdeu']) {
      expect(texto, `a marca da volta virou marca de queda ("${p}")`).not.toContain(p);
    }
  });
});
