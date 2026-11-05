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
});
