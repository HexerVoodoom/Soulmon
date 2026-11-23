// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { RogueKeyGate } from './RogueKeyGate';

afterEach(cleanup);

describe('portão do Calabouço sem chave (§239)', () => {
  it('o NPC 412 manda à Oficina, nos dois idiomas, e o toque no fundo NÃO fecha', () => {
    const onClose = vi.fn();
    const { container } = render(<RogueKeyGate language="pt-BR" onClose={onClose} />);
    expect(container.textContent).toContain('Oficina do Foco');
    expect(container.querySelector('[data-npc-art]')?.getAttribute('src')).toContain('guarda-chave');
    fireEvent.click(container.querySelector('[data-npc-advance]')!);
    expect(onClose).not.toHaveBeenCalled();
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
  it('16/11/2026: sem fechar sozinho (10 s), o X fecha, o CTA vai à Oficina, reabrir funciona', () => {
    vi.useFakeTimers();
    try {
      const onClose = vi.fn();
      const go = vi.fn();
      const { container, unmount } = render(<RogueKeyGate language="pt-BR" onClose={onClose} onGoToWorkshop={go} />);
      act(() => { vi.advanceTimersByTime(10_000); });
      fireEvent.click(container.querySelector('[data-npc-sequence]')!);
      expect(onClose).not.toHaveBeenCalled();
      expect(container.querySelector('[data-npc-sequence]')).not.toBeNull();
      fireEvent.click(container.querySelector('[data-npc-skip]')!);
      expect(onClose).toHaveBeenCalledTimes(1);
      unmount();
      const again = render(<RogueKeyGate language="en-US" onClose={onClose} onGoToWorkshop={go} />);
      fireEvent.click(again.container.querySelector('[data-rogue-gate-workshop]')!);
      expect(go).toHaveBeenCalledTimes(1);
    } finally { vi.useRealTimers(); }
  });
  it('teste-guarda: scrim/wrapper do portão e do aviso de prédio trancado nunca usam onClick={onClose}', () => {
    for (const f of ['RogueKeyGate.tsx', '../NpcSequence.tsx']) {
      expect(readFileSync(f.startsWith('..') ? `src/components/${f.slice(3)}` : `src/components/play/${f}`, 'utf8')).not.toMatch(/onClick=\{onClose\}/);
    }
    const lock = readFileSync('src/components/ui/LockBadge.tsx', 'utf8');
    expect(lock.match(/onClick=\{onClose\}/g)).toHaveLength(1); // só o botão X
    expect(lock).toMatch(/data-lock-notice-close[\s\S]{0,120}onClick=\{onClose\}/);
    const seq = readFileSync('src/components/NpcSequence.tsx', 'utf8');
    expect(seq).toContain('closeOnTap');
  });
});
