// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../../test/renderEnv';
import { CtaButton, CtaTextButton } from './CtaButton';
import { readFileSync } from 'fs';
import { resolve } from 'path';

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
  it('CtaTextButton (§316c): secundária só texto — classe própria, alvo e superfície, clique e disabled', () => {
    const onClick = vi.fn();
    render(<><CtaTextButton onClick={onClick}>Depois</CtaTextButton><CtaTextButton surface="escuro" width="full" disabled onClick={onClick}>Sair</CtaTextButton></>);
    const a = screen.getByRole('button', { name: 'Depois' });
    expect(a.className).toBe('sm2-cta-texto');
    expect(a.getAttribute('type')).toBe('button');
    expect(a.getAttribute('data-cta-surface')).toBe('claro');
    expect(a.hasAttribute('data-cta-button')).toBe(false);
    fireEvent.click(a);
    const b = screen.getByRole('button', { name: 'Sair' }) as HTMLButtonElement;
    fireEvent.click(b);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(b.getAttribute('data-cta-surface')).toBe('escuro');
    expect(b.getAttribute('data-cta-width')).toBe('full');
  });
  it('CSS: .sm2-cta-texto não tem fundo nem borda, alvo >= 44 e sublinha ao tocar', () => {
    const css = readFileSync(resolve(__dirname, '../../index.css'), 'utf8');
    const ini = css.search(/\.sm2-cta-texto \{\s*box-sizing/);
    expect(ini).toBeGreaterThan(-1);
    const bloco = css.slice(ini, css.indexOf('\n}\n', ini));
    expect(bloco).toContain('border: 0; background: transparent;');
    expect(bloco).toContain('min-height: 44px; min-width: 44px;');
    expect(bloco).toMatch(/&:active:not\(:disabled\) \{ text-decoration-color: currentColor;/);
  });
  it('tom: padrão por omissão; `acao` marca o botão (arte cheia em repouso)', () => {
    render(<><CtaButton>Seguir</CtaButton><CtaButton tone="acao">Criar poção</CtaButton></>);
    expect(screen.getByRole('button', { name: 'Seguir' }).getAttribute('data-cta-tone')).toBe('padrao');
    expect(screen.getByRole('button', { name: 'Criar poção' }).getAttribute('data-cta-tone')).toBe('acao');
  });
  it('CSS: o tom `acao` repousa na arte de hover e vem ANTES de :disabled (desabilitado e pressionado mantêm a arte própria)', () => {
    const css = readFileSync(resolve(__dirname, '../../index.css'), 'utf8');
    const ini = css.search(/\.sm2-cta \{\s*box-sizing/);
    const bloco = css.slice(ini, css.indexOf('.sm2-cta-label {', ini));
    const acao = bloco.indexOf(`&[data-cta-tone="acao"] { border-image-source: url('./assets/soulmon/ui/btn-cta-hover.webp'); }`);
    expect(acao).toBeGreaterThan(-1);
    expect(acao).toBeLessThan(bloco.indexOf('&:disabled {'));
    expect(acao).toBeLessThan(bloco.indexOf('&:active:not(:disabled)'));
  });
});
