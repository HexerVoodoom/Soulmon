// @vitest-environment jsdom
/**
 * 🧬 O gauge de evolução na página de Evolução (11/10/2026): barra com os
 * números do gauge, prévia de hoje, "mais N passos" sem cobrança, e o que
 * desbloqueia. PT e EN.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { screen, cleanup, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { EvolutionPath } from './EvolutionPath';
import type { CreatureStage } from '../utils/oracle';

/** 13/11/2026: o termo "fragmento de alma" sai destacado (`SoulFragmentTerm`), então a frase se divide em nós: casa pelo texto inteiro. */
const textoInteiro = (t: string) => (_: string, el: Element | null) => !!el && el.textContent === t && Array.from(el.children).every(c => c.textContent !== t);


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
    expect(screen.queryByText(textoInteiro('You have gathered 12 soul fragments on the way to the next form.'))).toBeNull();
    expect(document.querySelector('[data-evo-gauge-unlock]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'About Soul Fragments' }));
    expect(document.querySelector('[data-evo-gauge-unlock]')?.textContent).toMatch(/Soul Fragments.*nothing here goes back/);
  });

  it('PT: sem a frase "Você já juntou"; o texto das frações vive atrás do "i"', () => {
    renderWithCss(<EvolutionPath {...base} language="pt-BR" />);
    expect(screen.queryByText(textoInteiro('Você já juntou 12 fragmentos de alma a caminho da próxima forma.'))).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Sobre os Fragmentos de Alma' }));
    expect(document.querySelector('[data-evo-gauge-unlock]')?.textContent).toMatch(/nada aqui volta atrás/);
  });

  it('cheio: não mostra "faltam", mostra o gesto', () => {
    renderWithCss(<EvolutionPath {...base} evolutionPoints={30} language="en-US" onEvolveRequest={() => {}} />);
    expect(screen.getByText(/Tap your Soulmon to evolve/)).toBeTruthy();
    expect(document.querySelector('[data-soul-fragment-icon]')).toBeTruthy();
    expect(document.querySelector('[data-evo-gauge-unlock]')).toBeNull();
  });

  it('cadeado: só ícone ao lado do nome, aria-pressed; texto só quando trancado; sem texto fixo', () => {
    const { rerender } = renderWithCss(<EvolutionPath {...base} language="pt-BR" onToggleEvolutionLock={() => {}} />);
    const lock = document.querySelector('[data-lock-button]') as HTMLElement;
    expect(lock.querySelector('[data-lock-art]')?.getAttribute('data-lock-art')).toBe('aberto');
    expect(lock.querySelector('img')?.getAttribute('alt')).toBe('');
    expect(lock.getAttribute('aria-pressed')).toBe('false');
    expect(lock.getAttribute('aria-label')).toBe('Segurar evolução');
    expect(lock.closest('.sm2-evo-namerow')).toBeTruthy();
    expect(document.querySelector('[data-evo-lock-status]')?.textContent).toBe('');
    rerender(<EvolutionPath {...base} language="pt-BR" evolutionLocked onToggleEvolutionLock={() => {}} />);
    const l2 = document.querySelector('[data-lock-button]') as HTMLElement;
    expect(l2.getAttribute('aria-pressed')).toBe('true');
    expect(l2.querySelector('[data-lock-art]')?.getAttribute('data-lock-art')).toBe('fechado');
    const placa = document.querySelector('[data-onhold-plate]') as HTMLElement;
    expect(placa.closest('.sm2-evo-namerow')).toBeTruthy();
    expect(placa.className).toContain('sm2-evo-segurada');
    expect(l2.getAttribute('title')).toMatch(/não protege os corações/);
    expect(document.querySelector('[data-evo-lock-status]')?.getAttribute('role')).toBe('status');
    expect(document.querySelector('[data-evo-lock-status]')?.textContent).toMatch(/não protege os corações/);
  });

  it('cabeçalho mostra o estágio por extenso sob o nome; os nós não escrevem estágio nem BLOQUEADA/PREVISTA', () => {
    renderWithCss(<EvolutionPath {...base} language="en-US" />);
    expect(document.querySelector('[data-evo-stage-name]')?.textContent).toBe('Rookie');
    expect(screen.queryByText('LOCKED')).toBeNull();
    expect(screen.queryByText('FORECAST')).toBeNull();
  });
});

