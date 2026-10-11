// @vitest-environment jsdom
/**
 * Hábito semanal com o check de HOJE explícito + chip da semana à parte;
 * tarefa com subitens que avançam a barra; comida premium com a estrelinha.
 */
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { DailyRituals } from './DailyRituals';
import { Mochila, mochilaTabs } from './home/Mochila';
import { premiumKey } from '../utils/premiumFood';
import { emptyRhythm } from '../utils/habitRhythm';
import type { Activity, Task } from '../contexts/GameStateContext';

const AGORA = new Date('2026-10-14T10:00:00'); // quarta

function habito(over: Partial<Activity> = {}): Activity {
  return {
    id: 'h1', name: 'Atividade física', category: 'Fitness', emoji: '💪', steps: [],
    weekDays: [0, 1, 2, 3, 4, 5, 6], schedule: { kind: 'timesPerWeek', target: 3 }, ...over,
  } as Activity;
}

function montar(over: Partial<Parameters<typeof DailyRituals>[0]> = {}) {
  const props = {
    tasks: [] as Task[], activities: [habito()], completedTasks: [],
    habitRhythms: { h1: { ...emptyRhythm(), done: ['2026-10-12'], totalDone: 1 } },
    language: 'pt-BR' as const, now: AGORA, expanded: {} as Record<string, boolean>,
    onExpand: vi.fn(), onToggleTask: vi.fn(), onToggleTaskStep: vi.fn(), onEditTask: vi.fn(),
    onPostponeNudge: vi.fn(), onEditActivity: vi.fn(), onToggleActivity: vi.fn(), onUpdateStep: vi.fn(),
    onRestoreTask: vi.fn(), onCreate: vi.fn(), ctaLabel: 'Novo', emptyMessage: 'Vazio',
    ...over,
  };
  return { ...renderWithCss(<DailyRituals {...props} />), props };
}

describe('hábito semanal: o check é de HOJE (A)', () => {
  it('3x/semana: chip "Semana: 1 de 3" separado, aviso e rótulo do check de hoje', () => {
    montar();
    expect(screen.getByText('Semana: 1 de 3')).toBeTruthy();
    expect(screen.getByText('O check vale só para hoje')).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: /Marcar como feito hoje: Atividade física/ })).toBeTruthy();
  });

  it('diário: "N de 7" e em inglês o mesmo contrato', () => {
    montar({
      language: 'en-US',
      activities: [habito({ name: 'Drink 2 L of water', schedule: { kind: 'weekdays', days: [0, 1, 2, 3, 4, 5, 6] } })],
    });
    expect(screen.getByText('This week: 1 of 7')).toBeTruthy();
    expect(screen.getByText('The check counts today only')).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: /Mark as done today: Drink 2 L of water/ })).toBeTruthy();
  });

  it('tocar o check marca só hoje (um onToggleActivity)', () => {
    const { props } = montar();
    fireEvent.click(screen.getByRole('checkbox', { name: /Marcar como feito hoje/ }));
    expect(props.onToggleActivity).toHaveBeenCalledWith('h1');
  });

  it('a cada N dias não inventa semana', () => {
    montar({ activities: [habito({ schedule: { kind: 'everyNDays', n: 30, from: 'schedule' } })] });
    expect(screen.queryByText(/Semana:/)).toBeNull();
  });
});

describe('tarefa com subitens (C)', () => {
  const tarefa: Task = {
    id: 't1', name: 'Pagar contas', category: 'Work', emoji: '🧾', completed: false, effort: 2,
    steps: [
      { id: 'a', label: 'Pagar água', completed: true },
      { id: 'b', label: 'Pagar luz', completed: false },
    ],
  } as Task;

  it('mostra "1/2 etapas" e, aberta, cada subitem marca pelo handler de subitem', () => {
    const { props } = montar({ tasks: [tarefa], activities: [], expanded: { t1: true } });
    expect(screen.getByText(/1\/2 etapas/)).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: /Pagar luz/ }));
    expect(props.onToggleTaskStep).toHaveBeenCalledWith('t1', 'b');
    expect(props.onToggleTask).not.toHaveBeenCalled();
  });
});

describe('comida premium na mochila (D)', () => {
  it('fica na aba de comida (não nos especiais) e desenha a estrelinha só nela', () => {
    const inv = { '🍎': 2, [premiumKey('🍎')]: 1, '💗': 1 };
    const tabs = mochilaTabs(inv);
    expect(tabs.comida.map(([k]) => k)).toContain(premiumKey('🍎'));
    expect(tabs.especiais.map(([k]) => k)).not.toContain(premiumKey('🍎'));

    renderWithCss(
      <Mochila open onClose={() => {}} foodInventory={inv} language="pt-BR" onUse={() => {}}
        petTargetRef={createRef<HTMLElement>() as { current: HTMLElement | null }} />,
    );
    const item = (k: string) => [...document.querySelectorAll('[data-item]')].find(e => e.getAttribute('data-item') === k)!;
    const premium = item(premiumKey('🍎'));
    expect(premium.textContent).toContain('Maçã premium');
    expect(premium.querySelector('[data-premium]')).toBeTruthy();
    expect(item('🍎').querySelector('[data-premium]')).toBeNull();
  });
});
