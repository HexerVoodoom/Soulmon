// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { NpcLetterButton } from './NpcLetterButton';
import { NpcLetterModal } from './NpcLetterModal';
import { HomeHud } from './pixel/HomeHud';

describe('cartinha da Home', () => {
  it('HomeHud: sem `belowLeading` não há cartinha no DOM; com ela, fica abaixo do retrato e abre ao toque', () => {
    const a = render(<HomeHud language="pt-BR" leading={<button>perfil</button>} />);
    expect(a.container.querySelector('[data-npc-letter-btn]')).toBeNull();
    a.unmount();
    const onOpen = vi.fn();
    const b = render(<HomeHud language="pt-BR" leading={<button>perfil</button>} belowLeading={<NpcLetterButton language="pt-BR" onOpen={onOpen} />} />);
    const btn = b.container.querySelector('[data-npc-letter-btn]') as HTMLElement;
    expect(btn.getAttribute('aria-label')).toBe('Você tem uma carta');
    expect(btn.closest('[data-hud-below-leading]')).not.toBeNull();
    fireEvent.click(btn);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('a cartinha é parada (sem animação) e sem box', () => {
    const { container } = render(<NpcLetterButton language="en-US" onOpen={() => {}} />);
    const btn = container.querySelector('[data-npc-letter-btn]') as HTMLElement;
    expect(btn.style.animation).toBe('');
    expect(btn.style.background).toBe('transparent');
    expect(btn.style.borderStyle === 'none' || btn.style.border === 'none' || btn.style.border.startsWith('medium none') || btn.style.border === 'medium').toBe(true);
  });
});

describe('carta aberta', () => {
  it('mostra as linhas do NPC, assina e fecha pelo botão', () => {
    const onClose = vi.fn();
    const { getByRole, container } = render(<NpcLetterModal letter={{ day: '2026-10-19', kinds: ['promo', 'quest'], read: false }} language="en-US" onClose={onClose} />);
    expect(container.querySelectorAll('[data-npc-letter-body] p')).toHaveLength(2);
    expect(container.querySelector('[data-npc-letter-from]')?.textContent).toMatch(/Soulsmith/);
    fireEvent.click(getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });
});
