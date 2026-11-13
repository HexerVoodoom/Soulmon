// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { DungeonKeyBadge } from './DungeonKeyBadge';

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('chave do Calabouço no mapa da Exploração (13/11/2026)', () => {
  it('sem chave não desenha nada', () => {
    expect(render(<DungeonKeyBadge expiresAt={null} language="pt-BR" />).container.innerHTML).toBe('');
  });
  it('com chave: ícone + relógio que anda e some ao zerar', () => {
    vi.useFakeTimers();
    const now = new Date(2026, 10, 13, 12).getTime();
    vi.setSystemTime(now);
    const { container } = render(<DungeonKeyBadge expiresAt={now + 2 * 3_600_000 + 5_000} language="pt-BR" />);
    expect(container.querySelector('[data-dungeon-key-badge] img')).not.toBeNull();
    expect(container.querySelector('[data-dungeon-key-timer]')!.textContent).toBe('2:00:05');
    expect(container.querySelector('[role="img"]')!.getAttribute('aria-label')).toBe('Chave do Calabouço: expira em 2 h 0 min');
    act(() => { vi.advanceTimersByTime(2_000); });
    expect(container.querySelector('[data-dungeon-key-timer]')!.textContent).toBe('2:00:03');
    act(() => { vi.advanceTimersByTime(2 * 3_600_000 + 3_000); });
    expect(container.querySelector('[data-dungeon-key-badge]')).toBeNull();
  });
});
