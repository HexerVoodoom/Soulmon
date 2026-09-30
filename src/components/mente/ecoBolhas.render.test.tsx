// @vitest-environment jsdom
/**
 * ECO DO PET e BOLHAS DO SONHO montados de verdade (`docs/BENCHMARK-MINIJOGOS.md`
 * §6.2/§6.3). O que se trava aqui é o contrato com o funil de Bits do App:
 * Eco paga UMA vez por rodada, só se > 0; Bolhas no foco paga uma vez no fim;
 * Bolhas na calma NUNCA paga. E o fim de rodada é gentil: nada de "game over".
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderWithCss } from '../../test/renderEnv';
import { EcoGame } from './EcoGame';
import { BolhasGame } from './BolhasGame';
import { BOLHAS_FOCO_DURATION_MS } from '../../utils/mente/bolhas';

const base = { evolutionStage: 'rookie', onExit: () => {} };

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

const avança = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });
const pedra = (c: HTMLElement, i: number) => c.querySelector<HTMLButtonElement>(`[data-eco-stone="${i}"]`)!;

describe('EcoGame', () => {
  it('monta com título, alternador de eco reverso e botão de começar (PT e EN)', () => {
    const { container, unmount } = renderWithCss(<EcoGame {...base} language="pt-BR" onEarnPoints={vi.fn()} />);
    expect(container.textContent).toContain('Eco do Pet');
    expect(container.querySelector('[data-eco-reverse]')!.getAttribute('aria-pressed')).toBe('false');
    expect(container.querySelector('[data-eco-start]')).toBeTruthy();
    unmount();
    const en = renderWithCss(<EcoGame {...base} language="en-US" onEarnPoints={vi.fn()} />);
    expect(en.container.textContent).toContain('Pet Echo');
    expect(en.container.textContent).toContain('Reverse echo');
  });

  it('toque fora da ordem na 1ª sequência: fim gentil, "Maior eco: 0", nada pago', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1); // toda pedra = 0
    const onEarn = vi.fn();
    const { container } = renderWithCss(<EcoGame {...base} language="pt-BR" onEarnPoints={onEarn} />);
    fireEvent.click(container.querySelector('[data-eco-start]')!);
    expect(pedra(container, 0).disabled).toBe(true); // o pet ainda está cantando
    avança(5000);
    expect(pedra(container, 0).disabled).toBe(false);
    fireEvent.click(pedra(container, 1));
    const status = container.querySelector('[data-eco-status]')!.textContent!;
    expect(status).toBe('Maior eco: 0');
    expect(container.textContent).not.toMatch(/game over|errou|perdeu/i);
    expect(onEarn).not.toHaveBeenCalled();
    expect(container.querySelector('[data-eco-again]')).toBeTruthy();
  });

  it('completa 3 e 4, erra no 5: "Longest echo: 4" e onEarnPoints(1) uma vez', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const onEarn = vi.fn();
    const { container } = renderWithCss(<EcoGame {...base} language="en-US" onEarnPoints={onEarn} />);
    fireEvent.click(container.querySelector('[data-eco-start]')!);
    avança(5000);
    for (let i = 0; i < 3; i++) fireEvent.click(pedra(container, 0));
    avança(8000);
    for (let i = 0; i < 4; i++) fireEvent.click(pedra(container, 0));
    avança(8000);
    fireEvent.click(pedra(container, 2));
    expect(container.querySelector('[data-eco-status]')!.textContent).toBe('Longest echo: 4');
    expect(onEarn).toHaveBeenCalledTimes(1);
    expect(onEarn).toHaveBeenCalledWith(1);
    // Nada depois do fim paga de novo.
    avança(10000);
    expect(onEarn).toHaveBeenCalledTimes(1);
  });

  it('eco reverso: a sequência é repetida de trás para frente', () => {
    // 1ª sequência: 0,1,2 (três sorteios 0.1, 0.3, 0.6).
    const vals = [0.1, 0.3, 0.6, 0.9];
    let k = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => vals[Math.min(k++, vals.length - 1)]);
    const onEarn = vi.fn();
    const { container } = renderWithCss(<EcoGame {...base} language="pt-BR" onEarnPoints={onEarn} />);
    fireEvent.click(container.querySelector('[data-eco-reverse]')!);
    fireEvent.click(container.querySelector('[data-eco-start]')!);
    avança(5000);
    fireEvent.click(pedra(container, 2));
    fireEvent.click(pedra(container, 1));
    fireEvent.click(pedra(container, 0));
    avança(8000);
    // 2ª: 0,1,2,3 → reverso começa por 3; tocar 0 termina com maior eco 3.
    fireEvent.click(pedra(container, 0));
    expect(container.querySelector('[data-eco-status]')!.textContent).toBe('Maior eco: 3');
    expect(onEarn).not.toHaveBeenCalled();
  });

  it('desmontar no meio da exibição não deixa timer vivo', () => {
    const { container, unmount } = renderWithCss(<EcoGame {...base} language="pt-BR" onEarnPoints={vi.fn()} />);
    fireEvent.click(container.querySelector('[data-eco-start]')!);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('BolhasGame', () => {
  it('calma: sem placar, sem tempo, e onEarnPoints NUNCA é chamado', () => {
    const onEarn = vi.fn();
    const { container } = renderWithCss(<BolhasGame {...base} language="pt-BR" mode="calma" onEarnPoints={onEarn} />);
    expect(container.textContent).toContain('Bolhas calmas');
    expect(container.textContent).toContain('Sem pressa. Estoure quando quiser.');
    expect(container.querySelector('[data-bolhas-score]')).toBeNull();
    expect(container.querySelector('[data-bolhas-time]')).toBeNull();
    for (let t = 0; t < 40; t++) {
      avança(1000);
      container.querySelectorAll<HTMLButtonElement>('[data-bolha]').forEach(b => fireEvent.click(b));
    }
    expect(container.querySelector('[data-bolha="wisp"]')).toBeNull();
    avança(BOLHAS_FOCO_DURATION_MS * 3);
    expect(onEarn).not.toHaveBeenCalled();
    expect(container.querySelector('[data-bolhas-done]')).toBeNull();
    expect(container.querySelector('[data-bolhas-exit]')).toBeTruthy();
  });

  it('foco: estourar 12 sonhos e deixar o tempo acabar paga onEarnPoints(2) uma vez (1 Bit a cada 6)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // sempre sonho
    const onEarn = vi.fn();
    const { container } = renderWithCss(<BolhasGame {...base} language="en-US" mode="foco" onEarnPoints={onEarn} />);
    expect(container.textContent).toContain('Dream Bubbles');
    expect(container.textContent).toContain('Pop the bright dreams, let the dark wisps drift by');
    fireEvent.click(container.querySelector('[data-bolhas-start]')!);
    let popped = 0;
    while (popped < 12) {
      avança(1000);
      container.querySelectorAll<HTMLButtonElement>('[data-bolha="dream"]').forEach(b => { fireEvent.click(b); popped++; });
    }
    expect(container.querySelector('[data-bolhas-score]')!.textContent).toBe(`Dreams ${popped}`);
    avança(BOLHAS_FOCO_DURATION_MS);
    expect(container.querySelector('[data-bolhas-done]')!.textContent).toBe(`You popped ${popped} dreams`);
    expect(onEarn).toHaveBeenCalledTimes(1);
    expect(onEarn).toHaveBeenCalledWith(2);
    avança(5000);
    expect(onEarn).toHaveBeenCalledTimes(1);
  });

  it('foco: estourar um fiapo vira fumaça, não pontua e não escreve texto nenhum', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1); // < 0.22 → fiapo
    const onEarn = vi.fn();
    const { container } = renderWithCss(<BolhasGame {...base} language="pt-BR" mode="foco" onEarnPoints={onEarn} />);
    fireEvent.click(container.querySelector('[data-bolhas-start]')!);
    avança(100);
    const antes = container.textContent;
    fireEvent.click(container.querySelector('[data-bolha="wisp"]')!);
    expect(container.querySelector('[data-bolha-fx="smoke"]')).toBeTruthy();
    expect(container.querySelector('[data-bolhas-score]')!.textContent).toBe('Sonhos 0');
    expect(container.textContent).toBe(antes);
    avança(BOLHAS_FOCO_DURATION_MS);
    expect(container.querySelector('[data-bolhas-done]')!.textContent).toBe('Você estourou 0 sonhos');
    expect(onEarn).not.toHaveBeenCalled();
  });

  it('desmontar no meio da rodada não deixa timer vivo', () => {
    const { container, unmount } = renderWithCss(<BolhasGame {...base} language="pt-BR" mode="foco" onEarnPoints={vi.fn()} />);
    fireEvent.click(container.querySelector('[data-bolhas-start]')!);
    avança(500);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('Regras de casa no fonte', () => {
  const fontes = ['EcoGame.tsx', 'BolhasGame.tsx'].map(f => readFileSync(resolve(__dirname, f), 'utf8'))
    .concat(['eco.ts', 'bolhas.ts'].map(f => readFileSync(resolve(__dirname, '../../utils/mente', f), 'utf8')));
  it('mudos (R-NOVA), sem vermelho, sem promessa cognitiva', () => {
    for (const src of fontes) {
      expect(src).not.toMatch(/from ['"][^'"]*utils\/sounds/);
      expect(src).not.toMatch(/danger/);
      expect(src).not.toMatch(/treina o c[ée]rebro|melhora a mem[óo]ria|\bbrain\b/i);
    }
  });
});
