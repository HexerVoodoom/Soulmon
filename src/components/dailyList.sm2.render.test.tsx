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
import { renderToStaticMarkup } from 'react-dom/server';
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

  it('os quatro estados da janela têm FORMA própria, não só cor (D-A1)', () => {
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
    const janela = container.querySelector('[role="img"][aria-label^="Constancy window"]') as HTMLElement;
    expect(janela.getAttribute('aria-label')).toBe('Constancy window: 2 of the last 3');
    const pontos = Array.from(janela.querySelectorAll('span[aria-hidden="true"]')) as HTMLElement[];
    expect(pontos).toHaveLength(7);
    // Assinatura de forma: ● cheio · ◆ losango de contorno · ○ anel · — traço.
    const assinatura = (el: HTMLElement) =>
      el.style.transform.includes('rotate') ? 'losango'
        : el.style.borderRadius === '50%' && el.style.backgroundColor === 'transparent' ? 'anel'
          : el.style.height === '2px' ? 'traço'
            : 'cheio';
    const formas = new Set(pontos.map(assinatura));
    expect(formas).toEqual(new Set(['cheio', 'losango', 'anel', 'traço']));
    // nenhum ponto com alfa
    expect(pontos.filter(p => p.style.opacity !== '')).toHaveLength(0);
  });

  it('na lista (`compact`) só existem a janela e o glifo — sem "N of the last 7" (achado 9)', () => {
    const { container } = renderWithCss(
      <HabitConstancy compact rhythm={rhythm({ totalDone: 30, shields: 2 })} schedule={SCHEDULE} now={NOW} language="en-US" />,
    );
    expect(container.textContent).not.toMatch(/of the last|shield/i);
    expect(container.querySelector('[role="img"][aria-label^="Constancy window"]')).toBeTruthy();
    expect(container.querySelector('[role="img"][aria-label^="Maturity"]')).toBeTruthy();
  });

  it('a aura de 28 dias é FILL 1 + halo `primary-soft`, sem sombra de texto', () => {
    const dia = (delta: number) => { const d = new Date(NOW); d.setDate(d.getDate() - delta); return dayKeyOf(d); };
    const done = Array.from({ length: 28 }, (_, i) => dia(i + 1));
    const { container } = renderWithCss(
      <HabitConstancy compact rhythm={rhythm({ done, totalDone: 30 })} schedule={SCHEDULE} now={NOW} language="en-US" />,
    );
    const glifo = container.querySelector('[role="img"][aria-label^="Maturity"]') as HTMLElement;
    expect(glifo.getAttribute('aria-label')).toMatch(/Steady rhythm/);
    expect(glifo.style.boxShadow).toBe('0 0 0 3px var(--sm2-primary-soft)');
    expect(glifo.style.textShadow).toBe('');
    expect(glifo.style.filter).toBe('');
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

  it('o contador de adiamentos é um botão com alvo 44 e desenho 24 sem borda, em `muted` (D-A4)', () => {
    renderWithCss(
      <TaskMeta
        task={{ id: 't1', name: 'X', effort: 1, postponedCount: 3, createdAt: NOW.toISOString() } as never}
        now={NOW}
        language="en-US"
        onPostponeNudge={() => {}}
      />,
    );
    const botao = screen.getByRole('button') as HTMLElement;
    expect(botao.style.minHeight).toBe('44px');
    const etiqueta = botao.querySelector('span') as HTMLElement;
    expect(etiqueta.style.minHeight).toBe('24px');
    expect(etiqueta.style.color).toBe('var(--sm2-muted)');
    expect(etiqueta.style.border).toBe('');
    // em POSTPONE_NUDGE_AT: sublinhado, nunca outra cor
    expect(etiqueta.style.textDecoration).toBe('underline');
    expect(botao.getAttribute('aria-label')).toMatch(/postponed 3 times — tap/);
  });
});

/**
 * WP2.9 — proibição #14 (nunca percentual cru de constância) era só por tese.
 * Este teste a trava: nenhum render de HabitConstancy, em nenhum estado, pode
 * conter um "N%".
 */
describe('HabitConstancy nunca imprime percentual (WP2.9)', () => {
  const dia = (n: number) => dayKeyOf(new Date(2026, 7, 19 - n));
  const states: Array<Partial<HabitRhythm>> = [
    {},
    { totalDone: 3 },
    { totalDone: 30 },
    { done: [dia(1)], shielded: [dia(2)], missed: [dia(3)], totalDone: 9 },
    { done: [dia(1), dia(2), dia(3), dia(4), dia(5)], totalDone: 70, shields: 2 },
  ];
  for (const lang of ['pt-BR', 'en-US'] as const) {
    for (const [i, over] of states.entries()) {
      it(`estado ${i} em ${lang}`, () => {
        const html = renderToStaticMarkup(
          <HabitConstancy rhythm={rhythm(over)} schedule={SCHEDULE} now={NOW} language={lang} />,
        );
        // Só o TEXTO visível conta — `width:74%` em style inline não é percentual
        // de constância exposto ao usuário.
        const visible = html.replace(/<[^>]+>/g, ' ');
        expect(visible).not.toMatch(/\d+\s*%/);
      });
    }
  }
});
