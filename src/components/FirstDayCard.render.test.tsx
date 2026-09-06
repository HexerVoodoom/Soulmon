// @vitest-environment jsdom
/**
 * WP1.3 — o cartão do primeiro dia, montado de verdade.
 *
 * O que este teste protege não é o desenho: é o TOM. Um checklist no minuto
 * zero de um app é o lugar mais fácil do mundo para nascer uma cobrança, e
 * este produto se define por não cobrar.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { FirstDayCard } from './FirstDayCard';
import { emptyFirstDay, markGesture } from '../utils/firstDay';

const HOJE = '2026-09-06';

describe('FirstDayCard — os três gestos', () => {
  it('mostra os três e as dicas de como fazer', () => {
    const { container } = renderWithCss(
      <FirstDayCard progress={emptyFirstDay(HOJE)} language="pt-BR" />,
    );
    expect(screen.getByText('Faça carinho nele')).toBeTruthy();
    expect(screen.getByText('Dê uma comida')).toBeTruthy();
    expect(screen.getByText('Conclua uma atividade')).toBeTruthy();
    // A dica do carinho é a que mais importa: é o ÚNICO jeito de curar
    // coração, e ninguém descobre um gesto de arrastar sozinho.
    expect(container.textContent).toContain('Esfregue o dedo');
  });

  it('o que já foi feito para de mostrar a dica', () => {
    const p = markGesture(emptyFirstDay(HOJE), 'pet');
    const { container } = renderWithCss(<FirstDayCard progress={p} language="pt-BR" />);
    expect(container.textContent).not.toContain('Esfregue o dedo');
    expect(container.textContent).toContain('Dê uma comida');
  });

  it('em inglês, tudo em inglês', () => {
    const { container } = renderWithCss(
      <FirstDayCard progress={emptyFirstDay(HOJE)} language="en-US" />,
    );
    expect(container.textContent).toContain('Give them a rub');
    expect(container.textContent ?? '').not.toMatch(/[áàâãéêíóôõúçÁÂÃÉÊÍÓÔÕÚÇ]/);
  });
});

describe('FirstDayCard — não cobra, e diz que vai embora', () => {
  it('avisa que some sozinho — quem não fizer não fica devendo', () => {
    const { container } = renderWithCss(
      <FirstDayCard progress={emptyFirstDay(HOJE)} language="pt-BR" />,
    );
    expect(container.textContent).toContain('Some sozinho');
  });

  it('nenhuma palavra de cobrança, e nenhuma promessa de prêmio', () => {
    // Prêmio transformaria o convite em tarefa, e a primeira coisa que o app
    // pediria no minuto zero seria dever.
    const p = markGesture(emptyFirstDay(HOJE), 'feed');
    const { container } = renderWithCss(<FirstDayCard progress={p} language="pt-BR" />);
    const texto = (container.textContent ?? '').toLowerCase();
    for (const proibida of ['pendente', 'falta', 'deveria', 'complete tudo', 'recompensa', 'ganhe', 'prêmio', 'bits']) {
      expect(texto, `o cartão do D0 usou "${proibida}"`).not.toContain(proibida);
    }
  });

  it('nada de contagem "1 de 3" — o cartão não é um placar', () => {
    const p = markGesture(emptyFirstDay(HOJE), 'feed');
    const { container } = renderWithCss(<FirstDayCard progress={p} language="pt-BR" />);
    expect(container.textContent ?? '').not.toMatch(/\d\s*(de|of)\s*3/);
  });
});
