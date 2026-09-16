// @vitest-environment jsdom
/**
 * WP2.12 — o selo do Foco do dia existe.
 *
 * `focusComplete` (`utils/taskTriage.ts`) tinha teste próprio e nenhum
 * chamador, e o `GuideModal`/`HelpModal` prometiam que "completar os 3 rende o
 * selo". Terceira promessa do guia sem implementação encontrada na rodada 4 —
 * junto com a intervenção dos 5 minutos e a escada do Vínculo.
 *
 * O selo é BINÁRIO de propósito: nunca "2 de 3". Um placar parcial de um
 * objetivo de três itens é a fatura que este produto não emite — e `MAX_DAILY_FOCUS`
 * é 3 justamente porque o número é a mecânica, não a pontuação.
 *
 * E é estado do DIA, não conquista: some sozinho na virada, sem toast de perda
 * e sem histórico. Por isso a fonte é um `useMemo` sobre o save e não um campo
 * novo — não há o que limpar nem o que expirar.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { HomeHud } from './HomeHud';

describe('HomeHud — selo do Foco do dia (WP2.12)', () => {
  it('sem os três focos, nenhum selo', () => {
    renderWithCss(<HomeHud language="pt-BR" />);
    expect(screen.queryByText('foco do dia')).toBeNull();
  });

  it('com o foco completo, o selo aparece ao lado da marca', () => {
    renderWithCss(<HomeHud language="pt-BR" focusSealed />);
    expect(screen.getByText('foco do dia')).toBeTruthy();
    expect(screen.getByText('Soulmon'), 'o selo não pode substituir a marca').toBeTruthy();
  });

  it('nunca imprime contagem parcial', () => {
    renderWithCss(<HomeHud language="pt-BR" focusSealed />);
    const marca = screen.getByText('Soulmon').parentElement!;
    expect(marca.textContent, 'o selo virou placar').not.toMatch(/\d\s*\/\s*\d/);
    expect(marca.textContent).not.toMatch(/\d/);
  });

  it('em inglês também', () => {
    renderWithCss(<HomeHud language="en-US" focusSealed />);
    expect(screen.getByText('focus done')).toBeTruthy();
  });

  it('o selo é um chip de etiqueta (24px, primary-soft), ao lado da marca', () => {
    // Canvas Home, HOME-07: chip de etiqueta 24 em `primary-soft`, `check_circle`
    // FILL 1 + Rubik 12/500. Não é ícone solto em box — é a etiqueta inteira.
    const { container } = renderWithCss(<HomeHud language="pt-BR" focusSealed />);
    const selo = container.querySelector('.sm2-hud-seal')!;
    expect(selo).toBeTruthy();
    expect(selo.querySelector('.sm2-icon')).toBeTruthy();
    expect(selo.textContent).toContain('foco do dia');
  });
});
