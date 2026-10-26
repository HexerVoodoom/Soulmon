// @vitest-environment jsdom
/**
 * `View all`: tocar numa linha abre o MESMO modal completo da Home (EditModal /
 * TaskEditModal), por cima da tela; salvar atualiza a lista; fechar não trava;
 * o voltar do sistema fecha o modal e não a tela.
 */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { useState } from 'react';
import { screen, fireEvent, cleanup, act } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { DailyRituals } from './DailyRituals';
import { EditModal } from './EditModal';
import { TaskEditModal } from './TaskEditModal';
import { closeTopBackLayer } from '../utils/backStack';
import type { Activity, Task } from '../contexts/GameStateContext';

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (q: string) => ({ matches: q.includes('prefers-reduced-motion'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
  });
});
afterEach(cleanup);

const TERCA = new Date(2026, 9, 13, 10, 0, 0);
const noop = () => {};
const base = { category: 'Health', emoji: 'x', steps: [] as never[] };
const segunda = { ...base, id: 's1', name: 'Reunião de segunda', weekDays: [1], schedule: { kind: 'weekdays', days: [1] } } as unknown as Activity;
const futura = { id: 't2', name: 'Declarar imposto', category: 'Work', completed: false, effort: 1, startDate: '2026-10-20' } as unknown as Task;

/** Liga as duas folhas como o `App.tsx` liga (mesmo par de estados, mesmo onClose). */
function Harness() {
  const [acts, setActs] = useState<Activity[]>([segunda]);
  const [editA, setEditA] = useState<string | null>(null);
  const [editT, setEditT] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  return (
    <>
      <DailyRituals
        tasks={[futura]} activities={acts} completedTasks={[]} language="en-US" now={TERCA}
        expanded={expanded} onExpand={(k, o) => setExpanded(p => ({ ...p, [k]: o }))}
        onToggleTask={noop} onToggleTaskStep={noop} onEditTask={setEditT} onPostponeNudge={noop}
        onEditActivity={setEditA} onToggleActivity={noop} onUpdateStep={noop} onRestoreTask={noop}
        onCreate={noop} ctaLabel="Add" emptyMessage="empty" variant="home" goal={4}
      />
      {editA && (
        <EditModal
          isOpen onClose={() => setEditA(null)} language="en-US"
          onSave={(d) => setActs(p => p.map(a => (a.id === editA ? { ...a, ...d } as Activity : a)))}
          initialData={acts.find(a => a.id === editA)}
        />
      )}
      {editT && (
        <TaskEditModal isOpen onClose={() => setEditT(null)} language="en-US" onSave={noop} initialData={futura} />
      )}
    </>
  );
}

const abrirTudo = () => fireEvent.click(screen.getByRole('button', { name: /Edit|Editar/ }));
const tela = () => document.querySelector('[data-all-activities]') as HTMLElement | null;

describe('View all: edição completa', () => {
  it('tocar numa atividade abre o modal completo, por cima e interativo', () => {
    renderWithCss(<Harness />);
    abrirTudo();
    fireEvent.click(screen.getByRole('button', { name: 'Edit: Reunião de segunda' }));
    const modal = screen.getByRole('dialog', { name: 'Edit activity' });
    expect(modal).toBeTruthy();
    // o modal NÃO está inerte (a tela atrás é que fica) e tem nome + dias
    expect(modal.closest('[inert],[aria-hidden="true"]')).toBeNull();
    expect((screen.getByDisplayValue('Reunião de segunda') as HTMLInputElement).value).toBe('Reunião de segunda');
    // o véu mora no <body>, ao lado da tela (z 80): dentro do container `fixed` do App ele ficava ATRÁS dela
    expect(modal.closest('[data-modal-backdrop]')!.parentElement).toBe(document.body);
    // sem editor de texto inline: a linha segue sendo só leitura
    expect(tela()!.querySelector('input:not([data-all-search])')).toBeNull();
  });

  it('salvar atualiza a lista; o modal fecha e a tela segue utilizável', () => {
    renderWithCss(<Harness />);
    abrirTudo();
    fireEvent.click(screen.getByRole('button', { name: 'Edit: Reunião de segunda' }));
    fireEvent.change(screen.getByDisplayValue('Reunião de segunda'), { target: { value: 'Reunião nova' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.queryByRole('dialog', { name: 'Edit activity' })).toBeNull();
    expect(tela()).not.toBeNull();
    expect(tela()!.hasAttribute('inert')).toBe(false);
    expect(tela()!.textContent).toContain('Reunião nova');
    // ainda dá para abrir outra linha (não travou)
    fireEvent.click(screen.getByRole('button', { name: 'Edit: Declarar imposto' }));
    expect(screen.getByRole('dialog', { name: 'Edit task' })).toBeTruthy();
  });

  it('cancelar volta à lista sem travar', () => {
    renderWithCss(<Harness />);
    abrirTudo();
    fireEvent.click(screen.getByRole('button', { name: 'Edit: Reunião de segunda' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog', { name: 'Edit activity' })).toBeNull();
    expect(tela()!.hasAttribute('inert')).toBe(false);
    expect(tela()!.getAttribute('aria-hidden')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Edit: Reunião de segunda' }));
    expect(screen.getByRole('dialog', { name: 'Edit activity' })).toBeTruthy();
  });

  it('voltar do sistema fecha o modal primeiro, e só depois a tela', () => {
    renderWithCss(<Harness />);
    abrirTudo();
    fireEvent.click(screen.getByRole('button', { name: 'Edit: Reunião de segunda' }));
    act(() => { closeTopBackLayer(); });
    expect(screen.queryByRole('dialog', { name: 'Edit activity' })).toBeNull();
    expect(tela()).not.toBeNull();
    act(() => { closeTopBackLayer(); });
    expect(tela()).toBeNull();
  });

  it('Esc com o modal aberto fecha só o modal', () => {
    renderWithCss(<Harness />);
    abrirTudo();
    fireEvent.click(screen.getByRole('button', { name: 'Edit: Declarar imposto' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Edit task' })).toBeNull();
    expect(tela()).not.toBeNull();
  });
});
