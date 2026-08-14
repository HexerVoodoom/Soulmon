// @vitest-environment jsdom
/**
 * Teste de render do `HomeHud`.
 *
 * O guardrail aqui não é estético: **as três moedas nunca se misturam
 * visualmente**. Bits e Créditos já apareceram com o mesmo ícone 💎 e o
 * jogador não tinha como saber que o que pagou com dinheiro real não comprava
 * nada na loja. `currencies.test.ts` trava o MODELO; nada travava o HUD
 * renderizado — e é o HUD que o jogador vê.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss, declaredTargetSize } from '../../test/renderEnv';
import { HomeHud } from './HomeHud';

const base = { energyPoints: 2, maxEnergyPoints: 4, credits: 7 };

describe('HomeHud', () => {
  it('a barra de energia mostra o valor real (2 de 4 blocos)', () => {
    const { container } = renderWithCss(<HomeHud {...base} />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('2');
    expect(container.querySelectorAll('.sm-px-bar-seg-on')).toHaveLength(2);
  });

  it('a cápsula de Créditos é AÇÃO: botão com rótulo e alvo de 44', () => {
    renderWithCss(<HomeHud {...base} language="en-US" />);
    const btn = screen.getByRole('button', { name: 'Credits: 7' });
    expect(declaredTargetSize(btn).h).toBe(44);
  });

  it('abrir Créditos dispara o handler', () => {
    const onOpenCredits = vi.fn();
    renderWithCss(<HomeHud {...base} onOpenCredits={onOpenCredits} language="en-US" />);
    fireEvent.click(screen.getByRole('button', { name: 'Credits: 7' }));
    expect(onOpenCredits).toHaveBeenCalledTimes(1);
  });

  it('GUARDRAIL DAS MOEDAS: o HUD não escreve "Bits" nem usa o ícone de Bits', () => {
    const { container } = renderWithCss(<HomeHud {...base} language="pt-BR" />);
    expect(container.textContent).not.toMatch(/\bBits?\b/i);
    const srcs = Array.from(container.querySelectorAll('img')).map(i => i.getAttribute('src') ?? '');
    expect(srcs.some(s => /icon-coin/.test(s))).toBe(false);
    // o ícone de gema aparece UMA vez, e só na cápsula de Créditos
    expect(srcs.filter(s => /icon-gem/.test(s))).toHaveLength(1);
  });

  it('o rótulo da moeda paga é o nome real, nos dois idiomas', () => {
    const en = renderWithCss(<HomeHud {...base} language="en-US" />);
    expect(screen.getByText('Credits')).toBeTruthy();
    expect(screen.queryByText(/SOUL CRYSTAL/i)).toBeNull();
    en.unmount();
    renderWithCss(<HomeHud {...base} language="pt-BR" />);
    expect(screen.getByText('Créditos')).toBeTruthy();
  });

  it('energia 0/0 (estágio sem requisito) não quebra nem acende bloco', () => {
    const { container } = renderWithCss(<HomeHud energyPoints={0} maxEnergyPoints={0} credits={0} />);
    expect(container.querySelectorAll('.sm-px-bar-seg-on')).toHaveLength(0);
    expect(screen.getByRole('progressbar')).toBeTruthy();
  });

  it('créditos negativos (estado corrompido) não travam a render', () => {
    renderWithCss(<HomeHud {...base} credits={-3} language="en-US" />);
    expect(screen.getByRole('button', { name: 'Credits: -3' })).toBeTruthy();
  });
});
