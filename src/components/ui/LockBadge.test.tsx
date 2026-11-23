// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { LockBadge, LockNotice, lockLabel } from './LockBadge';
import { MapPage } from '../nav/MapPage';

describe('cadeado dos prédios', () => {
  it('chip com Vínculo N escrito, glifo SVG sem emoji e escondido do leitor de tela', () => {
    const { container } = render(<LockBadge minBond={5} language="pt-BR" />);
    const chip = container.querySelector('[data-lock-badge="5"]')!;
    expect(chip.textContent).toBe('Vínculo 5');
    expect(chip.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('svg[data-lock-glyph]')).toBeTruthy();
    expect(chip.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
    render(<LockBadge minBond={3} language="en-US" />);
    expect(document.querySelector('[data-lock-badge="3"]')!.textContent).toBe('Bond 3');
  });
  it('rótulo acessível e aviso com role=status', () => {
    expect(lockLabel(5, 'en-US')).toBe('Locked, opens at Bond 5');
    const { getByRole } = render(<LockNotice text="Opens at Bond 5." />);
    expect(getByRole('status').textContent).toBe('Opens at Bond 5.');
  });
  it('Mapa: área trancada anuncia o motivo; Vínculo alto não trava; sem bondLevel nada trava', () => {
    const base = { language: 'en-US' as const, onOpenArea: () => {}, bits: 0, emblems: 0, credits: 0 };
    const a = render(<MapPage {...base} bondLevel={1} />);
    // beta3 N10: a Fenda (Vínculo 1) veio para a Arena, então a Arena já abre no 1; o Hall (Clã, Vínculo 2).
    // 12/11/2026 (dono): sem limite por level — nenhuma área trava no Vínculo 1 (o cadeado e o aviso seguem prontos para uma tabela futura).
    expect(a.container.querySelector('[data-map-area="arena"]')!.getAttribute('data-map-locked')).toBeNull();
    expect(a.container.querySelector('[data-map-area="hall"]')!.getAttribute('data-map-locked')).toBeNull();
    expect(a.container.querySelector('[data-map-area="mercado"]')!.getAttribute('data-map-locked')).toBeNull();
    a.unmount();
    const b = render(<MapPage {...base} bondLevel={9} />);
    expect(b.container.querySelector('[data-map-locked]')).toBeNull();
    b.unmount();
    const c = render(<MapPage {...base} />);
    expect(c.container.querySelector('[data-map-locked]')).toBeNull();
  });
});

describe('LockNotice com X (16/11/2026)', () => {
  it('não some em 10 s, tocar fora não fecha, o X fecha', async () => {
    const { vi } = await import('vitest');
    const { fireEvent, act } = await import('@testing-library/react');
    vi.useFakeTimers();
    try {
      const onClose = vi.fn();
      const { container } = render(<LockNotice text="Opens at Bond 5." onClose={onClose} />);
      act(() => { vi.advanceTimersByTime(10_000); });
      fireEvent.click(document.body);
      expect(onClose).not.toHaveBeenCalled();
      expect(container.querySelector('[data-lock-notice]')).not.toBeNull();
      fireEvent.click(container.querySelector('[data-lock-notice-close]')!);
      expect(onClose).toHaveBeenCalledTimes(1);
    } finally { vi.useRealTimers(); }
  });
});
