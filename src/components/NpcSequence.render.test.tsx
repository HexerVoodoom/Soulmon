// @vitest-environment jsdom
/**
 * `NpcSequence` — o componente genérico de sequência de falas (14/10/2026): toque avança, última fala fecha, "Pular"
 * encerra tudo, teclado (Enter/Espaço avançam, Esc pula), alvo do Pular >= 44 px e dentro da safe-area, `onFinish` uma
 * única vez, PT/EN.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { NpcSequence, type NpcSequenceLine } from './NpcSequence';
import { closeTopBackLayer, hasBackLayer } from '../utils/backStack';

beforeEach(() => {
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
});
afterEach(cleanup);

const LINES: NpcSequenceLine[] = [
  { speaker: 'Ana', art: '/a.png', text: 'Primeira fala.' },
  { speaker: 'Beto', art: '/b.png', text: 'Segunda fala.' },
  { speaker: 'Beto', art: '/b.png', text: 'Terceira fala.' },
];
const q = (c: HTMLElement, sel: string) => c.querySelector(sel) as HTMLElement | null;

describe('NpcSequence', () => {
  it('toque em qualquer lugar avança; a troca de fala troca o NPC; o toque na última fecha ("done")', () => {
    const onFinish = vi.fn();
    const { container } = render(<NpcSequence lines={LINES} language="pt-BR" onFinish={onFinish} />);
    expect(q(container, '[data-npc-art]')!.getAttribute('src')).toBe('/a.png');
    expect(q(container, '[data-npc-name]')!.textContent).toBe('Ana');
    fireEvent.click(q(container, '[data-npc-advance]')!);
    expect(q(container, '[data-npc-art]')!.getAttribute('src')).toBe('/b.png');
    expect(q(container, '[data-npc-name]')!.textContent).toBe('Beto');
    fireEvent.click(q(container, '[data-npc-advance]')!);
    expect(onFinish).not.toHaveBeenCalled();
    fireEvent.click(q(container, '[data-npc-advance]')!);
    expect(onFinish).toHaveBeenCalledWith('done');
  });

  it('não tem botão de "continuar"/"depois": só o avançar de tela cheia e o Pular', () => {
    const { container } = render(<NpcSequence lines={LINES} language="en-US" onFinish={() => {}} />);
    const botoes = [...container.querySelectorAll('button')].map(b => (b.hasAttribute('data-npc-advance') ? 'advance' : b.hasAttribute('data-npc-skip') ? 'skip' : 'outro'));
    expect(botoes).toEqual(['advance', 'skip']);
  });

  it('"Pular"/"Skip": canto superior ESQUERDO, >= 44 px, na safe-area; encerra a sequência inteira', () => {
    const onFinish = vi.fn();
    const { container } = render(<NpcSequence lines={LINES} language="en-US" onFinish={onFinish} />);
    const skip = q(container, '[data-npc-skip]')!;
    expect(skip.textContent).toBe('Skip');
    expect(skip.style.minWidth).toBe('44px');
    expect(skip.style.minHeight).toBe('44px');
    expect(skip.style.top).toContain('safe-area-inset-top');
    expect(skip.style.left).toContain('safe-area-inset-left');
    expect(skip.style.right).toBe('');
    fireEvent.click(skip);
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith('skip');
  });

  it('PT-BR: "Pular"', () => {
    const { container } = render(<NpcSequence lines={LINES} language="pt-BR" onFinish={() => {}} />);
    expect(q(container, '[data-npc-skip]')!.textContent).toBe('Pular');
  });

  it('acessível: dialog modal nomeado, o avançar é o PRIMEIRO focável e recebe o foco; Esc pula', () => {
    // jsdom não tem layout: o `useDialogA11y` só considera focável o que tem caixa.
    const rects = vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
    const onFinish = vi.fn();
    const { container } = render(<NpcSequence lines={LINES} language="en-US" onFinish={onFinish} />);
    const dlg = q(container, '[role="dialog"]')!;
    expect(dlg.getAttribute('aria-modal')).toBe('true');
    expect(dlg.getAttribute('aria-label')).toBe('Ana');
    expect(container.querySelector('button')).toBe(q(container, '[data-npc-advance]'));
    expect(document.activeElement).toBe(q(container, '[data-npc-advance]'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onFinish).toHaveBeenCalledWith('skip');
    rects.mockRestore();
  });

  it('teclado: Enter/Espaço (com o foco fora de um botão) avançam', () => {
    const { container } = render(<NpcSequence lines={LINES} language="en-US" onFinish={() => {}} />);
    const dlg = q(container, '[data-npc-sequence]')!;
    fireEvent.keyDown(dlg, { key: 'Enter' });
    expect(dlg.getAttribute('data-step')).toBe('1');
    fireEvent.keyDown(dlg, { key: ' ' });
    expect(dlg.getAttribute('data-step')).toBe('2');
  });

  it('o voltar do Android pula (camada de voltar) e `onFinish` dispara UMA vez mesmo com toques extras', () => {
    const onFinish = vi.fn();
    const { container } = render(<NpcSequence lines={LINES} language="en-US" onFinish={onFinish} />);
    expect(hasBackLayer()).toBe(true);
    expect(closeTopBackLayer()).toBe(true);
    fireEvent.click(q(container, '[data-npc-skip]')!);
    fireEvent.click(q(container, '[data-npc-advance]')!);
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith('skip');
  });

  it('a camada de voltar sai da pilha ao desmontar', () => {
    const { unmount } = render(<NpcSequence lines={LINES} language="en-US" onFinish={() => {}} />);
    unmount();
    expect(hasBackLayer()).toBe(false);
  });

  it('o texto inteiro está na árvore de acessibilidade (leitor de tela não lê letra por letra)', () => {
    const { container } = render(<NpcSequence lines={LINES} language="en-US" onFinish={() => {}} />);
    expect(container.textContent).toContain('Primeira fala.');
  });

  it('lista vazia não quebra', () => {
    const { container } = render(<NpcSequence lines={[]} language="en-US" onFinish={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});
