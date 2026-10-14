// @vitest-environment jsdom
/**
 * Polimento da Home (14/10/2026): sem círculos nos botões do canto, linha mínima no Today,
 * sugestão "Pagar contas" removida, Hábito = todo dia / Tarefa = pontual ou dias específicos.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { readFileSync, existsSync } from 'node:fs';
import { CornerLink } from './nav/CornerLink';
import { MissionsLink } from './nav/MissionsLink';
import { AvisosLink } from './nav/AvisosLink';
import { DailyRituals } from './DailyRituals';
import { CreateModal } from './CreateModal';
import type { Activity, Task } from '../contexts/GameStateContext';

afterEach(cleanup);

describe('círculos: só o ícone', () => {
  it('Mapa, casinha, "!"/"?" e Avisos não têm anel nem fundo; o alvo de toque é >= 44', () => {
    const { container } = render(<>
      <CornerLink icon="mapa" side="right" label="Map" onClick={() => {}} />
      <CornerLink icon="home" side="left" label="Home" onClick={() => {}} />
      <MissionsLink mark="available" label="Daily" markLabel="Quest" onClick={() => {}} />
      <AvisosLink count={2} row={2} label="Notices" countLabel="2" onClick={() => {}} />
    </>);
    expect(container.querySelector('[data-corner-ring]')).toBeNull();
    for (const b of Array.from(container.querySelectorAll('button'))) {
      expect(b.style.background).toBe('transparent');
      expect(parseInt(b.style.width, 10)).toBeGreaterThanOrEqual(44);
      expect(parseInt(b.style.height, 10)).toBeGreaterThanOrEqual(44);
      for (const el of Array.from(b.querySelectorAll<HTMLElement>('span'))) {
        if (el.hasAttribute('data-avisos-seal')) continue; // o ponto do selo não é círculo de fundo
        expect(el.style.border).toBe('');
        expect(el.style.backgroundColor).toBe('');
      }
    }
  });
});

describe('linha mínima no Today', () => {
  const noop = () => {};
  const tarefa = {
    id: 't', name: 'Mudança', category: 'home', emoji: 'x', completed: false, effort: 3,
    deadline: { date: '2099-01-01', time: '10:00' }, postponedCount: 5,
    createdAt: '2026-01-01T00:00:00.000Z',
    steps: [{ id: 'a', label: 'Caixas', completed: false }, { id: 'b', label: 'Frete', completed: true }],
  } as unknown as Task;
  const habito = {
    id: 'h', name: 'Beber água', category: 'health', emoji: 'x', steps: [], weekDays: [0, 1, 2, 3, 4, 5, 6],
    schedule: { kind: 'weekdays', days: [0, 1, 2, 3, 4, 5, 6] },
  } as unknown as Activity;

  it('só o nome e o checkbox (e os filhos): sem subtítulo, XP, prazo, badge, barra ou convite', () => {
    const { container } = render(
      <DailyRituals
        tasks={[tarefa]} activities={[habito]} completedTasks={[]} language="en-US" now={new Date(2026, 9, 14, 10)}
        expanded={{}} onExpand={noop} onToggleTask={noop} onToggleTaskStep={noop} onEditTask={noop} onPostponeNudge={noop}
        onEditActivity={noop} onToggleActivity={noop} onUpdateStep={noop} onRestoreTask={noop} onCreate={noop}
        ctaLabel="Add" emptyMessage="" variant="home"
      />,
    );
    const linhas = Array.from(container.querySelectorAll('li.sm2-ritual'));
    expect(linhas.length).toBe(2);
    for (const li of linhas) {
      expect(li.querySelector('.sm2-ritual-sub')).toBeNull();
      expect(li.querySelector('[role="progressbar"]')).toBeNull();
    }
    const txt = container.textContent ?? '';
    expect(txt).not.toMatch(/XP|haunted|postponed|steps|Every day|Due/);
    expect(txt).toContain('Caixas'); // filhos continuam
    expect(txt).toContain('Frete');
  });
});

describe('sugestão "Pagar contas" removida', () => {
  it('o arquivo dos presets não existe e o CreateModal não oferece atalho nenhum', () => {
    expect(existsSync('src/data/taskPresets.ts')).toBe(false);
    const fonte = readFileSync('src/components/CreateModal.tsx', 'utf8');
    expect(fonte).not.toMatch(/TASK_PRESETS|presetSteps|data-task-presets|Pagar contas|Pay bills/);
    render(<CreateModal isOpen initialKind="task" onClose={() => {}} onSaveTask={vi.fn()} onSaveActivity={vi.fn()} language="pt-BR" />);
    expect(document.querySelector('[data-task-presets]')).toBeNull();
    expect(document.body.textContent).not.toMatch(/Atalho|Pagar|contas/);
  });
});

describe('Hábito = todo dia · Tarefa = pontual ou em dias específicos', () => {
  const abrirForm = (re: RegExp) => fireEvent.click(screen.getByRole('button', { name: re }));

  it('hábito não pergunta dias: salva como atividade de todo dia', () => {
    const onSaveActivity = vi.fn();
    render(<CreateModal isOpen initialKind="habit" onClose={() => {}} onSaveTask={vi.fn()} onSaveActivity={onSaveActivity} language="pt-BR" />);
    abrirForm(/Mais opções/);
    expect(screen.getByRole('radio', { name: 'Hábito' })).toBeTruthy();
    expect(screen.queryByRole('radio', { name: 'Dias específicos' })).toBeNull();
    fireEvent.change(document.getElementById('sm-create-name')!, { target: { value: 'Meditar' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    const data = onSaveActivity.mock.calls[0][0];
    expect(data.schedule).toEqual({ kind: 'weekdays', days: [0, 1, 2, 3, 4, 5, 6] });
    expect(data.weekDays).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('tarefa pode ser "Uma vez" ou "Dias específicos"', () => {
    render(<CreateModal isOpen initialKind="task" onClose={() => {}} onSaveTask={vi.fn()} onSaveActivity={vi.fn()} language="pt-BR" />);
    abrirForm(/Mais opções/);
    expect(screen.getByRole('radio', { name: 'Uma vez' })).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: 'Dias específicos' }));
    expect(screen.getByRole('radio', { name: 'Dias específicos' }).getAttribute('aria-checked')).toBe('true');
  });

  it('EN: Habit / Task / Specific days', () => {
    render(<CreateModal isOpen initialKind="task" onClose={() => {}} onSaveTask={vi.fn()} onSaveActivity={vi.fn()} language="en-US" />);
    abrirForm(/More options/);
    expect(screen.getByRole('radio', { name: 'Habit' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Task' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Specific days' })).toBeTruthy();
  });
});
