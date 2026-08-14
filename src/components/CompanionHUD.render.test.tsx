// @vitest-environment jsdom
/**
 * Teste de render do `CompanionHUD` — a tela que o usuário abre.
 *
 * Duas coisas nunca tinham sido verificadas por nada: (a) que o botão
 * "Evoluir" só existe quando pode evoluir (o relatório da UI registrou este
 * item como "sem verificação visual" em DUAS rodadas seguidas, porque depende
 * de `canEvolve`, que ninguém conseguia semear na tela); (b) que a rede caída
 * não emudece o pet — a fala local vem primeiro e a IA só melhora.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { CompanionHUD } from './CompanionHUD';

const base = {
  companionMood: 'idle' as const,
  energyLevel: 3,
  message: 'Oi!',
  currentStage: 'rookie',
  evolutionStage: 'rookie',
  healthPoints: 3,
  maxHealthPoints: 3,
  dominantBranch: 'balanced' as const,
  currentXP: 0,
  nextLevelXP: 10,
  digivolutionSegments: 1,
  digivolutionSegmentsNeeded: 3,
  useAI: false,
  language: 'pt-BR' as const,
};

beforeEach(() => {
  // O idle chama /api/chat a cada 3min. Nenhum teste de render deve tocar a
  // rede; se tocar, quero um erro alto e não uma requisição real pendurada.
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('CompanionHUD', () => {
  it('monta sem tocar a rede (o idle tem guard; nada dispara no mount)', () => {
    renderWithCss(<CompanionHUD {...base} />);
    expect(screen.getByAltText('rookie')).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('REDE CAÍDA NÃO EMUDECE O PET: tocar nele fala local, com a IA ligada e o fetch falhando', () => {
    // O relatório da rodada 1 AFIRMOU isso lendo o código ("a fala local vem
    // primeiro e a IA só melhora"). Aqui é medido: `useAI` ligado, `fetch`
    // rejeitando, e mesmo assim o balão aparece com texto em PT.
    renderWithCss(<CompanionHUD {...base} useAI energyPoints={4} maxEnergyPoints={4} />);
    fireEvent.click(screen.getByAltText('rookie'));
    const bubble = screen.getByText(
      /Cheio de energia!|Pronto para tudo!|Totalmente carregado!/,
    );
    expect(bubble).toBeTruthy();
  });

  it('a fala local sai em EN para quem escolheu EN (nada de PT vazando)', () => {
    renderWithCss(
      <CompanionHUD {...base} language="en-US" useAI energyPoints={4} maxEnergyPoints={4} />,
    );
    fireEvent.click(screen.getByAltText('rookie'));
    expect(screen.getByText(/Full power!|Ready for anything!|Fully charged!/)).toBeTruthy();
  });

  it('o botão Evoluir NÃO existe quando `canEvolve` é falso', () => {
    renderWithCss(<CompanionHUD {...base} />);
    expect(screen.queryByRole('button', { name: 'Evoluir' })).toBeNull();
  });

  it('o botão Evoluir aparece quando `canEvolve` e dispara o pedido', () => {
    const onEvolveRequest = vi.fn();
    renderWithCss(<CompanionHUD {...base} canEvolve onEvolveRequest={onEvolveRequest} />);
    const btn = screen.getByRole('button', { name: 'Evoluir' });
    fireEvent.click(btn);
    expect(onEvolveRequest).toHaveBeenCalledTimes(1);
    // posicionamento crítico é INLINE de propósito (`left-1/2` não existe no
    // index.css pré-compilado — footgun 1). Se alguém trocar por classe, o
    // botão cai fora do centro do palco e este caso avisa.
    expect(btn.style.left).toBe('50%');
    expect(btn.style.transform).toBe('translateX(-50%)');
  });

  it('o botão Evoluir some quando o pet está dormindo', () => {
    renderWithCss(<CompanionHUD {...base} canEvolve isSleeping onEvolveRequest={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Evoluir' })).toBeNull();
  });

  it('par PT/EN do botão de evolução', () => {
    const pt = renderWithCss(<CompanionHUD {...base} canEvolve onEvolveRequest={() => {}} />);
    expect(screen.getByRole('button', { name: 'Evoluir' })).toBeTruthy();
    pt.unmount();
    renderWithCss(<CompanionHUD {...base} language="en-US" canEvolve onEvolveRequest={() => {}} />);
    expect(screen.getByRole('button', { name: 'Evolve' })).toBeTruthy();
  });

  it('o ninho e o sprite do pet são arte NOSSA (src/assets/soulmon)', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} />);
    const srcs = Array.from(container.querySelectorAll('img')).map(i => i.getAttribute('src') ?? '');
    expect(srcs.some(s => /nest-base/.test(s))).toBe(true);
    // nenhuma arte de terceiro embarcada (docs/Attributions.md)
    expect(srcs.some(s => /_dmc\.png/.test(s))).toBe(false);
  });

  it('HP 0 continua renderizando a cena (degeneração não pode quebrar a tela)', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} healthPoints={0} />);
    expect(container.querySelectorAll('img').length).toBeGreaterThan(0);
  });

  it('HP fracionário (0.5, permitido pela regra) não quebra os corações', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} healthPoints={1.5} />);
    expect(container.querySelectorAll('img').length).toBeGreaterThan(0);
  });
});
