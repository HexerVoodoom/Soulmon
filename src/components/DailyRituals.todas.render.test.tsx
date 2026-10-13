// @vitest-environment jsdom
/**
 * Beta-2, frente A — 2.1 a 2.4: a lista de HOJE (`Tasks`/`Habits`), a tela
 * cheia `View all` (`Tasks`/`Habits`/`Scheduled`), o pai que nunca conclui
 * direto, o recolher ao concluir tudo e o cabeçalho Today/Goal.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { useState } from 'react';
import { screen, fireEvent, within, cleanup, act } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { DailyRituals } from './DailyRituals';
import { closeTopBackLayer } from '../utils/backStack';
import type { Activity, Task } from '../contexts/GameStateContext';

afterEach(cleanup);

const TERCA = new Date(2026, 9, 13, 10, 0, 0); // terça-feira
const noop = () => {};
const base = { category: 'health', emoji: 'x', steps: [] as never[] };
const diario = { ...base, id: 'd1', name: 'Beber água', weekDays: [0, 1, 2, 3, 4, 5, 6], schedule: { kind: 'weekdays', days: [0, 1, 2, 3, 4, 5, 6] } } as unknown as Activity;
const segunda = { ...base, id: 's1', name: 'Reunião de segunda', weekDays: [1], schedule: { kind: 'weekdays', days: [1] } } as unknown as Activity;
const terca = { ...base, id: 's2', name: 'Aula de terça', weekDays: [2], schedule: { kind: 'weekdays', days: [2] } } as unknown as Activity;
const mensal = { ...base, id: 's3', name: 'Trocar filtro', weekDays: [0, 1, 2, 3, 4, 5, 6], schedule: { kind: 'everyNDays', n: 30, from: 'schedule' } } as unknown as Activity;
const hoje = { id: 't1', name: 'Pagar conta', category: 'work', completed: false, effort: 1 } as unknown as Task;
const futura = { id: 't2', name: 'Declarar imposto', category: 'work', completed: false, effort: 1, startDate: '2026-10-20' } as unknown as Task;

function Harness(over: Partial<Parameters<typeof DailyRituals>[0]> = {}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  return (
    <DailyRituals
      tasks={[hoje, futura]} activities={[diario, segunda, terca, mensal]} completedTasks={[]}
      habitRhythms={{ s3: { done: ['2026-10-12'], lastCompletedDate: '2026-10-12', totalDone: 1 } } as never}
      language="en-US" now={TERCA} expanded={expanded}
      onExpand={(k, open) => setExpanded(p => ({ ...p, [k]: open }))}
      onToggleTask={noop} onToggleTaskStep={noop} onEditTask={noop} onPostponeNudge={noop} onEditActivity={noop}
      onToggleActivity={noop} onUpdateStep={noop} onRestoreTask={noop} onCreate={noop}
      ctaLabel="Add" emptyMessage="empty" variant="home" goal={4} {...over}
    />
  );
}
const mount = (over: Partial<Parameters<typeof DailyRituals>[0]> = {}) => renderWithCss(<Harness {...over} />);
const abrirTudo = () => fireEvent.click(screen.getByRole('button', { name: /View all|Ver tudo/ }));

describe('2.1 Home: só hoje, em Tasks e Habits', () => {
  it('mostra Tasks e Habits de hoje; não mostra o que não é de hoje nem a tela cheia', () => {
    const { container } = mount();
    const secoes = Array.from(container.querySelectorAll('[data-ritual-section]')).map(e => e.textContent);
    expect(secoes).toEqual(['Tasks', 'Habits']);
    const txt = container.textContent ?? '';
    expect(txt).toContain('Pagar conta');
    expect(txt).toContain('Beber água');
    expect(txt).toContain('Aula de terça');           // devida hoje
    expect(txt).not.toContain('Reunião de segunda');  // segunda NÃO aparece na terça
    expect(txt).not.toContain('Trocar filtro');       // a cada 30 dias, fora do dia
    expect(txt).not.toContain('Declarar imposto');    // início futuro
    expect(document.querySelector('[data-all-activities]')).toBeNull();
  });
  it('rótulos de seção em PT-BR', () => {
    const { container } = mount({ language: 'pt-BR' });
    const secoes = Array.from(container.querySelectorAll('[data-ritual-section]')).map(e => e.textContent);
    expect(secoes).toEqual(['Tarefas', 'Hábitos']);
  });
  it('sem mensagem/diálogo dentro da lista: nenhum role=alert/status/dialog nela', () => {
    const { container } = mount();
    expect(container.querySelector('[role="alert"], [role="status"], [role="dialog"]')).toBeNull();
  });
});

describe('2.3 View all', () => {
  it('o botão `View all` abre a tela com Tasks, Habits e Scheduled', () => {
    mount();
    abrirTudo();
    const tela = document.querySelector('[data-all-activities]') as HTMLElement;
    expect(tela).not.toBeNull();
    const sec = (k: string) => within(tela.querySelector(`[data-all-section="${k}"]`) as HTMLElement);
    expect(sec('tasks').getByText('Pagar conta')).toBeTruthy();
    expect(sec('tasks').getByText('Declarar imposto')).toBeTruthy();       // futura continua em View all
    expect(sec('habits').getByText('Beber água')).toBeTruthy();
    expect(sec('scheduled').getByText('Reunião de segunda')).toBeTruthy(); // segunda continua em View all
    expect(sec('scheduled').getByText('Aula de terça')).toBeTruthy();
    expect(sec('scheduled').getByText('Trocar filtro')).toBeTruthy();
    expect(sec('habits').queryByText('Reunião de segunda')).toBeNull();
  });
  it('a tela tem seta de voltar e `View today`; as duas voltam à Home', () => {
    mount();
    abrirTudo();
    const tela = document.querySelector('[data-all-activities]') as HTMLElement;
    expect(within(tela).getByRole('button', { name: 'Back' })).toBeTruthy();
    fireEvent.click(within(tela).getByRole('button', { name: 'View today' }));
    expect(document.querySelector('[data-all-activities]')).toBeNull();
    abrirTudo();
    fireEvent.click(within(document.querySelector('[data-all-activities]') as HTMLElement).getByRole('button', { name: 'Back' }));
    expect(document.querySelector('[data-all-activities]')).toBeNull();
  });
  it('o voltar do sistema (backStack) fecha a camada e só ela', () => {
    mount();
    abrirTudo();
    let consumiu = false;
    act(() => { consumiu = closeTopBackLayer(); });
    expect(consumiu).toBe(true);
    expect(document.querySelector('[data-all-activities]')).toBeNull();
    expect(closeTopBackLayer()).toBe(false);
  });
  it('o gesto horizontal leva à MESMA tela que o botão; o vertical não', () => {
    const { container } = mount();
    const zona = container.querySelector('[data-ritual-swipe]') as HTMLElement;
    expect(zona.style.touchAction).toBe('pan-y');
    fireEvent.pointerDown(zona, { clientX: 300, clientY: 200 });
    fireEvent.pointerUp(zona, { clientX: 290, clientY: 330 });  // vertical: rolagem
    expect(document.querySelector('[data-all-activities]')).toBeNull();
    fireEvent.pointerDown(zona, { clientX: 320, clientY: 200 });
    fireEvent.pointerUp(zona, { clientX: 120, clientY: 210 });  // horizontal para a esquerda
    expect(document.querySelector('[data-all-activities]')).not.toBeNull();
    // deslizar para a direita volta
    const tela = document.querySelector('[data-all-activities]') as HTMLElement;
    fireEvent.pointerDown(tela, { clientX: 100, clientY: 200 });
    fireEvent.pointerUp(tela, { clientX: 300, clientY: 205 });
    expect(document.querySelector('[data-all-activities]')).toBeNull();
  });
  it('o retorno preserva o estado: o que foi recolhido continua recolhido', () => {
    const tarefa = { id: 'p', name: 'Mudança', category: 'home', completed: false, effort: 2, steps: [{ id: 'a', label: 'Caixas', completed: false }, { id: 'b', label: 'Frete', completed: false }] } as unknown as Task;
    mount({ tasks: [tarefa], activities: [] });
    expect(screen.getByText('Caixas')).toBeTruthy();                         // aberta por padrão (pendente)
    fireEvent.click(screen.getByRole('button', { name: /Collapse steps of Mudança/ }));
    expect(screen.queryByText('Caixas')).toBeNull();
    abrirTudo();
    expect(screen.queryByText('Caixas')).toBeNull();                          // View all mostra a mesma escolha
    fireEvent.click(screen.getByRole('button', { name: 'View today' }));
    expect(screen.queryByText('Caixas')).toBeNull();                          // e a Home também
  });
  it('PT-BR: `Ver tudo`, `Ver hoje` e `Voltar`', () => {
    mount({ language: 'pt-BR' });
    abrirTudo();
    expect(screen.getByRole('button', { name: 'Ver hoje' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeTruthy();
  });
});

describe('2.2 Pai e filhos', () => {
  const pai = (over: Partial<Task> = {}) => ({
    id: 'p', name: 'Mudança', category: 'home', completed: false, effort: 2,
    steps: [{ id: 'a', label: 'Caixas', completed: true }, { id: 'b', label: 'Frete', completed: false }], ...over,
  }) as unknown as Task;

  it('os filhos aparecem abaixo do título e cada um é marcável pelo handler de etapa', () => {
    const onToggleTaskStep = vi.fn();
    const onToggleTask = vi.fn();
    mount({ tasks: [pai()], activities: [], onToggleTaskStep, onToggleTask });
    fireEvent.click(screen.getByRole('checkbox', { name: /Mark step as completed: Frete/ }));
    expect(onToggleTaskStep).toHaveBeenCalledWith('p', 'b');
    expect(onToggleTask).not.toHaveBeenCalled();
  });
  it('o pai NÃO conclui direto: o checkbox dele é parcial e inerte', () => {
    const onToggleTask = vi.fn();
    mount({ tasks: [pai()], activities: [], onToggleTask });
    const box = screen.getByRole('checkbox', { name: /Complete the steps: Mudança/ });
    expect(box.getAttribute('aria-checked')).toBe('mixed');
    fireEvent.click(box);
    expect(onToggleTask).not.toHaveBeenCalled();
  });
  it('com todos os filhos concluídos recolhe e mantém só o título; o chevron reabre', () => {
    const feita = pai({ steps: [{ id: 'a', label: 'Caixas', completed: true }, { id: 'b', label: 'Frete', completed: true }] });
    mount({ tasks: [feita], activities: [] });
    expect(screen.getByText('Mudança')).toBeTruthy();
    expect(screen.queryByText('Caixas')).toBeNull();
    expect(screen.queryByText('Frete')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Expand steps of Mudança/ }));
    expect(screen.getByText('Caixas')).toBeTruthy();
  });
  it('hábito com várias ocorrências (etapas): mesmo contrato, pelo handler do hábito', () => {
    const onUpdateStep = vi.fn();
    const onToggleActivity = vi.fn();
    const agua = { ...diario, steps: [{ id: 'x', label: 'Manhã', completed: false }, { id: 'y', label: 'Tarde', completed: false }] } as unknown as Activity;
    mount({ tasks: [], activities: [agua], onUpdateStep, onToggleActivity });
    fireEvent.click(screen.getByRole('checkbox', { name: /Mark step as completed: Tarde/ }));
    expect(onUpdateStep).toHaveBeenCalledWith('d1', 'y');
    fireEvent.click(screen.getByRole('checkbox', { name: /steps: Beber água/ }));
    expect(onToggleActivity).not.toHaveBeenCalled();
  });
});

describe('2.4 Today e Goal', () => {
  it('`Today` ganha o acabamento cromado e a meta aparece num bloco SEPARADO da contagem', () => {
    const feita = { ...diario, completedToday: true, lastCompletedDate: TERCA.toDateString() } as unknown as Activity;
    const { container } = mount({ activities: [feita] });
    const titulo = container.querySelector('[data-today-title]') as HTMLElement;
    expect(titulo.textContent).toBe('Today');
    expect(titulo.className).toContain('sm3-cromo');
    const contagem = container.querySelector('[data-today-count]') as HTMLElement;
    const meta = container.querySelector('[data-today-goal]') as HTMLElement;
    expect(contagem.textContent).toMatch(/^\d+\/\d+$/);
    expect(meta.getAttribute('aria-label')).toBe('Daily goal: 4');
    expect(meta.textContent).toBe('Goal4');
    expect(meta.contains(contagem)).toBe(false);
    expect(contagem.contains(meta)).toBe(false);
  });
  it('sem meta definida não desenha o bloco; PT-BR diz `Meta`', () => {
    const { container, unmount } = mount({ goal: 0 });
    expect(container.querySelector('[data-today-goal]')).toBeNull();
    unmount();
    const r = mount({ language: 'pt-BR', goal: 3 });
    expect(r.container.querySelector('[data-today-goal]')!.getAttribute('aria-label')).toBe('Meta do dia: 3');
  });
  it('mostrar a meta não muda o registro: total/feitos vêm só da lista', () => {
    const feita = { ...diario, completedToday: true, lastCompletedDate: TERCA.toDateString() } as unknown as Activity;
    const a = mount({ goal: 1, activities: [feita] });
    const t1 = a.container.querySelector('[data-today-count]')?.textContent ?? null;
    a.unmount();
    const b = mount({ goal: 99, activities: [feita] });
    expect(t1).not.toBeNull();
    expect(b.container.querySelector('[data-today-count]')?.textContent ?? null).toBe(t1);
  });
});
