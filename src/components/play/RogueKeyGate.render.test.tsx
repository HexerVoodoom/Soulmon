// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { RogueKeyGate } from './RogueKeyGate';

afterEach(cleanup);

describe('portão do Calabouço sem chave (§239)', () => {
  it('o NPC 412 manda à Oficina, nos dois idiomas, e o toque fecha', () => {
    const onClose = vi.fn();
    const { container } = render(<RogueKeyGate language="pt-BR" onClose={onClose} />);
    expect(container.textContent).toContain('Oficina do Foco');
    expect(container.querySelector('[data-npc-art]')?.getAttribute('src')).toContain('guarda-chave');
    fireEvent.click(container.querySelector('[data-npc-advance]')!);
    expect(onClose).toHaveBeenCalledTimes(1);
    cleanup();
    expect(render(<RogueKeyGate language="en-US" onClose={onClose} />).container.textContent).toContain('Focus Workshop');
  });
  it('13/11/2026: com onGoToWorkshop, o CtaButton leva à Oficina e não fecha pelo avançar; sem ele, nenhum botão', () => {
    const onClose = vi.fn();
    const go = vi.fn();
    const { container } = render(<RogueKeyGate language="pt-BR" onClose={onClose} onGoToWorkshop={go} />);
    const btn = container.querySelector('[data-rogue-gate-workshop]') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    expect(btn.hasAttribute('data-cta-button')).toBe(true);
    expect(btn.textContent).toBe('Ir para a Oficina do Foco');
    expect(container.textContent).toContain('Você precisa de uma chave');
    fireEvent.click(btn);
    expect(go).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    cleanup();
    expect(render(<RogueKeyGate language="en-US" onClose={onClose} onGoToWorkshop={go} />).container.querySelector('[data-rogue-gate-workshop]')!.textContent).toBe('Go to the Focus Workshop');
    cleanup();
    expect(render(<RogueKeyGate language="pt-BR" onClose={onClose} />).container.querySelector('[data-rogue-gate-workshop]')).toBeNull();
  });
});
