// @vitest-environment jsdom
/** "Trocar forma" e "Degenerar" só aparecem ao tocar a forma; tocar fora ou outra forma troca. */
import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { EvolutionPath } from './EvolutionPath';
import type { CreatureStage } from '../utils/oracle';

const stage = (over: Partial<CreatureStage>): CreatureStage => ({
  stage: 'rookie', stageName: { pt: 'Rookie', en: 'Rookie' }, name: 'Fangmon',
  description: { pt: 'x', en: 'x' }, imagePrompt: 'p', imagePromptFallback: 'pf', ...over,
} as CreatureStage);

const stages = [
  stage({}),
  stage({ stage: 'champion', branch: 'harmonia', name: 'Champ', stageName: { pt: 'Champion', en: 'Champion' } }),
  stage({ stage: 'perfeito', branch: 'harmonia', name: 'Ult', stageName: { pt: 'Ultimate', en: 'Ultimate' } }),
];

const props = {
  currentStageId: 'ultimate-harmony',
  currentBranch: 'harmony' as const,
  powerPoints: 1, harmonyPoints: 30, benevolencePoints: 0,
  evolutionPoints: 2, gaugeGoal: 30, stages,
  unlockedEvolutions: ['rookie', 'champion-harmony', 'ultimate-harmony'],
  language: 'pt-BR' as const,
};

describe('botões por forma', () => {
  it('Degenerar só aparece ao tocar a forma anterior; tocar fora some', () => {
    renderWithCss(<EvolutionPath {...props} />);
    expect(screen.queryByText('Degenerar')).toBeNull();
    const no = screen.getByTestId('sm-no-champion-harmony').querySelector('button[data-soul-node]') as HTMLElement;
    fireEvent.click(no);
    expect(screen.getByText('Degenerar')).toBeTruthy();
    expect(no.getAttribute('aria-pressed')).toBe('true');
    fireEvent.pointerDown(document.body);
    expect(screen.queryByText('Degenerar')).toBeNull();
  });
});
