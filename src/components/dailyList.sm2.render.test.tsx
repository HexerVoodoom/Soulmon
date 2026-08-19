// @vitest-environment jsdom
/**
 * GUARDA DA ONDA 2 NA LISTA DIÁRIA — `TaskMeta`, `HabitConstancy`, `StepRow`.
 *
 * Estes três são a superfície mais repetida do app: eles renderizam uma vez por
 * item da lista, todo dia. Por isso o que esta onda estabeleceu neles precisa de
 * trava mecânica, não de screenshot:
 *
 *  1. **Nada de emoji fazendo papel de ícone de sistema.** Os tiers 🌱🌿🌳 eram
 *     estado calculado pelo app disfarçado de conteúdo do usuário. Se voltarem,
 *     o teste vê.
 *  2. **Piso de 12px, absoluto.** Havia `fontSize: 12.5` (fora da escala) e
 *     `0.75rem` espalhados; qualquer texto abaixo de 12px reprova.
 *  3. **Quatro estados da janela de constância distinguíveis por FORMA.**
 *     Daltonismo: quem não separa as matizes tem que continuar lendo a semana.
 *  4. **`window === 0` diz "hábito novo"**, nunca "0 das últimas 7" — a regressão
 *     que já aconteceu uma vez e contradizia o dono da regra (`ratio: 1` sem
 *     histórico, progresso dotado).
 *  5. **Ícone sem box** (regra do dono): o glifo não pode ganhar fundo/borda.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { TaskMeta } from './TaskMeta';
import { HabitConstancy } from './HabitConstancy';
import { dayKeyOf, type HabitRhythm } from '../utils/habitRhythm';
import type { Schedule } from '../types/taskModel';

const NOW = new Date(2026, 7, 19, 10, 0, 0);
const SCHEDULE: Schedule = { kind: 'weekdays', days: [0, 1, 2, 3, 4, 5, 6] };

function rhythm(over: Partial<HabitRhythm> = {}): HabitRhythm {
  return { done: [], missed: [], shielded: [], shields: 0, totalDone: 0, ...over } as HabitRhythm;
}

/** Todo texto renderizado tem que declarar ≥12px (ou herdar, = vazio aqui). */
function menorFonteDeclarada(root: HTMLElement): number {
  let min = Infinity;
  root.querySelectorAll<HTMLElement>('*').forEach(el => {
    const v = el.style.fontSize;
    const m = /^([\d.]+)px$/.exec(v);
    if (m) min = Math.min(min, parseFloat(m[1]));
  });
  return min;
}

describe('lista diária — fundação sm2', () => {
  it('a maturidade do hábito é ícone Material, não emoji', () => {
    const { container } = renderWithCss(
      <HabitConstancy rhythm={rhythm({ totalDone: 30 })} schedule={SCHEDULE} now={NOW} language="pt-BR" />,
    );
    expect(container.textContent).not.toMatch(/[🌱🌿🌳]/u);
    const glifo = container.querySelector('.sm2-icon');
    expect(glifo?.textContent).toBe('eco');
  });

  it('o ícone não ganha caixa — sem fundo, sem borda, sem padding (regra do dono)', () => {
    const { container } = renderWithCss(
      <HabitConstancy rhythm={rhythm({ totalDone: 3 })} schedule={SCHEDULE} now={NOW} language="en-US" />,
    );
    const icon = container.querySelector('.sm2-icon') as HTMLElement;
    const cs = window.getComputedStyle(icon);
    // "Sem caixa" = nada opaco atrás e nenhuma borda desenhada. jsdom devolve o
    // inicial (`rgba(0,0,0,0)` / `none` / `0px`) quando ninguém declara.
    expect(['', 'transparent', 'rgba(0, 0, 0, 0)']).toContain(cs.getPropertyValue('background-color').trim());
    expect(['', 'none']).toContain(cs.getPropertyValue('border-style').trim());
    expect(['', '0', '0px']).toContain(cs.getPropertyValue('padding').trim());
  });

  it('janela vazia diz "hábito novo" — nunca "0 das últimas 7"', () => {
    renderWithCss(
      <HabitConstancy rhythm={rhythm()} schedule={SCHEDULE} now={NOW} language="pt-BR" />,
    );
    expect(screen.getByText('hábito novo')).toBeTruthy();
    expect(screen.queryByText(/0 das últimas/)).toBeNull();
  });

  it('os quatro estados da janela têm FORMA própria, não só cor', () => {
    const dia = (delta: number) => {
      const d = new Date(NOW);
      d.setDate(d.getDate() - delta);
      return dayKeyOf(d);
    };
    const { container } = renderWithCss(
      <HabitConstancy
        rhythm={rhythm({ done: [dia(1)], shielded: [dia(2)], missed: [dia(3)], totalDone: 9 })}
        schedule={SCHEDULE}
        now={NOW}
        language="en-US"
      />,
    );
    const pontos = Array.from(container.querySelectorAll('[role="group"] span[aria-hidden="true"]')) as HTMLElement[];
    // Assinatura de forma: quadrado cheio · losango girado · anel redondo · traço.
    const assinatura = (el: HTMLElement) =>
      el.style.transform.includes('rotate') ? 'losango'
        : el.style.borderRadius === '50%' ? 'anel'
          : el.style.height === '3px' ? 'traço'
            : 'quadrado';
    const formas = new Set(pontos.map(assinatura));
    expect(formas).toEqual(new Set(['quadrado', 'losango', 'anel', 'traço']));
  });

  it('nenhum texto da faixa de metadados desce abaixo de 12px', () => {
    const { container } = renderWithCss(
      <TaskMeta
        task={{ id: 't1', name: 'X', effort: 2, postponedCount: 4, createdAt: NOW.toISOString() } as never}
        now={NOW}
        language="pt-BR"
      />,
    );
    const min = menorFonteDeclarada(container);
    expect(min === Infinity || min >= 12).toBe(true);
  });

  it('o contador de adiamentos continua sendo um botão com alvo de 44px', () => {
    renderWithCss(
      <TaskMeta
        task={{ id: 't1', name: 'X', effort: 1, postponedCount: 3, createdAt: NOW.toISOString() } as never}
        now={NOW}
        language="en-US"
        onPostponeNudge={() => {}}
      />,
    );
    const botao = screen.getByRole('button');
    expect(botao.className).toContain('sm-tap-44');
  });
});
