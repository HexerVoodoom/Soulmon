// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { OficinaPrioridades, type PrioTask } from './OficinaPrioridades';

afterEach(cleanup);
const q = (s: string) => document.querySelector(s) as HTMLElement | null;
const qa = (s: string) => [...document.querySelectorAll(s)] as HTMLElement[];

const TASKS: PrioTask[] = [
  { id: 'sem', name: 'Sem nota', completed: false },
  { id: 'baixa', name: 'Baixa', completed: false, ice: { recompensa: 1, urgencia: 1, esforco: 5, tempo: 5 } },
  { id: 'alta', name: 'Alta', completed: false, ice: { recompensa: 5, urgencia: 5, esforco: 1, tempo: 1 } },
  { id: 'feita', name: 'Feita', completed: true },
  { id: 'habit:h', name: 'Hábito', completed: false, kind: 'habit' },
];

describe('Prioridades (ICE) — a lista', () => {
  it('lista TODAS as tarefas abertas: maior pontuação no topo, não classificadas no fim com o chip «Classificar»; sem hábito nem concluída', () => {
    render(<OficinaPrioridades language="pt-BR" tasks={TASKS} />);
    expect(qa('[data-oficina-prio-row]').map(r => r.getAttribute('data-oficina-prio-row'))).toEqual(['alta', 'baixa', 'sem']);
    expect(q('[data-oficina-prio-row="alta"] [data-oficina-prio-score]')!.textContent).toBe('25');
    expect(q('[data-oficina-prio-row="baixa"] [data-oficina-prio-score]')!.textContent).toBe('0,04');
    expect(q('[data-oficina-prio-row="sem"] [data-oficina-prio-classify]')!.textContent).toBe('Classificar');
    expect(qa('[data-oficina-prio-row="alta"] [data-oficina-prio-chip]')).toHaveLength(4);
    expect(document.body.textContent).not.toContain('Delegar');
  });
  it('o ✓ conclui pela origem (handler injetado)', () => {
    const onComplete = vi.fn();
    render(<OficinaPrioridades language="pt-BR" tasks={TASKS} onComplete={onComplete} />);
    fireEvent.click(q('[data-oficina-prio-done="alta"]')!);
    expect(onComplete).toHaveBeenCalledWith('alta');
  });
});

describe('Prioridades (ICE) — a folha de classificação', () => {
  it('tocar na linha abre a folha com 4 seletores 1–5, legendas e a pontuação ao vivo; salvar grava', () => {
    const onSetIce = vi.fn();
    render(<OficinaPrioridades language="pt-BR" tasks={TASKS} onSetIce={onSetIce} />);
    fireEvent.click(q('[data-oficina-prio-open="sem"]')!);
    expect(q('[data-ice-sheet]')).not.toBeNull();
    expect(qa('[data-ice-field]')).toHaveLength(4);
    expect(qa('[data-ice-pick]')).toHaveLength(20);
    expect(q('[data-ice-sheet]')!.textContent).toContain('1 = rápido');
    expect(q('[data-ice-sheet]')!.textContent).toContain('5 = demorado');
    expect(q('[data-ice-sheet]')!.textContent).toContain('1 = sem pressa');
    expect(q('[data-ice-score] strong')!.textContent).toBe('1'); // 3×3 ÷ 3×3
    fireEvent.click(q('[data-ice-pick="recompensa-5"]')!);
    fireEvent.click(q('[data-ice-pick="urgencia-5"]')!);
    fireEvent.click(q('[data-ice-pick="esforco-1"]')!);
    fireEvent.click(q('[data-ice-pick="tempo-1"]')!);
    expect(q('[data-ice-score] strong')!.textContent).toBe('25');
    fireEvent.click(q('[data-ice-save]')!);
    expect(onSetIce).toHaveBeenCalledWith('sem', { recompensa: 5, urgencia: 5, esforco: 1, tempo: 1 });
    expect(q('[data-ice-sheet]')).toBeNull();
  });
  it('tarefa já classificada abre com as notas dela e permite tirar a classificação', () => {
    const onSetIce = vi.fn();
    render(<OficinaPrioridades language="en-US" tasks={TASKS} onSetIce={onSetIce} />);
    fireEvent.click(q('[data-oficina-prio-open="baixa"]')!);
    expect(q('[data-ice-pick="tempo-5"]')!.getAttribute('aria-checked')).toBe('true');
    expect(q('[data-ice-score] strong')!.textContent).toBe('0.04');
    fireEvent.click(q('[data-ice-clear]')!);
    expect(onSetIce).toHaveBeenCalledWith('baixa', null);
  });
});
