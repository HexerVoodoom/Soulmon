// @vitest-environment jsdom
/** beta12 §G (G1, G2, G7): o balão dourado é persistente (sem timeout), é um botão nomeado pelo destino, borda dourada, alvo >= 44 px. */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, act, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { CompanionHUD } from './CompanionHUD';

const base = {
  companionMood: 'idle' as const, energyLevel: 3, message: 'Oi!',
  currentStage: 'rookie', evolutionStage: 'rookie', healthPoints: 3, maxHealthPoints: 3,
  dominantBranch: 'balanced' as const, currentXP: 0, nextLevelXP: 10,
  useAI: false, language: 'pt-BR' as const, energyPoints: 4, maxEnergyPoints: 4,
};
const dourado = (tipo: 'grove' | 'rift' | 'achado' = 'grove') => ({ tipo, text: 'O Bosque está sendo atacado. Quer dar uma olhada?', ariaLabel: 'Abrir o Bosque' });

beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('x')))); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('balão dourado do CompanionHUD', () => {
  it('sem balão, nada é desenhado', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} />);
    expect(container.querySelector('[data-pet-gold-bubble]')).toBeNull();
  });

  it('G1/G7: é um BOTÃO com o destino como nome, borda dourada de 2 px e alvo >= 44 px', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} balaoDourado={dourado()} onBalaoDourado={() => {}} />);
    const b = container.querySelector('[data-pet-gold-bubble="grove"]') as HTMLButtonElement;
    expect(b.tagName).toBe('BUTTON');
    expect(b.getAttribute('aria-label')).toBe('Abrir o Bosque');
    expect(b.style.border).toBe('2px solid var(--sm2-gold-fill)');
    expect(parseInt(b.style.minHeight, 10)).toBeGreaterThanOrEqual(44);
    expect(b.textContent).toContain('Bosque');
    // o balão COMUM tem borda fina de linha — o dourado se distingue dele
    expect(b.style.border).not.toContain('--sm2-line');
  });

  it('G1: PERSISTENTE — sem timeout de auto-esconder, mesmo depois de muito tempo e de re-render', async () => {
    const { container, rerender } = renderWithCss(<CompanionHUD {...base} balaoDourado={dourado()} onBalaoDourado={() => {}} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(10 * 60_000); });
    rerender(<CompanionHUD {...base} balaoDourado={dourado()} onBalaoDourado={() => {}} />);
    expect(container.querySelector('[data-pet-gold-bubble="grove"]')).not.toBeNull();
  });

  it('G2: o toque chama o handler com o TIPO (o App navega e grava o dia)', () => {
    const onTap = vi.fn();
    const { container } = renderWithCss(<CompanionHUD {...base} balaoDourado={dourado('achado')} onBalaoDourado={onTap} />);
    fireEvent.click(container.querySelector('[data-pet-gold-bubble]') as HTMLElement);
    expect(onTap).toHaveBeenCalledWith('achado');
  });

  it('G3: com o Soulmon na Fenda (plaquinha), o balão aparece junto dela', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} naMasmorra balaoDourado={{ tipo: 'rift', text: 'Estou na Fenda. Quer ir até lá?', ariaLabel: 'Ir à Fenda' }} onBalaoDourado={() => {}} onSinalMasmorra={() => {}} />);
    expect(container.querySelector('[data-pet-masmorra-slot]')).not.toBeNull();
    expect(container.querySelector('[data-pet-gold-bubble="rift"]')?.getAttribute('aria-label')).toBe('Ir à Fenda');
  });

  it('não cobre os botões de cuidado: a faixa é do topo do palco, fora do fluxo, e só o botão pega toque', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} balaoDourado={dourado()} onBalaoDourado={() => {}} />);
    const faixa = container.querySelector('[data-pet-gold-bubble-row]') as HTMLElement;
    expect(faixa.style.position).toBe('absolute');
    expect(faixa.style.pointerEvents).toBe('none');
    expect((container.querySelector('[data-pet-gold-bubble]') as HTMLElement).style.pointerEvents).toBe('auto');
    expect(container.querySelector('[data-cuidado="banho"]')).not.toBeNull(); // os cuidados seguem no DOM, fora da faixa
    expect(faixa.contains(container.querySelector('[data-cuidado="banho"]'))).toBe(false);
  });

  it('G7: o ponto de montagem do chat não é tocado (o balão não mora no chatDock)', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} balaoDourado={dourado()} onBalaoDourado={() => {}} />);
    expect(container.querySelector('[data-pet-gold-bubble]')?.closest('[data-chat-dock], .sm-chatdock')).toBeNull();
  });

  /* §333 (dono, 13/11) + §364 (14/11): todo balão dourado LEVA a algum lugar, e diz isso com um chevron turquesa SEM haste e SEM círculo no fim da linha. */
  for (const tipo of ['grove', 'rift', 'achado'] as const) {
    it(`chevron turquesa (${tipo}): no FIM da linha, presa à última palavra, aria-hidden, tinta do balão`, () => {
      const { container } = renderWithCss(<CompanionHUD {...base} balaoDourado={dourado(tipo)} onBalaoDourado={() => {}} />);
      const b = container.querySelector(`[data-pet-gold-bubble="${tipo}"]`) as HTMLElement;
      const setas = b.querySelectorAll('[data-pet-gold-bubble-arrow]');
      expect(setas).toHaveLength(1);
      const seta = setas[0] as HTMLElement;
      expect(seta.getAttribute('aria-hidden')).toBe('true');
      expect(seta.style.borderRadius).toBe(''); // sem círculo (§364)
      expect(seta.style.border).toBe('');
      expect(seta.style.color).toBe('var(--sm2-primary-ink)');
      expect(seta.querySelector('.sm2-icon')?.textContent).toBe('chevron_right');
      // nunca quebra sozinha: mora num nowrap junto da última palavra ("olhada?")
      const presa = seta.parentElement as HTMLElement;
      expect(presa.style.whiteSpace).toBe('nowrap');
      expect(presa.firstChild?.textContent).toBe('olhada?');
      // é o último elemento do texto e o nome acessível segue sendo o destino
      expect(b.textContent?.startsWith('O Bosque está sendo atacado. Quer dar uma olhada?')).toBe(true);
      expect(b.getAttribute('aria-label')).toBe('Abrir o Bosque');
    });
  }
  it('o balão COMUM (fala) não tem seta', async () => {
    const { container } = renderWithCss(<CompanionHUD {...base} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
    expect(container.querySelector('[data-pet-bubble]')).not.toBeNull();
    expect(container.querySelector('[data-pet-gold-bubble-arrow]')).toBeNull();
  });
});
