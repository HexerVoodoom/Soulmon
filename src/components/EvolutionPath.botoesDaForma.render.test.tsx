// @vitest-environment jsdom
/** Tocar uma forma liberada de nível abaixo abre o modal "Degenerar para…" (09/11/2026); a degeneração segue com dupla confirmação. */
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
  it('tocar a forma de nível abaixo abre o modal "Degenerar para…"; nada de botão solto na árvore', () => {
    renderWithCss(<EvolutionPath {...props} />);
    expect(screen.queryByText('Degenerar para…')).toBeNull();
    fireEvent.click(screen.getByTestId('sm-no-champion-harmony').querySelector('button[data-soul-node]') as HTMLElement);
    expect(screen.getByTestId('sm-formas-alt').textContent).toContain('Degenerar para…');
    expect(screen.getByTestId('sm-formas-alt')).toBeTruthy();
  });

  it('09/11/2026 (dono): dá para degenerar até o rookie', () => {
    const chamado: string[] = [];
    renderWithCss(<EvolutionPath {...props} onDegenerate={(id) => chamado.push(id)} />);
    const no = screen.getByTestId('sm-no-rookie').querySelector('button[data-soul-node]') as HTMLElement;
    fireEvent.click(no);
    fireEvent.click(screen.getByRole('button', { name: 'Degenerar' }));
    fireEvent.click(screen.getAllByRole('button').find(b => /confirmar/i.test(b.textContent ?? ''))!);
    fireEvent.click(screen.getAllByRole('button').find(b => /confirmar|degenerar/i.test(b.textContent ?? '') && b.textContent !== 'Degenerar')!);
    expect(chamado).toEqual(['rookie']);
  });
});
