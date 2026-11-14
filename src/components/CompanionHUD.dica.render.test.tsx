// @vitest-environment jsdom
/** §333: a dica COMUM ocupa o turno da fala ociosa (nunca um turno a mais); a dica DOURADA é o mesmo botão dourado, nomeado pelo destino, e respeita o movimento reduzido. */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, act, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { CompanionHUD } from './CompanionHUD';
import { dicaTexto, dicaAria } from '../utils/balaoDica';

const base = {
  companionMood: 'idle' as const, energyLevel: 3, message: 'Oi!',
  currentStage: 'rookie', evolutionStage: 'rookie', healthPoints: 3, maxHealthPoints: 3,
  dominantBranch: 'balanced' as const, currentXP: 0, nextLevelXP: 10,
  useAI: false, language: 'pt-BR' as const, energyPoints: 1, maxEnergyPoints: 10,
};

function movimentoReduzido(reduce: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true, writable: true,
    value: (query: string) => ({
      matches: reduce && query.includes('prefers-reduced-motion'), media: query, onchange: null,
      addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
    }),
  });
}

beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('x')))); movimentoReduzido(false); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

const fala = (c: HTMLElement) => c.querySelector('[data-pet-bubble]')?.textContent ?? '';

describe('dica comum no turno da fala ociosa', () => {
  it('a cada 3 min, com dica da vez, o Soulmon fala a DICA e avisa o App (para o cooldown)', async () => {
    const onDica = vi.fn();
    const texto = dicaTexto('cochilo', 'pt-BR');
    const { container } = renderWithCss(<CompanionHUD {...base} dicaFala={{ tipo: 'cochilo', text: texto }} onDicaFalada={onDica} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); }); // a saudação passa
    expect(onDica).not.toHaveBeenCalled(); // não fala no momento de abrir: só no turno ocioso
    await act(async () => { await vi.advanceTimersByTimeAsync(180_000); });
    expect(fala(container)).toContain('cochilo');
    expect(container.querySelector('[data-pet-bubble] [data-pet-gold-bubble-arrow]')).toBeNull(); // dica comum não leva a lugar: sem seta
    expect(onDica).toHaveBeenCalledWith('cochilo');
    expect(onDica).toHaveBeenCalledTimes(1);
  });
  it('sem dica, a escada de sempre (nada é gravado)', async () => {
    const onDica = vi.fn();
    const { container } = renderWithCss(<CompanionHUD {...base} onDicaFalada={onDica} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(181_000); });
    expect(fala(container).length).toBeGreaterThan(0);
    expect(onDica).not.toHaveBeenCalled();
  });
  it('dormindo, a dica não fala', async () => {
    const onDica = vi.fn();
    renderWithCss(<CompanionHUD {...base} isSleeping dicaFala={{ tipo: 'fome', text: dicaTexto('fome', 'pt-BR') }} onDicaFalada={onDica} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(185_000); });
    expect(onDica).not.toHaveBeenCalled();
  });
  it('a fala comum é tocável para fechar e não bloqueia o resto (a faixa não pega toque)', async () => {
    const { container } = renderWithCss(<CompanionHUD {...base} dicaFala={{ tipo: 'fome', text: dicaTexto('fome', 'pt-BR') }} onDicaFalada={() => {}} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(181_000); });
    const faixa = container.querySelector('[data-pet-bubble-row]') as HTMLElement;
    expect(faixa.style.pointerEvents).toBe('none');
    fireEvent.click(container.querySelector('[data-pet-bubble]') as HTMLElement);
    expect(container.querySelector('[data-pet-bubble]')).toBeNull();
  });
});

describe('dica dourada no balão dourado', () => {
  for (const tipo of ['relaxar', 'lilia'] as const) {
    it(`${tipo}: botão nomeado pelo destino; o toque devolve o tipo ao App`, () => {
      const onTap = vi.fn();
      const { container } = renderWithCss(<CompanionHUD {...base} balaoDourado={{ tipo, text: dicaTexto(tipo, 'pt-BR'), ariaLabel: dicaAria(tipo, 'pt-BR') }} onBalaoDourado={onTap} />);
      const b = container.querySelector(`[data-pet-gold-bubble="${tipo}"]`) as HTMLButtonElement;
      expect(b.tagName).toBe('BUTTON');
      expect(b.getAttribute('aria-label')).toBe(dicaAria(tipo, 'pt-BR'));
      expect(b.textContent).toContain(dicaTexto(tipo, 'pt-BR'));
      // leva a algum lugar → o chevron turquesa no fim da linha (aria-hidden: o rótulo já diz o destino)
      expect(b.querySelectorAll('[data-pet-gold-bubble-arrow][aria-hidden="true"]')).toHaveLength(1);
      fireEvent.click(b);
      expect(onTap).toHaveBeenCalledWith(tipo);
    });
  }
  it('movimento reduzido: sem a animação de entrada', () => {
    movimentoReduzido(true);
    const { container } = renderWithCss(<CompanionHUD {...base} balaoDourado={{ tipo: 'relaxar', text: dicaTexto('relaxar', 'pt-BR'), ariaLabel: dicaAria('relaxar', 'pt-BR') }} onBalaoDourado={() => {}} />);
    expect((container.querySelector('[data-pet-gold-bubble]') as HTMLElement).className).not.toContain('sm3-balao');
    // a seta continua, estática (sem classe de animação)
    const seta = container.querySelector('[data-pet-gold-bubble-arrow]') as HTMLElement;
    expect(seta).not.toBeNull();
    expect(seta.className).toBe('');
    expect(seta.style.animation).toBe('');
  });
});
