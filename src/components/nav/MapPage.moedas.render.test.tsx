// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MapPage } from './MapPage';

afterEach(() => { cleanup(); vi.useRealTimers(); });

const mount = () => render(<MapPage language="pt-BR" onOpenArea={() => {}} bits={5} emblems={2} credits={1} />);

describe('MapPage: dica das moedas', () => {
  it('toque na pílula abre a dica certa e novo toque fecha', () => {
    mount();
    const b = screen.getByRole('button', { name: /Bits — como conseguir/ });
    expect(b.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(b);
    expect(b.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('note').textContent).toMatch(/minijogos/);
    fireEvent.click(b);
    expect(screen.queryByRole('note')).toBeNull();
  });
  it('Honra e Créditos têm texto próprio', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: /Honra — como conseguir/ }));
    expect(screen.getByRole('note').textContent).toMatch(/Torneio/);
    fireEvent.pointerDown(document.body);
    fireEvent.click(screen.getByRole('button', { name: /Créditos — como conseguir/ }));
    expect(screen.getByRole('note').textContent).toMatch(/dinheiro real/);
  });
  it('fecha sozinha em 4 s e ao tocar fora', () => {
    vi.useFakeTimers();
    mount();
    fireEvent.click(screen.getByRole('button', { name: /Bits — como conseguir/ }));
    expect(screen.getByRole('note')).toBeTruthy();
    act(() => { vi.advanceTimersByTime(4100); });
    expect(screen.queryByRole('note')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Bits — como conseguir/ }));
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('note')).toBeNull();
  });
});
