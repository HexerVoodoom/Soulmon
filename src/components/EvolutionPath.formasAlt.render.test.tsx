// @vitest-environment jsdom
/** Formas alternativas (05/11/2026), modal do nó (09/11/2026): anterior → "Degenerar para…"; atual/mesmo nível → lista para equipar. */
import { describe, it, expect } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
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
  it('a forma atual abre a lista para equipar, com a dica e 3 ocultas', () => {
    renderWithCss(<EvolutionPath {...props} />);
    fireEvent.click(screen.getByTestId('sm-no-ultimate-harmony').querySelector('button[data-soul-node]') as HTMLElement);
    expect(screen.getByTestId('sm-formas-alt')).toBeTruthy();
    expect(screen.getByTestId('sm-formas-alt-dica')).toBeTruthy();
    expect(screen.getAllByTestId('sm-forma-alt-oculta')).toHaveLength(3);
  });
  it('a forma anterior abre "Degenerar para…" com as opções já liberadas, sem dica', () => {
    renderWithCss(<EvolutionPath {...props} formasAlt={{ 'champion-harmony': ['fogo', 'agua'] }} />);
    fireEvent.click(screen.getByTestId('sm-no-champion-harmony').querySelector('button[data-soul-node]') as HTMLElement);
    expect(screen.getByTestId('sm-formas-alt').textContent).toContain('Degenerar para…');
    expect(screen.queryByTestId('sm-formas-alt-dica')).toBeNull();
    expect(screen.getByTestId('sm-forma-alt-agua')).toBeTruthy();
    expect(screen.getAllByTestId('sm-forma-alt-oculta')).toHaveLength(3);
  });
  it('degenerar para uma opção de elemento: confirma duas vezes, degenera e equipa o elemento escolhido', () => {
    const chamadas: string[] = [];
    renderWithCss(<EvolutionPath {...props} formasAlt={{ 'champion-harmony': ['fogo', 'agua'] }}
      onDegenerate={(id) => chamadas.push(`deg:${id}`)} onEquipFormaAlt={(id, el) => chamadas.push(`eq:${id}:${el}`)} />);
    fireEvent.click(screen.getByTestId('sm-no-champion-harmony').querySelector('button[data-soul-node]') as HTMLElement);
    fireEvent.click(within(screen.getByTestId('sm-forma-alt-agua')).getByRole('button', { name: 'Degenerar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(chamadas).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: 'Sim, degenerar' }));
    expect(chamadas).toEqual(['deg:champion-harmony', 'eq:champion-harmony:agua']);
  });
});
