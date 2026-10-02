// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { InfoTip } from './InfoTip';

afterEach(cleanup);

describe('InfoTip — o "?" padrão', () => {
  it('abre e fecha pelo toque, com aria-expanded e o texto num note', () => {
    render(<InfoTip language="pt-BR" label="Como funciona">Texto explicativo</InfoTip>);
    const b = screen.getByRole('button', { name: 'Como funciona' });
    expect(b.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('note')).toBeNull();
    fireEvent.click(b);
    expect(b.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('note').textContent).toBe('Texto explicativo');
    expect(b.getAttribute('aria-describedby')).toBe(screen.getByRole('note').id);
    fireEvent.click(b);
    expect(screen.queryByRole('note')).toBeNull();
  });

  it('fecha com Esc e com toque fora', () => {
    render(<div><InfoTip language="en-US" label="How it works">Body</InfoTip><p>fora</p></div>);
    const b = screen.getByRole('button', { name: 'How it works' });
    fireEvent.click(b);
    expect(screen.getByRole('note')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('note')).toBeNull();
    fireEvent.click(b);
    fireEvent.pointerDown(screen.getByText('fora'));
    expect(screen.queryByRole('note')).toBeNull();
  });

  it('o alvo de toque tem 44px e o ícone é o "help" pelado (sem box)', () => {
    render(<InfoTip language="pt-BR" label="Ajuda">x</InfoTip>);
    const b = screen.getByRole('button', { name: 'Ajuda' });
    expect(b.style.minWidth).toBe('44px');
    expect(b.style.minHeight).toBe('44px');
    expect(b.textContent).toContain('help');
  });
});
