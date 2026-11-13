// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';

let move: ((i: { scored: boolean; score: number }) => void) | undefined;
vi.mock('../../Match3Game', () => ({ Match3Game: (p: { onMove: typeof move }) => { move = p.onMove; return <div data-fake-m3 />; } }));
vi.mock('../../GameTutorialFlow', () => ({
  GameTutorialFlow: (p: { onComplete: (i: unknown) => void }) => <button data-fake-tut onClick={() => p.onComplete({ name: 'x', category: 'health', emoji: 'a', kind: 'task' })}>tut</button>,
}));
import { EtapaPuzzle, PUZZLE_ERROS_PARA_AJUDA, PUZZLE_META_LINHAS, puzzleEstado } from './EtapaPuzzle';

afterEach(() => { cleanup(); move = undefined; });
const jogar = (scored: boolean) => act(() => { move!({ scored, score: scored ? 30 : 0 }); });

describe('EtapaPuzzle', () => {
  it('regra pura: acerto zera erros; meta e ajuda disparam nos limiares', () => {
    let s = { acertos: 0, erros: 0 };
    for (let i = 0; i < PUZZLE_ERROS_PARA_AJUDA; i++) { const n = puzzleEstado(s, false); s = n; expect(n.ajuda).toBe(i === PUZZLE_ERROS_PARA_AJUDA - 1); }
    expect(puzzleEstado(s, true).erros).toBe(0);
    expect(puzzleEstado({ acertos: PUZZLE_META_LINHAS - 1, erros: 0 }, true).meta).toBe(true);
  });

  it('só chama onDone ao bater a meta, uma vez', () => {
    const onDone = vi.fn();
    render(<EtapaPuzzle onDone={onDone} />);
    for (let i = 0; i < PUZZLE_META_LINHAS - 1; i++) jogar(true);
    expect(onDone).not.toHaveBeenCalled();
    jogar(true);
    expect(onDone).toHaveBeenCalledTimes(1);
    jogar(true);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('erros seguidos abrem o passo a passo; ele fecha e NÃO conclui a etapa', () => {
    const onDone = vi.fn(); const onCreateTask = vi.fn();
    const { container } = render(<EtapaPuzzle onDone={onDone} onCreateTask={onCreateTask} />);
    for (let i = 0; i < PUZZLE_ERROS_PARA_AJUDA; i++) jogar(false);
    expect(container.querySelector('[data-puzzle-ajuda]')).not.toBeNull();
    act(() => { screen.getByText('tut').click(); });
    expect(onCreateTask).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-puzzle-ajuda]')).toBeNull();
    expect(onDone).not.toHaveBeenCalled();
  });
});
