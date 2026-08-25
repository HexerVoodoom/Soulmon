// @vitest-environment jsdom
/**
 * O CHIP DE ADIAMENTO PRECISA ABRIR ALGUMA COISA.
 *
 * Motivo de existir: a mecânica inteira estava MORTA na UI. `needsPostponeNudge`
 * tinha teste, `shrink` tinha teste, o `GuideModal` prometia ao usuário em PT e
 * EN que "adiada 3 vezes, o pet oferece dividir, encolher ou deixar pra lá", e o
 * `TaskMeta` desenhava o contador sublinhado e clicável — mas NINGUÉM passava
 * `onPostponeNudge`, então o botão nascia `disabled`, com `onClick` indefinido e
 * `cursor: default`. O usuário tocava e não acontecia nada.
 *
 * Nada disso dava erro em lugar nenhum: as funções puras continuavam verdes. O
 * único jeito de travar é aqui — no componente que é o GATILHO — e no App, que é
 * quem passa o handler (`src/App.tsx`, `handlePostponeNudge`).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { TaskMeta } from './TaskMeta';
import { POSTPONE_NUDGE_AT } from '../types/taskModel';

const APP_TSX = path.join(process.cwd(), 'src', 'App.tsx');

const NOW = new Date('2026-08-19T12:00:00');

const task = (postponedCount: number) => ({
  id: 't1',
  name: 'Declaração do imposto',
  effort: 2 as const,
  status: 'open' as const,
  postponedCount,
  createdAt: NOW.toISOString(),
  lastTouchedAt: NOW.toISOString(),
});

describe('TaskMeta — o gatilho do adiamento', () => {
  // `globals` está desligado na config, então o auto-cleanup do testing-library
  // não roda: sem isto o segundo render acha DOIS botões e o teste mente.
  afterEach(cleanup);

  it('com handler, o contador é um botão VIVO e devolve o id da tarefa', () => {
    const onPostponeNudge = vi.fn();
    render(
      <TaskMeta
        task={task(POSTPONE_NUDGE_AT)}
        now={NOW}
        language="pt-BR"
        onPostponeNudge={onPostponeNudge}
      />,
    );
    const botao = screen.getByRole('button') as HTMLButtonElement;
    expect(botao.disabled).toBe(false);
    fireEvent.click(botao);
    expect(onPostponeNudge).toHaveBeenCalledWith('t1');
  });

  it('sem handler o contador continua VISÍVEL (é dado honesto), só inerte', () => {
    render(<TaskMeta task={task(POSTPONE_NUDGE_AT)} now={NOW} language="en-US" />);
    const botao = screen.getByRole('button') as HTMLButtonElement;
    expect(botao.disabled).toBe(true);
    expect(botao.textContent).toContain('postponed');
  });

  it('o App PASSA o handler — sem isso o chip volta a ser decoração', () => {
    const src = readFileSync(APP_TSX, 'utf-8');
    expect(src).toMatch(/<TaskMeta[\s\S]{0,300}?onPostponeNudge=\{handlePostponeNudge\}/);
    // E as três ações prometidas no guia existem de verdade do outro lado.
    expect(src).toContain('onShrink={handleShrinkTask}');
    expect(src).toContain('onDrop={handleDropTask}');
    expect(src).toContain('onDecompose={handleDecomposeTask}');
  });
});
