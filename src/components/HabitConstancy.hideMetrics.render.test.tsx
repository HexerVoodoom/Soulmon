// @vitest-environment jsdom
/**
 * WP2.8 — `hideMetrics` cobre a CONSTÂNCIA.
 *
 * A opção já existia para a Janela de Descanso, com a regra escrita de que
 * esconder número PRESERVA as recompensas. Ela não alcançava esta linha — e
 * "N das últimas 7", que aparece embaixo de CADA hábito da lista diária, é o
 * número mais frequente do app inteiro. Quem pediu para não medir continuava
 * medindo o dia todo.
 *
 * As duas metades: o número some; a recompensa fica.
 */
import { describe, it, expect } from 'vitest';
import { renderWithCss } from '../test/renderEnv';
import { HabitConstancy } from './HabitConstancy';
import { emptyRhythm, completeHabit, dayKeyOf } from '../utils/habitRhythm';
import type { Schedule } from '../types/taskModel';

const schedule: Schedule = { kind: 'weekdays', days: [0, 1, 2, 3, 4, 5, 6] };
const now = new Date('2026-09-06T12:00:00');

/** Um hábito com história: dias feitos e escudo conquistado. */
function comHistoria() {
  let r = emptyRhythm();
  for (let i = 12; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 86400000);
    r = completeHabit(r, dayKeyOf(d));
  }
  return r;
}

describe('HabitConstancy — hideMetrics esconde o NÚMERO', () => {
  it('sem hideMetrics, o "N das últimas 7" aparece', () => {
    const { container } = renderWithCss(
      <HabitConstancy rhythm={comHistoria()} schedule={schedule} now={now} language="pt-BR" />,
    );
    expect(container.textContent).toMatch(/das últimas/);
  });

  it('com hideMetrics, nenhum dígito sobra no texto', () => {
    const { container } = renderWithCss(
      <HabitConstancy rhythm={comHistoria()} schedule={schedule} now={now} language="pt-BR" hideMetrics />,
    );
    expect(container.textContent).not.toMatch(/das últimas/);
    expect(container.textContent ?? '', 'sobrou dígito na linha').not.toMatch(/\d/);
  });

  it('os tooltips de MEDIDA perdem a contagem — o de data continua sendo data', () => {
    // A distinção importa: `hideMetrics` esconde MEDIÇÃO, não calendário. O
    // pontinho de cada dia diz "seg., 31: feito", e o 31 ali é a data — tirar
    // isso deixaria a janela ilegível sem esconder métrica nenhuma.
    const { container } = renderWithCss(
      <HabitConstancy rhythm={comHistoria()} schedule={schedule} now={now} language="pt-BR" hideMetrics />,
    );
    const medidas = [...container.querySelectorAll('[title]')]
      .map(el => el.getAttribute('title') ?? '')
      .filter(t => /maturidade|escudo/i.test(t));
    expect(medidas.length, 'nenhum tooltip de medida foi encontrado').toBeGreaterThan(0);
    for (const t of medidas) expect(t, 'um tooltip de medida ainda conta').not.toMatch(/\d/);
  });
});

describe('HabitConstancy — hideMetrics PRESERVA a recompensa', () => {
  it('a maturidade continua sendo dita em palavra', () => {
    const { container } = renderWithCss(
      <HabitConstancy rhythm={comHistoria()} schedule={schedule} now={now} language="pt-BR" hideMetrics />,
    );
    // O tier é a recompensa dos marcos (7/21/66). Esconder número não pode
    // apagar o que a pessoa conquistou — é a regra da Janela de Descanso.
    expect(container.textContent).toMatch(/broto|semente|muda|árvore/i);
  });

  it('a janela de pontinhos continua desenhada', () => {
    const { container } = renderWithCss(
      <HabitConstancy rhythm={comHistoria()} schedule={schedule} now={now} language="pt-BR" hideMetrics />,
    );
    expect(container.querySelector('[role="img"][aria-label^="Janela de constância"]')).not.toBeNull();
  });
});
