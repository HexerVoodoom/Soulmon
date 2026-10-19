// @vitest-environment jsdom
/**
 * REGISTRO §66 — o modal de reafirmar o dia: caixas DESMARCADAS com o que já está cadastrado; só o marcado vai adiante.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, fireEvent, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { DayGoalsModal } from './DayGoalsModal';

afterEach(cleanup);
const CANDS = [
  { id: 'h1', name: 'Beber água', kind: 'habit' as const },
  { id: 'h2', name: 'Alongar', kind: 'habit' as const },
  { id: 't1', name: 'Pagar conta', kind: 'task' as const },
];

describe('DayGoalsModal', () => {
  it('as caixas nascem DESMARCADAS (substitui "todas marcadas"), com rótulo e alvo de toque de 44px', () => {
    const { container } = renderWithCss(<DayGoalsModal candidates={CANDS} language="pt-BR" onConfirm={vi.fn()} onClose={vi.fn()} />);
    const caixas = screen.getAllByRole('checkbox') as HTMLInputElement[];
    expect(caixas).toHaveLength(3);
    expect(caixas.every(c => !c.checked)).toBe(true);
    // checkbox real, com nome acessível pelo rótulo
    expect(screen.getByRole('checkbox', { name: 'Beber água' })).toBeTruthy();
    const rotulo = caixas[0].closest('label') as HTMLElement;
    expect(rotulo.style.minHeight).toBe('44px');
    // modal centralizado, sem fechar pelo véu
    expect((container.querySelector('[role="dialog"]') as HTMLElement).getAttribute('data-placement')).toBe('center');
    expect(container.querySelector('[data-dismiss-on-backdrop]')!.getAttribute('data-dismiss-on-backdrop')).toBe('false');
  });

  it('agrupa em Hábitos e Tarefas e conta as marcadas', () => {
    renderWithCss(<DayGoalsModal candidates={CANDS} language="pt-BR" onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('region', { name: 'Hábitos' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Tarefas' })).toBeTruthy();
    expect(screen.getByText('0 marcadas')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Alongar' }));
    expect(screen.getByText('1 marcadas')).toBeTruthy();
  });

  it('confirmar devolve só os marcados (na ordem da lista); confirmar sem marcar devolve vazio', () => {
    const onConfirm = vi.fn();
    renderWithCss(<DayGoalsModal candidates={CANDS} language="pt-BR" onConfirm={onConfirm} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(onConfirm).toHaveBeenLastCalledWith([], []);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Pagar conta' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Beber água' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    // sem `fuse` (modo antigo) não há foco: o segundo argumento é sempre vazio
    expect(onConfirm).toHaveBeenLastCalledWith(['h1', 't1'], []);
  });

  it('fechar sem confirmar chama só onClose (sem cobrança) e Esc fecha', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    renderWithCss(<DayGoalsModal candidates={CANDS} language="pt-BR" onConfirm={onConfirm} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('EN: título, dica e botão', () => {
    renderWithCss(<DayGoalsModal candidates={CANDS} language="en-US" onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: "Today's goals" })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Habits' })).toBeTruthy();
    expect(screen.getByText('0 checked')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeTruthy();
  });

  it('marcados anteriores (reabrir antes de confirmar) voltam marcados', () => {
    renderWithCss(<DayGoalsModal candidates={CANDS} language="pt-BR" initiallyPicked={['h2']} onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect((screen.getByRole('checkbox', { name: 'Alongar' }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole('checkbox', { name: 'Beber água' }) as HTMLInputElement).checked).toBe(false);
  });
});

/**
 * "HOJE" (19/10/2026, dono — REGISTRO 111, D-64): metas + compromisso NUMA tela. Com `fuse`, as TAREFAS marcadas viram o foco do dia
 * (até 3, as pendências de ontem primeiro), a oferta reduzida de 5 minutos continua, e o `checkIn` deixa de ser modal à parte.
 */
describe('DayGoalsModal em modo "Hoje" (fuse)', () => {
  const TAREFAS = [
    ...CANDS,
    { id: 't2', name: 'Ligar pro banco', kind: 'task' as const },
    { id: 't3', name: 'Enviar relatório', kind: 'task' as const },
    { id: 't4', name: 'Comprar pão', kind: 'task' as const },
  ];
  const fuse = (over: Record<string, unknown> = {}) => ({
    plan: { carryOver: [{ id: 't3' }], suggestedFocus: [{ id: 't1' }], tinyOffer: ['h2'] },
    taskIds: new Set(['t1', 't2', 't3', 't4']),
    onTinyHabit: vi.fn(),
    ...over,
  });

  it('é UM modal "Hoje" (metas + foco), com "Hoje não, obrigado" sempre visível', () => {
    renderWithCss(<DayGoalsModal candidates={TAREFAS} language="pt-BR" fuse={fuse()} onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: 'Hoje' })).toBeTruthy();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Hoje não, obrigado' })).toBeTruthy();
    expect(document.body.textContent).toMatch(/viram seu foco \(até 3\)/);
  });

  it('confirmar devolve as metas marcadas E o foco: só TAREFAS, ontem primeiro, no máximo 3; hábito nunca entra no foco', () => {
    const onConfirm = vi.fn();
    renderWithCss(<DayGoalsModal candidates={TAREFAS} language="pt-BR" fuse={fuse()} onConfirm={onConfirm} onClose={vi.fn()} />);
    for (const nome of ['Beber água', 'Pagar conta', 'Ligar pro banco', 'Enviar relatório', 'Comprar pão']) fireEvent.click(screen.getByRole('checkbox', { name: nome }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    const [ids, foco] = onConfirm.mock.calls[0];
    expect(ids).toEqual(['h1', 't1', 't2', 't3', 't4']);
    expect(foco).toEqual(['t3', 't1', 't2']); // pendência de ontem, sugestão do motor, resto; corte em 3
  });

  it('só o que foi MARCADO entra no foco (tarefa de ontem desmarcada fica de fora, sem cobrança)', () => {
    const onConfirm = vi.fn();
    renderWithCss(<DayGoalsModal candidates={TAREFAS} language="pt-BR" fuse={fuse()} onConfirm={onConfirm} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Comprar pão' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(onConfirm).toHaveBeenLastCalledWith(['t4'], ['t4']);
  });

  it('a oferta reduzida (never miss twice) continua: aceitar chama o MESMO caminho de conclusão e vira "contou"; não há botão de recusar', () => {
    const f = fuse();
    renderWithCss(<DayGoalsModal candidates={TAREFAS} language="pt-BR" fuse={f} onConfirm={vi.fn()} onClose={vi.fn()} />);
    const oferta = document.querySelector('[data-day-goals-tiny-offer="h2"]') as HTMLElement;
    expect(oferta.textContent).toBe('Alongar: hoje, só 5 minutos?');
    fireEvent.click(oferta);
    expect(f.onTinyHabit).toHaveBeenCalledWith('h2');
    expect(document.querySelector('[data-day-goals-tiny-accepted]')!.textContent).toMatch(/Alongar · contou/);
    expect(document.querySelector('[data-day-goals-tiny-offer]')).toBeNull();
  });

  it('"Hoje não" fecha sem confirmar (só onClose) e o EN tem o mesmo conjunto', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    renderWithCss(<DayGoalsModal candidates={TAREFAS} language="en-US" fuse={fuse()} onConfirm={onConfirm} onClose={onClose} />);
    expect(screen.getByRole('dialog', { name: 'Today' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Not today, thanks' }));
    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
