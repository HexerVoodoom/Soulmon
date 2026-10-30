// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../GameTutorialFlow', () => ({
  GameTutorialFlow: (p: { onComplete: (i: unknown) => void }) => <button onClick={() => p.onComplete({ name: 'Beber água', category: 'health', emoji: 'a', kind: 'task' })}>criar</button>,
}));
import { EtapaTarefa } from './EtapaTarefa';

afterEach(cleanup);
const tasks = [{ id: 't1', name: 'Arrumar a mesa', completed: false }];

describe('EtapaTarefa', () => {
  it('"Ainda não" não avança nem conclui: o ancião espera sem castigo', () => {
    const onDone = vi.fn(); const onCompleteTask = vi.fn();
    render(<EtapaTarefa onDone={onDone} tasks={tasks} onCompleteTask={onCompleteTask} />);
    fireEvent.click(screen.getByText('Ainda não'));
    expect(screen.getByText(/faço companhia/)).toBeTruthy();
    expect(onDone).not.toHaveBeenCalled();
    expect(onCompleteTask).not.toHaveBeenCalled();
  });

  it('"Sim" conclui a tarefa pelo caminho normal e avança', () => {
    const onDone = vi.fn(); const onCompleteTask = vi.fn();
    render(<EtapaTarefa onDone={onDone} tasks={tasks} onCompleteTask={onCompleteTask} language="en-US" />);
    expect(screen.getByText('Did you really do it?')).toBeTruthy();
    fireEvent.click(screen.getByText('Yes, I did'));
    expect(onCompleteTask).toHaveBeenCalledWith('t1');
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('sem tarefa cadastrada, ajuda a criar uma e só então pergunta', () => {
    const onDone = vi.fn(); const onCreateTask = vi.fn();
    render(<EtapaTarefa onDone={onDone} tasks={[]} onCreateTask={onCreateTask} />);
    expect(screen.queryByText('Você fez de verdade?')).toBeNull();
    fireEvent.click(screen.getByText('criar'));
    expect(onCreateTask).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Você fez de verdade?')).toBeTruthy();
    expect(onDone).not.toHaveBeenCalled();
  });
});
