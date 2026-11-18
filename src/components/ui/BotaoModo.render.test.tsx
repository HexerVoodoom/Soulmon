// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../../test/renderEnv';
import { BotaoModo } from './BotaoModo';

beforeEach(() => { installDomGlobals(); });
afterEach(() => cleanup());

describe('BotaoModo (PvE/PvP, 18/11/2026)', () => {
  it('marca a variante, mostra rótulo e dica e dispara o clique', () => {
    const onClick = vi.fn();
    render(<BotaoModo variant="pvp" hint="1 contra 1" onClick={onClick}>PvP</BotaoModo>);
    const b = screen.getByRole('button', { name: /PvP/ });
    expect(b.className).toContain('sm2-modo');
    expect(b.getAttribute('data-botao-modo')).toBe('pvp');
    expect(b.textContent).toContain('1 contra 1');
    fireEvent.click(b);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it('disabled não dispara e marca aria-disabled', () => {
    const onClick = vi.fn();
    render(<BotaoModo variant="pve" disabled onClick={onClick}>Aventura</BotaoModo>);
    const b = screen.getByRole('button', { name: 'Aventura' });
    fireEvent.click(b);
    expect(onClick).not.toHaveBeenCalled();
    expect(b.getAttribute('aria-disabled')).toBe('true');
  });
});
