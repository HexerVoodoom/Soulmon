// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../../test/renderEnv';
import { BotaoEspecial } from './BotaoEspecial';
import { readFileSync } from 'fs';
import { resolve } from 'path';

beforeEach(() => { installDomGlobals(); });
afterEach(() => cleanup());

describe('BotaoEspecial (botão de compra, 18/11/2026)', () => {
  it('é um botão com a classe própria, rótulo, largura total por padrão e dispara o clique', () => {
    const onClick = vi.fn();
    render(<BotaoEspecial data-x="1" onClick={onClick}>Comprar 3 tickets</BotaoEspecial>);
    const b = screen.getByRole('button', { name: 'Comprar 3 tickets' });
    expect(b.className).toContain('sm2-especial');
    expect(b.getAttribute('type')).toBe('button');
    expect(b.getAttribute('data-especial-width')).toBe('full');
    expect(b.getAttribute('data-x')).toBe('1');
    fireEvent.click(b);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it('disabled não dispara o clique e marca aria-disabled; width auto', () => {
    const onClick = vi.fn();
    render(<BotaoEspecial width="auto" disabled onClick={onClick}>Comprar convites</BotaoEspecial>);
    const b = screen.getByRole('button', { name: 'Comprar convites' }) as HTMLButtonElement;
    fireEvent.click(b);
    expect(onClick).not.toHaveBeenCalled();
    expect(b.disabled).toBe(true);
    expect(b.getAttribute('aria-disabled')).toBe('true');
    expect(b.getAttribute('data-especial-width')).toBe('auto');
  });
  it('CSS: 3 estados com arte própria, alvo >= 44, sem all:unset, movimento reduzido só no bloco canônico', () => {
    const css = readFileSync(resolve(__dirname, '../../index.css'), 'utf8');
    const bloco = /^\.sm2-especial \{[\s\S]*?\n\}/m.exec(css)?.[0] ?? '';
    expect(bloco).toContain('btn-especial.webp');
    expect(bloco).toContain('btn-especial-press.webp');
    expect(bloco).toContain('btn-especial-off.webp');
    expect(bloco).toMatch(/height: 5\d+px/);
    expect(bloco).not.toContain('all: unset');
    expect(bloco).not.toContain('prefers-reduced-motion');
    const canonico = css.slice(css.indexOf('SENTINELA-MOVIMENTO-REDUZIDO-CANONICO'));
    expect(css.indexOf('.sm2-especial { transition: none; }')).toBeGreaterThan(-1);
    expect(css.indexOf('.sm2-especial { transition: none; }')).toBeLessThan(css.indexOf('SENTINELA-MOVIMENTO-REDUZIDO-CANONICO'));
    expect(canonico.length).toBeGreaterThan(0);
  });
});
