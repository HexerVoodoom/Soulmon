// @vitest-environment jsdom
/**
 * 🧬 O gauge de evolução na página de Evolução (11/10/2026): barra com os
 * números do gauge, prévia de hoje, "mais N passos" sem cobrança, e o que
 * desbloqueia. PT e EN.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { screen, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { EvolutionPath } from './EvolutionPath';
import type { CreatureStage } from '../utils/oracle';

afterEach(() => cleanup());

const stage = (over: Partial<CreatureStage>): CreatureStage => ({
  stage: 'rookie', stageName: { pt: 'Rookie', en: 'Rookie' }, name: 'Fagul',
  description: { pt: 'x', en: 'x' }, imagePrompt: 'p', imagePromptFallback: 'pf', ...over,
} as CreatureStage);

const base = {
  currentStageId: 'rookie', currentBranch: 'harmony' as const,
  powerPoints: 0, harmonyPoints: 3, benevolencePoints: 0,
  evolutionPoints: 12, todayGauge: 3, gaugeGoal: 30,
  stages: [stage({})], unlockedEvolutions: ['rookie'],
};

describe('EvolutionPath — gauge', () => {
  it('EN: barra com pontos/meta, prévia de hoje e frase sem cobrança', () => {
    renderWithCss(<EvolutionPath {...base} language="en-US" />);
    const bar = screen.getByRole('progressbar', { name: 'Soul Fragments gathered' });
    expect(bar.getAttribute('aria-valuemax')).toBe('30');
    expect(bar.getAttribute('aria-valuenow')).toBe('12');
    expect(document.querySelector('[data-evo-gauge-count]')?.textContent).toBe('12 / 30 · +3 from today join tomorrow');
    expect(document.querySelector('[data-evo-meter-today]')).toBeTruthy();
    expect(screen.getByText('You have gathered 12 soul fragments on the way to the next form.')).toBeTruthy();
    expect(document.querySelector('[data-evo-gauge-unlock]')?.textContent).toMatch(/Soul Fragments.*ever goes back/);
  });

  it('PT: descreve o que já se juntou (sem "faltam") e o que desbloqueia', () => {
    renderWithCss(<EvolutionPath {...base} language="pt-BR" />);
    expect(screen.getByText('Você já juntou 12 fragmentos de alma a caminho da próxima forma.')).toBeTruthy();
    expect(document.querySelector('[data-evo-gauge-unlock]')?.textContent).toMatch(/nada aqui volta para trás/);
  });

  it('cheio: não mostra "faltam", mostra o gesto', () => {
    renderWithCss(<EvolutionPath {...base} evolutionPoints={30} language="en-US" onEvolveRequest={() => {}} />);
    expect(screen.getByText(/Tap your Soulmon to evolve/)).toBeTruthy();
    expect(document.querySelector('[data-soul-fragment-icon]')).toBeTruthy();
    expect(document.querySelector('[data-evo-gauge-unlock]')).toBeNull();
  });
});
