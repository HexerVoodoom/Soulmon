// @vitest-environment jsdom
/** Formas alternativas (05/11/2026): cartão com setinha; anterior → Degenerar + Formas alternativas; atual → direto na lista. */
import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { EvolutionPath } from './EvolutionPath';
import type { CreatureStage } from '../utils/oracle';

const stage = (over: Partial<CreatureStage>): CreatureStage => ({
  stage: 'rookie', stageName: { pt: 'Rookie', en: 'Rookie' }, name: 'Fangmon',
  description: { pt: 'x', en: 'x' }, imagePrompt: 'p', imagePromptFallback: 'pf', ...over,
} as CreatureStage);

const props = {
  currentStageId: 'ultimate-harmony',
  currentBranch: 'harmony' as const,
  powerPoints: 1, harmonyPoints: 30, benevolencePoints: 0,
  evolutionPoints: 2, gaugeGoal: 30,
  stages: [
    stage({}),
    stage({ stage: 'champion', branch: 'harmonia', name: 'Champ', stageName: { pt: 'Champion', en: 'Champion' } }),
    stage({ stage: 'perfeito', branch: 'harmonia', name: 'Ult', stageName: { pt: 'Ultimate', en: 'Ultimate' } }),
  ],
  unlockedEvolutions: ['rookie', 'champion-harmony', 'ultimate-harmony'],
  language: 'pt-BR' as const,
  onEquipFormaAlt: () => {},
};

describe('formas alternativas no Centro de Evolução', () => {
  it('a forma atual abre direto a lista, com a dica e 3 ocultas', () => {
    renderWithCss(<EvolutionPath {...props} />);
    expect(screen.getByTestId('sm-no-rookie').getAttribute('role')).toBeNull();
    fireEvent.click(screen.getByTestId('sm-no-ultimate-harmony'));
    expect(screen.getByTestId('sm-formas-alt')).toBeTruthy();
    expect(screen.getByTestId('sm-formas-alt-dica')).toBeTruthy();
    expect(screen.getAllByTestId('sm-forma-alt-oculta')).toHaveLength(3);
  });
  it('a forma anterior oferece Degenerar e Formas alternativas', () => {
    renderWithCss(<EvolutionPath {...props} formasAlt={{ 'champion-harmony': ['fogo', 'agua'] }} />);
    fireEvent.click(screen.getByTestId('sm-no-champion-harmony'));
    expect(screen.getByText('Degenerar')).toBeTruthy();
    fireEvent.click(screen.getByText('Formas alternativas'));
    expect(screen.queryByTestId('sm-formas-alt-dica')).toBeNull();
    expect(screen.getByTestId('sm-forma-alt-agua')).toBeTruthy();
    expect(screen.getAllByTestId('sm-forma-alt-oculta')).toHaveLength(3);
  });
});
