// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../../test/renderEnv';
import { CtaButton } from './CtaButton';

beforeEach(() => { installDomGlobals(); });
afterEach(() => cleanup());

describe('CtaButton', () => {
  it('é um botão com a classe do CTA, rótulo e largura total por padrão', () => {
    const onClick = vi.fn();
    render(<CtaButton onClick={onClick}>Criar poção</CtaButton>);
    const b = screen.getByRole('button', { name: 'Criar poção' });
    expect(b.className).toContain('sm2-cta');
    expect(b.getAttribute('data-cta-width')).toBe('full');
    expect(b.getAttribute('type')).toBe('button');
    fireEvent.click(b);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it('disabled não dispara o clique; width auto; repassa data-* e aria-*', () => {
    const onClick = vi.fn();
    render(<CtaButton width="auto" disabled data-x="1" aria-haspopup="dialog" onClick={onClick}>Seguir</CtaButton>);
    const b = screen.getByRole('button', { name: 'Seguir' }) as HTMLButtonElement;
    fireEvent.click(b);
    expect(onClick).not.toHaveBeenCalled();
    expect(b.disabled).toBe(true);
    expect(b.getAttribute('data-cta-width')).toBe('auto');
    expect(b.getAttribute('data-x')).toBe('1');
    expect(b.getAttribute('aria-haspopup')).toBe('dialog');
  });
});
