// @vitest-environment jsdom
/**
 * Beta-2, frente A — 2.1 a 2.4: a lista de HOJE (`Tasks`/`Habits`), a tela
 * cheia `View all` (`Tasks`/`Habits`/`Scheduled`), o pai que nunca conclui
 * direto, o recolher ao concluir tudo e o cabeçalho Today/Goal.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { useState } from 'react';
import { screen, fireEvent, within, cleanup, act } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { DailyRituals } from './DailyRituals';
import { closeTopBackLayer } from '../utils/backStack';
import type { Activity, Task } from '../contexts/GameStateContext';

/** Movimento reduzido ligado: o deslize some e a tela desmonta na hora. */
function reduzirMovimento(reduz: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (q: string) => ({ matches: reduz && q.includes('prefers-reduced-motion'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
  });
}
beforeEach(() => reduzirMovimento(true));
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
    // Hábito = todo dia: só o diário fica em Habits; a agendada que cai hoje é uma Task.
    const cabHabits = container.querySelector('[data-ritual-section="habits"]') as HTMLElement;
    const linhaAgendada = Array.from(container.querySelectorAll('li.sm2-ritual')).find(li => li.textContent?.includes('Aula de terça')) as HTMLElement;
    const linhaDiaria = Array.from(container.querySelectorAll('li.sm2-ritual')).find(li => li.textContent?.includes('Beber água')) as HTMLElement;
    expect(cabHabits.compareDocumentPosition(linhaDiaria) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(cabHabits.compareDocumentPosition(linhaAgendada) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
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
  it('o gatilho `View all` é discreto: texto pequeno e de baixa ênfase (CSS)', async () => {
    const { readFileSync } = await import('node:fs');
    const css = readFileSync('src/index.css', 'utf8');
    const bloco = css.slice(css.indexOf('.sm3-ver-tudo button {'), css.indexOf('.sm3-ver-tudo button:focus-visible'));
    expect(bloco).toContain('var(--sm2-text-xs)');
    expect(bloco).toContain('font-weight: 400');
    expect(bloco).toContain('color: var(--sm2-muted)');
  });
  it('o botão abre a tela SÓ com tasks programadas: nome + dias; hábito e pontual de hoje ficam fora', () => {
    mount();
    abrirTudo();
    const tela = document.querySelector('[data-all-activities]') as HTMLElement;
    expect(tela).not.toBeNull();
    const sec = within(tela.querySelector('[data-all-section="scheduled"]') as HTMLElement);
    expect(sec.getByText('Reunião de segunda')).toBeTruthy();   // segunda continua em View all
    expect(sec.getByText('Mon')).toBeTruthy();                  // com os dias em que aparece
    expect(sec.getByText('Aula de terça')).toBeTruthy();
    expect(sec.getByText('Trocar filtro')).toBeTruthy();
    expect(sec.getByText('Every 30 days')).toBeTruthy();
    expect(sec.getByText('Declarar imposto')).toBeTruthy();     // pontual com início futuro
    expect(within(tela).queryByText('Beber água')).toBeNull();  // hábito (todo dia) não aparece
    expect(within(tela).queryByText('Pagar conta')).toBeNull(); // pontual de hoje mora no Today
    expect(tela.querySelector('[data-all-section="habits"], [data-all-section="tasks"]')).toBeNull();
  });
  it('NÃO dá para marcar: sem checkbox; tocar na linha abre a edição', () => {
    const onEditActivity = vi.fn();
    const onToggleActivity = vi.fn();
    mount({ onEditActivity, onToggleActivity });
    abrirTudo();
    const tela = document.querySelector('[data-all-activities]') as HTMLElement;
    expect(tela.querySelectorAll('[role="checkbox"]').length).toBe(0);
    fireEvent.click(within(tela).getByText('Aula de terça'));
    expect(onEditActivity).toHaveBeenCalledWith('s2');
    expect(onToggleActivity).not.toHaveBeenCalled();
  });
  it('terça e quinta numa SEGUNDA: fora do Today, dentro do View all, editável', () => {
    const SEGUNDA = new Date(2026, 9, 12, 10, 0, 0);
    const tt = { ...base, id: 'tt', name: 'Natação', weekDays: [2, 4], schedule: { kind: 'weekdays', days: [2, 4] } } as unknown as Activity;
    const onEditActivity = vi.fn();
    const { container } = mount({ now: SEGUNDA, activities: [tt], tasks: [], onEditActivity });
    expect(container.textContent).not.toContain('Natação');
    abrirTudo();
    const tela = document.querySelector('[data-all-activities]') as HTMLElement;
    expect(within(tela).getByText('Natação')).toBeTruthy();
    expect(within(tela).getByText('Tue · Thu')).toBeTruthy();
    fireEvent.click(within(tela).getByText('Natação'));
    expect(onEditActivity).toHaveBeenCalledWith('tt');
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

describe('2.3 View all: swipe e movimento reduzido', () => {
  it('com movimento normal a tela desliza: monta com animação e sai deslizando antes de desmontar', () => {
    vi.useFakeTimers();
    try {
      reduzirMovimento(false);
      mount();
      abrirTudo();
      const tela = document.querySelector('[data-all-activities]') as HTMLElement;
      expect(tela.hasAttribute('data-closing')).toBe(false);
      fireEvent.click(within(tela).getByRole('button', { name: 'View today' }));
      expect((document.querySelector('[data-all-activities]') as HTMLElement).hasAttribute('data-closing')).toBe(true); // deslizando de volta
      act(() => { vi.advanceTimersByTime(300); });
      expect(document.querySelector('[data-all-activities]')).toBeNull();
    } finally { vi.useRealTimers(); }
  });
  it('o CSS declara o deslize lateral e o desliga em prefers-reduced-motion', async () => {
    const { readFileSync } = await import('node:fs');
    const css = readFileSync('src/index.css', 'utf8');
    expect(css).toContain('@keyframes sm3-tudo-in { from { transform: translateX(100%); }');
    const canonico = css.slice(css.lastIndexOf('@media (prefers-reduced-motion'));
    expect(canonico).toMatch(/\.sm3-tudo, \.sm3-tudo\[data-closing\] \{ animation: none !important; \}/);
  });
  it('movimento reduzido: fecha e desmonta na hora, sem esperar animação', () => {
    mount();
    abrirTudo();
    fireEvent.click(screen.getByRole('button', { name: 'View today' }));
    expect(document.querySelector('[data-all-activities]')).toBeNull();
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
  it('`Today` ganha o acabamento cromado e a meta vira o indicador ÚNICO `Mission N/G`', () => {
    // §57: antes a contagem (`N/total`) e o bloco `Goal G` eram dois indicadores; agora é um só.
    const feita = { ...diario, completedToday: true, lastCompletedDate: TERCA.toDateString() } as unknown as Activity;
    const { container } = mount({ activities: [feita] });
    const titulo = container.querySelector('[data-today-title]') as HTMLElement;
    expect(titulo.textContent).toBe('Today');
    expect(titulo.className).toContain('sm3-cromo');
    const contagem = container.querySelector('[data-today-count]') as HTMLElement;
    expect(container.querySelectorAll('[data-today-count]').length).toBe(1);
    expect(container.querySelector('.sm3-meta')).toBeNull();
    expect(contagem.getAttribute('data-today-goal')).toBe('4');
    expect(contagem.textContent).toMatch(/^Mission \d+\/4$/);
    expect(contagem.getAttribute('aria-label')).toMatch(/^Mission \d+ of 4$/);
    expect(contagem.className).toContain('sm3-missao');
  });
  it('sem meta definida volta à contagem simples; PT-BR diz `Missão N de G`', () => {
    const feita = { ...diario, completedToday: true, lastCompletedDate: TERCA.toDateString() } as unknown as Activity;
    const { container, unmount } = mount({ goal: 0, activities: [feita] });
    const c0 = container.querySelector('[data-today-count]') as HTMLElement;
    expect(c0.getAttribute('data-today-goal')).toBeNull();
    expect(c0.textContent).toMatch(/^\d+\/\d+$/);
    unmount();
    const r = mount({ language: 'pt-BR', goal: 3, activities: [feita] });
    const c = r.container.querySelector('[data-today-count]') as HTMLElement;
    expect(c.getAttribute('aria-label')).toMatch(/^Missão \d+ de 3$/);
    expect(c.textContent).toMatch(/^Missão \d+\/3$/);
  });
  it('o contador PODE passar da meta: feitos 2 com meta 1 mostra `2/1` (G não limita N)', () => {
    const f1 = { ...diario, completedToday: true, lastCompletedDate: TERCA.toDateString() } as unknown as Activity;
    const f2 = { ...diario, id: 'd2', name: 'Alongar', completedToday: true, lastCompletedDate: TERCA.toDateString() } as unknown as Activity;
    const { container } = mount({ goal: 1, activities: [f1, f2] });
    const c = container.querySelector('[data-today-count]') as HTMLElement;
    expect(c.textContent).toBe('Mission 2/1');
    expect(c.getAttribute('aria-label')).toBe('Mission 2 of 1');
  });
  it('mostrar a meta não muda o registro: total/feitos vêm só da lista', () => {
    const feita = { ...diario, completedToday: true, lastCompletedDate: TERCA.toDateString() } as unknown as Activity;
    const a = mount({ goal: 1, activities: [feita] });
    const feitosDe = (r: { container: HTMLElement }) => r.container.querySelector('[data-today-count]')?.getAttribute('aria-label')?.match(/\d+/)?.[0] ?? null;
    const t1 = feitosDe(a);
    a.unmount();
    const b = mount({ goal: 99, activities: [feita] });
    expect(t1).not.toBeNull();
    // §57: só o G exibido muda; o N (feitos) vem da lista e é o mesmo.
    expect(feitosDe(b)).toBe(t1);
  });
  it('com 0 feitos e meta definida mostra `Mission 0/4` (o dono ve quanto falta)', () => {
    const { container } = mount({ goal: 4, activities: [diario] });
    const c = container.querySelector('[data-today-count]') as HTMLElement;
    expect(c.textContent).toBe('Mission 0/4');
  });
});
